/**
 * CSS Glass & 3D Shadow Studio Engine
 * Calculates layered frosted glassmorphism properties, elevation shadows,
 * and generates CSS & Tailwind snippets.
 */

export interface GlassOptions {
  blur: number; // 0 to 40px
  opacity: number; // 0 to 100%
  borderOpacity: number; // 0 to 100%
  elevation: number; // 1 to 5
  surfaceColor: string; // hex
  borderRadius?: number; // px, default 16
}

export function hexToRgb(hex: string): { r: number; g: number; b: number; stringVal: string } {
  const cleanHex = hex.replace("#", "");
  const pr = parseInt(cleanHex.substring(0, 2), 16);
  const pg = parseInt(cleanHex.substring(2, 4), 16);
  const pb = parseInt(cleanHex.substring(4, 6), 16);
  const r = Number.isNaN(pr) ? 255 : pr;
  const g = Number.isNaN(pg) ? 255 : pg;
  const b = Number.isNaN(pb) ? 255 : pb;
  return { r, g, b, stringVal: `${r}, ${g}, ${b}` };
}

export function getElevationShadow(elevation: number): string {
  switch (elevation) {
    case 1:
      return "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
    case 2:
      return "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)";
    case 3:
      return "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.08)";
    case 4:
      return "0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)";
    case 5:
    default:
      return "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)";
  }
}

export function generateGlassmorphismCss(opts: GlassOptions): string {
  const rgb = hexToRgb(opts.surfaceColor).stringVal;
  const bgRgba = `rgba(${rgb}, ${Math.max(0, Math.min(100, opts.opacity)) / 100})`;
  const borderRgba = `rgba(${rgb}, ${Math.max(0, Math.min(100, opts.borderOpacity)) / 100})`;
  const shadow = getElevationShadow(opts.elevation);
  const radius = opts.borderRadius ?? 16;

  return `/* Glassmorphism Surface with Layered Elevation */
background: ${bgRgba};
backdrop-filter: blur(${opts.blur}px);
-webkit-backdrop-filter: blur(${opts.blur}px);
border: 1px solid ${borderRgba};
box-shadow: ${shadow};
border-radius: ${radius}px;`;
}

export function generateGlassmorphismTailwind(opts: GlassOptions): string {
  const rgb = hexToRgb(opts.surfaceColor).stringVal;
  const bgRgba = `rgba(${rgb},${opts.opacity / 100})`;
  const borderRgba = `rgba(${rgb},${opts.borderOpacity / 100})`;
  const shadow = getElevationShadow(opts.elevation).replace(/\s+/g, "_");

  return `bg-[${bgRgba}] backdrop-blur-[${opts.blur}px] border border-[${borderRgba}] rounded-2xl shadow-[${shadow}]`;
}
