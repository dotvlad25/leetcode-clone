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

/**
 * Generates a human-readable Python unit test file for a given problem.
 * This is shown read-only in the editor so users can see exactly what runs.
 */
export function buildUnitTestCode(
  methodName: string,
  testCases: Array<{ description: string; inputData: string; expectedOutput: string; orderIndex: number }>,
  slug: string
): string {
  const isWebCrawler = methodName === "crawl";
  const isExclusiveTime = methodName === "exclusiveTime";

  const imports = isWebCrawler
    ? `import unittest
from typing import List
from collections import deque
import threading

# Simulated HtmlParser for testing
class HtmlParser:
    def __init__(self, graph: dict):
        self._graph = graph
    def getUrls(self, url: str) -> List[str]:
        return self._graph.get(url, [])
`
    : `import unittest
from typing import List
`;

  const className = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("")
    .replace(/\d+/g, "");

  const testMethods = testCases
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((tc, i) => {
      const inputParsed = JSON.parse(tc.inputData);
      const expectedParsed = JSON.parse(tc.expectedOutput);

      if (isWebCrawler) {
        const { urls, edges, startUrl } = inputParsed as {
          urls: string[];
          edges: [number, number][];
          startUrl: string;
        };
        const graphLines = urls.map((u: string) => `        "${u}": []`).join(",\n");
        const edgeLines = edges
          .map(([f, t]: [number, number]) => `        graph["${urls[f]}"].append("${urls[t]}")`)
          .join("\n");
        const expectedStr = JSON.stringify(expectedParsed);
        return `    def test_case_${i + 1}(self):
        """${tc.description}"""
        graph = {
${graphLines}
        }
${edgeLines}
        parser = HtmlParser(graph)
        result = self.solution.crawl("${startUrl}", parser)
        self.assertEqual(sorted(result), sorted(${expectedStr}))
`;
      }

      // Generic: spread list args
      const argsStr = Array.isArray(inputParsed)
        ? inputParsed.map((a: unknown) => JSON.stringify(a)).join(", ")
        : JSON.stringify(inputParsed);
      const expectedStr = JSON.stringify(expectedParsed);

      if (isExclusiveTime) {
        return `    def test_case_${i + 1}(self):
        """${tc.description}"""
        result = self.solution.${methodName}(${argsStr})
        self.assertEqual(result, ${expectedStr})
`;
      }

      // Default: order-independent list comparison
      return `    def test_case_${i + 1}(self):
        """${tc.description}"""
        result = self.solution.${methodName}(${argsStr})
        normalize = lambda v: sorted([sorted(x) if isinstance(x, list) else x for x in v]) if isinstance(v, list) else v
        self.assertEqual(normalize(result), normalize(${expectedStr}))
`;
    })
    .join("\n");

  return `${imports}
# ─── Your solution is imported below ──────────────────────────────────────────
# (The test runner injects your Solution class before running these tests)

class Test${className}(unittest.TestCase):
    def setUp(self):
        self.solution = Solution()

${testMethods}
if __name__ == "__main__":
    unittest.main()
`;
}

/**
 * Builds a Python script that runs the user's code against a single test case.
 * The test harness imports the user's Solution class and calls the method.
 */
export function buildTestScript(
  userCode: string,
  inputData: string,
  expectedOutput: string
): string {
  // inputData is a JSON string of arguments to pass to the solution method
  // expectedOutput is a JSON string of the expected return value
  return `
import json, sys, traceback

# ── User code ──────────────────────────────────────────────────────────────
${userCode}

# ── Test harness ───────────────────────────────────────────────────────────
try:
    input_data = json.loads(${JSON.stringify(inputData)})
    expected = json.loads(${JSON.stringify(expectedOutput)})
    sol = Solution()
    # input_data is a list of positional args
    if isinstance(input_data, list):
        result = sol.findDuplicate(*input_data)
    else:
        result = sol.findDuplicate(input_data)
    # Normalize: sort lists for comparison
    def normalize(v):
        if isinstance(v, list):
            return sorted([sorted(x) if isinstance(x, list) else x for x in v])
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
 * Generic test script builder that uses the method name from the test case.
 */
export function buildGenericTestScript(
  userCode: string,
  methodName: string,
  inputData: string,
  expectedOutput: string
): string {
  // LC1242: Web Crawler Multithreaded needs a simulated HtmlParser
  const isWebCrawler = methodName === "crawl";
  if (isWebCrawler) {
    return buildWebCrawlerTestScript(userCode, inputData, expectedOutput);
  }
  // LC636: exclusiveTime — result is a list of ints, order matters
  const isExclusiveTime = methodName === "exclusiveTime";
  return `
import json, sys, traceback

${userCode}

try:
    input_data = json.loads(${JSON.stringify(inputData)})
    expected = json.loads(${JSON.stringify(expectedOutput)})
    sol = Solution()
    if isinstance(input_data, list):
        result = getattr(sol, ${JSON.stringify(methodName)})(*input_data)
    else:
        result = getattr(sol, ${JSON.stringify(methodName)})(input_data)
    def normalize(v):
        if isinstance(v, list):
            ${isExclusiveTime ? "return v  # preserve order for exclusive time" : "return sorted([sorted(x) if isinstance(x, list) else x for x in v])"}
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
 * Builds a test script for LC1242 Web Crawler Multithreaded.
 * Simulates the HtmlParser interface using a graph defined in inputData.
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
        self._graph = graph  # dict: url -> [linked_urls]
    def getUrls(self, url: str) -> List[str]:
        return self._graph.get(url, [])

${userCode}

try:
    raw = json.loads(${JSON.stringify(inputData)})
    urls = raw["urls"]
    edges = raw["edges"]
    start_url = raw["startUrl"]
    # Build adjacency: edges[i] = [from_idx, to_idx]
    graph = {u: [] for u in urls}
    for from_idx, to_idx in edges:
        graph[urls[from_idx]].append(urls[to_idx])
    parser = HtmlParser(graph)
    sol = Solution()
    result = sol.crawl(start_url, parser)
    expected = json.loads(${JSON.stringify(expectedOutput)})
    # Order-independent comparison
    if sorted(result) == sorted(expected):
        print(json.dumps({"passed": True, "actual": result}))
    else:
        print(json.dumps({"passed": False, "actual": result, "expected": expected}))
except Exception as e:
    print(json.dumps({"passed": False, "actual": None, "error": traceback.format_exc()}))
`.trim();
}
