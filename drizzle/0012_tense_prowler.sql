CREATE TABLE `todoCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `todoCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `todos` ADD `categoryId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `todos` ADD `sortOrder` int DEFAULT 0 NOT NULL;