import http from "node:http";
import https from "node:https";
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
export function isPrivateOrReservedIpv4(ip: string, allowLoopback = false): boolean {
  const parts = ip.split(".").map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IP, treat as unsafe
  }

  const [a, b, c, d] = parts;

  // 0.0.0.0/8 - Current network (0.0.0.0 connects to localhost on unix)
  if (a === 0) return true;

  // 10.0.0.0/8 - Private network
  if (a === 10) return true;

  // 100.64.0.0/10 - Shared address space (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 127.0.0.0/8 - Loopback
  if (a === 127) return !allowLoopback;

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

  // 255.255.255.255 - Broadcast
  if (a === 255 && b === 255 && c === 255 && d === 255) return true;

  return false;
}

/**
 * Checks if an IPv6 address belongs to private, loopback, or reserved ranges.
 */
export function isPrivateOrReservedIpv6(ip: string, allowLoopback = false): boolean {
  const normalized = ip.toLowerCase().trim().replace(/^\[|\]$/g, "");

  // ::1 loopback
  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return !allowLoopback;

  // :: unspecified
  if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;

  // IPv4-mapped IPv6 (::ffff:192.168.1.1 or ::ffff:7f00:1)
  if (normalized.startsWith("::ffff:") || normalized.startsWith("0:0:0:0:0:ffff:")) {
    const lastPart = normalized.replace(/^(::ffff:|0:0:0:0:0:ffff:)/, "");
    if (lastPart.includes(".")) {
      return isPrivateOrReservedIpv4(lastPart, allowLoopback);
    }
    // Hex IPv4-mapped (e.g. 7f00:1)
    const hexParts = lastPart.split(":");
    if (hexParts.length === 2) {
      const high = parseInt(hexParts[0], 16);
      const low = parseInt(hexParts[1], 16);
      if (!isNaN(high) && !isNaN(low)) {
        const b1 = (high >> 8) & 0xff;
        const b2 = high & 0xff;
        const b3 = (low >> 8) & 0xff;
        const b4 = low & 0xff;
        return isPrivateOrReservedIpv4(`${b1}.${b2}.${b3}.${b4}`, allowLoopback);
      }
    }
    return true; // Malformed IPv4-mapped format, block
  }

  // 6to4 transition (2002::/16) - embeds IPv4 in the next 32 bits
  if (normalized.startsWith("2002:")) {
    const parts = normalized.split(":");
    if (parts.length >= 3) {
      const high = parseInt(parts[1], 16);
      const low = parseInt(parts[2], 16);
      if (!isNaN(high) && !isNaN(low)) {
        const b1 = (high >> 8) & 0xff;
        const b2 = high & 0xff;
        const b3 = (low >> 8) & 0xff;
        const b4 = low & 0xff;
        return isPrivateOrReservedIpv4(`${b1}.${b2}.${b3}.${b4}`, allowLoopback);
      }
    }
    return true;
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

export interface SafeUrlValidationOptions {
  allowLoopbackForTesting?: boolean;
  customDnsLookup?: typeof dns.lookup;
}

/**
 * Validates a URL to prevent Server-Side Request Forgery (SSRF).
 * Checks protocol whitelist, disallows loopback hostnames, and resolves DNS to verify IPs.
 */
export async function validateSafeUrlForFetch(
  rawUrl: string,
  options?: SafeUrlValidationOptions
): Promise<SsrCheckResult> {
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
  const allowLoopback = !!options?.allowLoopbackForTesting;

  // 2. Reject obvious loopback, internal, or cloud metadata hostname patterns
  if (
    (!allowLoopback && (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local"))) ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".onion") ||
    hostname === "metadata.google.internal" ||
    hostname === "169.254.169.254"
  ) {
    return { safe: false, reason: `Internal, metadata, or loopback hostname is forbidden: ${hostname}` };
  }

  // 3. Direct IP address in hostname
  const ipType = net.isIP(hostname);
  if (ipType === 4) {
    if (isPrivateOrReservedIpv4(hostname, allowLoopback)) {
      return { safe: false, reason: `Target IP ${hostname} is in a private or reserved network range.`, resolvedIps: [hostname] };
    }
    return { safe: true, resolvedIps: [hostname] };
  }
  if (ipType === 6) {
    if (isPrivateOrReservedIpv6(hostname, allowLoopback)) {
      return { safe: false, reason: `Target IPv6 ${hostname} is in a private or reserved network range.`, resolvedIps: [hostname] };
    }
    return { safe: true, resolvedIps: [hostname] };
  }

  // 4. DNS resolution check (resolve all records to prevent round-robin SSRF bypass)
  const dnsLookupFn = options?.customDnsLookup || dns.lookup;
  try {
    const records = await dnsLookupFn(hostname, { all: true });
    if (!records || records.length === 0) {
      return { safe: false, reason: `Could not resolve domain: ${hostname}` };
    }

    const resolvedIps = records.map((r) => r.address);

    for (const record of records) {
      if (record.family === 4 && isPrivateOrReservedIpv4(record.address, allowLoopback)) {
        return {
          safe: false,
          reason: `Domain ${hostname} resolves to private IPv4 address ${record.address}`,
          resolvedIps,
        };
      }
      if (record.family === 6 && isPrivateOrReservedIpv6(record.address, allowLoopback)) {
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

/**
 * Custom DNS lookup handler that verifies resolved IP addresses at socket creation time.
 * This guarantees DNS-to-connection safety against TOCTOU / DNS rebinding attacks.
 */
export function createSafeLookup(customDns?: typeof dns.lookup, allowLoopback = false) {
  const lookupFn = customDns || dns.lookup;
  return (
    hostname: string,
    options: any,
    callback: (err: Error | null, address?: any, family?: any) => void
  ) => {
    // If hostname is already a verified public IP
    const directIp = net.isIP(hostname);
    if (directIp === 4) {
      if (isPrivateOrReservedIpv4(hostname, allowLoopback)) {
        return callback(new Error(`SSRF blocked: Direct private IPv4 address ${hostname}`));
      }
      return callback(null, hostname, 4);
    }
    if (directIp === 6) {
      if (isPrivateOrReservedIpv6(hostname, allowLoopback)) {
        return callback(new Error(`SSRF blocked: Direct private IPv6 address ${hostname}`));
      }
      return callback(null, hostname, 6);
    }

    // Resolve DNS and check all returned IPs
    lookupFn(hostname, { all: true })
      .then((records) => {
        if (!records || records.length === 0) {
          return callback(new Error(`SSRF blocked: Could not resolve domain ${hostname}`));
        }

        for (const r of records) {
          if (r.family === 4 && isPrivateOrReservedIpv4(r.address, allowLoopback)) {
            return callback(new Error(`SSRF blocked: DNS rebinding/private IPv4 detected: ${r.address}`));
          }
          if (r.family === 6 && isPrivateOrReservedIpv6(r.address, allowLoopback)) {
            return callback(new Error(`SSRF blocked: DNS rebinding/private IPv6 detected: ${r.address}`));
          }
        }

        // Return first safe record to the connecting socket
        if (options && options.all) {
          callback(null, records);
        } else {
          callback(null, records[0].address, records[0].family);
        }
      })
      .catch((err) => callback(err));
  };
}

export interface SafeFetchOptions {
  headers?: Record<string, string>;
  maxRedirects?: number;
  timeoutMs?: number;
  maxResponseBytes?: number;
  allowedContentTypes?: string[];
  customDnsLookup?: typeof dns.lookup;
  allowLoopbackForTesting?: boolean;
}

export interface SafeFetchResult {
  responseText: string;
  finalUrl: string;
  statusCode: number;
  contentType: string;
  redirectCount: number;
}

/**
 * Executes an HTTP/HTTPS request with strict SSRF validation at every redirect hop,
 * socket-level DNS verification (DNS-to-connection security),
 * and a single cumulative timeout budget covering redirect resolution, headers, and body streaming.
 */
export async function safeFetchWithRedirects(
  initialUrl: string,
  options?: SafeFetchOptions
): Promise<SafeFetchResult> {
  const maxRedirects = options?.maxRedirects ?? 3;
  const timeoutMs = options?.timeoutMs ?? 5000;
  const maxResponseBytes = options?.maxResponseBytes ?? 2 * 1024 * 1024; // 2MB
  const allowedContentTypes = options?.allowedContentTypes ?? [
    "text/html",
    "application/xhtml+xml",
    "text/plain",
    "application/xml",
  ];

  let currentUrl = initialUrl;
  let redirectCount = 0;

  const startTime = Date.now();
  let timedOut = false;
  let activeReq: http.ClientRequest | null = null;

  return new Promise<SafeFetchResult>((resolve, reject) => {
    // 1. Single global cumulative timer covering the ENTIRE transaction
    const globalTimer = setTimeout(() => {
      timedOut = true;
      if (activeReq) {
        activeReq.destroy(new Error(`Request cumulative execution timed out after ${timeoutMs}ms.`));
      }
      reject(new Error(`Request timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(globalTimer);
    }

    async function executeHop(targetUrl: string) {
      if (timedOut) return;

      // 2. Pre-flight URL validation
      const ssrfCheck = await validateSafeUrlForFetch(targetUrl, {
        allowLoopbackForTesting: options?.allowLoopbackForTesting,
        customDnsLookup: options?.customDnsLookup,
      });
      if (!ssrfCheck.safe) {
        cleanup();
        return reject(new Error(`SSRF blocked: ${ssrfCheck.reason || "Forbidden URL"}`));
      }

      let parsed: URL;
      try {
        parsed = new URL(targetUrl);
      } catch {
        cleanup();
        return reject(new Error("Malformed URL"));
      }

      const isHttps = parsed.protocol === "https:";
      const transport = isHttps ? https : http;
      const port = parsed.port ? parseInt(parsed.port, 10) : isHttps ? 443 : 80;

      const safeLookup = createSafeLookup(options?.customDnsLookup, options?.allowLoopbackForTesting);

      const requestOptions: https.RequestOptions = {
        hostname: parsed.hostname,
        port,
        path: `${parsed.pathname}${parsed.search}`,
        method: "GET",
        headers: {
          "User-Agent": options?.headers?.["User-Agent"] || "ForgeKit-AuditBot/1.0",
          Accept: options?.headers?.Accept || "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          Host: parsed.host,
        },
        lookup: safeLookup as any,
      };

      activeReq = transport.request(requestOptions, (res) => {
        const statusCode = res.statusCode || 0;

        // Check for redirects (301, 302, 303, 307, 308)
        if ([301, 302, 303, 307, 308].includes(statusCode)) {
          res.resume(); // Discard redirect body
          const location = res.headers["location"];
          if (!location) {
            cleanup();
            return reject(new Error(`Redirect response from ${targetUrl} missing Location header.`));
          }

          redirectCount++;
          if (redirectCount > maxRedirects) {
            cleanup();
            return reject(new Error(`Exceeded maximum redirect limit (${maxRedirects}).`));
          }

          const nextUrl = new URL(location, targetUrl).toString();
          currentUrl = nextUrl;
          return executeHop(nextUrl);
        }

        // Check Content-Type header on final destination
        const contentType = (res.headers["content-type"] || "").toLowerCase();
        if (statusCode >= 200 && statusCode < 300 && contentType) {
          const isAllowed = allowedContentTypes.some((t) => contentType.includes(t));
          if (!isAllowed) {
            res.destroy();
            cleanup();
            return reject(new Error(`Forbidden response content-type: ${contentType}. Expected HTML or text.`));
          }
        }

        // Check Content-Length header
        const contentLength = res.headers["content-length"];
        if (contentLength && parseInt(contentLength, 10) > maxResponseBytes) {
          res.destroy();
          cleanup();
          return reject(new Error(`Response length (${contentLength} bytes) exceeds limit of ${maxResponseBytes} bytes.`));
        }

        // Stream and accumulate body under the active cumulative timeout
        let totalBytes = 0;
        const chunks: Buffer[] = [];

        res.on("data", (chunk: Buffer) => {
          totalBytes += chunk.length;
          if (totalBytes > maxResponseBytes) {
            res.destroy();
            cleanup();
            return reject(new Error(`Response payload exceeded maximum allowed size of ${maxResponseBytes} bytes.`));
          }
          chunks.push(chunk);
        });

        res.on("end", () => {
          cleanup();
          const responseText = Buffer.concat(chunks).toString("utf-8");
          resolve({
            responseText,
            finalUrl: currentUrl,
            statusCode,
            contentType,
            redirectCount,
          });
        });

        res.on("error", (streamErr) => {
          cleanup();
          reject(streamErr);
        });
      });

      activeReq.on("error", (err) => {
        if (timedOut) return;
        cleanup();
        reject(err);
      });

      activeReq.end();
    }

    executeHop(initialUrl).catch((err) => {
      cleanup();
      reject(err);
    });
  });
}

/**
 * Backward-compatible helper for legacy string reading
 */
export async function readSafeResponseBody(
  response: Response | { responseText: string },
  maxBytes: number = 2 * 1024 * 1024
): Promise<string> {
  if ("responseText" in response && typeof response.responseText === "string") {
    if (Buffer.byteLength(response.responseText) > maxBytes) {
      throw new Error(`Response payload exceeded maximum allowed size of ${maxBytes} bytes.`);
    }
    return response.responseText;
  }

  const res = response as Response;
  const text = await res.text();
  if (Buffer.byteLength(text) > maxBytes) {
    throw new Error(`Response payload exceeded maximum allowed size of ${maxBytes} bytes.`);
  }
  return text;
}
