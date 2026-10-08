/**
 * GitHub README Badge & Hero Studio Engine
 * Pure Shields.io URL builder, badge markdown/HTML generator,
 * and comprehensive README hero scaffold builder.
 */

export type BadgeStyle = "flat" | "flat-square" | "for-the-badge" | "plastic";

export interface BadgeDefinition {
  id?: string;
  label: string;
  message: string;
  color: string;
  logo?: string;
  link?: string;
  enabled?: boolean;
}

export interface ReadmeHeroOptions {
  repoName: string;
  tagline: string;
  githubUser?: string;
  badgeStyle: BadgeStyle;
  badges: BadgeDefinition[];
  features?: string[];
  license?: string;
}

/**
 * Escapes characters for Shields.io path segments:
 * '-' becomes '--', '_' becomes '__', ' ' becomes '_'
 */
export function escapeShieldsText(text: string): string {
  return encodeURIComponent(
    text
      .replace(/-/g, "--")
      .replace(/_/g, "__")
      .replace(/\s+/g, "_")
  );
}

export function buildShieldsUrl(badge: BadgeDefinition, style: BadgeStyle = "flat-square"): string {
  const encLabel = escapeShieldsText(badge.label.trim());
  const encMsg = escapeShieldsText(badge.message.trim());
  const encColor = encodeURIComponent(badge.color.trim() || "blue");

  let url = `https://img.shields.io/badge/${encLabel}-${encMsg}-${encColor}?style=${style}`;

  if (badge.logo && badge.logo.trim()) {
    url += `&logo=${encodeURIComponent(badge.logo.trim())}&logoColor=white`;
  }

  return url;
}

export function buildBadgeMarkdown(badge: BadgeDefinition, style: BadgeStyle = "flat-square"): string {
  const imgUrl = buildShieldsUrl(badge, style);
  const alt = `${badge.label}: ${badge.message}`;
  if (badge.link && badge.link.trim()) {
    return `[![${alt}](${imgUrl})](${badge.link.trim()})`;
  }
  return `![${alt}](${imgUrl})`;
}

export function buildBadgeHtml(badge: BadgeDefinition, style: BadgeStyle = "flat-square"): string {
  const imgUrl = buildShieldsUrl(badge, style);
  const alt = `${badge.label}: ${badge.message}`;
  if (badge.link && badge.link.trim()) {
    return `<a href="${badge.link.trim()}"><img src="${imgUrl}" alt="${alt}"></a>`;
  }
  return `<img src="${imgUrl}" alt="${alt}">`;
}

export function generateReadmeHero(options: ReadmeHeroOptions): string {
  const repo = options.repoName.trim() || "my-awesome-project";
  const user = options.githubUser?.trim() || "username";
  const activeBadges = options.badges.filter((b) => b.enabled !== false);
  const badgeLines = activeBadges.map((b) => buildBadgeMarkdown(b, options.badgeStyle)).join(" ");

  const features = options.features && options.features.length > 0
    ? options.features
    : [
        "⚡ Blazing Fast: Client-side compute with zero latency",
        "🔒 Private by Default: No tracking, telemetry, or server persistence",
        "📱 Responsive UI: Designed for desktop, tablet, and mobile",
        "🛠️ Production Grade: Built for real work orders and workflows",
      ];

  return `# ${repo}

> ${options.tagline.trim()}

<p align="left">
  ${badgeLines}
</p>

---

## ✨ Features

${features.map((f) => `- ${f}`).join("\n")}

## 🚀 Getting Started

\`\`\`bash
# 1. Clone the repository
git clone https://github.com/${user}/${repo}.git

# 2. Enter project directory
cd ${repo}

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
\`\`\`

## 📄 License

This project is licensed under the ${options.license || "MIT"} License.
`;
}
