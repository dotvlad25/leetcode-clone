CREATE TABLE `problem_stages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`problemId` int NOT NULL,
	`stageNumber` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text NOT NULL,
	`baseClass` text NOT NULL,
	`starterCode` text NOT NULL,
	`solution` text,
	`solutionExplanation` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `problem_stages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stage_test_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stageId` int NOT NULL,
	`problemId` int NOT NULL,
	`description` varchar(512) NOT NULL,
	`inputData` text NOT NULL,
	`expectedOutput` text NOT NULL,
	`orderIndex` int NOT NULL DEFAULT 0,
	CONSTRAINT `stage_test_cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `problems` MODIFY COLUMN `title` text NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` MODIFY COLUMN `testResults` text NOT NULL;--> statement-breakpoint
ALTER TABLE `problems` ADD `number` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `problems` ADD `solution` text;--> statement-breakpoint
ALTER TABLE `problems` ADD `solutionExplanation` text;--> statement-breakpoint
ALTER TABLE `problems` ADD `solutionVariants` text;--> statement-breakpoint
ALTER TABLE `problems` ADD `methodName` varchar(64) DEFAULT 'findDuplicate' NOT NULL;--> statement-breakpoint
ALTER TABLE `problems` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `problems` ADD `isStaged` int DEFAULT 0 NOT NULL;