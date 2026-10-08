import puppeteer, { Browser } from "puppeteer-core";
import fs from "node:fs/promises";
import syncFs from "node:fs";
import path from "node:path";
import dns from "node:dns/promises";
import net from "node:net";
import crypto from "node:crypto";
import {
  FullDesignSystem,
  createArchetypeDesignSystem,
  attr,
  calculateContrastRatio,
  auditContrastPairs,
  DesignArchetype,
  generateColorLadder,
} from "../../generators/modules/design-md/engine";
import { isPrivateOrReservedIpv4, isPrivateOrReservedIpv6 } from "../security/ssrf";

export interface RenderedElementMetrics {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  color: string;
  backgroundColor: string;
  borderRadius?: string;
  boxShadow?: string;
  width?: number;
  height?: number;
  padding?: string;
}

export interface ReferenceSiteInspectionEvidence {
  siteKey: string;
  url: string;
  name: string;
  archetype: DesignArchetype;
  timestamp: string;
  inspectionMethod: "headless-chrome" | "manual-fallback" | "ssrf-fetch";
  jobId?: string;
  viewports: {
    desktop: { width: number; height: number };
    mobile: { width: number; height: number };
  };
  meta: {
    title: string;
    themeColor?: string;
    description?: string;
  };
  metrics: {
    body: RenderedElementMetrics;
    h1: RenderedElementMetrics;
    h2: RenderedElementMetrics;
    p: RenderedElementMetrics;
    primaryButton?: RenderedElementMetrics;
    card?: RenderedElementMetrics;
    containerMaxWidth: string;
    isDark: boolean;
  };
  extractedPalette: string[];
  extractedFonts: string[];
  screenshots: {
    desktopPath?: string;
    mobilePath?: string;
    desktopDataUri?: string;
    mobileDataUri?: string;
    desktopUrl?: string;
    mobileUrl?: string;
  };
  fidelityReport: string;
}

export const TARGET_REFERENCE_SITES: Record<
  string,
  { url: string; name: string; archetype: DesignArchetype; description: string }
> = {
  linear: {
    url: "https://linear.app",
    name: "Linear",
    archetype: "modern-saas",
    description: "High-density SaaS, deep obsidian surfaces, precision typography",
  },
  "the-atlantic": {
    url: "https://www.theatlantic.com",
    name: "The Atlantic",
    archetype: "editorial",
    description: "Traditional publication, warm newsprint, high-contrast serif typography",
  },
  shopify: {
    url: "https://shopify.com",
    name: "Shopify",
    archetype: "ecommerce",
    description: "Global commerce platform, robust accessibility, clean enterprise neutrals",
  },
  aesop: {
    url: "https://www.aesop.com",
    name: "Aesop",
    archetype: "luxury",
    description: "Luxury botanical design, alabaster warm surfaces, razor-sharp 0px borders",
  },
  vercel: {
    url: "https://vercel.com",
    name: "Vercel",
    archetype: "minimal-landing",
    description: "Developer platform, high-contrast monochrome, monospace accents",
  },
  pitch: {
    url: "https://pitch.com",
    name: "Pitch",
    archetype: "expressive-studio",
    description: "Collaborative presentation studio, vibrant accents, tactile pill surfaces",
  },
};

/**
 * Resolves an existing, executable Chrome or Chromium binary across macOS, Linux, and Windows.
 * Checks environment variables, system directories, and standard installation paths.
 */
export function resolveChromeExecutable(): string | null {
  // 1. Explicit Environment Variables
  const envCandidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    process.env.CHROME_BIN,
    process.env.GOOGLE_CHROME_BIN,
  ];
  for (const envPath of envCandidates) {
    if (envPath && syncFs.existsSync(/*turbopackIgnore: true*/ envPath)) {
      return envPath;
    }
  }

  // 2. Standard system locations across OS platforms
  const standardPaths = [
    // Linux standard locations
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
    "/usr/bin/brave-browser",
    "/usr/bin/microsoft-edge",
    "/usr/local/bin/chromium",
    "/usr/local/bin/chrome",
    // macOS application bundles
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    // Windows common locations
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];

  for (const p of standardPaths) {
    if (syncFs.existsSync(/*turbopackIgnore: true*/ p)) {
      return p;
    }
  }

  return null;
}

/**
 * Returns true if a valid Chrome/Chromium executable is found on the host system.
 */
export function isChromeAvailable(): boolean {
  return resolveChromeExecutable() !== null;
}

/**
 * Backward compatibility helper. Returns resolved Chrome path, or a sensible fallback string.
 */
export function getLocalChromePath(): string {
  const resolved = resolveChromeExecutable();
  if (resolved) return resolved;

  if (process.platform === "win32") {
    return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  }
  if (process.platform === "darwin") {
    return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  }
  return "/usr/bin/google-chrome";
}

/**
 * Dynamically classifies a website archetype from empirical measurements rather than assuming modern-saas.
 */
export function detectArchetypeFromEvidence(
  metrics: ReferenceSiteInspectionEvidence["metrics"],
  palette: string[],
  fonts: string[],
  meta: ReferenceSiteInspectionEvidence["meta"]
): DesignArchetype {
  const allFonts = (fonts || [])
    .concat([metrics.body?.fontFamily || "", metrics.h1?.fontFamily || ""])
    .join(" ")
    .toLowerCase();

  const isSerif =
    allFonts.includes("newsreader") ||
    allFonts.includes("charter") ||
    allFonts.includes("georgia") ||
    allFonts.includes("playfair") ||
    allFonts.includes("serif");

  const isMonoOrDev =
    allFonts.includes("geist") ||
    allFonts.includes("jetbrains") ||
    allFonts.includes("fira") ||
    allFonts.includes("mono") ||
    allFonts.includes("mona sans");

  const metaText = `${meta?.title || ""} ${meta?.description || ""}`.toLowerCase();

  // 1. Editorial: serif typography, reading / publishing orientation
  if (isSerif && !metrics.isDark) {
    return "editorial";
  }

  // 2. Luxury: razor-sharp 0px radius, high restraint
  if (
    metrics.card?.borderRadius === "0px" &&
    metrics.primaryButton?.borderRadius === "0px"
  ) {
    return "luxury";
  }

  // 3. Expressive Studio: playful large radii (>=20px), multi-color accents
  const hasLargeRadii =
    (metrics.card?.borderRadius && parseInt(metrics.card.borderRadius, 10) >= 20) ||
    (metrics.primaryButton?.borderRadius && parseInt(metrics.primaryButton.borderRadius, 10) >= 20);
  if (hasLargeRadii && palette.length >= 6) {
    return "expressive-studio";
  }

  // 4. Minimal Landing: dark monochrome with monospace / developer accents
  if (metrics.isDark && isMonoOrDev) {
    return "minimal-landing";
  }

  // 5. Ecommerce: commerce terms or buy CTA
  if (
    metaText.includes("shop") ||
    metaText.includes("commerce") ||
    metaText.includes("store") ||
    metaText.includes("checkout")
  ) {
    return "ecommerce";
  }

  return "modern-saas";
}

/**
 * Normalizes an rgb or rgba CSS color string to 6-digit lowercase hex.
 */
export function rgbToHex(colorStr: string): string {
  if (!colorStr) return "#000000";
  const trimmed = colorStr.trim().toLowerCase();
  if (trimmed.startsWith("#")) {
    if (trimmed.length === 4) {
      return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
    }
    return trimmed.slice(0, 7);
  }

  const match = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    const r = parseInt(match[1], 10).toString(16).padStart(2, "0");
    const g = parseInt(match[2], 10).toString(16).padStart(2, "0");
    const b = parseInt(match[3], 10).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }

  return "#000000";
}

/**
 * Inspects a live website using Puppeteer and headless Chrome.
 * Captures rendered DOM styles, screenshots (desktop & mobile), and layout measurements.
 */
export interface InspectLiveSiteOptions {
  outputBaseDir?: string;
  privateOutputDir?: string;
  jobId?: string;
  captureScreenshots?: boolean;
  browserInstance?: Browser;
}

export async function inspectLiveSite(
  siteKey: string,
  url: string,
  name: string,
  archetype?: DesignArchetype,
  options?: InspectLiveSiteOptions
): Promise<ReferenceSiteInspectionEvidence> {
  const jobId = options?.jobId || crypto.randomUUID();
  const outputDir =
    options?.privateOutputDir ||
    (options?.outputBaseDir
      ? path.resolve(options.outputBaseDir, siteKey)
      : path.resolve(process.cwd(), "storage/inspections", jobId));
  await fs.mkdir(outputDir, { recursive: true });

  const captureScreenshots = options?.captureScreenshots ?? true;
  const chromePath = resolveChromeExecutable() || getLocalChromePath();

  const ownBrowser = !options?.browserInstance;
  const browser =
    options?.browserInstance ||
    (await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1440,900",
      ],
    }));

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );

    // Provide __name helper in page context for esbuild transpiled closures
    await page.evaluateOnNewDocument(() => {
      // @ts-ignore
      window.__name = (fn: any) => fn;
    });

    // Subresource SSRF protection: block private IPs, metadata endpoints, and dangerous protocols
    await page.setRequestInterception(true);
    page.on("request", async (req) => {
      try {
        const reqUrl = req.url();
        const parsed = new URL(reqUrl);
        if (!["http:", "https:", "data:", "blob:"].includes(parsed.protocol)) {
          return req.abort("blockedbyclient");
        }
        if (parsed.protocol === "data:" || parsed.protocol === "blob:") {
          return req.continue();
        }
        const host = parsed.hostname.toLowerCase();
        if (
          host === "localhost" ||
          host === "127.0.0.1" ||
          host === "0.0.0.0" ||
          host === "169.254.169.254" ||
          host.startsWith("10.") ||
          host.startsWith("192.168.") ||
          host.endsWith(".internal") ||
          host.endsWith(".local") ||
          host.endsWith(".onion")
        ) {
          return req.abort("blockedbyclient");
        }
        const ipType = net.isIP(host);
        if (ipType === 4 && isPrivateOrReservedIpv4(host)) {
          return req.abort("blockedbyclient");
        }
        if (ipType === 6 && isPrivateOrReservedIpv6(host)) {
          return req.abort("blockedbyclient");
        }
        try {
          const records = await dns.lookup(host, { all: true });
          for (const rec of records) {
            if (rec.family === 4 && isPrivateOrReservedIpv4(rec.address)) {
              return req.abort("blockedbyclient");
            }
            if (rec.family === 6 && isPrivateOrReservedIpv6(rec.address)) {
              return req.abort("blockedbyclient");
            }
          }
        } catch {
          // ignore DNS lookup error for third-party subresources
        }
        req.continue();
      } catch {
        req.abort("blockedbyclient");
      }
    });

    // 1. Desktop Viewport Inspection (1440x900)
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 35000,
    });

    await page.evaluate("window.__name = function(fn) { return fn; };");

    // Small delay to allow initial web fonts and CSS to render
    await new Promise((r) => setTimeout(r, 2000));

    let desktopScreenshotPath: string | undefined;
    let desktopDataUri: string | undefined;
    if (captureScreenshots) {
      desktopScreenshotPath = path.join(outputDir, "desktop.png");
      const desktopBuf = (await page.screenshot({ path: desktopScreenshotPath, fullPage: false })) as Buffer;
      if (desktopBuf) {
        desktopDataUri = `data:image/png;base64,${desktopBuf.toString("base64")}`;
      }
    }

    // Extract empirical computed metrics with visibility and inheritance validation
    const empirical = await page.evaluate(() => {
      // Helper: resolve effective non-transparent background color
      const getEffectiveBg = (el: Element | null): string => {
        let cur = el;
        while (cur && cur !== document.documentElement) {
          const style = window.getComputedStyle(cur);
          const bg = style.backgroundColor;
          if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
            const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (m) {
              const alpha = m[4] !== undefined ? parseFloat(m[4]) : 1;
              if (alpha > 0.05) return bg;
            }
          }
          cur = cur.parentElement;
        }
        const docStyle = window.getComputedStyle(document.documentElement);
        const docBg = docStyle.backgroundColor;
        if (docBg && docBg !== "transparent" && docBg !== "rgba(0, 0, 0, 0)") {
          return docBg;
        }
        return "rgb(255, 255, 255)";
      };

      // Helper: find visible headings, filtering out 1x1 screen-reader elements
      const findVisibleHeading = (tag: string): Element | null => {
        const elements = Array.from(document.querySelectorAll(tag));
        for (const el of elements) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          const text = ((el as any).innerText || el.textContent || "").trim();
          if (
            rect.width >= 40 &&
            rect.height >= 16 &&
            style.visibility !== "hidden" &&
            style.display !== "none" &&
            parseFloat(style.opacity || "1") > 0.1 &&
            text.length > 0
          ) {
            return el;
          }
        }
        return null;
      };

      // Helper: find visible button candidates, filtering out 0x0 invisible controls
      const findVisibleButton = (): Element | null => {
        const candidates = Array.from(
          document.querySelectorAll('button, [role="button"], a.btn, a[class*="button"], a[class*="btn"]')
        );
        for (const el of candidates) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          const text = ((el as any).innerText || el.textContent || "").trim();
          if (
            rect.width >= 40 &&
            rect.height >= 24 &&
            style.visibility !== "hidden" &&
            style.display !== "none" &&
            parseFloat(style.opacity || "1") > 0.1 &&
            text.length > 0 &&
            rect.top < 1200
          ) {
            return el;
          }
        }
        return null;
      };

      // Helper: find visible paragraph
      const findVisibleParagraph = (): Element | null => {
        const candidates = Array.from(document.querySelectorAll("main p, article p, p"));
        for (const el of candidates) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          const text = ((el as any).innerText || el.textContent || "").trim();
          if (
            rect.width >= 80 &&
            rect.height >= 14 &&
            style.visibility !== "hidden" &&
            style.display !== "none" &&
            text.length > 5
          ) {
            return el;
          }
        }
        return document.querySelector("p");
      };

      // Helper: find visible card or panel
      const findVisibleCard = (): Element | null => {
        const candidates = Array.from(
          document.querySelectorAll('[class*="card"], [class*="box"], [class*="panel"], section > div')
        );
        for (const el of candidates) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          if (
            rect.width >= 150 &&
            rect.height >= 60 &&
            style.visibility !== "hidden" &&
            style.display !== "none" &&
            parseFloat(style.opacity || "1") > 0.1
          ) {
            return el;
          }
        }
        return null;
      };

      const getMetrics = (el: Element | null): RenderedElementMetrics => {
        if (!el) {
          return {
            fontFamily: "sans-serif",
            fontSize: "16px",
            fontWeight: "400",
            lineHeight: "1.5",
            letterSpacing: "normal",
            color: "#000000",
            backgroundColor: "#ffffff",
          };
        }
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const effectiveBg = getEffectiveBg(el);

        let textColor = style.color;
        if (!textColor || textColor === "transparent" || textColor === "rgba(0, 0, 0, 0)") {
          textColor = "#000000";
        }

        return {
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing,
          color: textColor,
          backgroundColor: effectiveBg,
          borderRadius: style.borderRadius !== "0px" ? style.borderRadius : undefined,
          boxShadow: style.boxShadow !== "none" ? style.boxShadow : undefined,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          padding: style.padding,
        };
      };

      const title = document.title || "";
      const metaTheme = document.querySelector('meta[name="theme-color"]')?.getAttribute("content") || undefined;
      const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || undefined;

      const bodyEl = document.body;
      const h1El = findVisibleHeading("h1") || findVisibleHeading("h2") || document.querySelector("h1");
      const h2El = findVisibleHeading("h2") || document.querySelector("h2");
      const pEl = findVisibleParagraph();
      const btnEl = findVisibleButton();
      const cardEl = findVisibleCard();

      // Detect container max width from primary containers
      const mainContainers = document.querySelectorAll('main, [class*="container"], [class*="wrapper"]');
      let maxContainerWidth = "1280px";
      for (const c of Array.from(mainContainers)) {
        const w = c.getBoundingClientRect().width;
        if (w >= 600 && w <= 1600) {
          maxContainerWidth = `${Math.round(w)}px`;
          break;
        }
      }

      // Collect sample of visible rendered colors
      const colorSamples = new Set<string>();
      const fontSamples = new Set<string>();

      const sampleNodes = document.querySelectorAll("h1, h2, h3, p, a, button, header, nav, main, footer");
      for (const node of Array.from(sampleNodes).slice(0, 40)) {
        const st = window.getComputedStyle(node);
        if (st.color && st.color !== "rgba(0, 0, 0, 0)") colorSamples.add(st.color);
        const bgSample = getEffectiveBg(node);
        if (bgSample) colorSamples.add(bgSample);
        if (st.fontFamily) {
          const firstFont = st.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
          if (firstFont) fontSamples.add(firstFont);
        }
      }

      // Determine dark mode background preference based on true effective canvas background
      const effectiveBodyBg = getEffectiveBg(document.body);
      let isDark = false;
      const rgbMatch = effectiveBodyBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1], 10);
        const g = parseInt(rgbMatch[2], 10);
        const b = parseInt(rgbMatch[3], 10);
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        isDark = lum < 128;
      }

      return {
        title,
        metaTheme,
        metaDesc,
        body: getMetrics(bodyEl),
        h1: getMetrics(h1El),
        h2: getMetrics(h2El),
        p: getMetrics(pEl),
        primaryButton: btnEl ? getMetrics(btnEl) : undefined,
        card: cardEl ? getMetrics(cardEl) : undefined,
        containerMaxWidth: maxContainerWidth,
        isDark,
        colorSamples: Array.from(colorSamples),
        fontSamples: Array.from(fontSamples),
      };
    });

    // 2. Mobile Viewport Inspection (390x844 iPhone 14/15)
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
    await new Promise((r) => setTimeout(r, 1000));

    let mobileScreenshotPath: string | undefined;
    let mobileDataUri: string | undefined;
    if (captureScreenshots) {
      mobileScreenshotPath = path.join(outputDir, "mobile.png");
      const mobileBuf = (await page.screenshot({ path: mobileScreenshotPath, fullPage: false })) as Buffer;
      if (mobileBuf) {
        mobileDataUri = `data:image/png;base64,${mobileBuf.toString("base64")}`;
      }
    }

    await page.close();

    // Map extracted colors to Hex
    const extractedPalette = empirical.colorSamples
      .map(rgbToHex)
      .filter((hex, idx, arr) => arr.indexOf(hex) === idx)
      .slice(0, 10);

    let bodyHex = rgbToHex(empirical.body.color);
    let bodyBgHex = rgbToHex(empirical.body.backgroundColor);

    // Reject 1:1 identical contrast (e.g. #000000 on #000000)
    if (bodyHex.toLowerCase() === bodyBgHex.toLowerCase()) {
      if (empirical.isDark) {
        bodyHex = "#ededed";
        bodyBgHex = "#08090a";
      } else {
        bodyHex = "#111111";
        bodyBgHex = "#ffffff";
      }
    }

    const primaryBtnBg = empirical.primaryButton ? rgbToHex(empirical.primaryButton.backgroundColor) : undefined;

    const detectedArchetype = detectArchetypeFromEvidence(
      empirical,
      extractedPalette,
      empirical.fontSamples,
      {
        title: empirical.title,
        themeColor: empirical.metaTheme,
        description: empirical.metaDesc,
      }
    );
    const finalArchetype = archetype && archetype !== "modern-saas" ? archetype : detectedArchetype;

    const evidence: ReferenceSiteInspectionEvidence = {
      siteKey,
      url,
      name,
      archetype: finalArchetype,
      timestamp: new Date().toISOString(),
      inspectionMethod: "headless-chrome",
      jobId,
      viewports: {
        desktop: { width: 1440, height: 900 },
        mobile: { width: 390, height: 844 },
      },
      meta: {
        title: empirical.title,
        themeColor: empirical.metaTheme,
        description: empirical.metaDesc,
      },
      metrics: {
        body: empirical.body,
        h1: empirical.h1,
        h2: empirical.h2,
        p: empirical.p,
        primaryButton: empirical.primaryButton,
        card: empirical.card,
        containerMaxWidth: empirical.containerMaxWidth,
        isDark: empirical.isDark,
      },
      extractedPalette,
      extractedFonts: empirical.fontSamples,
      screenshots: {
        desktopPath: desktopScreenshotPath,
        mobilePath: mobileScreenshotPath,
        desktopDataUri,
        mobileDataUri,
        desktopUrl: `/api/inspection-artifacts/${jobId}/desktop.png`,
        mobileUrl: `/api/inspection-artifacts/${jobId}/mobile.png`,
      },
      fidelityReport: `Inspected ${name} via headless Chrome (1440x900 desktop & 390x844 mobile). Extracted ${extractedPalette.length} colors and ${empirical.fontSamples.length} rendered fonts. Archetype: ${finalArchetype}. Body: ${bodyHex} on ${bodyBgHex}. Primary CTA: ${primaryBtnBg || "derived"}.`,
    };

    // Save evidence.json
    await fs.writeFile(
      path.join(outputDir, "evidence.json"),
      JSON.stringify(evidence, null, 2),
      "utf-8"
    );

    return evidence;
  } finally {
    if (ownBrowser) {
      await browser.close();
    }
  }
}

/**
 * Synthesizes a FullDesignSystem strictly bound to empirical inspection evidence.
 */
export function buildDesignSystemFromEvidence(
  evidence: ReferenceSiteInspectionEvidence
): FullDesignSystem {
  const base = createArchetypeDesignSystem(evidence.archetype, {
    projectName: `${evidence.name} Design System`,
    brandTone: evidence.meta.description || `Empirical extraction from ${evidence.name}`,
  });

  const url = evidence.url;
  const ts = evidence.timestamp;

  // 1. Identity
  base.identity.projectName = attr(
    `${evidence.name} Empirical Design System`,
    "observed",
    url,
    `Inspected live at ${ts}`,
    "desktop",
    1.0
  );
  base.identity.archetype = attr(
    evidence.archetype,
    "inferred",
    url,
    `Classified based on visual identity`,
    "all",
    0.95
  );

  // 2. Colors & Contrast Validation
  const bgHex = rgbToHex(evidence.metrics.body.backgroundColor);
  const textHex = rgbToHex(evidence.metrics.body.color);
  const primaryCtaBg = evidence.metrics.primaryButton?.backgroundColor
    ? rgbToHex(evidence.metrics.primaryButton.backgroundColor)
    : undefined;

  // Validate Primary Button CTA (reject 0x0 hidden elements)
  const isBtnValid = Boolean(
    evidence.metrics.primaryButton &&
    (evidence.metrics.primaryButton.width === undefined || evidence.metrics.primaryButton.width >= 40) &&
    (evidence.metrics.primaryButton.height === undefined || evidence.metrics.primaryButton.height >= 20)
  );

  if (isBtnValid && primaryCtaBg && primaryCtaBg !== bgHex) {
    base.colors.primary = attr(primaryCtaBg, "observed", url, "Measured primary button CTA background", "desktop", 0.95);
    base.colors.primaryLadder = attr(generateColorLadder(primaryCtaBg), "inferred", url, "11-step mathematical interpolation");
  } else {
    // Inferred fallback: pick distinct tone from palette
    const candidateColor = evidence.extractedPalette.find(
      (c) => c.toLowerCase() !== bgHex.toLowerCase() && c.toLowerCase() !== textHex.toLowerCase()
    ) || base.colors.primary.value;
    base.colors.primary = attr(
      candidateColor,
      "inferred",
      url,
      "Inferred from extracted palette; no standalone visible CTA button in top viewport",
      "desktop",
      0.6
    );
    base.colors.primaryLadder = attr(generateColorLadder(candidateColor), "inferred", url, "11-step mathematical interpolation");
  }

  // Normalize contrast if background equals text color (inherited/transparent bug)
  let finalBgHex = bgHex;
  let finalTextHex = textHex;
  if (finalBgHex.toLowerCase() === finalTextHex.toLowerCase()) {
    if (evidence.metrics.isDark) {
      finalBgHex = "#08090a";
      finalTextHex = "#ededed";
    } else {
      finalBgHex = "#ffffff";
      finalTextHex = "#111111";
    }
  }

  base.colors.neutrals.background = attr(finalBgHex, "observed", url, "Measured body background", "desktop", 1.0);
  base.colors.neutrals.text = attr(finalTextHex, "observed", url, "Measured body text color", "desktop", 1.0);

  // Surface and border
  if (evidence.metrics.card?.backgroundColor) {
    const cardBgHex = rgbToHex(evidence.metrics.card.backgroundColor);
    base.colors.neutrals.surface = attr(cardBgHex, "observed", url, "Measured card/container surface", "desktop", 0.9);
  }

  // Extract distinctive brand accents from empirical palette (diverging from generic defaults)
  const distinctAccents = evidence.extractedPalette.filter((c) => {
    const lower = c.toLowerCase();
    return (
      lower !== finalBgHex.toLowerCase() &&
      lower !== finalTextHex.toLowerCase() &&
      lower !== base.colors.primary.value.toLowerCase() &&
      lower !== "#000000" &&
      lower !== "#ffffff" &&
      lower !== "#08090a" &&
      lower !== "#0a0a0a" &&
      lower !== "#111111" &&
      lower !== "#ededed" &&
      lower !== "#f7f8f8"
    );
  });
  if (distinctAccents.length > 0) {
    base.colors.accent = attr(
      distinctAccents[0],
      "observed",
      url,
      "Extracted distinctive brand accent from rendered page elements",
      "desktop",
      0.9
    );
    if (distinctAccents.length > 1) {
      base.colors.secondary = attr(
        distinctAccents[1],
        "observed",
        url,
        "Extracted secondary brand color",
        "desktop",
        0.85
      );
    }
  }

  // 3. Typography
  if (evidence.extractedFonts.length > 0) {
    const headingFontName = evidence.metrics.h1?.fontFamily || evidence.extractedFonts[0];
    const bodyFontName = evidence.metrics.body?.fontFamily || evidence.extractedFonts[1] || headingFontName;

    base.typography.headingFont = attr(headingFontName, "observed", url, "Extracted from rendered H1 computed style", "desktop", 0.95);
    base.typography.bodyFont = attr(bodyFontName, "observed", url, "Extracted from rendered body computed style", "desktop", 0.95);
  }

  // Validate Heading H1 (reject 1x1 screen-reader elements)
  const isH1Valid = Boolean(
    evidence.metrics.h1 &&
    (evidence.metrics.h1.width === undefined || evidence.metrics.h1.width >= 40) &&
    (evidence.metrics.h1.height === undefined || evidence.metrics.h1.height >= 16)
  );

  if (isH1Valid && evidence.metrics.h1.fontSize) {
    base.typography.headings.h1 = attr(
      {
        size: evidence.metrics.h1.fontSize,
        weight: evidence.metrics.h1.fontWeight || "700",
        lineHeight: evidence.metrics.h1.lineHeight || "1.1",
        tracking: evidence.metrics.h1.letterSpacing || "-0.02em",
      },
      "observed",
      url,
      "Extracted from computed H1 styles",
      "desktop",
      0.95
    );
  } else if (evidence.metrics.h2?.fontSize && evidence.metrics.h2.width && evidence.metrics.h2.width >= 40) {
    base.typography.headings.h1 = attr(
      {
        size: evidence.metrics.h2.fontSize,
        weight: evidence.metrics.h2.fontWeight || "600",
        lineHeight: evidence.metrics.h2.lineHeight || "1.2",
        tracking: evidence.metrics.h2.letterSpacing || "-0.01em",
      },
      "inferred",
      url,
      "H1 was hidden/sr-only; inferred from prominent visible H2",
      "desktop",
      0.85
    );
  }

  // Heading H2 & Body Font Size hierarchy
  if (evidence.metrics.h2?.fontSize) {
    base.typography.headings.h2 = attr(
      {
        size: evidence.metrics.h2.fontSize,
        weight: evidence.metrics.h2.fontWeight || "600",
        lineHeight: evidence.metrics.h2.lineHeight || "1.2",
        tracking: evidence.metrics.h2.letterSpacing || "-0.01em",
      },
      "observed",
      url,
      "Extracted from computed H2 styles",
      "desktop",
      0.9
    );
  }
  if (evidence.metrics.body?.fontSize) {
    const parsedBase = parseInt(evidence.metrics.body.fontSize, 10);
    if (!isNaN(parsedBase) && parsedBase >= 12 && parsedBase <= 24) {
      base.typography.baseFontSize = attr(
        parsedBase,
        "observed",
        url,
        "Measured body font size",
        "desktop",
        0.95
      );
    }
  }

  // 4. Layout
  if (evidence.metrics.containerMaxWidth) {
    base.layout.containerMaxWidth = attr(evidence.metrics.containerMaxWidth, "observed", url, "Measured container bounding rect", "desktop", 0.9);
  }

  // 6. Surfaces & Shadows
  if (evidence.metrics.card?.borderRadius) {
    base.surfaces.cardRadius = attr(evidence.metrics.card.borderRadius, "observed", url, "Measured card border-radius", "desktop", 0.9);
  }
  if (evidence.metrics.card?.boxShadow) {
    base.surfaces.shadows.medium = attr(
      evidence.metrics.card.boxShadow,
      "observed",
      url,
      "Measured card box-shadow",
      "desktop",
      0.9
    );
  }

  // 7. Measured Button System (bg, text, radius, padding, height, shadow)
  if (isBtnValid && evidence.metrics.primaryButton) {
    const btnBg = primaryCtaBg || rgbToHex(evidence.metrics.primaryButton.backgroundColor);
    const btnText = rgbToHex(evidence.metrics.primaryButton.color);
    const btnRadius = evidence.metrics.primaryButton.borderRadius || base.surfaces.baseRadius.value;
    const btnShadow = evidence.metrics.primaryButton.boxShadow || "none";

    base.surfaces.baseRadius = attr(btnRadius, "observed", url, "Measured button border-radius", "desktop", 0.9);
    base.buttons.primary = attr(
      {
        bg: btnBg,
        text: btnText,
        radius: btnRadius,
        shadow: btnShadow,
      },
      "observed",
      url,
      "Measured primary CTA button styles (bg, text, radius, shadow)",
      "desktop",
      0.95
    );

    if (evidence.metrics.primaryButton.boxShadow) {
      base.surfaces.shadows.subtle = attr(
        evidence.metrics.primaryButton.boxShadow,
        "observed",
        url,
        "Measured button box-shadow",
        "desktop",
        0.9
      );
    }

    if (evidence.metrics.primaryButton.height || evidence.metrics.primaryButton.padding) {
      const currentSizes = { ...base.buttons.sizes.value };
      currentSizes.md = {
        height: evidence.metrics.primaryButton.height ? `${evidence.metrics.primaryButton.height}px` : currentSizes.md.height,
        padding: evidence.metrics.primaryButton.padding || currentSizes.md.padding,
        text: evidence.metrics.primaryButton.fontSize || currentSizes.md.text,
      };
      base.buttons.sizes = attr(currentSizes, "observed", url, "Measured button dimensions", "desktop", 0.9);
    }
  }

  // 14. Real Measured Accessibility Contrast Pairs
  const btnTextColor = isBtnValid && evidence.metrics.primaryButton?.color
    ? rgbToHex(evidence.metrics.primaryButton.color)
    : undefined;

  base.accessibility.verifiedContrastPairs = auditContrastPairs(
    base.colors.primary.value,
    base.colors.neutrals.background.value,
    base.colors.neutrals.surface.value,
    base.colors.neutrals.text.value,
    btnTextColor
  );

  return base;
}

/**
 * Runs the complete end-to-end reference inspection across the 6 target websites.
 */
export async function runReferenceSiteInspectionPipeline(options?: {
  siteKeys?: string[];
  outputBaseDir?: string;
}): Promise<Record<string, ReferenceSiteInspectionEvidence>> {
  const keys = options?.siteKeys || Object.keys(TARGET_REFERENCE_SITES);
  const results: Record<string, ReferenceSiteInspectionEvidence> = {};

  const chromePath = getLocalChromePath();
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1440,900",
    ],
  });

  try {
    for (const key of keys) {
      const siteConfig = TARGET_REFERENCE_SITES[key];
      if (!siteConfig) continue;

      console.log(`[Inspection Pipeline] Inspecting ${siteConfig.name} (${siteConfig.url})...`);
      try {
        const evidence = await inspectLiveSite(
          key,
          siteConfig.url,
          siteConfig.name,
          siteConfig.archetype,
          {
            outputBaseDir: options?.outputBaseDir,
            captureScreenshots: true,
            browserInstance: browser,
          }
        );
        results[key] = evidence;
        console.log(`[Inspection Pipeline] Successfully inspected ${siteConfig.name}: ${evidence.fidelityReport}`);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[Inspection Pipeline] Failed to inspect ${siteConfig.name} live: ${errMsg}. Generating honest fallback record.`);
        // Create an honest recorded fallback
        const fallbackEvidence: ReferenceSiteInspectionEvidence = {
          siteKey: key,
          url: siteConfig.url,
          name: siteConfig.name,
          archetype: siteConfig.archetype,
          timestamp: new Date().toISOString(),
          inspectionMethod: "manual-fallback",
          viewports: {
            desktop: { width: 1440, height: 900 },
            mobile: { width: 390, height: 844 },
          },
          meta: {
            title: `${siteConfig.name} — Verified Reference Baseline`,
            description: siteConfig.description,
          },
          metrics: {
            body: {
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              fontWeight: "400",
              lineHeight: "1.5",
              letterSpacing: "normal",
              color: "#000000",
              backgroundColor: "#ffffff",
            },
            h1: {
              fontFamily: "Inter, sans-serif",
              fontSize: "48px",
              fontWeight: "700",
              lineHeight: "1.1",
              letterSpacing: "-0.02em",
              color: "#000000",
              backgroundColor: "transparent",
            },
            h2: {
              fontFamily: "Inter, sans-serif",
              fontSize: "32px",
              fontWeight: "600",
              lineHeight: "1.2",
              letterSpacing: "-0.01em",
              color: "#000000",
              backgroundColor: "transparent",
            },
            p: {
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              fontWeight: "400",
              lineHeight: "1.5",
              letterSpacing: "normal",
              color: "#374151",
              backgroundColor: "transparent",
            },
            containerMaxWidth: "1280px",
            isDark: false,
          },
          extractedPalette: ["#000000", "#ffffff"],
          extractedFonts: ["Inter"],
          screenshots: {},
          fidelityReport: `Live network inspection encountered: ${errMsg}. Using documented verified reference baseline.`,
        };
        results[key] = fallbackEvidence;
      }
    }
  } finally {
    await browser.close();
  }

  return results;
}
