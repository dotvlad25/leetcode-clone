import { getDb } from './server/db.ts';
import { stageTestCases, problemStages, problems } from './drizzle/schema.ts';
import { eq, and } from 'drizzle-orm';

const db = await getDb();
if (!db) { console.error('No DB'); process.exit(1); }
const rows = await db.select({
  inputData: stageTestCases.inputData,
  expectedOutput: stageTestCases.expectedOutput,
  description: stageTestCases.description,
  baseClass: problemStages.baseClass,
}).from(stageTestCases)
  .innerJoin(problemStages, eq(stageTestCases.stageId, problemStages.id))
  .innerJoin(problems, eq(problemStages.problemId, problems.id))
  .where(and(eq(problems.slug, 'rate-limiter'), eq(problemStages.stageNumber, 1)))
  .limit(3);

for (const r of rows) {
  console.log('--- TC ---');
  console.log('inputData:', r.inputData?.substring(0, 300));
  console.log('expected:', r.expectedOutput?.substring(0, 100));
  console.log('baseClass:', r.baseClass?.substring(0, 200));
}
