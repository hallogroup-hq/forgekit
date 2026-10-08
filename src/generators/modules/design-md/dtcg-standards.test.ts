import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateDtcgTokenTree,
  parseDtcgTokens,
  parseCssBoxShadowToDtcg,
  dtcgShadowToCss,
  parseCssColorToDtcg,
  dtcgColorToCss,
  DtcgCompositeShadow,
} from "./engine";

describe("DTCG 2025.10 Composite Tokens Standards Compliance", () => {
  describe("Structured Color Conversion & Alpha Handling", () => {
    it("should parse 6-digit hex into normalized sRGB components [0, 1]", () => {
      const color = parseCssColorToDtcg("#3b82f6");
      assert.equal(color.colorSpace, "srgb");
      assert.equal(color.alpha, 1);
      assert.equal(color.components.length, 3);
      assert.equal(Math.round(color.components[0] * 255), 59);
      assert.equal(Math.round(color.components[1] * 255), 130);
      assert.equal(Math.round(color.components[2] * 255), 246);
    });

    it("should parse rgba() with fractional alpha into normalized sRGB components and alpha", () => {
      const color = parseCssColorToDtcg("rgba(0, 0, 0, 0.25)");
      assert.equal(color.colorSpace, "srgb");
      assert.equal(color.components[0], 0);
      assert.equal(color.components[1], 0);
      assert.equal(color.components[2], 0);
      assert.equal(color.alpha, 0.25);
    });

    it("should convert structured DTCG color with alpha back to valid CSS rgba", () => {
      const color = {
        colorSpace: "srgb" as const,
        components: [0, 0, 0] as [number, number, number],
        alpha: 0.15,
      };
      const css = dtcgColorToCss(color);
      assert.equal(css, "rgba(0, 0, 0, 0.15)");
    });

    it("should convert structured DTCG color with alpha=1 back to 6-digit hex", () => {
      const color = {
        colorSpace: "srgb" as const,
        components: [0, 0.5, 1] as [number, number, number],
        alpha: 1,
      };
      const css = dtcgColorToCss(color);
      assert.ok(css.startsWith("#"));
    });
  });

  describe("Composite Shadow Tokens (Single, Multi-layer, and Inset)", () => {
    it("should parse simple CSS box-shadow into valid DTCG shadow object with structured color", () => {
      const shadow = parseCssBoxShadowToDtcg("0 2px 4px rgba(0, 0, 0, 0.1)");
      assert.ok(!Array.isArray(shadow));
      const s = shadow as DtcgCompositeShadow;
      assert.deepEqual(s.offsetX, { value: 0, unit: "px" });
      assert.deepEqual(s.offsetY, { value: 2, unit: "px" });
      assert.deepEqual(s.blur, { value: 4, unit: "px" });
      assert.deepEqual(s.spread, { value: 0, unit: "px" });
      assert.equal(typeof s.color, "object");
      assert.equal((s.color as any).colorSpace, "srgb");
      assert.equal((s.color as any).alpha, 0.1);
    });

    it("should parse multi-layer comma-separated CSS box-shadow into DTCG shadow array", () => {
      const multiCss = "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)";
      const shadows = parseCssBoxShadowToDtcg(multiCss);
      assert.ok(Array.isArray(shadows));
      assert.equal(shadows.length, 2);

      assert.deepEqual(shadows[0].offsetY, { value: 1, unit: "px" });
      assert.deepEqual(shadows[0].blur, { value: 3, unit: "px" });
      assert.equal((shadows[0].color as any).alpha, 0.1);

      assert.deepEqual(shadows[1].offsetY, { value: 1, unit: "px" });
      assert.deepEqual(shadows[1].blur, { value: 2, unit: "px" });
      assert.equal((shadows[1].color as any).alpha, 0.06);
    });

    it("should parse inset box-shadow with inset: true", () => {
      const insetCss = "inset 0 2px 4px rgba(0, 0, 0, 0.2)";
      const shadow = parseCssBoxShadowToDtcg(insetCss) as DtcgCompositeShadow;
      assert.equal(shadow.inset, true);
      assert.deepEqual(shadow.offsetY, { value: 2, unit: "px" });
      assert.deepEqual(shadow.blur, { value: 4, unit: "px" });
    });

    it("should format multi-layer shadows back to valid CSS box-shadow", () => {
      const layers: DtcgCompositeShadow[] = [
        {
          offsetX: { value: 0, unit: "px" },
          offsetY: { value: 4, unit: "px" },
          blur: { value: 6, unit: "px" },
          spread: { value: -1, unit: "px" },
          color: { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.1 },
        },
        {
          offsetX: { value: 0, unit: "px" },
          offsetY: { value: 2, unit: "px" },
          blur: { value: 4, unit: "px" },
          spread: { value: -2, unit: "px" },
          color: { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.05 },
        },
      ];

      const css = dtcgShadowToCss(layers);
      assert.ok(css.includes("0px 4px 6px -1px rgba(0, 0, 0, 0.1)"));
      assert.ok(css.includes("0px 2px 4px -2px rgba(0, 0, 0, 0.05)"));
      assert.ok(css.includes(","));
    });

    it("should round-trip CSS -> DTCG -> CSS losslessly", () => {
      const input = "0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -4px rgba(0, 0, 0, 0.1)";
      const dtcg = parseCssBoxShadowToDtcg(input);
      const output = dtcgShadowToCss(dtcg);
      assert.ok(output.includes("0px 10px 15px -3px rgba(0, 0, 0, 0.1)"));
      assert.ok(output.includes("0px 4px 6px -4px rgba(0, 0, 0, 0.1)"));
    });
  });

  describe("Strict Schema Validation per DTCG 2025.10 Specification", () => {
    it("should accept valid DTCG composite shadow token with structured color", () => {
      const validToken = {
        shadow: {
          elevated: {
            $type: "shadow",
            $value: {
              offsetX: { value: 0, unit: "px" },
              offsetY: { value: 8, unit: "px" },
              blur: { value: 16, unit: "px" },
              spread: { value: 0, unit: "px" },
              color: {
                colorSpace: "srgb",
                components: [0, 0, 0],
                alpha: 0.12,
              },
            },
          },
        },
      };

      const result = validateDtcgTokenTree(validToken);
      assert.equal(result.valid, true);
      assert.equal(result.errors.length, 0);
    });

    it("should accept valid DTCG shadow array for multi-layer shadows", () => {
      const validTokenArray = {
        shadow: {
          card: {
            $type: "shadow",
            $value: [
              {
                offsetX: { value: 0, unit: "px" },
                offsetY: { value: 1, unit: "px" },
                blur: { value: 3, unit: "px" },
                spread: { value: 0, unit: "px" },
                color: { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.1 },
              },
              {
                offsetX: { value: 0, unit: "px" },
                offsetY: { value: 1, unit: "px" },
                blur: { value: 2, unit: "px" },
                spread: { value: 0, unit: "px" },
                color: { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.06 },
              },
            ],
          },
        },
      };

      const result = validateDtcgTokenTree(validTokenArray);
      assert.equal(result.valid, true);
      assert.equal(result.errors.length, 0);
    });

    it("should reject raw CSS color string in shadow color per DTCG 2025.10", () => {
      const invalidToken = {
        shadow: {
          subtle: {
            $type: "shadow",
            $value: {
              offsetX: { value: 0, unit: "px" },
              offsetY: { value: 2, unit: "px" },
              blur: { value: 4, unit: "px" },
              spread: { value: 0, unit: "px" },
              color: "rgba(0, 0, 0, 0.1)", // Not a structured color or alias!
            },
          },
        },
      };

      const result = validateDtcgTokenTree(invalidToken);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("expected structured color object or alias reference")));
    });

    it("should accept token alias reference inside shadow color", () => {
      const tokenWithAlias = {
        color: {
          shadowColor: {
            $type: "color",
            $value: { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.08 },
          },
        },
        shadow: {
          subtle: {
            $type: "shadow",
            $value: {
              offsetX: { value: 0, unit: "px" },
              offsetY: { value: 2, unit: "px" },
              blur: { value: 4, unit: "px" },
              spread: { value: 0, unit: "px" },
              color: "{color.shadowColor}",
            },
          },
        },
      };

      const result = validateDtcgTokenTree(tokenWithAlias);
      assert.equal(result.valid, true);
      assert.equal(result.errors.length, 0);
    });

    it("should reject deprecated 'channels' in shadow color", () => {
      const deprecatedToken = {
        shadow: {
          subtle: {
            $type: "shadow",
            $value: {
              offsetX: { value: 0, unit: "px" },
              offsetY: { value: 2, unit: "px" },
              blur: { value: 4, unit: "px" },
              spread: { value: 0, unit: "px" },
              color: { colorSpace: "srgb", channels: [0, 0, 0] },
            },
          },
        },
      };

      const result = validateDtcgTokenTree(deprecatedToken);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("deprecated 'channels'")));
    });
  });
});
