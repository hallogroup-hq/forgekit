/**
 * Regex Tester & Safe Evaluation Engine
 * Protects against ReDoS (Regular Expression Denial of Service) through
 * static pattern heuristics, string length constraints, and isolated terminable worker threads.
 */

export interface RegexMatchResult {
  match: string;
  index: number;
  groups: string[];
}

export interface RegexEvaluation {
  isValid: boolean;
  regexError: string | null;
  isRedosRisky: boolean;
  redosWarning?: string;
  matches: RegexMatchResult[];
  executionTimeMs: number;
  isTruncated: boolean;
}

/**
 * Static heuristics to identify catastrophic backtracking constructs (ReDoS).
 * Identifies nested quantifiers such as (a+)+, (.*)*, (\\d+)*, etc.
 */
export function detectPotentialRedos(pattern: string): { isRisky: boolean; reason?: string } {
  // Pattern checks for nested repetition operators:
  // e.g. (...+)+, (...*)+, (...+)*, (...*)*, (...{n,m})+
  const nestedQuantifiers = [
    /\([^)]*[+*]\)[+*]/, // e.g. (a+)+ or (a*)*
    /\([^)]*[+*]\)\{\d+,?\d*\}/, // e.g. (a+){2,}
    /\([^)]*\{\d+,?\d*\}\)[+*]/, // e.g. (a{1,2})+
    /\([a-zA-Z0-9_\-\\s|]+[+*]\)[+*]/,
    /([a-zA-Z0-9_\-\\s|]+[+*])\1[+*]/,
  ];

  for (const regex of nestedQuantifiers) {
    if (regex.test(pattern)) {
      return {
        isRisky: true,
        reason: "Detected nested quantifier which may cause exponential catastrophic backtracking (ReDoS).",
      };
    }
  }

  // Check for overlapping alternations with repetitions e.g. (a|a)+
  if (/\(([^|]+)\|\1\)[+*]/.test(pattern)) {
    return {
      isRisky: true,
      reason: "Detected redundant alternation with quantifier causing branch ambiguity.",
    };
  }

  return { isRisky: false };
}

/**
 * Safely executes a regular expression against test input with time budget and truncation.
 */
export function safeExecuteRegex(
  pattern: string,
  flags: string,
  testString: string,
  options?: {
    maxMatches?: number;
    maxExecutionTimeMs?: number;
    maxInputLength?: number;
  }
): RegexEvaluation {
  const maxMatches = options?.maxMatches ?? 500;
  const maxExecutionTimeMs = options?.maxExecutionTimeMs ?? 200;
  const maxInputLength = options?.maxInputLength ?? 50000;

  if (!pattern) {
    return {
      isValid: true,
      regexError: null,
      isRedosRisky: false,
      matches: [],
      executionTimeMs: 0,
      isTruncated: false,
    };
  }

  // 1. Static ReDoS Check
  const redosCheck = detectPotentialRedos(pattern);

  // If pattern is risky and input string is long, reject early to protect thread
  if (redosCheck.isRisky && testString.length > 200) {
    return {
      isValid: false,
      regexError: `Blocked potentially catastrophic pattern: ${redosCheck.reason}`,
      isRedosRisky: true,
      redosWarning: redosCheck.reason,
      matches: [],
      executionTimeMs: 0,
      isTruncated: false,
    };
  }

  // 2. Length boundary
  const boundedText = testString.length > maxInputLength ? testString.slice(0, maxInputLength) : testString;

  // 3. Compile Regex
  let reg: RegExp;
  try {
    reg = new RegExp(pattern, flags);
  } catch (err: unknown) {
    return {
      isValid: false,
      regexError: err instanceof Error ? err.message : "Invalid regular expression",
      isRedosRisky: redosCheck.isRisky,
      redosWarning: redosCheck.reason,
      matches: [],
      executionTimeMs: 0,
      isTruncated: false,
    };
  }

  // 4. Time-budgeted evaluation
  const startTime = performance.now();
  const results: RegexMatchResult[] = [];
  let isTruncated = false;

  try {
    if (flags.includes("g")) {
      let match: RegExpExecArray | null;
      let loopCount = 0;

      while ((match = reg.exec(boundedText)) !== null) {
        loopCount++;
        const elapsed = performance.now() - startTime;
        if (elapsed > maxExecutionTimeMs) {
          return {
            isValid: true,
            regexError: `Evaluation timed out after ${Math.round(elapsed)}ms to prevent thread lock.`,
            isRedosRisky: true,
            redosWarning: "Execution took too long. Simplify repetitive groups.",
            matches: results,
            executionTimeMs: Math.round(elapsed),
            isTruncated: true,
          };
        }

        results.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1),
        });

        if (loopCount >= maxMatches) {
          isTruncated = true;
          break;
        }

        if (match[0].length === 0) {
          reg.lastIndex++;
        }
      }
    } else {
      const match = reg.exec(boundedText);
      if (match) {
        results.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1),
        });
      }
    }

    const duration = Math.round(performance.now() - startTime);

    return {
      isValid: true,
      regexError: null,
      isRedosRisky: redosCheck.isRisky,
      redosWarning: redosCheck.reason,
      matches: results,
      executionTimeMs: duration,
      isTruncated,
    };
  } catch (err: unknown) {
    return {
      isValid: false,
      regexError: err instanceof Error ? err.message : "Runtime execution error",
      isRedosRisky: redosCheck.isRisky,
      matches: results,
      executionTimeMs: Math.round(performance.now() - startTime),
      isTruncated,
    };
  }
}

/**
 * Isolated Worker Execution Engine
 * Evaluates regular expressions inside a dedicated, terminable worker thread
 * with hard termination on timeout (never blocks main thread or process).
 */
export async function safeExecuteRegexIsolated(
  pattern: string,
  flags: string,
  testString: string,
  options?: {
    maxExecutionTimeMs?: number;
    maxMatches?: number;
  }
): Promise<RegexEvaluation> {
  const timeoutMs = options?.maxExecutionTimeMs ?? 200;
  const maxMatches = options?.maxMatches ?? 500;
  const redosCheck = detectPotentialRedos(pattern);

  if (!pattern) {
    return {
      isValid: true,
      regexError: null,
      isRedosRisky: false,
      matches: [],
      executionTimeMs: 0,
      isTruncated: false,
    };
  }

  // Pre-validate regex syntax
  try {
    new RegExp(pattern, flags);
  } catch (err: unknown) {
    return {
      isValid: false,
      regexError: err instanceof Error ? err.message : "Invalid regular expression",
      isRedosRisky: redosCheck.isRisky,
      redosWarning: redosCheck.reason,
      matches: [],
      executionTimeMs: 0,
      isTruncated: false,
    };
  }

  const startTime = Date.now();

  // 1. Node.js Environment (worker_threads)
  if (typeof window === "undefined") {
    try {
      const { Worker } = await import("node:worker_threads");

      const workerScript = `
        const { parentPort, workerData } = require("node:worker_threads");
        try {
          const reg = new RegExp(workerData.pattern, workerData.flags);
          const results = [];
          let isTruncated = false;

          if (workerData.flags.includes("g")) {
            let match;
            let count = 0;
            while ((match = reg.exec(workerData.text)) !== null) {
              results.push({
                match: match[0],
                index: match.index,
                groups: match.slice(1),
              });
              count++;
              if (count >= workerData.maxMatches) {
                isTruncated = true;
                break;
              }
              if (match[0].length === 0) reg.lastIndex++;
            }
          } else {
            const match = reg.exec(workerData.text);
            if (match) {
              results.push({
                match: match[0],
                index: match.index,
                groups: match.slice(1),
              });
            }
          }
          parentPort.postMessage({ success: true, results, isTruncated });
        } catch (err) {
          parentPort.postMessage({ success: false, error: err.message });
        }
      `;

      return new Promise<RegexEvaluation>((resolve) => {
        let completed = false;
        const worker = new Worker(workerScript, {
          eval: true,
          workerData: { pattern, flags, text: testString, maxMatches },
        });

        const timer = setTimeout(async () => {
          if (!completed) {
            completed = true;
            try {
              await worker.terminate();
            } catch {
              // ignore
            }
            resolve({
              isValid: false,
              regexError: `Execution forcefully aborted: Hard timeout exceeded (${timeoutMs}ms) via worker termination.`,
              isRedosRisky: true,
              redosWarning: "Catastrophic backtracking exceeded hard timeout budget.",
              matches: [],
              executionTimeMs: timeoutMs,
              isTruncated: true,
            });
          }
        }, timeoutMs);

        worker.on("message", (msg) => {
          if (completed) return;
          completed = true;
          clearTimeout(timer);
          worker.terminate().catch(() => {});

          if (msg.success) {
            resolve({
              isValid: true,
              regexError: null,
              isRedosRisky: redosCheck.isRisky,
              redosWarning: redosCheck.reason,
              matches: msg.results,
              executionTimeMs: Date.now() - startTime,
              isTruncated: msg.isTruncated,
            });
          } else {
            resolve({
              isValid: false,
              regexError: msg.error,
              isRedosRisky: redosCheck.isRisky,
              matches: [],
              executionTimeMs: Date.now() - startTime,
              isTruncated: false,
            });
          }
        });

        worker.on("error", (err) => {
          if (completed) return;
          completed = true;
          clearTimeout(timer);
          worker.terminate().catch(() => {});
          resolve({
            isValid: false,
            regexError: err.message,
            isRedosRisky: redosCheck.isRisky,
            matches: [],
            executionTimeMs: Date.now() - startTime,
            isTruncated: false,
          });
        });
      });
    } catch {
      return {
        isValid: false,
        regexError: "Isolated worker execution unavailable in Node.js environment. Synchronous execution disabled for security.",
        isRedosRisky: redosCheck.isRisky,
        redosWarning: redosCheck.reason,
        matches: [],
        executionTimeMs: 0,
        isTruncated: false,
      };
    }
  }

  // 2. Browser Environment (Web Worker via Blob URL)
  if (typeof Worker !== "undefined") {
    try {
      const workerCode = `
        self.onmessage = function(e) {
          try {
            var data = e.data;
            var reg = new RegExp(data.pattern, data.flags);
            var results = [];
            var isTruncated = false;

            if (data.flags.indexOf("g") !== -1) {
              var match;
              var count = 0;
              while ((match = reg.exec(data.text)) !== null) {
                results.push({
                  match: match[0],
                  index: match.index,
                  groups: match.slice(1)
                });
                count++;
                if (count >= data.maxMatches) {
                  isTruncated = true;
                  break;
                }
                if (match[0].length === 0) reg.lastIndex++;
              }
            } else {
              var match = reg.exec(data.text);
              if (match) {
                results.push({
                  match: match[0],
                  index: match.index,
                  groups: match.slice(1)
                });
              }
            }
            self.postMessage({ success: true, results: results, isTruncated: isTruncated });
          } catch (err) {
            self.postMessage({ success: false, error: err.message });
          }
        };
      `;

      const blob = new Blob([workerCode], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      return new Promise<RegexEvaluation>((resolve) => {
        let completed = false;

        const timer = setTimeout(() => {
          if (!completed) {
            completed = true;
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            resolve({
              isValid: false,
              regexError: `Execution forcefully aborted: Hard timeout exceeded (${timeoutMs}ms) via web worker termination.`,
              isRedosRisky: true,
              redosWarning: "Catastrophic backtracking exceeded hard timeout budget.",
              matches: [],
              executionTimeMs: timeoutMs,
              isTruncated: true,
            });
          }
        }, timeoutMs);

        worker.onmessage = (event) => {
          if (completed) return;
          completed = true;
          clearTimeout(timer);
          worker.terminate();
          URL.revokeObjectURL(workerUrl);

          const msg = event.data;
          if (msg.success) {
            resolve({
              isValid: true,
              regexError: null,
              isRedosRisky: redosCheck.isRisky,
              redosWarning: redosCheck.reason,
              matches: msg.results,
              executionTimeMs: Date.now() - startTime,
              isTruncated: msg.isTruncated,
            });
          } else {
            resolve({
              isValid: false,
              regexError: msg.error,
              isRedosRisky: redosCheck.isRisky,
              matches: [],
              executionTimeMs: Date.now() - startTime,
              isTruncated: false,
            });
          }
        };

        worker.onerror = (err) => {
          if (completed) return;
          completed = true;
          clearTimeout(timer);
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          resolve({
            isValid: false,
            regexError: err.message,
            isRedosRisky: redosCheck.isRisky,
            matches: [],
            executionTimeMs: Date.now() - startTime,
            isTruncated: false,
          });
        };

        worker.postMessage({ pattern, flags, text: testString, maxMatches });
      });
    } catch {
      return {
        isValid: false,
        regexError: "Isolated Web Worker execution unavailable in browser environment. Synchronous execution disabled for security.",
        isRedosRisky: redosCheck.isRisky,
        redosWarning: redosCheck.reason,
        matches: [],
        executionTimeMs: 0,
        isTruncated: false,
      };
    }
  }

  // Security gate: Fail safely if isolated execution environments are unavailable
  return {
    isValid: false,
    regexError: "Isolated worker execution unavailable. Synchronous execution disabled for security.",
    isRedosRisky: redosCheck.isRisky,
    redosWarning: redosCheck.reason,
    matches: [],
    executionTimeMs: 0,
    isTruncated: false,
  };
}

export function generateJsRegexCode(pattern: string, flags: string): string {
  return `const regex = /${pattern}/${flags};
const matches = [...str.matchAll(regex)];
matches.forEach(m => console.log(m[0]));`;
}

export function generatePythonRegexCode(pattern: string, flags: string): string {
  const pyFlags = [];
  if (flags.includes("i")) pyFlags.push("re.IGNORECASE");
  if (flags.includes("m")) pyFlags.push("re.MULTILINE");
  if (flags.includes("s")) pyFlags.push("re.DOTALL");
  const flagStr = pyFlags.length > 0 ? `, ${pyFlags.join(" | ")}` : "";

  return `import re

pattern = r"${pattern}"
matches = re.finditer(pattern, text${flagStr})
for m in matches:
    print(m.group(0), "at index", m.start())`;
}

export function generateGoRegexCode(pattern: string): string {
  return `package main

import (
\t"fmt"
\t"regexp"
)

func main() {
\tre := regexp.MustCompile(\`${pattern}\`)
\tmatches := re.FindAllString(text, -1)
\tfmt.Println(matches)
}`;
}
