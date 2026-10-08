import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractHostname,
  auditOpenGraph,
  generateHtmlMetaTags,
  generateNextJsMetadata,
  generateJsonLd,
  OpenGraphInput,
} from "./engine";

describe("OpenGraph & SEO Social Meta Studio Engine", () => {
  const sampleInput: OpenGraphInput = {
    title: "ForgeKit - Developer & Creator Studio",
    description: "Fast client-side generators and utilities for modern makers and developers.",
    url: "https://forgekit.dev/tools",
    imageUrl: "https://forgekit.dev/og.png",
    siteName: "ForgeKit",
    twitterHandle: "@forgekit_dev",
  };

  describe("extractHostname", () => {
    it("should extract hostname from valid URLs", () => {
      assert.equal(extractHostname("https://forgekit.dev/sub/page?q=1"), "forgekit.dev");
      assert.equal(extractHostname("http://localhost:3000"), "localhost");
    });

    it("should fallback to example.com on malformed URL", () => {
      assert.equal(extractHostname("not-a-valid-url"), "example.com");
    });
  });

  describe("auditOpenGraph", () => {
    it("should report optimal status when character lengths are in ideal bounds", () => {
      const audit = auditOpenGraph(sampleInput);
      assert.equal(audit.titleStatus, "optimal");
      assert.equal(audit.descStatus, "optimal");
      assert.equal(audit.domain, "forgekit.dev");
      assert.equal(audit.valid, true);
    });

    it("should detect short or long titles and descriptions", () => {
      const shortAudit = auditOpenGraph({
        title: "Short",
        description: "Too short",
        url: "https://example.com",
      });
      assert.equal(shortAudit.titleStatus, "short");
      assert.equal(shortAudit.descStatus, "short");
      assert.ok(shortAudit.issues.some((i) => i.includes("Title is shorter")));
    });

    it("should detect invalid URL", () => {
      const audit = auditOpenGraph({
        ...sampleInput,
        url: "invalid-url-string",
      });
      assert.equal(audit.valid, false);
      assert.ok(audit.issues.some((i) => i.includes("Canonical URL is not a valid")));
    });
  });

  describe("generateHtmlMetaTags", () => {
    it("should generate complete HTML head tags with og and twitter metadata", () => {
      const tags = generateHtmlMetaTags(sampleInput);
      assert.ok(tags.includes("<title>ForgeKit - Developer &amp; Creator Studio</title>"));
      assert.ok(tags.includes('<meta property="og:title" content="ForgeKit - Developer &amp; Creator Studio">'));
      assert.ok(tags.includes('<meta property="og:image" content="https://forgekit.dev/og.png">'));
      assert.ok(tags.includes('<meta name="twitter:creator" content="@forgekit_dev">'));
      assert.ok(tags.includes('name="twitter:card" content="summary_large_image"'));
    });

    it("should safely escape quotes and HTML tags in user values", () => {
      const maliciousInput: OpenGraphInput = {
        title: 'Title with "Quotes" & <script>alert(1)</script>',
        description: 'Description with "nested" \'quotes\' & symbols',
        url: 'https://example.com/test?a=1&b=2',
        siteName: 'My "Site"',
      };
      const tags = generateHtmlMetaTags(maliciousInput);
      assert.ok(tags.includes('&quot;Quotes&quot; &amp; &lt;script&gt;'));
      assert.ok(!tags.includes('<script>'));
      assert.ok(tags.includes('&quot;nested&quot; &#39;quotes&#39;'));
      assert.ok(tags.includes('content="My &quot;Site&quot;"'));
    });
  });

  describe("generateNextJsMetadata", () => {
    it("should generate TypeScript Next.js App Router metadata export", () => {
      const code = generateNextJsMetadata(sampleInput);
      assert.ok(code.includes("import type { Metadata } from 'next';"));
      assert.ok(code.includes("openGraph:"));
      assert.ok(code.includes("twitter:"));
      assert.ok(code.includes("width: 1200"));
      assert.ok(code.includes("metadataBase: new URL(\"https://forgekit.dev/tools\")"));
    });
  });

  describe("generateJsonLd", () => {
    it("should generate valid Schema.org JSON-LD", () => {
      const json = generateJsonLd(sampleInput);
      const parsed = JSON.parse(json);
      assert.equal(parsed["@type"], "WebSite");
      assert.equal(parsed.name, "ForgeKit");
      assert.equal(parsed.url, "https://forgekit.dev/tools");
    });
  });
});
