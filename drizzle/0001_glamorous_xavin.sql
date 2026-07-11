CREATE TABLE `problems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(128) NOT NULL,
	`title` varchar(256) NOT NULL,
	`difficulty` enum('Easy','Medium','Hard') NOT NULL,
	`description` text NOT NULL,
	`starterCode` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `problems_id` PRIMARY KEY(`id`),
	CONSTRAINT `problems_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`problemId` int NOT NULL,
	`code` text NOT NULL,
	`status` enum('accepted','wrong_answer','error','run') NOT NULL,
	`testResults` text NOT NULL DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `test_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`problemId` int NOT NULL,
	`description` varchar(512) NOT NULL,
	`inputData` text NOT NULL,
	`expectedOutput` text NOT NULL,
	`orderIndex` int NOT NULL DEFAULT 0,
	CONSTRAINT `test_cases_id` PRIMARY KEY(`id`)
);
