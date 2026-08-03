# Problem content checks

Static checks over the seeded problem set. They read `data/app.db`, so start
the server once (`pnpm dev`) to build/seed it before running them.

Every check exits by printing a count — all five should report zero.

| Command | Checks |
| --- | --- |
| `npx tsx scripts/content-checks/verify.ts` | Runs every reference solution against its own test cases, cumulatively per stage. Also lists stages with no test cases at all. |
| `npx tsx scripts/content-checks/leak.ts` | Stages that pass with **empty** user code — means the base class already implements the answer. |
| `npx tsx scripts/content-checks/leak2.ts` | Stages where the pre-filled **starter code** already passes. Four hits are expected and intentional: `string-compression-decoder` S2 and the three Amazon S3s are "verify your existing solution" stages that add no new method and are gated behind passing the prior stage. |
| `node scripts/content-checks/syntax.mjs` | Compiles every stored `baseClass`, `starterCode` and `solution` with `python3`. Catches escaping damage from the seed files' template literals. |
| `node scripts/content-checks/quality.mjs` | Solutions with no explanatory comments, shortest stage descriptions, stages with no worked example. |

## Why these exist

The seed files embed Python inside JS/TS string literals, which is easy to get
wrong in ways that type-checking cannot see:

- A `\n` or `\t` inside a template literal becomes a real newline/tab and
  breaks the Python string it was meant to be part of.
- A missing newline after a `"""docstring"""` silently joins two statements.
- A test snippet that assigns `result` instead of `_result` fails 100% of the
  time no matter what the user writes.
- An empty `testCases: []` makes `results.every(...)` vacuously true, so any
  submission is "accepted".

Run these after editing anything under `server/seed*.ts`, then re-seed with
`pnpm db:reset && pnpm dev`.
