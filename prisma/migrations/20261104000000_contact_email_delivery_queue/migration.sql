CREATE TABLE `contact_email_delivery` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contact_message_id` INTEGER NOT NULL,
    `type` ENUM('ACKNOWLEDGEMENT', 'STAFF_ALERT') NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `available_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `locked_until` DATETIME(3) NULL,
    `last_attempt_at` DATETIME(3) NULL,
    `delivered_at` DATETIME(3) NULL,
    `last_error` VARCHAR(80) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `contact_email_delivery_contact_message_id_type_key` (`contact_message_id`, `type`),
    INDEX `contact_email_delivery_status_available_at_idx` (`status`, `available_at`),
    PRIMARY KEY (`id`),
    CONSTRAINT `contact_email_delivery_contact_message_id_fkey`
      FOREIGN KEY (`contact_message_id`) REFERENCES `contact_message` (`id`)
      ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
