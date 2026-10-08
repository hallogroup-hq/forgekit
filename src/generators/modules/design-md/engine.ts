/**
 * Design.md Strategic Generator Engine
 * Comprehensive, production-grade Design System Studio with strict epistemic provenance
 * and multi-format token generation (Markdown, W3C JSON, CSS Variables, Tailwind v3, Tailwind v4).
 */

export type ProvenanceKind = "observed" | "user-provided" | "inferred" | "unknown";

export interface AttributedValue<T> {
  value: T;
  provenance: ProvenanceKind;
  sourceRef?: string;
  confidence?: number;
  verificationNote?: string;
}

export function attr<T>(
  value: T,
  provenance: ProvenanceKind = "inferred",
  sourceRef?: string,
  verificationNote?: string
): AttributedValue<T> {
  return { value, provenance, sourceRef, verificationNote };
}

export type DesignArchetype =
  | "modern-saas"
  | "editorial"
  | "ecommerce"
  | "luxury"
  | "minimal-landing"
  | "expressive-studio";

export interface ArchetypeMeta {
  id: DesignArchetype;
  name: string;
  tagline: string;
  description: string;
}

export const ARCHETYPES: Record<DesignArchetype, ArchetypeMeta> = {
  "modern-saas": {
    id: "modern-saas",
    name: "Modern SaaS / Productivity",
    tagline: "Precision, High-Density, Functional",
    description: "Slate/Zinc neutrals, crisp indigo/blue brand accents, 8px micro-radii, 1px borders, high density.",
  },
  editorial: {
    id: "editorial",
    name: "Editorial / Longform",
    tagline: "Serif Typography, Warm Surfaces, Restraint",
    description: "Warm cream surfaces, rich charcoal text, terracotta accents, comfortable reading rhythm.",
  },
  ecommerce: {
    id: "ecommerce",
    name: "E-commerce / Retail",
    tagline: "Visual Punch, High Contrast, Card-Centric",
    description: "Crisp white cards, bold high-conversion CTAs, energetic orange/blue highlights, 12px radii.",
  },
  luxury: {
    id: "luxury",
    name: "Luxury / High-End",
    tagline: "Monochrome, Gold Accents, Expansive Air",
    description: "Deep obsidian, champagne gold hairline strokes, minimal border-radius (2px), generous whitespace.",
  },
  "minimal-landing": {
    id: "minimal-landing",
    name: "Minimal Landing Page",
    tagline: "Stark Contrast, Electric Highlights, Soft Blur",
    description: "High-impact typography, electric blue accents, floating pill navigation, 16px soft radii.",
  },
  "expressive-studio": {
    id: "expressive-studio",
    name: "Expressive Creative / Studio",
    tagline: "Bold Display Fonts, Glassmorphism, Neon",
    description: "Syne / Space Grotesk display fonts, deep plum background, neon magenta gradients, 24px playful radii.",
  },
};

export interface ColorLadder {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface ContrastPairCheck {
  pair: string;
  fg: string;
  bg: string;
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  usage: string;
}

export interface FullDesignSystem {
  // 1. Identity & Archetype
  identity: {
    projectName: AttributedValue<string>;
    archetype: AttributedValue<DesignArchetype>;
    brandTone: AttributedValue<string>;
    platform: AttributedValue<string>;
    version: AttributedValue<string>;
    date: AttributedValue<string>;
  };

  // 2. Color System & Semantic Palette
  colors: {
    primary: AttributedValue<string>;
    primaryLadder: AttributedValue<ColorLadder>;
    secondary: AttributedValue<string>;
    accent: AttributedValue<string>;
    neutrals: {
      background: AttributedValue<string>;
      surface: AttributedValue<string>;
      border: AttributedValue<string>;
      mutedText: AttributedValue<string>;
      text: AttributedValue<string>;
    };
    semantic: {
      success: AttributedValue<string>;
      warning: AttributedValue<string>;
      error: AttributedValue<string>;
      info: AttributedValue<string>;
    };
  };

  // 3. Typography System
  typography: {
    headingFont: AttributedValue<string>;
    bodyFont: AttributedValue<string>;
    monoFont: AttributedValue<string>;
    scaleRatio: AttributedValue<number>;
    baseFontSize: AttributedValue<number>;
    headings: {
      h1: AttributedValue<{ size: string; weight: string; lineHeight: string; tracking: string }>;
      h2: AttributedValue<{ size: string; weight: string; lineHeight: string; tracking: string }>;
      h3: AttributedValue<{ size: string; weight: string; lineHeight: string; tracking: string }>;
      h4: AttributedValue<{ size: string; weight: string; lineHeight: string; tracking: string }>;
    };
  };

  // 4. Grid, Layout & Containers
  layout: {
    containerMaxWidth: AttributedValue<string>;
    containerPadding: AttributedValue<string>;
    gridColumns: AttributedValue<number>;
    gutterWidth: AttributedValue<string>;
  };

  // 5. Spacing & Density
  spacing: {
    baseUnit: AttributedValue<number>;
    scale: AttributedValue<Record<string, string>>;
    densityMode: AttributedValue<"compact" | "normal" | "comfortable">;
  };

  // 6. Surfaces, Elevation & Borders
  surfaces: {
    baseRadius: AttributedValue<string>;
    cardRadius: AttributedValue<string>;
    borderWidth: AttributedValue<string>;
    shadows: {
      subtle: AttributedValue<string>;
      medium: AttributedValue<string>;
      elevated: AttributedValue<string>;
    };
    glassmorphism: AttributedValue<{ enabled: boolean; blur: string; opacity: string }>;
  };

  // 7. Button & Interactive System
  buttons: {
    primary: AttributedValue<{ bg: string; text: string; radius: string; shadow: string }>;
    secondary: AttributedValue<{ bg: string; text: string; border: string }>;
    ghost: AttributedValue<{ hoverBg: string; text: string }>;
    destructive: AttributedValue<{ bg: string; text: string }>;
    sizes: AttributedValue<Record<"sm" | "md" | "lg", { height: string; padding: string; text: string }>>;
  };

  // 8. Form Controls & Inputs
  forms: {
    inputHeight: AttributedValue<string>;
    inputRadius: AttributedValue<string>;
    borderDefault: AttributedValue<string>;
    borderFocus: AttributedValue<string>;
    focusRingStyle: AttributedValue<string>;
  };

  // 9. Navigation & App Shell
  navigation: {
    navbarHeight: AttributedValue<string>;
    sidebarWidth: AttributedValue<string>;
    navStyle: AttributedValue<"sticky" | "fixed" | "floating" | "minimal">;
  };

  // 10. Key Component Patterns
  components: {
    cardStyle: AttributedValue<string>;
    badgeStyle: AttributedValue<string>;
    modalBackdrop: AttributedValue<string>;
    tooltipStyle: AttributedValue<string>;
  };

  // 11. Imagery, Media & Iconography
  media: {
    iconSet: AttributedValue<string>;
    avatarRadius: AttributedValue<string>;
    defaultAspectRatio: AttributedValue<string>;
  };

  // 12. Motion & Transitions
  motion: {
    durationFast: AttributedValue<string>;
    durationNormal: AttributedValue<string>;
    durationSlow: AttributedValue<string>;
    easingDefault: AttributedValue<string>;
  };

  // 13. Responsive Breakpoints
  breakpoints: {
    sm: AttributedValue<string>;
    md: AttributedValue<string>;
    lg: AttributedValue<string>;
    xl: AttributedValue<string>;
    "2xl": AttributedValue<string>;
  };

  // 14. Accessibility & Contrast Audit
  accessibility: {
    targetLevel: AttributedValue<"WCAG_AA" | "WCAG_AAA">;
    verifiedContrastPairs: ContrastPairCheck[];
    focusVisibleRule: AttributedValue<string>;
  };
}

export interface DesignObservation {
  sourceUrl?: string;
  hasScreenshot?: boolean;
  screenshotName?: string;
  observedTitle?: string;
  observedThemeColor?: string;
  detectedColors: string[];
  detectedFonts: string[];
  isDarkPreference?: boolean;
  notes?: string[];
}

export interface DesignDocPackage {
  markdown: string;
  tokensJson: string;
  tokensCss: string;
  tailwindV3: string;
  tailwindV4: string;
  componentsCheatsheet: string;
}

// Color Utility Functions
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  if (isNaN(num)) return [99, 102, 241];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function tintColor(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor);
}

export function shadeColor(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - factor), g * (1 - factor), b * (1 - factor));
}

export function generateColorLadder(baseHex: string): ColorLadder {
  return {
    50: tintColor(baseHex, 0.95),
    100: tintColor(baseHex, 0.85),
    200: tintColor(baseHex, 0.7),
    300: tintColor(baseHex, 0.5),
    400: tintColor(baseHex, 0.25),
    500: baseHex,
    600: shadeColor(baseHex, 0.15),
    700: shadeColor(baseHex, 0.3),
    800: shadeColor(baseHex, 0.5),
    900: shadeColor(baseHex, 0.7),
    950: shadeColor(baseHex, 0.85),
  };
}

export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function calculateContrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const l1 = getRelativeLuminance(r1, g1, b1);
  const l2 = getRelativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function auditContrastPairs(
  primary: string,
  background: string,
  surface: string,
  text: string
): ContrastPairCheck[] {
  const pairs: { pair: string; fg: string; bg: string; usage: string }[] = [
    { pair: "Text on Background", fg: text, bg: background, usage: "Main body paragraphs & headings" },
    { pair: "Text on Surface", fg: text, bg: surface, usage: "Card & container body text" },
    { pair: "White on Primary CTA", fg: "#ffffff", bg: primary, usage: "Primary button label" },
    { pair: "Primary on Background", fg: primary, bg: background, usage: "Interactive links & indicators" },
  ];

  return pairs.map((p) => {
    const ratio = calculateContrastRatio(p.fg, p.bg);
    return {
      pair: p.pair,
      fg: p.fg,
      bg: p.bg,
      ratio,
      passesAA: ratio >= 4.5,
      passesAAA: ratio >= 7.0,
      usage: p.usage,
    };
  });
}

// Preset Archetype Synthesizers
export function createArchetypeDesignSystem(
  archetype: DesignArchetype = "modern-saas",
  overrides?: {
    projectName?: string;
    brandTone?: string;
    primaryColor?: string;
    accentColor?: string;
    observation?: DesignObservation;
  }
): FullDesignSystem {
  const obs = overrides?.observation;
  const project = overrides?.projectName || "ForgeKit Platform";
  const dateStr = new Date().toISOString().split("T")[0];

  switch (archetype) {
    case "editorial": {
      const primary = overrides?.primaryColor || "#1c1917";
      const accent = overrides?.accentColor || "#c2410c";
      const bg = "#fdfbf7";
      const surface = "#f7f4ed";
      const text = "#1c1917";
      const ladder = generateColorLadder(primary);

      return {
        identity: {
          projectName: attr(project, overrides?.projectName ? "user-provided" : "inferred"),
          archetype: attr("editorial", "user-provided"),
          brandTone: attr(overrides?.brandTone || "Warm, Literate, Typographic, Restrained", "inferred"),
          platform: attr("Web & Tablet Reading", "inferred"),
          version: attr("1.0.0", "inferred"),
          date: attr(dateStr, "inferred"),
        },
        colors: {
          primary: attr(primary, overrides?.primaryColor ? "user-provided" : "inferred"),
          primaryLadder: attr(ladder, "inferred"),
          secondary: attr("#78716c", "inferred"),
          accent: attr(accent, overrides?.accentColor ? "user-provided" : "inferred"),
          neutrals: {
            background: attr(bg, "inferred"),
            surface: attr(surface, "inferred"),
            border: attr("#e7e2d7", "inferred"),
            mutedText: attr("#78716c", "inferred"),
            text: attr(text, "inferred"),
          },
          semantic: {
            success: attr("#15803d", "inferred"),
            warning: attr("#b45309", "inferred"),
            error: attr("#b91c1c", "inferred"),
            info: attr("#0369a1", "inferred"),
          },
        },
        typography: {
          headingFont: attr("Newsreader, Playfair Display, serif", "inferred"),
          bodyFont: attr("Charter, Georgia, serif", "inferred"),
          monoFont: attr("Courier Prime, monospace", "inferred"),
          scaleRatio: attr(1.333, "inferred"), // Perfect Fourth
          baseFontSize: attr(18, "inferred"),
          headings: {
            h1: attr({ size: "2.75rem", weight: "600", lineHeight: "1.15", tracking: "-0.02em" }),
            h2: attr({ size: "2.0rem", weight: "600", lineHeight: "1.2", tracking: "-0.015em" }),
            h3: attr({ size: "1.5rem", weight: "500", lineHeight: "1.25", tracking: "-0.01em" }),
            h4: attr({ size: "1.25rem", weight: "500", lineHeight: "1.3", tracking: "0em" }),
          },
        },
        layout: {
          containerMaxWidth: attr("860px", "inferred"),
          containerPadding: attr("2rem", "inferred"),
          gridColumns: attr(12, "inferred"),
          gutterWidth: attr("2rem", "inferred"),
        },
        spacing: {
          baseUnit: attr(8, "inferred"),
          scale: attr({ xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "40px", "2xl": "64px" }),
          densityMode: attr("comfortable", "inferred"),
        },
        surfaces: {
          baseRadius: attr("4px", "inferred"),
          cardRadius: attr("6px", "inferred"),
          borderWidth: attr("1px", "inferred"),
          shadows: {
            subtle: attr("0 1px 3px rgba(0,0,0,0.04)", "inferred"),
            medium: attr("0 4px 12px rgba(0,0,0,0.06)", "inferred"),
            elevated: attr("0 12px 24px rgba(0,0,0,0.08)", "inferred"),
          },
          glassmorphism: attr({ enabled: false, blur: "0px", opacity: "1" }),
        },
        buttons: {
          primary: attr({ bg: primary, text: "#ffffff", radius: "4px", shadow: "none" }),
          secondary: attr({ bg: "transparent", text: primary, border: "1px solid #d6cfc2" }),
          ghost: attr({ hoverBg: "#ede7da", text: primary }),
          destructive: attr({ bg: "#b91c1c", text: "#ffffff" }),
          sizes: attr({
            sm: { height: "32px", padding: "0 12px", text: "13px" },
            md: { height: "40px", padding: "0 18px", text: "15px" },
            lg: { height: "48px", padding: "0 24px", text: "17px" },
          }),
        },
        forms: {
          inputHeight: attr("42px", "inferred"),
          inputRadius: attr("4px", "inferred"),
          borderDefault: attr("#d6cfc2", "inferred"),
          borderFocus: attr(primary, "inferred"),
          focusRingStyle: attr("0 0 0 2px rgba(28,25,23,0.15)", "inferred"),
        },
        navigation: {
          navbarHeight: attr("64px", "inferred"),
          sidebarWidth: attr("240px", "inferred"),
          navStyle: attr("minimal", "inferred"),
        },
        components: {
          cardStyle: attr("Paper-like surface, 1px border #e7e2d7, 0 1px 3px shadow", "inferred"),
          badgeStyle: attr("Muted neutral pill with subtle border and serif italic label", "inferred"),
          modalBackdrop: attr("rgba(28, 25, 23, 0.4) with slight blur", "inferred"),
          tooltipStyle: attr("Warm charcoal surface with crisp border, serif typography", "inferred"),
        },
        media: {
          iconSet: attr("Lucide Icons (thin stroke)", "inferred"),
          avatarRadius: attr("50%", "inferred"),
          defaultAspectRatio: attr("4:3", "inferred"),
        },
        motion: {
          durationFast: attr("120ms", "inferred"),
          durationNormal: attr("200ms", "inferred"),
          durationSlow: attr("350ms", "inferred"),
          easingDefault: attr("cubic-bezier(0.2, 0.0, 0, 1.0)", "inferred"),
        },
        breakpoints: {
          sm: attr("640px"),
          md: attr("768px"),
          lg: attr("1024px"),
          xl: attr("1280px"),
          "2xl": attr("1536px"),
        },
        accessibility: {
          targetLevel: attr("WCAG_AAA", "inferred"),
          verifiedContrastPairs: auditContrastPairs(primary, bg, surface, text),
          focusVisibleRule: attr("outline: 2px solid #1c1917; outline-offset: 2px;", "inferred"),
        },
      };
    }

    case "ecommerce": {
      const primary = overrides?.primaryColor || "#2563eb";
      const accent = overrides?.accentColor || "#f97316";
      const bg = "#f8fafc";
      const surface = "#ffffff";
      const text = "#0f172a";
      const ladder = generateColorLadder(primary);

      return {
        identity: {
          projectName: attr(project, overrides?.projectName ? "user-provided" : "inferred"),
          archetype: attr("ecommerce", "user-provided"),
          brandTone: attr(overrides?.brandTone || "Dynamic, Trustworthy, High-Conversion, Card-Centric", "inferred"),
          platform: attr("E-commerce Web & App", "inferred"),
          version: attr("1.0.0", "inferred"),
          date: attr(dateStr, "inferred"),
        },
        colors: {
          primary: attr(primary, overrides?.primaryColor ? "user-provided" : "inferred"),
          primaryLadder: attr(ladder, "inferred"),
          secondary: attr("#64748b", "inferred"),
          accent: attr(accent, overrides?.accentColor ? "user-provided" : "inferred"),
          neutrals: {
            background: attr(bg, "inferred"),
            surface: attr(surface, "inferred"),
            border: attr("#e2e8f0", "inferred"),
            mutedText: attr("#64748b", "inferred"),
            text: attr(text, "inferred"),
          },
          semantic: {
            success: attr("#16a34a", "inferred"),
            warning: attr("#eab308", "inferred"),
            error: attr("#dc2626", "inferred"),
            info: attr("#0284c7", "inferred"),
          },
        },
        typography: {
          headingFont: attr("Plus Jakarta Sans, sans-serif", "inferred"),
          bodyFont: attr("Plus Jakarta Sans, sans-serif", "inferred"),
          monoFont: attr("Space Mono, monospace", "inferred"),
          scaleRatio: attr(1.25, "inferred"), // Major Third
          baseFontSize: attr(16, "inferred"),
          headings: {
            h1: attr({ size: "2.5rem", weight: "700", lineHeight: "1.2", tracking: "-0.02em" }),
            h2: attr({ size: "1.875rem", weight: "700", lineHeight: "1.25", tracking: "-0.015em" }),
            h3: attr({ size: "1.375rem", weight: "600", lineHeight: "1.3", tracking: "-0.01em" }),
            h4: attr({ size: "1.125rem", weight: "600", lineHeight: "1.35", tracking: "0em" }),
          },
        },
        layout: {
          containerMaxWidth: attr("1440px", "inferred"),
          containerPadding: attr("1.5rem", "inferred"),
          gridColumns: attr(12, "inferred"),
          gutterWidth: attr("1.5rem", "inferred"),
        },
        spacing: {
          baseUnit: attr(4, "inferred"),
          scale: attr({ xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "32px", "2xl": "48px" }),
          densityMode: attr("normal", "inferred"),
        },
        surfaces: {
          baseRadius: attr("12px", "inferred"),
          cardRadius: attr("16px", "inferred"),
          borderWidth: attr("1px", "inferred"),
          shadows: {
            subtle: attr("0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)", "inferred"),
            medium: attr("0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.05)", "inferred"),
            elevated: attr("0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.08)", "inferred"),
          },
          glassmorphism: attr({ enabled: false, blur: "0px", opacity: "1" }),
        },
        buttons: {
          primary: attr({ bg: primary, text: "#ffffff", radius: "12px", shadow: "0 2px 4px rgba(37,99,235,0.2)" }),
          secondary: attr({ bg: "#f1f5f9", text: "#0f172a", border: "1px solid #e2e8f0" }),
          ghost: attr({ hoverBg: "#f1f5f9", text: "#0f172a" }),
          destructive: attr({ bg: "#dc2626", text: "#ffffff" }),
          sizes: attr({
            sm: { height: "36px", padding: "0 14px", text: "13px" },
            md: { height: "44px", padding: "0 20px", text: "15px" },
            lg: { height: "52px", padding: "0 28px", text: "16px" },
          }),
        },
        forms: {
          inputHeight: attr("44px", "inferred"),
          inputRadius: attr("10px", "inferred"),
          borderDefault: attr("#cbd5e1", "inferred"),
          borderFocus: attr(primary, "inferred"),
          focusRingStyle: attr("0 0 0 3px rgba(37,99,235,0.2)", "inferred"),
        },
        navigation: {
          navbarHeight: attr("72px", "inferred"),
          sidebarWidth: attr("260px", "inferred"),
          navStyle: attr("sticky", "inferred"),
        },
        components: {
          cardStyle: attr("Elevated white card with 16px radius, product image aspect 1:1, badge overlays", "inferred"),
          badgeStyle: attr("Vibrant discount / stock status badge with high-contrast pill styling", "inferred"),
          modalBackdrop: attr("rgba(15, 23, 42, 0.6) backdrop-blur-sm", "inferred"),
          tooltipStyle: attr("Dark slate bubble with arrow, white text, 8px radius", "inferred"),
        },
        media: {
          iconSet: attr("Lucide Icons", "inferred"),
          avatarRadius: attr("50%", "inferred"),
          defaultAspectRatio: attr("1:1", "inferred"),
        },
        motion: {
          durationFast: attr("150ms", "inferred"),
          durationNormal: attr("250ms", "inferred"),
          durationSlow: attr("350ms", "inferred"),
          easingDefault: attr("cubic-bezier(0.16, 1, 0.3, 1)", "inferred"),
        },
        breakpoints: {
          sm: attr("640px"),
          md: attr("768px"),
          lg: attr("1024px"),
          xl: attr("1280px"),
          "2xl": attr("1536px"),
        },
        accessibility: {
          targetLevel: attr("WCAG_AA", "inferred"),
          verifiedContrastPairs: auditContrastPairs(primary, bg, surface, text),
          focusVisibleRule: attr("outline: 2px solid #2563eb; outline-offset: 2px;", "inferred"),
        },
      };
    }

    case "luxury": {
      const primary = overrides?.primaryColor || "#0a0a0a";
      const accent = overrides?.accentColor || "#d4af37";
      const bg = "#0a0a0a";
      const surface = "#141414";
      const text = "#fafafa";
      const ladder = generateColorLadder(primary);

      return {
        identity: {
          projectName: attr(project, overrides?.projectName ? "user-provided" : "inferred"),
          archetype: attr("luxury", "user-provided"),
          brandTone: attr(overrides?.brandTone || "Monochrome, Champagne Accents, Expansive Whitespace, Serene", "inferred"),
          platform: attr("Luxury Web Experience", "inferred"),
          version: attr("1.0.0", "inferred"),
          date: attr(dateStr, "inferred"),
        },
        colors: {
          primary: attr(primary, overrides?.primaryColor ? "user-provided" : "inferred"),
          primaryLadder: attr(ladder, "inferred"),
          secondary: attr("#a3a3a3", "inferred"),
          accent: attr(accent, overrides?.accentColor ? "user-provided" : "inferred"),
          neutrals: {
            background: attr(bg, "inferred"),
            surface: attr(surface, "inferred"),
            border: attr("#262626", "inferred"),
            mutedText: attr("#737373", "inferred"),
            text: attr(text, "inferred"),
          },
          semantic: {
            success: attr("#10b981", "inferred"),
            warning: attr("#f59e0b", "inferred"),
            error: attr("#ef4444", "inferred"),
            info: attr("#3b82f6", "inferred"),
          },
        },
        typography: {
          headingFont: attr("Cormorant Garamond, Bodoni MT, serif", "inferred"),
          bodyFont: attr("Neue Haas Grotesk, Inter, sans-serif", "inferred"),
          monoFont: attr("Space Mono, monospace", "inferred"),
          scaleRatio: attr(1.414, "inferred"), // Augmented Fourth
          baseFontSize: attr(16, "inferred"),
          headings: {
            h1: attr({ size: "3.25rem", weight: "400", lineHeight: "1.1", tracking: "-0.01em" }),
            h2: attr({ size: "2.25rem", weight: "400", lineHeight: "1.15", tracking: "0em" }),
            h3: attr({ size: "1.5rem", weight: "500", lineHeight: "1.2", tracking: "0.02em" }),
            h4: attr({ size: "1.125rem", weight: "500", lineHeight: "1.3", tracking: "0.04em" }),
          },
        },
        layout: {
          containerMaxWidth: attr("1360px", "inferred"),
          containerPadding: attr("3rem", "inferred"),
          gridColumns: attr(12, "inferred"),
          gutterWidth: attr("2.5rem", "inferred"),
        },
        spacing: {
          baseUnit: attr(8, "inferred"),
          scale: attr({ xs: "8px", sm: "16px", md: "24px", lg: "40px", xl: "64px", "2xl": "96px" }),
          densityMode: attr("comfortable", "inferred"),
        },
        surfaces: {
          baseRadius: attr("2px", "inferred"),
          cardRadius: attr("2px", "inferred"),
          borderWidth: attr("1px", "inferred"),
          shadows: {
            subtle: attr("0 1px 2px rgba(0,0,0,0.8)", "inferred"),
            medium: attr("0 4px 16px rgba(0,0,0,0.9)", "inferred"),
            elevated: attr("0 16px 40px rgba(0,0,0,0.95)", "inferred"),
          },
          glassmorphism: attr({ enabled: false, blur: "0px", opacity: "1" }),
        },
        buttons: {
          primary: attr({ bg: text, text: bg, radius: "2px", shadow: "none" }),
          secondary: attr({ bg: "transparent", text: text, border: "1px solid #404040" }),
          ghost: attr({ hoverBg: "#1a1a1a", text: text }),
          destructive: attr({ bg: "#991b1b", text: "#ffffff" }),
          sizes: attr({
            sm: { height: "36px", padding: "0 16px", text: "12px" },
            md: { height: "46px", padding: "0 28px", text: "14px" },
            lg: { height: "56px", padding: "0 36px", text: "15px" },
          }),
        },
        forms: {
          inputHeight: attr("48px", "inferred"),
          inputRadius: attr("2px", "inferred"),
          borderDefault: attr("#262626", "inferred"),
          borderFocus: attr(accent, "inferred"),
          focusRingStyle: attr("0 0 0 1px #d4af37", "inferred"),
        },
        navigation: {
          navbarHeight: attr("80px", "inferred"),
          sidebarWidth: attr("280px", "inferred"),
          navStyle: attr("fixed", "inferred"),
        },
        components: {
          cardStyle: attr("Hairline obsidian frame with champagne accent hover and expansive padding", "inferred"),
          badgeStyle: attr("Monochrome minimal pill, uppercase tracking 0.1em, hairline border", "inferred"),
          modalBackdrop: attr("rgba(10, 10, 10, 0.85) backdrop-blur-md", "inferred"),
          tooltipStyle: attr("Pure black surface with 1px silver border, serif type", "inferred"),
        },
        media: {
          iconSet: attr("Lucide Icons (1.25px stroke)", "inferred"),
          avatarRadius: attr("2px", "inferred"),
          defaultAspectRatio: attr("16:9", "inferred"),
        },
        motion: {
          durationFast: attr("200ms", "inferred"),
          durationNormal: attr("350ms", "inferred"),
          durationSlow: attr("600ms", "inferred"),
          easingDefault: attr("cubic-bezier(0.19, 1, 0.22, 1)", "inferred"),
        },
        breakpoints: {
          sm: attr("640px"),
          md: attr("768px"),
          lg: attr("1024px"),
          xl: attr("1280px"),
          "2xl": attr("1536px"),
        },
        accessibility: {
          targetLevel: attr("WCAG_AAA", "inferred"),
          verifiedContrastPairs: auditContrastPairs(text, bg, surface, text),
          focusVisibleRule: attr("outline: 1px solid #d4af37; outline-offset: 3px;", "inferred"),
        },
      };
    }

    case "minimal-landing": {
      const primary = overrides?.primaryColor || "#09090b";
      const accent = overrides?.accentColor || "#2563eb";
      const bg = "#ffffff";
      const surface = "#f4f4f5";
      const text = "#09090b";
      const ladder = generateColorLadder(primary);

      return {
        identity: {
          projectName: attr(project, overrides?.projectName ? "user-provided" : "inferred"),
          archetype: attr("minimal-landing", "user-provided"),
          brandTone: attr(overrides?.brandTone || "High-Impact, Stark Contrast, Floating Elements, Airy", "inferred"),
          platform: attr("Landing Page Web", "inferred"),
          version: attr("1.0.0", "inferred"),
          date: attr(dateStr, "inferred"),
        },
        colors: {
          primary: attr(primary, overrides?.primaryColor ? "user-provided" : "inferred"),
          primaryLadder: attr(ladder, "inferred"),
          secondary: attr("#71717a", "inferred"),
          accent: attr(accent, overrides?.accentColor ? "user-provided" : "inferred"),
          neutrals: {
            background: attr(bg, "inferred"),
            surface: attr(surface, "inferred"),
            border: attr("#e4e4e7", "inferred"),
            mutedText: attr("#71717a", "inferred"),
            text: attr(text, "inferred"),
          },
          semantic: {
            success: attr("#22c55e", "inferred"),
            warning: attr("#f59e0b", "inferred"),
            error: attr("#ef4444", "inferred"),
            info: attr("#3b82f6", "inferred"),
          },
        },
        typography: {
          headingFont: attr("Geist, Satoshi, sans-serif", "inferred"),
          bodyFont: attr("Geist, sans-serif", "inferred"),
          monoFont: attr("Geist Mono, monospace", "inferred"),
          scaleRatio: attr(1.333, "inferred"),
          baseFontSize: attr(16, "inferred"),
          headings: {
            h1: attr({ size: "3.5rem", weight: "700", lineHeight: "1.1", tracking: "-0.03em" }),
            h2: attr({ size: "2.25rem", weight: "600", lineHeight: "1.2", tracking: "-0.025em" }),
            h3: attr({ size: "1.5rem", weight: "600", lineHeight: "1.3", tracking: "-0.02em" }),
            h4: attr({ size: "1.125rem", weight: "500", lineHeight: "1.4", tracking: "-0.01em" }),
          },
        },
        layout: {
          containerMaxWidth: attr("1200px", "inferred"),
          containerPadding: attr("1.5rem", "inferred"),
          gridColumns: attr(12, "inferred"),
          gutterWidth: attr("2rem", "inferred"),
        },
        spacing: {
          baseUnit: attr(4, "inferred"),
          scale: attr({ xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "32px", "2xl": "48px" }),
          densityMode: attr("compact", "inferred"),
        },
        surfaces: {
          baseRadius: attr("16px", "inferred"),
          cardRadius: attr("20px", "inferred"),
          borderWidth: attr("1px", "inferred"),
          shadows: {
            subtle: attr("0 1px 2px rgba(0,0,0,0.05)", "inferred"),
            medium: attr("0 8px 30px rgba(0,0,0,0.08)", "inferred"),
            elevated: attr("0 20px 50px rgba(0,0,0,0.12)", "inferred"),
          },
          glassmorphism: attr({ enabled: true, blur: "12px", opacity: "0.8" }),
        },
        buttons: {
          primary: attr({ bg: primary, text: "#ffffff", radius: "9999px", shadow: "0 2px 8px rgba(0,0,0,0.15)" }),
          secondary: attr({ bg: "#ffffff", text: primary, border: "1px solid #e4e4e7" }),
          ghost: attr({ hoverBg: "#f4f4f5", text: primary }),
          destructive: attr({ bg: "#ef4444", text: "#ffffff" }),
          sizes: attr({
            sm: { height: "36px", padding: "0 16px", text: "13px" },
            md: { height: "44px", padding: "0 22px", text: "14px" },
            lg: { height: "52px", padding: "0 28px", text: "15px" },
          }),
        },
        forms: {
          inputHeight: attr("44px", "inferred"),
          inputRadius: attr("12px", "inferred"),
          borderDefault: attr("#e4e4e7", "inferred"),
          borderFocus: attr(primary, "inferred"),
          focusRingStyle: attr("0 0 0 2px rgba(9,9,11,0.2)", "inferred"),
        },
        navigation: {
          navbarHeight: attr("64px", "inferred"),
          sidebarWidth: attr("240px", "inferred"),
          navStyle: attr("floating", "inferred"),
        },
        components: {
          cardStyle: attr("Soft 20px rounded surface with light blur and subtle 1px border", "inferred"),
          badgeStyle: attr("Pill with 1px border and soft backdrop blur", "inferred"),
          modalBackdrop: attr("rgba(255, 255, 255, 0.7) backdrop-blur-md", "inferred"),
          tooltipStyle: attr("Pitch black capsule with white typography", "inferred"),
        },
        media: {
          iconSet: attr("Lucide Icons", "inferred"),
          avatarRadius: attr("9999px", "inferred"),
          defaultAspectRatio: attr("16:9", "inferred"),
        },
        motion: {
          durationFast: attr("150ms", "inferred"),
          durationNormal: attr("250ms", "inferred"),
          durationSlow: attr("400ms", "inferred"),
          easingDefault: attr("cubic-bezier(0.16, 1, 0.3, 1)", "inferred"),
        },
        breakpoints: {
          sm: attr("640px"),
          md: attr("768px"),
          lg: attr("1024px"),
          xl: attr("1280px"),
          "2xl": attr("1536px"),
        },
        accessibility: {
          targetLevel: attr("WCAG_AA", "inferred"),
          verifiedContrastPairs: auditContrastPairs(primary, bg, surface, text),
          focusVisibleRule: attr("outline: 2px solid #09090b; outline-offset: 2px;", "inferred"),
        },
      };
    }

    case "expressive-studio": {
      const primary = overrides?.primaryColor || "#8b5cf6";
      const accent = overrides?.accentColor || "#ec4899";
      const bg = "#0f0728";
      const surface = "#1a0f3d";
      const text = "#f5f3ff";
      const ladder = generateColorLadder(primary);

      return {
        identity: {
          projectName: attr(project, overrides?.projectName ? "user-provided" : "inferred"),
          archetype: attr("expressive-studio", "user-provided"),
          brandTone: attr(overrides?.brandTone || "Futuristic, Neon Gradient Mesh, Fluid Spring Motion, Playful", "inferred"),
          platform: attr("Creative Studio Web", "inferred"),
          version: attr("1.0.0", "inferred"),
          date: attr(dateStr, "inferred"),
        },
        colors: {
          primary: attr(primary, overrides?.primaryColor ? "user-provided" : "inferred"),
          primaryLadder: attr(ladder, "inferred"),
          secondary: attr("#a78bfa", "inferred"),
          accent: attr(accent, overrides?.accentColor ? "user-provided" : "inferred"),
          neutrals: {
            background: attr(bg, "inferred"),
            surface: attr(surface, "inferred"),
            border: attr("#2e1065", "inferred"),
            mutedText: attr("#c4b5fd", "inferred"),
            text: attr(text, "inferred"),
          },
          semantic: {
            success: attr("#34d399", "inferred"),
            warning: attr("#fbbf24", "inferred"),
            error: attr("#f87171", "inferred"),
            info: attr("#38bdf8", "inferred"),
          },
        },
        typography: {
          headingFont: attr("Syne, Space Grotesk, sans-serif", "inferred"),
          bodyFont: attr("DM Sans, sans-serif", "inferred"),
          monoFont: attr("Fira Code, monospace", "inferred"),
          scaleRatio: attr(1.333, "inferred"),
          baseFontSize: attr(16, "inferred"),
          headings: {
            h1: attr({ size: "3.75rem", weight: "800", lineHeight: "1.05", tracking: "-0.035em" }),
            h2: attr({ size: "2.5rem", weight: "700", lineHeight: "1.15", tracking: "-0.025em" }),
            h3: attr({ size: "1.75rem", weight: "600", lineHeight: "1.25", tracking: "-0.02em" }),
            h4: attr({ size: "1.25rem", weight: "600", lineHeight: "1.3", tracking: "-0.01em" }),
          },
        },
        layout: {
          containerMaxWidth: attr("1440px", "inferred"),
          containerPadding: attr("2rem", "inferred"),
          gridColumns: attr(12, "inferred"),
          gutterWidth: attr("2rem", "inferred"),
        },
        spacing: {
          baseUnit: attr(4, "inferred"),
          scale: attr({ xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "36px", "2xl": "60px" }),
          densityMode: attr("normal", "inferred"),
        },
        surfaces: {
          baseRadius: attr("24px", "inferred"),
          cardRadius: attr("28px", "inferred"),
          borderWidth: attr("1px", "inferred"),
          shadows: {
            subtle: attr("0 2px 10px rgba(139, 92, 246, 0.15)", "inferred"),
            medium: attr("0 10px 30px rgba(139, 92, 246, 0.25)", "inferred"),
            elevated: attr("0 20px 60px rgba(236, 72, 153, 0.3)", "inferred"),
          },
          glassmorphism: attr({ enabled: true, blur: "16px", opacity: "0.6" }),
        },
        buttons: {
          primary: attr({ bg: `linear-gradient(135deg, ${primary}, ${accent})`, text: "#ffffff", radius: "9999px", shadow: "0 4px 20px rgba(139,92,246,0.4)" }),
          secondary: attr({ bg: "rgba(255,255,255,0.08)", text: "#ffffff", border: "1px solid rgba(255,255,255,0.15)" }),
          ghost: attr({ hoverBg: "rgba(255,255,255,0.1)", text: "#ffffff" }),
          destructive: attr({ bg: "#f43f5e", text: "#ffffff" }),
          sizes: attr({
            sm: { height: "36px", padding: "0 18px", text: "13px" },
            md: { height: "46px", padding: "0 26px", text: "15px" },
            lg: { height: "56px", padding: "0 32px", text: "16px" },
          }),
        },
        forms: {
          inputHeight: attr("48px", "inferred"),
          inputRadius: attr("16px", "inferred"),
          borderDefault: attr("#2e1065", "inferred"),
          borderFocus: attr(primary, "inferred"),
          focusRingStyle: attr("0 0 0 3px rgba(139,92,246,0.4)", "inferred"),
        },
        navigation: {
          navbarHeight: attr("76px", "inferred"),
          sidebarWidth: attr("260px", "inferred"),
          navStyle: attr("floating", "inferred"),
        },
        components: {
          cardStyle: attr("Deep violet frosted glass card, neon gradient hover border, 28px radius", "inferred"),
          badgeStyle: attr("Neon glowing gradient pill with dark fill and vibrant border", "inferred"),
          modalBackdrop: attr("rgba(15, 7, 40, 0.8) backdrop-blur-xl", "inferred"),
          tooltipStyle: attr("Frosted violet pill with bright cyan typography", "inferred"),
        },
        media: {
          iconSet: attr("Lucide Icons", "inferred"),
          avatarRadius: attr("9999px", "inferred"),
          defaultAspectRatio: attr("16:9", "inferred"),
        },
        motion: {
          durationFast: attr("150ms", "inferred"),
          durationNormal: attr("300ms", "inferred"),
          durationSlow: attr("500ms", "inferred"),
          easingDefault: attr("cubic-bezier(0.34, 1.56, 0.64, 1)", "inferred"), // Playful spring
        },
        breakpoints: {
          sm: attr("640px"),
          md: attr("768px"),
          lg: attr("1024px"),
          xl: attr("1280px"),
          "2xl": attr("1536px"),
        },
        accessibility: {
          targetLevel: attr("WCAG_AA", "inferred"),
          verifiedContrastPairs: auditContrastPairs(text, bg, surface, text),
          focusVisibleRule: attr("outline: 2px solid #ec4899; outline-offset: 3px;", "inferred"),
        },
      };
    }

    case "modern-saas":
    default: {
      const primary = overrides?.primaryColor || (obs?.detectedColors?.[0] ? obs.detectedColors[0] : "#6366f1");
      const accent = overrides?.accentColor || (obs?.detectedColors?.[1] ? obs.detectedColors[1] : "#10b981");
      const bg = "#09090b";
      const surface = "#18181b";
      const text = "#fafafa";
      const ladder = generateColorLadder(primary);

      const hasObservedPrimary = Boolean(obs?.detectedColors?.[0] || obs?.observedThemeColor);

      return {
        identity: {
          projectName: attr(project, overrides?.projectName ? "user-provided" : "inferred"),
          archetype: attr("modern-saas", "user-provided"),
          brandTone: attr(overrides?.brandTone || "Precision, High-Contrast, Developer-Centric, Functional", "inferred"),
          platform: attr("Web & Cross-Platform", "inferred"),
          version: attr("1.0.0", "inferred"),
          date: attr(dateStr, "inferred"),
        },
        colors: {
          primary: attr(primary, hasObservedPrimary ? "observed" : "inferred", obs?.sourceUrl, "Extracted from target page or theme-color"),
          primaryLadder: attr(ladder, "inferred", undefined, "Calculated via linear tint/shade ladder"),
          secondary: attr("#94a3b8", "inferred"),
          accent: attr(accent, overrides?.accentColor ? "user-provided" : "inferred"),
          neutrals: {
            background: attr(bg, "inferred"),
            surface: attr(surface, "inferred"),
            border: attr("#27272a", "inferred"),
            mutedText: attr("#a1a1aa", "inferred"),
            text: attr(text, "inferred"),
          },
          semantic: {
            success: attr("#10b981", "inferred"),
            warning: attr("#f59e0b", "inferred"),
            error: attr("#ef4444", "inferred"),
            info: attr("#3b82f6", "inferred"),
          },
        },
        typography: {
          headingFont: attr("Inter Display, Geist, sans-serif", "inferred"),
          bodyFont: attr("Inter, SF Pro Text, sans-serif", "inferred"),
          monoFont: attr("JetBrains Mono, monospace", "inferred"),
          scaleRatio: attr(1.25, "inferred"),
          baseFontSize: attr(15, "inferred"),
          headings: {
            h1: attr({ size: "2.5rem", weight: "600", lineHeight: "1.15", tracking: "-0.025em" }),
            h2: attr({ size: "1.875rem", weight: "600", lineHeight: "1.2", tracking: "-0.02em" }),
            h3: attr({ size: "1.375rem", weight: "600", lineHeight: "1.25", tracking: "-0.015em" }),
            h4: attr({ size: "1.125rem", weight: "500", lineHeight: "1.3", tracking: "-0.01em" }),
          },
        },
        layout: {
          containerMaxWidth: attr("1280px", "inferred"),
          containerPadding: attr("1.5rem", "inferred"),
          gridColumns: attr(12, "inferred"),
          gutterWidth: attr("1.5rem", "inferred"),
        },
        spacing: {
          baseUnit: attr(4, "inferred"),
          scale: attr({ xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "32px", "2xl": "48px" }),
          densityMode: attr("normal", "inferred"),
        },
        surfaces: {
          baseRadius: attr("8px", "inferred"),
          cardRadius: attr("12px", "inferred"),
          borderWidth: attr("1px", "inferred"),
          shadows: {
            subtle: attr("0 1px 2px 0 rgba(0, 0, 0, 0.4)", "inferred"),
            medium: attr("0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)", "inferred"),
            elevated: attr("0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)", "inferred"),
          },
          glassmorphism: attr({ enabled: false, blur: "0px", opacity: "1" }),
        },
        buttons: {
          primary: attr({ bg: primary, text: "#ffffff", radius: "8px", shadow: "0 1px 2px rgba(0,0,0,0.2)" }),
          secondary: attr({ bg: "#27272a", text: "#fafafa", border: "1px solid #3f3f46" }),
          ghost: attr({ hoverBg: "#27272a", text: "#fafafa" }),
          destructive: attr({ bg: "#ef4444", text: "#ffffff" }),
          sizes: attr({
            sm: { height: "32px", padding: "0 12px", text: "12px" },
            md: { height: "38px", padding: "0 16px", text: "14px" },
            lg: { height: "46px", padding: "0 22px", text: "15px" },
          }),
        },
        forms: {
          inputHeight: attr("38px", "inferred"),
          inputRadius: attr("8px", "inferred"),
          borderDefault: attr("#27272a", "inferred"),
          borderFocus: attr(primary, "inferred"),
          focusRingStyle: attr("0 0 0 2px rgba(99, 102, 241, 0.35)", "inferred"),
        },
        navigation: {
          navbarHeight: attr("56px", "inferred"),
          sidebarWidth: attr("240px", "inferred"),
          navStyle: attr("sticky", "inferred"),
        },
        components: {
          cardStyle: attr("12px radius, subtle border 1px #27272a, high density surface", "inferred"),
          badgeStyle: attr("Compact 6px radius badge with tinted background and 1px border", "inferred"),
          modalBackdrop: attr("rgba(0, 0, 0, 0.7) backdrop-blur-sm", "inferred"),
          tooltipStyle: attr("Dark obsidian surface with 1px border and sharp typography", "inferred"),
        },
        media: {
          iconSet: attr("Lucide Icons", "inferred"),
          avatarRadius: attr("8px", "inferred"),
          defaultAspectRatio: attr("16:9", "inferred"),
        },
        motion: {
          durationFast: attr("120ms", "inferred"),
          durationNormal: attr("200ms", "inferred"),
          durationSlow: attr("320ms", "inferred"),
          easingDefault: attr("cubic-bezier(0.16, 1, 0.3, 1)", "inferred"),
        },
        breakpoints: {
          sm: attr("640px"),
          md: attr("768px"),
          lg: attr("1024px"),
          xl: attr("1280px"),
          "2xl": attr("1536px"),
        },
        accessibility: {
          targetLevel: attr("WCAG_AA", "inferred"),
          verifiedContrastPairs: auditContrastPairs(primary, bg, surface, text),
          focusVisibleRule: attr("outline: 2px solid #6366f1; outline-offset: 2px;", "inferred"),
        },
      };
    }
  }
}

// Multi-Format Generators

/**
 * 1. DESIGN.md Generator
 * Generates the full 14-section architectural markdown specification.
 */
export function generateDesignMdDocument(
  system: FullDesignSystem,
  observation?: DesignObservation
): string {
  const p = system.identity.projectName.value;
  const arch = ARCHETYPES[system.identity.archetype.value];
  const date = system.identity.date.value;

  const observedNotes: string[] = [];
  const inferredNotes: string[] = [];
  const unknownNotes: string[] = [];

  if (observation?.sourceUrl) {
    observedNotes.push(`Inspected target URL: ${observation.sourceUrl}`);
  }
  if (observation?.hasScreenshot) {
    if (observation.detectedColors && observation.detectedColors.length > 0) {
      observedNotes.push(
        `Processed visual screenshot "${observation.screenshotName || "reference"}": extracted ${observation.detectedColors.length} palette clusters via client-side Canvas pixel sampling.`
      );
    } else {
      observedNotes.push(
        `Attached visual screenshot "${observation.screenshotName || "reference"}": archived as visual reference asset.`
      );
    }
  }
  if (observation?.observedTitle) {
    observedNotes.push(`Document title: "${observation.observedTitle}"`);
  }
  if (observation?.observedThemeColor) {
    observedNotes.push(`Meta theme-color: ${observation.observedThemeColor}`);
  }
  if (observation?.detectedColors && observation.detectedColors.length > 0) {
    observedNotes.push(`Extracted DOM palette samples: ${observation.detectedColors.join(", ")}`);
  }
  if (observation?.detectedFonts && observation.detectedFonts.length > 0) {
    observedNotes.push(`Detected web fonts: ${observation.detectedFonts.join(", ")}`);
  }

  if (observedNotes.length === 0) {
    observedNotes.push("Baseline specifications configured via verified system blueprint (no automated URL inspection triggered).");
  }

  inferredNotes.push(`Primary palette ladder (50–950) generated via linear tint/shade interpolation.`);
  inferredNotes.push(`Typography scale ratio: ${system.typography.scaleRatio.value} with base size ${system.typography.baseFontSize.value}px.`);
  inferredNotes.push(`Surface radii and spatial scale structured around archetype "${arch.name}".`);
  inferredNotes.push(`WCAG contrast pairs audited automatically against declared background.`);

  unknownNotes.push("Micro-interaction spring stiffness and drag gesture friction require code verification.");
  unknownNotes.push("Component state variants (disabled, focus-visible outline offsets) must be confirmed in Figma or staging.");
  unknownNotes.push("Dark mode contrast ratios against WCAG 2.1 AA/AAA should be audited per screen.");
  unknownNotes.push("Subtle sound effects and haptic responses require device-level calibration.");

  return `# DESIGN.md: Design System & UI Specifications

> **Project:** ${p}  
> **Archetype:** ${arch.name} (${arch.tagline})  
> **Platform:** ${system.identity.platform.value}  
> **Brand Tone:** ${system.identity.brandTone.value}  
> **Specification Version:** ${system.identity.version.value}  
> **Generated:** ${date}

---

## 1. Epistemic Architecture & Evidence Status

ForgeKit enforces strict epistemic separation between empirical observations and synthesized tokens.

### 🔍 1.1 Observed Characteristics (Empirical Evidence)
${observedNotes.map((n) => `- **[Observed]** ${n}`).join("\n")}

### 📐 1.2 Inferred Specifications (Engine Synthesis)
${inferredNotes.map((n) => `- **[Inferred]** ${n}`).join("\n")}

### ⚠️ 1.3 Unknown / Requires Human Verification
${unknownNotes.map((n) => `- **[Unknown]** ${n}`).join("\n")}

---

## 2. Color System & Semantic Palette

### Primary Ladder
| Token | Hex Value | Role |
| :--- | :--- | :--- |
| \`primary-50\` | \`${system.colors.primaryLadder.value[50]}\` | Subtle backgrounds, tag highlights |
| \`primary-100\` | \`${system.colors.primaryLadder.value[100]}\` | Hover states on light mode |
| \`primary-200\` | \`${system.colors.primaryLadder.value[200]}\` | Borders on tinted badges |
| \`primary-500\` | \`${system.colors.primary.value}\` | **Core Brand Primary & Key CTAs** |
| \`primary-600\` | \`${system.colors.primaryLadder.value[600]}\` | Pressed & hover states |
| \`primary-800\` | \`${system.colors.primaryLadder.value[800]}\` | Dark mode surface accents |
| \`primary-950\` | \`${system.colors.primaryLadder.value[950]}\` | High-contrast dark backgrounds |

### Signal & Semantic Colors
- **Accent Highlight:** \`${system.colors.accent.value}\`
- **Secondary Neutral:** \`${system.colors.secondary.value}\`
- **Success:** \`${system.colors.semantic.success.value}\`
- **Warning:** \`${system.colors.semantic.warning.value}\`
- **Error / Danger:** \`${system.colors.semantic.error.value}\`
- **Info:** \`${system.colors.semantic.info.value}\`

### Neutrals
- **Background:** \`${system.colors.neutrals.background.value}\`
- **Surface:** \`${system.colors.neutrals.surface.value}\`
- **Border:** \`${system.colors.neutrals.border.value}\`
- **Body Text:** \`${system.colors.neutrals.text.value}\`
- **Muted Text:** \`${system.colors.neutrals.mutedText.value}\`

---

## 3. Typography System

- **Heading Font:** \`${system.typography.headingFont.value}\`
- **Body Font:** \`${system.typography.bodyFont.value}\`
- **Code / Mono Font:** \`${system.typography.monoFont.value}\`
- **Scale Factor:** \`${system.typography.scaleRatio.value}\` (Base size: \`${system.typography.baseFontSize.value}px\`)

| Level | Size | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- |
| **H1 Display** | \`${system.typography.headings.h1.value.size}\` | \`${system.typography.headings.h1.value.weight}\` | \`${system.typography.headings.h1.value.lineHeight}\` | \`${system.typography.headings.h1.value.tracking}\` |
| **H2 Section** | \`${system.typography.headings.h2.value.size}\` | \`${system.typography.headings.h2.value.weight}\` | \`${system.typography.headings.h2.value.lineHeight}\` | \`${system.typography.headings.h2.value.tracking}\` |
| **H3 Subsection** | \`${system.typography.headings.h3.value.size}\` | \`${system.typography.headings.h3.value.weight}\` | \`${system.typography.headings.h3.value.lineHeight}\` | \`${system.typography.headings.h3.value.tracking}\` |
| **H4 Title** | \`${system.typography.headings.h4.value.size}\` | \`${system.typography.headings.h4.value.weight}\` | \`${system.typography.headings.h4.value.lineHeight}\` | \`${system.typography.headings.h4.value.tracking}\` |

---

## 4. Grid, Layout & Containers

- **Container Max Width:** \`${system.layout.containerMaxWidth.value}\`
- **Container Padding:** \`${system.layout.containerPadding.value}\`
- **Grid Columns:** \`${system.layout.gridColumns.value}\`
- **Gutter Width:** \`${system.layout.gutterWidth.value}\`

---

## 5. Spacing & Density

- **Base Unit:** \`${system.spacing.baseUnit.value}px\`
- **Density Mode:** \`${system.spacing.densityMode.value}\`
- **Spacing Scale:**
${Object.entries(system.spacing.scale.value)
  .map(([k, v]) => `  - \`${k}\`: \`${v}\``)
  .join("\n")}

---

## 6. Surfaces, Elevation & Borders

- **Base Radius:** \`${system.surfaces.baseRadius.value}\`
- **Card Radius:** \`${system.surfaces.cardRadius.value}\`
- **Border Stroke:** \`${system.surfaces.borderWidth.value}\` solid \`${system.colors.neutrals.border.value}\`
- **Shadow Scale:**
  - **Subtle:** \`${system.surfaces.shadows.subtle.value}\`
  - **Medium:** \`${system.surfaces.shadows.medium.value}\`
  - **Elevated:** \`${system.surfaces.shadows.elevated.value}\`
- **Glassmorphism:** \`${system.surfaces.glassmorphism.value.enabled ? `Enabled (blur: ${system.surfaces.glassmorphism.value.blur})` : "Disabled"}\`

---

## 7. Button & Interactive System

- **Primary Button:** Background \`${system.buttons.primary.value.bg}\`, text \`${system.buttons.primary.value.text}\`, radius \`${system.buttons.primary.value.radius}\`
- **Secondary Button:** Background \`${system.buttons.secondary.value.bg}\`, border \`${system.buttons.secondary.value.border}\`
- **Ghost Button:** Hover background \`${system.buttons.ghost.value.hoverBg}\`
- **Destructive Button:** Background \`${system.buttons.destructive.value.bg}\`

---

## 8. Form Controls & Inputs

- **Default Input Height:** \`${system.forms.inputHeight.value}\`
- **Input Radius:** \`${system.forms.inputRadius.value}\`
- **Default Border:** \`${system.forms.borderDefault.value}\`
- **Focus Ring:** \`${system.forms.focusRingStyle.value}\`

---

## 9. Navigation & App Shell

- **Navbar Height:** \`${system.navigation.navbarHeight.value}\`
- **Sidebar Width:** \`${system.navigation.sidebarWidth.value}\`
- **Nav Style:** \`${system.navigation.navStyle.value}\`

---

## 10. Key Component Patterns

- **Card Specification:** ${system.components.cardStyle.value}
- **Badge Specification:** ${system.components.badgeStyle.value}
- **Modal Backdrop:** \`${system.components.modalBackdrop.value}\`
- **Tooltip Specification:** ${system.components.tooltipStyle.value}

---

## 11. Imagery, Media & Iconography

- **Recommended Icon Set:** ${system.media.iconSet.value}
- **Avatar Radius:** \`${system.media.avatarRadius.value}\`
- **Default Media Aspect Ratio:** \`${system.media.defaultAspectRatio.value}\`

---

## 12. Motion & Transitions

- **Fast:** \`${system.motion.durationFast.value}\` (tooltips, micro-toggles)
- **Normal:** \`${system.motion.durationNormal.value}\` (dialogs, drawers, standard hovers)
- **Slow:** \`${system.motion.durationSlow.value}\` (page transitions, complex accordions)
- **Default Easing:** \`${system.motion.easingDefault.value}\`

---

## 13. Responsive Breakpoints

| Breakpoint | Minimum Width | Target Device |
| :--- | :--- | :--- |
| \`sm\` | \`${system.breakpoints.sm.value}\` | Mobile landscape |
| \`md\` | \`${system.breakpoints.md.value}\` | Tablets |
| \`lg\` | \`${system.breakpoints.lg.value}\` | Small desktops / Laptops |
| \`xl\` | \`${system.breakpoints.xl.value}\` | Standard desktops |
| \`2xl\` | \`${system.breakpoints["2xl"].value}\` | Ultra-wide displays |

---

## 14. Accessibility & Contrast Verification

- **Target Compliance:** **${system.accessibility.targetLevel.value}**
- **Focus Visible Standard:** \`${system.accessibility.focusVisibleRule.value}\`

### Verified Contrast Audit
| Pair | Foreground | Background | Ratio | WCAG AA (≥4.5) | WCAG AAA (≥7.0) |
| :--- | :--- | :--- | :--- | :--- | :--- |
${system.accessibility.verifiedContrastPairs
  .map(
    (c) =>
      `| **${c.pair}** | \`${c.fg}\` | \`${c.bg}\` | **${c.ratio}:1** | ${c.passesAA ? "✅ Pass" : "❌ Fail"} | ${c.passesAAA ? "✅ Pass" : "❌ Fail"} |`
  )
  .join("\n")}

---

## 15. Rules for AI Coding Agents

When implementing UI for this project:
1. **Never hardcode hex values**; always reference design tokens via CSS variables or Tailwind classes.
2. Maintain spatial consistency using multiples of **${system.spacing.baseUnit.value}px**.
3. Do not invent non-standard border radii outside of **${system.surfaces.baseRadius.value}** and **${system.surfaces.cardRadius.value}**.
4. Honor user accessibility by wrapping transitions with \`motion-safe:\`.
`;
}

/**
 * 2. W3C Design Tokens JSON
 */
export function generateTokensJson(system: FullDesignSystem): string {
  const ladder = system.colors.primaryLadder.value;
  return JSON.stringify(
    {
      $schema: "https://design-tokens.github.io/community-group/format/",
      name: system.identity.projectName.value,
      version: system.identity.version.value,
      archetype: system.identity.archetype.value,
      color: {
        primary: {
          50: { $value: ladder[50], $type: "color" },
          100: { $value: ladder[100], $type: "color" },
          200: { $value: ladder[200], $type: "color" },
          300: { $value: ladder[300], $type: "color" },
          400: { $value: ladder[400], $type: "color" },
          500: { $value: system.colors.primary.value, $type: "color" },
          600: { $value: ladder[600], $type: "color" },
          700: { $value: ladder[700], $type: "color" },
          800: { $value: ladder[800], $type: "color" },
          900: { $value: ladder[900], $type: "color" },
          950: { $value: ladder[950], $type: "color" },
        },
        accent: { $value: system.colors.accent.value, $type: "color" },
        background: { $value: system.colors.neutrals.background.value, $type: "color" },
        surface: { $value: system.colors.neutrals.surface.value, $type: "color" },
        border: { $value: system.colors.neutrals.border.value, $type: "color" },
        text: { $value: system.colors.neutrals.text.value, $type: "color" },
        mutedText: { $value: system.colors.neutrals.mutedText.value, $type: "color" },
      },
      typography: {
        heading: { $value: system.typography.headingFont.value, $type: "fontFamily" },
        body: { $value: system.typography.bodyFont.value, $type: "fontFamily" },
        mono: { $value: system.typography.monoFont.value, $type: "fontFamily" },
        baseFontSize: { $value: `${system.typography.baseFontSize.value}px`, $type: "dimension" },
      },
      dimension: {
        radius: {
          base: { $value: system.surfaces.baseRadius.value, $type: "dimension" },
          card: { $value: system.surfaces.cardRadius.value, $type: "dimension" },
        },
        containerMaxWidth: { $value: system.layout.containerMaxWidth.value, $type: "dimension" },
        navbarHeight: { $value: system.navigation.navbarHeight.value, $type: "dimension" },
      },
      shadow: {
        subtle: { $value: system.surfaces.shadows.subtle.value, $type: "shadow" },
        medium: { $value: system.surfaces.shadows.medium.value, $type: "shadow" },
        elevated: { $value: system.surfaces.shadows.elevated.value, $type: "shadow" },
      },
    },
    null,
    2
  );
}

/**
 * 3. CSS Custom Properties (:root)
 */
export function generateTokensCss(system: FullDesignSystem): string {
  const ladder = system.colors.primaryLadder.value;
  return `/* Design Tokens — Generated by ForgeKit */
:root {
  /* Colors */
  --color-primary-50: ${ladder[50]};
  --color-primary-100: ${ladder[100]};
  --color-primary-200: ${ladder[200]};
  --color-primary-300: ${ladder[300]};
  --color-primary-400: ${ladder[400]};
  --color-primary-500: ${system.colors.primary.value};
  --color-primary-600: ${ladder[600]};
  --color-primary-700: ${ladder[700]};
  --color-primary-800: ${ladder[800]};
  --color-primary-900: ${ladder[900]};
  --color-primary-950: ${ladder[950]};

  --color-primary: ${system.colors.primary.value};
  --color-accent: ${system.colors.accent.value};
  --color-background: ${system.colors.neutrals.background.value};
  --color-surface: ${system.colors.neutrals.surface.value};
  --color-border: ${system.colors.neutrals.border.value};
  --color-text: ${system.colors.neutrals.text.value};
  --color-text-muted: ${system.colors.neutrals.mutedText.value};

  /* Typography */
  --font-heading: ${system.typography.headingFont.value};
  --font-body: ${system.typography.bodyFont.value};
  --font-mono: ${system.typography.monoFont.value};
  --font-size-base: ${system.typography.baseFontSize.value}px;

  /* Surfaces & Radii */
  --radius-base: ${system.surfaces.baseRadius.value};
  --radius-card: ${system.surfaces.cardRadius.value};

  /* Shadows */
  --shadow-subtle: ${system.surfaces.shadows.subtle.value};
  --shadow-medium: ${system.surfaces.shadows.medium.value};
  --shadow-elevated: ${system.surfaces.shadows.elevated.value};

  /* Layout */
  --container-max-width: ${system.layout.containerMaxWidth.value};
  --navbar-height: ${system.navigation.navbarHeight.value};

  /* Transitions */
  --transition-fast: ${system.motion.durationFast.value} ${system.motion.easingDefault.value};
  --transition-normal: ${system.motion.durationNormal.value} ${system.motion.easingDefault.value};
  --transition-slow: ${system.motion.durationSlow.value} ${system.motion.easingDefault.value};
}`;
}

/**
 * 4. Tailwind CSS v3 Config
 */
export function generateTailwindV3Config(system: FullDesignSystem): string {
  const ladder = system.colors.primaryLadder.value;
  return `// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx,html,js}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "${ladder[50]}",
          100: "${ladder[100]}",
          200: "${ladder[200]}",
          300: "${ladder[300]}",
          400: "${ladder[400]}",
          500: "${system.colors.primary.value}",
          600: "${ladder[600]}",
          700: "${ladder[700]}",
          800: "${ladder[800]}",
          900: "${ladder[900]}",
          950: "${ladder[950]}",
          DEFAULT: "${system.colors.primary.value}",
        },
        accent: "${system.colors.accent.value}",
        surface: "${system.colors.neutrals.surface.value}",
      },
      fontFamily: {
        heading: ["${system.typography.headingFont.value.split(",")[0].trim().replace(/['"]/g, "")}", "sans-serif"],
        body: ["${system.typography.bodyFont.value.split(",")[0].trim().replace(/['"]/g, "")}", "sans-serif"],
        mono: ["${system.typography.monoFont.value.split(",")[0].trim().replace(/['"]/g, "")}", "monospace"],
      },
      borderRadius: {
        DEFAULT: "${system.surfaces.baseRadius.value}",
        card: "${system.surfaces.cardRadius.value}",
      },
      maxWidth: {
        container: "${system.layout.containerMaxWidth.value}",
      },
    },
  },
  plugins: [],
};

export default config;`;
}

/**
 * 5. Tailwind CSS v4 @theme Block
 */
export function generateTailwindV4Theme(system: FullDesignSystem): string {
  const ladder = system.colors.primaryLadder.value;
  return `/* Tailwind CSS v4 @theme block */
@theme {
  --color-primary-50: ${ladder[50]};
  --color-primary-100: ${ladder[100]};
  --color-primary-200: ${ladder[200]};
  --color-primary-300: ${ladder[300]};
  --color-primary-400: ${ladder[400]};
  --color-primary-500: ${system.colors.primary.value};
  --color-primary-600: ${ladder[600]};
  --color-primary-700: ${ladder[700]};
  --color-primary-800: ${ladder[800]};
  --color-primary-900: ${ladder[900]};
  --color-primary-950: ${ladder[950]};

  --color-accent: ${system.colors.accent.value};
  --color-surface: ${system.colors.neutrals.surface.value};
  --color-background: ${system.colors.neutrals.background.value};

  --font-heading: "${system.typography.headingFont.value.split(",")[0].trim().replace(/['"]/g, "")}", sans-serif;
  --font-body: "${system.typography.bodyFont.value.split(",")[0].trim().replace(/['"]/g, "")}", sans-serif;
  --font-mono: "${system.typography.monoFont.value.split(",")[0].trim().replace(/['"]/g, "")}", monospace;

  --radius-base: ${system.surfaces.baseRadius.value};
  --radius-card: ${system.surfaces.cardRadius.value};
}`;
}

/**
 * 6. Component Cheatsheet (Ready-to-use snippets)
 */
export function generateComponentsCheatsheet(system: FullDesignSystem): string {
  return `<!-- Component Cheatsheet for ${system.identity.projectName.value} -->

<!-- 1. Primary Button -->
<button style="
  background: var(--color-primary-500);
  color: #ffffff;
  padding: ${system.buttons.sizes.value.md.padding};
  height: ${system.buttons.sizes.value.md.height};
  border-radius: ${system.buttons.primary.value.radius};
  font-family: var(--font-body);
  font-weight: 500;
  border: none;
  cursor: pointer;
">
  Primary Action
</button>

<!-- 2. Surface Card -->
<div style="
  background: var(--color-surface);
  border: ${system.surfaces.borderWidth.value} solid var(--color-border);
  border-radius: ${system.surfaces.cardRadius.value};
  padding: 1.5rem;
  box-shadow: ${system.surfaces.shadows.subtle.value};
">
  <h3 style="font-family: var(--font-heading); font-size: ${system.typography.headings.h3.value.size}; color: var(--color-text);">
    Card Title
  </h3>
  <p style="font-family: var(--font-body); color: var(--color-text-muted); margin-top: 0.5rem;">
    Card descriptive copy aligned with ${system.identity.brandTone.value}.
  </p>
</div>

<!-- 3. Form Input -->
<input
  type="text"
  placeholder="Enter value..."
  style="
    height: ${system.forms.inputHeight.value};
    border-radius: ${system.forms.inputRadius.value};
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
    padding: 0 1rem;
    font-family: var(--font-body);
    outline: none;
  "
/>
`;
}

/**
 * Token Importers (CSS & JSON)
 */
export function parseCssTokens(cssText: string): Partial<FullDesignSystem> {
  const result: any = {
    colors: {},
    typography: {},
    surfaces: {},
  };

  const colorPrimary = cssText.match(/--color-primary:\s*([^;]+);/);
  if (colorPrimary) {
    result.colors.primary = attr(colorPrimary[1].trim(), "observed");
  }

  const colorAccent = cssText.match(/--color-accent:\s*([^;]+);/);
  if (colorAccent) {
    result.colors.accent = attr(colorAccent[1].trim(), "observed");
  }

  const fontHeading = cssText.match(/--font-heading:\s*([^;]+);/);
  if (fontHeading) {
    result.typography.headingFont = attr(fontHeading[1].trim(), "observed");
  }

  const fontBody = cssText.match(/--font-body:\s*([^;]+);/);
  if (fontBody) {
    result.typography.bodyFont = attr(fontBody[1].trim(), "observed");
  }

  const radiusBase = cssText.match(/--radius-base:\s*([^;]+);/);
  if (radiusBase) {
    result.surfaces.baseRadius = attr(radiusBase[1].trim(), "observed");
  }

  return result;
}

export function parseTokensJson(jsonText: string): Partial<FullDesignSystem> {
  try {
    const parsed = JSON.parse(jsonText);
    const result: any = {
      colors: {},
      typography: {},
      surfaces: {},
    };

    if (parsed.color?.primary?.$value) {
      result.colors.primary = attr(parsed.color.primary.$value, "observed");
    } else if (parsed.color?.primary?.["500"]?.$value) {
      result.colors.primary = attr(parsed.color.primary["500"].$value, "observed");
    }

    if (parsed.color?.accent?.$value) {
      result.colors.accent = attr(parsed.color.accent.$value, "observed");
    }

    if (parsed.typography?.heading?.$value) {
      result.typography.headingFont = attr(parsed.typography.heading.$value, "observed");
    }

    if (parsed.typography?.body?.$value) {
      result.typography.bodyFont = attr(parsed.typography.body.$value, "observed");
    }

    if (parsed.dimension?.radius?.base?.$value) {
      result.surfaces.baseRadius = attr(parsed.dimension.radius.base.$value, "observed");
    }

    return result;
  } catch (err) {
    return {};
  }
}

// Backward Compatibility Adapter
export function generateDesignDoc(
  spec: {
    projectName: string;
    platform: string;
    brandTone: string;
    primaryColor: string;
    secondaryColor?: string;
    accentColor?: string;
    neutralType?: string;
    headingFont: string;
    bodyFont: string;
    monoFont: string;
    baseRadius: string;
    elevationStyle?: string;
    dateString?: string;
  },
  observation?: DesignObservation
) {
  const system = createArchetypeDesignSystem("modern-saas", {
    projectName: spec.projectName,
    brandTone: spec.brandTone,
    primaryColor: spec.primaryColor,
    accentColor: spec.accentColor,
    observation,
  });

  if (spec.headingFont) system.typography.headingFont = attr(spec.headingFont, "user-provided");
  if (spec.bodyFont) system.typography.bodyFont = attr(spec.bodyFont, "user-provided");
  if (spec.monoFont) system.typography.monoFont = attr(spec.monoFont, "user-provided");
  if (spec.baseRadius) system.surfaces.baseRadius = attr(spec.baseRadius, "user-provided");
  if (spec.platform) system.identity.platform = attr(spec.platform, "user-provided");
  if (spec.dateString) system.identity.date = attr(spec.dateString, "user-provided");

  return {
    observedNotes: observation?.notes || [],
    inferredNotes: [],
    unknownNotes: [],
    markdown: generateDesignMdDocument(system, observation),
    tailwindConfig: generateTailwindV3Config(system),
    cssVariables: generateTokensCss(system),
    tokensJson: generateTokensJson(system),
    tailwindV4: generateTailwindV4Theme(system),
    componentsCheatsheet: generateComponentsCheatsheet(system),
    system,
  };
}
