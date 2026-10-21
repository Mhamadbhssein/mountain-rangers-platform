ALTER TABLE `broadcasts` MODIFY COLUMN `audience` enum('all','booked','members','admins','trip','user') NOT NULL DEFAULT 'all';--> statement-breakpoint
ALTER TABLE `broadcasts` ADD `type` enum('announcement','trip','offer','reminder','alert','booking','community','reward') DEFAULT 'announcement' NOT NULL;--> statement-breakpoint
ALTER TABLE `broadcasts` ADD `link` varchar(512);--> statement-breakpoint
ALTER TABLE `broadcasts` ADD `targetTripId` int;--> statement-breakpoint
ALTER TABLE `broadcasts` ADD `targetUserId` int;--> statement-breakpoint
ALTER TABLE `broadcasts` ADD `showPopup` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `broadcasts` ADD `showBanner` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `broadcasts` ADD `bannerExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `broadcasts` ADD `recipientCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` ADD `type` enum('announcement','trip','offer','reminder','alert','booking','community','reward') DEFAULT 'announcement' NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` ADD `link` varchar(512);--> statement-breakpoint
ALTER TABLE `notifications` ADD `showPopup` boolean DEFAULT false NOT NULL;