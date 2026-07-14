CREATE TABLE `stage_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`problemId` int NOT NULL,
	`stageId` int NOT NULL,
	`stageNumber` int NOT NULL,
	`code` text NOT NULL,
	`status` enum('accepted','wrong_answer','error') NOT NULL,
	`testResults` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stage_submissions_id` PRIMARY KEY(`id`)
);
