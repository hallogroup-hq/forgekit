/**
 * Mock Data Generator Engine
 * Generates deterministic structured records and serializes to RFC 4180 compliant CSV and JSON.
 */

export type FieldType =
  | "uuid"
  | "fullName"
  | "email"
  | "phone"
  | "city"
  | "country"
  | "jobTitle"
  | "avatar"
  | "boolean"
  | "status"
  | "number"
  | "date";

export interface FieldDef {
  id: string;
  name: string;
  type: FieldType;
}

export const FIRST_NAMES = ["Liam", "Emma", "Noah", "Olivia", "Ethan", "Sophia", "Lucas", "Mia", "Aiden", "Isabella"];
export const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Taylor", "Anderson"];
export const DOMAINS = ["example.com", "mailhub.io", "techlabs.co", "nexuscorp.net", "forgeapp.dev"];
export const CITIES = ["San Francisco", "New York", "London", "Tokyo", "Berlin", "Jakarta", "Singapore", "Sydney", "Toronto", "Amsterdam"];
export const COUNTRIES = ["United States", "United Kingdom", "Germany", "Japan", "Indonesia", "Singapore", "Australia", "Canada", "Netherlands"];
export const JOBS = ["Software Engineer", "Product Designer", "Data Scientist", "DevOps Architect", "Technical Writer", "VP of Engineering"];
export const STATUSES = ["active", "pending", "suspended", "verified"];

/**
 * Escapes a field according to standard RFC 4180 CSV specifications.
 * Fields containing double-quotes, commas, or line breaks must be enclosed in double-quotes,
 * and any internal double-quote must be escaped by preceding it with another double-quote.
 */
export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) {
    return "";
  }
  const str = String(val);
  const needsQuoting = str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r");

  if (needsQuoting) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates an array of structured record objects from field definitions.
 */
export function generateMockDataset(
  fields: FieldDef[],
  count: number = 5,
  seed: number = 0
): Record<string, unknown>[] {
  const pick = <T,>(arr: T[], offset: number): T => arr[(offset + seed) % arr.length];

  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < count; i++) {
    const row: Record<string, unknown> = {};
    const fName = pick(FIRST_NAMES, i * 3);
    const lName = pick(LAST_NAMES, i * 7);

    for (const f of fields) {
      switch (f.type) {
        case "uuid":
          row[f.name] = `f7e8${(i + seed * 10).toString(16).padStart(4, "0")}-9c2b-42ab-b19c-${(1000 + i).toString(16).padStart(12, "0")}`;
          break;
        case "fullName":
          row[f.name] = `${fName} ${lName}`;
          break;
        case "email":
          row[f.name] = `${fName.toLowerCase()}.${lName.toLowerCase()}@${pick(DOMAINS, i)}`;
          break;
        case "phone":
          row[f.name] = `+1 (555) ${100 + i * 23}-${1000 + i * 87}`;
          break;
        case "city":
          row[f.name] = pick(CITIES, i);
          break;
        case "country":
          row[f.name] = pick(COUNTRIES, i);
          break;
        case "jobTitle":
          row[f.name] = pick(JOBS, i);
          break;
        case "avatar":
          row[f.name] = `https://api.dicebear.com/7.x/avataaars/svg?seed=${fName}${i}`;
          break;
        case "status":
          row[f.name] = pick(STATUSES, i);
          break;
        case "boolean":
          row[f.name] = (i + seed) % 2 === 0;
          break;
        case "number":
          row[f.name] = Math.round((i + 1) * 14.5 * (1 + (seed % 5)));
          break;
        case "date":
          row[f.name] = `2026-0${((i % 8) + 1)}-${String(((i * 3) % 27) + 1).padStart(2, "0")}`;
          break;
        default:
          row[f.name] = `Item ${i + 1}`;
      }
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Serializes dataset to RFC 4180 CSV format.
 */
export function exportDatasetToCsv(
  data: Record<string, unknown>[],
  fields: FieldDef[]
): string {
  if (data.length === 0 || fields.length === 0) return "";

  const headers = fields.map((f) => escapeCsvField(f.name)).join(",");
  const rows = data.map((row) =>
    fields.map((f) => escapeCsvField(row[f.name])).join(",")
  );

  return [headers, ...rows].join("\n");
}

/**
 * Serializes dataset to formatted JSON.
 */
export function exportDatasetToJson(data: Record<string, unknown>[]): string {
  return JSON.stringify(data, null, 2);
}
