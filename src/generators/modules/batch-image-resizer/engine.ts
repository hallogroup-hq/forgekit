/**
 * Batch Image Resizer Engine
 * Pure mathematical dimension calculations and aspect ratio scaling
 */

export interface ResizeDimensions {
  width: number;
  height: number;
}

export type ResizeMode = "dimensions" | "percentage" | "fit-box" | "preset";
export type AspectFitMode = "crop-to-fill" | "fit-with-padding" | "stretch";

export interface ResizeOptions {
  mode: ResizeMode;
  targetWidth?: number;
  targetHeight?: number;
  maintainAspectRatio: boolean;
  fitMode?: AspectFitMode;
  paddingBackground?: string;
  percentage?: number;
  maxFitDimension?: number;
  preset?: string;
}

export interface CanvasDrawParams {
  canvasWidth: number;
  canvasHeight: number;
  drawX: number;
  drawY: number;
  drawWidth: number;
  drawHeight: number;
  backgroundColor: string;
}

/**
 * Computes exact canvas dimensions and drawImage positioning for Crop to Fill,
 * Fit with Padding, and Stretch modes.
 */
export function computeCanvasDrawParams(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  fitMode: AspectFitMode = "fit-with-padding",
  bgColor: string = "transparent"
): CanvasDrawParams {
  if (fitMode === "stretch") {
    return {
      canvasWidth: targetWidth,
      canvasHeight: targetHeight,
      drawX: 0,
      drawY: 0,
      drawWidth: targetWidth,
      drawHeight: targetHeight,
      backgroundColor: bgColor,
    };
  }

  const srcAspect = sourceWidth / sourceHeight;
  const targetAspect = targetWidth / targetHeight;

  if (fitMode === "crop-to-fill") {
    // Cover: scale image so it completely fills the target canvas, centered
    let drawWidth: number;
    let drawHeight: number;

    if (srcAspect > targetAspect) {
      // Source is wider: match height, crop width sides
      drawHeight = targetHeight;
      drawWidth = Math.round(targetHeight * srcAspect);
    } else {
      // Source is taller: match width, crop height top/bottom
      drawWidth = targetWidth;
      drawHeight = Math.round(targetWidth / srcAspect);
    }

    const drawX = Math.round((targetWidth - drawWidth) / 2);
    const drawY = Math.round((targetHeight - drawHeight) / 2);

    return {
      canvasWidth: targetWidth,
      canvasHeight: targetHeight,
      drawX,
      drawY,
      drawWidth,
      drawHeight,
      backgroundColor: bgColor,
    };
  }

  // fit-with-padding (Contain): scale to fit inside, letterbox/pillarbox
  let drawWidth: number;
  let drawHeight: number;

  if (srcAspect > targetAspect) {
    drawWidth = targetWidth;
    drawHeight = Math.round(targetWidth / srcAspect);
  } else {
    drawHeight = targetHeight;
    drawWidth = Math.round(targetHeight * srcAspect);
  }

  const drawX = Math.round((targetWidth - drawWidth) / 2);
  const drawY = Math.round((targetHeight - drawHeight) / 2);

  return {
    canvasWidth: targetWidth,
    canvasHeight: targetHeight,
    drawX,
    drawY,
    drawWidth,
    drawHeight,
    backgroundColor: bgColor,
  };
}

export const RESIZE_PRESETS: Record<string, { label: string; width: number; height: number }> = {
  "social-landscape": { label: "Social Card / OG Image (1200 × 630)", width: 1200, height: 630 },
  "social-square": { label: "Instagram / Square Post (1080 × 1080)", width: 1080, height: 1080 },
  "social-story": { label: "Story / Portrait (1080 × 1920)", width: 1080, height: 1920 },
  "full-hd": { label: "Full HD 1080p (1920 × 1080)", width: 1920, height: 1080 },
  "hd-720p": { label: "HD 720p (1280 × 720)", width: 1280, height: 720 },
  "thumbnail": { label: "Thumbnail Square (150 × 150)", width: 150, height: 150 },
  "avatar": { label: "User Avatar (256 × 256)", width: 256, height: 256 },
};

export function calculateNewDimensions(
  originalWidth: number,
  originalHeight: number,
  options: ResizeOptions
): ResizeDimensions {
  if (originalWidth <= 0 || originalHeight <= 0) {
    return { width: 1, height: 1 };
  }

  const aspectRatio = originalWidth / originalHeight;

  switch (options.mode) {
    case "percentage": {
      const scale = Math.max(1, options.percentage ?? 100) / 100;
      return {
        width: Math.max(1, Math.round(originalWidth * scale)),
        height: Math.max(1, Math.round(originalHeight * scale)),
      };
    }

    case "fit-box": {
      const maxDim = Math.max(1, options.maxFitDimension ?? 1200);
      if (originalWidth <= maxDim && originalHeight <= maxDim) {
        return { width: originalWidth, height: originalHeight };
      }
      if (originalWidth > originalHeight) {
        return {
          width: maxDim,
          height: Math.max(1, Math.round(maxDim / aspectRatio)),
        };
      } else {
        return {
          width: Math.max(1, Math.round(maxDim * aspectRatio)),
          height: maxDim,
        };
      }
    }

    case "preset": {
      const preset = options.preset ? RESIZE_PRESETS[options.preset] : null;
      if (!preset) return { width: originalWidth, height: originalHeight };

      // If user selected explicit fit mode (Crop to Fill or Fit with Padding or Stretch),
      // the canvas must match the exact preset dimensions!
      if (options.fitMode) {
        return { width: preset.width, height: preset.height };
      }

      if (options.maintainAspectRatio) {
        const scaleW = preset.width / originalWidth;
        const scaleH = preset.height / originalHeight;
        const scale = Math.min(scaleW, scaleH);
        return {
          width: Math.max(1, Math.round(originalWidth * scale)),
          height: Math.max(1, Math.round(originalHeight * scale)),
        };
      }
      return { width: preset.width, height: preset.height };
    }

    case "dimensions":
    default: {
      const targetW = options.targetWidth ?? originalWidth;
      const targetH = options.targetHeight ?? originalHeight;

      if (!options.maintainAspectRatio) {
        return {
          width: Math.max(1, Math.round(targetW)),
          height: Math.max(1, Math.round(targetH)),
        };
      }

      if (options.targetWidth && !options.targetHeight) {
        return {
          width: Math.max(1, Math.round(options.targetWidth)),
          height: Math.max(1, Math.round(options.targetWidth / aspectRatio)),
        };
      }

      if (options.targetHeight && !options.targetWidth) {
        return {
          width: Math.max(1, Math.round(options.targetHeight * aspectRatio)),
          height: Math.max(1, Math.round(options.targetHeight)),
        };
      }

      return {
        width: Math.max(1, Math.round(targetW)),
        height: Math.max(1, Math.round(targetW / aspectRatio)),
      };
    }
  }
}
