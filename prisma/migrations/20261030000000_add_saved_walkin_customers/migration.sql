CREATE TABLE `saved_customer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(120) NOT NULL,
    `last_name` VARCHAR(120) NULL,
    `email` VARCHAR(255) NULL,
    `phone_number` VARCHAR(30) NOT NULL,
    `tin` VARCHAR(9) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `saved_customer_email_idx`(`email`),
    INDEX `saved_customer_phone_number_idx`(`phone_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `order`
    ADD COLUMN `savedCustomerId` INTEGER NULL,
    ADD INDEX `order_savedCustomerId_idx`(`savedCustomerId`),
    ADD CONSTRAINT `order_savedCustomerId_fkey`
        FOREIGN KEY (`savedCustomerId`) REFERENCES `saved_customer`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO `saved_customer` (
    `first_name`,
    `last_name`,
    `email`,
    `phone_number`,
    `tin`,
    `created_at`,
    `updated_at`
)
SELECT
    MIN(LEFT(SUBSTRING_INDEX(COALESCE(NULLIF(TRIM(`shipFullName`), ''), 'Walk-in customer'), ' ', 1), 120)),
    MIN(
        NULLIF(
            LEFT(
                TRIM(
                    SUBSTRING(
                        COALESCE(NULLIF(TRIM(`shipFullName`), ''), 'Walk-in customer'),
                        CHAR_LENGTH(SUBSTRING_INDEX(COALESCE(NULLIF(TRIM(`shipFullName`), ''), 'Walk-in customer'), ' ', 1)) + 1
                    )
                ),
                120
            ),
            ''
        )
    ),
    MAX(NULLIF(TRIM(`guestEmail`), '')),
    MAX(COALESCE(NULLIF(TRIM(`guestPhone`), ''), TRIM(`shipPhone`))),
    MAX(`tin`),
    MIN(`placedAt`),
    CURRENT_TIMESTAMP(3)
FROM `order`
WHERE `userId` IS NULL
  AND COALESCE(NULLIF(TRIM(`guestPhone`), ''), NULLIF(TRIM(`shipPhone`), '')) IS NOT NULL
GROUP BY CASE
    WHEN NULLIF(TRIM(`guestEmail`), '') IS NOT NULL
        THEN CONCAT('email:', LOWER(TRIM(`guestEmail`)))
    ELSE CONCAT('phone:', COALESCE(NULLIF(TRIM(`guestPhone`), ''), TRIM(`shipPhone`)))
END;

UPDATE `order` AS o
JOIN `saved_customer` AS c
    ON (
        NULLIF(TRIM(o.`guestEmail`), '') IS NOT NULL
        AND LOWER(TRIM(c.`email`)) = LOWER(TRIM(o.`guestEmail`))
    )
    OR (
        NULLIF(TRIM(o.`guestEmail`), '') IS NULL
        AND c.`email` IS NULL
        AND c.`phone_number` = COALESCE(NULLIF(TRIM(o.`guestPhone`), ''), TRIM(o.`shipPhone`))
    )
SET o.`savedCustomerId` = c.`id`
WHERE o.`userId` IS NULL;
