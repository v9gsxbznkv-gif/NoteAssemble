CREATE TABLE `todos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`text` text NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`dueDate` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `todos_id` PRIMARY KEY(`id`)
);
