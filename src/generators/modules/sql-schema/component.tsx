"use client";

import React, { useState, useMemo } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

type Dialect = "postgres" | "mysql" | "sqlite";
type ColumnType =
  | "UUID"
  | "VARCHAR(255)"
  | "TEXT"
  | "INTEGER"
  | "BIGINT"
  | "DECIMAL(10,2)"
  | "BOOLEAN"
  | "TIMESTAMPTZ"
  | "JSONB";

interface ColumnDef {
  id: string;
  name: string;
  type: ColumnType;
  isPrimary?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  defaultValue?: string;
}

interface TablePreset {
  name: string;
  tableName: string;
  columns: ColumnDef[];
}

const PRESETS: TablePreset[] = [
  {
    name: "Users & Auth",
    tableName: "users",
    columns: [
      { id: "1", name: "id", type: "UUID", isPrimary: true, defaultValue: "gen_random_uuid()" },
      { id: "2", name: "email", type: "VARCHAR(255)", isUnique: true, isNullable: false },
      { id: "3", name: "full_name", type: "VARCHAR(255)", isNullable: true },
      { id: "4", name: "is_active", type: "BOOLEAN", defaultValue: "true" },
      { id: "5", name: "role", type: "VARCHAR(255)", defaultValue: "'member'" },
      { id: "6", name: "created_at", type: "TIMESTAMPTZ", defaultValue: "NOW()" },
    ],
  },
  {
    name: "Orders & E-commerce",
    tableName: "orders",
    columns: [
      { id: "1", name: "id", type: "UUID", isPrimary: true, defaultValue: "gen_random_uuid()" },
      { id: "2", name: "user_id", type: "UUID", isNullable: false },
      { id: "3", name: "total_amount", type: "DECIMAL(10,2)", isNullable: false },
      { id: "4", name: "status", type: "VARCHAR(255)", defaultValue: "'pending'" },
      { id: "5", name: "currency", type: "VARCHAR(255)", defaultValue: "'USD'" },
      { id: "6", name: "metadata", type: "JSONB", defaultValue: "'{}'::jsonb" },
      { id: "7", name: "created_at", type: "TIMESTAMPTZ", defaultValue: "NOW()" },
    ],
  },
  {
    name: "Articles & Blog",
    tableName: "posts",
    columns: [
      { id: "1", name: "id", type: "UUID", isPrimary: true, defaultValue: "gen_random_uuid()" },
      { id: "2", name: "slug", type: "VARCHAR(255)", isUnique: true, isNullable: false },
      { id: "3", name: "title", type: "VARCHAR(255)", isNullable: false },
      { id: "4", name: "body", type: "TEXT", isNullable: false },
      { id: "5", name: "view_count", type: "INTEGER", defaultValue: "0" },
      { id: "6", name: "published", type: "BOOLEAN", defaultValue: "false" },
      { id: "7", name: "created_at", type: "TIMESTAMPTZ", defaultValue: "NOW()" },
    ],
  },
];

const COLUMN_TYPES: ColumnType[] = [
  "UUID",
  "VARCHAR(255)",
  "TEXT",
  "INTEGER",
  "BIGINT",
  "DECIMAL(10,2)",
  "BOOLEAN",
  "TIMESTAMPTZ",
  "JSONB",
];

export default function SqlSchemaGenerator() {
  const [dialect, setDialect] = useState<Dialect>("postgres");
  const [tableName, setTableName] = useState("users");
  const [seedCount, setSeedCount] = useState(10);
  const [activeTab, setActiveTab] = useState<"ddl" | "seeds" | "types">("ddl");

  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: "1", name: "id", type: "UUID", isPrimary: true, defaultValue: "gen_random_uuid()" },
    { id: "2", name: "email", type: "VARCHAR(255)", isUnique: true, isNullable: false },
    { id: "3", name: "full_name", type: "VARCHAR(255)", isNullable: true },
    { id: "4", name: "is_active", type: "BOOLEAN", defaultValue: "true" },
    { id: "5", name: "role", type: "VARCHAR(255)", defaultValue: "'member'" },
    { id: "6", name: "created_at", type: "TIMESTAMPTZ", defaultValue: "NOW()" },
  ]);

  const loadPreset = (p: TablePreset) => {
    setTableName(p.tableName);
    setColumns(JSON.parse(JSON.stringify(p.columns)));
    confetti({ particleCount: 20, spread: 50, origin: { y: 0.8 } });
  };

  const addColumn = () => {
    const id = Date.now().toString();
    setColumns((prev) => [
      ...prev,
      { id, name: `col_${prev.length + 1}`, type: "VARCHAR(255)", isNullable: true },
    ]);
  };

  const removeColumn = (id: string) => {
    if (columns.length <= 1) return;
    setColumns((prev) => prev.filter((c) => c.id !== id));
  };

  const updateColumn = (id: string, updates: Partial<ColumnDef>) => {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  // Generate DDL Schema
  const ddlSql = useMemo(() => {
    const lines: string[] = [];

    columns.forEach((col) => {
      let typeStr: string = col.type;
      if (dialect === "mysql") {
        if (col.type === "UUID") typeStr = "CHAR(36)";
        if (col.type === "TIMESTAMPTZ") typeStr = "DATETIME DEFAULT CURRENT_TIMESTAMP";
        if (col.type === "BOOLEAN") typeStr = "TINYINT(1)";
        if (col.type === "JSONB") typeStr = "JSON";
      } else if (dialect === "sqlite") {
        if (col.type === "UUID") typeStr = "TEXT";
        if (col.type === "TIMESTAMPTZ") typeStr = "TEXT";
        if (col.type === "BOOLEAN") typeStr = "INTEGER";
        if (col.type === "JSONB") typeStr = "TEXT";
      }

      let line = `  ${col.name} ${typeStr}`;
      if (col.isPrimary) {
        line += " PRIMARY KEY";
      } else {
        if (col.isNullable === false) line += " NOT NULL";
        if (col.isUnique) line += " UNIQUE";
        if (col.defaultValue) {
          line += ` DEFAULT ${col.defaultValue}`;
        }
      }
      lines.push(line);
    });

    const body = lines.join(",\n");
    let createTable = `-- Schema definition for "${tableName}" (${dialect.toUpperCase()})\n`;
    createTable += `CREATE TABLE ${tableName} (\n${body}\n);\n`;

    // Add indexes for unique or foreign keys
    const nonPrimaryCols = columns.filter((c) => !c.isPrimary && c.name.endsWith("_id"));
    if (nonPrimaryCols.length > 0) {
      createTable += `\n-- Foreign key and lookup indexes\n`;
      nonPrimaryCols.forEach((c) => {
        createTable += `CREATE INDEX idx_${tableName}_${c.name} ON ${tableName}(${c.name});\n`;
      });
    }

    return createTable;
  }, [dialect, tableName, columns]);

  // Generate Realistic Mock Seed Data
  const seedSql = useMemo(() => {
    const names = ["Jordan Lee", "Taylor Swift", "Alex Chen", "Morgan Reed", "Casey Novak", "Sam Vance", "Riley Stone", "Drew Miller", "Avery Brooks", "Quinn Parker"];
    const emails = ["jordan@acme.dev", "taylor@cloudnet.io", "alex@synthlabs.co", "morgan@forgeapp.dev", "casey@orbitai.net", "sam@vortex.org", "riley@apex.dev", "drew@pulse.io", "avery@basehub.app", "quinn@vector.ai"];
    const statuses = ["pending", "active", "completed", "archived", "cancelled"];
    const roles = ["admin", "member", "editor", "viewer"];

    const nonAutoCols = columns.filter((c) => c.name !== "id" || c.type === "UUID");
    const colNames = nonAutoCols.map((c) => c.name).join(", ");

    let out = `-- Seed data for "${tableName}" (${seedCount} records)\n`;
    out += `INSERT INTO ${tableName} (${colNames})\nVALUES\n`;

    const rowStrings: string[] = [];
    for (let i = 0; i < seedCount; i++) {
      const vals = nonAutoCols.map((col) => {
        const lowerName = col.name.toLowerCase();
        if (col.type === "UUID") {
          return `'${(i + 1).toString().padStart(8, "0")}-0000-4000-8000-${(i + 1).toString().padStart(12, "0")}'`;
        }
        if (lowerName.includes("email")) {
          return `'${emails[i % emails.length]}'`;
        }
        if (lowerName.includes("name")) {
          return `'${names[i % names.length]}'`;
        }
        if (lowerName.includes("status")) {
          return `'${statuses[i % statuses.length]}'`;
        }
        if (lowerName.includes("role")) {
          return `'${roles[i % roles.length]}'`;
        }
        if (col.type === "BOOLEAN") {
          return i % 3 === 0 ? "false" : "true";
        }
        if (col.type === "INTEGER" || col.type === "BIGINT") {
          return `${(i + 1) * 12}`;
        }
        if (col.type === "DECIMAL(10,2)") {
          return `${((i + 1) * 24.5).toFixed(2)}`;
        }
        if (col.type === "TIMESTAMPTZ") {
          return `'2026-10-08 12:${(i * 5).toString().padStart(2, "0")}:00+00'`;
        }
        if (col.type === "JSONB") {
          return `'{"plan": "pro", "tier": ${i + 1}}'`;
        }
        return `'Sample ${col.name} ${i + 1}'`;
      });
      rowStrings.push(`  (${vals.join(", ")})`);
    }

    out += rowStrings.join(",\n") + ";\n";
    return out;
  }, [tableName, columns, seedCount]);

  // Generate TypeScript Interface
  const typeScriptDefinition = useMemo(() => {
    const tsLines = columns.map((col) => {
      let tsType = "string";
      if (col.type === "BOOLEAN") tsType = "boolean";
      if (col.type === "INTEGER" || col.type === "BIGINT" || col.type === "DECIMAL(10,2)") tsType = "number";
      if (col.type === "JSONB") tsType = "Record<string, unknown>";
      if (col.isNullable) tsType += " | null";
      return `  ${col.name}: ${tsType};`;
    });

    const pascalName = tableName.charAt(0).toUpperCase() + tableName.slice(1);
    return `// TypeScript schema definition for ${tableName}
export interface ${pascalName} {
${tsLines.join("\n")}
}
`;
  }, [tableName, columns]);

  const handleDownload = () => {
    const filename = `${tableName}-schema.sql`;
    const content = `${ddlSql}\n\n${seedSql}`;
    downloadFile(content, filename, "text/plain");
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Configuration Column (Left) */}
      <div className="lg:col-span-6 space-y-6">
        {/* Preset Chips */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Schema Presets
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => loadPreset(p)}
                className="px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dialect and Table Name */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                SQL Dialect
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(["postgres", "mysql", "sqlite"] as Dialect[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDialect(d)}
                    className={`py-1.5 text-xs font-medium rounded-lg uppercase transition-colors ${
                      dialect === d
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {d === "postgres" ? "PG" : d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Table Name
              </label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Columns Builder */}
        <div className="space-y-3 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
              Table Columns ({columns.length})
            </label>
            <button
              type="button"
              onClick={addColumn}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity flex items-center gap-1 active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Column
            </button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {columns.map((col) => (
              <div
                key={col.id}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/60 text-xs"
              >
                {/* Column Name */}
                <input
                  type="text"
                  value={col.name}
                  onChange={(e) => updateColumn(col.id, { name: e.target.value.toLowerCase() })}
                  placeholder="name"
                  className="w-28 px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />

                {/* Column Type */}
                <select
                  value={col.type}
                  onChange={(e) => updateColumn(col.id, { type: e.target.value as ColumnType })}
                  className="flex-1 px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                >
                  {COLUMN_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                {/* Toggles */}
                <label className="flex items-center gap-1 text-[11px] text-zinc-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={col.isPrimary || false}
                    onChange={(e) => updateColumn(col.id, { isPrimary: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>PK</span>
                </label>

                <label className="flex items-center gap-1 text-[11px] text-zinc-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={col.isNullable !== false}
                    onChange={(e) => updateColumn(col.id, { isNullable: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>Null</span>
                </label>

                <button
                  type="button"
                  onClick={() => removeColumn(col.id)}
                  className="p-1 rounded text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Seed row count slider */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
            <span>Mock Seed Records: {seedCount}</span>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={seedCount}
              onChange={(e) => setSeedCount(parseInt(e.target.value))}
              className="w-32 accent-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Output Column (Right) */}
      <div className="lg:col-span-6 flex flex-col space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("ddl")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === "ddl"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              CREATE TABLE DDL
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("seeds")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === "seeds"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              SQL Seed Inserts ({seedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("types")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === "types"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              TypeScript Interface
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton
              text={activeTab === "ddl" ? ddlSql : activeTab === "seeds" ? seedSql : typeScriptDefinition}
              label="Copy"
            />
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 shadow-2xs transition-colors active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              Download .sql
            </button>
          </div>
        </div>

        {/* Tab View Container */}
        <div className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5 overflow-hidden shadow-2xs flex flex-col">
          <pre className="flex-1 font-mono text-xs text-zinc-800 dark:text-zinc-200 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-200/60 dark:border-zinc-800/60 max-h-[550px] overflow-y-auto">
            {activeTab === "ddl" && ddlSql}
            {activeTab === "seeds" && seedSql}
            {activeTab === "types" && typeScriptDefinition}
          </pre>
        </div>
      </div>
    </div>
  );
}
