import puppeteer from "@cloudflare/puppeteer";

export interface Env {
  MYBROWSER: any;
  INSPECTION_AUTH_SECRET?: string;
  MAX_DURATION_SECONDS?: string;
}

export interface ExtractedMetrics {
  body: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    letterSpacing: string;
    color: string;
    backgroundColor: string;
    textAlign: string;
  };
  headings: {
    h1: { fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string; letterSpacing: string; color: string };
    h2: { fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string; letterSpacing: string; color: string };
    h3?: { fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string; letterSpacing: string; color: string };
    h4?: { fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string; letterSpacing: string; color: string };
  };
  paragraph: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    letterSpacing: string;
    color: string;
    maxWidth?: string;
  };
  layout: {
    containerMaxWidth: string;
    isDark: boolean;
    heroComposition: {
      type: "asymmetric-split" | "centered" | "left-stacked" | "full-bleed";
      textColumnWidth?: string;
      visualColumnWidth?: string;
      alignment: string;
      description: string;
    };
    sectionSpacing: string;
    navbarHeight: string;
    navStyle: "sticky" | "fixed" | "floating" | "static";
  };
  components: {
    primaryButton?: {
      backgroundColor: string;
      color: string;
      borderRadius: string;
      boxShadow: string;
      height: string;
      padding: string;
      fontSize: string;
    };
    card?: {
      backgroundColor: string;
      borderRadius: string;
      boxShadow: string;
      border: string;
    };
    input?: {
      height: string;
      borderRadius: string;
      border: string;
      backgroundColor: string;
    };
    badge?: {
      backgroundColor: string;
      color: string;
      borderRadius: string;
    };
  };
  extractedPalette: string[];
  extractedFonts: string[];
}

function isPrivateIpOrHost(hostname: string): boolean {
  const host = hostname.toLowerCase().trim();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "169.254.169.254" ||
    host === "metadata.google.internal" ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.endsWith(".internal") ||
    host.endsWith(".local") ||
    host.endsWith(".onion")
  ) {
    return true;
  }
  // Check 172.16.0.0 - 172.31.255.255
  if (host.startsWith("172.")) {
    const parts = host.split(".");
    if (parts.length === 4) {
      const second = parseInt(parts[1], 10);
      if (!isNaN(second) && second >= 16 && second <= 31) return true;
    }
  }
  return false;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 1. Method verification
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Only POST requests are supported" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Secret authentication check
    const authSecret = env.INSPECTION_AUTH_SECRET;
    if (authSecret) {
      const authHeader = request.headers.get("Authorization");
      const customHeader = request.headers.get("x-worker-auth");
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
      if (bearerToken !== authSecret && customHeader !== authSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized: Invalid inspection auth token" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 3. Payload parsing & SSRF validation
    let targetUrl: string;
    try {
      const body: any = await request.json();
      targetUrl = body.url;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!targetUrl || typeof targetUrl !== "string") {
      return new Response(JSON.stringify({ error: "Missing required 'url' parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    targetUrl = targetUrl.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`;
    }

    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch {
      return new Response(JSON.stringify({ error: "Malformed URL" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return new Response(JSON.stringify({ error: "Only HTTP and HTTPS protocols are allowed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (isPrivateIpOrHost(parsed.hostname)) {
      return new Response(JSON.stringify({ error: "Target host blocked by SSRF security policy" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!env.MYBROWSER) {
      return new Response(
        JSON.stringify({
          error: "Cloudflare Browser Run binding (MYBROWSER) is not configured in this environment.",
          canFallbackToScreenshot: true,
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Launch isolated Chromium in Cloudflare Browser Run
    let browser: any = null;
    try {
      browser = await puppeteer.launch(env.MYBROWSER);
      const page = await browser.newPage();

      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 ForgeKit/1.0"
      );

      // Subresource SSRF protection
      await page.setRequestInterception(true);
      page.on("request", (req: any) => {
        try {
          const reqUrl = req.url();
          const p = new URL(reqUrl);
          if (!["http:", "https:", "data:", "blob:"].includes(p.protocol)) {
            return req.abort("blockedbyclient");
          }
          if (p.protocol === "data:" || p.protocol === "blob:") {
            return req.continue();
          }
          if (isPrivateIpOrHost(p.hostname)) {
            return req.abort("blockedbyclient");
          }
          req.continue();
        } catch {
          req.abort("blockedbyclient");
        }
      });

      // 5. Desktop Viewport Inspection (1440x900)
      await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
      await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 14000 });
      await new Promise((r) => setTimeout(r, 1500));

      // Desktop screenshot (JPEG quality 75 for bounded payload)
      const desktopBuffer = await page.screenshot({ type: "jpeg", quality: 75, fullPage: false });
      const desktopBase64 = `data:image/jpeg;base64,${Buffer.from(desktopBuffer).toString("base64")}`;

      // 6. Deterministic DOM Metrics Extraction
      const rawMetrics: any = await page.evaluate(() => {
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

        const getMetrics = (el: Element | null) => {
          if (!el) {
            return {
              fontFamily: "sans-serif",
              fontSize: "16px",
              fontWeight: "400",
              lineHeight: "1.5",
              letterSpacing: "normal",
              color: "#000000",
              backgroundColor: "#ffffff",
              textAlign: "left",
            };
          }
          const s = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return {
            fontFamily: s.fontFamily,
            fontSize: s.fontSize,
            fontWeight: s.fontWeight,
            lineHeight: s.lineHeight,
            letterSpacing: s.letterSpacing,
            color: s.color || "#000000",
            backgroundColor: getEffectiveBg(el),
            borderRadius: s.borderRadius !== "0px" ? s.borderRadius : undefined,
            boxShadow: s.boxShadow !== "none" ? s.boxShadow : undefined,
            textAlign: s.textAlign || "left",
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            padding: s.padding,
            border: s.border !== "none" ? s.border : undefined,
          };
        };

        const findVisibleHeading = (tag: string): Element | null => {
          const els = Array.from(document.querySelectorAll(tag));
          for (const el of els) {
            const rect = el.getBoundingClientRect();
            const s = window.getComputedStyle(el);
            const text = (el.textContent || "").trim();
            if (rect.width >= 30 && rect.height >= 14 && s.visibility !== "hidden" && s.display !== "none" && text.length > 0) {
              return el;
            }
          }
          return null;
        };

        const findVisibleButton = (): Element | null => {
          const candidates = Array.from(
            document.querySelectorAll('button, [role="button"], a.btn, a[class*="button"], a[class*="btn"]')
          );
          for (const el of candidates) {
            const rect = el.getBoundingClientRect();
            const s = window.getComputedStyle(el);
            const text = (el.textContent || "").trim();
            if (rect.width >= 40 && rect.height >= 24 && s.visibility !== "hidden" && s.display !== "none" && text.length > 0 && rect.top < 1200) {
              return el;
            }
          }
          return null;
        };

        const findVisibleCard = (): Element | null => {
          const candidates = Array.from(
            document.querySelectorAll('[class*="card"], [class*="box"], [class*="panel"], section > div')
          );
          for (const el of candidates) {
            const rect = el.getBoundingClientRect();
            const s = window.getComputedStyle(el);
            if (rect.width >= 160 && rect.height >= 80 && s.visibility !== "hidden" && s.display !== "none") {
              return el;
            }
          }
          return null;
        };

        // Hero composition spatial heuristics
        const heroEl = document.querySelector("main section, header + section, main > div:first-child, section:first-of-type");
        let heroComposition = {
          type: "left-stacked",
          alignment: "left",
          textColumnWidth: "640px",
          visualColumnWidth: "auto",
          description: "Left-aligned content column",
        };
        if (heroEl) {
          const heroRect = heroEl.getBoundingClientRect();
          const h1 = heroEl.querySelector("h1");
          const h1Rect = h1 ? h1.getBoundingClientRect() : null;
          const img = heroEl.querySelector("img, svg, video, canvas");
          const imgRect = img ? img.getBoundingClientRect() : null;

          if (h1 && window.getComputedStyle(h1).textAlign === "center") {
            heroComposition = {
              type: "centered",
              alignment: "center",
              textColumnWidth: h1Rect ? `${Math.round(h1Rect.width)}px` : "720px",
              visualColumnWidth: imgRect ? `${Math.round(imgRect.width)}px` : "auto",
              description: "Centered hero banner with symmetric focal point",
            };
          } else if (imgRect && h1Rect && imgRect.left > h1Rect.right - 50) {
            heroComposition = {
              type: "asymmetric-split",
              alignment: "left",
              textColumnWidth: `${Math.round(h1Rect.width)}px`,
              visualColumnWidth: `${Math.round(imgRect.width)}px`,
              description: "Asymmetric split layout: constrained copy on the left, visual asset anchored on the right",
            };
          }
        }

        // Palette and font samples
        const colorSamples = new Set<string>();
        const fontSamples = new Set<string>();
        const nodes = document.querySelectorAll("h1, h2, h3, p, a, button, header, nav, main, footer");
        for (const node of Array.from(nodes).slice(0, 50)) {
          const st = window.getComputedStyle(node);
          if (st.color && st.color !== "rgba(0, 0, 0, 0)") colorSamples.add(st.color);
          const bg = getEffectiveBg(node);
          if (bg) colorSamples.add(bg);
          if (st.fontFamily) {
            const font = st.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
            if (font) fontSamples.add(font);
          }
        }

        // Dark mode calculation
        const effectiveBg = getEffectiveBg(document.body);
        let isDark = false;
        const rgbM = effectiveBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbM) {
          const lum = 0.2126 * parseInt(rgbM[1], 10) + 0.7152 * parseInt(rgbM[2], 10) + 0.0722 * parseInt(rgbM[3], 10);
          isDark = lum < 128;
        }

        const navEl = document.querySelector("header, nav");
        const navHeight = navEl ? `${Math.round(navEl.getBoundingClientRect().height)}px` : "64px";
        const navPosition = navEl ? window.getComputedStyle(navEl).position : "static";

        return {
          title: document.title || "",
          body: getMetrics(document.body),
          headings: {
            h1: getMetrics(findVisibleHeading("h1") || document.querySelector("h1")),
            h2: getMetrics(findVisibleHeading("h2") || document.querySelector("h2")),
            h3: getMetrics(findVisibleHeading("h3")),
            h4: getMetrics(findVisibleHeading("h4")),
          },
          paragraph: getMetrics(document.querySelector("p")),
          primaryButton: getMetrics(findVisibleButton()),
          card: getMetrics(findVisibleCard()),
          input: getMetrics(document.querySelector("input:not([type='hidden'])")),
          heroComposition,
          isDark,
          navbarHeight: navHeight,
          navStyle: ["fixed", "sticky"].includes(navPosition) ? (navPosition as any) : "static",
          colorSamples: Array.from(colorSamples),
          fontSamples: Array.from(fontSamples),
        };
      });

      // 7. Mobile Viewport Inspection (390x844)
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1.5, isMobile: true });
      await new Promise((r) => setTimeout(r, 1000));
      const mobileBuffer = await page.screenshot({ type: "jpeg", quality: 75, fullPage: false });
      const mobileBase64 = `data:image/jpeg;base64,${Buffer.from(mobileBuffer).toString("base64")}`;

      return new Response(
        JSON.stringify({
          success: true,
          inspectionMethod: "cloudflare-browser-run",
          url: targetUrl,
          meta: {
            title: rawMetrics.title,
          },
          metrics: {
            body: rawMetrics.body,
            headings: rawMetrics.headings,
            paragraph: rawMetrics.paragraph,
            primaryButton: rawMetrics.primaryButton,
            card: rawMetrics.card,
            input: rawMetrics.input,
            layout: {
              containerMaxWidth: "1280px",
              isDark: rawMetrics.isDark,
              heroComposition: rawMetrics.heroComposition,
              sectionSpacing: "96px",
              navbarHeight: rawMetrics.navbarHeight,
              navStyle: rawMetrics.navStyle,
            },
          },
          extractedPalette: rawMetrics.colorSamples.slice(0, 10),
          extractedFonts: rawMetrics.fontSamples,
          screenshots: {
            desktopDataUri: desktopBase64,
            mobileDataUri: mobileBase64,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({
          error: `Browser Run inspection failed: ${err?.message || "Unknown execution error"}`,
          canFallbackToScreenshot: true,
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch {}
      }
    }
  },
};
