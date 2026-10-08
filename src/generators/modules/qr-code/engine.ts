/**
 * QR Code Payload & Vector SVG Composition Engine
 * Complies with ZXing Wi-Fi specification, MeCard / vCard standards, and SVG vector standards.
 */

/**
 * Escapes special characters in Wi-Fi SSID and passwords according to ZXing / standard Wi-Fi barcode format.
 * Characters `\`, `;`, `:`, `,`, `"` must be escaped with `\`.
 */
export function escapeWifiField(str: string): string {
  if (!str) return "";
  return str.replace(/([\\;:,"])/g, "\\$1");
}

export interface WifiPayloadOptions {
  ssid: string;
  password?: string;
  encryption?: "WPA" | "WEP" | "nopass";
  hidden?: boolean;
}

export function buildWifiPayload(opts: WifiPayloadOptions): string {
  const enc = opts.encryption || "WPA";
  const escapedSsid = escapeWifiField(opts.ssid.trim());
  const escapedPass = opts.password ? escapeWifiField(opts.password) : "";
  const hiddenFlag = opts.hidden ? "true" : "false";

  if (enc === "nopass" || !escapedPass) {
    return `WIFI:T:nopass;S:${escapedSsid};H:${hiddenFlag};;`;
  }
  return `WIFI:T:${enc};S:${escapedSsid};P:${escapedPass};H:${hiddenFlag};;`;
}

export function buildWhatsappPayload(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const encodedMsg = encodeURIComponent(message.trim());
  if (!encodedMsg) {
    return `https://wa.me/${cleanPhone}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}

export interface VCardOptions {
  fullName: string;
  org?: string;
  title?: string;
  phone?: string;
  email?: string;
  url?: string;
}

export function buildVCardPayload(opts: VCardOptions): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${opts.fullName.trim()}`,
  ];
  if (opts.org?.trim()) lines.push(`ORG:${opts.org.trim()}`);
  if (opts.title?.trim()) lines.push(`TITLE:${opts.title.trim()}`);
  if (opts.phone?.trim()) lines.push(`TEL:${opts.phone.trim()}`);
  if (opts.email?.trim()) lines.push(`EMAIL:${opts.email.trim()}`);
  if (opts.url?.trim()) lines.push(`URL:${opts.url.trim()}`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

export interface SvgCompositeOptions {
  baseQrSvg: string;
  size?: number;
  frameText?: string;
  fgColor: string;
  bgColor: string;
  logoSvgUri?: string; // Data URI or raw SVG markup
}

/**
 * Composes a full vector SVG containing QR code, center logo, and optional frame banner.
 * Ensures SVG export parity with PNG canvas export!
 */
export function composeCompositeSvg(opts: SvgCompositeOptions): string {
  const { baseQrSvg, frameText, fgColor, bgColor, logoSvgUri } = opts;
  const qrSize = opts.size || 400;
  const hasFrame = Boolean(frameText && frameText.trim().length > 0);
  const frameHeight = hasFrame ? Math.round(qrSize * 0.18) : 0;
  const totalHeight = qrSize + frameHeight;
  const totalWidth = qrSize;

  // Extract path / rect content from raw QRCode SVG (strip outer <svg> and </svg>)
  const innerContent = baseQrSvg
    .replace(/^<svg[^>]*>/i, "")
    .replace(/<\/svg>$/i, "");

  let logoElements = "";
  if (logoSvgUri) {
    const logoSize = Math.round(qrSize * 0.22);
    const logoX = Math.round((qrSize - logoSize) / 2);
    const logoY = Math.round((qrSize - logoSize) / 2);
    const badgeRadius = Math.round((logoSize / 2) * 1.25);
    const centerX = Math.round(qrSize / 2);
    const centerY = Math.round(qrSize / 2);

    logoElements = `
  <!-- Center Logo Badge Background -->
  <circle cx="${centerX}" cy="${centerY}" r="${badgeRadius}" fill="${bgColor}" stroke="${fgColor}" stroke-width="2"/>
  <!-- Logo Content -->
  <image href="${logoSvgUri}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet" />`;
  }

  let frameElements = "";
  if (hasFrame && frameText) {
    const barPadding = Math.round(qrSize * 0.05);
    const barWidth = totalWidth - barPadding * 2;
    const barHeight = Math.round(frameHeight * 0.7);
    const barY = qrSize;
    const textY = barY + Math.round(barHeight / 2);
    const fontSize = Math.max(12, Math.round(qrSize * 0.045));

    frameElements = `
  <!-- Frame Banner Container -->
  <rect x="${barPadding}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="8" fill="${fgColor}" />
  <!-- Frame Banner Text -->
  <text x="${Math.round(totalWidth / 2)}" y="${textY}" fill="${bgColor}" font-family="system-ui, -apple-system, sans-serif" font-weight="bold" font-size="${fontSize}" text-anchor="middle" dominant-baseline="central">
    ${frameText.trim().toUpperCase()}
  </text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">
  <!-- Background Canvas -->
  <rect width="${totalWidth}" height="${totalHeight}" fill="${bgColor}"/>
  <!-- QR Code Matrix -->
  <g id="qr-matrix">
    ${innerContent}
  </g>${logoElements}${frameElements}
</svg>`;
}
