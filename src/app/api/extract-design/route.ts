import { NextRequest, NextResponse } from "next/server";
import { validateSafeUrlForFetch, safeFetchWithRedirects, readSafeResponseBody } from "@/lib/security/ssrf";

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
  observed: {
    title?: string;
    themeColor?: string;
    detectedColors: string[];
    detectedFonts: string[];
  };
}

// Curated high-fidelity presets for popular domains
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

    // SSRF Security Validation
    const ssrfCheck = await validateSafeUrlForFetch(url);
    if (!ssrfCheck.safe) {
      return NextResponse.json(
        { error: ssrfCheck.reason || "URL access blocked by security policy (SSRF prevention)" },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const domain = parsedUrl.hostname.replace(/^www\./, "").toLowerCase();
    const preset = CURATED_PRESETS[domain];

    // Live HTML/CSS fetch with SSRF redirect validation and cumulative timeout
    try {
      const fetchResult = await safeFetchWithRedirects(parsedUrl.toString(), {
        timeoutMs: 4500,
        maxRedirects: 3,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (fetchResult.statusCode < 200 || fetchResult.statusCode >= 300) {
        // If live fetch returned an error (e.g. 403 bot-block or 404)
        if (preset) {
          return NextResponse.json({
            domain,
            projectName: preset.projectName || domain.split(".")[0].toUpperCase(),
            platform: "Web (Responsive)",
            brandTone: preset.brandTone || "Clean, Modern Digital Product",
            primaryColor: preset.primaryColor || "#2563eb",
            secondaryColor: preset.secondaryColor || "#4f46e5",
            accentColor: preset.accentColor || "#06b6d4",
            neutralType: preset.neutralType || "Zinc (Neutral Cool)",
            headingFont: preset.headingFont || "Inter",
            bodyFont: preset.bodyFont || "Inter",
            monoFont: preset.monoFont || "JetBrains Mono",
            baseRadius: preset.baseRadius || "8px",
            elevationStyle: preset.elevationStyle || "Subtle Multi-layer",
            source: "curated-preset",
            notes: ["Live connection to target host was blocked or returned non-200. Loaded curated baseline reference profile (not live-extracted)."],
            observed: { detectedColors: [], detectedFonts: [] },
          });
        }

        return NextResponse.json(
          {
            error: `Website returned status ${fetchResult.statusCode}. Automated inspection was blocked by the host. You can use manual specification or screenshot reference.`,
            canFallbackToScreenshot: true,
          },
          { status: 422 }
        );
      }

      const html = fetchResult.responseText;
      const detectedColors: string[] = [];
      const detectedFonts: string[] = [];
      const notes: string[] = [];

      // 1. Extract Title
      let projectName = domain.split(".")[0].toUpperCase();
      let extractedTitle: string | undefined;
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        extractedTitle = titleMatch[1].trim();
        const cleanTitle = extractedTitle.split(/[|\-–—]/)[0].trim();
        if (cleanTitle) projectName = cleanTitle;
        notes.push(`Extracted title: ${cleanTitle}`);
      }

      // 2. Extract theme-color meta
      let themeColor: string | undefined;
      const themeColorMatch =
        html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']theme-color["']/i);
      if (themeColorMatch && themeColorMatch[1]) {
        const tc = themeColorMatch[1].trim();
        if (/^#[0-9a-fA-F]{3,8}$/.test(tc)) {
          themeColor = tc;
          detectedColors.push(tc);
          notes.push(`Found theme-color meta tag: ${tc}`);
        }
      }

      // 3. Extract CSS hex colors
      const colorMatches = html.match(/#[0-9a-fA-F]{6}\b/g) || [];
      const colorCounts: Record<string, number> = {};
      for (const c of colorMatches) {
        const lower = c.toLowerCase();
        if (lower !== "#000000" && lower !== "#ffffff") {
          colorCounts[lower] = (colorCounts[lower] || 0) + 1;
        }
      }

      const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
      for (const [col] of sortedColors.slice(0, 5)) {
        if (!detectedColors.includes(col)) detectedColors.push(col);
      }

      // 4. Extract font families
      const fontMatches = html.match(/font-family:\s*["']?([a-zA-Z0-9\s\-]+)["']?/gi) || [];
      for (const match of fontMatches) {
        const fontName = match
          .replace(/font-family:\s*["']?/i, "")
          .replace(/["'].*$/, "")
          .trim();
        if (
          fontName &&
          !fontName.toLowerCase().includes("inherit") &&
          !fontName.toLowerCase().includes("sans-serif") &&
          !detectedFonts.includes(fontName)
        ) {
          detectedFonts.push(fontName);
        }
      }

      // 5. Detect dark theme preference
      const isDark =
        html.includes('class="dark') ||
        html.includes("color-scheme: dark") ||
        html.includes("background:#000") ||
        html.includes("background:#0a0a0a");

      const primaryColor = themeColor || detectedColors[0] || preset?.primaryColor || "#2563eb";
      const secondaryColor = detectedColors[1] || preset?.secondaryColor || "#4f46e5";
      const accentColor = detectedColors[2] || preset?.accentColor || "#06b6d4";
      const headingFont = detectedFonts[0] || preset?.headingFont || "Inter";
      const bodyFont = detectedFonts[1] || detectedFonts[0] || preset?.bodyFont || "Inter";

      const extracted: ExtractedDesign = {
        domain,
        projectName: preset?.projectName || projectName,
        platform: "Web (Responsive)",
        brandTone: isDark
          ? "Dark-Mode First, High-Contrast Modern"
          : preset?.brandTone || "Clean, Modern Digital Product",
        primaryColor,
        secondaryColor,
        accentColor,
        neutralType: isDark ? "Zinc (Deep Obsidian Dark)" : "Zinc (Neutral Cool)",
        headingFont,
        bodyFont,
        monoFont: preset?.monoFont || "JetBrains Mono",
        baseRadius: preset?.baseRadius || "8px (Subtle Precision)",
        elevationStyle: preset?.elevationStyle || "Subtle Multi-layer",
        source: "live-extracted",
        notes,
        observed: {
          title: extractedTitle,
          themeColor,
          detectedColors,
          detectedFonts,
        },
      };

      return NextResponse.json(extracted);
    } catch {
      // If live fetch fails (timeout or network failure)
      if (preset) {
        return NextResponse.json({
          domain,
          projectName: preset.projectName || domain.split(".")[0].toUpperCase(),
          platform: "Web (Responsive)",
          brandTone: preset.brandTone || "Clean, Modern Digital Product",
          primaryColor: preset.primaryColor || "#2563eb",
          secondaryColor: preset.secondaryColor || "#4f46e5",
          accentColor: preset.accentColor || "#06b6d4",
          neutralType: preset.neutralType || "Zinc (Neutral Cool)",
          headingFont: preset.headingFont || "Inter",
          bodyFont: preset.bodyFont || "Inter",
          monoFont: preset.monoFont || "JetBrains Mono",
          baseRadius: preset.baseRadius || "8px",
          elevationStyle: preset.elevationStyle || "Subtle Multi-layer",
          source: "curated-preset",
          notes: ["Direct network connection timed out or blocked. Loaded curated baseline reference profile (not live-extracted from network)."],
          observed: { detectedColors: [], detectedFonts: [] },
        });
      }

      // Honest error reporting: do not pretend extraction succeeded!
      return NextResponse.json(
        {
          error: `Could not connect to ${domain}. The website is unreachable or timed out. You can enter design specifications manually or reference a screenshot.`,
          canFallbackToScreenshot: true,
        },
        { status: 422 }
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal extraction error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
