import { ToolMeta } from "../../types";

export const meta: ToolMeta = {
  slug: "qr-code",
  title: "QR Code Studio Pro (Logo, Frames, WiFi, WhatsApp)",
  shortTitle: "QR Code Studio",
  description: "Generate ultra-high resolution custom QR codes with center logos, call-to-action frames, and multi-channel payloads (URL, WiFi, WhatsApp, vCard, Crypto).",
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
