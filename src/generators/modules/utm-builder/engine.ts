/**
 * UTM Campaign Builder Engine
 * Robust URL parsing, preservation of existing query parameters & hash fragments,
 * parameter sanitization, and batch matrix generation.
 */

export interface UtmParams {
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
}

export interface UtmBuildOptions {
  autoLowercase?: boolean;
  spaceReplacement?: "-" | "_" | "+" | "%20";
}

export interface UtmResult {
  url: string;
  isValid: boolean;
  errors: string[];
}

export function sanitizeUtmValue(
  value: string,
  options: UtmBuildOptions = {}
): string {
  const { autoLowercase = true, spaceReplacement = "-" } = options;
  if (!value) return "";

  let cleaned = value.trim();
  if (spaceReplacement === "-") {
    cleaned = cleaned.replace(/\s+/g, "-");
  } else if (spaceReplacement === "_") {
    cleaned = cleaned.replace(/\s+/g, "_");
  }

  if (autoLowercase) {
    cleaned = cleaned.toLowerCase();
  }

  return cleaned;
}

/**
 * Builds a UTM tagged URL, preserving existing query parameters and hash fragments.
 */
export function buildUtmUrl(
  rawBaseUrl: string,
  params: UtmParams,
  options: UtmBuildOptions = {}
): UtmResult {
  const errors: string[] = [];

  if (!rawBaseUrl || !rawBaseUrl.trim()) {
    return { url: "", isValid: false, errors: ["Target URL is required"] };
  }

  let base = rawBaseUrl.trim();
  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    base = `https://${base}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(base);
  } catch {
    return { url: "", isValid: false, errors: ["Invalid URL format"] };
  }

  const cleanSource = sanitizeUtmValue(params.source, options);
  const cleanMedium = sanitizeUtmValue(params.medium, options);
  const cleanCampaign = sanitizeUtmValue(params.campaign, options);
  const cleanTerm = sanitizeUtmValue(params.term || "", options);
  const cleanContent = sanitizeUtmValue(params.content || "", options);

  if (!cleanSource) {
    errors.push("utm_source is recommended for standard tracking");
  }
  if (!cleanMedium) {
    errors.push("utm_medium is recommended for standard tracking");
  }
  if (!cleanCampaign) {
    errors.push("utm_campaign is recommended for standard tracking");
  }

  // Set or update UTM parameters while preserving existing other query params!
  if (cleanSource) parsed.searchParams.set("utm_source", cleanSource);
  if (cleanMedium) parsed.searchParams.set("utm_medium", cleanMedium);
  if (cleanCampaign) parsed.searchParams.set("utm_campaign", cleanCampaign);
  if (cleanTerm) parsed.searchParams.set("utm_term", cleanTerm);
  if (cleanContent) parsed.searchParams.set("utm_content", cleanContent);

  return {
    url: parsed.toString(),
    isValid: errors.length === 0,
    errors,
  };
}

export interface ChannelPreset {
  name: string;
  source: string;
  medium: string;
}

export const DEFAULT_CHANNELS: ChannelPreset[] = [
  { name: "Google Ads", source: "google", medium: "cpc" },
  { name: "Meta (FB / IG)", source: "facebook", medium: "paid-social" },
  { name: "Email Newsletter", source: "newsletter", medium: "email" },
  { name: "LinkedIn Ads", source: "linkedin", medium: "paid-social" },
  { name: "Twitter / X", source: "twitter", medium: "organic-social" },
  { name: "YouTube Sponsor", source: "youtube", medium: "video-sponsor" },
];

export interface MatrixRow {
  channel: string;
  source: string;
  medium: string;
  campaign: string;
  url: string;
}

export function buildUtmMatrix(
  rawBaseUrl: string,
  channels: ChannelPreset[],
  campaign: string,
  content?: string,
  options: UtmBuildOptions = {}
): MatrixRow[] {
  return channels.map((ch) => {
    const res = buildUtmUrl(
      rawBaseUrl,
      {
        source: ch.source,
        medium: ch.medium,
        campaign,
        content,
      },
      options
    );

    return {
      channel: ch.name,
      source: ch.source,
      medium: ch.medium,
      campaign,
      url: res.url,
    };
  });
}

/**
 * Exports matrix rows to standard RFC 4180 CSV string.
 */
export function exportMatrixToCsv(rows: MatrixRow[]): string {
  const headers = ["Channel", "Source", "Medium", "Campaign", "Target URL"];
  const csvLines = [headers.join(",")];

  for (const row of rows) {
    const escapedUrl = `"${row.url.replace(/"/g, '""')}"`;
    const escapedChannel = `"${row.channel.replace(/"/g, '""')}"`;
    csvLines.push(
      [
        escapedChannel,
        row.source,
        row.medium,
        row.campaign,
        escapedUrl,
      ].join(",")
    );
  }

  return csvLines.join("\r\n");
}
