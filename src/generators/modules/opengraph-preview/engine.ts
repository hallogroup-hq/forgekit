/**
 * OpenGraph & SEO Social Meta Studio Engine
 * Pure deterministic validation, HTML meta tags generation,
 * Next.js App Router metadata generation, and Schema.org JSON-LD generation.
 */

export interface OpenGraphInput {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  siteName?: string;
  twitterHandle?: string;
  locale?: string;
  type?: string;
}

export interface OpenGraphAudit {
  valid: boolean;
  issues: string[];
  titleLength: number;
  titleStatus: "optimal" | "short" | "long";
  descLength: number;
  descStatus: "optimal" | "short" | "long";
  domain: string;
}

export function extractHostname(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname;
  } catch {
    return "example.com";
  }
}

export function auditOpenGraph(input: OpenGraphInput): OpenGraphAudit {
  const issues: string[] = [];
  const titleLen = (input.title || "").trim().length;
  const descLen = (input.description || "").trim().length;

  let titleStatus: "optimal" | "short" | "long" = "optimal";
  if (titleLen === 0) {
    issues.push("Page title is missing.");
    titleStatus = "short";
  } else if (titleLen < 30) {
    titleStatus = "short";
    issues.push("Title is shorter than recommended (30–60 chars).");
  } else if (titleLen > 60) {
    titleStatus = "long";
    issues.push("Title exceeds 60 characters and may be truncated by search engines.");
  }

  let descStatus: "optimal" | "short" | "long" = "optimal";
  if (descLen === 0) {
    issues.push("Meta description is missing.");
    descStatus = "short";
  } else if (descLen < 50) {
    descStatus = "short";
    issues.push("Description is shorter than recommended (50–160 chars).");
  } else if (descLen > 160) {
    descStatus = "long";
    issues.push("Description exceeds 160 characters and may be truncated on Google SERPs.");
  }

  try {
    new URL(input.url);
  } catch {
    issues.push("Canonical URL is not a valid absolute URL.");
  }

  if (input.imageUrl) {
    try {
      new URL(input.imageUrl);
    } catch {
      issues.push("Social image URL is not a valid absolute URL.");
    }
  } else {
    issues.push("No preview image provided. Rich social cards require og:image.");
  }

  return {
    valid: issues.length === 0,
    issues,
    titleLength: titleLen,
    titleStatus,
    descLength: descLen,
    descStatus,
    domain: extractHostname(input.url),
  };
}

export function generateHtmlMetaTags(input: OpenGraphInput): string {
  const title = input.title.trim();
  const desc = input.description.trim();
  const url = input.url.trim();
  const siteName = (input.siteName || "").trim();
  const img = (input.imageUrl || "").trim();
  const twitter = (input.twitterHandle || "").trim();
  const locale = input.locale?.trim() || "en_US";
  const type = input.type?.trim() || "website";

  const lines = [
    `<!-- HTML Meta Tags -->`,
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}">`,
    ``,
    `<!-- Facebook Meta Tags -->`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${desc}">`,
    `<meta property="og:locale" content="${locale}">`,
  ];

  if (siteName) {
    lines.push(`<meta property="og:site_name" content="${siteName}">`);
  }
  if (img) {
    lines.push(`<meta property="og:image" content="${img}">`);
  }

  lines.push(
    ``,
    `<!-- Twitter Meta Tags -->`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta property="twitter:domain" content="${extractHostname(url)}">`,
    `<meta property="twitter:url" content="${url}">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${desc}">`
  );

  if (img) {
    lines.push(`<meta name="twitter:image" content="${img}">`);
  }
  if (twitter) {
    lines.push(`<meta name="twitter:creator" content="${twitter}">`);
  }

  return lines.join("\n");
}

export function generateNextJsMetadata(input: OpenGraphInput): string {
  const title = JSON.stringify(input.title.trim());
  const desc = JSON.stringify(input.description.trim());
  const url = JSON.stringify(input.url.trim());
  const siteName = input.siteName ? JSON.stringify(input.siteName.trim()) : undefined;
  const img = input.imageUrl ? JSON.stringify(input.imageUrl.trim()) : undefined;
  const twitter = input.twitterHandle ? JSON.stringify(input.twitterHandle.trim()) : undefined;

  return `import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: ${title},
  description: ${desc},
  metadataBase: new URL(${url}),
  openGraph: {
    title: ${title},
    description: ${desc},
    url: ${url},
    ${siteName ? `siteName: ${siteName},` : ""}
    ${img ? `images: [\n      {\n        url: ${img},\n        width: 1200,\n        height: 630,\n        alt: ${title},\n      },\n    ],` : ""}
    locale: '${input.locale || "en_US"}',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: ${title},
    description: ${desc},
    ${img ? `images: [${img}],` : ""}
    ${twitter ? `creator: ${twitter},` : ""}
  },
};`;
}

export function generateJsonLd(input: OpenGraphInput): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.siteName || input.title,
    url: input.url,
    description: input.description,
    ...(input.imageUrl ? { image: input.imageUrl } : {}),
  };
  return JSON.stringify(schema, null, 2);
}
