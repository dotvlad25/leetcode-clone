import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import {
  listProblems,
  getProblemBySlug,
  getTestCasesForProblem,
  createSubmission,
  getSubmissionsForUser,
  getAcceptedProblemIds,
} from "../db";
import { executePython, buildGenericTestScript, TestCaseResult } from "../executor";
import { invokeLLM } from "../_core/llm";

export const problemsRouter = router({
  // List all problems (with optional solved status for authenticated users)
  list: publicProcedure.query(async ({ ctx }) => {
    const allProblems = await listProblems();
    let acceptedIds: number[] = [];
    if (ctx.user) {
      acceptedIds = await getAcceptedProblemIds(ctx.user.id);
    }
    return allProblems.map((p) => ({
      ...p,
      solved: acceptedIds.includes(p.id),
    }));
  }),

  // Get a single problem with its test cases
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const problem = await getProblemBySlug(input.slug);
      if (!problem) return null;
      const cases = await getTestCasesForProblem(problem.id);
      return { ...problem, testCases: cases };
    }),

  // Run code against all test cases (does not save submission)
  runTests: publicProcedure
    .input(z.object({
      slug: z.string(),
      code: z.string().max(50000),
      methodName: z.string().default("findDuplicate"),
    }))
    .mutation(async ({ input }) => {
      const problem = await getProblemBySlug(input.slug);
      if (!problem) throw new Error("Problem not found");
      const cases = await getTestCasesForProblem(problem.id);

      const results: TestCaseResult[] = [];
      for (const tc of cases) {
        const script = buildGenericTestScript(
          input.code,
          input.methodName,
          tc.inputData,
          tc.expectedOutput
        );
        const exec = await executePython(script);
        if (exec.timedOut) {
          results.push({ id: tc.id, description: tc.description, passed: false, expected: tc.expectedOutput, actual: "", error: "Time Limit Exceeded (10s)" });
          continue;
        }
        try {
          const parsed = JSON.parse(exec.stdout || "{}");
          results.push({
            id: tc.id,
            description: tc.description,
            passed: parsed.passed === true,
            expected: tc.expectedOutput,
            actual: parsed.actual !== undefined ? JSON.stringify(parsed.actual) : exec.stdout,
            error: parsed.error,
          });
        } catch {
          results.push({
            id: tc.id,
            description: tc.description,
            passed: false,
            expected: tc.expectedOutput,
            actual: exec.stdout,
            error: exec.stderr || "Failed to parse output",
          });
        }
      }
      return { results };
    }),

  // Submit code — runs tests and saves submission
  submit: protectedProcedure
    .input(z.object({
      slug: z.string(),
      code: z.string().max(50000),
      methodName: z.string().default("findDuplicate"),
    }))
    .mutation(async ({ input, ctx }) => {
      const problem = await getProblemBySlug(input.slug);
      if (!problem) throw new Error("Problem not found");
      const cases = await getTestCasesForProblem(problem.id);

      const results: TestCaseResult[] = [];
      for (const tc of cases) {
        const script = buildGenericTestScript(
          input.code,
          input.methodName,
          tc.inputData,
          tc.expectedOutput
        );
        const exec = await executePython(script);
        if (exec.timedOut) {
          results.push({ id: tc.id, description: tc.description, passed: false, expected: tc.expectedOutput, actual: "", error: "Time Limit Exceeded (10s)" });
          continue;
        }
        try {
          const parsed = JSON.parse(exec.stdout || "{}");
          results.push({
            id: tc.id,
            description: tc.description,
            passed: parsed.passed === true,
            expected: tc.expectedOutput,
            actual: parsed.actual !== undefined ? JSON.stringify(parsed.actual) : exec.stdout,
            error: parsed.error,
          });
        } catch {
          results.push({
            id: tc.id,
            description: tc.description,
            passed: false,
            expected: tc.expectedOutput,
            actual: exec.stdout,
            error: exec.stderr || "Failed to parse output",
          });
        }
      }

      const allPassed = results.every((r) => r.passed);
      const status = allPassed ? "accepted" : "wrong_answer";

      await createSubmission({
        userId: ctx.user.id,
        problemId: problem.id,
        code: input.code,
        status,
        testResults: JSON.stringify(results),
      });

      return { status, results };
    }),

  // AI analysis of the user's solution
  analyzeCode: publicProcedure
    .input(z.object({
      slug: z.string(),
      code: z.string().max(50000),
    }))
    .mutation(async ({ input }) => {
      const problem = await getProblemBySlug(input.slug);
      if (!problem) throw new Error("Problem not found");

      const systemPrompt = `You are an expert Python code reviewer specializing in LeetCode-style algorithm problems.
Analyze the provided Python solution and return a structured JSON response with the following fields:
- overall: string — a 2-3 sentence overall assessment
- correctness: { score: number (1-10), feedback: string }
- timeComplexity: { notation: string (e.g. "O(n)"), explanation: string }
- spaceComplexity: { notation: string, explanation: string }
- styleIssues: string[] — list of Python style/best-practice issues (empty array if none)
- improvements: string[] — list of concrete improvement suggestions
- optimizedApproach: string — brief description of the most optimal approach for this problem`;

      const userPrompt = `Problem: ${problem.title}

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
              },
              required: ["overall", "correctness", "timeComplexity", "spaceComplexity", "styleIssues", "improvements", "optimizedApproach"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content as string);
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
});

