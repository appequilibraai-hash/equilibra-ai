ALTER TABLE `userProfiles` MODIFY COLUMN `activityType` text;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `activityFrequencies` json;