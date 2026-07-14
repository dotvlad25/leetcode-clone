import { eq, desc, and, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, problems, testCases, submissions, InsertSubmission,
  problemStages, stageTestCases, InsertProblemStage, InsertStageTestCase,
  stageSubmissions, InsertStageSubmission,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Problems ───────────────────────────────────────────────────────────────

export async function listProblems() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: problems.id,
    number: problems.number,
    slug: problems.slug,
    title: problems.title,
    difficulty: problems.difficulty,
    isStaged: problems.isStaged,
    tags: problems.tags,
    createdAt: problems.createdAt,
  }).from(problems).orderBy(problems.number);
}

export async function getProblemBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(problems).where(eq(problems.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProblemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(problems).where(eq(problems.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Test Cases ─────────────────────────────────────────────────────────────

export async function getTestCasesForProblem(problemId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(testCases)
    .where(eq(testCases.problemId, problemId))
    .orderBy(testCases.orderIndex);
}

// ── Submissions ────────────────────────────────────────────────────────────

export async function createSubmission(data: InsertSubmission) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(submissions).values({
    ...data,
    testResults: data.testResults ?? "[]",
  });
  return result;
}

export async function getSubmissionsForUser(userId: number, problemId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(submissions)
    .where(eq(submissions.userId, userId))
    .orderBy(desc(submissions.createdAt))
    .limit(20);
}

export async function getAcceptedProblemIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const allRows = await db.select({ problemId: submissions.problemId, status: submissions.status })
    .from(submissions)
    .where(eq(submissions.userId, userId));
  const acceptedSet = new Set(allRows.filter(r => r.status === 'accepted').map(r => r.problemId));
  const acceptedIds = Array.from(acceptedSet);
  return acceptedIds;
}

// ── Seeding ────────────────────────────────────────────────────────────────

// ── Problem Stages ─────────────────────────────────────────────────────────

export async function getStagesForProblem(problemId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(problemStages)
    .where(eq(problemStages.problemId, problemId))
    .orderBy(problemStages.stageNumber);
}

export async function getTestCasesForStage(stageId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stageTestCases)
    .where(eq(stageTestCases.stageId, stageId))
    .orderBy(stageTestCases.orderIndex);
}

/** Returns all test cases for stages 1..stageNumber (cumulative). */
export async function getCumulativeTestCasesForStage(problemId: number, stageNumber: number) {
  const db = await getDb();
  if (!db) return [];
  const stages = await db.select().from(problemStages)
    .where(eq(problemStages.problemId, problemId))
    .orderBy(problemStages.stageNumber);
  const relevantStages = stages.filter(s => s.stageNumber <= stageNumber);
  const allCases: (typeof stageTestCases.$inferSelect)[] = [];
  for (const stage of relevantStages) {
    const cases = await db.select().from(stageTestCases)
      .where(eq(stageTestCases.stageId, stage.id))
      .orderBy(stageTestCases.orderIndex);
    allCases.push(...cases);
  }
  return allCases;
}

// ── Seeding ────────────────────────────────────────────────────────────────

export async function seedProblemIfNotExists(
  problemData: { slug: string; title: string; difficulty: "Easy" | "Medium" | "Hard"; description: string; starterCode: string },
  cases: { description: string; inputData: string; expectedOutput: string; orderIndex: number }[]
) {
  const db = await getDb();
  if (!db) return;
  const existing = await getProblemBySlug(problemData.slug);
  if (existing) return;
  const [result] = await db.insert(problems).values(problemData).$returningId();
  const problemId = result.id;
  if (cases.length > 0) {
    await db.insert(testCases).values(cases.map(c => ({ ...c, problemId })));
  }
  console.log(`[Seed] Seeded problem: ${problemData.title}`);
}

/** Seed a staged problem with its stages and per-stage test cases. Idempotent. */
export async function seedStagedProblemIfNotExists(
  problemData: {
    number?: number;
    slug: string;
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    description: string;
    starterCode: string;
    tags?: string;
    methodName?: string;
  },
  stages: Array<{
    stageNumber: number;
    title: string;
    description: string;
    baseClass: string;
    starterCode: string;
    solution?: string;
    solutionExplanation?: string;
    testCases: Array<{ description: string; inputData: string; expectedOutput: string; orderIndex: number }>;
  }>
) {
  const db = await getDb();
  if (!db) return;
  const existing = await getProblemBySlug(problemData.slug);
  if (existing) return;
  const [result] = await db.insert(problems).values({
    ...problemData,
    isStaged: 1,
  }).$returningId();
  const problemId = result.id;
  for (const stage of stages) {
    const [stageResult] = await db.insert(problemStages).values({
      problemId,
      stageNumber: stage.stageNumber,
      title: stage.title,
      description: stage.description,
      baseClass: stage.baseClass,
      starterCode: stage.starterCode,
      solution: stage.solution ?? null,
      solutionExplanation: stage.solutionExplanation ?? null,
    }).$returningId();
    const stageId = stageResult.id;
    if (stage.testCases.length > 0) {
      await db.insert(stageTestCases).values(
        stage.testCases.map(tc => ({ ...tc, stageId, problemId }))
      );
    }
  }
  console.log(`[Seed] Seeded staged problem: ${problemData.title} (${stages.length} stages)`);
}
// ── Stage Submissions ──────────────────────────────────────────────────────

export async function createStageSubmission(data: InsertStageSubmission) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(stageSubmissions).values({
    ...data,
    testResults: data.testResults ?? "[]",
  });
  return result;
}

/**
 * Returns { completedStages: number[], totalStages: number } for a user on a staged problem.
 * completedStages is the list of stageNumbers that have at least one 'accepted' submission.
 */
export async function getStageProgress(userId: number, problemId: number) {
  const db = await getDb();
  if (!db) return { completedStages: [], totalStages: 0 };
  const [allStages, acceptedRows] = await Promise.all([
    db.select({ stageNumber: problemStages.stageNumber })
      .from(problemStages)
      .where(eq(problemStages.problemId, problemId))
      .orderBy(problemStages.stageNumber),
    db.select({ stageNumber: stageSubmissions.stageNumber })
      .from(stageSubmissions)
      .where(
        and(
          eq(stageSubmissions.userId, userId),
          eq(stageSubmissions.problemId, problemId),
          eq(stageSubmissions.status, "accepted")
        )
      ),
  ]);
  const completedSet = new Set(acceptedRows.map(r => r.stageNumber));
  return {
    completedStages: Array.from(completedSet).sort((a, b) => a - b),
    totalStages: allStages.length,
  };
}

/**
 * Returns the highest stage number the user is allowed to attempt.
 * Stage 1 is always unlocked. Stage N+1 unlocks when stage N is accepted.
 */
export async function getHighestUnlockedStage(userId: number, problemId: number): Promise<number> {
  const progress = await getStageProgress(userId, problemId);
  if (progress.totalStages === 0) return 1;
  // Unlock up to (max completed + 1), capped at totalStages
  const maxCompleted = progress.completedStages.length > 0
    ? Math.max(...progress.completedStages)
    : 0;
  return Math.min(maxCompleted + 1, progress.totalStages);
}

/** Returns the last N stage submissions for a user on a problem, newest first. */
export async function getStageSubmissionsForUser(userId: number, problemId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stageSubmissions)
    .where(
      and(
        eq(stageSubmissions.userId, userId),
        eq(stageSubmissions.problemId, problemId)
      )
    )
    .orderBy(desc(stageSubmissions.createdAt))
    .limit(limit);
}

/**
 * Returns stage progress for multiple problems at once (for the problems list).
 * Returns a map of problemId -> { completedStages, totalStages }.
 */
export async function getBulkStageProgress(
  userId: number,
  problemIds: number[]
): Promise<Map<number, { completedStages: number[]; totalStages: number }>> {
  const db = await getDb();
  const result = new Map<number, { completedStages: number[]; totalStages: number }>();
  if (!db || problemIds.length === 0) return result;

  const [allStages, acceptedRows] = await Promise.all([
    db.select({ problemId: problemStages.problemId, stageNumber: problemStages.stageNumber })
      .from(problemStages)
      .where(inArray(problemStages.problemId, problemIds)),
    db.select({ problemId: stageSubmissions.problemId, stageNumber: stageSubmissions.stageNumber })
      .from(stageSubmissions)
      .where(
        and(
          eq(stageSubmissions.userId, userId),
          inArray(stageSubmissions.problemId, problemIds),
          eq(stageSubmissions.status, "accepted")
        )
      ),
  ]);

  // Build total stages per problem
  const totalsMap = new Map<number, number>();
  for (const row of allStages) {
    totalsMap.set(row.problemId, (totalsMap.get(row.problemId) ?? 0) + 1);
  }
  // Build completed stages per problem
  const completedMap = new Map<number, Set<number>>();
  for (const row of acceptedRows) {
    if (!completedMap.has(row.problemId)) completedMap.set(row.problemId, new Set());
    completedMap.get(row.problemId)!.add(row.stageNumber);
  }

  for (const pid of problemIds) {
    result.set(pid, {
      completedStages: Array.from(completedMap.get(pid) ?? new Set<number>()).sort((a, b) => (a as number) - (b as number)),
      totalStages: totalsMap.get(pid) ?? 0,
    });
  }
  return result;
}
