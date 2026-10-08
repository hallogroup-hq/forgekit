import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isPrivateOrReservedIpv4, isPrivateOrReservedIpv6, validateSafeUrlForFetch } from "./ssrf";

describe("SSRF Security Validation", () => {
  describe("isPrivateOrReservedIpv4", () => {
    it("should identify loopback IPs as private", () => {
      assert.equal(isPrivateOrReservedIpv4("127.0.0.1"), true);
      assert.equal(isPrivateOrReservedIpv4("127.0.1.10"), true);
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
  });

  describe("validateSafeUrlForFetch", () => {
    it("should reject non-HTTP protocols", async () => {
      const fileRes = await validateSafeUrlForFetch("file:///etc/passwd");
      assert.equal(fileRes.safe, false);

      const ftpRes = await validateSafeUrlForFetch("ftp://example.com/file");
      assert.equal(ftpRes.safe, false);
    });

    it("should reject localhost and internal hostnames", async () => {
      const lh = await validateSafeUrlForFetch("http://localhost:3000");
      assert.equal(lh.safe, false);

      const localHost = await validateSafeUrlForFetch("http://service.localhost");
      assert.equal(localHost.safe, false);
    });

    it("should reject direct private IP URLs", async () => {
      const loop = await validateSafeUrlForFetch("http://127.0.0.1:8080/admin");
      assert.equal(loop.safe, false);

      const meta = await validateSafeUrlForFetch("http://169.254.169.254/latest/meta-data/");
      assert.equal(meta.safe, false);
    });

    it("should allow safe public domain with http or https", async () => {
      // 1.1.1.1 direct public IP
      const directIp = await validateSafeUrlForFetch("https://1.1.1.1");
      assert.equal(directIp.safe, true);
    });
  });

  describe("safeFetchWithRedirects SSRF protection", () => {
    it("should reject initial private target before attempting network request", async () => {
      await assert.rejects(
        () => import("./ssrf").then((m) => m.safeFetchWithRedirects("http://127.0.0.1:8080/secret")),
        /SSRF blocked/
      );
    });

    it("should reject metadata target before attempting network request", async () => {
      await assert.rejects(
        () => import("./ssrf").then((m) => m.safeFetchWithRedirects("http://169.254.169.254/latest/meta-data")),
        /SSRF blocked/
      );
    });
  });
});
