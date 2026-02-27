CREATE TABLE `post_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `post_comments_id` PRIMARY KEY(`id`)
);
