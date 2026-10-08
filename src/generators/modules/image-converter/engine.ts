/**
 * Image Converter & Compressor Engine
 * Format resolution, compression profiles, and savings calculations
 */

export type ImageTargetFormat = "image/webp" | "image/jpeg" | "image/png";

export interface CompressionProfile {
  name: string;
  label: string;
  quality: number; // 0.1 to 1.0
  description: string;
}

export const COMPRESSION_PROFILES: Record<string, CompressionProfile> = {
  balanced: {
    name: "balanced",
    label: "Balanced (Recommended)",
    quality: 0.75,
    description: "Ideal balance of high visual fidelity with significant file size reduction.",
  },
  high: {
    name: "high",
    label: "High Quality (Minimal Loss)",
    quality: 0.9,
    description: "Nearly imperceptible compression artifacting for portfolio and hero images.",
  },
  aggressive: {
    name: "aggressive",
    label: "Aggressive (Smallest File)",
    quality: 0.5,
    description: "Maximum payload compression for fast mobile loading or high-latency networks.",
  },
};

export function getExtensionForMime(mime: ImageTargetFormat): string {
  switch (mime) {
    case "image/webp":
      return "webp";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    default:
      return "webp";
  }
}

export function calculateEstimatedSavings(
  originalBytes: number,
  newBytes: number
): {
  savedBytes: number;
  savingsPercentage: number;
  isSmaller: boolean;
} {
  const savedBytes = Math.max(0, originalBytes - newBytes);
  const diff = ((originalBytes - newBytes) / Math.max(1, originalBytes)) * 100;
  const savingsPercentage = Math.round(diff);
  return {
    savedBytes,
    savingsPercentage: Math.abs(savingsPercentage),
    isSmaller: newBytes < originalBytes,
  };
}
