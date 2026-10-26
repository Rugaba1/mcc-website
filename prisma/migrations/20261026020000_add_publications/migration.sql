CREATE TABLE `publication` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(200) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `summary` VARCHAR(500) NOT NULL DEFAULT '',
  `content_markdown` LONGTEXT NOT NULL,
  `cover_image` TEXT NULL,
  `file_url` TEXT NULL,
  `placement` VARCHAR(24) NOT NULL DEFAULT 'PUBLIC_PAGE',
  `active` BOOLEAN NOT NULL DEFAULT false,
  `starts_at` DATETIME(3) NULL,
  `ends_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `publication_slug_key` (`slug`),
  INDEX `publication_active_placement_starts_at_ends_at_idx` (`active`, `placement`, `starts_at`, `ends_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
