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
  generateComponentsCheatsheetHtml,
  calculateContrastRatio,
  generateColorLadder,
  parseCssTokens,
  parseTokensJson,
  parseDtcgTokens,
  validateDtcgTokenTree,
  parseCssBoxShadowToDtcg,
  dtcgShadowToCss,
  auditContrastPairs,
  REFERENCE_SITES,
  createReferenceSiteDesignSystem,
  preserveUserOverrides,
  attr,
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
      assert.equal(parsed.color.primary["500"].$value.hex, "#4f46e5");
      assert.equal(parsed.color.primary["500"].$value.colorSpace, "srgb");
      assert.equal(parsed.color.primary["500"].$type, "color");
      assert.ok(parsed.typography.heading.$value.includes("Inter Display"));
      assert.equal(parsed.dimension.radius.base.$type, "dimension");
      assert.equal(parsed.dimension.radius.base.$value.value, 8);
      assert.equal(parsed.dimension.radius.base.$value.unit, "px");
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

  describe("DTCG 2025.10 Token Specification & Composite Shadows", () => {
    it("should parse CSS box-shadow into structured DTCG composite shadow object", () => {
      const shadow = parseCssBoxShadowToDtcg("0 4px 12px rgba(0, 0, 0, 0.15)");
      assert.ok(!Array.isArray(shadow));
      assert.deepEqual(shadow.offsetX, { value: 0, unit: "px" });
      assert.deepEqual(shadow.offsetY, { value: 4, unit: "px" });
      assert.deepEqual(shadow.blur, { value: 12, unit: "px" });
      assert.deepEqual(shadow.spread, { value: 0, unit: "px" });
      assert.equal(typeof shadow.color, "object");
      assert.equal((shadow.color as any).colorSpace, "srgb");
      assert.equal((shadow.color as any).alpha, 0.15);

      const cssRoundtrip = dtcgShadowToCss(shadow);
      assert.ok(cssRoundtrip.includes("4px 12px"));
    });

    it("should generate DTCG 2025.10 tokens with composite shadow objects and semantic aliases", () => {
      const system = createArchetypeDesignSystem("modern-saas", {
        projectName: "Linear Fidelity Test",
        primaryColor: "#5e6ad2",
        accentColor: "#8f9bf9",
      });

      const jsonStr = generateTokensJson(system);
      const parsed = JSON.parse(jsonStr);

      // Official type definitions
      assert.equal(parsed.color.primary["500"].$type, "color");
      assert.equal(parsed.color.primary["500"].$value.hex, "#5e6ad2");
      assert.equal(parsed.dimension.radius.base.$type, "dimension");
      assert.equal(parsed.shadow.subtle.$type, "shadow");

      // Composite shadow format
      assert.ok(typeof parsed.shadow.subtle.$value === "object");
      assert.ok("offsetX" in parsed.shadow.subtle.$value);
      assert.ok("offsetY" in parsed.shadow.subtle.$value);
      assert.ok("blur" in parsed.shadow.subtle.$value);
      assert.ok("color" in parsed.shadow.subtle.$value);

      // Semantic token aliases
      assert.equal(parsed.component.button.primary.background.$value, "{color.primary.500}");
      assert.equal(parsed.component.button.primary.radius.$value, "{dimension.radius.base}");
    });

    it("should parse DTCG tokens and report unsupported fields honestly", () => {
      const dtcgPayload = JSON.stringify({
        $schema: "https://design-tokens.github.io/community-group/format/",
        color: {
          primary: { $value: "#6366f1", $type: "color" },
          accent: { $value: "#10b981", $type: "color" },
        },
        shadow: {
          subtle: {
            $type: "shadow",
            $value: {
              offsetX: "0px",
              offsetY: "2px",
              blur: "4px",
              spread: "0px",
              color: { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.06 },
            },
          },
        },
        experimentalSoundFX: {
          clickVolume: { $value: "0.8" },
        },
        proprietaryFigmaPluginMeta: {
          syncId: "xyz-123",
        },
      });

      const result = parseDtcgTokens(dtcgPayload);
      assert.ok(result.importedTokens >= 3);
      assert.equal(result.system.colors?.primary?.value, "#6366f1");
      assert.equal(result.system.colors?.accent?.value, "#10b981");
      assert.ok(result.system.surfaces?.shadows?.subtle?.value.includes("2px 4px"));

      // Honest reporting of unsupported fields
      assert.ok(result.unsupportedFields.includes("experimentalSoundFX"));
      assert.ok(result.unsupportedFields.includes("proprietaryFigmaPluginMeta"));
    });

    it("should validate DTCG token tree and flag syntax or unresolved aliases", () => {
      const validPayload = {
        color: {
          brand: { $value: "#4f46e5", $type: "color" },
          button: { $value: "{color.brand}", $type: "color" },
        },
      };
      const validation1 = validateDtcgTokenTree(validPayload);
      assert.equal(validation1.valid, true);
      assert.equal(validation1.errors.length, 0);

      const invalidPayload = {
        color: {
          button: { $value: "{color.missing}", $type: "color" },
        },
      };
      const validation2 = validateDtcgTokenTree(invalidPayload);
      assert.equal(validation2.valid, false);
      assert.ok(validation2.errors.some((e) => e.includes("{color.missing}")));
    });

    it("should perform lossless round-trip export, parse, and alias resolution", () => {
      const baseSystem = createArchetypeDesignSystem("modern-saas", {
        projectName: "Roundtrip Test",
        primaryColor: "#2563eb",
      });

      const exportedJson = generateTokensJson(baseSystem);
      const parseResult = parseDtcgTokens(exportedJson);

      assert.equal(parseResult.unresolvedAliases.length, 0);
      assert.ok(parseResult.importedTokens > 5);
      assert.equal(parseResult.system.colors?.primary?.value, "#2563eb");
      assert.equal(parseResult.system.surfaces?.baseRadius?.value, "8px");

      const treeValidation = validateDtcgTokenTree(JSON.parse(exportedJson));
      assert.equal(treeValidation.valid, true);
    });

    it("should refuse to silently default when token alias cannot be resolved", () => {
      const brokenAliasPayload = JSON.stringify({
        typography: {
          fontFamily: {
            heading: { $value: "{typography.nonExistentFont}", $type: "fontFamily" },
          },
        },
      });

      const parseResult = parseDtcgTokens(brokenAliasPayload);
      assert.ok(parseResult.unresolvedAliases.includes("{typography.nonExistentFont}"));
      assert.equal(parseResult.system.typography?.headingFont, undefined);
      assert.ok(parseResult.warnings.some((w) => w.includes("{typography.nonExistentFont}")));
    });

    it("should reject 'channels' and unnormalized values per DTCG 2025.10", () => {
      const deprecatedPayload = {
        color: {
          brand: {
            $value: { colorSpace: "srgb", channels: [255, 0, 0] },
            $type: "color",
          },
        },
      };
      const val1 = validateDtcgTokenTree(deprecatedPayload);
      assert.equal(val1.valid, false);
      assert.ok(val1.errors.some((e) => e.includes("expected 'components'")));

      const unnormalizedPayload = {
        color: {
          brand: {
            $value: { colorSpace: "srgb", components: [255, 0, 0] },
            $type: "color",
          },
        },
      };
      const val2 = validateDtcgTokenTree(unnormalizedPayload);
      assert.equal(val2.valid, false);
      assert.ok(val2.errors.some((e) => e.includes("normalized number in range [0, 1]")));

      const validDtcgPayload = {
        color: {
          brand: {
            $value: { colorSpace: "srgb", components: [1.0, 0.0, 0.0], alpha: 1 },
            $type: "color",
          },
        },
      };
      const val3 = validateDtcgTokenTree(validDtcgPayload);
      assert.equal(val3.valid, true);
    });

    it("should record warnings and unsupportedFields instead of silent defaults for malformed input", () => {
      const malformedJson = JSON.stringify({
        color: {
          primary: {
            $value: { colorSpace: "srgb", channels: [100, 200, 300] },
            $type: "color",
          },
        },
        dimension: {
          spacing: {
            base: { $value: { invalid: true }, $type: "dimension" },
          },
        },
      });
      const res = parseDtcgTokens(malformedJson);
      assert.ok(res.unsupportedFields.length >= 1);
      assert.ok(res.warnings.some((w) => w.includes("channels")));
      assert.equal(res.system.colors?.primary, undefined);
    });
  });

  describe("HTML Component Cheatsheet Generator", () => {
    it("should generate complete, responsive, dependency-free HTML component cheatsheet", () => {
      const system = createArchetypeDesignSystem("modern-saas", {
        projectName: "Cheatsheet Specimen",
      });

      const html = generateComponentsCheatsheetHtml(system);
      assert.ok(html.startsWith("<!DOCTYPE html>"));
      assert.ok(html.includes("<html lang=\"en\">"));
      assert.ok(html.includes("<style>"));
      assert.ok(html.includes("--color-primary:"));
      assert.ok(html.includes("--radius-card:"));
      assert.ok(html.includes("class=\"navbar\""));
      assert.ok(html.includes("class=\"hero\""));
      assert.ok(html.includes("class=\"card\""));
      assert.ok(html.includes("class=\"form-group\""));
      assert.ok(html.includes("class=\"btn btn-primary\""));
      assert.ok(html.includes("class=\"modal-preview\""));
      assert.ok(html.includes("@media (max-width: 768px)"));
      assert.ok(html.includes("</html>"));
    });

    it("should safely escape HTML injection payloads in project name and brand tone", () => {
      const maliciousSystem = createArchetypeDesignSystem("modern-saas", {
        projectName: '<script>alert("XSS")</script>',
        brandTone: 'Precision & <img src="x" onerror="alert(1)">',
      });

      const html = generateComponentsCheatsheetHtml(maliciousSystem);
      assert.ok(!html.includes('<script>alert("XSS")</script>'));
      assert.ok(html.includes("&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"));
      assert.ok(!html.includes('<img src="x"'));
      assert.ok(html.includes("&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;"));
    });
  });

  describe("Reference Site Fidelity Testing (6 Distinct Visual Identities)", () => {
    const sites = [
      { key: "linear", name: "Linear", expectedArch: "modern-saas", expectedDensity: "compact" },
      { key: "the-atlantic", name: "The Atlantic", expectedArch: "editorial", expectedDensity: "comfortable" },
      { key: "shopify", name: "Shopify", expectedArch: "ecommerce", expectedDensity: "normal" },
      { key: "aesop", name: "Aesop", expectedArch: "luxury", expectedDensity: "comfortable" },
      { key: "vercel", name: "Vercel", expectedArch: "minimal-landing", expectedDensity: "compact" },
      { key: "pitch", name: "Pitch", expectedArch: "expressive-studio", expectedDensity: "normal" },
    ];

    for (const site of sites) {
      it(`should produce high-fidelity empirical model for "${site.name}" (${site.expectedArch})`, () => {
        const ref = REFERENCE_SITES[site.key];
        assert.ok(ref, `Reference site ${site.key} must be defined`);
        assert.equal(ref.archetype, site.expectedArch);
        assert.equal(ref.observed.density, site.expectedDensity);
        assert.ok(ref.observed.detectedColors.length >= 4);
        assert.ok(ref.observed.detectedFonts.length >= 2);
        assert.ok(ref.fidelityReport.length > 20);

        // Build verified system
        const system = createReferenceSiteDesignSystem(site.key);

        // Verify observed provenance
        assert.equal(system.colors.primary.provenance, "observed");
        assert.equal(system.colors.primary.sourceRef, ref.url);
        assert.equal(system.colors.neutrals.background.provenance, "observed");
        assert.equal(system.surfaces.cardRadius.provenance, "observed");
        assert.equal(system.surfaces.cardRadius.value, ref.observed.cardRadius);

        // Verify WCAG contrast audit
        assert.ok(system.accessibility.verifiedContrastPairs.length >= 4);

        // Verify Markdown document contains empirical status
        const md = generateDesignMdDocument(system);
        assert.ok(md.includes(ref.url));
        assert.ok(md.includes("## 1. Epistemic Architecture & Evidence Status"));
        assert.ok(md.includes(ref.name));
      });
    }

    it("should demonstrate distinct visual tokens across different archetypes", () => {
      const linear = createReferenceSiteDesignSystem("linear");
      const theAtlantic = createReferenceSiteDesignSystem("the-atlantic");
      const aesop = createReferenceSiteDesignSystem("aesop");
      const pitch = createReferenceSiteDesignSystem("pitch");

      // Backgrounds differ
      assert.notEqual(linear.colors.neutrals.background.value, theAtlantic.colors.neutrals.background.value);
      assert.equal(linear.colors.neutrals.background.value, "#08090a"); // Obsidian
      assert.equal(theAtlantic.colors.neutrals.background.value, "#fcfbf9"); // Newsprint warm
      assert.equal(aesop.colors.neutrals.background.value, "#fffef2"); // Alabaster cream
      assert.equal(pitch.colors.neutrals.background.value, "#0f1015"); // Deep plum

      // Radii differ drastically
      assert.equal(aesop.surfaces.cardRadius.value, "0px"); // Razor-sharp luxury
      assert.equal(theAtlantic.surfaces.cardRadius.value, "2px"); // Editorial
      assert.equal(linear.surfaces.cardRadius.value, "6px"); // High density SaaS
      assert.equal(pitch.surfaces.cardRadius.value, "20px"); // Playful studio

      // Typography stacks differ
      assert.ok(linear.typography.headingFont.value.includes("Inter"));
      assert.ok(theAtlantic.typography.headingFont.value.includes("Newsreader"));
      assert.ok(aesop.typography.headingFont.value.includes("Suisse Works"));
      assert.ok(pitch.typography.headingFont.value.includes("Space Grotesk"));
    });
  });

  describe("preserveUserOverrides (State Persistence Across Presets & Tabs)", () => {
    it("should retain user-overridden fields when switching archetypes or loading reference sites", () => {
      const baseSaas = createArchetypeDesignSystem("modern-saas");

      // User customizes primary color and H1 tracking
      baseSaas.colors.primary = attr("#ff0055", "user-provided", undefined, "Custom brand color", undefined, 1, true);
      baseSaas.typography.headings.h1 = attr(
        { size: "3.5rem", weight: "800", lineHeight: "1.1", tracking: "-0.05em" },
        "user-provided",
        undefined,
        "Custom H1",
        undefined,
        1,
        true
      );

      // System loads reference site (e.g. Linear)
      const linear = createReferenceSiteDesignSystem("linear");

      // Merge linear with baseSaas user overrides
      const merged = preserveUserOverrides(linear, baseSaas);

      // Overridden fields must remain as user set them
      assert.equal(merged.colors.primary.value, "#ff0055");
      assert.equal(merged.colors.primary.userOverridden, true);
      assert.equal(merged.typography.headings.h1.value.tracking, "-0.05em");
      assert.equal(merged.typography.headings.h1.userOverridden, true);

      // Non-overridden fields must adopt new reference site's values
      assert.equal(merged.surfaces.cardRadius.value, linear.surfaces.cardRadius.value);
      assert.equal(merged.colors.neutrals.background.value, linear.colors.neutrals.background.value);
    });
  });
});
