import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Mock the LLM invocation
vi.mock("../_core/llm", () => ({
  isLLMConfigured: vi.fn().mockReturnValue(true),
  invokeStructuredLLM: vi.fn().mockResolvedValue({
    overall: "The solution uses a hash map approach which is efficient.",
    correctness: { score: 9, feedback: "Correctly handles all edge cases." },
    timeComplexity: { notation: "O(n)", explanation: "Single pass through all files." },
    spaceComplexity: { notation: "O(n)", explanation: "Stores all file paths in the map." },
    styleIssues: [],
    improvements: ["Consider using type hints more explicitly."],
    optimizedApproach: "Hash map grouping by content is already optimal.",
  }),
}));

// Mock the database helpers
vi.mock("../db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../db")>();
  return {
    ...actual,
    getProblemBySlug: vi.fn().mockResolvedValue({
      id: 1,
      slug: "find-duplicate-file-in-system",
      title: "Find Duplicate File in System",
      difficulty: "Medium",
      description: "Given a list paths...",
      starterCode: "class Solution:\n    def findDuplicate(self, paths): pass",
      createdAt: new Date(),
    }),
    getTestCasesForProblem: vi.fn().mockResolvedValue([
      {
        id: 1,
        problemId: 1,
        description: "Basic case",
        inputData: JSON.stringify([["root/a 1.txt(abcd)", "root/c 3.txt(abcd)"]]),
        expectedOutput: JSON.stringify([["root/a/1.txt", "root/c/3.txt"]]),
        orderIndex: 0,
      },
    ]),
    listProblems: vi.fn().mockResolvedValue([
      { id: 1, slug: "find-duplicate-file-in-system", title: "Find Duplicate File in System", difficulty: "Medium", createdAt: new Date() },
    ]),
    getAcceptedProblemIds: vi.fn().mockResolvedValue([]),
  };
});

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("problems.list", () => {
  it("returns a list of problems", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.problems.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("slug");
    expect(result[0]).toHaveProperty("difficulty");
    expect(result[0]).toHaveProperty("solved");
  });
});

describe("problems.getBySlug", () => {
  it("returns problem with test cases", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.problems.getBySlug({ slug: "find-duplicate-file-in-system" });
    expect(result).not.toBeNull();
    expect(result?.title).toBe("Find Duplicate File in System");
    expect(result?.testCases).toHaveLength(1);
  });
});

describe("problems.analyzeCode", () => {
  it("returns structured AI analysis with all required fields", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.problems.analyzeCode({
      slug: "find-duplicate-file-in-system",
      code: `
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
      `.trim(),
    });
    expect(result).toHaveProperty("overall");
    expect(result).toHaveProperty("correctness");
    expect(result).toHaveProperty("timeComplexity");
    expect(result).toHaveProperty("spaceComplexity");
    expect(result).toHaveProperty("styleIssues");
    expect(result).toHaveProperty("improvements");
    expect(result).toHaveProperty("optimizedApproach");
    expect(result.correctness.score).toBeGreaterThanOrEqual(1);
    expect(result.correctness.score).toBeLessThanOrEqual(10);
  });
});

