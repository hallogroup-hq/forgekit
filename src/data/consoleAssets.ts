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

export const CONSOLE_ASSETS: Record<string, ConsoleAsset> = {
  "qr-code": {
    slug: "qr-code",
    title: "QR Code Generator",
    category: "DESIGN",
    coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1920&q=80",
    tagline: "Generate high-contrast QR codes with custom styling and instant SVG export.",
    activities: [
      {
        title: "Preset Palettes",
        description: "Dark, neon, and high-contrast color styles",
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Vector SVG",
        description: "Infinite resolution vector downloads",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "design-md": {
    slug: "design-md",
    title: "Design.md Inspector",
    category: "DESIGN",
    coverImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80",
    tagline: "Extract typography, palette, and layout principles from any live website.",
    activities: [
      {
        title: "Live URL Crawler",
        description: "Inspect DOM styles and color hierarchies",
        image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Token Export",
        description: "Clean markdown ready for AI agents",
        image: "https://images.unsplash.com/photo-1542744094-3a31727221eb?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "prompt-optimizer": {
    slug: "prompt-optimizer",
    title: "Prompt Optimizer",
    category: "DEVELOPER",
    coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=1920&q=80",
    tagline: "Refine and structure prompts for Claude, Gemini, and GPT with zero fluff.",
    activities: [
      {
        title: "Model Dialing",
        description: "Optimized formats for coding assistants",
        image: "https://images.unsplash.com/photo-1617791160505-6f00504e3519?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Few-Shot Injection",
        description: "Structure context, constraints, and outputs",
        image: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "ai-rules": {
    slug: "ai-rules",
    title: "AI Rules Architect",
    category: "DEVELOPER",
    coverImage: "https://images.unsplash.com/photo-1617791160505-6f00504e3519?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=1920&q=80",
    tagline: "Craft custom cursor rules, Claude instructions, and agent configs.",
    activities: [
      {
        title: "Preset Library",
        description: "Next.js, Python, Rust, and Tailwind best practices",
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Anti-Slop Guard",
        description: "Eliminate repetitive boilerplate agent outputs",
        image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  character: {
    slug: "character",
    title: "Character Concept Sheet",
    category: "DESIGN",
    coverImage: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80",
    tagline: "Generate rich RPG character profiles with voice, backstory, and personality.",
    activities: [
      {
        title: "Archetype Generator",
        description: "Sci-Fi, Cyberpunk, and Dark Fantasy roles",
        image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Dialogue Profiles",
        description: "Distinct speech quirks and emotional flaws",
        image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "regex-cheat": {
    slug: "regex-cheat",
    title: "Regex Tester & Cheatsheet",
    category: "DEVELOPER",
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1920&q=80",
    tagline: "Test expressions in real-time with an instant syntax cheat sheet.",
    activities: [
      {
        title: "Live Matcher",
        description: "Zero latency match highlighting",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Common Patterns",
        description: "Emails, URLs, UUIDs, and IPv4 presets",
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "jwt-inspector": {
    slug: "jwt-inspector",
    title: "JWT Inspector",
    category: "DEVELOPER",
    coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1920&q=80",
    tagline: "Decode headers, claims, expiration dates, and verify HMAC signatures.",
    activities: [
      {
        title: "Expiry Detection",
        description: "Visual time-to-live countdowns",
        image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Local Decoding",
        description: "Zero data leaves your browser memory",
        image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "sql-schema": {
    slug: "sql-schema",
    title: "SQL Schema Generator",
    category: "DEVELOPER",
    coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80",
    tagline: "Convert natural language descriptions into Postgres, SQLite, or MySQL DDL.",
    activities: [
      {
        title: "Multi Dialect",
        description: "Postgres, SQLite, MySQL, and Supabase types",
        image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Index Automation",
        description: "Primary keys, foreign keys, and indexes",
        image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "mesh-gradient": {
    slug: "mesh-gradient",
    title: "Mesh Gradient Generator",
    category: "DESIGN",
    coverImage: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1920&q=80",
    tagline: "Design interactive multi-point CSS mesh gradients and copy clean code.",
    activities: [
      {
        title: "4-Point Canvas",
        description: "Interactive color coordinate draggers",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "CSS & SVG Export",
        description: "Zero external dependencies",
        image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "svg-blob": {
    slug: "svg-blob",
    title: "SVG Blob Generator",
    category: "DESIGN",
    coverImage: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80",
    tagline: "Sculpt organic SVG shapes with randomness seeds and smooth bezier curves.",
    activities: [
      {
        title: "Seed Randomizer",
        description: "Unique organic shapes per seed value",
        image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Complexity Dials",
        description: "Point counts from subtle to chaotic",
        image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "aspect-ratio": {
    slug: "aspect-ratio",
    title: "Aspect Ratio Calculator",
    category: "DESIGN",
    coverImage: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80",
    tagline: "Calculate exact pixel dimensions, responsive CSS padding, and video scales.",
    activities: [
      {
        title: "Cinema Presets",
        description: "16:9, 21:9 anamorphic, 9:16 vertical, and 4:3",
        image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "CSS Snippets",
        description: "aspect-ratio rules and padding-bottom hacks",
        image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "color-contrast": {
    slug: "color-contrast",
    title: "Color Contrast Checker",
    category: "DESIGN",
    coverImage: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80",
    tagline: "Test foreground and background combinations against WCAG 2.1 AA and AAA standards.",
    activities: [
      {
        title: "WCAG AA / AAA",
        description: "Instant pass/fail scoring for text and icons",
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Color Swapper",
        description: "Live adjustments with instant ratio re-calculation",
        image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "utm-builder": {
    slug: "utm-builder",
    title: "UTM Campaign Builder",
    category: "GROWTH",
    coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1920&q=80",
    tagline: "Build clean campaign tracking links with source, medium, and campaign tags.",
    activities: [
      {
        title: "Preset Channels",
        description: "Google Ads, Meta, Twitter, and Newsletter presets",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Instant Verification",
        description: "Verify encoded parameters without broken URLs",
        image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "social-bio": {
    slug: "social-bio",
    title: "Social Bio Studio",
    category: "GROWTH",
    coverImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1920&q=80",
    tagline: "Compose sharp bios for X, GitHub, LinkedIn, and Instagram with live character counts.",
    activities: [
      {
        title: "Platform Limits",
        description: "Precise character countdowns per network",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Tone Switches",
        description: "Technical, founder, creative, and witty profiles",
        image: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "copywriting-framework": {
    slug: "copywriting-framework",
    title: "Copy Framework Matrix",
    category: "GROWTH",
    coverImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1920&q=80",
    tagline: "Structure pitches using proven marketing formulas like PAS, AIDA, and BAB.",
    activities: [
      {
        title: "PAS Engine",
        description: "Problem, Agitation, and Solution clarity",
        image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Hero Hooks",
        description: "Punchy headlines without AI jargon",
        image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "readme-badge": {
    slug: "readme-badge",
    title: "README Badge Generator",
    category: "DEVELOPER",
    coverImage: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1920&q=80",
    tagline: "Generate shields.io markdown badges for tech stacks, licenses, and releases.",
    activities: [
      {
        title: "Tech Stack Shields",
        description: "React, Next.js, TypeScript, and Docker badges",
        image: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Custom Labels",
        description: "Dynamic colors, logos, and links",
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "mock-data": {
    slug: "mock-data",
    title: "Mock Data Forge",
    category: "DEVELOPER",
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80",
    tagline: "Generate realistic JSON arrays for users, products, orders, and metrics.",
    activities: [
      {
        title: "Entity Presets",
        description: "User profiles, credit cards, transactions, and addresses",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "JSON Export",
        description: "Instant array download with customizable count",
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "css-glass-shadow": {
    slug: "css-glass-shadow",
    title: "Glass & Shadow Studio",
    category: "DESIGN",
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1920&q=80",
    tagline: "Tune backdrop-blur, specular reflections, and layered box shadows in real-time.",
    activities: [
      {
        title: "Multi Layer Shadow",
        description: "Physically based diffuse ambient occlusions",
        image: "https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Glassmorphism",
        description: "Translucent materials with border highlights",
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "password-passphrase": {
    slug: "password-passphrase",
    title: "Password & Passphrase Vault",
    category: "DEVELOPER",
    coverImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1920&q=80",
    tagline: "Generate cryptographically secure passwords and memorable diceware passphrases.",
    activities: [
      {
        title: "Diceware Words",
        description: "Memorable passphrases with high entropy",
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Entropy Meter",
        description: "Bit-strength calculations and crack time estimates",
        image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "uuid-nanoid": {
    slug: "uuid-nanoid",
    title: "UUID & NanoID Generator",
    category: "DEVELOPER",
    coverImage: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80",
    tagline: "Generate batches of UUID v4, NanoID, or CUID strings with one tap.",
    activities: [
      {
        title: "Batch Mode",
        description: "Create up to 100 unique identifiers simultaneously",
        image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Multiple Formats",
        description: "UUID v4, NanoID, ULID, and short alphanumeric codes",
        image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  crontab: {
    slug: "crontab",
    title: "Crontab Guru Console",
    category: "DEVELOPER",
    coverImage: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80",
    tagline: "Build cron schedule expressions with plain-English descriptions.",
    activities: [
      {
        title: "Expression Parser",
        description: "Human-readable schedule translation",
        image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Execution Timetable",
        description: "Preview upcoming triggers across days and hours",
        image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "docker-gitignore": {
    slug: "docker-gitignore",
    title: "Docker & Gitignore Foundry",
    category: "DEVELOPER",
    coverImage: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1920&q=80",
    tagline: "Generate production Dockerfiles and curated .gitignore presets for any language.",
    activities: [
      {
        title: "Multi Stage Docker",
        description: "Lightweight production containers for Node, Go, and Python",
        image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Clean .gitignore",
        description: "Exclude node_modules, build artifacts, and OS temp files",
        image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "hash-secret": {
    slug: "hash-secret",
    title: "Hash & Secret Generator",
    category: "DEVELOPER",
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=1920&q=80",
    tagline: "Compute SHA-256, SHA-512, MD5 hashes and generate secure hex tokens.",
    activities: [
      {
        title: "SubtleCrypto Core",
        description: "Hardware accelerated client hashing",
        image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Secret Tokens",
        description: "Generate 32, 64, or 128-byte API keys and secrets",
        image: "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "markdown-table": {
    slug: "markdown-table",
    title: "Markdown Table Grid",
    category: "DESIGN",
    coverImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80",
    tagline: "Format spreadsheets and CSV text into GitHub Flavored Markdown tables.",
    activities: [
      {
        title: "CSV & TSV Paste",
        description: "Convert spreadsheet clips into clean pipes",
        image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Column Alignment",
        description: "Set left, center, or right aligned formatting",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "opengraph-preview": {
    slug: "opengraph-preview",
    title: "OpenGraph Social Preview",
    category: "GROWTH",
    coverImage: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1920&q=80",
    tagline: "Simulate social share cards across Twitter, Facebook, LinkedIn, and Discord.",
    activities: [
      {
        title: "Card Simulator",
        description: "Live view across Twitter large summary and Facebook",
        image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Meta Tag Export",
        description: "Clean HTML head tags ready to paste into layout",
        image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "invoice-receipt": {
    slug: "invoice-receipt",
    title: "Invoice & Receipt Maker",
    category: "DESIGN",
    coverImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80",
    tagline: "Generate clean printable PDF-ready receipts with custom tax and line items.",
    activities: [
      {
        title: "Print Ready Layout",
        description: "Clean monochrome typography styled for thermal or A4 print",
        image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Automatic Math",
        description: "Subtotal, tax calculation, and discounts calculated live",
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "meeting-agenda": {
    slug: "meeting-agenda",
    title: "Meeting Agenda Builder",
    category: "GROWTH",
    coverImage: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1920&q=80",
    tagline: "Create timed meeting agendas with discussion goals and action items.",
    activities: [
      {
        title: "Time Allocator",
        description: "Ensure discussions stay within scheduled meeting limits",
        image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Action Item Export",
        description: "Direct markdown output ready for Slack or Notion",
        image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "email-signature": {
    slug: "email-signature",
    title: "Email Signature Builder",
    category: "GROWTH",
    coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1920&q=80",
    tagline: "Format clean HTML email signatures with social links and contact badges.",
    activities: [
      {
        title: "Table Layout",
        description: "Email client compatibility with Outlook and Gmail",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "One-Click Copy",
        description: "Copy rich HTML directly into mail preferences",
        image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "app-prd": {
    slug: "app-prd",
    title: "App PRD Spec Builder",
    category: "DEVELOPER",
    coverImage: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80",
    tagline: "Draft structured Product Requirement Documents with user stories and scope.",
    activities: [
      {
        title: "Feature Scoping",
        description: "Must-have vs nice-to-have boundary mapping",
        image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Technical Stack",
        description: "Frontend, database, and authentication definitions",
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "curl-converter": {
    slug: "curl-converter",
    title: "cURL Code Converter",
    category: "DEVELOPER",
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1920&q=80",
    tagline: "Convert cURL commands into JavaScript Fetch, Python Requests, Go, and Axios.",
    activities: [
      {
        title: "Multi Language",
        description: "JavaScript, Python, Go, PHP, and Rust output",
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Header Parser",
        description: "Accurate token extraction from raw command line flags",
        image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "webhook-payload": {
    slug: "webhook-payload",
    title: "Webhook Telemetry Simulator",
    category: "DEVELOPER",
    coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1920&q=80",
    tagline: "Inspect and simulate incoming webhook JSON payloads for Stripe, GitHub, and Shopify.",
    activities: [
      {
        title: "Provider Schemas",
        description: "Stripe payment_intent, GitHub push, Shopify checkout events",
        image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Header Signature",
        description: "Simulate webhook HMAC verification headers",
        image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "batch-image-resizer": {
    slug: "batch-image-resizer",
    title: "Batch Image Resizer",
    category: "DESIGN",
    coverImage: "https://images.unsplash.com/photo-1542744094-3a31727221eb?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80",
    tagline: "Batch resize photos and graphics to exact dimensions, aspect ratios, and ZIP export.",
    activities: [
      {
        title: "Multi-file Canvas Resizing",
        description: "Scale tens of images simultaneously with bicubic smoothing",
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Batch ZIP Export",
        description: "Download all resized images in a single compressed package",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
  "image-converter": {
    slug: "image-converter",
    title: "Image Converter & Compressor",
    category: "DESIGN",
    coverImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1920&q=80",
    tagline: "Compress and convert images to WebP, JPEG, and PNG with real-time payload metrics.",
    activities: [
      {
        title: "Modern WebP Encoding",
        description: "Slash image payloads by up to 80% without visible quality loss",
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Batch Compression ZIP",
        description: "Package optimized assets instantly without server upload",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  },
};

export function getConsoleAsset(slug: string): ConsoleAsset {
  if (CONSOLE_ASSETS[slug]) return CONSOLE_ASSETS[slug];
  return {
    slug,
    title: slug.toUpperCase().replace(/-/g, " "),
    category: "TOOL",
    coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&h=600&q=80",
    backdropImage: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1920&q=80",
    tagline: "Specialized browser workstation generator tool.",
    activities: [
      {
        title: "Instant Execution",
        description: "Runs entirely client-side in browser memory",
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&h=250&q=80",
      },
      {
        title: "Zero Latency",
        description: "Deterministic outputs with instant copy export",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=250&q=80",
      },
    ],
  };
}
