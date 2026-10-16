export interface RecordingOptions {
  includeMic: boolean;
  includeWebcam: boolean;
  resolution: "1080p" | "720p";
  frameRate: 30 | 60;
}

export const RESOLUTION_PRESETS = {
  "1080p": { width: 1920, height: 1080, videoBitsPerSecond: 4_500_000 },
  "720p": { width: 1280, height: 720, videoBitsPerSecond: 2_500_000 },
};

/**
 * Formats duration in seconds into MM:SS or HH:MM:SS
 */
export function formatRecordingTime(seconds: number): string {
  const s = Math.floor(seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Formats byte size into human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Selects best supported recording MIME type
 */
export function getOptimalMimeType(): string {
  if (typeof window === "undefined" || !window.MediaRecorder) {
    return "video/webm";
  }

  const types = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];

  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }

  return "video/webm";
}
