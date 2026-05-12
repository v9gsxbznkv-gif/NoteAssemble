CREATE TABLE `actionItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`task` text NOT NULL,
	`priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`context` text,
	`owner` varchar(255),
	`completed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `actionItems_id` PRIMARY KEY(`id`)
);
