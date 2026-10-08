import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { validateSafeUrlForFetch, safeFetchWithRedirects, readSafeResponseBody } from "@/lib/security/ssrf";
import {
  inspectLiveSite,
  isChromeAvailable,
  buildDesignSystemFromEvidence,
  rgbToHex,
  ReferenceSiteInspectionEvidence,
} from "@/lib/design-inspection/inspect-reference";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();
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

    // 0. Attempt Cloudflare Browser Run Worker (Zero-Cost Isolated Cloudflare Worker)
    const workerUrl = process.env.DESIGN_INSPECTION_WORKER_URL?.trim();
    const workerSecret = process.env.DESIGN_INSPECTION_WORKER_AUTH?.trim();
    if (workerUrl && workerSecret) {
      try {
        const workerRes = await fetch(workerUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-worker-auth": workerSecret,
          },
          body: JSON.stringify({ url: parsedUrl.toString() }),
          signal: AbortSignal.timeout(30000),
        });

        if (workerRes.ok) {
          const workerData: any = await workerRes.json();
          if (workerData.success && workerData.metrics) {
            const jobId = crypto.randomUUID();

            // Strict 6-digit hex normalization for all incoming worker color values
            const normalizeHex = (c?: string) => {
              if (!c) return undefined;
              const converted = rgbToHex(c);
              return /^#[0-9a-fA-F]{6}$/.test(converted) ? converted.toLowerCase() : undefined;
            };

            const normalizedPalette: string[] = Array.isArray(workerData.extractedPalette)
              ? workerData.extractedPalette
                  .map((c: string) => normalizeHex(c))
                  .filter((c: string | undefined): c is string => Boolean(c))
              : [];

            const normalizedBodyColor = normalizeHex(workerData.metrics.body?.color) || "#111111";
            const normalizedBodyBg = normalizeHex(workerData.metrics.body?.backgroundColor) || "#ffffff";

            const rawBtn = workerData.metrics.components?.primaryButton || workerData.metrics.primaryButton;
            const normalizedPrimaryBtn = rawBtn
              ? {
                  ...rawBtn,
                  color: normalizeHex(rawBtn.color) || "#ffffff",
                  backgroundColor: normalizeHex(rawBtn.backgroundColor) || "#2563eb",
                }
              : undefined;

            const rawCard = workerData.metrics.components?.card || workerData.metrics.card;
            const normalizedCard = rawCard
              ? {
                  ...rawCard,
                  backgroundColor: normalizeHex(rawCard.backgroundColor) || "#ffffff",
                }
              : undefined;

            const rawHeadings = workerData.metrics.headings || {};
            const normalizedH1 = rawHeadings.h1
              ? { ...rawHeadings.h1, color: normalizeHex(rawHeadings.h1.color) || normalizedBodyColor }
              : { ...workerData.metrics.body, color: normalizedBodyColor };
            const normalizedH2 = rawHeadings.h2
              ? { ...rawHeadings.h2, color: normalizeHex(rawHeadings.h2.color) || normalizedBodyColor }
              : { ...workerData.metrics.body, color: normalizedBodyColor };

            const workerEvidence: ReferenceSiteInspectionEvidence = {
              siteKey,
              url: parsedUrl.toString(),
              name: cleanProjectName,
              archetype: "modern-saas",
              timestamp: new Date().toISOString(),
              inspectionMethod: "cloudflare-browser-run",
              jobId,
              viewports: {
                desktop: { width: 1440, height: 900 },
                mobile: { width: 390, height: 844 },
              },
              meta: {
                title: workerData.meta?.title || cleanProjectName,
              },
              metrics: {
                body: {
                  ...workerData.metrics.body,
                  color: normalizedBodyColor,
                  backgroundColor: normalizedBodyBg,
                },
                h1: normalizedH1,
                h2: normalizedH2,
                p: workerData.metrics.paragraph || workerData.metrics.body,
                primaryButton: normalizedPrimaryBtn,
                card: normalizedCard,
                containerMaxWidth: workerData.metrics.layout?.containerMaxWidth || undefined,
                isDark: workerData.metrics.layout?.isDark ?? false,
                heroComposition: workerData.metrics.layout?.heroComposition?.type
                  ? (workerData.metrics.layout.heroComposition.type === "centered"
                      ? "center"
                      : workerData.metrics.layout.heroComposition.type.includes("split")
                      ? "split"
                      : "text-only")
                  : undefined,
              },
              extractedPalette: normalizedPalette,
              extractedFonts: workerData.extractedFonts || [],
              screenshots: {
                desktopDataUri: workerData.screenshots?.desktopDataUri,
                mobileDataUri: workerData.screenshots?.mobileDataUri,
                desktopUrl: workerData.screenshots?.desktopDataUri,
                mobileUrl: workerData.screenshots?.mobileDataUri,
              },
              fidelityReport: `Inspected ${cleanProjectName} via Cloudflare Browser Run worker. Extracted rendered layout, components, and typography.`,
            };

            const system = buildDesignSystemFromEvidence(workerEvidence);

            return NextResponse.json({
              success: true,
              inspectionMethod: "cloudflare-browser-run",
              jobId,
              domain,
              projectName: workerEvidence.name,
              evidence: workerEvidence,
              system,
              screenshots: workerEvidence.screenshots,
              source: "live-extracted",
              notes: [workerEvidence.fidelityReport],
            });
          }
        }
      } catch (workerErr: any) {
        console.warn(
          `[Extract Design] Cloudflare Browser Run worker call failed: ${workerErr?.message}. Falling back to next available inspection method.`
        );
      }
    }

    // 1. Attempt Real Headless Chrome Live Inspection if Chrome is available
    if (isChromeAvailable()) {
      try {
        const jobId = crypto.randomUUID();
        const evidence = await inspectLiveSite(
          siteKey,
          parsedUrl.toString(),
          cleanProjectName,
          undefined, // Dynamically detects archetype from empirical metrics
          {
            jobId,
            captureScreenshots: true,
          }
        );

        const system = buildDesignSystemFromEvidence(evidence);

        return NextResponse.json({
          success: true,
          inspectionMethod: "headless-chrome",
          jobId,
          domain,
          projectName: evidence.name,
          evidence,
          system,
          screenshots: evidence.screenshots,
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

      const primaryColor = themeColor || detectedColors[0] || (isDark ? "#3b82f6" : "#2563eb");
      const headingFont = detectedFonts[0] || "Inter, -apple-system, BlinkMacSystemFont, sans-serif";
      const bodyFont = detectedFonts[1] || detectedFonts[0] || headingFont;

      const ssrfEvidence: ReferenceSiteInspectionEvidence = {
        siteKey,
        url: parsedUrl.toString(),
        name: extractedTitle,
        archetype: "modern-saas",
        timestamp: new Date().toISOString(),
        inspectionMethod: "ssrf-fetch",
        viewports: {
          desktop: { width: 1440, height: 900 },
          mobile: { width: 390, height: 844 },
        },
        meta: {
          title: extractedTitle,
          themeColor,
        },
        metrics: {
          body: {
            fontFamily: bodyFont,
            fontSize: "16px",
            fontWeight: "400",
            lineHeight: "1.5",
            letterSpacing: "normal",
            color: isDark ? "#f0f0f0" : "#111111",
            backgroundColor: isDark ? "#08090a" : "#ffffff",
          },
          h1: {
            fontFamily: headingFont,
            fontSize: "48px",
            fontWeight: "700",
            lineHeight: "1.1",
            letterSpacing: "-0.02em",
            color: isDark ? "#ffffff" : "#111111",
            backgroundColor: "transparent",
          },
          h2: {
            fontFamily: headingFont,
            fontSize: "32px",
            fontWeight: "600",
            lineHeight: "1.2",
            letterSpacing: "-0.01em",
            color: isDark ? "#f0f0f0" : "#18181b",
            backgroundColor: "transparent",
          },
          p: {
            fontFamily: bodyFont,
            fontSize: "16px",
            fontWeight: "400",
            lineHeight: "1.6",
            letterSpacing: "normal",
            color: isDark ? "#a1a1aa" : "#64748b",
            backgroundColor: "transparent",
          },
          primaryButton: {
            fontFamily: bodyFont,
            fontSize: "14px",
            fontWeight: "500",
            lineHeight: "1",
            letterSpacing: "normal",
            color: "#ffffff",
            backgroundColor: primaryColor.startsWith("#") ? primaryColor : (isDark ? "#3b82f6" : "#2563eb"),
            borderRadius: "8px",
          },
          containerMaxWidth: undefined,
          isDark,
        },
        extractedPalette: detectedColors,
        extractedFonts: detectedFonts,
        screenshots: {},
        fidelityReport: `Extracted metadata & CSS tokens from HTML stream (${detectedColors.length} colors, ${detectedFonts.length} fonts).`,
      };

      const fallbackSystem = buildDesignSystemFromEvidence(ssrfEvidence);

      return NextResponse.json({
        success: true,
        partial: true,
        fallback: "ssrf-fetch",
        warning:
          "Live headless browser was not available or timed out. Inferred system from HTML metadata.",
        domain,
        projectName: extractedTitle,
        system: fallbackSystem,
        evidence: ssrfEvidence,
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
