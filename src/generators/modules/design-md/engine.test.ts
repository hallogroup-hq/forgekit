import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hexToRgb,
  tintColor,
  shadeColor,
  generateTailwindConfig,
  generateCssVariables,
  generateDesignDoc,
  DesignSystemSpec,
} from "./engine";

describe("Design.md Strategic Generator Engine", () => {
  const sampleSpec: DesignSystemSpec = {
    projectName: "Linear Studio",
    platform: "Web (Responsive)",
    brandTone: "Precision, Obsidian Dark, High Density",
    primaryColor: "#5e6ad2",
    accentColor: "#f43f5e",
    neutralType: "Zinc",
    headingFont: "Inter Display",
    bodyFont: "Inter",
    monoFont: "JetBrains Mono",
    baseRadius: "8px",
    elevationStyle: "Subtle Multi-layer",
  };

  describe("Color math (hexToRgb, tintColor, shadeColor)", () => {
    it("should parse hex to RGB tuple", () => {
      assert.deepEqual(hexToRgb("#ffffff"), [255, 255, 255]);
      assert.deepEqual(hexToRgb("#000000"), [0, 0, 0]);
    });

    it("should generate lighter tint and darker shade", () => {
      const tint = tintColor("#5e6ad2", 0.5);
      const shade = shadeColor("#5e6ad2", 0.5);
      assert.notEqual(tint, "#5e6ad2");
      assert.notEqual(shade, "#5e6ad2");
      assert.ok(tint.startsWith("#"));
      assert.ok(shade.startsWith("#"));
    });
  });

  describe("generateTailwindConfig & generateCssVariables", () => {
    it("should output valid Tailwind config with primary color ladder", () => {
      const tw = generateTailwindConfig(sampleSpec);
      assert.ok(tw.includes("primary: {"));
      assert.ok(tw.includes('500: "#5e6ad2"'));
      assert.ok(tw.includes('heading: ["Inter Display", "sans-serif"]'));
    });

    it("should output CSS variables", () => {
      const css = generateCssVariables(sampleSpec);
      assert.ok(css.includes("--color-primary: #5e6ad2;"));
      assert.ok(css.includes('--font-heading: "Inter Display", sans-serif;'));
    });
  });

  describe("generateDesignDoc & Epistemic Separation", () => {
    it("should clearly label Observed, Inferred, and Unknown sections", () => {
      const doc = generateDesignDoc(sampleSpec, {
        sourceUrl: "https://linear.app",
        hasScreenshot: true,
        screenshotName: "linear-desktop.png",
        observedTitle: "Linear – Issue Tracking",
        observedThemeColor: "#0f0f11",
        detectedColors: ["#5e6ad2", "#0f0f11"],
        detectedFonts: ["Inter Display", "Inter"],
      });

      assert.ok(doc.markdown.includes("1.1 Observed Characteristics (Empirical Evidence)"));
      assert.ok(doc.markdown.includes("1.2 Inferred Specifications (Engine Synthesis)"));
      assert.ok(doc.markdown.includes("1.3 Unknown / Requires Human Verification"));

      assert.ok(doc.markdown.includes("linear-desktop.png"));
      assert.ok(doc.markdown.includes("Linear – Issue Tracking"));
      assert.ok(doc.markdown.includes("#0f0f11"));

      // Check W3C Tokens JSON
      const tokens = JSON.parse(doc.tokensJson);
      assert.equal(tokens.color.primary.$value, "#5e6ad2");
      assert.equal(tokens.typography.heading.$value, "Inter Display");
    });
  });
});
