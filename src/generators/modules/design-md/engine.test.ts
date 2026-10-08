import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  ARCHETYPES,
  createArchetypeDesignSystem,
  generateDesignMdDocument,
  generateTokensJson,
  generateTokensCss,
  generateTailwindV3Config,
  generateTailwindV4Theme,
  generateComponentsCheatsheet,
  calculateContrastRatio,
  generateColorLadder,
  parseCssTokens,
  parseTokensJson,
  auditContrastPairs,
} from "./engine";

describe("Design.md 3-Layer Strategic Engine", () => {
  describe("Archetype Synthesis & 14-Section Verification", () => {
    const archetypes = Object.keys(ARCHETYPES) as (keyof typeof ARCHETYPES)[];

    for (const arch of archetypes) {
      it(`should synthesize valid 14-section design system for "${arch}"`, () => {
        const system = createArchetypeDesignSystem(arch, {
          projectName: `Test Project ${arch}`,
        });

        // 1. Identity
        assert.equal(system.identity.archetype.value, arch);
        assert.ok(system.identity.projectName.value.includes(arch));

        // 2. Colors & Ladder
        assert.ok(system.colors.primary.value.startsWith("#"));
        assert.ok(system.colors.primaryLadder.value[50].startsWith("#"));
        assert.ok(system.colors.primaryLadder.value[500].startsWith("#"));
        assert.ok(system.colors.primaryLadder.value[950].startsWith("#"));

        // 3. Typography
        assert.ok(system.typography.headingFont.value.length > 0);
        assert.ok(system.typography.bodyFont.value.length > 0);
        assert.ok(system.typography.baseFontSize.value >= 14);
        assert.ok(system.typography.headings.h1.value.size.length > 0);

        // 4. Layout
        assert.ok(system.layout.containerMaxWidth.value.includes("px"));

        // 5. Spacing
        assert.ok(system.spacing.baseUnit.value === 4 || system.spacing.baseUnit.value === 8);
        assert.ok(system.spacing.scale.value.md.length > 0);

        // 6. Surfaces
        assert.ok(system.surfaces.baseRadius.value.length > 0);
        assert.ok(system.surfaces.shadows.medium.value.length > 0);

        // 7. Buttons
        assert.ok(system.buttons.primary.value.bg.length > 0);
        assert.ok(system.buttons.sizes.value.md.height.length > 0);

        // 8. Forms
        assert.ok(system.forms.inputHeight.value.length > 0);

        // 9. Navigation
        assert.ok(system.navigation.navbarHeight.value.length > 0);

        // 10. Components
        assert.ok(system.components.cardStyle.value.length > 0);

        // 11. Media
        assert.ok(system.media.iconSet.value.length > 0);

        // 12. Motion
        assert.ok(system.motion.durationNormal.value.includes("ms"));

        // 13. Breakpoints
        assert.equal(system.breakpoints.md.value, "768px");

        // 14. Accessibility
        assert.ok(system.accessibility.verifiedContrastPairs.length >= 4);
      });
    }
  });

  describe("Epistemic Provenance Attribution", () => {
    it("should attribute observed provenance to extracted values and inferred to synthesized tokens", () => {
      const observation = {
        sourceUrl: "https://linear.app",
        detectedColors: ["#5e6ad2", "#f43f5e"],
        detectedFonts: ["Inter Display", "Inter"],
        observedTitle: "Linear - Issue Tracking",
      };

      const system = createArchetypeDesignSystem("modern-saas", {
        projectName: "Linear Studio",
        observation,
      });

      // Primary color extracted from observation should be "observed"
      assert.equal(system.colors.primary.provenance, "observed");
      assert.equal(system.colors.primary.sourceRef, "https://linear.app");

      // Derived ladder should be marked "inferred"
      assert.equal(system.colors.primaryLadder.provenance, "inferred");

      const mdDoc = generateDesignMdDocument(system, observation);
      assert.ok(mdDoc.includes("## 1. Epistemic Architecture & Evidence Status"));
      assert.ok(mdDoc.includes("**[Observed]** Inspected target URL: https://linear.app"));
      assert.ok(mdDoc.includes("**[Inferred]** Primary palette ladder (50–950) generated via linear tint/shade interpolation."));
      assert.ok(mdDoc.includes("## 14. Accessibility & Contrast Verification"));
    });
  });

  describe("Multi-Format Export Generators", () => {
    const system = createArchetypeDesignSystem("modern-saas", {
      projectName: "Atlas UI",
      primaryColor: "#4f46e5",
      accentColor: "#06b6d4",
    });

    it("should generate valid W3C Design Tokens JSON", () => {
      const tokensJson = generateTokensJson(system);
      const parsed = JSON.parse(tokensJson);

      assert.equal(parsed.name, "Atlas UI");
      assert.equal(parsed.archetype, "modern-saas");
      assert.equal(parsed.color.primary["500"].$value, "#4f46e5");
      assert.equal(parsed.color.primary["500"].$type, "color");
      assert.ok(parsed.typography.heading.$value.includes("Inter Display"));
      assert.equal(parsed.dimension.radius.base.$type, "dimension");
    });

    it("should generate standard CSS Custom Properties (:root)", () => {
      const css = generateTokensCss(system);
      assert.ok(css.includes(":root {"));
      assert.ok(css.includes("--color-primary: #4f46e5;"));
      assert.ok(css.includes("--color-primary-500: #4f46e5;"));
      assert.ok(css.includes("--font-heading: Inter Display"));
      assert.ok(css.includes("--radius-base: 8px;"));
    });

    it("should generate Tailwind CSS v3 configuration", () => {
      const twV3 = generateTailwindV3Config(system);
      assert.ok(twV3.includes('import type { Config } from "tailwindcss";'));
      assert.ok(twV3.includes('500: "#4f46e5"'));
      assert.ok(twV3.includes("fontFamily: {"));
      assert.ok(twV3.includes("heading:"));
    });

    it("should generate Tailwind CSS v4 @theme block", () => {
      const twV4 = generateTailwindV4Theme(system);
      assert.ok(twV4.includes("@theme {"));
      assert.ok(twV4.includes("--color-primary-500: #4f46e5;"));
      assert.ok(twV4.includes("--font-heading:"));
      assert.ok(twV4.includes("--radius-base: 8px;"));
    });

    it("should generate HTML/CSS Component Cheatsheet", () => {
      const sheet = generateComponentsCheatsheet(system);
      assert.ok(sheet.includes("<!-- 1. Primary Button -->"));
      assert.ok(sheet.includes("<!-- 2. Surface Card -->"));
      assert.ok(sheet.includes("<!-- 3. Form Input -->"));
    });
  });

  describe("Token Importers & Color Math", () => {
    it("should compute exact contrast ratios and pass/fail thresholds", () => {
      // Black on White: 21:1
      const maxContrast = calculateContrastRatio("#000000", "#ffffff");
      assert.ok(maxContrast >= 20.0);

      // Low contrast: gray on white
      const lowContrast = calculateContrastRatio("#cccccc", "#ffffff");
      assert.ok(lowContrast < 3.0);

      const pairs = auditContrastPairs("#4f46e5", "#ffffff", "#f8fafc", "#0f172a");
      assert.equal(pairs.length, 4);
      assert.ok(pairs[0].passesAA); // Text on background
    });

    it("should parse CSS custom properties from raw text", () => {
      const rawCss = `
        :root {
          --color-primary: #0ea5e9;
          --color-accent: #f43f5e;
          --font-heading: "Cabinet Grotesk", sans-serif;
          --radius-base: 14px;
        }
      `;
      const imported = parseCssTokens(rawCss);
      assert.equal(imported.colors?.primary?.value, "#0ea5e9");
      assert.equal(imported.colors?.accent?.value, "#f43f5e");
      assert.equal(imported.typography?.headingFont?.value, '"Cabinet Grotesk", sans-serif');
      assert.equal(imported.surfaces?.baseRadius?.value, "14px");
    });

    it("should parse W3C Design Tokens JSON from raw text", () => {
      const rawJson = JSON.stringify({
        color: {
          primary: { $value: "#10b981" },
          accent: { $value: "#8b5cf6" },
        },
        typography: {
          heading: { $value: "Satoshi" },
        },
        dimension: {
          radius: {
            base: { $value: "10px" },
          },
        },
      });

      const imported = parseTokensJson(rawJson);
      assert.equal(imported.colors?.primary?.value, "#10b981");
      assert.equal(imported.colors?.accent?.value, "#8b5cf6");
      assert.equal(imported.typography?.headingFont?.value, "Satoshi");
      assert.equal(imported.surfaces?.baseRadius?.value, "10px");
    });

    it("should generate full 11-step color ladder via linear interpolation", () => {
      const ladder = generateColorLadder("#3b82f6");
      assert.ok(ladder[50].startsWith("#"));
      assert.ok(ladder[100].startsWith("#"));
      assert.equal(ladder[500], "#3b82f6");
      assert.ok(ladder[900].startsWith("#"));
      assert.ok(ladder[950].startsWith("#"));
    });
  });
});
