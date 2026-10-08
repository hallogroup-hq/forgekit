/**
 * Aspect Ratio & Responsive Media Engine
 * Computes greatest common divisor (GCD), simplified aspect ratios,
 * CSS intrinsic padding-top percentages, and responsive markup snippets.
 */

export function calculateGcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x || 1;
}

export interface AspectRatioMetrics {
  width: number;
  height: number;
  simplifiedW: number;
  simplifiedH: number;
  ratioString: string;
  decimalRatio: number;
  decimalRatioFormatted: string;
  paddingTopPct: string;
}

/**
 * Computes exact aspect ratio metrics for given dimensions.
 */
export function calculateAspectRatioMetrics(
  width: number,
  height: number
): AspectRatioMetrics {
  const safeW = Math.max(Math.round(width), 1);
  const safeH = Math.max(Math.round(height), 1);
  const divisor = calculateGcd(safeW, safeH);

  const simplifiedW = safeW / divisor;
  const simplifiedH = safeH / divisor;
  const decimalRatio = safeW / safeH;
  const paddingTop = (safeH / safeW) * 100;

  return {
    width: safeW,
    height: safeH,
    simplifiedW,
    simplifiedH,
    ratioString: `${simplifiedW}:${simplifiedH}`,
    decimalRatio,
    decimalRatioFormatted: decimalRatio.toFixed(3),
    paddingTopPct: paddingTop.toFixed(3),
  };
}

/**
 * Scales one dimension while preserving the aspect ratio.
 */
export function scalePreservingRatio(
  targetValue: number,
  baseTarget: "width" | "height",
  originalWidth: number,
  originalHeight: number
): number {
  if (originalWidth <= 0 || originalHeight <= 0) return targetValue;
  if (baseTarget === "width") {
    // Return scaled height
    return Math.round(targetValue * (originalHeight / originalWidth));
  } else {
    // Return scaled width
    return Math.round(targetValue * (originalWidth / originalHeight));
  }
}

/**
 * Generates modern CSS aspect-ratio snippet and fallback intrinsic padding.
 */
export function generateCssSnippet(
  metrics: AspectRatioMetrics
): string {
  return `/* Modern CSS aspect-ratio */
.media-container {
  aspect-ratio: ${metrics.simplifiedW} / ${metrics.simplifiedH};
  width: 100%;
  max-width: ${metrics.width}px;
  object-fit: cover;
}

/* Classic Intrinsic Ratio Hack (for legacy browsers & iframes) */
.intrinsic-wrapper {
  position: relative;
  width: 100%;
  padding-top: ${metrics.paddingTopPct}%; /* (${metrics.simplifiedH} / ${metrics.simplifiedW}) * 100% */
}

.intrinsic-wrapper > iframe,
.intrinsic-wrapper > img,
.intrinsic-wrapper > video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}`;
}

/**
 * Generates Tailwind CSS utility classes.
 */
export function generateTailwindSnippet(
  metrics: AspectRatioMetrics
): string {
  let presetClass = `aspect-[${metrics.simplifiedW}/${metrics.simplifiedH}]`;
  if (metrics.simplifiedW === 16 && metrics.simplifiedH === 9) presetClass = "aspect-video";
  if (metrics.simplifiedW === 1 && metrics.simplifiedH === 1) presetClass = "aspect-square";

  return `<!-- Tailwind CSS Container -->
<div className="${presetClass} w-full max-w-[${metrics.width}px] overflow-hidden rounded-2xl relative">
  <img
    src="/path-to-image.webp"
    alt="Responsive media"
    className="w-full h-full object-cover"
    loading="lazy"
  />
</div>`;
}

/**
 * Generates responsive HTML srcset snippet.
 */
export function generateSrcsetSnippet(
  metrics: AspectRatioMetrics
): string {
  return `<!-- High-Performance Responsive HTML srcset -->
<img
  src="/images/photo-${metrics.width}.webp"
  srcset="
    /images/photo-640.webp 640w,
    /images/photo-768.webp 768w,
    /images/photo-1024.webp 1024w,
    /images/photo-1280.webp 1280w,
    /images/photo-${metrics.width}.webp ${metrics.width}w
  "
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  width="${metrics.width}"
  height="${metrics.height}"
  alt="Responsive media cover"
  loading="lazy"
  decoding="async"
  style={{ aspectRatio: "${metrics.simplifiedW} / ${metrics.simplifiedH}" }}
/>`;
}
