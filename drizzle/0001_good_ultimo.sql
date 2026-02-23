CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tripId` int NOT NULL,
	`passengers` int NOT NULL DEFAULT 1,
	`seats` json NOT NULL,
	`status` enum('confirmed','pending','completed','cancelled') NOT NULL DEFAULT 'confirmed',
	`referenceCode` varchar(16) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	`paymentMethod` varchar(64) DEFAULT 'Cash on Bus',
	`bookedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `bookings_referenceCode_unique` UNIQUE(`referenceCode`)
);
--> statement-breakpoint
CREATE TABLE `community_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tripTitle` varchar(255),
	`content` text NOT NULL,
	`images` json,
	`likesCount` int NOT NULL DEFAULT 0,
	`commentsCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `community_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loyalty` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`points` int NOT NULL DEFAULT 0,
	`level` enum('Explorer','Trail Blazer','Summit Seeker','Mountain Legend') NOT NULL DEFAULT 'Explorer',
	`tripsCompleted` int NOT NULL DEFAULT 0,
	`badges` json,
	`nfcCardRequested` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loyalty_id` PRIMARY KEY(`id`),
	CONSTRAINT `loyalty_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `post_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `post_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`location` varchar(255) NOT NULL,
	`date` timestamp NOT NULL,
	`time` varchar(32) NOT NULL,
	`duration` varchar(64) NOT NULL,
	`difficulty` enum('Easy','Moderate','Hard','Expert') NOT NULL DEFAULT 'Moderate',
	`price` decimal(10,2) NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'USD',
	`imageUrl` text,
	`description` text,
	`highlights` json,
	`included` json,
	`meetingPoint` varchar(255),
	`totalSeats` int NOT NULL DEFAULT 24,
	`rating` decimal(3,2) DEFAULT '0',
	`reviewCount` int DEFAULT 0,
	`elevation` varchar(32),
	`distance` varchar(32),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);