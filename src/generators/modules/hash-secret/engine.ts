/**
 * Cryptographic Hash Digest & Secret Token Engine
 * Uses Web Crypto API (crypto.subtle and crypto.getRandomValues).
 * Supports standard algorithms: SHA-256, SHA-512, SHA-384, SHA-1 (Legacy).
 */

export type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

export function getSubtleCrypto(): SubtleCrypto {
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.subtle !== "undefined"
  ) {
    return globalThis.crypto.subtle;
  }
  throw new Error("Web Crypto Subtle API is unavailable in this environment.");
}

export function getCrypto(): Crypto {
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.getRandomValues === "function"
  ) {
    return globalThis.crypto;
  }
  throw new Error("Web Crypto API is unavailable in this environment.");
}

/**
 * Computes hexadecimal digest of a string using Web Crypto API.
 */
export async function computeHashDigest(
  algorithm: HashAlgorithm,
  input: string,
  subtle: SubtleCrypto = getSubtleCrypto()
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const buffer = await subtle.digest(algorithm, data);
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Computes all supported hashes for an input string.
 */
export async function computeAllHashes(
  input: string,
  subtle: SubtleCrypto = getSubtleCrypto()
): Promise<{
  sha256: string;
  sha512: string;
  sha384: string;
  sha1: string;
  base64: string;
}> {
  if (!input) {
    return { sha256: "", sha512: "", sha384: "", sha1: "", base64: "" };
  }

  const [sha256, sha512, sha384, sha1] = await Promise.all([
    computeHashDigest("SHA-256", input, subtle),
    computeHashDigest("SHA-512", input, subtle),
    computeHashDigest("SHA-384", input, subtle),
    computeHashDigest("SHA-1", input, subtle),
  ]);

  let base64 = "";
  try {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(bin);
  } catch {
    base64 = "";
  }

  return { sha256, sha512, sha384, sha1, base64 };
}

export interface GeneratedSecret {
  hex: string;
  base64: string;
  base64Url: string;
  apiKey: string;
  byteLength: number;
}

/**
 * Generates cryptographically secure API secret tokens.
 */
export function generateSecureSecret(byteLength = 32, cryptoInstance: Crypto = getCrypto()): GeneratedSecret {
  if (byteLength < 16 || byteLength > 128) {
    throw new Error("Secret byte length must be between 16 and 128");
  }

  const bytes = new Uint8Array(byteLength);
  cryptoInstance.getRandomValues(bytes);

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const bin = String.fromCharCode(...bytes);
  const base64Url = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const base64 = btoa(bin);
  const apiKey = `fk_live_${hex.slice(0, 32)}`;

  return {
    hex,
    base64,
    base64Url,
    apiKey,
    byteLength,
  };
}
