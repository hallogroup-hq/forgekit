import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  escapeShieldsText,
  buildShieldsUrl,
  buildBadgeMarkdown,
  buildBadgeHtml,
  generateReadmeHero,
  BadgeDefinition,
} from "./engine";

describe("GitHub README Badge & Hero Studio Engine", () => {
  describe("escapeShieldsText", () => {
    it("should escape hyphens as double hyphens and spaces as underscores", () => {
      assert.equal(escapeShieldsText("hello-world"), "hello--world");
      assert.equal(escapeShieldsText("hello world"), "hello_world");
      assert.equal(escapeShieldsText("code_review"), "code__review");
    });
  });

  describe("buildShieldsUrl", () => {
    it("should build valid Shields.io badge URL with chosen style", () => {
      const badge: BadgeDefinition = {
        label: "build",
        message: "passing",
        color: "brightgreen",
      };
      const url = buildShieldsUrl(badge, "for-the-badge");
      assert.equal(
        url,
        "https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge"
      );
    });

    it("should include logo and logoColor when logo is specified", () => {
      const badge: BadgeDefinition = {
        label: "react",
        message: "v19",
        color: "61DAFB",
        logo: "react",
      };
      const url = buildShieldsUrl(badge, "flat-square");
      assert.ok(url.includes("&logo=react&logoColor=white"));
      assert.ok(url.includes("style=flat-square"));
    });
  });

  describe("buildBadgeMarkdown & buildBadgeHtml", () => {
    it("should generate markdown image", () => {
      const badge: BadgeDefinition = {
        label: "license",
        message: "MIT",
        color: "blue",
      };
      const md = buildBadgeMarkdown(badge, "flat");
      assert.equal(
        md,
        "![license: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat)"
      );
    });

    it("should wrap in link when link property is present", () => {
      const badge: BadgeDefinition = {
        label: "docs",
        message: "online",
        color: "blue",
        link: "https://example.com/docs",
      };
      const md = buildBadgeMarkdown(badge, "flat");
      assert.ok(md.startsWith("[![docs: online]"));
      assert.ok(md.endsWith("](https://example.com/docs)"));

      const html = buildBadgeHtml(badge, "flat");
      assert.ok(html.startsWith('<a href="https://example.com/docs">'));
      assert.ok(html.endsWith("</a>"));
    });
  });

  describe("generateReadmeHero", () => {
    it("should scaffold full README hero with git clone snippet and badges", () => {
      const output = generateReadmeHero({
        repoName: "forgekit",
        tagline: "Essential client-side generator workstation.",
        githubUser: "developer",
        badgeStyle: "flat-square",
        badges: [
          { label: "version", message: "1.0.0", color: "green", enabled: true },
          { label: "disabled", message: "hidden", color: "grey", enabled: false },
        ],
      });

      assert.ok(output.includes("# forgekit"));
      assert.ok(output.includes("> Essential client-side generator workstation."));
      assert.ok(output.includes("git clone https://github.com/developer/forgekit.git"));
      assert.ok(output.includes("version: 1.0.0"));
      assert.ok(!output.includes("disabled: hidden"));
    });
  });
});
