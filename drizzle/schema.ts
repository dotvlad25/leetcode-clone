import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const problems = mysqlTable("problems", {
  id: int("id").autoincrement().primaryKey(),
  number: int("number").notNull().default(0),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  title: text("title").notNull(),
  difficulty: mysqlEnum("difficulty", ["Easy", "Medium", "Hard"]).notNull(),
  description: text("description").notNull(),
  starterCode: text("starterCode").notNull(),
  methodName: varchar("methodName", { length: 128 }).notNull().default("solve"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const testCases = mysqlTable("test_cases", {
  id: int("id").autoincrement().primaryKey(),
  problemId: int("problemId").notNull(),
  description: varchar("description", { length: 512 }).notNull(),
  inputData: text("inputData").notNull(),
  expectedOutput: text("expectedOutput").notNull(),
  orderIndex: int("orderIndex").notNull().default(0),
});

export const submissions = mysqlTable("submissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  problemId: int("problemId").notNull(),
  code: text("code").notNull(),
  status: mysqlEnum("status", ["accepted", "wrong_answer", "error", "run"]).notNull(),
  testResults: text("testResults").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Problem = typeof problems.$inferSelect;
export type InsertProblem = typeof problems.$inferInsert;
export type TestCase = typeof testCases.$inferSelect;
export type InsertTestCase = typeof testCases.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;

export const problemsRelations = relations(problems, ({ many }) => ({
  testCases: many(testCases),
  submissions: many(submissions),
}));

export const testCasesRelations = relations(testCases, ({ one }) => ({
  problem: one(problems, { fields: [testCases.problemId], references: [problems.id] }),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  user: one(users, { fields: [submissions.userId], references: [users.id] }),
  problem: one(problems, { fields: [submissions.problemId], references: [problems.id] }),
}));
