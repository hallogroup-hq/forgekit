import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  escapeMarkdownCell,
  parseDelimitedTextToGrid,
  generateMarkdownTable,
  exportGridToCsv,
} from "./engine";

describe("Markdown Table Engine", () => {
  describe("escapeMarkdownCell", () => {
    it("should escape unescaped pipe characters inside cells", () => {
      assert.equal(escapeMarkdownCell("Feature | Details"), "Feature \\| Details");
      assert.equal(escapeMarkdownCell("Line 1\nLine 2"), "Line 1 Line 2");
    });
  });

  describe("parseDelimitedTextToGrid", () => {
    it("should parse standard comma-delimited text", () => {
      const csv = "Name,Role,Status\nAlice,Developer,Active\nBob,Designer,Pending";
      const grid = parseDelimitedTextToGrid(csv);
      assert.deepEqual(grid.headers, ["Name", "Role", "Status"]);
      assert.equal(grid.rows.length, 2);
      assert.deepEqual(grid.rows[0], ["Alice", "Developer", "Active"]);
    });

    it("should handle commas inside quoted strings (RFC 4180)", () => {
      const csv = 'Item,Location,Price\nBook,"New York, NY",$15.00';
      const grid = parseDelimitedTextToGrid(csv);
      assert.deepEqual(grid.headers, ["Item", "Location", "Price"]);
      assert.deepEqual(grid.rows[0], ["Book", "New York, NY", "$15.00"]);
    });

    it("should handle escaped double quotes", () => {
      const csv = 'Quote,Author\n"He said ""Hello!""",John';
      const grid = parseDelimitedTextToGrid(csv);
      assert.deepEqual(grid.rows[0], ['He said "Hello!"', "John"]);
    });

    it("should auto-detect tab-separated values (TSV)", () => {
      const tsv = "ID\tProduct\tQty\n101\tWidget\t42";
      const grid = parseDelimitedTextToGrid(tsv);
      assert.deepEqual(grid.headers, ["ID", "Product", "Qty"]);
      assert.deepEqual(grid.rows[0], ["101", "Widget", "42"]);
    });
  });

  describe("generateMarkdownTable", () => {
    it("should generate aligned Markdown table with alignment colons", () => {
      const headers = ["ID", "Name", "Score"];
      const alignments = ["left" as const, "center" as const, "right" as const];
      const rows = [
        ["1", "Alice", "95"],
        ["2", "Bob", "88"],
      ];
      const md = generateMarkdownTable(headers, alignments, rows);

      assert.ok(md.includes("| ID  | Name  | Score |"));
      assert.ok(md.includes("| :-- | :---: | ----: |"));
      assert.ok(md.includes("| 1   | Alice |    95 |"));
    });

    it("should escape pipe characters inside cells in generated markdown", () => {
      const headers = ["Test", "Option"];
      const alignments = ["left" as const, "left" as const];
      const rows = [["A | B", "C"]];
      const md = generateMarkdownTable(headers, alignments, rows);

      assert.ok(md.includes("A \\| B"));
    });
  });

  describe("exportGridToCsv", () => {
    it("should escape commas and quotes when exporting to CSV", () => {
      const headers = ["Name", "Address"];
      const rows = [["Alice", '123 Main St, "Apt 4"']];
      const csv = exportGridToCsv(headers, rows);
      assert.ok(csv.includes('"123 Main St, ""Apt 4"""'));
    });
  });
});
