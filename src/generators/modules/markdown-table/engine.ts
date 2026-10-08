/**
 * Markdown Table Engine
 * RFC 4180 compliant CSV/TSV parser, column width padding, pipe-escaping,
 * and GitHub Flavored Markdown (GFM) table generator.
 */

export type TableAlignment = "left" | "center" | "right";

export interface ParsedGrid {
  headers: string[];
  alignments: TableAlignment[];
  rows: string[][];
}

/**
 * Escapes pipe characters within Markdown cells to prevent broken table syntax.
 */
export function escapeMarkdownCell(val: string): string {
  if (!val) return "";
  // Escape unescaped pipe characters
  return val.replace(/(?<!\\)\|/g, "\\|").replace(/\n/g, " ");
}

/**
 * Robust RFC 4180 parser that supports commas/newlines in quotes, escaped double quotes,
 * and detects commas, tabs, or semicolons.
 */
export function parseDelimitedTextToGrid(text: string): ParsedGrid {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      headers: ["Column 1"],
      alignments: ["left"],
      rows: [[""]],
    };
  }

  // Detect delimiter from first line (tab, semicolon, or comma)
  const firstLine = trimmed.split("\n")[0];
  let delimiter = ",";
  if (firstLine.includes("\t")) delimiter = "\t";
  else if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) delimiter = ";";

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  while (i < trimmed.length) {
    const char = trimmed[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < trimmed.length && trimmed[i + 1] === '"') {
          // Escaped quote
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Close quote
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

      if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = "";
        i++;
        continue;
      }

      if (char === "\r") {
        i++;
        continue;
      }

      if (char === "\n") {
        currentRow.push(currentField.trim());
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
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  if (rows.length === 0) {
    return {
      headers: ["Column 1"],
      alignments: ["left"],
      rows: [[""]],
    };
  }

  const rawHeaders = rows[0];
  const maxCols = Math.max(...rows.map((r) => r.length), 1);

  // Normalize header length
  const headers = Array.from({ length: maxCols }, (_, idx) => rawHeaders[idx] || `Column ${idx + 1}`);
  const alignments: TableAlignment[] = new Array(maxCols).fill("left");

  // Pad body rows to equal column length
  const bodyRows = rows.slice(1).map((r) => {
    return Array.from({ length: maxCols }, (_, idx) => r[idx] || "");
  });

  return {
    headers,
    alignments,
    rows: bodyRows.length > 0 ? bodyRows : [new Array(maxCols).fill("")],
  };
}

/**
 * Formats a grid into GitHub Flavored Markdown table syntax with exact padding.
 */
export function generateMarkdownTable(
  headers: string[],
  alignments: TableAlignment[],
  rows: string[][]
): string {
  const colCount = Math.max(headers.length, 1);
  const normalizedAlign = Array.from({ length: colCount }, (_, i) => alignments[i] || "left");

  // Calculate maximum cell widths per column (including escaping)
  const colWidths = Array.from({ length: colCount }, (_, i) => {
    const headerLen = escapeMarkdownCell(headers[i] || "").length;
    const maxRowLen = rows.reduce((max, r) => {
      const cellLen = escapeMarkdownCell(r[i] || "").length;
      return Math.max(max, cellLen);
    }, 0);
    return Math.max(headerLen, maxRowLen, 3);
  });

  const formatRow = (cells: string[]) => {
    const padded = Array.from({ length: colCount }, (_, i) => {
      const width = colWidths[i];
      const val = escapeMarkdownCell(cells[i] || "");
      const align = normalizedAlign[i];

      if (align === "right") {
        return val.padStart(width, " ");
      }
      if (align === "center") {
        const totalPad = width - val.length;
        const leftPad = Math.floor(totalPad / 2);
        const rightPad = totalPad - leftPad;
        return " ".repeat(leftPad) + val + " ".repeat(rightPad);
      }
      return val.padEnd(width, " ");
    });
    return `| ${padded.join(" | ")} |`;
  };

  const headerLine = formatRow(headers);

  // Separator line with alignment colons
  const separatorLine = `| ${colWidths
    .map((w, i) => {
      const align = normalizedAlign[i];
      if (align === "center") return `:${"-".repeat(Math.max(w - 2, 1))}:`;
      if (align === "right") return `${"-".repeat(Math.max(w - 1, 1))}:`;
      return `:${"-".repeat(Math.max(w - 1, 1))}`;
    })
    .join(" | ")} |`;

  const bodyLines = rows.map(formatRow).join("\n");

  return `${headerLine}\n${separatorLine}\n${bodyLines}`;
}

/**
 * Exports grid to RFC 4180 CSV string.
 */
export function exportGridToCsv(headers: string[], rows: string[][]): string {
  const escapeCsv = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const headerRow = headers.map(escapeCsv).join(",");
  const dataRows = rows.map((r) => r.map(escapeCsv).join(",")).join("\n");
  return `${headerRow}\n${dataRows}`;
}
