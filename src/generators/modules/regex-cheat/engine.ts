/**
 * Regex Tester & Safe Evaluation Engine
 * Protects against ReDoS (Regular Expression Denial of Service) through
 * static pattern heuristics, string length constraints, and execution budgets.
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
 * Safely executes a regular expression against test input with time budget.
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

  // If pattern is risky and input string is long, reject early to protect browser thread
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

        // Avoid infinite loop on zero-length matches (e.g. /^/g)
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
 * Generates snippet for JavaScript / TypeScript
 */
export function generateJsRegexCode(pattern: string, flags: string): string {
  return `const regex = /${pattern}/${flags};
const matches = [...str.matchAll(regex)];
matches.forEach(m => console.log(m[0]));`;
}

/**
 * Generates snippet for Python re module
 */
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

/**
 * Generates snippet for Go regexp package
 */
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
