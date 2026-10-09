import { ToolMeta } from "../../types";

export const meta: ToolMeta = {
  slug: "utm-builder",
  title: "UTM Campaign Builder",
  shortTitle: "UTM Builder",
  description: "Build clean, consistent UTM tracking URLs with query/hash preservation, multi-channel batch matrix generation, and CSV export.",
  category: "growth",
  tags: ["utm", "campaign", "marketing", "analytics", "tracking", "google-analytics", "matrix", "csv"],
  icon: "Link2",
  kind: "instant",
  processing: ["client"],
  acceptedInputs: ["Target URL (with existing queries/hash)", "Source", "Medium", "Campaign", "Term", "Content"],
  outputs: ["Tagged URL", "Multi-channel Matrix Table", "RFC 4180 CSV export"],
  lifecycle: "ready",
  isPopular: true,
};
