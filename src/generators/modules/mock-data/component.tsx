"use client";

import React, { useState, useMemo } from "react";
import { Plus, Trash2, RefreshCw, Download, FileSpreadsheet, Eye, Code2 } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

type FieldType =
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

interface FieldDef {
  id: string;
  name: string;
  type: FieldType;
}

const FIRST_NAMES = ["Liam", "Emma", "Noah", "Olivia", "Ethan", "Sophia", "Lucas", "Mia", "Aiden", "Isabella"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Taylor", "Anderson"];
const DOMAINS = ["example.com", "mailhub.io", "techlabs.co", "nexuscorp.net", "forgeapp.dev"];
const CITIES = ["San Francisco", "New York", "London", "Tokyo", "Berlin", "Jakarta", "Singapore", "Sydney", "Toronto", "Amsterdam"];
const COUNTRIES = ["United States", "United Kingdom", "Germany", "Japan", "Indonesia", "Singapore", "Australia", "Canada", "Netherlands"];
const JOBS = ["Software Engineer", "Product Designer", "Data Scientist", "DevOps Architect", "Technical Writer", "VP of Engineering"];
const STATUSES = ["active", "pending", "suspended", "verified"];

export default function MockDataGenerator() {
  const [count, setCount] = useState(5);
  const [seed, setSeed] = useState(0);
  const [outputTab, setOutputTab] = useState<"json" | "csv">("json");

  const [fields, setFields] = useState<FieldDef[]>([
    { id: "1", name: "id", type: "uuid" },
    { id: "2", name: "name", type: "fullName" },
    { id: "3", name: "email", type: "email" },
    { id: "4", name: "role", type: "jobTitle" },
    { id: "5", name: "status", type: "status" },
  ]);

  const addField = () => {
    const id = Date.now().toString();
    setFields((prev) => [...prev, { id, name: `field_${prev.length + 1}`, type: "city" }]);
  };

  const removeField = (id: string) => {
    if (fields.length <= 1) return;
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<FieldDef>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  // Generate data deterministically or with pseudo-random seed
  const generatedData = useMemo(() => {
    const pick = <T,>(arr: T[], offset: number): T => arr[(offset + seed) % arr.length];

    const rows = [];
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
            row[f.name] = Math.floor(((i * 73 + seed * 17) % 900) + 100);
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
  }, [fields, count, seed]);

  const jsonString = useMemo(() => {
    return JSON.stringify(generatedData, null, 2);
  }, [generatedData]);

  const csvString = useMemo(() => {
    if (generatedData.length === 0) return "";
    const headers = fields.map((f) => f.name).join(",");
    const rows = generatedData.map((row) =>
      fields.map((f) => {
        const val = row[f.name];
        return typeof val === "string" && val.includes(",") ? `"${val}"` : String(val);
      }).join(",")
    );
    return [headers, ...rows].join("\n");
  }, [generatedData, fields]);

  const handleDownload = (format: "json" | "csv") => {
    if (format === "json") {
      downloadFile(jsonString, `mock-data-${Date.now()}.json`, "application/json");
    } else {
      downloadFile(csvString, `mock-data-${Date.now()}.csv`, "text/csv");
    }
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Schema Config (Left) */}
      <div className="lg:col-span-5 space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Schema Builder
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-500">Rows:</label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            >
              <option value={3}>3 rows</option>
              <option value={5}>5 rows</option>
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
            </select>
          </div>
        </div>

        {/* Fields List */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {fields.map((field) => (
            <div
              key={field.id}
              className="flex items-center gap-2 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50"
            >
              <input
                type="text"
                value={field.name}
                onChange={(e) => updateField(field.id, { name: e.target.value })}
                placeholder="key_name"
                className="w-1/2 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
              <select
                value={field.type}
                onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                className="w-1/2 px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                <option value="uuid">UUID v4</option>
                <option value="fullName">Full Name</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="city">City</option>
                <option value="country">Country</option>
                <option value="jobTitle">Job Title</option>
                <option value="status">Status Badge</option>
                <option value="boolean">Boolean</option>
                <option value="number">Random Number</option>
                <option value="date">Date</option>
                <option value="avatar">Avatar URL</option>
              </select>
              <button
                type="button"
                onClick={() => removeField(field.id)}
                disabled={fields.length <= 1}
                className="p-1.5 text-zinc-400 hover:text-rose-500 disabled:opacity-30 disabled:hover:text-zinc-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={addField}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Field</span>
          </button>

          <button
            type="button"
            onClick={() => setSeed((prev) => prev + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate Values</span>
          </button>
        </div>
      </div>

      {/* Output Panel (Right) */}
      <div className="lg:col-span-7 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 overflow-hidden">
        {/* Output Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setOutputTab("json")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                outputTab === "json"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>JSON ({count} rows)</span>
            </button>
            <button
              onClick={() => setOutputTab("csv")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                outputTab === "csv"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton
              text={outputTab === "json" ? jsonString : csvString}
              label="Copy"
              size="sm"
              variant="secondary"
              triggerConfetti
            />
            <button
              onClick={() => handleDownload(outputTab)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .{outputTab}</span>
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="p-4 flex-1 max-h-[500px] overflow-y-auto">
          <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap selection:bg-blue-500/20">
            {outputTab === "json" ? jsonString : csvString}
          </pre>
        </div>
      </div>
    </div>
  );
}
