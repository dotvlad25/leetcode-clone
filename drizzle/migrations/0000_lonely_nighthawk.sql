CREATE TABLE `problem_stages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`problemId` integer NOT NULL,
	`stageNumber` integer NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`baseClass` text NOT NULL,
	`starterCode` text NOT NULL,
	`solution` text,
	`solutionExplanation` text,
	`testFileContent` text,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `problems` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`number` integer DEFAULT 0 NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`difficulty` text NOT NULL,
	`description` text NOT NULL,
	`starterCode` text NOT NULL,
	`solution` text,
	`solutionExplanation` text,
	`solutionVariants` text,
	`methodName` text DEFAULT 'findDuplicate' NOT NULL,
	`tags` text,
	`badges` text,
	`frequency` integer,
	`isStaged` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `problems_slug_unique` ON `problems` (`slug`);--> statement-breakpoint
CREATE TABLE `stage_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`problemId` integer NOT NULL,
	`stageId` integer NOT NULL,
	`stageNumber` integer NOT NULL,
	`code` text NOT NULL,
	`status` text NOT NULL,
	`testResults` text NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stage_test_cases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stageId` integer NOT NULL,
	`problemId` integer NOT NULL,
	`description` text NOT NULL,
	`inputData` text NOT NULL,
	`expectedOutput` text NOT NULL,
	`orderIndex` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`problemId` integer NOT NULL,
	`code` text NOT NULL,
	`status` text NOT NULL,
	`testResults` text NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `test_cases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`problemId` integer NOT NULL,
	`description` text NOT NULL,
	`inputData` text NOT NULL,
	`expectedOutput` text NOT NULL,
	`orderIndex` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`lastSignedIn` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);