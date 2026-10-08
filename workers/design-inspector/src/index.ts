// Dynamically resolve puppeteer to support both Cloudflare Workers runtime and unit test environments
let _puppeteerModule: any = null;
async function getPuppeteer() {
  if (!_puppeteerModule) {
    try {
      // @ts-ignore
      _puppeteerModule = await import("@cloudflare/puppeteer");
    } catch {
      return null;
    }
  }
  return _puppeteerModule?.default || _puppeteerModule;
}

export interface Env {
  MYBROWSER: any;
  INSPECTION_AUTH_SECRET: string;
  ALLOWED_DOMAINS?: string;
  RATE_LIMITER?: {
    limit: (options: { key: string }) => Promise<{ success: boolean }>;
  };
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
    containerMaxWidth?: string;
    isDark: boolean;
    heroComposition: {
      type: "asymmetric-split" | "centered" | "left-stacked" | "full-bleed";
      textColumnWidth?: string;
      visualColumnWidth?: string;
      alignment: string;
      description: string;
    };
    sectionSpacing?: string;
    navbarHeight: string;
    navStyle: "sticky" | "fixed" | "floating" | "static";
  };
  components: {
    primaryButton?: {
      backgroundColor: string;
      color: string;
      borderRadius: string;
      boxShadow?: string;
      height?: string;
      padding?: string;
      fontSize?: string;
    };
    card?: {
      backgroundColor: string;
      borderRadius?: string;
      boxShadow?: string;
      border?: string;
    };
    input?: {
      height?: string;
      borderRadius?: string;
      border?: string;
      backgroundColor?: string;
    };
    badge?: {
      backgroundColor?: string;
      color?: string;
      borderRadius?: string;
    };
  };
  extractedPalette: string[];
  extractedFonts: string[];
}

/**
 * Parses any IPv4 string representation (dotted decimal, hex, octal, single integer) to a 32-bit unsigned number.
 */
export function parseIpv4ToNumber(ip: string): number | null {
  const trimmed = ip.trim();
  if (/^0x[0-9a-fA-F]+$/i.test(trimmed)) {
    const val = parseInt(trimmed, 16);
    return val >= 0 && val <= 0xffffffff ? val : null;
  }
  if (/^\d+$/.test(trimmed)) {
    const val = parseInt(trimmed, 10);
    return val >= 0 && val <= 0xffffffff ? val : null;
  }
  const parts = trimmed.split(".");
  if (parts.length !== 4) return null;
  let num = 0;
  for (let i = 0; i < 4; i++) {
    const p = parts[i];
    let val: number;
    if (/^0x[0-9a-fA-F]+$/i.test(p)) {
      val = parseInt(p, 16);
    } else if (/^0[0-7]+$/.test(p)) {
      val = parseInt(p, 8);
    } else if (/^\d+$/.test(p)) {
      val = parseInt(p, 10);
    } else {
      return null;
    }
    if (isNaN(val) || val < 0 || val > 255) return null;
    num = (num << 8) | val;
  }
  return num >>> 0;
}

/**
 * Checks if a parsed IPv4 address belongs to private, loopback, or reserved ranges.
 */
export function isPrivateIpv4Num(num: number): boolean {
  const a = (num >>> 24) & 0xff;
  const b = (num >>> 16) & 0xff;
  const c = (num >>> 8) & 0xff;

  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a === 127) return true; // 127.0.0.0/8 Loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 Link-local / Cloud Metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return true; // 192.0.0.0/24, 192.0.2.0/24
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15
  if (a === 198 && b === 51 && c === 100) return true; // 198.51.100.0/24
  if (a === 203 && b === 0 && c === 113) return true; // 203.0.113.0/24
  if (a >= 224) return true; // 224.0.0.0/4 Multicast & 240.0.0.0/4 Reserved & Broadcast
  return false;
}

/**
 * Checks if an IPv6 address belongs to private, loopback, or reserved ranges.
 */
export function isPrivateIpv6Str(ip: string): boolean {
  const clean = ip.toLowerCase().trim().replace(/^\[|\]$/g, "");
  if (clean === "::1" || clean === "::" || clean === "0:0:0:0:0:0:0:1" || clean === "0:0:0:0:0:0:0:0") return true;
  // Link-local fe80::/10
  if (clean.startsWith("fe8") || clean.startsWith("fe9") || clean.startsWith("fea") || clean.startsWith("feb")) return true;
  // Unique local fc00::/7 (fc00:: and fd00::)
  if (clean.startsWith("fc") || clean.startsWith("fd")) return true;
  // IPv4-mapped IPv6 ::ffff:x.x.x.x
  if (clean.startsWith("::ffff:") || clean.startsWith("0:0:0:0:0:ffff:")) {
    const v4part = clean.replace(/^(::ffff:|0:0:0:0:0:ffff:)/, "");
    if (v4part.includes(".")) {
      const v4num = parseIpv4ToNumber(v4part);
      return v4num !== null ? isPrivateIpv4Num(v4num) : true;
    }
    return true;
  }
  // 6to4 2002::/16
  if (clean.startsWith("2002:")) {
    const parts = clean.split(":");
    if (parts.length >= 3) {
      const h1 = parseInt(parts[1], 16);
      const h2 = parseInt(parts[2], 16);
      if (!isNaN(h1) && !isNaN(h2)) {
        const v4num = ((h1 << 16) | h2) >>> 0;
        return isPrivateIpv4Num(v4num);
      }
    }
    return true;
  }
  return false;
}

/**
 * Identifies private, loopback, metadata, or adversarial hostnames / IP representations.
 */
export function isUnsafeHostOrIp(hostname: string): boolean {
  const host = hostname.toLowerCase().trim().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".corp") ||
    host.endsWith(".onion") ||
    host === "metadata.google.internal" ||
    host === "instance-data"
  ) {
    return true;
  }
  const v4num = parseIpv4ToNumber(host);
  if (v4num !== null) {
    return isPrivateIpv4Num(v4num);
  }
  if (host.includes(":")) {
    return isPrivateIpv6Str(host);
  }
  return false;
}

/**
 * Normalizes CSS colors (hex, rgb, rgba, named) to validated lowercase 6-digit hex format (#rrggbb).
 * Returns null if transparent or unparseable.
 */
export function normalizeToHex6(colorStr: string): string | null {
  if (!colorStr) return null;
  const trimmed = colorStr.trim().toLowerCase();
  if (trimmed === "transparent" || trimmed === "rgba(0, 0, 0, 0)") return null;

  if (/^#[0-9a-f]{3}$/.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }
  if (/^#[0-9a-f]{6}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^#[0-9a-f]{8}$/.test(trimmed)) {
    return trimmed.slice(0, 7);
  }

  const m = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (m) {
    const alpha = m[4] !== undefined ? parseFloat(m[4]) : 1;
    if (alpha < 0.05) return null;
    const r = Math.min(255, Math.max(0, parseInt(m[1], 10))).toString(16).padStart(2, "0");
    const g = Math.min(255, Math.max(0, parseInt(m[2], 10))).toString(16).padStart(2, "0");
    const b = Math.min(255, Math.max(0, parseInt(m[3], 10))).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }

  if (trimmed === "black") return "#000000";
  if (trimmed === "white") return "#ffffff";

  return null;
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

    // 2. Fail closed when INSPECTION_AUTH_SECRET is missing or empty (Public inspection strictly disabled)
    const authSecret = env.INSPECTION_AUTH_SECRET?.trim();
    if (!authSecret) {
      return new Response(
        JSON.stringify({
          error: "Server security misconfiguration: INSPECTION_AUTH_SECRET is required. Public inspection is disabled.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Strict authentication check: Public inspection is explicitly disabled without valid server secret
    const authHeader = request.headers.get("Authorization");
    const customHeader = request.headers.get("x-worker-auth");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const providedToken = bearerToken || customHeader?.trim();

    if (!providedToken || providedToken !== authSecret) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized: Public inspection is disabled. Valid server-to-server inspection auth token is required.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Edge abuse protection via enforceable binding if provisioned
    const clientIp = request.headers.get("CF-Connecting-IP") || "anonymous-client";
    if (env.RATE_LIMITER && typeof env.RATE_LIMITER.limit === "function") {
      try {
        const rateResult = await env.RATE_LIMITER.limit({ key: clientIp });
        if (!rateResult.success) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Maximum allowed inspections reached." }),
            {
              status: 429,
              headers: { "Content-Type": "application/json", "Retry-After": "60" },
            }
          );
        }
      } catch {
        // Proceed under strict authentication barrier if edge binding is unavailable
      }
    }

    // 5. Bounded Request Body (max 8KB)
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 8192) {
      return new Response(JSON.stringify({ error: "Payload too large (maximum 8KB)" }), {
        status: 413,
        headers: { "Content-Type": "application/json" },
      });
    }

    let targetUrl: string;
    try {
      const rawText = await request.text();
      if (rawText.length > 8192) {
        return new Response(JSON.stringify({ error: "Payload too large (maximum 8KB)" }), {
          status: 413,
          headers: { "Content-Type": "application/json" },
        });
      }
      const body: any = JSON.parse(rawText);
      targetUrl = body.url;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON request body" }), {
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

    // 6. Network controls & SSRF verification (never rely solely on simple string match)
    if (isUnsafeHostOrIp(parsed.hostname)) {
      return new Response(JSON.stringify({ error: "Target host blocked by SSRF security policy" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 7. Mandatory DNS Pre-flight Verification via Cloudflare 1.1.1.1 DoH
    // Must NOT silently bypass security policy if resolution fails or times out.
    // Note: DNS pre-flight alone is NOT connection-level IP enforcement;
    // session guardrails and browser request interception enforce network boundaries.
    try {
      const dohRes = await fetch(
        `https://1.1.1.1/dns-query?name=${encodeURIComponent(parsed.hostname)}&type=A`,
        {
          headers: { Accept: "application/dns-json" },
          signal: AbortSignal.timeout(4000),
        }
      );
      if (!dohRes.ok) {
        return new Response(
          JSON.stringify({ error: `DNS preflight failed: upstream resolver returned HTTP ${dohRes.status}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      const dohData: any = await dohRes.json();
      if (dohData.Status !== 0) {
        return new Response(
          JSON.stringify({ error: `DNS resolution error for ${parsed.hostname} (rcode ${dohData.Status})` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      if (!dohData.Answer || !Array.isArray(dohData.Answer) || dohData.Answer.length === 0) {
        return new Response(
          JSON.stringify({ error: `DNS resolution failed: no records found for ${parsed.hostname}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      let hasValidPublicRecord = false;
      for (const ans of dohData.Answer) {
        if (ans.type === 1 && typeof ans.data === "string") {
          const v4 = parseIpv4ToNumber(ans.data);
          if (v4 === null || isPrivateIpv4Num(v4)) {
            return new Response(
              JSON.stringify({ error: `DNS resolution blocked: destination IP is in a private or reserved range` }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }
          hasValidPublicRecord = true;
        }
      }

      if (!hasValidPublicRecord) {
        return new Response(
          JSON.stringify({ error: `DNS resolution failed: no public IPv4 address records found for ${parsed.hostname}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    } catch (dohErr: any) {
      return new Response(
        JSON.stringify({ error: `DNS preflight check failed: ${dohErr?.message || "Resolver timeout"}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 8. Fail closed if Cloudflare Browser Run binding is unavailable
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

    // 9. Launch isolated Chromium in Cloudflare Browser Run with session guardrails
    let browser: any = null;
    try {
      const puppeteer = await getPuppeteer();
      if (!puppeteer) {
        throw new Error("Cloudflare Puppeteer module unavailable in this environment");
      }

      // Cloudflare Browser Run native session guardrails with explicit allowed hostnames
      const allowedDomains = [
        parsed.hostname.toLowerCase(),
        "fonts.googleapis.com",
        "fonts.gstatic.com",
        "cdnjs.cloudflare.com",
        "cdn.jsdelivr.net",
        "unpkg.com",
        "ajax.googleapis.com",
      ];
      if (env.ALLOWED_DOMAINS) {
        const extra = env.ALLOWED_DOMAINS.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
        allowedDomains.push(...extra);
      }

      browser = await puppeteer.launch(env.MYBROWSER, {
        guardrails: {
          allowedDomains,
        },
      });
      const page = await browser.newPage();

      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 ForgeKit/1.0"
      );

      // Session Guardrails: Explicit allowed hostnames & strict subresource controls
      const allowedHost = parsed.hostname.toLowerCase();
      await page.setRequestInterception(true);
      page.on("request", (req: any) => {
        try {
          const reqUrl = req.url();
          const p = new URL(reqUrl);

          if (p.protocol === "data:" || p.protocol === "blob:") {
            return req.continue();
          }
          if (p.protocol !== "http:" && p.protocol !== "https:") {
            return req.abort("blockedbyclient");
          }
          if (isUnsafeHostOrIp(p.hostname)) {
            return req.abort("blockedbyclient");
          }

          const reqHost = p.hostname.toLowerCase();
          const isSameOrSubdomain = reqHost === allowedHost || reqHost.endsWith(`.${allowedHost}`);
          const isTrustedCdn = [
            "fonts.googleapis.com",
            "fonts.gstatic.com",
            "cdnjs.cloudflare.com",
            "cdn.jsdelivr.net",
            "unpkg.com",
            "ajax.googleapis.com",
          ].includes(reqHost);

          if (!isSameOrSubdomain && !isTrustedCdn) {
            return req.abort("blockedbyclient");
          }

          req.continue();
        } catch {
          req.abort("blockedbyclient");
        }
      });

      // 10. Desktop Viewport Inspection (1440x900)
      await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
      await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 12000 });
      await new Promise((r) => setTimeout(r, 1200));

      // Bounded screenshot response size (JPEG quality 70)
      const desktopBuffer = await page.screenshot({ type: "jpeg", quality: 70, fullPage: false });
      const desktopBase64 = `data:image/jpeg;base64,${Buffer.from(desktopBuffer).toString("base64")}`;

      // 11. Deterministic DOM Metrics Extraction with Honest Measurements
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

        // Measure actual container max-width without guessing
        const containerCandidates = Array.from(
          document.querySelectorAll("main, [class*='container'], [class*='wrapper'], section > div")
        );
        let measuredContainerMaxWidth: string | undefined = undefined;
        for (const el of containerCandidates) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          const maxW = style.maxWidth;
          if (maxW && maxW !== "none" && maxW !== "100%" && !maxW.includes("calc")) {
            measuredContainerMaxWidth = maxW;
            break;
          }
          if (rect.width >= 600 && rect.width <= 1600) {
            measuredContainerMaxWidth = `${Math.round(rect.width)}px`;
            break;
          }
        }

        // Measure actual section spacing between consecutive rendered content sections
        const sections = Array.from(document.querySelectorAll("main > section, main > div, section"));
        let measuredSectionSpacing: string | undefined = undefined;
        if (sections.length >= 2) {
          for (let i = 0; i < sections.length - 1; i++) {
            const rectA = sections[i].getBoundingClientRect();
            const rectB = sections[i + 1].getBoundingClientRect();
            const gap = Math.round(rectB.top - rectA.bottom);
            if (gap >= 16 && gap <= 240) {
              measuredSectionSpacing = `${gap}px`;
              break;
            }
          }
        }

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
          measuredContainerMaxWidth,
          measuredSectionSpacing,
          heroComposition,
          isDark,
          navbarHeight: navHeight,
          navStyle: ["fixed", "sticky"].includes(navPosition) ? (navPosition as any) : "static",
          colorSamples: Array.from(colorSamples),
          fontSamples: Array.from(fontSamples),
        };
      });

      // 12. Mobile Viewport Inspection (390x844)
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
      await new Promise((r) => setTimeout(r, 800));
      const mobileBuffer = await page.screenshot({ type: "jpeg", quality: 70, fullPage: false });
      const mobileBase64 = `data:image/jpeg;base64,${Buffer.from(mobileBuffer).toString("base64")}`;

      // 13. Strict Hex Normalization (Contract: Zero CSS rgb(...) strings in palette)
      const validatedPalette: string[] = [];
      for (const rawCol of rawMetrics.colorSamples) {
        const hex = normalizeToHex6(rawCol);
        if (hex && !validatedPalette.includes(hex)) {
          validatedPalette.push(hex);
        }
      }

      const normalizedBody = {
        ...rawMetrics.body,
        color: normalizeToHex6(rawMetrics.body.color) || "#000000",
        backgroundColor: normalizeToHex6(rawMetrics.body.backgroundColor) || "#ffffff",
      };

      const normalizedPrimaryButton = rawMetrics.primaryButton
        ? {
            ...rawMetrics.primaryButton,
            color: normalizeToHex6(rawMetrics.primaryButton.color) || "#ffffff",
            backgroundColor: normalizeToHex6(rawMetrics.primaryButton.backgroundColor) || "#2563eb",
          }
        : undefined;

      const normalizedCard = rawMetrics.card
        ? {
            ...rawMetrics.card,
            backgroundColor: normalizeToHex6(rawMetrics.card.backgroundColor) || "#ffffff",
          }
        : undefined;

      const payload = {
        success: true,
        inspectionMethod: "cloudflare-browser-run",
        url: targetUrl,
        meta: {
          title: rawMetrics.title,
        },
        metrics: {
          body: normalizedBody,
          headings: rawMetrics.headings,
          paragraph: rawMetrics.paragraph,
          primaryButton: normalizedPrimaryButton,
          card: normalizedCard,
          input: rawMetrics.input,
          layout: {
            containerMaxWidth: rawMetrics.measuredContainerMaxWidth,
            isDark: rawMetrics.isDark,
            heroComposition: rawMetrics.heroComposition,
            sectionSpacing: rawMetrics.measuredSectionSpacing,
            navbarHeight: rawMetrics.navbarHeight,
            navStyle: rawMetrics.navStyle,
          },
        },
        extractedPalette: validatedPalette.slice(0, 10),
        extractedFonts: rawMetrics.fontSamples,
        screenshots: {
          desktopDataUri: desktopBase64,
          mobileDataUri: mobileBase64,
        },
      };

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
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
