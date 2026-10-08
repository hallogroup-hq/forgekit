import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  detectDelimiter,
  parseRawCsv,
  formatHeaderField,
  serializeCsv,
  cleanCsv,
} from "./engine";

describe("CSV Cleaner Engine", () => {
  describe("detectDelimiter", () => {
    it("should detect comma, tab, and semicolon correctly", () => {
      assert.equal(detectDelimiter("name,age,city"), ",");
      assert.equal(detectDelimiter("name\tage\tcity"), "\t");
      assert.equal(detectDelimiter("name;age;city"), ";");
    });
  });

  describe("parseRawCsv & serializeCsv", () => {
    it("should parse and serialize fields with quotes and commas (RFC 4180)", () => {
      const csv = 'Name,Address,Price\nAlice,"123 Main St, Apt 4","$50"';
      const { rows } = parseRawCsv(csv);
      assert.equal(rows.length, 2);
      assert.equal(rows[1][1], "123 Main St, Apt 4");

      const reserialized = serializeCsv(rows, ",");
      assert.ok(reserialized.includes('"123 Main St, Apt 4"'));
    });

    it("should handle RFC 4180 doubled quotes and multiline fields without corruption", () => {
      const complexCsv = 'id,notes\n1,"Said: ""Hello, World!"""\n2,"Line 1\nLine 2"';
      const { rows } = parseRawCsv(complexCsv);
      assert.equal(rows.length, 3);
      assert.equal(rows[1][1], 'Said: "Hello, World!"');
      assert.equal(rows[2][1], 'Line 1\nLine 2');

      const reOutput = serializeCsv(rows, ",");
      assert.ok(reOutput.includes('""Hello, World!""'));
      assert.ok(reOutput.includes('"Line 1\nLine 2"'));

      // Round-trip back through parser
      const { rows: roundTripRows } = parseRawCsv(reOutput);
      assert.deepEqual(roundTripRows, rows);
    });
  });

  describe("formatHeaderField", () => {
    it("should convert headers to snake_case and kebab-case", () => {
      assert.equal(formatHeaderField("Customer Name", "snake_case"), "customer_name");
      assert.equal(formatHeaderField("Email Address!", "kebab_case"), "email-address");
      assert.equal(formatHeaderField("First Name", "lowercase"), "first name");
    });
  });

  describe("cleanCsv operations", () => {
    it("should trim cells, remove empty rows, and drop duplicate rows", () => {
      const dirtyCsv = `
Name , Role , Status 
 Alice , Developer , Active 
 Bob , Designer , Active 
 Alice , Developer , Active 
 , , 
 Charlie , Manager , Pending 
`.trim();

      const result = cleanCsv(dirtyCsv, {
        trimCells: true,
        removeEmptyRows: true,
        removeDuplicates: true,
        headerFormat: "snake_case",
      });

      assert.deepEqual(result.rows[0], ["name", "role", "status"]);
      // Initial rows: 1 header + 5 data rows = 6 rows
      // Dropped 1 empty row, dropped 1 duplicate Alice -> 4 final rows
      assert.equal(result.stats.emptyRowsRemoved, 1);
      assert.equal(result.stats.duplicatesRemoved, 1);
      assert.equal(result.rows.length, 4);
      assert.deepEqual(result.rows[1], ["Alice", "Developer", "Active"]);
    });

    it("should convert delimiter from semicolon to comma", () => {
      const semiCsv = "Item;Qty;Price\nApple;10;$5\nOrange;20;$8";
      const result = cleanCsv(semiCsv, { outputDelimiter: "," });
      assert.ok(result.outputCsv.includes("Item,Qty,Price"));
      assert.ok(result.outputCsv.includes("Apple,10,$5"));
    });
  });
});
