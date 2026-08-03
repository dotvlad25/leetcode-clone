import Database from "better-sqlite3";
import { execFileSync } from "node:child_process";
const db = new Database("data/app.db", { readonly: true });

function compiles(code) {
  try {
    execFileSync("python3", ["-c", "import sys; compile(sys.stdin.read(), '<code>', 'exec')"],
      { input: code, stdio: ["pipe", "pipe", "pipe"] });
    return null;
  } catch (e) { return (e.stderr?.toString() || "").trim().split("\n").slice(-2).join(" | "); }
}

let bad = 0, checked = 0;
const stages = db.prepare(`SELECT p.slug, s.stageNumber, s.baseClass, s.starterCode, s.solution
  FROM problem_stages s JOIN problems p ON s.problemId=p.id ORDER BY p.slug, s.stageNumber`).all();
for (const s of stages) {
  for (const [field, code] of [["baseClass", s.baseClass], ["starterCode", s.starterCode], ["solution", s.solution], ["baseClass+solution", (s.baseClass||"") + "\n" + (s.solution||"")]]) {
    if (!code) continue;
    checked++;
    const err = compiles(code);
    if (err) { bad++; console.log(`  ${s.slug} S${s.stageNumber} [${field}] -> ${err}`); }
  }
}
const plain = db.prepare(`SELECT slug, starterCode, solution FROM problems WHERE isStaged=0`).all();
for (const p of plain) {
  for (const [field, code] of [["starterCode", p.starterCode], ["solution", p.solution]]) {
    if (!code) continue;
    checked++;
    const err = compiles(code);
    if (err) { bad++; console.log(`  ${p.slug} [${field}] -> ${err}`); }
  }
}
console.log(`\n${bad} syntax errors across ${checked} code blocks`);
