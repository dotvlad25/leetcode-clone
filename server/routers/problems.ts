import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import {
  listProblems,
  getProblemBySlug,
  getTestCasesForProblem,
  createSubmission,
  getSubmissionsForUser,
  getAcceptedProblemIds,
  getStagesForProblem,
  getTestCasesForStage,
  getCumulativeTestCasesForStage,
} from "../db";
import {
  createStageSubmission,
  getStageProgress,
  getHighestUnlockedStage,
  getStageSubmissionsForUser,
  getBulkStageProgress,
} from "../db";
import { getAcceptedCodePerStage } from "../db";
import { executePython, buildGenericTestScript, buildUnitTestCode, buildStagedTestScript, TestCaseResult } from "../executor";
import { invokeLLM } from "../_core/llm";

// ── Stderr formatter ─────────────────────────────────────────────────────────
// User print() calls are redirected to stderr by the test harness.
// Python tracebacks start with "Traceback" or "  File " — everything else is
// user print output. We split them so the terminal shows a clear label.
function formatStderrForTerminal(stderr: string, caseLabel: string): string[] {
  if (!stderr || !stderr.trim()) return [];
  const lines = stderr.trim().split("\n");
  // Heuristic: if any line looks like a Python traceback, treat the whole block as an error
  const isTraceback = lines.some(l =>
    l.startsWith("Traceback") || l.startsWith("  File ") || /^[A-Za-z]+Error:/.test(l)
  );
  if (isTraceback) {
    return [`--- error (${caseLabel}) ---`, stderr.trim()];
  }
  // Otherwise it's user print() output
  return [`📤 print output (${caseLabel}):`, ...lines.map(l => `   ${l}`)];
}

export const problemsRouter = router({
  // List all problems (with optional solved status for authenticated users)
  list: publicProcedure.query(async ({ ctx }) => {
    const allProblems = await listProblems();
    let acceptedIds: number[] = [];
    let stageProgressMap = new Map<number, { completedStages: number[]; totalStages: number }>();
    if (ctx.user) {
      acceptedIds = await getAcceptedProblemIds(ctx.user.id);
      const stagedProblemIds = allProblems.filter(p => p.isStaged).map(p => p.id);
      if (stagedProblemIds.length > 0) {
        stageProgressMap = await getBulkStageProgress(ctx.user.id, stagedProblemIds);
      }
    }
    return allProblems.map((p) => ({
      ...p,
      solved: acceptedIds.includes(p.id),
      stageProgress: p.isStaged ? (stageProgressMap.get(p.id) ?? null) : null,
    }));
  }),

  // Get a single problem with its test cases
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const problem = await getProblemBySlug(input.slug);
      if (!problem) return null;
      const cases = await getTestCasesForProblem(problem.id);
      const methodName = (problem as any).methodName || "solve";
      const unitTestCode = buildUnitTestCode(
        methodName,
        cases.map((c) => ({
          description: c.description,
          inputData: c.inputData,
          expectedOutput: c.expectedOutput,
          orderIndex: c.orderIndex,
        })),
        problem.slug
      );
      // For staged problems, also load stages
      let stages = null;
      if (problem.isStaged) {
        stages = await getStagesForProblem(problem.id);
      }
      // For staged problems, also compute the highest unlocked stage for the current user
      let highestUnlockedStage = 1;
      let stageProgress = null;
      if (problem.isStaged && stages) {
        // We don't have ctx.user here (publicProcedure), so we accept it optionally via input
        // The unlock state is re-fetched in the detail page via a separate query
        highestUnlockedStage = 1; // default: stage 1 always unlocked
      }
      return { ...problem, testCases: cases, unitTestCode, stages, highestUnlockedStage, stageProgress };
    }),

  // Get unlock status for the current user on a staged problem
  getStageUnlockStatus: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const problem = await getProblemBySlug(input.slug);
      if (!problem || !problem.isStaged) return { highestUnlockedStage: 1, stageProgress: null };
      const [highestUnlocked, progress] = await Promise.all([
        getHighestUnlockedStage(ctx.user.id, problem.id),
        getStageProgress(ctx.user.id, problem.id),
      ]);
      const acceptedCodePerStage = await getAcceptedCodePerStage(ctx.user.id, problem.id);
      return { highestUnlockedStage: highestUnlocked, stageProgress: progress, acceptedCodePerStage };
    }),

  // Run code against all test cases (does not save submission)
  runTests: publicProcedure
    .input(z.object({
      slug: z.string(),
      code: z.string().max(50000),
    }))
    .mutation(async ({ input }) => {
      const problem = await getProblemBySlug(input.slug);
      if (!problem) throw new Error("Problem not found");
      const cases = await getTestCasesForProblem(problem.id);
      const methodName = (problem as any).methodName || "solve";

      const results: TestCaseResult[] = [];
      const terminalLines: string[] = [];

      for (const tc of cases) {
        const script = buildGenericTestScript(
          input.code,
          methodName,
          tc.inputData,
          tc.expectedOutput
        );
        const exec = await executePython(script);
        terminalLines.push(...formatStderrForTerminal(exec.stderr, `case ${tc.orderIndex + 1}`));
        if (exec.timedOut) {
          results.push({ id: tc.id, description: tc.description, passed: false, expected: tc.expectedOutput, actual: "", error: "Time Limit Exceeded (10s)", stdout: "", stderr: "TLE" });
          terminalLines.push(`❌ Case ${tc.orderIndex + 1}: ${tc.description} — Time Limit Exceeded`);
          continue;
        }
        try {
          const parsed = JSON.parse(exec.stdout || "{}");
          const r: TestCaseResult = {
            id: tc.id,
            description: tc.description,
            passed: parsed.passed === true,
            expected: tc.expectedOutput,
            actual: parsed.actual !== undefined ? JSON.stringify(parsed.actual) : exec.stdout,
            error: parsed.error,
            stdout: exec.stdout,
            stderr: exec.stderr,
          };
          results.push(r);
          const icon = r.passed ? "✅" : "❌";
          terminalLines.push(`${icon} Case ${tc.orderIndex + 1}: ${tc.description}`);
          if (!r.passed) {
            terminalLines.push(`   Expected: ${tc.expectedOutput}`);
            terminalLines.push(`   Got:      ${r.actual}`);
            if (r.error) terminalLines.push(`   Error:\n${r.error.split("\n").map(l => "   " + l).join("\n")}`);
          }
        } catch {
          const r: TestCaseResult = {
            id: tc.id,
            description: tc.description,
            passed: false,
            expected: tc.expectedOutput,
            actual: exec.stdout,
            error: exec.stderr || "Failed to parse output",
            stdout: exec.stdout,
            stderr: exec.stderr,
          };
          results.push(r);
          terminalLines.push(`❌ Case ${tc.orderIndex + 1}: ${tc.description}`);
          // Show raw stdout if it contains useful info (e.g. print() calls)
          if (exec.stdout && exec.stdout.trim()) {
            terminalLines.push(`   stdout: ${exec.stdout.trim()}`);
          }
          terminalLines.push(`   ${exec.stderr?.trim() || "Failed to parse output"}`);
        }
      }
      const passed = results.filter((r) => r.passed).length;
      const total = results.length;
      const summary = passed === total
        ? `\n✅ All ${total} test cases passed!`
        : `\n❌ ${passed}/${total} test cases passed`;
      return { results, terminalOutput: terminalLines.join("\n") + summary };
    }),

  // Submit code — runs tests and saves submission
  submit: protectedProcedure
    .input(z.object({
      slug: z.string(),
      code: z.string().max(50000),
    }))
    .mutation(async ({ input, ctx }) => {
      const problem = await getProblemBySlug(input.slug);
      if (!problem) throw new Error("Problem not found");
      const cases = await getTestCasesForProblem(problem.id);
      const methodName = (problem as any).methodName || "solve";

      const results: TestCaseResult[] = [];
      const terminalLines: string[] = [];

      for (const tc of cases) {
        const script = buildGenericTestScript(
          input.code,
          methodName,
          tc.inputData,
          tc.expectedOutput
        );
        const exec = await executePython(script);
        terminalLines.push(...formatStderrForTerminal(exec.stderr, `case ${tc.orderIndex + 1}`));
        if (exec.timedOut) {
          results.push({ id: tc.id, description: tc.description, passed: false, expected: tc.expectedOutput, actual: "", error: "Time Limit Exceeded (10s)", stdout: "", stderr: "TLE" });
          terminalLines.push(`❌ Case ${tc.orderIndex + 1}: ${tc.description} — Time Limit Exceeded`);
          continue;
        }
        try {
          const parsed = JSON.parse(exec.stdout || "{}");
          const r: TestCaseResult = {
            id: tc.id,
            description: tc.description,
            passed: parsed.passed === true,
            expected: tc.expectedOutput,
            actual: parsed.actual !== undefined ? JSON.stringify(parsed.actual) : exec.stdout,
            error: parsed.error,
            stdout: exec.stdout,
            stderr: exec.stderr,
          };
          results.push(r);
          const icon = r.passed ? "✅" : "❌";
          terminalLines.push(`${icon} Case ${tc.orderIndex + 1}: ${tc.description}`);
          if (!r.passed) {
            terminalLines.push(`   Expected: ${tc.expectedOutput}`);
            terminalLines.push(`   Got:      ${r.actual}`);
            if (r.error) terminalLines.push(`   Error:\n${r.error.split("\n").map(l => "   " + l).join("\n")}`);
          }
        } catch {
          const r: TestCaseResult = {
            id: tc.id,
            description: tc.description,
            passed: false,
            expected: tc.expectedOutput,
            actual: exec.stdout,
            error: exec.stderr || "Failed to parse output",
            stdout: exec.stdout,
            stderr: exec.stderr,
          };
          results.push(r);
          terminalLines.push(`❌ Case ${tc.orderIndex + 1}: ${tc.description}`);
          if (exec.stdout && exec.stdout.trim()) {
            terminalLines.push(`   stdout: ${exec.stdout.trim()}`);
          }
          terminalLines.push(`   ${exec.stderr?.trim() || "Failed to parse output"}`);
        }
      }

      const allPassed = results.every((r) => r.passed);
      const status = allPassed ? "accepted" : "wrong_answer";
      const passed = results.filter((r) => r.passed).length;
      const total = results.length;
      const summary = allPassed
        ? `\n✅ Accepted! All ${total} test cases passed.`
        : `\n❌ Wrong Answer — ${passed}/${total} test cases passed.`;

      await createSubmission({
        userId: ctx.user.id,
        problemId: problem.id,
        code: input.code,
        status,
        testResults: JSON.stringify(results),
      });

      return { status, results, terminalOutput: terminalLines.join("\n") + summary };
    }),

  // AI analysis of the user's solution
  analyzeCode: publicProcedure
    .input(z.object({
      slug: z.string(),
      code: z.string().max(50000),
      stageNumber: z.number().optional(),
      baseClass: z.string().optional(),
      stageTitle: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const problem = await getProblemBySlug(input.slug);
      if (!problem) throw new Error("Problem not found");

      const isStageAnalysis = !!(input.stageNumber && input.baseClass);

      const systemPrompt = isStageAnalysis
        ? `You are an expert Python code reviewer specializing in multi-stage object-oriented design problems (similar to CodeSignal ICA assessments).
The user is implementing a staged problem where each stage extends a base class with new methods.
Analyze the provided Python solution and return a structured JSON response with the following fields:
- overall: string — a 2-3 sentence overall assessment focused on the current stage implementation
- correctness: { score: number (1-10), feedback: string }
- timeComplexity: { notation: string (e.g. "O(n)"), explanation: string }
- spaceComplexity: { notation: string, explanation: string }
- styleIssues: string[] — list of Python style/best-practice issues (empty array if none)
- improvements: string[] — list of concrete improvement suggestions for this stage
- optimizedApproach: string — brief description of the most optimal approach for this stage
- nextMethodHint: string — a concrete hint about which abstract method from the base class to implement next, or what to improve if all methods are implemented
- baseClassUsage: string — assessment of how well the solution extends the base class interface`
        : `You are an expert Python code reviewer specializing in LeetCode-style algorithm problems.
Analyze the provided Python solution and return a structured JSON response with the following fields:
- overall: string — a 2-3 sentence overall assessment
- correctness: { score: number (1-10), feedback: string }
- timeComplexity: { notation: string (e.g. "O(n)"), explanation: string }
- spaceComplexity: { notation: string, explanation: string }
- styleIssues: string[] — list of Python style/best-practice issues (empty array if none)
- improvements: string[] — list of concrete improvement suggestions
- optimizedApproach: string — brief description of the most optimal approach for this problem
- nextMethodHint: string — leave as empty string for non-staged problems
- baseClassUsage: string — leave as empty string for non-staged problems`;

      const userPrompt = isStageAnalysis
        ? `Problem: ${problem.title} — Stage ${input.stageNumber}: ${input.stageTitle ?? ""}

Base Class Interface (read-only — the user must implement this):
\`\`\`python
${input.baseClass}
\`\`\`

User's Stage ${input.stageNumber} Implementation:
\`\`\`python
${input.code}
\`\`\`

Focus your review on:
1. Whether the implementation correctly extends the base class
2. Which abstract methods are implemented vs missing
3. Suggest the next concrete method to implement or improve
4. Stage-specific correctness and efficiency`
        : `Problem: ${problem.title}

${problem.description}

User's Python Solution:
\`\`\`python
${input.code}
\`\`\`

Provide a thorough code review.`;

      const response = await invokeLLM({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "code_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overall: { type: "string" },
                correctness: {
                  type: "object",
                  properties: {
                    score: { type: "number" },
                    feedback: { type: "string" },
                  },
                  required: ["score", "feedback"],
                  additionalProperties: false,
                },
                timeComplexity: {
                  type: "object",
                  properties: {
                    notation: { type: "string" },
                    explanation: { type: "string" },
                  },
                  required: ["notation", "explanation"],
                  additionalProperties: false,
                },
                spaceComplexity: {
                  type: "object",
                  properties: {
                    notation: { type: "string" },
                    explanation: { type: "string" },
                  },
                  required: ["notation", "explanation"],
                  additionalProperties: false,
                },
                styleIssues: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } },
                optimizedApproach: { type: "string" },
                nextMethodHint: { type: "string" },
                baseClassUsage: { type: "string" },
              },
              required: ["overall", "correctness", "timeComplexity", "spaceComplexity", "styleIssues", "improvements", "optimizedApproach", "nextMethodHint", "baseClassUsage"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content as string);
    }),


  // Get test cases for a specific stage (for the read-only test viewer)
  getStageTestCases: publicProcedure
    .input(z.object({ slug: z.string(), stageNumber: z.number() }))
    .query(async ({ input }) => {
      const problem = await getProblemBySlug(input.slug);
      if (!problem) return { stageCases: [], cumulativeCases: [] };
      const stages = await getStagesForProblem(problem.id);
      const stage = stages.find(s => s.stageNumber === input.stageNumber);
      if (!stage) return { stageCases: [], cumulativeCases: [] };
      const stageCases = await getTestCasesForStage(stage.id);
      const cumulativeCases = await getCumulativeTestCasesForStage(problem.id, input.stageNumber);
      return { stageCases, cumulativeCases, stage };
    }),

  // Run tests for a staged problem (cumulative — all stages up to stageNumber)
  runStageTests: publicProcedure
    .input(z.object({
      slug: z.string(),
      code: z.string().max(50000),
      stageNumber: z.number(),
    }))
    .mutation(async ({ input }) => {
      const problem = await getProblemBySlug(input.slug);
      if (!problem) throw new Error("Problem not found");
      const stages = await getStagesForProblem(problem.id);
      const currentStage = stages.find(s => s.stageNumber === input.stageNumber);
      if (!currentStage) throw new Error("Stage not found");

      // Cumulative test cases (all stages up to and including current)
      const cases = await getCumulativeTestCasesForStage(problem.id, input.stageNumber);

      const results: TestCaseResult[] = [];
      const terminalLines: string[] = [];

      for (const tc of cases) {
        const script = buildStagedTestScript(
          currentStage.baseClass,
          input.code,
          tc.inputData,
          tc.expectedOutput
        );
        const exec = await executePython(script);
        terminalLines.push(...formatStderrForTerminal(exec.stderr, `case ${tc.orderIndex + 1}`));
        if (exec.timedOut) {
          results.push({ id: tc.id, description: tc.description, passed: false, expected: tc.expectedOutput, actual: "", error: "Time Limit Exceeded (10s)", stdout: "", stderr: "TLE" });
          terminalLines.push(`❌ Case ${tc.orderIndex + 1}: ${tc.description} — Time Limit Exceeded`);
          continue;
        }
        try {
          const parsed = JSON.parse(exec.stdout || "{}");
          const r: TestCaseResult = {
            id: tc.id,
            description: tc.description,
            passed: parsed.passed === true,
            expected: tc.expectedOutput,
            actual: parsed.actual !== undefined ? JSON.stringify(parsed.actual) : exec.stdout,
            error: parsed.error,
            stdout: exec.stdout,
            stderr: exec.stderr,
          };
          results.push(r);
          const icon = r.passed ? "✅" : "❌";
          terminalLines.push(`${icon} Case ${tc.orderIndex + 1}: ${tc.description}`);
          if (!r.passed) {
            const dispExpected = parsed.expected !== undefined ? JSON.stringify(parsed.expected) : tc.expectedOutput;
            terminalLines.push(`   Expected: ${dispExpected}`);
            terminalLines.push(`   Got:      ${JSON.stringify(parsed.actual)}`);
            if (r.error) terminalLines.push(`   Error:\n${r.error.split("\n").map((l: string) => "   " + l).join("\n")}`);
          }
        } catch {
          const r: TestCaseResult = {
            id: tc.id,
            description: tc.description,
            passed: false,
            expected: tc.expectedOutput,
            actual: exec.stdout,
            error: exec.stderr || "Failed to parse output",
            stdout: exec.stdout,
            stderr: exec.stderr,
          };
          results.push(r);
          terminalLines.push(`❌ Case ${tc.orderIndex + 1}: ${tc.description}`);
          if (exec.stdout && exec.stdout.trim()) {
            terminalLines.push(`   stdout: ${exec.stdout.trim()}`);
          }
          terminalLines.push(`   ${exec.stderr?.trim() || "Failed to parse output"}`);
        }
      }
      const passed = results.filter((r) => r.passed).length;
      const total = results.length;
      const summary = passed === total
        ? `\n✅ All ${total} test cases passed!`
        : `\n❌ ${passed}/${total} test cases passed`;
      return { results, terminalOutput: terminalLines.join("\n") + summary };
    }),

  // Get submission history for a user on a problem
  submissionHistory: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const problem = await getProblemBySlug(input.slug);
      if (!problem) return [];
      const subs = await getSubmissionsForUser(ctx.user.id, problem.id);
      return subs.map((s) => ({
        id: s.id,
        status: s.status,
        createdAt: s.createdAt,
        testResults: JSON.parse(s.testResults) as TestCaseResult[],
      }));
    }),
  // Submit a staged problem stage — saves per-stage submission and returns unlock status
  submitStage: protectedProcedure
    .input(z.object({
      slug: z.string(),
      code: z.string().max(50000),
      stageNumber: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const problem = await getProblemBySlug(input.slug);
      if (!problem) throw new Error("Problem not found");
      const stages = await getStagesForProblem(problem.id);
      const currentStage = stages.find(s => s.stageNumber === input.stageNumber);
      if (!currentStage) throw new Error("Stage not found");

      // Check unlock gate: user must have passed stage N-1 before submitting stage N
      if (input.stageNumber > 1) {
        const prevProgress = await getStageProgress(ctx.user.id, problem.id);
        const prevCompleted = prevProgress.completedStages.includes(input.stageNumber - 1);
        if (!prevCompleted) {
          throw new Error(`Stage ${input.stageNumber - 1} must be completed before attempting Stage ${input.stageNumber}`);
        }
      }

      // Run cumulative tests
      const cases = await getCumulativeTestCasesForStage(problem.id, input.stageNumber);
      const results: TestCaseResult[] = [];
      const terminalLines: string[] = [];

      for (const tc of cases) {
        const script = buildStagedTestScript(
          currentStage.baseClass,
          input.code,
          tc.inputData,
          tc.expectedOutput
        );
        const exec = await executePython(script);
        terminalLines.push(...formatStderrForTerminal(exec.stderr, tc.description));
        if (exec.timedOut) {
          results.push({ id: tc.id, description: tc.description, passed: false, expected: tc.expectedOutput, actual: "", error: "Time Limit Exceeded (10s)", stdout: "", stderr: "TLE" });
          terminalLines.push(`❌ ${tc.description} — Time Limit Exceeded`);
          continue;
        }
        try {
          const parsed = JSON.parse(exec.stdout || "{}");
          const r: TestCaseResult = {
            id: tc.id,
            description: tc.description,
            passed: parsed.passed === true,
            expected: tc.expectedOutput,
            actual: parsed.actual !== undefined ? JSON.stringify(parsed.actual) : exec.stdout,
            error: parsed.error,
            stdout: exec.stdout,
            stderr: exec.stderr,
          };
          results.push(r);
          terminalLines.push(`${r.passed ? "✅" : "❌"} ${tc.description}`);
          if (!r.passed) {
            const dispExpected = parsed.expected !== undefined ? JSON.stringify(parsed.expected) : tc.expectedOutput;
            terminalLines.push(`   Expected: ${dispExpected}`);
            terminalLines.push(`   Got:      ${JSON.stringify(parsed.actual)}`);
            if (r.error) terminalLines.push(`   Error:\n${r.error.split("\n").map((l: string) => "   " + l).join("\n")}`);
          }
        } catch {
          const r: TestCaseResult = {
            id: tc.id,
            description: tc.description,
            passed: false,
            expected: tc.expectedOutput,
            actual: exec.stdout,
            error: exec.stderr || "Failed to parse output",
            stdout: exec.stdout,
            stderr: exec.stderr,
          };
          results.push(r);
          terminalLines.push(`❌ ${tc.description}`);
          if (exec.stdout?.trim()) terminalLines.push(`   stdout: ${exec.stdout.trim()}`);
          terminalLines.push(`   ${exec.stderr?.trim() || "Failed to parse output"}`);
        }
      }

      const allPassed = results.every(r => r.passed);
      const status = allPassed ? "accepted" : "wrong_answer";
      const passed = results.filter(r => r.passed).length;
      const total = results.length;
      const summary = allPassed
        ? `\n✅ Stage ${input.stageNumber} accepted! All ${total} tests passed.`
        : `\n❌ Wrong Answer — ${passed}/${total} tests passed.`;

      // Save the stage submission
      await createStageSubmission({
        userId: ctx.user.id,
        problemId: problem.id,
        stageId: currentStage.id,
        stageNumber: input.stageNumber,
        code: input.code,
        status,
        testResults: JSON.stringify(results),
      });

      // Compute new unlock status after saving
      const [newHighestUnlocked, newProgress] = await Promise.all([
        getHighestUnlockedStage(ctx.user.id, problem.id),
        getStageProgress(ctx.user.id, problem.id),
      ]);

      const justUnlockedNextStage = allPassed && input.stageNumber < stages.length;

      return {
        status,
        results,
        terminalOutput: terminalLines.join("\n") + summary,
        stageNumber: input.stageNumber,
        highestUnlockedStage: newHighestUnlocked,
        stageProgress: newProgress,
        justUnlockedNextStage,
        nextStageNumber: justUnlockedNextStage ? input.stageNumber + 1 : null,
      };
    }),

  // Get stage submission history for a user on a staged problem
  stageSubmissionHistory: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const problem = await getProblemBySlug(input.slug);
      if (!problem) return [];
      const subs = await getStageSubmissionsForUser(ctx.user.id, problem.id);
      return subs.map(s => ({
        id: s.id,
        stageNumber: s.stageNumber,
        status: s.status,
        createdAt: s.createdAt,
        testResults: JSON.parse(s.testResults) as TestCaseResult[],
      }));
    }),
});
