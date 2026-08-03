import { defineConfig } from "drizzle-kit";
import path from "node:path";

// Local SQLite file. Matches server/_core/env.ts — override with DATABASE_URL.
const dbFile = path.resolve(
  process.cwd(),
  (process.env.DATABASE_URL ?? "./data/app.db").replace(/^(file:|sqlite:)\/{0,2}/, "")
);

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: dbFile,
  },
});
