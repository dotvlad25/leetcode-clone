# PyCode — local Python practice platform

A LeetCode-style app for practicing Python: pick a problem, write a solution in a
Monaco editor, run it against test cases, and track what you've solved. Includes
multi-stage (CodeSignal ICA-style) problems where each stage unlocks the next.

Runs entirely on your machine — no accounts, no cloud services, no database
server.

## Requirements

- **Node.js 20+** (tested on 24)
- **pnpm** (`corepack enable` will provide it)
- **Python 3** on your `PATH` — submitted solutions run via `python3`

## Quick start

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. The repository includes a portable SQLite snapshot at
`data/app.db`, so the bundled problems are available immediately on every
machine. On startup the app applies any pending migrations and idempotent seed
updates. If the file is absent, it is created and seeded automatically. No
`.env` is required.

To configure anything, copy `.env.example` to `.env` — every value in it is
optional.

## How it works locally

| Concern | Behaviour |
| --- | --- |
| **Database** | Portable SQLite snapshot at `data/app.db` (drizzle + better-sqlite3). Runtime `-wal`/`-shm` sidecars stay local and are ignored by Git. |
| **Sign-in** | None. Every request is attributed to a single auto-provisioned user (`LOCAL_USER_NAME`), so submissions and stage progress persist. |
| **Running code** | Submitted Python runs in a `python3` child process with a 10-second timeout. |
| **AI code review** | Optional. Set `ANTHROPIC_API_KEY` (preferred) or `OPENAI_API_KEY` in `.env`. Without a key the Analyze panel says so and everything else still works. |

> **Note on the sandbox:** solutions execute as a plain local subprocess with
> your user's permissions — the same trust model as running a script yourself.
> That is fine for your own practice; don't expose this server to a network you
> don't control.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server with HMR on port 3000 (falls forward if busy) |
| `pnpm build` | Build the client (`dist/public`) and server (`dist/index.js`) |
| `pnpm start` | Run the production build |
| `pnpm test` | Vitest suite (executor + router tests) |
| `pnpm check` | TypeScript typecheck |
| `pnpm db:generate` | Generate a migration after editing `drizzle/schema.ts` |
| `pnpm db:migrate` | Apply migrations manually (the server also does this on boot) |
| `pnpm db:studio` | Browse the local database in Drizzle Studio |
| `pnpm db:reset` | Delete `data/` — the DB is rebuilt and reseeded on next start |

## Layout

```
client/          React 19 + Vite + Tailwind + shadcn/ui frontend
server/          Express + tRPC backend
  _core/         server bootstrap, env, tRPC setup, local user, LLM client
  executor.ts    builds and runs the Python test harnesses
  seed*.ts       problem content, seeded idempotently on boot
drizzle/         SQLite schema + generated migrations
```

## Adding problems

Problem content lives in the `server/seed*.ts` files and is inserted only when
the slug is missing, so seeding is safe to re-run. Add an entry, restart, and it
appears. To pick up edits to an *existing* problem, run `pnpm db:reset` first.

## Docker (optional)

```bash
docker build -t pycode .
docker run -p 3000:3000 -v pycode-data:/app/data pycode
```

## Deploying

This is built to run locally. If you host it, put it behind your own
authentication first — there is no login, and the code executor runs arbitrary
Python on the host.
