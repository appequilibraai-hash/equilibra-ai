CREATE TABLE `weightHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weight` decimal(5,2) NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weightHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `sex` enum('male','female','other');--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `birthDate` date;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `height` int;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `currentWeight` decimal(5,2);--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `targetWeight` decimal(5,2);--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `activityType` enum('sedentary','football','gym','basketball','dance','running','swimming','cycling','other');--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `activityLevel` enum('sedentary','light','moderate','active','very_active') DEFAULT 'moderate';--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingCompleted` int DEFAULT 0 NOT NULL;