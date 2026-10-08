/**
 * Color Contrast & WCAG Compliance Engine
 * Implements W3C WCAG 2.1 relative luminance and contrast ratio algorithms.
 */

export interface ContrastResult {
  ratio: number;
  ratioFormatted: string;
  aaNormal: boolean; // >= 4.5:1
  aaLarge: boolean; // >= 3.0:1
  aaaNormal: boolean; // >= 7.0:1
  aaaLarge: boolean; // >= 4.5:1
}

/**
 * Parses 3 or 6 digit hex to sRGB components (0 to 255).
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (clean.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return { r, g, b };
}

/**
 * Calculates W3C relative luminance of an sRGB color.
 * Reference: https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates contrast ratio between two hex colors according to WCAG 2.1.
 * Ratio = (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter color.
 */
export function calculateContrastRatio(fgHex: string, bgHex: string): ContrastResult {
  const fgRgb = hexToRgb(fgHex);
  const bgRgb = hexToRgb(bgHex);

  const l1 = getRelativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const l2 = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  const roundedRatio = Math.round(ratio * 100) / 100;

  return {
    ratio: roundedRatio,
    ratioFormatted: `${roundedRatio.toFixed(2)}:1`,
    aaNormal: roundedRatio >= 4.5,
    aaLarge: roundedRatio >= 3.0,
    aaaNormal: roundedRatio >= 7.0,
    aaaLarge: roundedRatio >= 4.5,
  };
}
