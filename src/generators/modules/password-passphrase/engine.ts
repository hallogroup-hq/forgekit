/**
 * Cryptographically Secure Password & Passphrase Engine
 * Strictly adheres to WebCrypto CSPRNG (crypto.getRandomValues).
 * Never uses Math.random(). Fails closed if WebCrypto is unavailable.
 */

// 250+ vetted English words for strong Diceware-style passphrases
export const EFF_WORDLIST = [
  "abacus", "abbey", "ability", "academy", "accent", "acoustic", "action", "active",
  "actor", "admire", "advance", "aerial", "agenda", "airline", "airport", "alcove",
  "almond", "alpine", "anchor", "anthem", "apron", "aquarium", "arcade", "archer",
  "arctic", "armchair", "artist", "asteroid", "atlas", "atom", "avalanche", "avenue",
  "badger", "balcony", "bamboo", "banner", "baron", "barrel", "beacon", "biscuit",
  "blanket", "boulder", "breeze", "bridge", "bronze", "cabin", "cactus", "cadet",
  "canyon", "captain", "caravan", "castle", "cathedral", "cedar", "celestial", "cereal",
  "chalet", "channel", "charcoal", "chariot", "cheetah", "chimney", "chisel", "chrome",
  "cider", "circuit", "citadel", "clover", "cobalt", "colony", "comet", "compass",
  "corridor", "cosmic", "cradle", "crater", "crescent", "crystal", "cylinder", "dolphin",
  "dragon", "echo", "eclipse", "emerald", "empire", "falcon", "feather", "fjord",
  "flame", "flamingo", "flint", "forest", "fossil", "fountain", "galaxy", "galley",
  "garnet", "glacier", "glider", "granite", "gravel", "gravity", "harbor", "haven",
  "hawk", "hazel", "helmet", "horizon", "humming", "iguana", "island", "ivory",
  "javelin", "juniper", "jupiter", "kangaroo", "kelp", "lagoon", "lantern", "legend",
  "leopard", "licorice", "lighthouse", "lily", "lizard", "lotus", "lunar", "magnet",
  "mango", "mantis", "marble", "marsh", "meadow", "meteor", "mirage", "monarch",
  "monument", "mosaic", "mountain", "nebula", "nectar", "neutron", "nexus", "nomad",
  "north", "nova", "oasis", "obsidian", "ocean", "octave", "opal", "orbit",
  "orchid", "origami", "orion", "otter", "outpost", "oxygen", "paddle", "palace",
  "panther", "papyrus", "parade", "pebble", "pelican", "penguin", "phantom", "phoenix",
  "pinnacle", "pioneer", "pipeline", "planet", "plasma", "plateau", "polar", "polaris",
  "portico", "prairie", "prism", "propeller", "pyramid", "quantum", "quarry", "quartz",
  "quiver", "radiant", "raptor", "raven", "reef", "rhombus", "ripple", "robot",
  "rover", "ruby", "saddle", "safari", "sailor", "satellite", "savanna", "scarlet",
  "scout", "sculptor", "serenade", "shadow", "shrine", "silver", "skylight", "solitude",
  "sonata", "sparrow", "spectrum", "spiral", "stadium", "summit", "sunflower", "supernova",
  "tapestry", "telescope", "temple", "timber", "titan", "topaz", "tornado", "torrent",
  "totem", "trapeze", "tribute", "trident", "tulip", "tunnel", "turbine", "tundra",
  "typhoon", "uranium", "valley", "velvet", "venture", "vessel", "vibrant", "village",
  "vineyard", "vintage", "violet", "violin", "viper", "vortex", "voyage", "walrus",
  "wavelet", "whisper", "wildcat", "windmill", "winter", "wizard", "wolverine", "zenith",
  "zephyr", "zodiac"
];

export interface PasswordOptions {
  length: number;
  useUpper: boolean;
  useLower: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
  excludeAmbiguous?: boolean;
}

export interface PassphraseOptions {
  wordCount: number;
  separator: string;
  capitalize: boolean;
  includeNumber: boolean;
  wordlist?: string[];
}

/**
 * Gets the active WebCrypto implementation. Throws if unavailable (fail-closed).
 */
export function getCryptoInstance(): Crypto {
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.getRandomValues === "function"
  ) {
    return globalThis.crypto;
  }
  throw new Error("Cryptographically Secure Pseudorandom Number Generator (Web Crypto API) is unavailable in this environment.");
}

/**
 * Generates a CSPRNG integer in range [0, max - 1] without modulo bias using rejection sampling.
 */
export function getRandomInt(max: number, cryptoInstance: Crypto = getCryptoInstance()): number {
  if (max <= 0) throw new Error("Max must be positive");
  if (max === 1) return 0;

  const maxUint32 = 0xffffffff;
  const limit = maxUint32 - (maxUint32 % max);
  const buffer = new Uint32Array(1);

  while (true) {
    cryptoInstance.getRandomValues(buffer);
    const value = buffer[0];
    if (value < limit) {
      return value % max;
    }
  }
}

/**
 * Generates a secure password from selected character sets using CSPRNG.
 */
export function generatePassword(options: PasswordOptions, cryptoInstance: Crypto = getCryptoInstance()): string {
  const { length, useUpper, useLower, useNumbers, useSymbols, excludeAmbiguous } = options;

  if (length < 4 || length > 128) {
    throw new Error("Password length must be between 4 and 128");
  }

  const upperChars = excludeAmbiguous ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowerChars = excludeAmbiguous ? "abcdefghijkmnpqrstuvwxyz" : "abcdefghijklmnopqrstuvwxyz";
  const numChars = excludeAmbiguous ? "23456789" : "0123456789";
  const symChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let charPool = "";
  const guaranteed: string[] = [];

  if (useUpper) {
    charPool += upperChars;
    guaranteed.push(upperChars[getRandomInt(upperChars.length, cryptoInstance)]);
  }
  if (useLower) {
    charPool += lowerChars;
    guaranteed.push(lowerChars[getRandomInt(lowerChars.length, cryptoInstance)]);
  }
  if (useNumbers) {
    charPool += numChars;
    guaranteed.push(numChars[getRandomInt(numChars.length, cryptoInstance)]);
  }
  if (useSymbols) {
    charPool += symChars;
    guaranteed.push(symChars[getRandomInt(symChars.length, cryptoInstance)]);
  }

  if (!charPool) {
    charPool = lowerChars;
    guaranteed.push(lowerChars[getRandomInt(lowerChars.length, cryptoInstance)]);
  }

  const result: string[] = [...guaranteed];
  while (result.length < length) {
    const idx = getRandomInt(charPool.length, cryptoInstance);
    result.push(charPool[idx]);
  }

  // Fisher-Yates shuffle using CSPRNG
  for (let i = result.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1, cryptoInstance);
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }

  return result.join("");
}

/**
 * Generates a Diceware-style passphrase from standard wordlist using CSPRNG.
 */
export function generatePassphrase(options: PassphraseOptions, cryptoInstance: Crypto = getCryptoInstance()): string {
  const { wordCount, separator, capitalize, includeNumber, wordlist = EFF_WORDLIST } = options;

  if (wordCount < 2 || wordCount > 20) {
    throw new Error("Passphrase word count must be between 2 and 20");
  }

  if (wordlist.length === 0) {
    throw new Error("Wordlist cannot be empty");
  }

  const chosenWords: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const idx = getRandomInt(wordlist.length, cryptoInstance);
    let word = wordlist[idx];
    if (capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }
    chosenWords.push(word);
  }

  if (includeNumber) {
    // 2-digit number (10 to 99) generated cryptographically
    const num = 10 + getRandomInt(90, cryptoInstance);
    chosenWords.push(String(num));
  }

  return chosenWords.join(separator);
}

/**
 * Calculates estimated Shannon entropy in bits for password or passphrase.
 */
export function calculateEntropy(text: string, isPassphrase: boolean, wordCount = 4, poolSize = 0): number {
  if (!text) return 0;
  if (isPassphrase) {
    // Each word from 250+ wordlist contributes log2(250) ~ 7.96 bits
    const bitsPerWord = Math.log2(EFF_WORDLIST.length);
    const numberBonus = text.match(/\d+/) ? 6.49 : 0; // log2(90)
    return Math.round(wordCount * bitsPerWord + numberBonus);
  }

  const effectivePool = poolSize > 0 ? poolSize : 26;
  return Math.round(text.length * Math.log2(Math.max(effectivePool, 2)));
}
