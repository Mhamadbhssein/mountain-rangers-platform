ALTER TABLE `trips` MODIFY COLUMN `totalSeats` int NOT NULL DEFAULT 27;--> statement-breakpoint
ALTER TABLE `bookings` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `bookings` ADD `hikingSticks` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `trips` ADD `additionalImages` json;--> statement-breakpoint
ALTER TABLE `trips` ADD `meetingPointLat` float;--> statement-breakpoint
ALTER TABLE `trips` ADD `meetingPointLng` float;