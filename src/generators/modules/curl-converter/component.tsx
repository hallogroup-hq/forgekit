"use client";

import React, { useState, useMemo } from "react";
import { Download, Terminal, Code, Layers, FileCode } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";
import {
  parseCurl,
  generateFetchCode,
  generateAxiosCode,
  generatePythonRequestsCode,
  generateGoHttpCode,
} from "./engine";

interface CurlPreset {
  id: string;
  name: string;
  command: string;
}

const PRESETS: CurlPreset[] = [
  {
    id: "openai",
    name: "OpenAI Chat Completion",
    command: `curl https://api.openai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-antigravity-test-token" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "Explain quantum computing in 2 sentences."}
    ],
    "temperature": 0.7
  }'`,
  },
  {
    id: "stripe",
    name: "Stripe Create Customer",
    command: `curl https://api.stripe.com/v1/customers \\
  -u sk_test_51Mzxyz1234567890: \\
  -d "name=Alex Rivera" \\
  -d "email=alex.rivera@example.com"`,
  },
  {
    id: "github",
    name: "GitHub Create Issue",
    command: `curl -X POST https://api.github.com/repos/octocat/Hello-World/issues \\
  -H "Accept: application/vnd.github+json" \\
  -H "Authorization: Bearer ghp_yourPersonalAccessTokenHere" \\
  -H "X-GitHub-Api-Version: 2022-11-28" \\
  -d '{"title":"Found a bug","body":"I am having a problem with this.","labels":["bug"]}'`,
  },
];

type TargetLanguage = "fetch" | "axios" | "python" | "go";

export default function CurlConverterGenerator() {
  const [curlInput, setCurlInput] = useState(PRESETS[0].command);
  const [targetLang, setTargetLang] = useState<TargetLanguage>("fetch");

  const parsed = useMemo(() => parseCurl(curlInput), [curlInput]);

  const generatedCode = useMemo(() => {
    switch (targetLang) {
      case "fetch":
        return generateFetchCode(parsed);
      case "axios":
        return generateAxiosCode(parsed);
      case "python":
        return generatePythonRequestsCode(parsed);
      case "go":
        return generateGoHttpCode(parsed);
    }
  }, [targetLang, parsed]);

  const handleDownload = () => {
    const extMap: Record<TargetLanguage, string> = {
      fetch: "ts",
      axios: "ts",
      python: "py",
      go: "go",
    };
    downloadFile(generatedCode, `request.${extMap[targetLang]}`, "text/plain");
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Input Column (Left) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Preset Selector */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Sample cURL Presets
          </label>
          <div className="space-y-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setCurlInput(p.command);
                  confetti({ particleCount: 15, spread: 40, origin: { y: 0.8 } });
                }}
                className="w-full p-2.5 text-left rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer group"
              >
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {p.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* cURL Command Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-blue-500" />
              Raw cURL Command
            </label>
            <span className="text-[11px] text-zinc-400 font-mono">
              Paste from Chrome / Postman
            </span>
          </div>
          <textarea
            rows={12}
            value={curlInput}
            onChange={(e) => setCurlInput(e.target.value)}
            placeholder={"curl -X POST https://api.example.com/data -H 'Content-Type: application/json' -d '{\"key\":\"val\"}'"}
            className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
          />
        </div>

        {/* Parsed Summary Card */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-xs space-y-2">
          <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Detected Specifications
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div>
              <span className="text-zinc-500">Method: </span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{parsed.method}</span>
            </div>
            <div>
              <span className="text-zinc-500">Headers: </span>
              <span className="font-bold">{Object.keys(parsed.headers).length}</span>
            </div>
            <div className="col-span-2 truncate">
              <span className="text-zinc-500">Target URL: </span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{parsed.url}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Output Column (Right) */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-1">
            {[
              { id: "fetch", label: "Fetch (TS)", icon: Code },
              { id: "axios", label: "Axios", icon: Layers },
              { id: "python", label: "Python (requests)", icon: FileCode },
              { id: "go", label: "Go (net/http)", icon: Terminal },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = targetLang === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTargetLang(tab.id as TargetLanguage)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <CopyButton
              text={generatedCode}
              label="Copy Code"
              variant="secondary"
              size="sm"
              triggerConfetti
            />
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
              title="Download File"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Code Block Container */}
        <div className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden flex flex-col shadow-2xs min-h-[380px]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/60 text-xs font-mono text-zinc-400">
            <span>request.{targetLang === "python" ? "py" : targetLang === "go" ? "go" : "ts"}</span>
            <span className="text-[10px] uppercase text-zinc-500 font-sans font-semibold">
              Ready to execute
            </span>
          </div>

          <pre className="p-4 flex-1 text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre leading-relaxed max-h-[500px]">
            {generatedCode}
          </pre>
        </div>
      </div>
    </div>
  );
}
