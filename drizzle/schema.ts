import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
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
  solution: text("solution"),
  solutionExplanation: text("solutionExplanation"),
  solutionVariants: text("solutionVariants"),
  methodName: varchar("methodName", { length: 64 }).default("findDuplicate").notNull(),
  tags: text("tags"),
  isStaged: int("isStaged").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const problemStages = mysqlTable("problem_stages", {
  id: int("id").autoincrement().primaryKey(),
  problemId: int("problemId").notNull(),
  stageNumber: int("stageNumber").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description").notNull(),
  baseClass: text("baseClass").notNull(),
  starterCode: text("starterCode").notNull(),
  solution: text("solution"),
  solutionExplanation: text("solutionExplanation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const stageTestCases = mysqlTable("stage_test_cases", {
  id: int("id").autoincrement().primaryKey(),
  stageId: int("stageId").notNull(),
  problemId: int("problemId").notNull(),
  description: varchar("description", { length: 512 }).notNull(),
  inputData: text("inputData").notNull(),
  expectedOutput: text("expectedOutput").notNull(),
  orderIndex: int("orderIndex").notNull().default(0),
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

export const stageSubmissions = mysqlTable("stage_submissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  problemId: int("problemId").notNull(),
  stageId: int("stageId").notNull(),
  stageNumber: int("stageNumber").notNull(),
  code: text("code").notNull(),
  status: mysqlEnum("status", ["accepted", "wrong_answer", "error"]).notNull(),
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
  stages: many(problemStages),
}));

export const problemStagesRelations = relations(problemStages, ({ one, many }) => ({
  problem: one(problems, { fields: [problemStages.problemId], references: [problems.id] }),
  testCases: many(stageTestCases),
}));

export const stageTestCasesRelations = relations(stageTestCases, ({ one }) => ({
  stage: one(problemStages, { fields: [stageTestCases.stageId], references: [problemStages.id] }),
  problem: one(problems, { fields: [stageTestCases.problemId], references: [problems.id] }),
}));

export const testCasesRelations = relations(testCases, ({ one }) => ({
  problem: one(problems, { fields: [testCases.problemId], references: [problems.id] }),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  user: one(users, { fields: [submissions.userId], references: [users.id] }),
  problem: one(problems, { fields: [submissions.problemId], references: [problems.id] }),
}));
export type ProblemStage = typeof problemStages.$inferSelect;
export type InsertProblemStage = typeof problemStages.$inferInsert;
export type StageTestCase = typeof stageTestCases.$inferSelect;
export type InsertStageTestCase = typeof stageTestCases.$inferInsert;
export type StageSubmission = typeof stageSubmissions.$inferSelect;
export type InsertStageSubmission = typeof stageSubmissions.$inferInsert;

export const stageSubmissionsRelations = relations(stageSubmissions, ({ one }) => ({
  user: one(users, { fields: [stageSubmissions.userId], references: [users.id] }),
  problem: one(problems, { fields: [stageSubmissions.problemId], references: [problems.id] }),
  stage: one(problemStages, { fields: [stageSubmissions.stageId], references: [problemStages.id] }),
}));
