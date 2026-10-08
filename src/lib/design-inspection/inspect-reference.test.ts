import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  rgbToHex,
  getLocalChromePath,
  buildDesignSystemFromEvidence,
  ReferenceSiteInspectionEvidence,
} from "./inspect-reference";
import { generateDesignMdDocument } from "../../generators/modules/design-md/engine";

describe("Reference Site Inspection Pipeline", () => {
  describe("Color Normalization & Chrome Binary Detection", () => {
    it("should convert rgb and rgba to 6-digit hex format", () => {
      assert.equal(rgbToHex("rgb(79, 70, 229)"), "#4f46e5");
      assert.equal(rgbToHex("rgba(0, 0, 0, 0.8)"), "#000000");
      assert.equal(rgbToHex("rgb(255, 255, 255)"), "#ffffff");
      assert.equal(rgbToHex("#123"), "#112233");
      assert.equal(rgbToHex("#4f46e5"), "#4f46e5");
    });

    it("should resolve a valid Chrome or Chromium executable on host system", () => {
      const chromePath = getLocalChromePath();
      assert.ok(chromePath.length > 0);
      assert.ok(chromePath.includes("Chrome") || chromePath.includes("chromium"));
    });
  });

  describe("buildDesignSystemFromEvidence (Evidence-to-System Synthesis)", () => {
    it("should synthesize FullDesignSystem with attributed observed metrics", () => {
      const mockEvidence: ReferenceSiteInspectionEvidence = {
        siteKey: "linear",
        url: "https://linear.app",
        name: "Linear",
        archetype: "modern-saas",
        timestamp: "2026-10-09T03:00:00.000Z",
        inspectionMethod: "headless-chrome",
        viewports: {
          desktop: { width: 1440, height: 900 },
          mobile: { width: 390, height: 844 },
        },
        meta: {
          title: "Linear — A better way to build products",
          themeColor: "#08090a",
          description: "Issue tracking and project management",
        },
        metrics: {
          body: {
            fontFamily: "Inter, sans-serif",
            fontSize: "16px",
            fontWeight: "400",
            lineHeight: "1.5",
            letterSpacing: "-0.01em",
            color: "rgb(238, 238, 238)",
            backgroundColor: "rgb(8, 9, 10)",
          },
          h1: {
            fontFamily: "Inter Display, sans-serif",
            fontSize: "56px",
            fontWeight: "700",
            lineHeight: "1.05",
            letterSpacing: "-0.04em",
            color: "rgb(255, 255, 255)",
            backgroundColor: "transparent",
          },
          h2: {
            fontFamily: "Inter Display, sans-serif",
            fontSize: "36px",
            fontWeight: "600",
            lineHeight: "1.15",
            letterSpacing: "-0.03em",
            color: "rgb(240, 240, 240)",
            backgroundColor: "transparent",
          },
          p: {
            fontFamily: "Inter, sans-serif",
            fontSize: "18px",
            fontWeight: "400",
            lineHeight: "1.6",
            letterSpacing: "normal",
            color: "rgb(150, 150, 150)",
            backgroundColor: "transparent",
          },
          primaryButton: {
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            fontWeight: "500",
            lineHeight: "1",
            letterSpacing: "normal",
            color: "rgb(255, 255, 255)",
            backgroundColor: "rgb(94, 106, 210)",
            borderRadius: "6px",
          },
          card: {
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            fontWeight: "400",
            lineHeight: "1.4",
            letterSpacing: "normal",
            color: "rgb(200, 200, 200)",
            backgroundColor: "rgb(16, 17, 19)",
            borderRadius: "8px",
          },
          containerMaxWidth: "1280px",
          isDark: true,
        },
        extractedPalette: ["#08090a", "#5e6ad2", "#eeeeee", "#101113"],
        extractedFonts: ["Inter Display", "Inter"],
        screenshots: {
          desktopPath: "evidence/reference-sites/linear/desktop.png",
          mobilePath: "evidence/reference-sites/linear/mobile.png",
        },
        fidelityReport: "Extracted live tokens from Linear via Chrome 154.",
      };

      const system = buildDesignSystemFromEvidence(mockEvidence);

      // Verify empirical attribution
      assert.equal(system.colors.neutrals.background.value, "#08090a");
      assert.equal(system.colors.neutrals.background.provenance, "observed");
      assert.equal(system.colors.neutrals.background.sourceRef, "https://linear.app");

      assert.equal(system.colors.primary.value, "#5e6ad2");
      assert.equal(system.colors.primary.provenance, "observed");

      assert.equal(system.typography.headings.h1.value.size, "56px");
      assert.equal(system.typography.headings.h1.provenance, "observed");

      assert.equal(system.surfaces.cardRadius.value, "8px");
      assert.equal(system.surfaces.cardRadius.provenance, "observed");

      // Verify WCAG verified contrast pairs
      assert.ok(system.accessibility.verifiedContrastPairs.length >= 4);

      // Verify Markdown document contains empirical evidence
      const md = generateDesignMdDocument(system);
      assert.ok(md.includes("https://linear.app"));
      assert.ok(md.includes("#08090a"));
      assert.ok(md.includes("#5e6ad2"));
    });

    it("should reject 0x0 button and 1x1 heading measurements and infer honest fallbacks", () => {
      const flawedEvidence: ReferenceSiteInspectionEvidence = {
        siteKey: "test-site",
        url: "https://example.com",
        name: "Test Site",
        archetype: "minimal-landing",
        timestamp: new Date().toISOString(),
        inspectionMethod: "headless-chrome",
        viewports: {
          desktop: { width: 1440, height: 900 },
          mobile: { width: 390, height: 844 },
        },
        meta: { title: "Test" },
        metrics: {
          body: {
            fontFamily: "sans-serif",
            fontSize: "16px",
            fontWeight: "400",
            lineHeight: "24px",
            letterSpacing: "normal",
            color: "rgb(0, 0, 0)",
            backgroundColor: "rgb(0, 0, 0)", // Flawed: 1:1 identical contrast
          },
          h1: {
            fontFamily: "sans-serif",
            fontSize: "48px",
            fontWeight: "700",
            lineHeight: "56px",
            letterSpacing: "normal",
            width: 1, // Flawed: 1x1 sr-only heading
            height: 1,
            color: "rgb(0, 0, 0)",
            backgroundColor: "transparent",
          },
          h2: {
            fontFamily: "sans-serif",
            fontSize: "32px",
            fontWeight: "600",
            lineHeight: "40px",
            letterSpacing: "normal",
            width: 400, // Valid visible H2
            height: 40,
            color: "rgb(0, 0, 0)",
            backgroundColor: "transparent",
          },
          p: {
            fontFamily: "sans-serif",
            fontSize: "16px",
            fontWeight: "400",
            lineHeight: "24px",
            letterSpacing: "normal",
            color: "rgb(0, 0, 0)",
            backgroundColor: "transparent",
          },
          primaryButton: {
            fontFamily: "sans-serif",
            fontSize: "14px",
            fontWeight: "500",
            lineHeight: "20px",
            letterSpacing: "normal",
            width: 0, // Flawed: 0x0 hidden button
            height: 0,
            color: "rgb(255, 255, 255)",
            backgroundColor: "rgb(0, 0, 0)",
          },
          containerMaxWidth: "1280px",
          isDark: false,
        },
        extractedPalette: ["#111111", "#3b82f6", "#ffffff"],
        extractedFonts: ["Inter"],
        screenshots: {
          desktopPath: "/evidence/reference-sites/test-site/desktop.png",
          mobilePath: "/evidence/reference-sites/test-site/mobile.png",
        },
        fidelityReport: "Tested rejection of invalid measurements",
      };

      const system = buildDesignSystemFromEvidence(flawedEvidence);

      // Contrast must be normalized (not black text on black background)
      assert.notEqual(
        system.colors.neutrals.background.value.toLowerCase(),
        system.colors.neutrals.text.value.toLowerCase()
      );

      // 0x0 button must NOT be accepted as observed
      assert.equal(system.colors.primary.provenance, "inferred");

      // 1x1 heading must fall back to visible H2
      assert.equal(system.typography.headings.h1.value.size, "32px");
      assert.equal(system.typography.headings.h1.provenance, "inferred");
    });
  });
});
