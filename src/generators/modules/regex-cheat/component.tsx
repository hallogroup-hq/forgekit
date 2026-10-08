"use client";

import React, { useState, useMemo } from "react";
import { Download, Terminal, CheckCircle2, AlertCircle, Code, Layers } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";
import { safeExecuteRegex, safeExecuteRegexIsolated, RegexEvaluation } from "./engine";

interface RegexPreset {
  id: string;
  name: string;
  pattern: string;
  flags: string;
  sampleText: string;
  description: string;
}

const REGEX_PRESETS: RegexPreset[] = [
  {
    id: "email",
    name: "Email Address (RFC 5322)",
    pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    flags: "g",
    sampleText: "Contact us at support@linear.app or sales@stripe.com for inquiry.",
    description: "Matches standard compliant email formats.",
  },
  {
    id: "semver",
    name: "SemVer 2.0 Versioning",
    pattern: "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$",
    flags: "m",
    sampleText: "v1.2.3\n2.0.0-beta.1+exp.sha.5114f85\n0.0.1",
    description: "Validates semantic release versions with prerelease and build tags.",
  },
  {
    id: "uuid-v4",
    name: "UUID v4 Identifier",
    pattern: "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}",
    flags: "g",
    sampleText: "Session 123e4567-e89b-12d3-a456-426614174000 vs v4 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    description: "Matches compliant Version 4 universally unique identifiers.",
  },
  {
    id: "slug",
    name: "URL Kebab Slug",
    pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
    flags: "",
    sampleText: "nextjs-15-app-router-guide",
    description: "Validates clean URL-safe slugs with lowercase alphanumerics and hyphens.",
  },
  {
    id: "ipv4",
    name: "IPv4 Address",
    pattern: "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b",
    flags: "g",
    sampleText: "Gateway at 192.168.1.1 and public DNS 8.8.8.8 connected.",
    description: "Matches valid IPv4 addresses from 0.0.0.0 to 255.255.255.255.",
  },
  {
    id: "iso-date",
    name: "ISO 8601 Timestamp",
    pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?Z?",
    flags: "g",
    sampleText: "Event logged at 2026-10-08T12:00:00Z and updated 2026-10-08T12:30:15.123Z.",
    description: "Matches UTC ISO timestamps in standard datetime format.",
  },
];

export default function RegexCheatGenerator() {
  const [pattern, setPattern] = useState(REGEX_PRESETS[0].pattern);
  const [flags, setFlags] = useState(REGEX_PRESETS[0].flags);
  const [testString, setTestString] = useState(REGEX_PRESETS[0].sampleText);
  const [activeTab, setActiveTab] = useState<"tester" | "javascript" | "python" | "go">("tester");

  const [evaluation, setEvaluation] = useState<RegexEvaluation>(() =>
    safeExecuteRegex(REGEX_PRESETS[0].pattern, REGEX_PRESETS[0].flags, REGEX_PRESETS[0].sampleText)
  );

  const applyPreset = (preset: (typeof REGEX_PRESETS)[0]) => {
    setPattern(preset.pattern);
    setFlags(preset.flags);
    setTestString(preset.sampleText);
  };

  const toggleFlag = (flag: string) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ""));
    } else {
      setFlags(flags + flag);
    }
  };

  React.useEffect(() => {
    let canceled = false;
    safeExecuteRegexIsolated(pattern, flags, testString, { maxExecutionTimeMs: 250 })
      .then((res) => {
        if (!canceled) {
          setEvaluation(res);
        }
      })
      .catch((err) => {
        if (!canceled) {
          setEvaluation({
            isValid: false,
            regexError: err instanceof Error ? err.message : "Execution error",
            isRedosRisky: true,
            matches: [],
            executionTimeMs: 0,
            isTruncated: false,
          });
        }
      });

    return () => {
      canceled = true;
    };
  }, [pattern, flags, testString]);

  const { isValid, regexError, matches, redosWarning } = evaluation;

  const jsSnippet = useMemo(() => {
    return `// JavaScript / TypeScript Pattern Matcher
const regex = new RegExp(${JSON.stringify(pattern)}, ${JSON.stringify(flags)});
const text = ${JSON.stringify(testString)};

// Check match
const isMatch = regex.test(text);
console.log('Matches:', isMatch);

// Extract all matches
const matches = [...text.matchAll(new RegExp(regex, 'g'))];
for (const match of matches) {
  console.log('Found:', match[0], 'at index:', match.index);
}
`;
  }, [pattern, flags, testString]);

  const pythonSnippet = useMemo(() => {
    return `# Python re Pattern Matcher
import re

pattern = r"${pattern}"
text = """${testString}"""

# Find all matches
matches = re.finditer(pattern, text${flags.includes("i") ? ", re.IGNORECASE" : ""}${flags.includes("m") ? " | re.MULTILINE" : ""})
for match in matches:
    print(f"Found: {match.group(0)} at position: {match.start()}-{match.end()}")
`;
  }, [pattern, flags, testString]);

  const goSnippet = useMemo(() => {
    return `// Go regexp Pattern Matcher
package main

import (
\t"fmt"
\t"regexp"
)

func main() {
\tpattern := \`${pattern}\`
\ttext := \`${testString}\`

\tre := regexp.MustCompile(pattern)
\tmatches := re.FindAllStringIndex(text, -1)
\tfor _, loc := range matches {
\t\tfmt.Printf("Match: %s at %v\\n", text[loc[0]:loc[1]], loc)
\t}
}
`;
  }, [pattern, testString]);

  const handleDownload = () => {
    downloadFile(pattern, "regex-pattern.txt", "text/plain");
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Controls Column (Left) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Preset Selector */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Production Regex Presets
          </label>
          <div className="space-y-1.5">
            {REGEX_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className="w-full p-2.5 text-left rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {p.name}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400">/{p.flags || ""}/</span>
                </div>
                <div className="text-[11px] text-zinc-500 truncate mt-0.5">{p.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Regex Expression Builder */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-4 shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Pattern String
              </label>
              {isValid ? (
                <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Valid Pattern
                </span>
              ) : (
                <span className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Syntax Error
                </span>
              )}
            </div>
            <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500">
              <span className="text-zinc-400 font-mono text-xs select-none">/</span>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="flex-1 px-2 py-1 bg-transparent font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
              <span className="text-zinc-400 font-mono text-xs select-none">/{flags}</span>
            </div>
            {regexError && (
              <p className="text-[11px] text-rose-500 mt-1.5 font-mono">{regexError}</p>
            )}
            {redosWarning && !regexError && (
              <p className="text-[11px] text-amber-500 mt-1.5 font-mono">⚠️ {redosWarning}</p>
            )}
          </div>

          {/* Flags Toggles */}
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
              Modifier Flags
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { flag: "g", label: "g (Global)" },
                { flag: "i", label: "i (Case-insensitive)" },
                { flag: "m", label: "m (Multiline)" },
                { flag: "s", label: "s (dotAll)" },
              ].map(({ flag, label }) => (
                <button
                  key={flag}
                  type="button"
                  onClick={() => toggleFlag(flag)}
                  className={`py-1.5 px-2 text-[11px] font-mono rounded-lg border transition-colors ${
                    flags.includes(flag)
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-2xs font-semibold"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Test String Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Target Test String
            </label>
            <span className="text-[11px] text-zinc-400 font-mono">
              {testString.length} chars
            </span>
          </div>
          <textarea
            rows={5}
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Type or paste sample text here to test matching..."
            className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Output Column (Right) */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("tester")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "tester"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Live Matches ({matches.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("javascript")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "javascript"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              JavaScript
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("python")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "python"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Python
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("go")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "go"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Go
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton
              text={
                activeTab === "tester"
                  ? pattern
                  : activeTab === "javascript"
                  ? jsSnippet
                  : activeTab === "python"
                  ? pythonSnippet
                  : goSnippet
              }
              label="Copy"
              triggerConfetti
            />
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 shadow-2xs transition-colors active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5 overflow-hidden shadow-2xs flex flex-col">
          {activeTab === "tester" && (
            <div className="flex-1 flex flex-col space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-500 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <span>Matched Results</span>
                <span className="font-mono">
                  {matches.length} {matches.length === 1 ? "match" : "matches"} found
                </span>
              </div>

              {matches.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-400">
                  <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    No matches found in test string
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
                    Try adjusting the regular expression or enable flag modifiers like (i) or (g).
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px]">
                  {matches.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 font-mono text-xs flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          Match #{idx + 1}
                        </span>
                        <span>Index: {m.index}</span>
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold break-all border border-zinc-200 dark:border-zinc-800">
                        {m.match}
                      </div>
                      {m.groups.length > 0 && (
                        <div className="text-[10px] text-zinc-500 mt-1 space-y-0.5">
                          <span className="font-semibold block text-zinc-400">
                            Capture Groups:
                          </span>
                          {m.groups.map((g, gIdx) => (
                            <div key={gIdx} className="pl-2">
                              Group {gIdx + 1}: <span className="text-zinc-300 font-bold">{g}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "javascript" && (
            <pre className="flex-1 font-mono text-xs text-zinc-800 dark:text-zinc-200 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-200/60 dark:border-zinc-800/60 max-h-[550px] overflow-y-auto">
              {jsSnippet}
            </pre>
          )}

          {activeTab === "python" && (
            <pre className="flex-1 font-mono text-xs text-zinc-800 dark:text-zinc-200 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-200/60 dark:border-zinc-800/60 max-h-[550px] overflow-y-auto">
              {pythonSnippet}
            </pre>
          )}

          {activeTab === "go" && (
            <pre className="flex-1 font-mono text-xs text-zinc-800 dark:text-zinc-200 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-200/60 dark:border-zinc-800/60 max-h-[550px] overflow-y-auto">
              {goSnippet}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
