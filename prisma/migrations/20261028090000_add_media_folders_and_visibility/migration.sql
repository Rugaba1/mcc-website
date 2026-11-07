CREATE TABLE `media_folder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `media_folder_name_key` (`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `media_file`
    ADD COLUMN `is_public` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `folder_id` INTEGER NULL,
    ADD INDEX `media_file_folder_id_created_at_idx` (`folder_id`, `created_at`),
    ADD INDEX `media_file_is_public_created_at_idx` (`is_public`, `created_at`),
    ADD CONSTRAINT `media_file_folder_id_fkey`
        FOREIGN KEY (`folder_id`) REFERENCES `media_folder` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE;
