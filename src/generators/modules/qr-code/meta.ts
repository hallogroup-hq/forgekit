import { ToolMeta } from "../../types";

export const meta: ToolMeta = {
  slug: "qr-code",
  title: "QR Code Generator",
  shortTitle: "QR Code",
  description: "Generate high-contrast custom QR codes with logos, frames, and multi-channel payloads (URL, WiFi, WhatsApp, vCard).",
  category: "growth",
  tags: ["qr", "wifi", "whatsapp", "vcard", "crypto", "logo", "generator", "png", "svg"],
  icon: "QrCode",
  kind: "instant",
  processing: ["client"],
  acceptedInputs: ["URL", "Wi-Fi credentials", "WhatsApp phone & text", "vCard info", "Plain text"],
  outputs: ["High-Res PNG (up to 4096px)", "Vector SVG (with frame & logo)", "Raw payload"],
  lifecycle: "ready",
  isPopular: true,
  isNew: true,
};
