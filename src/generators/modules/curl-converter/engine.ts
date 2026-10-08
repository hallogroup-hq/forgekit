/**
 * cURL to Code Converter Engine
 * Pure deterministic parser for cURL CLI commands, converting them into
 * production-ready Fetch, Axios, Python Requests, and Go code snippets.
 */

export interface ParsedCurl {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
}

export function encodeBase64(str: string): string {
  if (typeof btoa === "function") {
    return btoa(unescape(encodeURIComponent(str)));
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf-8").toString("base64");
  }
  return "";
}

export function parseCurl(raw: string): ParsedCurl {
  const clean = raw.replace(/\\\r?\n/g, " ").trim();

  let method = "GET";
  let url = "https://api.example.com/v1/resource";
  const headers: Record<string, string> = {};
  let body: string | null = null;

  // Extract URL: prioritize explicit http/https URL
  const httpMatch = clean.match(/(?:'|")?(https?:\/\/[^\s'"]+)(?:'|")?/);
  if (httpMatch && httpMatch[1]) {
    url = httpMatch[1];
  } else {
    // Fallback: tokenize arguments avoiding known flag parameters
    const tokens = clean.split(/\s+/);
    for (let i = 1; i < tokens.length; i++) {
      const prev = tokens[i - 1];
      const tok = tokens[i].replace(/^['"]|['"]$/g, "");
      if (
        !tok.startsWith("-") &&
        !["-X", "--request", "-H", "--header", "-u", "-d", "--data", "--data-raw", "--data-binary"].includes(prev)
      ) {
        url = tok;
        break;
      }
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
      const b64 = encodeBase64(authVal);
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

export function generateFetchCode(parsed: ParsedCurl): string {
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
}

export function generateAxiosCode(parsed: ParsedCurl): string {
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
}

export function generatePythonRequestsCode(parsed: ParsedCurl): string {
  return `# Python (requests)
import requests
import json

url = "${parsed.url}"
headers = ${JSON.stringify(parsed.headers, null, 4)}
${parsed.body ? `payload = ${JSON.stringify(parsed.body)}` : "payload = None"}

response = requests.request("${parsed.method}", url, headers=headers, data=payload)
print(response.status_code)
print(response.json())`;
}

export function generateGoHttpCode(parsed: ParsedCurl): string {
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
}
