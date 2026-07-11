import { describe, it, expect } from "vitest";
import { executePython, buildGenericTestScript } from "./executor";

describe("executePython", () => {
  it("executes simple Python and returns stdout", async () => {
    const result = await executePython(`print("hello world")`);
    expect(result.stdout).toBe("hello world");
    expect(result.exitCode).toBe(0);
    expect(result.timedOut).toBe(false);
  });

  it("captures stderr for syntax errors", async () => {
    const result = await executePython(`def foo(`);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toBeTruthy();
  });

  it("handles runtime exceptions gracefully", async () => {
    const result = await executePython(`raise ValueError("test error")`);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("ValueError");
  });

  it("returns correct output for a simple computation", async () => {
    const result = await executePython(`print(2 + 2)`);
    expect(result.stdout).toBe("4");
    expect(result.exitCode).toBe(0);
  });
});

describe("buildGenericTestScript", () => {
  it("generates a script that passes for a correct LC609 solution", async () => {
    const userCode = `
from typing import List
from collections import defaultdict

class Solution:
    def findDuplicate(self, paths: List[str]) -> List[List[str]]:
        content_map = defaultdict(list)
        for path_str in paths:
            parts = path_str.split(" ")
            directory = parts[0]
            for file_info in parts[1:]:
                fname, content = file_info.split("(")
                content = content.rstrip(")")
                content_map[content].append(f"{directory}/{fname}")
        return [group for group in content_map.values() if len(group) > 1]
`.trim();

    const inputData = JSON.stringify([["root/a 1.txt(abcd) 2.txt(efgh)", "root/c 3.txt(abcd)", "root/c/d 4.txt(efgh)", "root 4.txt(efgh)"]]);
    const expectedOutput = JSON.stringify([["root/a/2.txt","root/c/d/4.txt","root/4.txt"],["root/a/1.txt","root/c/3.txt"]]);

    const script = buildGenericTestScript(userCode, "findDuplicate", inputData, expectedOutput);
    const result = await executePython(script);
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.passed).toBe(true);
  });

  it("generates a script that fails for an incorrect solution", async () => {
    const userCode = `
from typing import List
class Solution:
    def findDuplicate(self, paths: List[str]) -> List[List[str]]:
        return []
`.trim();

    const inputData = JSON.stringify([["root/a 1.txt(abcd)", "root/c 3.txt(abcd)"]]);
    const expectedOutput = JSON.stringify([["root/a/1.txt","root/c/3.txt"]]);

    const script = buildGenericTestScript(userCode, "findDuplicate", inputData, expectedOutput);
    const result = await executePython(script);
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.passed).toBe(false);
  });

  it("generates a script that passes for empty input (no duplicates)", async () => {
    const userCode = `
from typing import List
from collections import defaultdict
class Solution:
    def findDuplicate(self, paths: List[str]) -> List[List[str]]:
        content_map = defaultdict(list)
        for path_str in paths:
            parts = path_str.split(" ")
            directory = parts[0]
            for file_info in parts[1:]:
                fname, content = file_info.split("(")
                content = content.rstrip(")")
                content_map[content].append(f"{directory}/{fname}")
        return [group for group in content_map.values() if len(group) > 1]
`.trim();

    const inputData = JSON.stringify([["root/a 1.txt(abcd)", "root/c 3.txt(efgh)"]]);
    const expectedOutput = JSON.stringify([]);

    const script = buildGenericTestScript(userCode, "findDuplicate", inputData, expectedOutput);
    const result = await executePython(script);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.passed).toBe(true);
  });
});
