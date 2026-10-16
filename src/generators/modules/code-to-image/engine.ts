export type CodeTheme = "obsidian" | "zinc" | "monokai" | "clean-light";
export type BackdropStyle = "zinc-gradient" | "slate-gradient" | "dark-radial" | "pure-black" | "transparent";

export interface CodeSnapperConfig {
  code: string;
  language: string;
  title: string;
  theme: CodeTheme;
  backdrop: BackdropStyle;
  padding: number;
  fontSize: number;
  showLineNumbers: boolean;
  highlightedLinesInput: string;
}

export const THEME_CONFIGS: Record<
  CodeTheme,
  {
    bg: string;
    text: string;
    border: string;
    keyword: string;
    string: string;
    comment: string;
    number: string;
    func: string;
    titleBg: string;
  }
> = {
  obsidian: {
    bg: "#09090b",
    text: "#f4f4f5",
    border: "#27272a",
    keyword: "#a1a1aa",
    string: "#e4e4e7",
    comment: "#52525b",
    number: "#d4d4d8",
    func: "#fafafa",
    titleBg: "#18181b",
  },
  zinc: {
    bg: "#18181b",
    text: "#f4f4f5",
    border: "#27272a",
    keyword: "#cbd5e1",
    string: "#e2e8f0",
    comment: "#64748b",
    number: "#94a3b8",
    func: "#f8fafc",
    titleBg: "#27272a",
  },
  monokai: {
    bg: "#1e1f29",
    text: "#f8f8f2",
    border: "#383a4c",
    keyword: "#ff79c6",
    string: "#f1fa8c",
    comment: "#6272a4",
    number: "#bd93f9",
    func: "#50fa7b",
    titleBg: "#282a36",
  },
  "clean-light": {
    bg: "#ffffff",
    text: "#09090b",
    border: "#e4e4e7",
    keyword: "#0284c7",
    string: "#16a34a",
    comment: "#71717a",
    number: "#ea580c",
    func: "#9333ea",
    titleBg: "#f4f4f5",
  },
};

/**
 * Parses line numbers to highlight e.g. "2, 4-6" -> Set {2, 4, 5, 6}
 */
export function parseHighlightedLines(input: string): Set<number> {
  const set = new Set<number>();
  if (!input.trim()) return set;

  const parts = input.split(",");
  for (const p of parts) {
    const trimmed = p.trim();
    if (!trimmed) continue;
    if (trimmed.includes("-")) {
      const [startStr, endStr] = trimmed.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
          set.add(i);
        }
      }
    } else {
      const line = parseInt(trimmed, 10);
      if (!isNaN(line)) set.add(line);
    }
  }
  return set;
}

export function getDefaultCodeSnapperConfig(): CodeSnapperConfig {
  return {
    code: `import { NextRequest, NextResponse } from "next/server";\n\nexport async function GET(req: NextRequest) {\n  const token = req.headers.get("authorization");\n  if (!token) {\n    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });\n  }\n\n  return NextResponse.json({ status: "ok", timestamp: Date.now() });\n}`,
    language: "typescript",
    title: "route.ts",
    theme: "obsidian",
    backdrop: "zinc-gradient",
    padding: 48,
    fontSize: 13,
    showLineNumbers: true,
    highlightedLinesInput: "3, 5-7",
  };
}
