import { ToolMeta } from "../../types";

export const meta: ToolMeta = {
  slug: "whatsapp-link",
  title: "WhatsApp Direct Link",
  shortTitle: "WhatsApp Link",
  description: "Create direct wa.me chat links with country dial codes, prefilled messages, branded QR codes, and website HTML button snippets.",
  category: "growth",
  tags: ["whatsapp", "wa.me", "chat", "link", "generator", "qr", "marketing", "sales", "customer-service"],
  icon: "MessageCircle",
  kind: "instant",
  processing: ["client"],
  acceptedInputs: ["Country code", "Phone number", "Pre-filled message template"],
  outputs: ["wa.me URL", "1-Click Direct Chat", "PNG QR Code", "Embed HTML Button"],
  lifecycle: "ready",
  isPopular: true,
  isNew: true,
};
