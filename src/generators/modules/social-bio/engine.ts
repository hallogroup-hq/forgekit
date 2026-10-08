/**
 * Social Bio Studio Engine
 * Multi-platform character limit validation, structured bio compilation,
 * and entity extraction (handles & hashtags).
 */

export type PlatformId = "x" | "linkedin" | "github" | "instagram" | "tiktok";

export interface PlatformLimit {
  id: PlatformId;
  name: string;
  maxChars: number;
  badge: string;
  formatNote: string;
}

export const PLATFORMS: Record<PlatformId, PlatformLimit> = {
  x: {
    id: "x",
    name: "X (Twitter)",
    maxChars: 160,
    badge: "160 chars max",
    formatNote: "Punchy, value-led, handles & hashtags supported",
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn Headline",
    maxChars: 220,
    badge: "220 chars max",
    formatNote: "Authority title, company outcome, target audience",
  },
  github: {
    id: "github",
    name: "GitHub Bio",
    maxChars: 160,
    badge: "160 chars max",
    formatNote: "Tech stack, what you build, open source passion",
  },
  instagram: {
    id: "instagram",
    name: "Instagram Bio",
    maxChars: 150,
    badge: "150 chars max",
    formatNote: "Line breaks, emoji anchors, single link-in-bio prompt",
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok Bio",
    maxChars: 80,
    badge: "80 chars max",
    formatNote: "Hyper-compact, direct hook + emoji",
  },
};

export interface BioValidationResult {
  charCount: number;
  maxChars: number;
  remainingChars: number;
  isOverBudget: boolean;
}

/**
 * Compiles modular bio segments into a formatted bio string.
 */
export function compileBio(
  headline: string,
  proof: string,
  cta: string,
  separator: string = "•",
  multiline: boolean = false
): string {
  const parts = [headline.trim(), proof.trim(), cta.trim()].filter(Boolean);
  if (parts.length === 0) return "";

  if (multiline) {
    return parts.join("\n");
  }

  const sep = separator.trim() ? ` ${separator.trim()} ` : " ";
  return parts.join(sep);
}

/**
 * Validates bio length against a specific platform's character constraint.
 */
export function validateBioLength(
  bioText: string,
  platformId: PlatformId
): BioValidationResult {
  const max = PLATFORMS[platformId]?.maxChars ?? 160;
  const count = bioText.length;
  return {
    charCount: count,
    maxChars: max,
    remainingChars: max - count,
    isOverBudget: count > max,
  };
}

/**
 * Extracts mentions (@username) and hashtags (#tag) from text.
 */
export function extractEntities(text: string): { mentions: string[]; hashtags: string[] } {
  const mentions = (text.match(/@[\w.-]+/g) || []).map((m) => m.toLowerCase());
  const hashtags = (text.match(/#[\w.-]+/g) || []).map((h) => h.toLowerCase());
  return { mentions, hashtags };
}
