import { ToolMeta } from "../../types";

export const meta: ToolMeta = {
  slug: "campaign-url-qa",
  title: "Campaign URL QA & UTM Auditor",
  shortTitle: "Campaign URL QA",
  description: "Bulk audit spreadsheet marketing links for missing UTM tags, duplicate parameters, casing fragmentation, and export 1-click clean URLs.",
  category: "growth",
  tags: ["utm", "qa", "audit", "marketing", "analytics", "campaign", "links", "spreadsheet", "checker"],
  icon: "CheckCheck",
  kind: "instant",
  processing: ["client"],
  acceptedInputs: ["Pasted URLs (one per line)", "Spreadsheet column data", "UTM query strings"],
  outputs: ["Batch Health Score", "Detailed Issue Findings", "Auto-fixed Clean URLs", "CSV Audit Report"],
  lifecycle: "ready",
  isPopular: true,
  isNew: true,
};
