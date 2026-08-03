// A stage "leaks" if its cumulative tests pass with EMPTY user code —
// meaning the scaffolding alone already implements the answer.
import Database from "better-sqlite3";
import { buildStagedTestScript, executePython } from "../../server/executor";
const db = new Database("data/app.db", { readonly: true });
const problems: any[] = db.prepare("SELECT * FROM problems WHERE isStaged=1").all() as any[];
const getStages = db.prepare("SELECT * FROM problem_stages WHERE problemId=? ORDER BY stageNumber");
const getTests = db.prepare("SELECT * FROM stage_test_cases WHERE stageId=? ORDER BY orderIndex");
const leaks: string[] = [];
for (const p of problems) {
  const stages: any[] = getStages.all(p.id) as any[];
  const cum: any[] = [];
  for (const st of stages) {
    cum.push(...(getTests.all(st.id) as any[]));
    if (cum.length === 0) continue;
    let allPass = true;
    for (const tc of cum) {
      const r = await executePython(buildStagedTestScript(st.baseClass, "", tc.inputData, tc.expectedOutput));
      let passed = false;
      try { passed = JSON.parse(r.stdout || "{}").passed === true; } catch {}
      if (!passed) { allPass = false; break; }
    }
    if (allPass) leaks.push(`${p.slug} S${st.stageNumber}`);
  }
}
console.log(`=== STAGES SOLVABLE WITH EMPTY CODE (${leaks.length}) ===`);
leaks.forEach(l => console.log("  " + l));
