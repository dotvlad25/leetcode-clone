import path from "node:path";

/** Strips a `file:` / `sqlite:` prefix so DATABASE_URL accepts either form. */
function resolveDbFile(raw: string | undefined): string {
  const value = (raw ?? "./data/app.db").replace(/^(file:|sqlite:)\/{0,2}/, "");
  return path.resolve(process.cwd(), value);
}

export const ENV = {
  /** Path to the local SQLite file. Override with DATABASE_URL. */
  databaseFile: resolveDbFile(process.env.DATABASE_URL),
  /** Drizzle migrations applied on first DB open. */
  migrationsDir: path.resolve(process.cwd(), process.env.MIGRATIONS_DIR ?? "drizzle/migrations"),
  isProduction: process.env.NODE_ENV === "production",

  /** Display name for the auto-provisioned local user. */
  localUserName: process.env.LOCAL_USER_NAME ?? "Local User",
  localUserEmail: process.env.LOCAL_USER_EMAIL ?? "local@localhost",

  /** AI code review. Anthropic is preferred when both keys are present. */
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  anthropicBaseUrl: process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com",
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-opus-5",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
};
