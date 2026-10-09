export interface ConsoleAsset {
  slug: string;
  title: string;
  category: string;
  coverImage: string;
  backdropImage: string;
  tagline: string;
  activities: {
    title: string;
    description: string;
    image: string;
  }[];
}

function getCategoryTheme(category: string): { accent: string; label: string } {
  const cat = category.toLowerCase();
  if (cat.includes("dev") || cat.includes("code") || cat.includes("vibe")) {
    return { accent: "#3b82f6", label: "DEV" };
  }
  if (cat.includes("design") || cat.includes("creat")) {
    return { accent: "#a855f7", label: "DESIGN" };
  }
  if (cat.includes("growth") || cat.includes("market")) {
    return { accent: "#10b981", label: "GROWTH" };
  }
  return { accent: "#94a3b8", label: "WORKFLOW" };
}

function createCoverSvg(title: string, category: string): string {
  const { accent, label } = getCategoryTheme(category);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f1422"/>
        <stop offset="60%" stop-color="#080c16"/>
        <stop offset="100%" stop-color="#030408"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="600" height="600" fill="url(#bg)"/>
    <circle cx="300" cy="270" r="200" fill="url(#glow)"/>
    <!-- PlayStation Corner Accents -->
    <rect x="40" y="38" width="90" height="26" rx="6" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.15"/>
    <text x="85" y="55" fill="#ffffff" fill-opacity="0.8" font-family="monospace" font-size="12" font-weight="bold" letter-spacing="2" text-anchor="middle">${label}</text>
    <text x="540" y="55" fill="#ffffff" fill-opacity="0.25" font-family="monospace" font-size="13" letter-spacing="3" text-anchor="end">○ ✕ △ □</text>
    <!-- Center Emblem -->
    <rect x="220" y="190" width="160" height="160" rx="36" fill="#000000" fill-opacity="0.45" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2"/>
    <circle cx="300" cy="270" r="38" fill="${accent}" fill-opacity="0.25"/>
    <circle cx="300" cy="270" r="14" fill="${accent}" fill-opacity="0.9"/>
    <!-- Bottom Title & Specifications -->
    <rect x="0" y="440" width="600" height="160" fill="#000000" fill-opacity="0.75"/>
    <text x="45" y="490" fill="#ffffff" fill-opacity="0.4" font-family="monospace" font-size="12" letter-spacing="2">IN-BROWSER · LOCAL</text>
    <text x="45" y="530" fill="#ffffff" font-family="sans-serif" font-size="26" font-weight="900" letter-spacing="-0.5">${title.toUpperCase().slice(0, 32)}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createBackdropSvg(category: string): string {
  const { accent } = getCategoryTheme(category);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
    <defs>
      <radialGradient id="aura" cx="75%" cy="30%" r="65%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="#04060a" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="aura2" cx="20%" cy="80%" r="55%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#04060a" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1920" height="1080" fill="#04060a"/>
    <rect width="1920" height="1080" fill="url(#aura)"/>
    <rect width="1920" height="1080" fill="url(#aura2)"/>
    <!-- PlayStation Ambient Ribbon -->
    <path d="M-200,300 C400,100 800,600 1600,200 C2000,0 2400,400 2800,250" fill="none" stroke="#ffffff" stroke-opacity="0.035" stroke-width="2.5"/>
    <path d="M-200,450 C500,250 900,750 1700,350 C2100,150 2500,550 2900,400" fill="none" stroke="#ffffff" stroke-opacity="0.02" stroke-width="1.5"/>
    <text x="1860" y="80" fill="#ffffff" fill-opacity="0.04" font-family="monospace" font-size="14" letter-spacing="6" text-anchor="end">○ ✕ △ □ · FORGEKIT</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const CONSOLE_ASSETS: Record<string, ConsoleAsset> = {
  "qr-code": {
    slug: "qr-code",
    title: "QR Code Generator",
    category: "GROWTH",
    coverImage: createCoverSvg("QR Code Generator", "GROWTH"),
    backdropImage: createBackdropSvg("GROWTH"),
    tagline: "Generate high-contrast QR codes with custom colors, frame styling, and instant SVG/PNG export.",
    activities: [
      {
        title: "Vector SVG & PNG",
        description: "Export crisp vector files or high-DPI raster images with transparent backgrounds",
        image: "",
      },
      {
        title: "Reed-Solomon Correction",
        description: "Configure error correction levels from Low (7%) up to High (30%)",
        image: "",
      },
    ],
  },
  "design-md": {
    slug: "design-md",
    title: "Design.md Inspector",
    category: "DESIGN",
    coverImage: createCoverSvg("Design.md Inspector", "DESIGN"),
    backdropImage: createBackdropSvg("DESIGN"),
    tagline: "Extract typography scales, color palettes, and layout systems from real websites or custom specifications.",
    activities: [
      {
        title: "3-Layer Architecture",
        description: "Generate structured Design Tokens, Layout Primitives, and Component Patterns",
        image: "",
      },
      {
        title: "AI Coding Context",
        description: "Export verified markdown directly compatible with Cursor, Claude Code, and Windsurf",
        image: "",
      },
    ],
  },
  "batch-image-resizer": {
    slug: "batch-image-resizer",
    title: "Batch Image Resizer",
    category: "DESIGN",
    coverImage: createCoverSvg("Batch Image Resizer", "DESIGN"),
    backdropImage: createBackdropSvg("DESIGN"),
    tagline: "Resize multiple images simultaneously to exact dimensions and download in a single ZIP package.",
    activities: [
      {
        title: "Client-Side Processing",
        description: "Runs entirely in browser memory using HTML5 Canvas with bicubic smoothing",
        image: "",
      },
      {
        title: "Batch ZIP Export",
        description: "Package all processed images without server uploads or latency",
        image: "",
      },
    ],
  },
  "image-converter": {
    slug: "image-converter",
    title: "Image Converter & Compressor",
    category: "DESIGN",
    coverImage: createCoverSvg("Image Converter", "DESIGN"),
    backdropImage: createBackdropSvg("DESIGN"),
    tagline: "Convert and compress images across WebP, JPEG, and PNG with real-time compression metrics.",
    activities: [
      {
        title: "WebP Encoding",
        description: "Modern image encoding for faster page loads with lossless or lossy quality controls",
        image: "",
      },
      {
        title: "Zero Server Upload",
        description: "All conversions happen locally without sending images to any remote server",
        image: "",
      },
    ],
  },
  "text-cleaner": {
    slug: "text-cleaner",
    title: "Text Cleaner & Formatter",
    category: "WORKFLOW",
    coverImage: createCoverSvg("Text Cleaner", "WORKFLOW"),
    backdropImage: createBackdropSvg("WORKFLOW"),
    tagline: "Strip whitespace, fix line breaks, convert casing, and deduplicate text lines instantly.",
    activities: [
      {
        title: "Case Transformation",
        description: "Convert instantly between camelCase, snake_case, kebab-case, Title Case, and UPPERCASE",
        image: "",
      },
      {
        title: "Whitespace Normalization",
        description: "Strip trailing spaces, collapse multiple blank lines, and clean tab indents",
        image: "",
      },
    ],
  },
  "csv-cleaner": {
    slug: "csv-cleaner",
    title: "CSV Data Cleaner",
    category: "DEV",
    coverImage: createCoverSvg("CSV Data Cleaner", "DEV"),
    backdropImage: createBackdropSvg("DEV"),
    tagline: "Sanitize tabular CSV data, trim columns, handle quoted delimiters, and export clean datasets.",
    activities: [
      {
        title: "Delimited Parsing",
        description: "RFC 4180 compliant CSV parser with quote escaping and auto-detected separators",
        image: "",
      },
      {
        title: "Column Filtering",
        description: "Remove duplicate rows, clean whitespace, and reorder fields with instant download",
        image: "",
      },
    ],
  },
  "bulk-filename-builder": {
    slug: "bulk-filename-builder",
    title: "Bulk File Renamer",
    category: "DEV",
    coverImage: createCoverSvg("Bulk File Renamer", "DEV"),
    backdropImage: createBackdropSvg("DEV"),
    tagline: "Generate safe batch rename rules, sequential numbering schemes, and bash/PowerShell scripts.",
    activities: [
      {
        title: "Pattern Rules",
        description: "Prefixes, suffixes, date stamps, zero-padded counters, and regex find-replace",
        image: "",
      },
      {
        title: "Shell Scripts",
        description: "Export executable bash (.sh) and PowerShell (.ps1) commands for local execution",
        image: "",
      },
    ],
  },
  "whatsapp-link": {
    slug: "whatsapp-link",
    title: "WhatsApp Direct Link",
    category: "GROWTH",
    coverImage: createCoverSvg("WhatsApp Direct Link", "GROWTH"),
    backdropImage: createBackdropSvg("GROWTH"),
    tagline: "Build sanitized wa.me click-to-chat links and QR codes with pre-filled messages.",
    activities: [
      {
        title: "Phone Normalization",
        description: "Validates country codes and strips non-numeric punctuation safely",
        image: "",
      },
      {
        title: "One-Click Share",
        description: "Generate copy-ready markdown, HTML buttons, and QR code codes",
        image: "",
      },
    ],
  },
  "campaign-url-qa": {
    slug: "campaign-url-qa",
    title: "Campaign URL QA & Auditor",
    category: "GROWTH",
    coverImage: createCoverSvg("Campaign URL QA", "GROWTH"),
    backdropImage: createBackdropSvg("GROWTH"),
    tagline: "Audit marketing URLs for UTM parameter completeness, valid formatting, and redirect chains.",
    activities: [
      {
        title: "UTM Verification",
        description: "Check for required source, medium, and campaign parameters with casing consistency",
        image: "",
      },
      {
        title: "Character Escaping",
        description: "Detect illegal spaces, unescaped characters, and duplicate query delimiters",
        image: "",
      },
    ],
  },
  "curl-converter": {
    slug: "curl-converter",
    title: "cURL to Code Converter",
    category: "DEV",
    coverImage: createCoverSvg("cURL to Code", "DEV"),
    backdropImage: createBackdropSvg("DEV"),
    tagline: "Convert raw cURL shell commands into idiomatic JavaScript, Python, Go, and Rust requests.",
    activities: [
      {
        title: "Multi-Language Output",
        description: "Native fetch(), Axios, Python requests, Go net/http, and Rust reqwest snippets",
        image: "",
      },
      {
        title: "Header Parsing",
        description: "Accurately decomposes authentication headers, cookies, and JSON request bodies",
        image: "",
      },
    ],
  },
  "regex-cheat": {
    slug: "regex-cheat",
    title: "Regex Tester & Cheatsheet",
    category: "DEV",
    coverImage: createCoverSvg("Regex Tester", "DEV"),
    backdropImage: createBackdropSvg("DEV"),
    tagline: "Evaluate regular expressions in real time with syntax explanation and quick reference patterns.",
    activities: [
      {
        title: "Live Match Inspection",
        description: "Instant highlighting of capture groups, match indices, and flags",
        image: "",
      },
      {
        title: "Common Patterns",
        description: "Curated presets for email, URLs, IPv4/IPv6, UUIDs, dates, and passwords",
        image: "",
      },
    ],
  },
  "svg-blob": {
    slug: "svg-blob",
    title: "SVG Blob & Wave Generator",
    category: "DESIGN",
    coverImage: createCoverSvg("SVG Blob & Wave", "DESIGN"),
    backdropImage: createBackdropSvg("DESIGN"),
    tagline: "Create organic organic vector shapes, smooth section dividers, and wave paths with SVG export.",
    activities: [
      {
        title: "Bézier Math",
        description: "Deterministic cubic Bézier curve calculation with configurable complexity and randomness",
        image: "",
      },
      {
        title: "Clean Markup",
        description: "Lightweight, unstyled SVG code ready to drop into React or HTML templates",
        image: "",
      },
    ],
  },
  "aspect-ratio": {
    slug: "aspect-ratio",
    title: "Aspect Ratio Calculator",
    category: "DESIGN",
    coverImage: createCoverSvg("Aspect Ratio Calculator", "DESIGN"),
    backdropImage: createBackdropSvg("DESIGN"),
    tagline: "Calculate responsive dimensions, aspect ratios, CSS padding-bottom values, and GCD ratios.",
    activities: [
      {
        title: "Standard Presets",
        description: "16:9, 4:3, 1:1, 21:9 ultra-wide, 9:16 vertical video, and custom width/height",
        image: "",
      },
      {
        title: "CSS Snippets",
        description: "Generates aspect-ratio CSS and legacy padding-bottom percentage hacks",
        image: "",
      },
    ],
  },
  "color-contrast": {
    slug: "color-contrast",
    title: "Palette Contrast Auto-Tuner",
    category: "DESIGN",
    coverImage: createCoverSvg("Palette Auto-Tuner", "DESIGN"),
    backdropImage: createBackdropSvg("DESIGN"),
    tagline: "Automatically adjust foreground and background colors to satisfy WCAG AA and AAA standards.",
    activities: [
      {
        title: "DeltaE Minimization",
        description: "Nudges lightness just enough to hit contrast thresholds while preserving hue",
        image: "",
      },
      {
        title: "Vision Deficiency Simulation",
        description: "Simulate Protanopia, Deuteranopia, Tritanopia, and Achromatopsia perception",
        image: "",
      },
    ],
  },
  "contrast-checker": {
    slug: "contrast-checker",
    title: "WCAG Contrast Checker",
    category: "DESIGN",
    coverImage: createCoverSvg("WCAG Contrast", "DESIGN"),
    backdropImage: createBackdropSvg("DESIGN"),
    tagline: "Verify text and UI element contrast ratios against WCAG 2.1 AA and AAA criteria.",
    activities: [
      {
        title: "Relative Luminance",
        description: "Exact WCAG 2.1 relative luminance formula calculation (4.5:1, 3.0:1, 7.0:1)",
        image: "",
      },
      {
        title: "Grade Ratings",
        description: "Clear pass/fail ratings for normal text, large headings, and graphical controls",
        image: "",
      },
    ],
  },
  "utm-builder": {
    slug: "utm-builder",
    title: "UTM Campaign Builder",
    category: "GROWTH",
    coverImage: createCoverSvg("UTM Campaign Builder", "GROWTH"),
    backdropImage: createBackdropSvg("GROWTH"),
    tagline: "Generate standardized Google Analytics UTM campaign tracking links with parameter presets.",
    activities: [
      {
        title: "Parameter Presets",
        description: "Quick-fill standard sources: Google Ads, Meta, Newsletter, LinkedIn, and Twitter",
        image: "",
      },
      {
        title: "Batch Generation",
        description: "Create parameter matrices across multiple channels simultaneously",
        image: "",
      },
    ],
  },
  "social-bio": {
    slug: "social-bio",
    title: "Social Bio Formatter",
    category: "GROWTH",
    coverImage: createCoverSvg("Social Bio Formatter", "GROWTH"),
    backdropImage: createBackdropSvg("GROWTH"),
    tagline: "Format and test profile bios for Twitter, LinkedIn, GitHub, and Instagram with character counters.",
    activities: [
      {
        title: "Platform Limits",
        description: "Strict character and line limit validation for Twitter (160), GitHub (160), LinkedIn",
        image: "",
      },
      {
        title: "Unicode Formatting",
        description: "Live preview across mobile card frames and desktop profile views",
        image: "",
      },
    ],
  },
  "readme-badge": {
    slug: "readme-badge",
    title: "GitHub README Badges",
    category: "DEV",
    coverImage: createCoverSvg("GitHub README Badges", "DEV"),
    backdropImage: createBackdropSvg("DEV"),
    tagline: "Generate Shields.io and custom SVG status badges for GitHub open-source repositories.",
    activities: [
      {
        title: "Popular Tech Stacks",
        description: "TypeScript, React, Next.js, Rust, Python, Docker, and MIT license badges",
        image: "",
      },
      {
        title: "Markdown & HTML",
        description: "One-click copy for Markdown READMEs, reStructuredText, or HTML markup",
        image: "",
      },
    ],
  },
  "mock-data": {
    slug: "mock-data",
    title: "Mock Data & JSON Generator",
    category: "DEV",
    coverImage: createCoverSvg("Mock Data Generator", "DEV"),
    backdropImage: createBackdropSvg("DEV"),
    tagline: "Generate realistic JSON, CSV, and SQL mock datasets for testing and database seeding.",
    activities: [
      {
        title: "Structured Schema",
        description: "Configurable fields: names, emails, UUIDs, dates, addresses, numbers, and booleans",
        image: "",
      },
      {
        title: "Multi-Format Export",
        description: "Export instant JSON arrays, raw CSV tables, or SQL INSERT statements",
        image: "",
      },
    ],
  },
  "css-glass-shadow": {
    slug: "css-glass-shadow",
    title: "CSS Glass & Shadow Generator",
    category: "DESIGN",
    coverImage: createCoverSvg("CSS Glass & Shadow", "DESIGN"),
    backdropImage: createBackdropSvg("DESIGN"),
    tagline: "Tune layered backdrop filters, subtle border highlights, and layered elevation shadows.",
    activities: [
      {
        title: "Layered Shadows",
        description: "Multi-layer box-shadow curves for realistic ambient elevation without mud",
        image: "",
      },
      {
        title: "Cross-Browser CSS",
        description: "Outputs clean backdrop-filter with webkit prefixes and fallback background colors",
        image: "",
      },
    ],
  },
  "password-passphrase": {
    slug: "password-passphrase",
    title: "Password & Passphrase Generator",
    category: "DEV",
    coverImage: createCoverSvg("Password Generator", "DEV"),
    backdropImage: createBackdropSvg("DEV"),
    tagline: "Generate cryptographic passwords and memorable Diceware passphrases using Web Crypto CSPRNG.",
    activities: [
      {
        title: "CSPRNG Security",
        description: "Uses window.crypto.getRandomValues with zero predictable PRNG bias",
        image: "",
      },
      {
        title: "Diceware Wordlists",
        description: "Generates high-entropy multi-word passphrases with custom separators",
        image: "",
      },
    ],
  },
  "uuid-nanoid": {
    slug: "uuid-nanoid",
    title: "UUID & NanoID Generator",
    category: "DEV",
    coverImage: createCoverSvg("UUID & NanoID", "DEV"),
    backdropImage: createBackdropSvg("DEV"),
    tagline: "Generate RFC 9562 UUIDv4, monotonic UUIDv7, and URL-safe NanoIDs using CSPRNG entropy.",
    activities: [
      {
        title: "Monotonic UUIDv7",
        description: "Time-ordered 128-bit identifiers with strict clock rollback protection (RFC 9562)",
        image: "",
      },
      {
        title: "Batch Generation",
        description: "Instant batch output up to 1,000 keys with uppercase and hyphen options",
        image: "",
      },
    ],
  },
  "crontab": {
    slug: "crontab",
    title: "Cron Expression Tester",
    category: "DEV",
    coverImage: createCoverSvg("Cron Expression Tester", "DEV"),
    backdropImage: createBackdropSvg("DEV"),
    tagline: "Translate cron expressions into plain English schedules and calculate upcoming trigger dates.",
    activities: [
      {
        title: "Human Explanation",
        description: "Instant English schedule translation across minutes, hours, days, months, and weekdays",
        image: "",
      },
      {
        title: "Next Trigger Times",
        description: "Calculates the next 5 execution timestamps based on local and UTC time",
        image: "",
      },
    ],
  },
  "docker-gitignore": {
    slug: "docker-gitignore",
    title: "Dockerfile & .gitignore Builder",
    category: "DEV",
    coverImage: createCoverSvg("Docker & Gitignore", "DEV"),
    backdropImage: createBackdropSvg("DEV"),
    tagline: "Generate hardened multi-stage Dockerfiles and comprehensive .gitignore files for popular runtimes.",
    activities: [
      {
        title: "Multi-Stage Dockerfiles",
        description: "Minimal Alpine/Debian slim production builds for Node.js, Go, Python, and Rust",
        image: "",
      },
      {
        title: "Gitignore Presets",
        description: "Curated ignores for OS metadata (.DS_Store), secrets (.env*), and build artifacts",
        image: "",
      },
    ],
  },
  "hash-secret": {
    slug: "hash-secret",
    title: "Hash & Secret Key Generator",
    category: "DEV",
    coverImage: createCoverSvg("Hash & Secret Generator", "DEV"),
    backdropImage: createBackdropSvg("DEV"),
    tagline: "Calculate cryptographic hashes (SHA-256, SHA-512, MD5) and generate random secret keys.",
    activities: [
      {
        title: "Web Crypto Subscriptions",
        description: "Fast in-browser cryptographic hashing without external native libraries",
        image: "",
      },
      {
        title: "Secret Key Generation",
        description: "Random 256-bit and 512-bit hex/base64 keys for JWT and HMAC signing",
        image: "",
      },
    ],
  },
  "markdown-table": {
    slug: "markdown-table",
    title: "Markdown Table Formatter",
    category: "WORKFLOW",
    coverImage: createCoverSvg("Markdown Table", "WORKFLOW"),
    backdropImage: createBackdropSvg("WORKFLOW"),
    tagline: "Create, format, and align GitHub-flavored markdown tables with column alignment controls.",
    activities: [
      {
        title: "Spreadsheet Editing",
        description: "Interactive cell editor with row/column insertions and CSV import",
        image: "",
      },
      {
        title: "Column Alignment",
        description: "Configure left, center, or right alignment with pipe formatting",
        image: "",
      },
    ],
  },
  "opengraph-preview": {
    slug: "opengraph-preview",
    title: "OpenGraph Meta Preview",
    category: "GROWTH",
    coverImage: createCoverSvg("OpenGraph Meta Preview", "GROWTH"),
    backdropImage: createBackdropSvg("GROWTH"),
    tagline: "Test social card metadata and preview how links appear on Twitter, Facebook, LinkedIn, and Slack.",
    activities: [
      {
        title: "Multi-Platform Cards",
        description: "Pixel-accurate card rendering for Twitter Summary, Twitter Large, and Facebook feeds",
        image: "",
      },
      {
        title: "HTML Meta Tags",
        description: "Generates production `<meta property=\"og:...\" />` tags ready for `<head>` injection",
        image: "",
      },
    ],
  },
  "invoice-receipt": {
    slug: "invoice-receipt",
    title: "Invoice & Receipt Builder",
    category: "WORKFLOW",
    coverImage: createCoverSvg("Invoice & Receipt", "WORKFLOW"),
    backdropImage: createBackdropSvg("WORKFLOW"),
    tagline: "Create clean commercial invoices and purchase receipts with tax calculations and PDF print styling.",
    activities: [
      {
        title: "Automatic Line Totals",
        description: "Real-time calculation of subtotal, sales tax percentages, discounts, and total due",
        image: "",
      },
      {
        title: "Clean Print CSS",
        description: "Print-optimized stylesheet for crisp browser PDF printing without headers or margins",
        image: "",
      },
    ],
  },
  "quotation-generator": {
    slug: "quotation-generator",
    title: "Project Quotation Builder",
    category: "WORKFLOW",
    coverImage: createCoverSvg("Quotation Builder", "WORKFLOW"),
    backdropImage: createBackdropSvg("WORKFLOW"),
    tagline: "Draft formal freelance and software development proposals with milestone budgets.",
    activities: [
      {
        title: "Milestone Scoping",
        description: "Break down projects by deliverable phase, estimated hours, and hourly/fixed rates",
        image: "",
      },
      {
        title: "Terms & Payment Terms",
        description: "Standard commercial validity windows, deposit requirements, and scope disclaimers",
        image: "",
      },
    ],
  },
  "meeting-agenda": {
    slug: "meeting-agenda",
    title: "Meeting Agenda Builder",
    category: "WORKFLOW",
    coverImage: createCoverSvg("Meeting Agenda", "WORKFLOW"),
    backdropImage: createBackdropSvg("WORKFLOW"),
    tagline: "Structure productive meetings with timed agenda items, designated leaders, and action items.",
    activities: [
      {
        title: "Timeboxing Calculations",
        description: "Calculates total meeting duration and per-topic time allocations automatically",
        image: "",
      },
      {
        title: "Markdown Export",
        description: "Generates clean agenda templates ready to paste into Slack, Notion, or calendar invites",
        image: "",
      },
    ],
  },
  "email-signature": {
    slug: "email-signature",
    title: "Email Signature Builder",
    category: "WORKFLOW",
    coverImage: createCoverSvg("Email Signature", "WORKFLOW"),
    backdropImage: createBackdropSvg("WORKFLOW"),
    tagline: "Build clean, table-based HTML email signatures compatible with Gmail, Outlook, and Apple Mail.",
    activities: [
      {
        title: "Table-Based Layout",
        description: "Inline CSS and robust nested HTML tables that render reliably across email clients",
        image: "",
      },
      {
        title: "One-Click Copy",
        description: "Copy rich rendered HTML or raw source code directly into your email settings",
        image: "",
      },
    ],
  },
};

export function getConsoleAsset(slug: string): ConsoleAsset {
  if (CONSOLE_ASSETS[slug]) return CONSOLE_ASSETS[slug];

  const formattedTitle = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    slug,
    title: formattedTitle,
    category: "DEV",
    coverImage: createCoverSvg(formattedTitle, "DEV"),
    backdropImage: createBackdropSvg("DEV"),
    tagline: "Specialized developer workstation utility.",
    activities: [
      {
        title: "Client-Side Execution",
        description: "Runs entirely in browser memory with zero server data collection",
        image: "",
      },
      {
        title: "Instant Export",
        description: "Deterministic outputs with one-click clipboard copying and file export",
        image: "",
      },
    ],
  };
}
