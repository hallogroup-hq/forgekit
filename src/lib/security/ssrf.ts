import dns from "node:dns/promises";
import net from "node:net";

export interface SsrCheckResult {
  safe: boolean;
  reason?: string;
  resolvedIps?: string[];
}

/**
 * Checks if an IPv4 address belongs to private, loopback, or reserved ranges.
 */
export function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IP, treat as unsafe
  }

  const [a, b, c] = parts;

  // 0.0.0.0/8 - Current network
  if (a === 0) return true;

  // 10.0.0.0/8 - Private network
  if (a === 10) return true;

  // 100.64.0.0/10 - Shared address space (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 127.0.0.0/8 - Loopback
  if (a === 127) return true;

  // 169.254.0.0/16 - Link-local (Cloud metadata e.g. 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 - Private network (172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.0.0.0/24 - IETF protocol assignments
  if (a === 192 && b === 0 && c === 0) return true;

  // 192.0.2.0/24 - Documentation (TEST-NET-1)
  if (a === 192 && b === 0 && c === 2) return true;

  // 192.168.0.0/16 - Private network
  if (a === 192 && b === 168) return true;

  // 198.18.0.0/15 - Benchmark testing
  if (a === 198 && (b === 18 || b === 19)) return true;

  // 198.51.100.0/24 - Documentation (TEST-NET-2)
  if (a === 198 && b === 51 && c === 100) return true;

  // 203.0.113.0/24 - Documentation (TEST-NET-3)
  if (a === 203 && b === 0 && c === 113) return true;

  // 224.0.0.0/4 - Multicast
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 - Reserved for future use
  if (a >= 240) return true;

  return false;
}

/**
 * Checks if an IPv6 address belongs to private, loopback, or reserved ranges.
 */
export function isPrivateOrReservedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // ::1 loopback
  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;

  // :: unspecified
  if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;

  // IPv4-mapped IPv6 (::ffff:192.168.1.1 or ::ffff:c0a8:0101)
  if (normalized.startsWith("::ffff:") || normalized.startsWith("0:0:0:0:0:ffff:")) {
    const lastPart = normalized.split(":").pop();
    if (lastPart && lastPart.includes(".")) {
      return isPrivateOrReservedIpv4(lastPart);
    }
  }

  // fc00::/7 - Unique local address (ULA)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  // fe80::/10 - Link-local unicast
  if (
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  ) {
    return true;
  }

  // ff00::/8 - Multicast
  if (normalized.startsWith("ff")) return true;

  return false;
}

/**
 * Validates a URL to prevent Server-Side Request Forgery (SSRF).
 * Checks protocol whitelist, disallows loopback hostnames, and resolves DNS to verify IPs.
 */
export async function validateSafeUrlForFetch(rawUrl: string): Promise<SsrCheckResult> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { safe: false, reason: "Malformed URL" };
  }

  // 1. Protocol whitelist
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { safe: false, reason: `Unsupported protocol: ${parsed.protocol}. Only http and https are permitted.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Reject obvious loopback and internal hostname patterns
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".onion")
  ) {
    return { safe: false, reason: `Internal or loopback hostname is forbidden: ${hostname}` };
  }

  // 3. Direct IP address in hostname
  const ipType = net.isIP(hostname);
  if (ipType === 4) {
    if (isPrivateOrReservedIpv4(hostname)) {
      return { safe: false, reason: `Target IP ${hostname} is in a private or reserved network range.`, resolvedIps: [hostname] };
    }
    return { safe: true, resolvedIps: [hostname] };
  }
  if (ipType === 6) {
    if (isPrivateOrReservedIpv6(hostname)) {
      return { safe: false, reason: `Target IPv6 ${hostname} is in a private or reserved network range.`, resolvedIps: [hostname] };
    }
    return { safe: true, resolvedIps: [hostname] };
  }

  // 4. DNS resolution check (resolve all records to prevent round-robin SSRF bypass)
  try {
    const records = await dns.lookup(hostname, { all: true });
    if (!records || records.length === 0) {
      return { safe: false, reason: `Could not resolve domain: ${hostname}` };
    }

    const resolvedIps = records.map((r) => r.address);

    for (const record of records) {
      if (record.family === 4 && isPrivateOrReservedIpv4(record.address)) {
        return {
          safe: false,
          reason: `Domain ${hostname} resolves to private IPv4 address ${record.address}`,
          resolvedIps,
        };
      }
      if (record.family === 6 && isPrivateOrReservedIpv6(record.address)) {
        return {
          safe: false,
          reason: `Domain ${hostname} resolves to private IPv6 address ${record.address}`,
          resolvedIps,
        };
      }
    }

    return { safe: true, resolvedIps };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "DNS resolution failure";
    return { safe: false, reason: `DNS lookup failed for ${hostname}: ${msg}` };
  }
}

export interface SafeFetchOptions {
  headers?: Record<string, string>;
  maxRedirects?: number;
  timeoutMs?: number;
}

export interface SafeFetchResponse {
  response: Response;
  finalUrl: string;
  redirectCount: number;
}

/**
 * Executes a fetch request with strict SSRF validation at every redirect hop.
 * Uses redirect: "manual" to inspect each Location header, preventing
 * open redirect-based SSRF into internal networks or cloud metadata.
 */
export async function safeFetchWithRedirects(
  initialUrl: string,
  options?: SafeFetchOptions
): Promise<SafeFetchResponse> {
  const maxRedirects = options?.maxRedirects ?? 3;
  const timeoutMs = options?.timeoutMs ?? 5000;
  let currentUrl = initialUrl;
  let redirectCount = 0;

  while (redirectCount <= maxRedirects) {
    // 1. Validate the current URL before connecting
    const check = await validateSafeUrlForFetch(currentUrl);
    if (!check.safe) {
      throw new Error(`SSRF blocked: ${check.reason || "Forbidden URL"}`);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch(currentUrl, {
        headers: options?.headers ?? {
          "User-Agent": "ForgeKit-AuditBot/1.0",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: controller.signal,
        redirect: "manual",
      });
    } finally {
      clearTimeout(timer);
    }

    // Check for redirect status codes (301, 302, 303, 307, 308)
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get("location");
      if (!location) {
        throw new Error(`Redirect response from ${currentUrl} missing Location header.`);
      }

      // Resolve relative redirect against current URL
      const nextUrl = new URL(location, currentUrl).toString();

      redirectCount++;
      if (redirectCount > maxRedirects) {
        throw new Error(`Exceeded maximum redirect limit (${maxRedirects}).`);
      }

      currentUrl = nextUrl;
      continue;
    }

    return {
      response: res,
      finalUrl: currentUrl,
      redirectCount,
    };
  }

  throw new Error(`Exceeded maximum redirect limit (${maxRedirects}).`);
}

