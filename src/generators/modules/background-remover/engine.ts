export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface RemovalOptions {
  mode: "contiguous" | "global";
  targetColor: ColorRGB;
  tolerance: number; // 1 to 100 (percentage)
  feather: number; // 0 to 50 (smooth transition zone)
  defringe: boolean; // Cleans background color spill on borders
  startPoint?: { x: number; y: number } | null; // For click-to-pick contiguous fill
}

/**
 * Calculates perceptual color distance between two RGB colors using the Redmean formula.
 * Normalizes output to [0, 100] scale.
 */
export function colorDistanceRedmean(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  const rmean = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;

  const distSq =
    (2 + rmean / 256) * dr * dr +
    4 * dg * dg +
    (2 + (255 - rmean) / 256) * db * db;

  const dist = Math.sqrt(distSq);
  // Max possible redmean distance is ~765. Normalizing to 0..100
  return Math.min(100, (dist / 7.65));
}

/**
 * Automatically inspects perimeter and corners of image to sample dominant background color
 */
export function detectDominantCornerColor(
  data: Uint8ClampedArray,
  width: number,
  height: number
): ColorRGB {
  const samples: ColorRGB[] = [];
  const stepX = Math.max(1, Math.floor(width / 20));
  const stepY = Math.max(1, Math.floor(height / 20));

  // Sample top and bottom borders
  for (let x = 0; x < width; x += stepX) {
    const idxTop = (0 * width + x) * 4;
    samples.push({ r: data[idxTop], g: data[idxTop + 1], b: data[idxTop + 2] });

    const idxBottom = ((height - 1) * width + x) * 4;
    samples.push({ r: data[idxBottom], g: data[idxBottom + 1], b: data[idxBottom + 2] });
  }

  // Sample left and right borders
  for (let y = 0; y < height; y += stepY) {
    const idxLeft = (y * width + 0) * 4;
    samples.push({ r: data[idxLeft], g: data[idxLeft + 1], b: data[idxLeft + 2] });

    const idxRight = (y * width + (width - 1)) * 4;
    samples.push({ r: data[idxRight], g: data[idxRight + 1], b: data[idxRight + 2] });
  }

  if (samples.length === 0) return { r: 255, g: 255, b: 255 };

  // Calculate median RGB to ignore subject edges touching the border
  const rVals = samples.map((s) => s.r).sort((a, b) => a - b);
  const gVals = samples.map((s) => s.g).sort((a, b) => a - b);
  const bVals = samples.map((s) => s.b).sort((a, b) => a - b);

  const mid = Math.floor(samples.length / 2);
  return {
    r: rVals[mid],
    g: gVals[mid],
    b: bVals[mid],
  };
}

/**
 * Removes background globally across entire image based on target color distance
 */
export function processBackgroundRemovalGlobal(
  sourceData: ImageData,
  options: RemovalOptions
): ImageData {
  const { targetColor, tolerance, feather, defringe } = options;
  const width = sourceData.width;
  const height = sourceData.height;

  // Create clean clone
  const output = new ImageData(new Uint8ClampedArray(sourceData.data), width, height);
  const data = output.data;

  const totalPixels = width * height;
  const featherRange = Math.max(0.1, feather);

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];

    if (a === 0) continue;

    const dist = colorDistanceRedmean(r, g, b, targetColor.r, targetColor.g, targetColor.b);

    if (dist <= tolerance) {
      data[idx + 3] = 0;
    } else if (dist < tolerance + featherRange) {
      // Smooth cubic hermite transition for edge anti-aliasing
      const t = (dist - tolerance) / featherRange;
      const smoothAlphaFactor = t * t * (3 - 2 * t);
      const newAlpha = Math.round(a * smoothAlphaFactor);
      data[idx + 3] = newAlpha;

      if (defringe && newAlpha > 0 && newAlpha < 250) {
        // Suppress background color contamination on edge pixels
        const weight = 1 - t;
        data[idx] = Math.max(0, Math.min(255, Math.round((r - targetColor.r * weight) / Math.max(0.1, t))));
        data[idx + 1] = Math.max(0, Math.min(255, Math.round((g - targetColor.g * weight) / Math.max(0.1, t))));
        data[idx + 2] = Math.max(0, Math.min(255, Math.round((b - targetColor.b * weight) / Math.max(0.1, t))));
      }
    }
  }

  return output;
}

/**
 * Removes background contiguously (Magic Wand Flood-Fill)
 * Starts from image perimeter or user-clicked coordinate.
 * Prevents erasing similar-colored elements inside the subject!
 */
export function processBackgroundRemovalContiguous(
  sourceData: ImageData,
  options: RemovalOptions
): ImageData {
  const { targetColor, tolerance, feather, defringe, startPoint } = options;
  const width = sourceData.width;
  const height = sourceData.height;
  const totalPixels = width * height;

  const output = new ImageData(new Uint8ClampedArray(sourceData.data), width, height);
  const data = output.data;

  const visited = new Uint8Array(totalPixels);
  const maxThreshold = tolerance + Math.max(0.1, feather);
  const featherRange = Math.max(0.1, feather);

  // Fast queue for BFS flood-fill
  const queue = new Int32Array(totalPixels);
  let queueStart = 0;
  let queueEnd = 0;

  // Initialize seed points
  if (startPoint && startPoint.x >= 0 && startPoint.x < width && startPoint.y >= 0 && startPoint.y < height) {
    const seedIdx = startPoint.y * width + startPoint.x;
    queue[queueEnd++] = seedIdx;
    visited[seedIdx] = 1;
  } else {
    // Seed all 4 borders
    for (let x = 0; x < width; x++) {
      const topIdx = 0 * width + x;
      const botIdx = (height - 1) * width + x;
      if (!visited[topIdx]) {
        queue[queueEnd++] = topIdx;
        visited[topIdx] = 1;
      }
      if (!visited[botIdx]) {
        queue[queueEnd++] = botIdx;
        visited[botIdx] = 1;
      }
    }
    for (let y = 0; y < height; y++) {
      const leftIdx = y * width + 0;
      const rightIdx = y * width + (width - 1);
      if (!visited[leftIdx]) {
        queue[queueEnd++] = leftIdx;
        visited[leftIdx] = 1;
      }
      if (!visited[rightIdx]) {
        queue[queueEnd++] = rightIdx;
        visited[rightIdx] = 1;
      }
    }
  }

  // BFS Flood-fill
  while (queueStart < queueEnd) {
    const currIdx = queue[queueStart++];
    const cx = currIdx % width;
    const cy = Math.floor(currIdx / width);

    const pIdx = currIdx * 4;
    const r = data[pIdx];
    const g = data[pIdx + 1];
    const b = data[pIdx + 2];
    const a = data[pIdx + 3];

    if (a === 0) continue;

    const dist = colorDistanceRedmean(r, g, b, targetColor.r, targetColor.g, targetColor.b);

    if (dist <= maxThreshold) {
      if (dist <= tolerance) {
        data[pIdx + 3] = 0;
      } else {
        const t = (dist - tolerance) / featherRange;
        const smoothAlpha = Math.round(a * (t * t * (3 - 2 * t)));
        data[pIdx + 3] = smoothAlpha;

        if (defringe && smoothAlpha > 0 && smoothAlpha < 250) {
          const weight = 1 - t;
          data[pIdx] = Math.max(0, Math.min(255, Math.round((r - targetColor.r * weight) / Math.max(0.1, t))));
          data[pIdx + 1] = Math.max(0, Math.min(255, Math.round((g - targetColor.g * weight) / Math.max(0.1, t))));
          data[pIdx + 2] = Math.max(0, Math.min(255, Math.round((b - targetColor.b * weight) / Math.max(0.1, t))));
        }
      }

      // Check 4-connected neighbors
      // Top
      if (cy > 0) {
        const nIdx = (cy - 1) * width + cx;
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          queue[queueEnd++] = nIdx;
        }
      }
      // Bottom
      if (cy < height - 1) {
        const nIdx = (cy + 1) * width + cx;
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          queue[queueEnd++] = nIdx;
        }
      }
      // Left
      if (cx > 0) {
        const nIdx = cy * width + (cx - 1);
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          queue[queueEnd++] = nIdx;
        }
      }
      // Right
      if (cx < width - 1) {
        const nIdx = cy * width + (cx + 1);
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          queue[queueEnd++] = nIdx;
        }
      }
    }
  }

  return output;
}

/**
 * Applies manual eraser or restore brush strokes to image data
 */
export function applyBrushStroke(
  currentData: ImageData,
  originalData: ImageData,
  centerX: number,
  centerY: number,
  radius: number,
  mode: "erase" | "restore"
): void {
  const width = currentData.width;
  const height = currentData.height;
  const data = currentData.data;
  const origData = originalData.data;

  const minX = Math.max(0, Math.floor(centerX - radius));
  const maxX = Math.min(width - 1, Math.ceil(centerX + radius));
  const minY = Math.max(0, Math.floor(centerY - radius));
  const maxY = Math.min(height - 1, Math.ceil(centerY + radius));

  const rSq = radius * radius;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distSq = dx * dx + dy * dy;

      if (distSq <= rSq) {
        const idx = (y * width + x) * 4;
        const dist = Math.sqrt(distSq);
        const falloff = Math.max(0, 1 - dist / radius);

        if (mode === "erase") {
          data[idx + 3] = Math.round(data[idx + 3] * (1 - falloff));
        } else {
          // Restore from original data
          const targetAlpha = origData[idx + 3];
          const currAlpha = data[idx + 3];
          const restoredAlpha = Math.round(currAlpha + (targetAlpha - currAlpha) * falloff);

          data[idx] = Math.round(data[idx] * (1 - falloff) + origData[idx] * falloff);
          data[idx + 1] = Math.round(data[idx + 1] * (1 - falloff) + origData[idx + 1] * falloff);
          data[idx + 2] = Math.round(data[idx + 2] * (1 - falloff) + origData[idx + 2] * falloff);
          data[idx + 3] = restoredAlpha;
        }
      }
    }
  }
}

/**
 * Trims transparent outer edges so downloaded PNG has clean bounding box
 */
export function autoCropTransparentEdges(imageData: ImageData, padding = 4): ImageData {
  const { width, height, data } = imageData;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let hasVisiblePixels = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 5) {
        hasVisiblePixels = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasVisiblePixels) return imageData;

  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  const cropW = Math.max(1, maxX - minX + 1);
  const cropH = Math.max(1, maxY - minY + 1);

  const cropped = new ImageData(cropW, cropH);
  const cData = cropped.data;

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcIdx = ((minY + y) * width + (minX + x)) * 4;
      const destIdx = (y * cropW + x) * 4;
      cData[destIdx] = data[srcIdx];
      cData[destIdx + 1] = data[srcIdx + 1];
      cData[destIdx + 2] = data[srcIdx + 2];
      cData[destIdx + 3] = data[srcIdx + 3];
    }
  }

  return cropped;
}
