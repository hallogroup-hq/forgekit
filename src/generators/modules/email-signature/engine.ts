/**
 * Email Signature Engine
 * Cross-client HTML table generator compliant with Gmail, Outlook, and Apple Mail.
 * Enforces inline styles, table cells, zero CSS inheritance dependencies, and HTML entity escaping.
 */

export interface EmailSignatureData {
  fullName: string;
  jobTitle: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  avatarUrl?: string;
  accentColor?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
}

export type SignatureLayout = "modern-split" | "compact" | "corporate";

/**
 * Escapes HTML characters to prevent malformed tables or script injection.
 */
export function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Cleans web links and handles missing schemes.
 */
export function cleanUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Returns display hostname or path without https:// protocol.
 */
export function formatDisplayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}

/**
 * Generates email-client compatible HTML table markup based on layout style.
 */
export function generateEmailSignatureHtml(
  data: EmailSignatureData,
  layout: SignatureLayout = "modern-split"
): string {
  const accent = data.accentColor || "#2563eb";
  const name = escapeHtml(data.fullName || "Your Name");
  const title = escapeHtml(data.jobTitle || "Your Title");
  const company = escapeHtml(data.company || "Company Name");
  const email = escapeHtml(data.email || "");
  const phone = escapeHtml(data.phone || "");
  const website = cleanUrl(data.website || "");
  const displayWebsite = escapeHtml(formatDisplayUrl(website));
  const avatar = data.avatarUrl?.trim() || "";

  const fontStack =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  // Build social links HTML
  const socialItems: string[] = [];
  if (data.linkedin?.trim()) {
    socialItems.push(
      `<a href="${cleanUrl(data.linkedin)}" style="color: ${accent}; text-decoration: none; font-weight: 600; font-size: 11px; margin-right: 8px;">LinkedIn</a>`
    );
  }
  if (data.github?.trim()) {
    socialItems.push(
      `<a href="${cleanUrl(data.github)}" style="color: #334155; text-decoration: none; font-weight: 600; font-size: 11px; margin-right: 8px;">GitHub</a>`
    );
  }
  if (data.twitter?.trim()) {
    socialItems.push(
      `<a href="${cleanUrl(data.twitter)}" style="color: #0284c7; text-decoration: none; font-weight: 600; font-size: 11px;">X (Twitter)</a>`
    );
  }
  const socialsHtml =
    socialItems.length > 0
      ? `<div style="margin-top: 8px; font-family: ${fontStack};">${socialItems.join(" ")}</div>`
      : "";

  if (layout === "compact") {
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${fontStack}; color: #1e293b; font-size: 12px; line-height: 1.4;">
  <tr>
    <td style="vertical-align: middle; padding-right: 12px;">
      ${avatar ? `<img src="${avatar}" alt="${name}" width="48" height="48" style="border-radius: 50%; display: block; object-fit: cover;" />` : ""}
    </td>
    <td style="vertical-align: middle;">
      <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${name} <span style="font-weight: 400; color: #64748b;">| ${title}</span></div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
        <span style="font-weight: 600; color: ${accent};">${company}</span>
        ${email ? ` &bull; <a href="mailto:${email}" style="color: #475569; text-decoration: none;">${email}</a>` : ""}
        ${phone ? ` &bull; <a href="tel:${phone}" style="color: #475569; text-decoration: none;">${phone}</a>` : ""}
        ${website ? ` &bull; <a href="${website}" style="color: ${accent}; text-decoration: none;">${displayWebsite}</a>` : ""}
      </div>
      ${socialsHtml}
    </td>
  </tr>
</table>`;
  }

  if (layout === "corporate") {
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${fontStack}; color: #1e293b; font-size: 12px; line-height: 1.4; max-width: 450px;">
  <tr>
    <td style="padding-bottom: 8px; border-bottom: 2px solid ${accent};">
      <div style="font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em;">${name}</div>
      <div style="font-size: 12px; font-weight: 600; color: ${accent}; margin-top: 2px;">${title} &bull; <span style="color: #64748b; font-weight: 500;">${company}</span></div>
    </td>
  </tr>
  <tr>
    <td style="padding-top: 8px; font-size: 11px; color: #475569; line-height: 1.6;">
      ${email ? `<div><strong style="color: #0f172a;">Email:</strong> <a href="mailto:${email}" style="color: #475569; text-decoration: none;">${email}</a></div>` : ""}
      ${phone ? `<div><strong style="color: #0f172a;">Direct:</strong> <a href="tel:${phone}" style="color: #475569; text-decoration: none;">${phone}</a></div>` : ""}
      ${website ? `<div><strong style="color: #0f172a;">Web:</strong> <a href="${website}" style="color: ${accent}; text-decoration: none; font-weight: 500;">${displayWebsite}</a></div>` : ""}
      ${socialsHtml}
    </td>
  </tr>
</table>`;
  }

  // Default: modern-split
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${fontStack}; color: #1e293b; font-size: 13px; line-height: 1.4;">
  <tr>
    ${
      avatar
        ? `<td style="padding-right: 16px; vertical-align: top;">
      <img src="${avatar}" alt="${name}" width="68" height="68" style="border-radius: 50%; display: block; object-fit: cover;" />
    </td>`
        : ""
    }
    <td style="border-left: 2px solid ${accent}; padding-left: 16px; vertical-align: top;">
      <div style="font-size: 15px; font-weight: bold; color: #0f172a; margin-bottom: 2px;">${name}</div>
      <div style="font-size: 12px; color: ${accent}; font-weight: 600; margin-bottom: 2px;">${title}</div>
      <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${company}</div>
      
      <div style="font-size: 11px; color: #475569; line-height: 1.6;">
        ${email ? `<div><span style="color: #94a3b8; margin-right: 4px;">✉</span><a href="mailto:${email}" style="color: #475569; text-decoration: none;">${email}</a></div>` : ""}
        ${phone ? `<div><span style="color: #94a3b8; margin-right: 4px;">☎</span><a href="tel:${phone}" style="color: #475569; text-decoration: none;">${phone}</a></div>` : ""}
        ${website ? `<div><span style="color: #94a3b8; margin-right: 4px;">🌐</span><a href="${website}" style="color: ${accent}; text-decoration: none; font-weight: 500;">${displayWebsite}</a></div>` : ""}
      </div>
      
      ${socialsHtml}
    </td>
  </tr>
</table>`;
}

/**
 * Generates plain-text representation for text/plain clipboard fallback.
 */
export function generateEmailSignaturePlainText(data: EmailSignatureData): string {
  const lines: string[] = [
    data.fullName || "Your Name",
    `${data.jobTitle || ""} | ${data.company || ""}`.trim(),
  ];

  if (data.email) lines.push(`Email: ${data.email}`);
  if (data.phone) lines.push(`Phone: ${data.phone}`);
  if (data.website) lines.push(`Website: ${cleanUrl(data.website)}`);
  if (data.linkedin) lines.push(`LinkedIn: ${cleanUrl(data.linkedin)}`);
  if (data.github) lines.push(`GitHub: ${cleanUrl(data.github)}`);

  return lines.filter(Boolean).join("\n");
}
