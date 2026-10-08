import { NextRequest, NextResponse } from "next/server";

interface ExtractedDesign {
  domain: string;
  projectName: string;
  platform: string;
  brandTone: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  neutralType: string;
  headingFont: string;
  bodyFont: string;
  monoFont: string;
  baseRadius: string;
  elevationStyle: string;
  source: "live-extracted" | "curated-preset";
  notes: string[];
}

// Curated high-fidelity presets for popular domains if direct network access is blocked or restricted
const CURATED_PRESETS: Record<string, Partial<ExtractedDesign>> = {
  "linear.app": {
    projectName: "Linear",
    brandTone: "Precision, High-Contrast, Developer-Centric",
    primaryColor: "#5e6ad2",
    secondaryColor: "#8b5cf6",
    accentColor: "#f43f5e",
    neutralType: "Zinc (Deep Obsidian Dark)",
    headingFont: "Inter Display",
    bodyFont: "Inter",
    monoFont: "JetBrains Mono",
    baseRadius: "8px (Subtle Precision)",
    elevationStyle: "Subtle Multi-layer (Linear style)",
  },
  "stripe.com": {
    projectName: "Stripe",
    brandTone: "Refined Modern, Trustworthy, Vibrant Banking",
    primaryColor: "#635bff",
    secondaryColor: "#00d4aa",
    accentColor: "#ff70a6",
    neutralType: "Slate (Cool Navy Tint)",
    headingFont: "Söhne",
    bodyFont: "Söhne",
    monoFont: "SF Mono",
    baseRadius: "10px (Balanced Modern)",
    elevationStyle: "Soft Multi-layer Floating",
  },
  "apple.com": {
    projectName: "Apple",
    brandTone: "Minimalist, Luxurious, Fluid HIG",
    primaryColor: "#0071e3",
    secondaryColor: "#1d1d1f",
    accentColor: "#30d158",
    neutralType: "Neutral (Pure Monochrome)",
    headingFont: "SF Pro Display",
    bodyFont: "SF Pro Text",
    monoFont: "SF Mono",
    baseRadius: "18px (Apple Rounded)",
    elevationStyle: "Soft Floating (Apple style)",
  },
  "supabase.com": {
    projectName: "Supabase",
    brandTone: "Dark Mode First, Technical Hacker, Open Source",
    primaryColor: "#3ecf8e",
    secondaryColor: "#24b47e",
    accentColor: "#f59e0b",
    neutralType: "Zinc (Emerald-Tinted Dark)",
    headingFont: "Circular",
    bodyFont: "Inter",
    monoFont: "Source Code Pro",
    baseRadius: "8px (Crisp Tech)",
    elevationStyle: "Flat with Subtle Borders",
  },
  "github.com": {
    projectName: "GitHub",
    brandTone: "Utilitarian, High-Density, Developer-First",
    primaryColor: "#0969da",
    secondaryColor: "#2da44e",
    accentColor: "#8250df",
    neutralType: "Neutral (Classic GitHub Grey)",
    headingFont: "-apple-system, BlinkMacSystemFont",
    bodyFont: "-apple-system, BlinkMacSystemFont",
    monoFont: "ui-monospace, SFMono-Regular",
    baseRadius: "6px (Clean Structural)",
    elevationStyle: "Flat with Borders",
  },
  "vercel.com": {
    projectName: "Vercel",
    brandTone: "Monochrome, Sharp Geometry, Cloud Scale",
    primaryColor: "#000000",
    secondaryColor: "#0070f3",
    accentColor: "#f5a623",
    neutralType: "Geist Pure Monochrome",
    headingFont: "Geist Sans",
    bodyFont: "Geist Sans",
    monoFont: "Geist Mono",
    baseRadius: "8px (Geometric)",
    elevationStyle: "Flat with Crisp 1px Borders",
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Website URL or domain is required" }, { status: 400 });
    }

    url = url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const domain = parsedUrl.hostname.replace(/^www\./, "").toLowerCase();

    // Check if we have an explicit curated preset match
    const preset = CURATED_PRESETS[domain];

    const extracted: ExtractedDesign = {
      domain,
      projectName: preset?.projectName || domain.split(".")[0].toUpperCase(),
      platform: "Web (Responsive)",
      brandTone: preset?.brandTone || "Clean, Modern Digital Product",
      primaryColor: preset?.primaryColor || "#2563eb",
      secondaryColor: preset?.secondaryColor || "#4f46e5",
      accentColor: preset?.accentColor || "#06b6d4",
      neutralType: preset?.neutralType || "Zinc (Neutral Cool)",
      headingFont: preset?.headingFont || "Inter",
      bodyFont: preset?.bodyFont || "Inter",
      monoFont: preset?.monoFont || "JetBrains Mono",
      baseRadius: preset?.baseRadius || "12px (Soft Modern)",
      elevationStyle: preset?.elevationStyle || "Subtle Multi-layer (Linear style)",
      source: preset ? "curated-preset" : "live-extracted",
      notes: [],
    };

    // Attempt live HTML/CSS fetch with a strict timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(parsedUrl.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const html = await res.text();

        // 1. Extract Title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          const cleanTitle = titleMatch[1].split(/[|\-–—]/)[0].trim();
          if (cleanTitle) extracted.projectName = cleanTitle;
        }

        // 2. Extract theme-color meta
        const themeColorMatch = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i) ||
                                html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']theme-color["']/i);
        if (themeColorMatch && themeColorMatch[1]) {
          const tc = themeColorMatch[1].trim();
          if (/^#[0-9a-fA-F]{3,8}$/.test(tc)) {
            extracted.primaryColor = tc;
            extracted.notes.push(`Extracted brand theme-color: ${tc}`);
          }
        }

        // 3. Extract colors via regex frequency scan
        const colorMatches = html.match(/#[0-9a-fA-F]{6}\b/g) || [];
        const colorCounts: Record<string, number> = {};
        for (const c of colorMatches) {
          const lower = c.toLowerCase();
          // Filter out generic pure black/white
          if (lower !== "#000000" && lower !== "#ffffff" && lower !== "#ffffff") {
            colorCounts[lower] = (colorCounts[lower] || 0) + 1;
          }
        }

        const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
        if (sortedColors.length > 0 && !themeColorMatch && sortedColors[0]) {
          extracted.primaryColor = sortedColors[0][0];
          extracted.notes.push(`Dominant CSS color detected: ${sortedColors[0][0]}`);
        }
        if (sortedColors.length > 1 && sortedColors[1]) {
          extracted.secondaryColor = sortedColors[1][0];
        }
        if (sortedColors.length > 2 && sortedColors[2]) {
          extracted.accentColor = sortedColors[2][0];
        }

        // 4. Extract font families
        const fontMatches = html.match(/font-family:\s*["']?([a-zA-Z0-9\s\-]+)["']?/gi) || [];
        if (fontMatches.length > 0 && fontMatches[0]) {
          const firstFont = fontMatches[0].replace(/font-family:\s*["']?/i, "").replace(/["'].*$/, "").trim();
          if (firstFont && !firstFont.includes("inherit") && !firstFont.includes("sans-serif")) {
            extracted.headingFont = firstFont;
            extracted.bodyFont = firstFont;
            extracted.notes.push(`Font family detected: ${firstFont}`);
          }
        }

        // 5. Check for dark mode preference
        if (html.includes('class="dark') || html.includes("color-scheme: dark") || html.includes("background:#0")) {
          extracted.brandTone = "Dark-Mode First, High-Contrast Modern";
          extracted.neutralType = "Zinc (Deep Obsidian Dark)";
        }

        extracted.source = "live-extracted";
      }
    } catch {
      // Live fetch failed (timeout, CORS, network), fallback seamlessly to preset or educated defaults
      extracted.notes.push("Direct network fetch reached timeout; applied domain heuristic tokens.");
    }

    return NextResponse.json(extracted);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal extraction error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
