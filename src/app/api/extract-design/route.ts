import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { validateSafeUrlForFetch, safeFetchWithRedirects, readSafeResponseBody } from "@/lib/security/ssrf";
import {
  inspectLiveSite,
  getLocalChromePath,
  buildDesignSystemFromEvidence,
} from "@/lib/design-inspection/inspect-reference";
import { createArchetypeDesignSystem, attr } from "@/generators/modules/design-md/engine";

export const maxDuration = 45;

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
    const siteKey = domain.replace(/[^a-z0-9-]/g, "-").toLowerCase();
    const cleanProjectName =
      domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);

    // 1. Attempt Real Headless Chrome Live Inspection if Chrome is available
    const chromePath = getLocalChromePath();
    if (chromePath && fs.existsSync(chromePath)) {
      try {
        const evidence = await inspectLiveSite(
          siteKey,
          parsedUrl.toString(),
          cleanProjectName,
          "modern-saas",
          {
            outputBaseDir: "public/evidence/reference-sites",
            captureScreenshots: true,
          }
        );

        const system = buildDesignSystemFromEvidence(evidence);

        return NextResponse.json({
          success: true,
          inspectionMethod: "headless-chrome",
          domain,
          projectName: evidence.name,
          evidence,
          system,
          source: "live-extracted",
          notes: [evidence.fidelityReport],
        });
      } catch (chromeErr: any) {
        console.warn(
          `[Extract Design] Headless Chrome inspection failed for ${domain}: ${chromeErr?.message}. Falling back to SSRF HTML inspection.`
        );
      }
    }

    // 2. SSRF-Safe HTML Stream Inspection Fallback
    try {
      const fetchResult = await safeFetchWithRedirects(parsedUrl.toString(), {
        timeoutMs: 6000,
        maxRedirects: 3,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (fetchResult.statusCode < 200 || fetchResult.statusCode >= 300) {
        return NextResponse.json(
          {
            error: `Website returned status ${fetchResult.statusCode}. Live inspection could not reach target host.`,
            canFallbackToScreenshot: true,
          },
          { status: 422 }
        );
      }

      const html = await readSafeResponseBody(fetchResult, 1024 * 1024);
      const notes: string[] = [];
      const detectedColors: string[] = [];
      const detectedFonts: string[] = [];

      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const extractedTitle = titleMatch ? titleMatch[1].trim() : cleanProjectName;

      // Extract theme-color meta tag
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

      // Extract CSS hex colors
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

      // Extract font families
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

      const isDark =
        html.includes('class="dark') ||
        html.includes("color-scheme: dark") ||
        html.includes("background:#000") ||
        html.includes("background:#0a0a0a");

      const primaryColor = themeColor || detectedColors[0] || "#2563eb";
      const headingFont = detectedFonts[0] || "Inter";
      const bodyFont = detectedFonts[1] || detectedFonts[0] || "Inter";

      const fallbackSystem = createArchetypeDesignSystem("modern-saas", {
        projectName: extractedTitle,
        primaryColor,
      });

      fallbackSystem.identity.projectName = attr(extractedTitle, "observed", domain);
      fallbackSystem.colors.primary = attr(primaryColor, "observed", domain, "HTML theme extraction");
      fallbackSystem.colors.neutrals.background = attr(
        isDark ? "#08090a" : "#ffffff",
        "inferred",
        domain
      );
      fallbackSystem.colors.neutrals.text = attr(
        isDark ? "#f7f8f8" : "#111111",
        "inferred",
        domain
      );
      fallbackSystem.typography.headingFont = attr(headingFont, "observed", domain);
      fallbackSystem.typography.bodyFont = attr(bodyFont, "observed", domain);

      return NextResponse.json({
        success: true,
        partial: true,
        fallback: "ssrf-fetch",
        warning:
          "Live headless browser was not available or timed out. Inferred system from HTML metadata.",
        domain,
        projectName: extractedTitle,
        system: fallbackSystem,
        observed: {
          title: extractedTitle,
          themeColor,
          detectedColors,
          detectedFonts,
        },
        notes,
      });
    } catch {
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
