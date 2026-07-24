CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`scope` text NOT NULL,
	`scope_ref` text DEFAULT '' NOT NULL,
	`title_en` text NOT NULL,
	`title_ar` text DEFAULT '' NOT NULL,
	`excerpt_en` text DEFAULT '' NOT NULL,
	`excerpt_ar` text DEFAULT '' NOT NULL,
	`body_en` text DEFAULT '' NOT NULL,
	`body_ar` text DEFAULT '' NOT NULL,
	`cover_image` text DEFAULT '' NOT NULL,
	`author_name` text NOT NULL,
	`author_photo` text DEFAULT '' NOT NULL,
	`author_phone` text DEFAULT '' NOT NULL,
	`published` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_slug_unique` ON `articles` (`slug`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
