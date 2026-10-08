/**
 * Text Cleaner & Formatter Engine
 * Pure deterministic text processing: whitespace normalization, line operations, case transformations.
 */

export type CaseTransform =
  | "none"
  | "sentence"
  | "title"
  | "upper"
  | "lower"
  | "camel"
  | "snake"
  | "kebab";

export interface TextCleanOptions {
  normalizeWhitespace?: boolean;
  removeEmptyLines?: boolean;
  removeDuplicateLines?: boolean;
  trimLines?: boolean;
  stripHtml?: boolean;
  sortLines?: "none" | "asc" | "desc";
  caseTransform?: CaseTransform;
}

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  nonEmptyLines: number;
  bytes: number;
  readingTimeMinutes: number;
}

export function toSentenceCase(text: string): string {
  return text.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, prefix, char) => {
    return prefix + char.toUpperCase();
  });
}

export function toTitleCase(text: string): string {
  const minorWords = new Set(["a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "by", "in", "of"]);
  return text.replace(/\b\w+/g, (word, index) => {
    const lower = word.toLowerCase();
    if (index > 0 && minorWords.has(lower)) {
      return lower;
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

export function toCamelCase(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^([A-Z])/, (_, chr) => chr.toLowerCase())
    .replace(/[^a-zA-Z0-9]/g, "");
}

export function toSnakeCase(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

export function toKebabCase(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function cleanText(input: string, options: TextCleanOptions): string {
  if (!input) return "";

  let result = input;

  // 1. Strip HTML tags if requested
  if (options.stripHtml) {
    result = result.replace(/<[^>]*>/g, "");
  }

  // 2. Normalize whitespace inside text
  if (options.normalizeWhitespace) {
    result = result.replace(/[ \t]+/g, " ");
  }

  // Split into lines for line operations
  let lines = result.split(/\r?\n/);

  // 3. Trim lines
  if (options.trimLines) {
    lines = lines.map((l) => l.trim());
  }

  // 4. Remove empty lines
  if (options.removeEmptyLines) {
    lines = lines.filter((l) => l.length > 0);
  }

  // 5. Remove duplicate lines
  if (options.removeDuplicateLines) {
    lines = Array.from(new Set(lines));
  }

  // 6. Sort lines
  if (options.sortLines === "asc") {
    lines.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  } else if (options.sortLines === "desc") {
    lines.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: "base" }));
  }

  result = lines.join("\n");

  // 7. Case Transformation
  switch (options.caseTransform) {
    case "upper":
      result = result.toUpperCase();
      break;
    case "lower":
      result = result.toLowerCase();
      break;
    case "sentence":
      result = toSentenceCase(result);
      break;
    case "title":
      result = toTitleCase(result);
      break;
    case "camel":
      result = toCamelCase(result);
      break;
    case "snake":
      result = toSnakeCase(result);
      break;
    case "kebab":
      result = toKebabCase(result);
      break;
    case "none":
    default:
      break;
  }

  return result;
}

export function computeTextStats(text: string): TextStats {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const words = text.trim() ? (text.trim().match(/\S+/g) || []).length : 0;
  const lines = text ? text.split(/\r?\n/).length : 0;
  const nonEmptyLines = text ? text.split(/\r?\n/).filter((l) => l.trim().length > 0).length : 0;
  const bytes = new TextEncoder().encode(text).length;
  // Average reading speed: 200 words per minute
  const readingTimeMinutes = Math.max(1, Math.round((words / 200) * 10) / 10);

  return {
    characters,
    charactersNoSpaces,
    words,
    lines,
    nonEmptyLines,
    bytes,
    readingTimeMinutes,
  };
}
