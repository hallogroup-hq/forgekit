/**
 * RFC 9562 Compliant UUIDv7, UUIDv4, and URL-Safe NanoID Engine
 * 100% CSPRNG (WebCrypto crypto.getRandomValues).
 * Never uses Math.random(). Fails closed if WebCrypto is unavailable.
 */

export type IdType = "uuid4" | "uuid7" | "nanoid";

export interface GenerateIdOptions {
  type: IdType;
  count: number;
  uppercase?: boolean;
  hyphens?: boolean;
  nanoidLength?: number;
  timestamp?: number; // Optional timestamp override for deterministic testing
}

export function getCrypto(): Crypto {
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.getRandomValues === "function"
  ) {
    return globalThis.crypto;
  }
  throw new Error("Cryptographically Secure Pseudorandom Number Generator is unavailable.");
}

let lastTimestampV7 = -1;
let sequenceCounterV7 = 0;

export function resetUuidV7State(): void {
  lastTimestampV7 = -1;
  sequenceCounterV7 = 0;
}

/**
 * Generates an RFC 9562 compliant UUID Version 7.
 * Adheres to Section 6.2 (Monotonicity and Counters Method 1) to guarantee
 * that successive IDs generated within the same millisecond remain strictly ordered.
 * Layout:
 * - unix_ts_ms: 48 bits (bytes 0-5)
 * - ver: 4 bits (0111) (byte 6 top 4 bits)
 * - rand_a (monotonic sequence counter): 12 bits (byte 6 bottom 4 bits + byte 7)
 * - var: 2 bits (10) (byte 8 top 2 bits)
 * - rand_b: 62 bits (bytes 8-15)
 */
export function generateUuidV7(customTimestamp?: number, cryptoInstance: Crypto = getCrypto()): string {
  const ts = customTimestamp !== undefined ? customTimestamp : Date.now();
  const bytes = new Uint8Array(16);

  // 1. Fill random bytes
  cryptoInstance.getRandomValues(bytes);

  // 2. Monotonic sequence counter for rand_a (12 bits)
  if (ts === lastTimestampV7) {
    sequenceCounterV7 = (sequenceCounterV7 + 1) & 0x0fff;
  } else {
    lastTimestampV7 = ts;
    // Reseed counter with cryptographically random 12 bits
    sequenceCounterV7 = ((bytes[6] & 0x0f) << 8) | bytes[7];
  }

  // 3. Set 48-bit timestamp in big-endian (bytes 0-5)
  bytes[0] = Math.floor(ts / 2 ** 40) & 0xff;
  bytes[1] = Math.floor(ts / 2 ** 32) & 0xff;
  bytes[2] = Math.floor(ts / 2 ** 24) & 0xff;
  bytes[3] = Math.floor(ts / 2 ** 16) & 0xff;
  bytes[4] = Math.floor(ts / 2 ** 8) & 0xff;
  bytes[5] = ts & 0xff;

  // 4. Set version 7 (0b0111) in top 4 bits of byte 6, plus top 4 bits of sequence counter
  bytes[6] = 0x70 | ((sequenceCounterV7 >> 8) & 0x0f);
  // Bottom 8 bits of sequence counter in byte 7
  bytes[7] = sequenceCounterV7 & 0xff;

  // 5. Set variant 10 (0b10) in top 2 bits of byte 8
  bytes[8] = 0x80 | (bytes[8] & 0x3f);

  // Convert to canonical 8-4-4-4-12 hex string
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Generates an RFC 9562 / RFC 4122 compliant UUID Version 4 using CSPRNG.
 */
export function generateUuidV4(cryptoInstance: Crypto = getCrypto()): string {
  if (cryptoInstance.randomUUID) {
    return cryptoInstance.randomUUID();
  }

  const bytes = new Uint8Array(16);
  cryptoInstance.getRandomValues(bytes);

  // Version 4: 0100xxxx
  bytes[6] = 0x40 | (bytes[6] & 0x0f);
  // Variant 10: 10xxxxxx
  bytes[8] = 0x80 | (bytes[8] & 0x3f);

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Generates a URL-safe NanoID using CSPRNG with bitmask rejection to prevent modulo bias.
 */
const NANOID_ALPHABET = "_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generateNanoId(size = 21, cryptoInstance: Crypto = getCrypto()): string {
  if (size < 1 || size > 128) throw new Error("NanoID size must be between 1 and 128");

  // Alphabet length is 64 (power of 2), so (byte & 63) gives perfectly uniform distribution without modulo bias!
  const mask = 63;
  const bytes = new Uint8Array(size);
  cryptoInstance.getRandomValues(bytes);

  let id = "";
  for (let i = 0; i < size; i++) {
    id += NANOID_ALPHABET[bytes[i] & mask];
  }
  return id;
}

/**
 * Generates a batch of identifiers with casing and hyphen formatting.
 */
export function generateBatchIds(options: GenerateIdOptions, cryptoInstance: Crypto = getCrypto()): string[] {
  const { type, count, uppercase = false, hyphens = true, nanoidLength = 21, timestamp } = options;

  if (count < 1 || count > 1000) {
    throw new Error("Batch count must be between 1 and 1000");
  }

  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    let id = "";
    if (type === "uuid4") {
      id = generateUuidV4(cryptoInstance);
    } else if (type === "uuid7") {
      id = generateUuidV7(timestamp, cryptoInstance);
    } else {
      id = generateNanoId(nanoidLength, cryptoInstance);
    }

    if (!hyphens && (type === "uuid4" || type === "uuid7")) {
      id = id.replace(/-/g, "");
    }

    if (uppercase) {
      id = id.toUpperCase();
    } else if (type !== "nanoid") {
      id = id.toLowerCase();
    }

    results.push(id);
  }

  return results;
}
