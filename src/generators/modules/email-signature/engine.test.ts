import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  escapeHtml,
  cleanUrl,
  formatDisplayUrl,
  generateEmailSignatureHtml,
  generateEmailSignaturePlainText,
  EmailSignatureData,
} from "./engine";

describe("Email Signature Engine", () => {
  const sampleData: EmailSignatureData = {
    fullName: "Sarah Jenkins",
    jobTitle: "Head of Product Design",
    company: "ForgeKit Labs Inc.",
    email: "sarah@forgekit.dev",
    phone: "+1 (555) 382-9910",
    website: "https://forgekit.dev",
    avatarUrl: "https://example.com/avatar.jpg",
    accentColor: "#2563eb",
    linkedin: "https://linkedin.com/in/sarah",
    github: "https://github.com/sarah",
  };

  describe("escapeHtml & URL cleaners", () => {
    it("should escape special characters to prevent broken table or injection", () => {
      assert.equal(escapeHtml('<script>alert("xss")</script>'), "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
      assert.equal(escapeHtml("Tom & Jerry"), "Tom &amp; Jerry");
    });

    it("should ensure URL has https protocol", () => {
      assert.equal(cleanUrl("example.com"), "https://example.com");
      assert.equal(cleanUrl("http://example.com"), "http://example.com");
      assert.equal(cleanUrl("https://example.com"), "https://example.com");
    });

    it("should format clean display URL without https protocol", () => {
      assert.equal(formatDisplayUrl("https://www.example.com/"), "example.com");
      assert.equal(formatDisplayUrl("https://forgekit.dev"), "forgekit.dev");
    });
  });

  describe("generateEmailSignatureHtml layouts", () => {
    it("should generate modern-split layout with table and inline styles", () => {
      const html = generateEmailSignatureHtml(sampleData, "modern-split");
      assert.ok(html.includes("<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\""));
      assert.ok(html.includes("Sarah Jenkins"));
      assert.ok(html.includes("mailto:sarah@forgekit.dev"));
      assert.ok(html.includes("tel:+1 (555) 382-9910"));
      assert.ok(html.includes("border-left: 2px solid #2563eb"));
      assert.ok(html.includes("https://example.com/avatar.jpg"));
      assert.ok(html.includes("LinkedIn"));
    });

    it("should generate compact layout with single line details", () => {
      const html = generateEmailSignatureHtml(sampleData, "compact");
      assert.ok(html.includes("<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\""));
      assert.ok(html.includes("Sarah Jenkins <span style=\"font-weight: 400; color: #64748b;\">| Head of Product Design</span>"));
      assert.ok(html.includes("&bull;"));
    });

    it("should generate corporate layout with header border", () => {
      const html = generateEmailSignatureHtml(sampleData, "corporate");
      assert.ok(html.includes("<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\""));
      assert.ok(html.includes("border-bottom: 2px solid #2563eb"));
      assert.ok(html.includes("Email:</strong> <a href=\"mailto:sarah@forgekit.dev\""));
    });

    it("should escape raw HTML inside fields gracefully", () => {
      const html = generateEmailSignatureHtml({
        ...sampleData,
        fullName: 'Jane <img src="x" onerror="alert(1)"> Doe',
      });
      assert.ok(html.includes("&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;"));
      assert.ok(!html.includes("<img src=\"x\""));
    });

    it("should sanitize dangerous URL schemes and attribute breakout in avatarUrl and accentColor", () => {
      const html = generateEmailSignatureHtml({
        ...sampleData,
        website: "javascript:alert('XSS')",
        linkedin: "javascript:alert('XSS')",
        avatarUrl: 'https://example.com/avatar.jpg" onerror="alert(1)',
        accentColor: 'red; background: url("x")',
      });
      assert.ok(!html.includes("javascript:alert"));
      assert.ok(!html.includes('onerror="alert(1)"'));
      assert.ok(!html.includes('red; background: url("x")'));
      assert.ok(html.includes("#2563eb"));
    });
  });

  describe("generateEmailSignaturePlainText", () => {
    it("should generate clean plain-text fallback for clipboard", () => {
      const text = generateEmailSignaturePlainText(sampleData);
      assert.ok(text.includes("Sarah Jenkins"));
      assert.ok(text.includes("Head of Product Design | ForgeKit Labs Inc."));
      assert.ok(text.includes("Email: sarah@forgekit.dev"));
      assert.ok(text.includes("Website: https://forgekit.dev"));
    });
  });
});
