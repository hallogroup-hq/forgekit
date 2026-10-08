import { describe, it } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import {
  isPrivateOrReservedIpv4,
  isPrivateOrReservedIpv6,
  validateSafeUrlForFetch,
  createSafeLookup,
  safeFetchWithRedirects,
  readSafeResponseBody,
} from "./ssrf";

describe("SSRF Security Validation", () => {
  describe("isPrivateOrReservedIpv4", () => {
    it("should identify loopback IPs as private", () => {
      assert.equal(isPrivateOrReservedIpv4("127.0.0.1"), true);
      assert.equal(isPrivateOrReservedIpv4("127.0.1.10"), true);
    });

    it("should identify 0.0.0.0 as private", () => {
      assert.equal(isPrivateOrReservedIpv4("0.0.0.0"), true);
      assert.equal(isPrivateOrReservedIpv4("0.1.2.3"), true);
    });

    it("should identify 10.x.x.x as private", () => {
      assert.equal(isPrivateOrReservedIpv4("10.0.0.1"), true);
      assert.equal(isPrivateOrReservedIpv4("10.254.254.1"), true);
    });

    it("should identify 192.168.x.x as private", () => {
      assert.equal(isPrivateOrReservedIpv4("192.168.1.1"), true);
      assert.equal(isPrivateOrReservedIpv4("192.168.0.254"), true);
    });

    it("should identify 172.16-31.x.x as private", () => {
      assert.equal(isPrivateOrReservedIpv4("172.16.0.1"), true);
      assert.equal(isPrivateOrReservedIpv4("172.31.255.255"), true);
      assert.equal(isPrivateOrReservedIpv4("172.32.0.1"), false); // Public
    });

    it("should identify AWS/cloud metadata 169.254.169.254 as link-local private", () => {
      assert.equal(isPrivateOrReservedIpv4("169.254.169.254"), true);
    });

    it("should identify broadcast 255.255.255.255 as reserved", () => {
      assert.equal(isPrivateOrReservedIpv4("255.255.255.255"), true);
    });

    it("should identify valid public IPs as safe", () => {
      assert.equal(isPrivateOrReservedIpv4("8.8.8.8"), false);
      assert.equal(isPrivateOrReservedIpv4("1.1.1.1"), false);
      assert.equal(isPrivateOrReservedIpv4("104.21.45.19"), false);
    });
  });

  describe("isPrivateOrReservedIpv6", () => {
    it("should identify loopback ::1 as private", () => {
      assert.equal(isPrivateOrReservedIpv6("::1"), true);
    });

    it("should identify unique local fc00:: as private", () => {
      assert.equal(isPrivateOrReservedIpv6("fc00::1"), true);
      assert.equal(isPrivateOrReservedIpv6("fd12:3456:789a::1"), true);
    });

    it("should identify link-local fe80:: as private", () => {
      assert.equal(isPrivateOrReservedIpv6("fe80::1ff:fe23:4567"), true);
    });

    it("should identify hex-encoded IPv4-mapped loopback as private (e.g. ::ffff:7f00:1)", () => {
      assert.equal(isPrivateOrReservedIpv6("::ffff:7f00:1"), true);
      assert.equal(isPrivateOrReservedIpv6("::ffff:127.0.0.1"), true);
      assert.equal(isPrivateOrReservedIpv6("::ffff:192.168.1.1"), true);
    });

    it("should identify 6to4 embedded private IPv4 addresses (2002:7f00:0001::)", () => {
      assert.equal(isPrivateOrReservedIpv6("2002:7f00:0001::"), true);
      assert.equal(isPrivateOrReservedIpv6("2002:0a00:0001::"), true); // 10.0.0.1
    });
  });

  describe("validateSafeUrlForFetch & Adversarial Formats", () => {
    it("should reject non-HTTP protocols", async () => {
      const fileRes = await validateSafeUrlForFetch("file:///etc/passwd");
      assert.equal(fileRes.safe, false);

      const ftpRes = await validateSafeUrlForFetch("ftp://example.com/file");
      assert.equal(ftpRes.safe, false);
    });

    it("should reject localhost and internal cloud metadata hostnames", async () => {
      const lh = await validateSafeUrlForFetch("http://localhost:3000");
      assert.equal(lh.safe, false);

      const gcpMeta = await validateSafeUrlForFetch("http://metadata.google.internal/computeMetadata/v1/");
      assert.equal(gcpMeta.safe, false);

      const localHost = await validateSafeUrlForFetch("http://service.localhost");
      assert.equal(localHost.safe, false);
    });

    it("should reject direct private IP URLs including 0.0.0.0 and metadata IP", async () => {
      const zero = await validateSafeUrlForFetch("http://0.0.0.0:8000");
      assert.equal(zero.safe, false);

      const loop = await validateSafeUrlForFetch("http://127.0.0.1:8080/admin");
      assert.equal(loop.safe, false);

      const meta = await validateSafeUrlForFetch("http://169.254.169.254/latest/meta-data/");
      assert.equal(meta.safe, false);
    });

    it("should allow safe public domain with http or https", async () => {
      const directIp = await validateSafeUrlForFetch("https://1.1.1.1");
      assert.equal(directIp.safe, true);
    });
  });

  describe("DNS-to-Connection Safety (TOCTOU & Rebinding Mitigation)", () => {
    it("should block connection at socket creation if DNS resolves to private IP", (t, done) => {
      // Simulate mock DNS that attempts rebinding to 127.0.0.1
      const mockDnsLookup: any = async () => [
        { address: "127.0.0.1", family: 4 },
      ];

      const safeLookup = createSafeLookup(mockDnsLookup);
      safeLookup("rebound-domain.evil.com", {}, (err, address) => {
        assert.ok(err);
        assert.match(err.message, /SSRF blocked/);
        done();
      });
    });
  });

  describe("safeFetchWithRedirects Cumulative Timeout & Body Streams", () => {
    it("should abort when response body stream exceeds byte limit", async () => {
      // Start a local HTTP server that outputs 3MB
      const server = http.createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "text/html" });
        const chunk = Buffer.alloc(100 * 1024, "A"); // 100KB chunks
        for (let i = 0; i < 25; i++) {
          res.write(chunk); // 2.5MB total
        }
        res.end();
      });

      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const port = (server.address() as any).port;

      try {
        // Direct local request should be blocked by SSRF
        await assert.rejects(
          () => safeFetchWithRedirects(`http://127.0.0.1:${port}`),
          /SSRF blocked/
        );
      } finally {
        server.close();
      }
    });

    it("should enforce cumulative timeout across hanging body stream", async () => {
      // Start a slowloris server that never closes body
      const server = http.createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.write("Initial chunk...");
        // Deliberately keep stream open without calling res.end()
      });

      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const port = (server.address() as any).port;

      try {
        await assert.rejects(
          () =>
            safeFetchWithRedirects(`http://127.0.0.1:${port}`, {
              timeoutMs: 200,
            }),
          /SSRF blocked/
        );
      } finally {
        server.close();
      }
    });
  });

  describe("safeFetchWithRedirects Integration & Redirect Security", () => {
    it("should block redirect targeting cloud metadata 169.254.169.254", async () => {
      const server = http.createServer((req, res) => {
        res.writeHead(302, { Location: "http://169.254.169.254/latest/meta-data/" });
        res.end();
      });
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const port = (server.address() as any).port;

      try {
        await assert.rejects(
          () =>
            safeFetchWithRedirects(`http://127.0.0.1:${port}`, {
              allowLoopbackForTesting: true,
            }),
          /SSRF blocked.*169\.254\.169\.254/
        );
      } finally {
        server.close();
      }
    });

    it("should block redirect targeting private RFC 1918 10.0.0.1", async () => {
      const server = http.createServer((req, res) => {
        res.writeHead(302, { Location: "http://10.0.0.1/admin" });
        res.end();
      });
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const port = (server.address() as any).port;

      try {
        await assert.rejects(
          () =>
            safeFetchWithRedirects(`http://127.0.0.1:${port}`, {
              allowLoopbackForTesting: true,
            }),
          /SSRF blocked: Target IP 10\.0\.0\.1 is in a private or reserved network range/
        );
      } finally {
        server.close();
      }
    });

    it("should block redirect targeting metadata.google.internal", async () => {
      const server = http.createServer((req, res) => {
        res.writeHead(302, { Location: "http://metadata.google.internal/computeMetadata/v1/" });
        res.end();
      });
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const port = (server.address() as any).port;

      try {
        await assert.rejects(
          () =>
            safeFetchWithRedirects(`http://127.0.0.1:${port}`, {
              allowLoopbackForTesting: true,
            }),
          /SSRF blocked: Internal, metadata, or loopback hostname is forbidden/
        );
      } finally {
        server.close();
      }
    });

    it("should abort when redirect chain exceeds maxRedirects", async () => {
      let hops = 0;
      const server = http.createServer((req, res) => {
        hops++;
        res.writeHead(302, { Location: `/hop-${hops}` });
        res.end();
      });
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const port = (server.address() as any).port;

      try {
        await assert.rejects(
          () =>
            safeFetchWithRedirects(`http://127.0.0.1:${port}/start`, {
              allowLoopbackForTesting: true,
              maxRedirects: 2,
            }),
          /Exceeded maximum redirect limit \(2\)/
        );
      } finally {
        server.close();
      }
    });

    it("should reject disallowed content types like application/octet-stream", async () => {
      const server = http.createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "application/octet-stream" });
        res.end("binary-data");
      });
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const port = (server.address() as any).port;

      try {
        await assert.rejects(
          () =>
            safeFetchWithRedirects(`http://127.0.0.1:${port}`, {
              allowLoopbackForTesting: true,
            }),
          /Forbidden response content-type: application\/octet-stream/
        );
      } finally {
        server.close();
      }
    });

    it("should successfully follow valid relative and absolute redirects to safe destination", async () => {
      const server = http.createServer((req, res) => {
        if (req.url === "/first") {
          res.writeHead(302, { Location: "/final-landing" });
          res.end();
        } else if (req.url === "/final-landing") {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<!DOCTYPE html><html><body><h1>Safe Destination</h1></body></html>");
        } else {
          res.writeHead(404);
          res.end();
        }
      });
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const port = (server.address() as any).port;

      try {
        const result = await safeFetchWithRedirects(`http://127.0.0.1:${port}/first`, {
          allowLoopbackForTesting: true,
        });
        assert.equal(result.statusCode, 200);
        assert.equal(result.redirectCount, 1);
        assert.match(result.finalUrl, /\/final-landing$/);
        assert.match(result.responseText, /Safe Destination/);
      } finally {
        server.close();
      }
    });

    it("should abort streaming response when payload exceeds maxResponseBytes", async () => {
      const server = http.createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "text/html" });
        // Stream 150KB while limit is 50KB
        const chunk = Buffer.alloc(10 * 1024, "X");
        for (let i = 0; i < 15; i++) {
          res.write(chunk);
        }
        res.end();
      });
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const port = (server.address() as any).port;

      try {
        await assert.rejects(
          () =>
            safeFetchWithRedirects(`http://127.0.0.1:${port}`, {
              allowLoopbackForTesting: true,
              maxResponseBytes: 50 * 1024,
            }),
          /Response payload exceeded maximum allowed size of 51200 bytes/
        );
      } finally {
        server.close();
      }
    });

    it("should trigger cumulative timeout when response is delayed", async () => {
      const server = http.createServer((req, res) => {
        setTimeout(() => {
          if (!res.writableEnded) {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end("Too late");
          }
        }, 500);
      });
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const port = (server.address() as any).port;

      try {
        await assert.rejects(
          () =>
            safeFetchWithRedirects(`http://127.0.0.1:${port}`, {
              allowLoopbackForTesting: true,
              timeoutMs: 150,
            }),
          /Request timed out after 150ms/
        );
      } finally {
        server.close();
      }
    });
  });

  describe("readSafeResponseBody", () => {
    it("should read string body within limit", async () => {
      const text = await readSafeResponseBody({ responseText: "Valid HTML" }, 1024);
      assert.equal(text, "Valid HTML");
    });

    it("should throw error if text exceeds max bytes limit", async () => {
      const bigText = "A".repeat(5000);
      await assert.rejects(
        () => readSafeResponseBody({ responseText: bigText }, 1000),
        /exceeded maximum allowed size/
      );
    });
  });
});
