import Database from "better-sqlite3";
const db = new Database("data/app.db", { readonly: true });

function commentStats(code) {
  const lines = code.split("\n").filter(l => l.trim());
  const comments = lines.filter(l => /(^\s*#)|(\s#\s)/.test(l)).length;
  const docstrings = (code.match(/"""/g) || []).length / 2;
  return { lines: lines.length, comments, docstrings };
}

console.log("=== SOLUTIONS WITH NO COMMENTS AND NO DOCSTRINGS ===");
const staged = db.prepare(`SELECT p.slug, s.stageNumber, s.solution, s.description, s.title
  FROM problem_stages s JOIN problems p ON s.problemId=p.id ORDER BY p.slug, s.stageNumber`).all();
let bare = 0;
for (const s of staged) {
  if (!s.solution) continue;
  const st = commentStats(s.solution);
  if (st.comments === 0 && st.docstrings === 0) { bare++; console.log(`  ${s.slug} S${s.stageNumber} (${st.lines} lines, 0 comments)`); }
}
console.log(`\n${bare} of ${staged.length} stage solutions have zero explanatory comments`);

console.log("\n=== SHORTEST STAGE DESCRIPTIONS (possible under-specification) ===");
staged.map(s => ({ k: `${s.slug} S${s.stageNumber}`, n: (s.description||"").length }))
  .sort((a,b) => a.n - b.n).slice(0, 12).forEach(x => console.log(`  ${x.n} chars  ${x.k}`));

console.log("\n=== STAGE DESCRIPTIONS WITHOUT A CODE EXAMPLE ===");
let noEx = 0;
for (const s of staged) {
  const d = s.description || "";
  if (!d.includes("```") && !d.includes("→") && !d.includes("# ->")) { noEx++; console.log(`  ${s.slug} S${s.stageNumber}`); }
}
console.log(`${noEx} stages have no worked example`);
