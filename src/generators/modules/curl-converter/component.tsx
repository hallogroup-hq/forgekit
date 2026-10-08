"use client";

import React, { useState, useMemo } from "react";
import { Download, Terminal, Code, Layers, FileCode } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

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

interface ParsedCurl {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  authHeader?: string;
}

function parseCurl(raw: string): ParsedCurl {
  const clean = raw.replace(/\\\n/g, " ").trim();

  let method = "GET";
  let url = "https://api.example.com/v1/resource";
  const headers: Record<string, string> = {};
  let body: string | null = null;

  // Extract URL
  const urlMatch = clean.match(/curl\s+(?:-[^\s]+\s+)*(?:'([^']+)'|"([^"]+)"|([^\s'"]+))/);
  if (urlMatch) {
    const rawUrl = urlMatch[1] || urlMatch[2] || urlMatch[3];
    if (rawUrl && !rawUrl.startsWith("-")) {
      url = rawUrl;
    }
  }

  // Extract Method
  const methodMatch = clean.match(/(?:-X|--request)\s+([A-Za-z]+)/);
  if (methodMatch) {
    method = methodMatch[1].toUpperCase();
  }

  // Extract Headers
  const headerRegex = /(?:-H|--header)\s+(?:'([^']+)'|"([^"]+)")/g;
  let hMatch: RegExpExecArray | null;
  while ((hMatch = headerRegex.exec(clean)) !== null) {
    const headerStr = hMatch[1] || hMatch[2];
    if (headerStr && headerStr.includes(":")) {
      const idx = headerStr.indexOf(":");
      const key = headerStr.slice(0, idx).trim();
      const val = headerStr.slice(idx + 1).trim();
      headers[key] = val;
    }
  }

  // Extract Basic Auth -u user:pass
  const authMatch = clean.match(/-u\s+(?:'([^']+)'|"([^"]+)"|([^\s]+))/);
  if (authMatch) {
    const authVal = authMatch[1] || authMatch[2] || authMatch[3];
    if (authVal) {
      const b64 = typeof window !== "undefined" ? btoa(authVal) : Buffer.from(authVal).toString("base64");
      headers["Authorization"] = `Basic ${b64}`;
    }
  }

  // Extract Body
  const dataRegex = /(?:-d|--data|--data-raw|--data-binary)\s+(?:'([\s\S]*?)'|"([\s\S]*?)")/g;
  const bodies: string[] = [];
  let dMatch: RegExpExecArray | null;
  while ((dMatch = dataRegex.exec(clean)) !== null) {
    const bStr = dMatch[1] ?? dMatch[2];
    if (bStr !== undefined) {
      bodies.push(bStr);
    }
  }

  if (bodies.length > 0) {
    body = bodies.join("&");
    if (method === "GET") {
      method = "POST";
    }
  }

  return { url, method, headers, body };
}

export default function CurlConverterGenerator() {
  const [curlInput, setCurlInput] = useState(PRESETS[0].command);
  const [targetLang, setTargetLang] = useState<"fetch" | "axios" | "python" | "go">("fetch");

  const parsed = useMemo(() => parseCurl(curlInput), [curlInput]);

  const fetchCode = useMemo(() => {
    const hasHeaders = Object.keys(parsed.headers).length > 0;
    const isJson = parsed.body && (parsed.body.trim().startsWith("{") || parsed.body.trim().startsWith("["));

    let options = `{\n  method: "${parsed.method}",\n`;
    if (hasHeaders) {
      options += `  headers: ${JSON.stringify(parsed.headers, null, 4).replace(/\n/g, "\n  ")},\n`;
    }
    if (parsed.body) {
      if (isJson) {
        options += `  body: JSON.stringify(${parsed.body.trim()}),\n`;
      } else {
        options += `  body: ${JSON.stringify(parsed.body)},\n`;
      }
    }
    options += `}`;

    return `// JavaScript / TypeScript (Native Fetch)
async function request() {
  const response = await fetch("${parsed.url}", ${options});
  
  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }
  
  const data = await response.json();
  console.log(data);
  return data;
}

request().catch(console.error);`;
  }, [parsed]);

  const axiosCode = useMemo(() => {
    const isJson = parsed.body && (parsed.body.trim().startsWith("{") || parsed.body.trim().startsWith("["));

    return `// Node.js / Browser (Axios)
import axios from "axios";

async function request() {
  const config = {
    method: "${parsed.method.toLowerCase()}",
    url: "${parsed.url}",
    headers: ${JSON.stringify(parsed.headers, null, 4).replace(/\n/g, "\n    ")},
    ${
      parsed.body
        ? isJson
          ? `data: ${parsed.body.trim()},`
          : `data: ${JSON.stringify(parsed.body)},`
        : ""
    }
  };

  const response = await axios(config);
  console.log(response.data);
  return response.data;
}

request().catch(console.error);`;
  }, [parsed]);

  const pythonCode = useMemo(() => {
    return `# Python (requests)
import requests
import json

url = "${parsed.url}"
headers = ${JSON.stringify(parsed.headers, null, 4)}
${parsed.body ? `payload = ${JSON.stringify(parsed.body)}` : "payload = None"}

response = requests.request("${parsed.method}", url, headers=headers, data=payload)
print(response.status_code)
print(response.json())`;
  }, [parsed]);

  const goCode = useMemo(() => {
    return `// Go (net/http)
package main

import (
\t"fmt"
\t"io"
\t"net/http"
\t"strings"
)

func main() {
\turl := "${parsed.url}"
\tmethod := "${parsed.method}"

\tvar payload io.Reader
\t${
    parsed.body
      ? `payload = strings.NewReader(${JSON.stringify(parsed.body)})`
      : `payload = nil`
  }

\tclient := &http.Client{}
\treq, err := http.NewRequest(method, url, payload)
\tif err != nil {
\t\tfmt.Println(err)
\t\treturn
\t}

\t${Object.entries(parsed.headers)
    .map(([k, v]) => `req.Header.Add("${k}", "${v}")`)
    .join("\n\t")}

\tres, err := client.Do(req)
\tif err != nil {
\t\tfmt.Println(err)
\t\treturn
\t}
\tdefer res.Body.Close()

\tbody, err := io.ReadAll(res.Body)
\tif err != nil {
\t\tfmt.Println(err)
\t\treturn
\t}
\tfmt.Println(string(body))
}`;
  }, [parsed]);

  const generatedCode = useMemo(() => {
    switch (targetLang) {
      case "fetch":
        return fetchCode;
      case "axios":
        return axiosCode;
      case "python":
        return pythonCode;
      case "go":
        return goCode;
    }
  }, [targetLang, fetchCode, axiosCode, pythonCode, goCode]);

  const handleDownload = () => {
    const extMap = {
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
            className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
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
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTargetLang("fetch")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                targetLang === "fetch"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              JS Fetch
            </button>
            <button
              type="button"
              onClick={() => setTargetLang("axios")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                targetLang === "axios"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Axios
            </button>
            <button
              type="button"
              onClick={() => setTargetLang("python")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                targetLang === "python"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Python (requests)
            </button>
            <button
              type="button"
              onClick={() => setTargetLang("go")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                targetLang === "go"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Go (net/http)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton text={generatedCode} label="Copy Code" triggerConfetti />
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

        {/* Code Viewer Container */}
        <div className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5 overflow-hidden shadow-2xs flex flex-col">
          <pre className="flex-1 font-mono text-xs text-zinc-800 dark:text-zinc-200 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-200/60 dark:border-zinc-800/60 max-h-[600px] overflow-y-auto selection:bg-blue-500/20">
            {generatedCode}
          </pre>
        </div>
      </div>
    </div>
  );
}
