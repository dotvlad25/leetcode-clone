import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

/**
 * Local single-user mode.
 *
 * The hosted version of this app authenticated through an external OAuth
 * provider. Running locally there is nothing to log in to, so every request is
 * attributed to one auto-provisioned user. Submissions and stage progress still
 * get a real row in `users`, so the schema and queries are unchanged.
 */
export const LOCAL_OPEN_ID = "local-user";

let cached: User | null = null;

export async function getLocalUser(): Promise<User | null> {
  if (cached) return cached;

  const existing = await db.getUserByOpenId(LOCAL_OPEN_ID);
  if (existing) {
    cached = existing;
    return cached;
  }

  await db.upsertUser({
    openId: LOCAL_OPEN_ID,
    name: ENV.localUserName,
    email: ENV.localUserEmail,
    loginMethod: "local",
    role: "admin",
    lastSignedIn: new Date(),
  });

  cached = (await db.getUserByOpenId(LOCAL_OPEN_ID)) ?? null;
  return cached;
}
