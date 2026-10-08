import { describe, it } from "node:test";
import assert from "node:assert/strict";
import workerHandler, {
  parseIpv4ToNumber,
  isPrivateIpv4Num,
  isPrivateIpv6Str,
  isUnsafeHostOrIp,
  normalizeToHex6,
} from "../../../workers/design-inspector/src/index";
import {
  buildDesignSystemFromEvidence,
  ReferenceSiteInspectionEvidence,
} from "./inspect-reference";
import { generateColorLadder } from "../../generators/modules/design-md/engine";

describe("Cloudflare Browser Run Worker Contract & Security Verification", () => {
  describe("Fix 1 — Security: SSRF IP & Hostname Parsing", () => {
    it("should parse standard dotted-decimal IPv4 addresses correctly", () => {
      assert.equal(parseIpv4ToNumber("127.0.0.1"), 0x7f000001);
      assert.equal(parseIpv4ToNumber("10.0.0.1"), 0x0a000001);
      assert.equal(parseIpv4ToNumber("192.168.1.1"), 0xc0a80101);
      assert.equal(parseIpv4ToNumber("8.8.8.8"), 0x08080808);
      assert.equal(parseIpv4ToNumber("0.0.0.0"), 0);
      assert.equal(parseIpv4ToNumber("255.255.255.255"), 0xffffffff);
    });

    it("should parse hex and octal obfuscated IPv4 representations", () => {
      // Single integer representation of 127.0.0.1
      assert.equal(parseIpv4ToNumber("2130706433"), 0x7f000001);
      // Hex single integer representation
      assert.equal(parseIpv4ToNumber("0x7f000001"), 0x7f000001);
      // Dotted hex parts
      assert.equal(parseIpv4ToNumber("0x7f.0.0.1"), 0x7f000001);
      // Dotted octal parts
      assert.equal(parseIpv4ToNumber("0177.0.0.1"), 0x7f000001);
      assert.equal(parseIpv4ToNumber("012.0.0.1"), 0x0a000001);
    });

    it("should reject invalid or overflowed IP strings", () => {
      assert.equal(parseIpv4ToNumber("256.0.0.1"), null);
      assert.equal(parseIpv4ToNumber("1.2.3.4.5"), null);
      assert.equal(parseIpv4ToNumber("not-an-ip"), null);
      assert.equal(parseIpv4ToNumber(""), null);
    });

    it("should detect private, loopback, and cloud metadata IPv4 addresses", () => {
      // 127.0.0.0/8 Loopback
      assert.equal(isPrivateIpv4Num(0x7f000001), true); // 127.0.0.1
      assert.equal(isPrivateIpv4Num(0x7fffffff), true); // 127.255.255.255

      // 10.0.0.0/8 Private
      assert.equal(isPrivateIpv4Num(0x0a000001), true); // 10.0.0.1

      // 172.16.0.0/12 Private
      assert.equal(isPrivateIpv4Num(0xac100001), true); // 172.16.0.1
      assert.equal(isPrivateIpv4Num(0xac1fffff), true); // 172.31.255.255

      // 192.168.0.0/16 Private
      assert.equal(isPrivateIpv4Num(0xc0a80001), true); // 192.168.0.1

      // 169.254.0.0/16 Link-local / Cloud Metadata (169.254.169.254)
      assert.equal(isPrivateIpv4Num(0xa9fea9fe), true); // 169.254.169.254

      // 100.64.0.0/10 CGNAT
      assert.equal(isPrivateIpv4Num(0x64400001), true); // 100.64.0.1
      assert.equal(isPrivateIpv4Num(0x647fffff), true); // 100.127.255.255

      // Multicast and reserved
      assert.equal(isPrivateIpv4Num(0xe0000001), true); // 224.0.0.1
      assert.equal(isPrivateIpv4Num(0xf0000001), true); // 240.0.0.1

      // Public routable IPs
      assert.equal(isPrivateIpv4Num(parseIpv4ToNumber("8.8.8.8")!), false);
      assert.equal(isPrivateIpv4Num(parseIpv4ToNumber("1.1.1.1")!), false);
      assert.equal(isPrivateIpv4Num(parseIpv4ToNumber("142.250.190.46")!), false);
    });

    it("should detect private and IPv4-mapped IPv6 addresses", () => {
      // Loopback & unspecified
      assert.equal(isPrivateIpv6Str("::1"), true);
      assert.equal(isPrivateIpv6Str("::"), true);

      // Link-local
      assert.equal(isPrivateIpv6Str("fe80::1"), true);
      assert.equal(isPrivateIpv6Str("fea0::1"), true);

      // Unique local
      assert.equal(isPrivateIpv6Str("fc00::1"), true);
      assert.equal(isPrivateIpv6Str("fd12:3456::1"), true);

      // IPv4-mapped IPv6 pointing to private addresses
      assert.equal(isPrivateIpv6Str("::ffff:127.0.0.1"), true);
      assert.equal(isPrivateIpv6Str("::ffff:192.168.1.1"), true);
      assert.equal(isPrivateIpv6Str("::ffff:10.0.0.1"), true);
      assert.equal(isPrivateIpv6Str("::ffff:169.254.169.254"), true);

      // IPv4-mapped IPv6 pointing to public addresses
      assert.equal(isPrivateIpv6Str("::ffff:8.8.8.8"), false);

      // Public IPv6
      assert.equal(isPrivateIpv6Str("2606:4700:4700::1111"), false);
      assert.equal(isPrivateIpv6Str("2001:4860:4860::8888"), false);
    });

    it("should reject adversarial hostnames, cloud metadata, and private endpoints", () => {
      // Hostnames
      assert.equal(isUnsafeHostOrIp("localhost"), true);
      assert.equal(isUnsafeHostOrIp("sub.localhost"), true);
      assert.equal(isUnsafeHostOrIp("my-machine.local"), true);
      assert.equal(isUnsafeHostOrIp("service.internal"), true);
      assert.equal(isUnsafeHostOrIp("corp-network.corp"), true);
      assert.equal(isUnsafeHostOrIp("metadata.google.internal"), true);
      assert.equal(isUnsafeHostOrIp("instance-data"), true);

      // IP strings & obfuscations
      assert.equal(isUnsafeHostOrIp("127.0.0.1"), true);
      assert.equal(isUnsafeHostOrIp("0177.0.0.1"), true);
      assert.equal(isUnsafeHostOrIp("0x7f000001"), true);
      assert.equal(isUnsafeHostOrIp("2130706433"), true);
      assert.equal(isUnsafeHostOrIp("169.254.169.254"), true);
      assert.equal(isUnsafeHostOrIp("::1"), true);

      // Valid public hostnames
      assert.equal(isUnsafeHostOrIp("linear.app"), false);
      assert.equal(isUnsafeHostOrIp("theatlantic.com"), false);
      assert.equal(isUnsafeHostOrIp("shopify.com"), false);
      assert.equal(isUnsafeHostOrIp("aesop.com"), false);
      assert.equal(isUnsafeHostOrIp("vercel.com"), false);
      assert.equal(isUnsafeHostOrIp("pitch.com"), false);
      assert.equal(isUnsafeHostOrIp("github.com"), false);
    });
  });

  describe("Fix 1 — Security: Worker Fetch Handler Guardrails", () => {
    it("should reject non-POST requests with HTTP 405", async () => {
      const req = new Request("https://worker.internal/inspect", { method: "GET" });
      const res = await workerHandler.fetch(req, {
        MYBROWSER: {},
        INSPECTION_AUTH_SECRET: "test-secret",
      });
      assert.equal(res.status, 405);
    });

    it("should fail closed with HTTP 500 when INSPECTION_AUTH_SECRET is missing or empty", async () => {
      const req = new Request("https://worker.internal/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://linear.app" }),
      });
      // Missing secret
      const resMissing = await workerHandler.fetch(req, {
        MYBROWSER: {},
        INSPECTION_AUTH_SECRET: "",
      });
      assert.equal(resMissing.status, 500);
      const data: any = await resMissing.json();
      assert.ok(data.error.includes("INSPECTION_AUTH_SECRET is required"));
    });

    it("should reject missing or mismatched authentication tokens with HTTP 401", async () => {
      const reqNoAuth = new Request("https://worker.internal/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://linear.app" }),
      });
      const resNoAuth = await workerHandler.fetch(reqNoAuth, {
        MYBROWSER: {},
        INSPECTION_AUTH_SECRET: "correct-secret-123",
      });
      assert.equal(resNoAuth.status, 401);

      const reqBadAuth = new Request("https://worker.internal/inspect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-worker-auth": "wrong-token",
        },
        body: JSON.stringify({ url: "https://linear.app" }),
      });
      const resBadAuth = await workerHandler.fetch(reqBadAuth, {
        MYBROWSER: {},
        INSPECTION_AUTH_SECRET: "correct-secret-123",
      });
      assert.equal(resBadAuth.status, 401);
    });

    it("should accept valid authentication token via x-worker-auth or Bearer header", async () => {
      const reqAuth = new Request("https://worker.internal/inspect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-worker-auth": "correct-secret-123",
        },
        body: JSON.stringify({ url: "http://127.0.0.1:8080" }),
      });
      const res = await workerHandler.fetch(reqAuth, {
        MYBROWSER: {},
        INSPECTION_AUTH_SECRET: "correct-secret-123",
      });
      // Token accepted, failed at SSRF security check (HTTP 400), not 401
      assert.equal(res.status, 400);

      // Bearer token syntax test
      const reqBearer = new Request("https://worker.internal/inspect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer correct-secret-123",
        },
        body: JSON.stringify({ url: "http://127.0.0.1:8080" }),
      });
      const resBearer = await workerHandler.fetch(reqBearer, {
        MYBROWSER: {},
        INSPECTION_AUTH_SECRET: "correct-secret-123",
      });
      assert.equal(resBearer.status, 400);
    });

    it("should reject oversized request bodies with HTTP 413 (> 8KB)", async () => {
      const largePayload = "a".repeat(9000);
      const req = new Request("https://worker.internal/inspect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-worker-auth": "secret",
        },
        body: JSON.stringify({ url: "https://linear.app", padding: largePayload }),
      });
      const res = await workerHandler.fetch(req, {
        MYBROWSER: {},
        INSPECTION_AUTH_SECRET: "secret",
      });
      assert.equal(res.status, 413);
    });

    it("should reject SSRF target URLs with HTTP 400", async () => {
      const targets = [
        "http://127.0.0.1:8080",
        "http://localhost/admin",
        "http://169.254.169.254/latest/meta-data/",
        "http://0x7f000001",
        "http://metadata.google.internal/computeMetadata/v1/",
      ];

      for (const target of targets) {
        const req = new Request("https://worker.internal/inspect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-worker-auth": "secret",
          },
          body: JSON.stringify({ url: target }),
        });
        const res = await workerHandler.fetch(req, {
          MYBROWSER: {},
          INSPECTION_AUTH_SECRET: "secret",
        });
        assert.equal(res.status, 400, `Expected SSRF block for target ${target}`);
      }
    });

    it("should fail closed with HTTP 400 when DNS preflight fails or domain is unresolvable", async () => {
      const req = new Request("https://worker.internal/inspect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-worker-auth": "secret",
        },
        body: JSON.stringify({ url: "https://this-domain-does-not-exist-at-all-xyz9876.invalid" }),
      });
      const res = await workerHandler.fetch(req, {
        MYBROWSER: {},
        INSPECTION_AUTH_SECRET: "secret",
      });
      assert.equal(res.status, 400);
      const data: any = await res.json();
      assert.ok(data.error.toLowerCase().includes("dns"));
    });

    it("should fail closed with HTTP 503 if MYBROWSER binding is absent", async () => {
      const req = new Request("https://worker.internal/inspect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-worker-auth": "secret",
        },
        body: JSON.stringify({ url: "https://linear.app" }),
      });
      const res = await workerHandler.fetch(req, {
        MYBROWSER: null,
        INSPECTION_AUTH_SECRET: "secret",
      });
      assert.equal(res.status, 503);
      const data: any = await res.json();
      assert.ok(data.error.includes("MYBROWSER"));
    });
  });

  describe("Fix 2 — Data Contract: Palette & Color Hex Normalization", () => {
    it("should normalize RGB, RGBA, and 3-digit hex strings to validated 6-digit hex format", () => {
      assert.equal(normalizeToHex6("#fff"), "#ffffff");
      assert.equal(normalizeToHex6("#123"), "#112233");
      assert.equal(normalizeToHex6("#3B82F6"), "#3b82f6");
      assert.equal(normalizeToHex6("#3b82f6ff"), "#3b82f6");
      assert.equal(normalizeToHex6("rgb(59, 130, 246)"), "#3b82f6");
      assert.equal(normalizeToHex6("rgba(59, 130, 246, 1)"), "#3b82f6");
      assert.equal(normalizeToHex6("rgb(0, 0, 0)"), "#000000");
      assert.equal(normalizeToHex6("rgb(255, 255, 255)"), "#ffffff");
      assert.equal(normalizeToHex6("black"), "#000000");
      assert.equal(normalizeToHex6("white"), "#ffffff");
    });

    it("should return null for transparent or invisible colors", () => {
      assert.equal(normalizeToHex6("transparent"), null);
      assert.equal(normalizeToHex6("rgba(0, 0, 0, 0)"), null);
      assert.equal(normalizeToHex6("rgba(255, 255, 255, 0.01)"), null); // alpha < 0.05
      assert.equal(normalizeToHex6(""), null);
      assert.equal(normalizeToHex6("not-a-color"), null);
    });

    it("should guarantee extracted palette in evidence only contains valid 6-digit hex strings", () => {
      const rawSamples = [
        "rgb(14, 165, 233)",
        "#fff",
        "rgba(255, 255, 255, 0)", // transparent -> dropped
        "#0284c7",
        "rgb(248, 250, 252)",
        "invalid-color",
      ];

      const cleanedPalette: string[] = [];
      for (const s of rawSamples) {
        const hex = normalizeToHex6(s);
        if (hex && !cleanedPalette.includes(hex)) {
          cleanedPalette.push(hex);
        }
      }

      assert.deepEqual(cleanedPalette, ["#0ea5e9", "#ffffff", "#0284c7", "#f8fafc"]);
      for (const col of cleanedPalette) {
        assert.match(col, /^#[0-9a-f]{6}$/, `${col} must be a strict 6-digit hex string`);
      }

      // Mathematical ladder generation must succeed without NaN/fallback corruption
      const ladder = generateColorLadder(cleanedPalette[0]);
      assert.equal(ladder[500], "#0ea5e9");
      assert.match(ladder[50], /^#[0-9a-f]{6}$/);
      assert.match(ladder[900], /^#[0-9a-f]{6}$/);
    });
  });

  describe("Fix 3 — Honest Measurements & Attribution Provenance", () => {
    it("should attribute unmeasured layout metrics as 'inferred' rather than masquerading as 'observed'", () => {
      const evidenceWithUnmeasuredLayout: ReferenceSiteInspectionEvidence = {
        siteKey: "unmeasured-site",
        url: "https://example.com",
        name: "Unmeasured Site",
        archetype: "minimal-landing",
        timestamp: new Date().toISOString(),
        inspectionMethod: "cloudflare-browser-run",
        viewports: {
          desktop: { width: 1440, height: 900 },
          mobile: { width: 390, height: 844 },
        },
        meta: { title: "Unmeasured" },
        metrics: {
          body: {
            fontFamily: "Inter, sans-serif",
            fontSize: "16px",
            fontWeight: "400",
            lineHeight: "1.5",
            letterSpacing: "normal",
            color: "#111111",
            backgroundColor: "#ffffff",
          },
          h1: {
            fontFamily: "Inter, sans-serif",
            fontSize: "40px",
            fontWeight: "700",
            lineHeight: "1.2",
            letterSpacing: "-0.02em",
            color: "#111111",
            backgroundColor: "transparent",
          },
          h2: {
            fontFamily: "Inter, sans-serif",
            fontSize: "28px",
            fontWeight: "600",
            lineHeight: "1.3",
            letterSpacing: "-0.01em",
            color: "#18181b",
            backgroundColor: "transparent",
          },
          p: {
            fontFamily: "Inter, sans-serif",
            fontSize: "16px",
            fontWeight: "400",
            lineHeight: "1.6",
            letterSpacing: "normal",
            color: "#64748b",
            backgroundColor: "transparent",
          },
          // containerMaxWidth is undefined (honest: DOM had no container element)
          containerMaxWidth: undefined,
          isDark: false,
        },
        extractedPalette: ["#111111", "#2563eb", "#ffffff"],
        extractedFonts: ["Inter"],
        screenshots: {},
        fidelityReport: "Extracted metrics with unmeasured layout",
      };

      const system = buildDesignSystemFromEvidence(evidenceWithUnmeasuredLayout);

      // Must be attributed as 'inferred', NEVER 'observed'
      assert.equal(system.layout.containerMaxWidth.provenance, "inferred");
      assert.equal(system.layout.containerMaxWidth.value, "1280px");
      assert.ok(
        (system.layout.containerMaxWidth.verificationNote || "").toLowerCase().includes("unmeasured") ||
        (system.layout.containerMaxWidth.verificationNote || "").toLowerCase().includes("baseline")
      );
    });

    it("should attribute empirically measured container max width as 'observed'", () => {
      const evidenceWithMeasuredLayout: ReferenceSiteInspectionEvidence = {
        siteKey: "measured-site",
        url: "https://example.com",
        name: "Measured Site",
        archetype: "modern-saas",
        timestamp: new Date().toISOString(),
        inspectionMethod: "cloudflare-browser-run",
        viewports: {
          desktop: { width: 1440, height: 900 },
          mobile: { width: 390, height: 844 },
        },
        meta: { title: "Measured" },
        metrics: {
          body: {
            fontFamily: "Inter, sans-serif",
            fontSize: "16px",
            fontWeight: "400",
            lineHeight: "1.5",
            letterSpacing: "normal",
            color: "#111111",
            backgroundColor: "#ffffff",
          },
          h1: {
            fontFamily: "Inter, sans-serif",
            fontSize: "48px",
            fontWeight: "700",
            lineHeight: "1.1",
            letterSpacing: "-0.02em",
            color: "#111111",
            backgroundColor: "transparent",
          },
          h2: {
            fontFamily: "Inter, sans-serif",
            fontSize: "32px",
            fontWeight: "600",
            lineHeight: "1.2",
            letterSpacing: "-0.01em",
            color: "#18181b",
            backgroundColor: "transparent",
          },
          p: {
            fontFamily: "Inter, sans-serif",
            fontSize: "16px",
            fontWeight: "400",
            lineHeight: "1.6",
            letterSpacing: "normal",
            color: "#64748b",
            backgroundColor: "transparent",
          },
          // Measured bounding rect from DOM container
          containerMaxWidth: "1160px",
          isDark: false,
        },
        extractedPalette: ["#111111", "#2563eb", "#ffffff"],
        extractedFonts: ["Inter"],
        screenshots: {},
        fidelityReport: "Extracted metrics with measured 1160px container",
      };

      const system = buildDesignSystemFromEvidence(evidenceWithMeasuredLayout);

      assert.equal(system.layout.containerMaxWidth.provenance, "observed");
      assert.equal(system.layout.containerMaxWidth.value, "1160px");
      assert.ok(
        (system.layout.containerMaxWidth.verificationNote || "").toLowerCase().includes("bounding rect")
      );
    });
  });
});
