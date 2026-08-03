import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

/**
 * Core user table. Locally there is a single auto-provisioned user
 * (see server/_core/localUser.ts), but the table stays multi-user so
 * submissions and stage progress keep a real owner.
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const problems = sqliteTable("problems", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  number: integer("number").notNull().default(0),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  difficulty: text("difficulty", { enum: ["Easy", "Medium", "Hard"] }).notNull(),
  description: text("description").notNull(),
  starterCode: text("starterCode").notNull(),
  solution: text("solution"),
  solutionExplanation: text("solutionExplanation"),
  solutionVariants: text("solutionVariants"),
  methodName: text("methodName").default("findDuplicate").notNull(),
  tags: text("tags"),
  badges: text("badges"),
  frequency: integer("frequency"),
  isStaged: integer("isStaged").default(0).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const problemStages = sqliteTable("problem_stages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  problemId: integer("problemId").notNull(),
  stageNumber: integer("stageNumber").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  baseClass: text("baseClass").notNull(),
  starterCode: text("starterCode").notNull(),
  solution: text("solution"),
  solutionExplanation: text("solutionExplanation"),
  testFileContent: text("testFileContent"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const stageTestCases = sqliteTable("stage_test_cases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stageId: integer("stageId").notNull(),
  problemId: integer("problemId").notNull(),
  description: text("description").notNull(),
  inputData: text("inputData").notNull(),
  expectedOutput: text("expectedOutput").notNull(),
  orderIndex: integer("orderIndex").notNull().default(0),
});

export const testCases = sqliteTable("test_cases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  problemId: integer("problemId").notNull(),
  description: text("description").notNull(),
  inputData: text("inputData").notNull(),
  expectedOutput: text("expectedOutput").notNull(),
  orderIndex: integer("orderIndex").notNull().default(0),
});

export const submissions = sqliteTable("submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  problemId: integer("problemId").notNull(),
  code: text("code").notNull(),
  status: text("status", { enum: ["accepted", "wrong_answer", "error", "run"] }).notNull(),
  testResults: text("testResults").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const stageSubmissions = sqliteTable("stage_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  problemId: integer("problemId").notNull(),
  stageId: integer("stageId").notNull(),
  stageNumber: integer("stageNumber").notNull(),
  code: text("code").notNull(),
  status: text("status", { enum: ["accepted", "wrong_answer", "error"] }).notNull(),
  testResults: text("testResults").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
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
