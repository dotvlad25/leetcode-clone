import { spawn } from "child_process";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

/**
 * Executes arbitrary Python code in a sandboxed child process.
 * Enforces a 10-second timeout to prevent infinite loops.
 */
export async function executePython(code: string): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const proc = spawn("python3", ["-c", code], {
      timeout: 10000,
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    proc.stdout.on("data", (data: Buffer) => { stdout += data.toString(); });
    proc.stderr.on("data", (data: Buffer) => { stderr += data.toString(); });

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGKILL");
    }, 10000);

    proc.on("close", (exitCode) => {
      clearTimeout(timer);
      resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: exitCode ?? 1, timedOut });
    });
  });
}

export interface TestCaseResult {
  id: number;
  description: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
  stdout?: string;
  stderr?: string;
}

// ── Method-type helpers ────────────────────────────────────────────────────────
const isWebCrawler   = (m: string) => m === "crawl";
const isOpsReplay    = (m: string) => m === "lru_cache" || m === "file_system";
const isOrderedList  = (m: string) => m === "exclusiveTime";
// everything else: order-independent list or scalar

function opsReplayClassName(methodName: string): string {
  return methodName === "lru_cache" ? "LRUCache" : "FileSystem";
}

// ── Unit-test code generator (shown read-only in the editor) ──────────────────
export function buildUnitTestCode(
  methodName: string,
  testCases: Array<{ description: string; inputData: string; expectedOutput: string; orderIndex: number }>,
  slug: string
): string {
  const crawl   = isWebCrawler(methodName);
  const replay  = isOpsReplay(methodName);
  const ordered = isOrderedList(methodName);

  const imports = crawl
    ? `import unittest\nfrom typing import List\nfrom collections import deque\nimport threading\n\n# Simulated HtmlParser for testing\nclass HtmlParser:\n    def __init__(self, graph: dict):\n        self._graph = graph\n    def getUrls(self, url: str) -> List[str]:\n        return self._graph.get(url, [])\n`
    : `import unittest\nfrom typing import List\n`;

  const slugClass = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("")
    .replace(/\d+/g, "");

  const testMethods = testCases
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((tc, i) => {
      const inp = JSON.parse(tc.inputData);
      const exp = JSON.parse(tc.expectedOutput);

      // ── Web crawler ──────────────────────────────────────────────────────────
      if (crawl) {
        const { urls, edges, startUrl } = inp as { urls: string[]; edges: [number, number][]; startUrl: string };
        const graphLines = urls.map((u: string) => `        "${u}": []`).join(",\n");
        const edgeLines  = edges.map(([f, t]: [number, number]) => `        graph["${urls[f]}"].append("${urls[t]}")`).join("\n");
        return `    def test_case_${i + 1}(self):
        """${tc.description}"""
        graph = {\n${graphLines}\n        }\n${edgeLines}
        parser = HtmlParser(graph)
        result = self.solution.crawl("${startUrl}", parser)
        self.assertEqual(sorted(result), sorted(${JSON.stringify(exp)}))
`;
      }

      // ── Ops-replay (LRU Cache / FileSystem) ──────────────────────────────────
      if (replay) {
        const { ops, args } = inp as { ops: string[]; args: unknown[][] };
        const cn = opsReplayClassName(methodName);
        const lines: string[] = [
          `    def test_case_${i + 1}(self):`,
          `        """${tc.description}"""`,
          `        results = []`,
        ];
        for (let j = 0; j < ops.length; j++) {
          const op     = ops[j];
          const opArgs = (args[j] as unknown[]).map((a) => JSON.stringify(a)).join(", ");
          if (op === cn) {
            lines.push(`        obj = ${cn}(${opArgs})`);
            lines.push(`        results.append(None)`);
          } else {
            lines.push(`        results.append(obj.${op}(${opArgs}))`);
          }
        }
        lines.push(`        self.assertEqual(results, ${JSON.stringify(exp)})`);
        return lines.join("\n") + "\n";
      }

      // ── Ordered list (exclusiveTime) ─────────────────────────────────────────
      const argsStr = Array.isArray(inp)
        ? inp.map((a: unknown) => JSON.stringify(a)).join(", ")
        : JSON.stringify(inp);

      if (ordered) {
        return `    def test_case_${i + 1}(self):
        """${tc.description}"""
        result = self.solution.${methodName}(${argsStr})
        self.assertEqual(result, ${JSON.stringify(exp)})
`;
      }

      // ── Default: scalar or order-independent list ─────────────────────────────
      // For dict inputs (e.g. LC1752 { nums: [...] }) unpack as kwargs
      const callExpr = Array.isArray(inp)
        ? `self.solution.${methodName}(${argsStr})`
        : `self.solution.${methodName}(**${JSON.stringify(inp)})`;

      return `    def test_case_${i + 1}(self):
        """${tc.description}"""
        result = ${callExpr}
        normalize = lambda v: sorted([sorted(x) if isinstance(x, list) else x for x in v]) if isinstance(v, list) else v
        self.assertEqual(normalize(result), normalize(${JSON.stringify(exp)}))
`;
    })
    .join("\n");

  const setUpBlock = replay
    ? ``
    : `    def setUp(self):\n        self.solution = Solution()\n`;

  return `${imports}
# ─── Your solution is imported below ──────────────────────────────────────────
# (The test runner injects your Solution class before running these tests)

class Test${slugClass}(unittest.TestCase):
${setUpBlock}
${testMethods}
if __name__ == "__main__":
    unittest.main()
`;
}

// ── Per-test-case script builders ──────────────────────────────────────────────

/**
 * Dispatches to the correct test script builder based on methodName.
 */
export function buildGenericTestScript(
  userCode: string,
  methodName: string,
  inputData: string,
  expectedOutput: string
): string {
  if (isWebCrawler(methodName)) return buildWebCrawlerTestScript(userCode, inputData, expectedOutput);
  if (isOpsReplay(methodName))  return buildOpsReplayTestScript(userCode, methodName, inputData, expectedOutput);
  return buildSimpleTestScript(userCode, methodName, inputData, expectedOutput);
}

/**
 * Simple test script: single method call, scalar or list result.
 * Handles list inputs (spread as positional args) and dict inputs (spread as kwargs).
 */
function buildSimpleTestScript(
  userCode: string,
  methodName: string,
  inputData: string,
  expectedOutput: string
): string {
  const ordered = isOrderedList(methodName);
  return `
import json, sys, traceback

${userCode}

try:
    input_data = json.loads(${JSON.stringify(inputData)})
    expected = json.loads(${JSON.stringify(expectedOutput)})
    sol = Solution()
    if isinstance(input_data, list):
        result = getattr(sol, ${JSON.stringify(methodName)})(*input_data)
    elif isinstance(input_data, dict):
        result = getattr(sol, ${JSON.stringify(methodName)})(**input_data)
    else:
        result = getattr(sol, ${JSON.stringify(methodName)})(input_data)
    def normalize(v):
        if isinstance(v, list):
            ${ordered ? "return v  # preserve order" : "return sorted([sorted(x) if isinstance(x, list) else x for x in v])"}
        return v
    actual_norm = normalize(result)
    expected_norm = normalize(expected)
    if actual_norm == expected_norm:
        print(json.dumps({"passed": True, "actual": result}))
    else:
        print(json.dumps({"passed": False, "actual": result, "expected": expected}))
except Exception as e:
    print(json.dumps({"passed": False, "actual": None, "error": traceback.format_exc()}))
`.trim();
}

/**
 * Ops-replay test script for LRU Cache and FileSystem.
 * inputData format: { ops: string[], args: any[][] }
 */
export function buildOpsReplayTestScript(
  userCode: string,
  methodName: string,
  inputData: string,
  expectedOutput: string
): string {
  const cn = opsReplayClassName(methodName);
  return `
import json, sys, traceback

${userCode}

try:
    raw = json.loads(${JSON.stringify(inputData)})
    ops = raw["ops"]
    args = raw["args"]
    expected = json.loads(${JSON.stringify(expectedOutput)})
    obj = None
    results = []
    for op, op_args in zip(ops, args):
        if op == "${cn}":
            obj = ${cn}(*op_args)
            results.append(None)
        else:
            results.append(getattr(obj, op)(*op_args))
    if results == expected:
        print(json.dumps({"passed": True, "actual": results}))
    else:
        print(json.dumps({"passed": False, "actual": results, "expected": expected}))
except Exception as e:
    print(json.dumps({"passed": False, "actual": None, "error": traceback.format_exc()}))
`.trim();
}

/**
 * Web crawler test script — simulates HtmlParser.
 * inputData format: { urls: string[], edges: [from_idx, to_idx][], startUrl: string }
 */
export function buildWebCrawlerTestScript(
  userCode: string,
  inputData: string,
  expectedOutput: string
): string {
  return `
import json, sys, traceback
from typing import List
from collections import deque
import threading

class HtmlParser:
    def __init__(self, graph):
        self._graph = graph
    def getUrls(self, url: str) -> List[str]:
        return self._graph.get(url, [])

${userCode}

try:
    raw = json.loads(${JSON.stringify(inputData)})
    urls = raw["urls"]
    edges = raw["edges"]
    start_url = raw["startUrl"]
    graph = {u: [] for u in urls}
    for from_idx, to_idx in edges:
        graph[urls[from_idx]].append(urls[to_idx])
    parser = HtmlParser(graph)
    sol = Solution()
    result = sol.crawl(start_url, parser)
    expected = json.loads(${JSON.stringify(expectedOutput)})
    if sorted(result) == sorted(expected):
        print(json.dumps({"passed": True, "actual": result}))
    else:
        print(json.dumps({"passed": False, "actual": result, "expected": expected}))
except Exception as e:
    print(json.dumps({"passed": False, "actual": None, "error": traceback.format_exc()}))
`.trim();
}

/**
 * Staged problem test script builder.
 * For staged problems, userCode is just the implementation class.
 * baseClass is the abstract base that is prepended.
 * Each test case is a standalone Python snippet that prints a result.
 */
export function buildStagedTestScript(
  baseClass: string,
  userCode: string,
  inputData: string,
  expectedOutput: string
): string {
  return `
import json, sys, traceback

${baseClass}

${userCode}

try:
    input_lines = ${JSON.stringify(inputData)}
    expected_raw = ${JSON.stringify(expectedOutput)}
    expected = expected_raw.strip()
    # Execute the input as a script and capture stdout
    import io
    from contextlib import redirect_stdout
    buf = io.StringIO()
    with redirect_stdout(buf):
        exec(input_lines, globals())
    actual = buf.getvalue().strip()
    if actual == expected:
        print(json.dumps({"passed": True, "actual": actual}))
    else:
        print(json.dumps({"passed": False, "actual": actual, "expected": expected}))
except Exception as e:
    print(json.dumps({"passed": False, "actual": None, "error": traceback.format_exc()}))
`.trim();
}

// Legacy: kept for backward compatibility with any direct callers
export function buildTestScript(
  userCode: string,
  inputData: string,
  expectedOutput: string
): string {
  return buildSimpleTestScript(userCode, "findDuplicate", inputData, expectedOutput);
}
