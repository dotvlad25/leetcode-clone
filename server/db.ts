import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, problems, testCases, submissions, InsertSubmission } from "../drizzle/schema";
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
