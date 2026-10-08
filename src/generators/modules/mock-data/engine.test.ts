import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  escapeCsvField,
  generateMockDataset,
  exportDatasetToCsv,
  exportDatasetToJson,
  FieldDef,
} from "./engine";

describe("Mock Data Studio Engine", () => {
  describe("escapeCsvField (RFC 4180)", () => {
    it("should leave simple alphanumeric strings unquoted", () => {
      assert.equal(escapeCsvField("SimpleText"), "SimpleText");
      assert.equal(escapeCsvField(12345), "12345");
      assert.equal(escapeCsvField(true), "true");
    });

    it("should quote strings containing commas", () => {
      assert.equal(escapeCsvField("San Francisco, CA"), '"San Francisco, CA"');
    });

    it("should escape internal double quotes by doubling them", () => {
      assert.equal(escapeCsvField('14" MacBook Pro'), '"14"" MacBook Pro"');
      assert.equal(escapeCsvField('Said "Hello"'), '"Said ""Hello"""');
    });

    it("should quote strings containing newlines or carriage returns", () => {
      assert.equal(escapeCsvField("Line 1\nLine 2"), '"Line 1\nLine 2"');
      assert.equal(escapeCsvField("Line 1\r\nLine 2"), '"Line 1\r\nLine 2"');
    });

    it("should handle null or undefined safely", () => {
      assert.equal(escapeCsvField(null), "");
      assert.equal(escapeCsvField(undefined), "");
    });
  });

  describe("generateMockDataset & exportDatasetToCsv", () => {
    const fields: FieldDef[] = [
      { id: "1", name: "id", type: "uuid" },
      { id: "2", name: "fullName", type: "fullName" },
      { id: "3", name: "email", type: "email" },
      { id: "4", name: "jobTitle", type: "jobTitle" },
    ];

    it("should generate the requested number of records deterministically", () => {
      const data = generateMockDataset(fields, 10, 42);
      assert.equal(data.length, 10);
      assert.ok(typeof data[0].fullName === "string");
      assert.ok(typeof data[0].email === "string");
      assert.ok(data[0].email.toString().includes("@"));
    });

    it("should export dataset to valid RFC 4180 CSV", () => {
      const data = [
        { name: 'John "The Chief" Doe', city: "New York, NY", age: 35 },
        { name: "Jane Smith", city: "Chicago", age: 28 },
      ];
      const customFields: FieldDef[] = [
        { id: "1", name: "name", type: "fullName" },
        { id: "2", name: "city", type: "city" },
        { id: "3", name: "age", type: "number" },
      ];
      const csv = exportDatasetToCsv(data, customFields);
      const lines = csv.split("\n");
      assert.equal(lines[0], "name,city,age");
      assert.equal(lines[1], '"John ""The Chief"" Doe","New York, NY",35');
      assert.equal(lines[2], "Jane Smith,Chicago,28");
    });

    it("should serialize to valid JSON", () => {
      const data = generateMockDataset(fields, 3, 1);
      const json = exportDatasetToJson(data);
      const parsed = JSON.parse(json);
      assert.equal(parsed.length, 3);
      assert.ok(parsed[0].id);
    });
  });
});
