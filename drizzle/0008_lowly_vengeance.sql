CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`broadcastId` int,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`challengeId` int NOT NULL,
	`claimedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`followerId` int NOT NULL,
	`followingId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_follows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `challenges` ADD `metric` enum('trips','distanceKm','elevationM','recordings') DEFAULT 'trips' NOT NULL;--> statement-breakpoint
ALTER TABLE `trail_catalog` ADD `maxElevationM` int;--> statement-breakpoint
ALTER TABLE `trail_catalog` ADD `routeType` enum('Loop','Out & Back','Point to Point') DEFAULT 'Loop' NOT NULL;--> statement-breakpoint
ALTER TABLE `trail_catalog` ADD `bestSeason` varchar(128);--> statement-breakpoint
ALTER TABLE `trail_catalog` ADD `routeData` json;--> statement-breakpoint
ALTER TABLE `users` ADD `dateOfBirth` varchar(16);