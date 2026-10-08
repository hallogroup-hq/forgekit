/**
 * CSV Cleaner & Normalizer Engine
 * RFC 4180 compliant parsing, cell trimming, duplicate removal,
 * empty line stripping, header normalization, and delimiter conversion.
 */

export interface CsvCleanOptions {
  trimCells?: boolean;
  removeEmptyRows?: boolean;
  removeDuplicates?: boolean;
  headerFormat?: "original" | "lowercase" | "snake_case" | "kebab_case";
  emptyValueReplacement?: string;
  outputDelimiter?: "," | ";" | "\t";
}

export interface CsvCleanStats {
  initialRowCount: number;
  finalRowCount: number;
  initialColCount: number;
  duplicatesRemoved: number;
  emptyRowsRemoved: number;
  detectedDelimiter: string;
}

export interface CsvCleanResult {
  rows: string[][];
  stats: CsvCleanStats;
  outputCsv: string;
}

/**
 * Detects the delimiter used in a CSV text.
 */
export function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0] || "";
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;

  if (tabCount > semiCount && tabCount > commaCount) return "\t";
  if (semiCount > commaCount) return ";";
  return ",";
}

/**
 * Parses raw delimited string into 2D string array according to RFC 4180.
 */
export function parseRawCsv(text: string, delimiter?: string): { rows: string[][]; detectedDelimiter: string } {
  const delim = delimiter || detectDelimiter(text);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      }

      if (char === delim) {
        currentRow.push(currentField);
        currentField = "";
        i++;
        continue;
      }

      if (char === "\r") {
        i++;
        continue;
      }

      if (char === "\n") {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
        i++;
        continue;
      }

      currentField += char;
      i++;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return { rows, detectedDelimiter: delim };
}

/**
 * Formats a header field to lowercase, snake_case, or kebab-case.
 */
export function formatHeaderField(header: string, format: CsvCleanOptions["headerFormat"]): string {
  const trimmed = header.trim();
  if (!format || format === "original") return trimmed;

  if (format === "lowercase") {
    return trimmed.toLowerCase();
  }

  const clean = trimmed
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (format === "snake_case") {
    return clean.toLowerCase().replace(/[\s-]+/g, "_");
  }

  if (format === "kebab_case") {
    return clean.toLowerCase().replace(/[\s_]+/g, "-");
  }

  return trimmed;
}

/**
 * Serializes 2D array back to RFC 4180 CSV with quotes when necessary.
 */
export function serializeCsv(rows: string[][], delimiter: string = ","): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const str = cell ?? "";
          if (str.includes(delimiter) || str.includes('"') || str.includes("\n") || str.includes("\r")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(delimiter)
    )
    .join("\n");
}

/**
 * Cleans and transforms CSV text according to options.
 */
export function cleanCsv(
  csvText: string,
  options: CsvCleanOptions = {}
): CsvCleanResult {
  const {
    trimCells = true,
    removeEmptyRows = true,
    removeDuplicates = true,
    headerFormat = "original",
    emptyValueReplacement = "",
    outputDelimiter = ",",
  } = options;

  const { rows: parsedRows, detectedDelimiter } = parseRawCsv(csvText);
  const initialRowCount = parsedRows.length;
  const initialColCount = parsedRows.length > 0 ? Math.max(...parsedRows.map((r) => r.length)) : 0;

  if (parsedRows.length === 0) {
    return {
      rows: [],
      stats: {
        initialRowCount: 0,
        finalRowCount: 0,
        initialColCount: 0,
        duplicatesRemoved: 0,
        emptyRowsRemoved: 0,
        detectedDelimiter,
      },
      outputCsv: "",
    };
  }

  let emptyRowsCount = 0;
  let duplicatesCount = 0;

  // Process headers
  const headers = parsedRows[0].map((h) => formatHeaderField(h, headerFormat));
  const bodyRows = parsedRows.slice(1);

  const cleanedBodyRows: string[][] = [];
  const seenRows = new Set<string>();

  for (const row of bodyRows) {
    // Trim cells and replace empties
    const processedRow = row.map((cell) => {
      let val = trimCells ? cell.trim() : cell;
      if (val === "" && emptyValueReplacement) {
        val = emptyValueReplacement;
      }
      return val;
    });

    // Check if row is completely empty
    const isEmpty = processedRow.every((c) => c === "" || (emptyValueReplacement && c === emptyValueReplacement));
    if (removeEmptyRows && isEmpty) {
      emptyRowsCount++;
      continue;
    }

    // Check duplicates
    const serialized = JSON.stringify(processedRow);
    if (removeDuplicates && seenRows.has(serialized)) {
      duplicatesCount++;
      continue;
    }

    seenRows.add(serialized);
    cleanedBodyRows.push(processedRow);
  }

  const finalRows = [headers, ...cleanedBodyRows];
  const outputCsv = serializeCsv(finalRows, outputDelimiter);

  return {
    rows: finalRows,
    stats: {
      initialRowCount,
      finalRowCount: finalRows.length,
      initialColCount,
      duplicatesRemoved: duplicatesCount,
      emptyRowsRemoved: emptyRowsCount,
      detectedDelimiter,
    },
    outputCsv,
  };
}
