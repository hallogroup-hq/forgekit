export type DeviceType = "iphone" | "android" | "macbook" | "browser" | "clay";

export type BackgroundPreset =
  | "transparent"
  | "zinc-gradient"
  | "slate-gradient"
  | "dark-radial"
  | "pure-black"
  | "pure-white"
  | "pearl-soft";

export type ShadowStyle = "none" | "subtle" | "deep" | "crisp";

export interface MockupConfig {
  device: DeviceType;
  background: BackgroundPreset;
  padding: number;
  shadow: ShadowStyle;
  deviceColor: "dark" | "silver";
  showAddressBar?: boolean;
  browserUrl?: string;
}

export interface DeviceSpec {
  name: string;
  screenWidth: number;
  screenHeight: number;
  borderRadius: number;
  outerBorderWidth: number;
  aspectRatio: number;
}

export const DEVICE_SPECS: Record<DeviceType, DeviceSpec> = {
  iphone: {
    name: "iPhone 16 Pro",
    screenWidth: 400,
    screenHeight: 840,
    borderRadius: 54,
    outerBorderWidth: 8,
    aspectRatio: 400 / 840,
  },
  android: {
    name: "Pixel Minimal",
    screenWidth: 400,
    screenHeight: 860,
    borderRadius: 36,
    outerBorderWidth: 6,
    aspectRatio: 400 / 860,
  },
  macbook: {
    name: "MacBook Pro",
    screenWidth: 960,
    screenHeight: 600,
    borderRadius: 16,
    outerBorderWidth: 12,
    aspectRatio: 960 / 600,
  },
  browser: {
    name: "Browser Window",
    screenWidth: 920,
    screenHeight: 580,
    borderRadius: 12,
    outerBorderWidth: 1,
    aspectRatio: 920 / 580,
  },
  clay: {
    name: "Minimalist Slate Frame",
    screenWidth: 800,
    screenHeight: 520,
    borderRadius: 20,
    outerBorderWidth: 10,
    aspectRatio: 800 / 520,
  },
};

export const BACKGROUND_PRESETS: { id: BackgroundPreset; label: string; css: string }[] = [
  {
    id: "transparent",
    label: "Transparent",
    css: "transparent",
  },
  {
    id: "zinc-gradient",
    label: "Zinc Noir",
    css: "linear-gradient(135deg, #18181b 0%, #09090b 100%)",
  },
  {
    id: "slate-gradient",
    label: "Deep Slate",
    css: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
  },
  {
    id: "dark-radial",
    label: "Studio Glow",
    css: "radial-gradient(circle at 50% 40%, #27272a 0%, #09090b 100%)",
  },
  {
    id: "pearl-soft",
    label: "Pearl Neutral",
    css: "linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 100%)",
  },
  {
    id: "pure-black",
    label: "Pure Black",
    css: "#000000",
  },
  {
    id: "pure-white",
    label: "Pure White",
    css: "#ffffff",
  },
];

export const SHADOW_PRESETS: Record<ShadowStyle, string> = {
  none: "none",
  subtle: "0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
  deep: "0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 12px 24px -8px rgba(0, 0, 0, 0.35)",
  crisp: "0 20px 0 0 rgba(0, 0, 0, 0.3)",
};

/**
 * Calculates canvas export dimensions given the device spec and configured padding
 */
export function calculateCanvasSize(
  device: DeviceType,
  padding: number,
  scale: number = 2
): { width: number; height: number; deviceWidth: number; deviceHeight: number } {
  const spec = DEVICE_SPECS[device];
  const deviceWidth = spec.screenWidth;
  // If macbook or browser, add chrome header height
  let extraHeight = 0;
  if (device === "macbook") extraHeight = 44; // base & chin
  if (device === "browser") extraHeight = 38; // titlebar
  const deviceHeight = spec.screenHeight + extraHeight;

  const width = Math.round((deviceWidth + padding * 2) * scale);
  const height = Math.round((deviceHeight + padding * 2) * scale);

  return { width, height, deviceWidth, deviceHeight };
}

/**
 * Generates initial default config
 */
export function getDefaultMockupConfig(): MockupConfig {
  return {
    device: "browser",
    background: "zinc-gradient",
    padding: 48,
    shadow: "deep",
    deviceColor: "dark",
    showAddressBar: true,
    browserUrl: "https://forgekit.dev",
  };
}
