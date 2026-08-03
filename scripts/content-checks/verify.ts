import Database from "better-sqlite3";
import { buildGenericTestScript, buildStagedTestScript, executePython } from "../../server/executor";

const db = new Database("data/app.db", { readonly: true });

type Row = Record<string, any>;
const problems: Row[] = db.prepare(`SELECT * FROM problems ORDER BY isStaged, id`).all() as Row[];
const getTests = db.prepare(`SELECT * FROM test_cases WHERE problemId=? ORDER BY orderIndex`);
const getStages = db.prepare(`SELECT * FROM problem_stages WHERE problemId=? ORDER BY stageNumber`);
const getStageTests = db.prepare(`SELECT * FROM stage_test_cases WHERE stageId=? ORDER BY orderIndex`);

const failures: string[] = [];
const noTests: string[] = [];

async function runCase(script: string) {
  const exec = await executePython(script);
  if (exec.timedOut) return { ok: false, why: "TIMEOUT" };
  try {
    const parsed = JSON.parse(exec.stdout || "{}");
    return { ok: parsed.passed === true, why: parsed.error ? String(parsed.error).split("\n").slice(-3).join(" | ") : `expected=${JSON.stringify(parsed.expected)} got=${JSON.stringify(parsed.actual)}` };
  } catch {
    return { ok: false, why: `unparseable: ${(exec.stderr || exec.stdout || "").slice(0, 200)}` };
  }
}

for (const p of problems) {
  if (!p.isStaged) {
    const tests = getTests.all(p.id) as Row[];
    if (tests.length === 0) { noTests.push(`${p.slug} (non-staged)`); continue; }
    if (!p.solution) { failures.push(`${p.slug}: NO REFERENCE SOLUTION`); continue; }
    for (const tc of tests) {
      const r = await runCase(buildGenericTestScript(p.solution, p.methodName || "solve", tc.inputData, tc.expectedOutput));
      if (!r.ok) failures.push(`${p.slug} :: "${tc.description}" -> ${r.why}`);
    }
  } else {
    const stages = getStages.all(p.id) as Row[];
    const cumulative: Row[] = [];
    for (const st of stages) {
      const own = getStageTests.all(st.id) as Row[];
      cumulative.push(...own);
      if (own.length === 0) { noTests.push(`${p.slug} stage ${st.stageNumber}`); continue; }
      if (!st.solution) { failures.push(`${p.slug} S${st.stageNumber}: NO REFERENCE SOLUTION`); continue; }
      for (const tc of cumulative) {
        const r = await runCase(buildStagedTestScript(st.baseClass, st.solution, tc.inputData, tc.expectedOutput));
        if (!r.ok) failures.push(`${p.slug} S${st.stageNumber} :: "${tc.description}" -> ${r.why}`);
      }
    }
  }
}

console.log("=== PROBLEMS/STAGES WITH ZERO TEST CASES ===");
noTests.forEach(n => console.log("  " + n));
console.log(`\n=== REFERENCE SOLUTION FAILURES (${failures.length}) ===`);
failures.forEach(f => console.log("  " + f));
