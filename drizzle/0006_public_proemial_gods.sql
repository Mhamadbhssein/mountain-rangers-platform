CREATE TABLE `trip_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`userId` int NOT NULL,
	`tripId` int NOT NULL,
	`rating` int NOT NULL,
	`content` text NOT NULL,
	`postId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trip_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `trip_reviews_bookingId_unique` UNIQUE(`bookingId`)
);
