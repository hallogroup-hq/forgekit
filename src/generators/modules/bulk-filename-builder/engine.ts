/**
 * Bulk Filename Renamer & Rule Builder Engine
 * Generates structured, slugified, zero-padded filenames,
 * and exports bash/batch renaming scripts and mapping CSVs.
 */

export interface RenameRuleOptions {
  prefix?: string;
  suffix?: string;
  findText?: string;
  replaceText?: string;
  casing?: "preserve" | "lowercase" | "uppercase" | "kebab-case" | "snake_case";
  slugify?: boolean;
  numbering?: boolean;
  numberingStart?: number;
  numberingDigits?: number;
  numberingPosition?: "prefix" | "suffix";
  changeExtension?: string;
}

export interface RenameMapping {
  oldName: string;
  newName: string;
  hasChanged: boolean;
}

/**
 * Splits a filename into base name and extension.
 */
export function splitFilename(filename: string): { base: string; ext: string } {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0) return { base: filename, ext: "" };
  return {
    base: filename.substring(0, lastDot),
    ext: filename.substring(lastDot), // includes leading dot, e.g. ".jpg"
  };
}

/**
 * Applies renaming transformations to a single filename.
 */
export function buildRenamedFilename(
  originalName: string,
  index: number,
  options: RenameRuleOptions
): string {
  const trimmed = originalName.trim();
  if (!trimmed) return "";

  const { base: origBase, ext: origExt } = splitFilename(trimmed);
  let base = origBase;

  // 1. Find and replace
  if (options.findText) {
    base = base.replaceAll(options.findText, options.replaceText ?? "");
  }

  // 2. Slugify if enabled
  if (options.slugify) {
    base = base
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // strip diacritics
      .replace(/[^\w\s-]/g, "") // strip punctuation
      .replace(/[\s_]+/g, "-") // collapse spaces to dash
      .replace(/^-+|-+$/g, ""); // trim leading/trailing dashes
  }

  // 3. Casing transformation
  if (options.casing === "lowercase") {
    base = base.toLowerCase();
  } else if (options.casing === "uppercase") {
    base = base.toUpperCase();
  } else if (options.casing === "kebab-case") {
    base = base.toLowerCase().replace(/[\s_]+/g, "-");
  } else if (options.casing === "snake_case") {
    base = base.toLowerCase().replace(/[\s-]+/g, "_");
  }

  // 4. Numbering sequence
  if (options.numbering) {
    const startIdx = options.numberingStart ?? 1;
    const digits = Math.max(1, options.numberingDigits ?? 3);
    const numStr = (startIdx + index).toString().padStart(digits, "0");

    if (options.numberingPosition === "prefix") {
      base = `${numStr}_${base}`;
    } else {
      base = `${base}_${numStr}`;
    }
  }

  // 5. Prefix & Suffix
  if (options.prefix) {
    base = `${options.prefix}${base}`;
  }
  if (options.suffix) {
    base = `${base}${options.suffix}`;
  }

  // 6. Extension
  let finalExt = origExt;
  if (options.casing === "lowercase" || options.casing === "kebab-case" || options.casing === "snake_case") {
    finalExt = finalExt.toLowerCase();
  } else if (options.casing === "uppercase") {
    finalExt = finalExt.toUpperCase();
  }

  if (options.changeExtension !== undefined && options.changeExtension.trim() !== "") {
    const rawExt = options.changeExtension.trim();
    finalExt = rawExt.startsWith(".") ? rawExt : `.${rawExt}`;
  }

  return `${base}${finalExt}`;
}

/**
 * Batches an array of filenames through the renamer.
 */
export function batchRenameFiles(
  filenames: string[],
  options: RenameRuleOptions
): RenameMapping[] {
  return filenames
    .filter((f) => f.trim().length > 0)
    .map((oldName, idx) => {
      const newName = buildRenamedFilename(oldName, idx, options);
      return {
        oldName: oldName.trim(),
        newName,
        hasChanged: oldName.trim() !== newName,
      };
    });
}

export function escapeBashArg(arg: string): string {
  // Wrap in single quotes and escape any single quotes
  return "'" + arg.replace(/'/g, "'\\''") + "'";
}

export function escapeCmdArg(arg: string): string {
  // Strip control characters and escape double quotes
  const sanitized = arg.replace(/[\r\n]/g, "");
  return `"${sanitized.replace(/"/g, '""')}"`;
}

/**
 * Generates an executable shell script (Bash for Mac/Linux or BAT for Windows).
 */
export function generateShellScript(
  mappings: RenameMapping[],
  format: "sh" | "bat" = "sh"
): string {
  if (format === "bat") {
    const lines = mappings
      .filter((m) => m.hasChanged)
      .map((m) => `ren ${escapeCmdArg(m.oldName)} ${escapeCmdArg(m.newName)}`);
    return `@echo off\nREM ForgeKit Batch Rename Script for Windows\n\n${lines.join("\n")}\n\necho Renamed ${lines.length} files successfully.\npause`;
  }

  // Default: Bash / Zsh (Mac & Linux)
  // Uses POSIX single-quote escaping and -- separator to prevent option injection
  const lines = mappings
    .filter((m) => m.hasChanged)
    .map((m) => `mv -n -- ${escapeBashArg(m.oldName)} ${escapeBashArg(m.newName)}`);

  return `#!/usr/bin/env bash
# ForgeKit Batch Rename Script
# Run in the directory containing the files: bash rename.sh

set -e

${lines.join("\n")}

echo "Successfully renamed ${lines.length} files."
`;
}

/**
 * Exports rename mappings to RFC 4180 CSV.
 */
export function generateMappingCsv(mappings: RenameMapping[]): string {
  const escapeCsv = (str: string) => {
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = "original_filename,new_filename,changed";
  const rows = mappings.map(
    (m) => `${escapeCsv(m.oldName)},${escapeCsv(m.newName)},${m.hasChanged}`
  );
  return `${header}\n${rows.join("\n")}`;
}
