/**
 * Organic SVG Blob & Wave Engine
 * Generates smooth closed quadratic Bézier curves for organic blobs
 * and responsive wave section dividers.
 */

export type ShapeKind = "blob" | "wave";
export type FillType = "linear" | "radial" | "solid";

export interface SvgShapeOptions {
  shapeKind: ShapeKind;
  pointsCount: number;
  randomness: number;
  seed: number;
  fillType: FillType;
  color1: string;
  color2: string;
  gradientAngle?: number;
}

/**
 * Deterministic PRNG from a numerical seed.
 */
function createPrng(seed: number) {
  let s = Math.abs(seed) || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Generates a smooth, closed organic blob path using midpoint quadratic curves.
 */
export function generateBlobPath(
  pointsCount: number,
  randomness: number,
  seed: number
): string {
  const safePoints = Math.max(3, Math.min(16, pointsCount));
  const safeRandom = Math.max(0, Math.min(100, randomness));
  const size = 500;
  const center = size / 2;
  const baseRadius = 180;
  const maxVariance = baseRadius * (safeRandom / 100);

  const random = createPrng(seed);
  const points: { x: number; y: number }[] = [];
  const angleStep = (Math.PI * 2) / safePoints;

  for (let i = 0; i < safePoints; i++) {
    const angle = i * angleStep;
    const offset = (random() - 0.5) * 2 * maxVariance;
    const r = baseRadius + offset;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    points.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }

  const n = points.length;
  const midpoints: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const next = points[(i + 1) % n];
    midpoints.push({
      x: (points[i].x + next.x) / 2,
      y: (points[i].y + next.y) / 2,
    });
  }

  let d = `M ${midpoints[0].x} ${midpoints[0].y}`;
  for (let i = 0; i < n; i++) {
    const nextPt = points[(i + 1) % n];
    const nextMid = midpoints[(i + 1) % n];
    d += ` Q ${nextPt.x} ${nextPt.y}, ${nextMid.x} ${nextMid.y}`;
  }
  d += " Z";
  return d;
}

/**
 * Generates an organic wave section divider path.
 */
export function generateWavePath(
  pointsCount: number,
  randomness: number,
  seed: number
): string {
  const safePoints = Math.max(3, Math.min(20, pointsCount));
  const safeRandom = Math.max(0, Math.min(100, randomness));
  const width = 1200;
  const height = 400;
  const baseHeight = 220;
  const maxVariance = 100 * (safeRandom / 100);

  const random = createPrng(seed);
  const step = width / (safePoints - 1);
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < safePoints; i++) {
    const x = i * step;
    const y = baseHeight + (random() - 0.5) * 2 * maxVariance;
    points.push({ x: Math.round(x), y: Math.round(y) });
  }

  let d = `M 0 ${height} L 0 ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const cpX = (points[i].x + points[i + 1].x) / 2;
    const cpY = points[i].y;
    d += ` Q ${cpX} ${cpY}, ${points[i + 1].x} ${points[i + 1].y}`;
  }
  d += ` L ${width} ${height} Z`;
  return d;
}

/**
 * Generates raw valid SVG XML markup.
 */
export function generateSvgMarkup(opts: SvgShapeOptions): string {
  const isBlob = opts.shapeKind === "blob";
  const pathD = isBlob
    ? generateBlobPath(opts.pointsCount, opts.randomness, opts.seed)
    : generateWavePath(opts.pointsCount, opts.randomness, opts.seed);

  const viewBox = isBlob ? "0 0 500 500" : "0 0 1200 400";
  const gradId = `forgekit-${opts.shapeKind}-grad`;

  let fillAttr = opts.color1;
  let defs = "";

  if (opts.fillType === "linear") {
    fillAttr = `url(#${gradId})`;
    defs = `<defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${opts.color1}" />
      <stop offset="100%" stop-color="${opts.color2}" />
    </linearGradient>
  </defs>`;
  } else if (opts.fillType === "radial") {
    fillAttr = `url(#${gradId})`;
    defs = `<defs>
    <radialGradient id="${gradId}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${opts.color1}" />
      <stop offset="100%" stop-color="${opts.color2}" />
    </radialGradient>
  </defs>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%">
  ${defs}
  <path d="${pathD}" fill="${fillAttr}" />
</svg>`;
}
