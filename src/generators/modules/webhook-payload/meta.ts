import { ToolMeta } from "../../types";

export const meta: ToolMeta = {
  slug: "webhook-payload",
  title: "Webhook Payload Tester",
  shortTitle: "Webhook Studio",
  description: "Mock webhook payloads and signature headers for Stripe, GitHub, Shopify, Clerk, and Supabase.",
  category: "developer",
  tags: ["webhook", "payload", "signature", "stripe", "github", "clerk", "shopify", "supabase", "devops", "testing"],
  icon: "Radio",
  kind: "assisted",
  processing: ["client"],
  lifecycle: "development", // Parked: mock signature dispatch disabled until verified HMAC calculation is added
  isPopular: true,
};
