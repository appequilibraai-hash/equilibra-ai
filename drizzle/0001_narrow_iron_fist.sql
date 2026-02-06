CREATE TABLE `meals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(512),
	`mealType` enum('breakfast','lunch','dinner','snack') NOT NULL DEFAULT 'snack',
	`totalCalories` int DEFAULT 0,
	`totalProtein` decimal(6,2) DEFAULT '0',
	`totalCarbs` decimal(6,2) DEFAULT '0',
	`totalFat` decimal(6,2) DEFAULT '0',
	`totalFiber` decimal(6,2) DEFAULT '0',
	`totalSugar` decimal(6,2) DEFAULT '0',
	`totalSodium` decimal(6,2) DEFAULT '0',
	`detectedFoods` json,
	`detectedSauces` json,
	`detectedIngredients` json,
	`micronutrients` json,
	`analysisNotes` text,
	`mealTime` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dailyCalorieGoal` int NOT NULL DEFAULT 2000,
	`dailyProteinGoal` int DEFAULT 50,
	`dailyCarbsGoal` int DEFAULT 250,
	`dailyFatGoal` int DEFAULT 65,
	`dietaryPreferences` json,
	`allergies` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `userProfiles_userId_unique` UNIQUE(`userId`)
);
