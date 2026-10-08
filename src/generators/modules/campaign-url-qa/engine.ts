/**
 * Campaign URL QA & UTM Auditor Engine
 * Audits batches of marketing URLs for tracking integrity, missing parameters,
 * casing fragmentation, syntax errors, and provides auto-fix capabilities.
 */

export type QaSeverity = "valid" | "warning" | "error";

export interface UrlIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
}

export interface QaReportItem {
  id: string;
  originalUrl: string;
  normalizedUrl: string;
  status: QaSeverity;
  issues: UrlIssue[];
  utm: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

export interface BatchQaSummary {
  total: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  healthScorePercent: number;
  items: QaReportItem[];
}

const STANDARD_MEDIUMS = new Set([
  "cpc",
  "cpm",
  "paid-social",
  "organic-social",
  "email",
  "newsletter",
  "referral",
  "affiliate",
  "display",
  "banner",
  "qr",
  "video",
  "podcast",
]);

/**
 * Audits a single URL string for UTM tracking issues.
 */
export function auditCampaignUrl(rawUrl: string, id = "1"): QaReportItem {
  const trimmed = rawUrl.trim();
  const issues: UrlIssue[] = [];

  if (!trimmed) {
    return {
      id,
      originalUrl: rawUrl,
      normalizedUrl: "",
      status: "error",
      issues: [{ severity: "error", code: "EMPTY_URL", message: "URL is empty" }],
      utm: {},
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return {
      id,
      originalUrl: rawUrl,
      normalizedUrl: trimmed,
      status: "error",
      issues: [{ severity: "error", code: "MALFORMED_URL", message: "Invalid URL syntax" }],
      utm: {},
    };
  }

  const searchParams = parsed.searchParams;

  // Check duplicate keys by counting occurrences in search string
  const rawQuery = parsed.search.slice(1);
  const seenKeys = new Set<string>();
  if (rawQuery) {
    for (const pair of rawQuery.split("&")) {
      const [key] = pair.split("=");
      if (key) {
        if (seenKeys.has(key)) {
          issues.push({
            severity: "error",
            code: "DUPLICATE_PARAM",
            message: `Duplicate query parameter detected: ${key}`,
          });
        }
        seenKeys.add(key);
      }
    }
  }

  const utmSource = searchParams.get("utm_source") || undefined;
  const utmMedium = searchParams.get("utm_medium") || undefined;
  const utmCampaign = searchParams.get("utm_campaign") || undefined;
  const utmTerm = searchParams.get("utm_term") || undefined;
  const utmContent = searchParams.get("utm_content") || undefined;

  // Mandatory parameter checks
  if (!utmSource) {
    issues.push({
      severity: "error",
      code: "MISSING_UTM_SOURCE",
      message: "Missing mandatory utm_source",
    });
  }
  if (!utmMedium) {
    issues.push({
      severity: "error",
      code: "MISSING_UTM_MEDIUM",
      message: "Missing mandatory utm_medium",
    });
  }
  if (!utmCampaign) {
    issues.push({
      severity: "error",
      code: "MISSING_UTM_CAMPAIGN",
      message: "Missing mandatory utm_campaign",
    });
  }

  // Casing checks (uppercase in UTM fragments reports in Google Analytics)
  const utmFields = [
    { name: "utm_source", val: utmSource },
    { name: "utm_medium", val: utmMedium },
    { name: "utm_campaign", val: utmCampaign },
  ];

  for (const field of utmFields) {
    if (field.val && /[A-Z]/.test(field.val)) {
      issues.push({
        severity: "warning",
        code: "UPPERCASE_PARAM",
        message: `${field.name} contains uppercase letters ('${field.val}'), causing report fragmentation`,
      });
    }
    if (field.val && /\s/.test(field.val)) {
      issues.push({
        severity: "warning",
        code: "UNENCODED_SPACE",
        message: `${field.name} contains raw whitespace`,
      });
    }
  }

  // Standard medium check
  if (utmMedium && !STANDARD_MEDIUMS.has(utmMedium.toLowerCase())) {
    issues.push({
      severity: "warning",
      code: "NON_STANDARD_MEDIUM",
      message: `utm_medium '${utmMedium}' is non-standard (recommended: cpc, email, paid-social, referral)`,
    });
  }

  // Determine overall item status
  let status: QaSeverity = "valid";
  if (issues.some((i) => i.severity === "error")) {
    status = "error";
  } else if (issues.some((i) => i.severity === "warning")) {
    status = "warning";
  }

  // Auto-normalized URL candidate
  const cleanUrl = new URL(parsed.toString());
  if (utmSource) cleanUrl.searchParams.set("utm_source", utmSource.trim().toLowerCase().replace(/\s+/g, "-"));
  if (utmMedium) cleanUrl.searchParams.set("utm_medium", utmMedium.trim().toLowerCase().replace(/\s+/g, "-"));
  if (utmCampaign) cleanUrl.searchParams.set("utm_campaign", utmCampaign.trim().toLowerCase().replace(/\s+/g, "-"));
  if (utmTerm) cleanUrl.searchParams.set("utm_term", utmTerm.trim().toLowerCase().replace(/\s+/g, "-"));
  if (utmContent) cleanUrl.searchParams.set("utm_content", utmContent.trim().toLowerCase().replace(/\s+/g, "-"));

  return {
    id,
    originalUrl: trimmed,
    normalizedUrl: cleanUrl.toString(),
    status,
    issues,
    utm: {
      source: utmSource,
      medium: utmMedium,
      campaign: utmCampaign,
      term: utmTerm,
      content: utmContent,
    },
  };
}

/**
 * Audits a batch of URLs pasted as multiline text.
 */
export function auditUrlBatch(rawText: string): BatchQaSummary {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      total: 0,
      validCount: 0,
      warningCount: 0,
      errorCount: 0,
      healthScorePercent: 100,
      items: [],
    };
  }

  const items = lines.map((line, idx) => auditCampaignUrl(line, String(idx + 1)));
  const validCount = items.filter((i) => i.status === "valid").length;
  const warningCount = items.filter((i) => i.status === "warning").length;
  const errorCount = items.filter((i) => i.status === "error").length;

  // Health score calculation: 100 - (errors * 25% + warnings * 10%)
  const penalty = (errorCount * 30 + warningCount * 10) / items.length;
  const healthScorePercent = Math.max(0, Math.round(100 - penalty));

  return {
    total: items.length,
    validCount,
    warningCount,
    errorCount,
    healthScorePercent,
    items,
  };
}

/**
 * Exports QA report items to standard CSV string.
 */
export function exportQaReportToCsv(items: QaReportItem[]): string {
  const headers = [
    "ID",
    "Status",
    "Original URL",
    "Suggested Clean URL",
    "Source",
    "Medium",
    "Campaign",
    "Issues",
  ];
  const rows = [headers.join(",")];

  for (const item of items) {
    const issueSummary = item.issues.map((i) => `[${i.severity.toUpperCase()}] ${i.message}`).join("; ");
    rows.push(
      [
        item.id,
        item.status.toUpperCase(),
        `"${item.originalUrl.replace(/"/g, '""')}"`,
        `"${item.normalizedUrl.replace(/"/g, '""')}"`,
        item.utm.source || "",
        item.utm.medium || "",
        item.utm.campaign || "",
        `"${issueSummary.replace(/"/g, '""')}"`,
      ].join(",")
    );
  }

  return rows.join("\r\n");
}
