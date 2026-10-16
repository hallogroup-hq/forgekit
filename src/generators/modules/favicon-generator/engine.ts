export interface IconSizeSpec {
  name: string;
  width: number;
  height: number;
  description: string;
  inIco?: boolean;
}

export const FAVICON_SPECS: IconSizeSpec[] = [
  {
    name: "favicon-16x16.png",
    width: 16,
    height: 16,
    description: "Browser tab icon (standard)",
    inIco: true,
  },
  {
    name: "favicon-32x32.png",
    width: 32,
    height: 32,
    description: "Browser tab icon (retina)",
    inIco: true,
  },
  {
    name: "favicon-48x48.png",
    width: 48,
    height: 48,
    description: "Windows desktop shortcut",
    inIco: true,
  },
  {
    name: "apple-touch-icon.png",
    width: 180,
    height: 180,
    description: "iOS home screen bookmark",
  },
  {
    name: "android-chrome-192x192.png",
    width: 192,
    height: 192,
    description: "Android home screen icon",
  },
  {
    name: "android-chrome-512x512.png",
    width: 512,
    height: 512,
    description: "PWA splash screen icon",
  },
];

export type IconShape = "square" | "rounded" | "circle";

/**
 * Builds a multi-resolution ICO file from individual PNG binary buffers
 * Follows Microsoft Icon format specifications with embedded PNG payloads.
 */
export function createIcoFromPngBuffers(
  images: { width: number; height: number; pngData: Uint8Array }[]
): Uint8Array {
  const count = images.length;
  const headerSize = 6;
  const directoryEntrySize = 16;
  const directorySize = count * directoryEntrySize;

  let totalPngSize = 0;
  for (const img of images) {
    totalPngSize += img.pngData.length;
  }

  const totalSize = headerSize + directorySize + totalPngSize;
  const buffer = new Uint8Array(totalSize);
  const view = new DataView(buffer.buffer);

  // 1. ICONDIR Header
  view.setUint16(0, 0, true); // Reserved (must be 0)
  view.setUint16(2, 1, true); // Resource type (1 = ICO)
  view.setUint16(4, count, true); // Image count

  // 2. ICONDIRENTRY list
  let currentOffset = headerSize + directorySize;
  for (let i = 0; i < count; i++) {
    const img = images[i];
    const entryOffset = headerSize + i * directoryEntrySize;

    view.setUint8(entryOffset + 0, img.width >= 256 ? 0 : img.width);
    view.setUint8(entryOffset + 1, img.height >= 256 ? 0 : img.height);
    view.setUint8(entryOffset + 2, 0); // Color count (0 = >= 8bpp)
    view.setUint8(entryOffset + 3, 0); // Reserved
    view.setUint16(entryOffset + 4, 1, true); // Color planes
    view.setUint16(entryOffset + 6, 32, true); // Bits per pixel
    view.setUint32(entryOffset + 8, img.pngData.length, true); // Size of image data
    view.setUint32(entryOffset + 12, currentOffset, true); // Image data offset

    // Copy PNG bytes into payload section
    buffer.set(img.pngData, currentOffset);
    currentOffset += img.pngData.length;
  }

  return buffer;
}

/**
 * Generates site.webmanifest JSON string
 */
export function generateWebManifest(
  appName: string = "App",
  shortName: string = "App",
  themeColor: string = "#09090b",
  bgColor: string = "#ffffff"
): string {
  const manifest = {
    name: appName,
    short_name: shortName,
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    theme_color: themeColor,
    background_color: bgColor,
    display: "standalone",
  };
  return JSON.stringify(manifest, null, 2);
}

/**
 * Generates HTML <link> tags to copy paste into index.html / layout.tsx
 */
export function generateHtmlHeadSnippet(): string {
  return [
    `<link rel="icon" type="image/x-icon" href="/favicon.ico">`,
    `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">`,
    `<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">`,
    `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`,
    `<link rel="manifest" href="/site.webmanifest">`,
  ].join("\n");
}
