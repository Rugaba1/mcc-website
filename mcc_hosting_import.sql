/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.5.2-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: mcc_dev
-- ------------------------------------------------------
-- Server version	11.5.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `_roletouser`
--

DROP TABLE IF EXISTS `_roletouser`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_roletouser` (
  `A` int(11) NOT NULL,
  `B` int(11) NOT NULL,
  UNIQUE KEY `_RoleToUser_AB_unique` (`A`,`B`),
  KEY `_RoleToUser_B_index` (`B`),
  CONSTRAINT `_RoleToUser_A_fkey` FOREIGN KEY (`A`) REFERENCES `role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `_RoleToUser_B_fkey` FOREIGN KEY (`B`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_roletouser`
--

LOCK TABLES `_roletouser` WRITE;
/*!40000 ALTER TABLE `_roletouser` DISABLE KEYS */;
INSERT INTO `_roletouser` VALUES
(8,1),
(2,3),
(8,7),
(8,8);
/*!40000 ALTER TABLE `_roletouser` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `addresses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `label` varchar(50) DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `country` varchar(100) NOT NULL DEFAULT 'Rwanda',
  `province` varchar(100) DEFAULT NULL,
  `district` varchar(100) NOT NULL,
  `sector` varchar(100) DEFAULT NULL,
  `street` varchar(255) NOT NULL,
  `notes` text DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `addresses_user_id_idx` (`user_id`),
  CONSTRAINT `addresses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_notification_reads`
--

DROP TABLE IF EXISTS `admin_notification_reads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_notification_reads` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `read_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`notification_id`,`user_id`),
  KEY `admin_notification_reads_user_id_read_at_idx` (`user_id`,`read_at`),
  CONSTRAINT `admin_notification_reads_notification_id_fkey` FOREIGN KEY (`notification_id`) REFERENCES `admin_notifications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `admin_notification_reads_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_notification_reads`
--

LOCK TABLES `admin_notification_reads` WRITE;
/*!40000 ALTER TABLE `admin_notification_reads` DISABLE KEYS */;
INSERT INTO `admin_notification_reads` VALUES
(1,3,'2026-10-25 02:36:31.144');
/*!40000 ALTER TABLE `admin_notification_reads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_notifications`
--

DROP TABLE IF EXISTS `admin_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(40) NOT NULL,
  `required_permission` varchar(80) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` varchar(500) DEFAULT NULL,
  `target_path` varchar(500) NOT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `admin_notifications_required_permission_id_idx` (`required_permission`,`id`),
  KEY `admin_notifications_created_at_idx` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_notifications`
--

LOCK TABLES `admin_notifications` WRITE;
/*!40000 ALTER TABLE `admin_notifications` DISABLE KEYS */;
INSERT INTO `admin_notifications` VALUES
(1,'order','orders.view','New order placed','MCC-20261025-764799 · RWF 94990','/admin/orders',9,'2026-10-25 02:34:24.523');
/*!40000 ALTER TABLE `admin_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blog_post`
--

DROP TABLE IF EXISTS `blog_post`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `blog_post` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(200) NOT NULL,
  `locale` varchar(5) NOT NULL DEFAULT 'en',
  `title` varchar(255) NOT NULL,
  `excerpt` varchar(500) DEFAULT NULL,
  `content` longtext NOT NULL,
  `coverImage` text DEFAULT NULL,
  `coverAlt` varchar(255) DEFAULT NULL,
  `tags` varchar(255) DEFAULT NULL,
  `readingMinutes` int(11) NOT NULL DEFAULT 1,
  `status` enum('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `featured` tinyint(1) NOT NULL DEFAULT 0,
  `seoTitle` varchar(255) DEFAULT NULL,
  `seoDescription` varchar(500) DEFAULT NULL,
  `authorId` int(11) DEFAULT NULL,
  `publishedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `blog_post_slug_key` (`slug`),
  KEY `blog_post_status_publishedAt_idx` (`status`,`publishedAt`),
  KEY `blog_post_locale_status_publishedAt_idx` (`locale`,`status`,`publishedAt`),
  KEY `blog_post_authorId_fkey` (`authorId`),
  CONSTRAINT `blog_post_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blog_post`
--

LOCK TABLES `blog_post` WRITE;
/*!40000 ALTER TABLE `blog_post` DISABLE KEYS */;
/*!40000 ALTER TABLE `blog_post` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart`
--

DROP TABLE IF EXISTS `cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cart` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `sessionId` varchar(100) DEFAULT NULL,
  `couponId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cart_userId_key` (`userId`),
  UNIQUE KEY `cart_sessionId_key` (`sessionId`),
  KEY `cart_couponId_fkey` (`couponId`),
  CONSTRAINT `cart_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupon` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `cart_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart`
--

LOCK TABLES `cart` WRITE;
/*!40000 ALTER TABLE `cart` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cartitem`
--

DROP TABLE IF EXISTS `cartitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cartitem` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cartId` int(11) NOT NULL,
  `variantId` int(11) NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 1.00,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `saleType` enum('SQM','CONTAINER') NOT NULL DEFAULT 'SQM',
  PRIMARY KEY (`id`),
  UNIQUE KEY `cartitem_cartId_variantId_saleType_key` (`cartId`,`variantId`,`saleType`),
  KEY `cartitem_variantId_fkey` (`variantId`),
  CONSTRAINT `cartitem_cartId_fkey` FOREIGN KEY (`cartId`) REFERENCES `cart` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cartitem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `productvariant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cartitem`
--

LOCK TABLES `cartitem` WRITE;
/*!40000 ALTER TABLE `cartitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `cartitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `catalogue`
--

DROP TABLE IF EXISTS `catalogue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `catalogue` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(191) NOT NULL,
  `description` text NOT NULL,
  `coverImage` text NOT NULL,
  `fileUrl` text NOT NULL,
  `category` varchar(191) NOT NULL DEFAULT 'general',
  `year` varchar(191) NOT NULL DEFAULT '',
  `published` tinyint(1) NOT NULL DEFAULT 1,
  `featured` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `catalogue`
--

LOCK TABLES `catalogue` WRITE;
/*!40000 ALTER TABLE `catalogue` DISABLE KEYS */;
INSERT INTO `catalogue` VALUES
(1,'mcc','','/uploads/images/324b4021-301c-4541-aac0-bbef020d7eb6.jpg','/uploads/files/b76ea890-9e92-457a-8795-8ccd45b53db3.pdf','product catalogue','2026',1,0,'2026-10-26 02:09:00.058','2026-10-26 02:09:00.058');
/*!40000 ALTER TABLE `catalogue` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `category` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `slug` varchar(160) NOT NULL,
  `description` text DEFAULT NULL,
  `image` text DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `category_slug_key` (`slug`),
  KEY `category_parent_id_fkey` (`parent_id`),
  CONSTRAINT `category_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `checkout_reservation_items`
--

DROP TABLE IF EXISTS `checkout_reservation_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `checkout_reservation_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reservation_id` int(11) NOT NULL,
  `variant_id` int(11) NOT NULL,
  `quantity_sqm` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `checkout_reservation_items_reservation_id_variant_id_key` (`reservation_id`,`variant_id`),
  KEY `checkout_reservation_items_variant_id_idx` (`variant_id`),
  CONSTRAINT `checkout_reservation_items_reservation_id_fkey` FOREIGN KEY (`reservation_id`) REFERENCES `checkout_reservations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `checkout_reservation_items_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `productvariant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checkout_reservation_items`
--

LOCK TABLES `checkout_reservation_items` WRITE;
/*!40000 ALTER TABLE `checkout_reservation_items` DISABLE KEYS */;
INSERT INTO `checkout_reservation_items` VALUES
(1,1,67,10.00),
(2,2,67,10.00);
/*!40000 ALTER TABLE `checkout_reservation_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `checkout_reservations`
--

DROP TABLE IF EXISTS `checkout_reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `checkout_reservations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token_hash` varchar(64) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `expires_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `checkout_reservations_token_hash_key` (`token_hash`),
  KEY `checkout_reservations_status_expires_at_idx` (`status`,`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checkout_reservations`
--

LOCK TABLES `checkout_reservations` WRITE;
/*!40000 ALTER TABLE `checkout_reservations` DISABLE KEYS */;
INSERT INTO `checkout_reservations` VALUES
(1,'f05c6af1ec2fdd89626cabd288399fe41ed25c4236162f58935d906b1125492e','RELEASED','2026-10-25 01:30:29.630','2026-10-25 01:15:30.523','2026-10-25 02:33:48.395'),
(2,'9e87a0aef501e07eedfa3dc919eb955d68a98b666ee9d16b14e72fe424c11b59','CONSUMED','2026-10-25 02:48:48.316','2026-10-25 02:33:48.625','2026-10-25 02:34:24.514');
/*!40000 ALTER TABLE `checkout_reservations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `collection`
--

DROP TABLE IF EXISTS `collection`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `collection` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `description` text NOT NULL,
  `image` text NOT NULL,
  `featured` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `slug` varchar(160) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `collection_name_key` (`name`),
  UNIQUE KEY `collection_slug_key` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `collection`
--

LOCK TABLES `collection` WRITE;
/*!40000 ALTER TABLE `collection` DISABLE KEYS */;
INSERT INTO `collection` VALUES
(1,'Terrain Series','Natural earth-tone finishes inspired by rocky landscapes. Ideal for living spaces, corridors and outdoor areas.','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80',1,'2026-09-18 10:17:32.343','2026-09-18 10:17:32.343',NULL),
(2,'Azure Collection','Cool blues and clean whites — subway-style and metro tiles for kitchens, bathrooms, and feature walls.','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=80',0,'2026-09-18 10:17:32.356','2026-09-18 10:17:32.356',NULL),
(3,'Onyx Prestige','Dark, dramatic surfaces with authentic marble veining. For spaces that demand a premium statement.','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=80',1,'2026-09-18 10:17:32.370','2026-09-18 10:17:32.370',NULL),
(4,'Gold & Ivory Classics','Timeless warmth. Metallic glazes and travertine effects that bring elegance to any interior.','https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=900&q=80',0,'2026-09-18 10:17:32.381','2026-09-18 10:17:32.381',NULL);
/*!40000 ALTER TABLE `collection` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `collectionitem`
--

DROP TABLE IF EXISTS `collectionitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `collectionitem` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `collectionId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `collectionitem_collectionId_productId_key` (`collectionId`,`productId`),
  KEY `collectionitem_productId_fkey` (`productId`),
  CONSTRAINT `collectionitem_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `collection` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `collectionitem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `collectionitem`
--

LOCK TABLES `collectionitem` WRITE;
/*!40000 ALTER TABLE `collectionitem` DISABLE KEYS */;
INSERT INTO `collectionitem` VALUES
(1,1,1),
(2,1,4),
(3,2,2),
(4,3,3),
(5,4,5),
(6,4,6);
/*!40000 ALTER TABLE `collectionitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_email_delivery`
--

DROP TABLE IF EXISTS `contact_email_delivery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contact_email_delivery` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `contact_message_id` int(11) NOT NULL,
  `type` enum('ACKNOWLEDGEMENT','STAFF_ALERT') NOT NULL,
  `status` enum('PENDING','PROCESSING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
  `attempts` int(11) NOT NULL DEFAULT 0,
  `available_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `locked_until` datetime(3) DEFAULT NULL,
  `last_attempt_at` datetime(3) DEFAULT NULL,
  `delivered_at` datetime(3) DEFAULT NULL,
  `last_error` varchar(80) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `contact_email_delivery_contact_message_id_type_key` (`contact_message_id`,`type`),
  KEY `contact_email_delivery_status_available_at_idx` (`status`,`available_at`),
  CONSTRAINT `contact_email_delivery_contact_message_id_fkey` FOREIGN KEY (`contact_message_id`) REFERENCES `contact_message` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_email_delivery`
--

LOCK TABLES `contact_email_delivery` WRITE;
/*!40000 ALTER TABLE `contact_email_delivery` DISABLE KEYS */;
/*!40000 ALTER TABLE `contact_email_delivery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_message`
--

DROP TABLE IF EXISTS `contact_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contact_message` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `firstName` varchar(80) NOT NULL,
  `lastName` varchar(80) NOT NULL,
  `email` varchar(254) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `projectType` varchar(40) DEFAULT NULL,
  `message` text NOT NULL,
  `status` enum('NEW','READ','REPLIED','ARCHIVED') NOT NULL DEFAULT 'NEW',
  `ackSentAt` datetime(3) DEFAULT NULL,
  `replyText` text DEFAULT NULL,
  `repliedAt` datetime(3) DEFAULT NULL,
  `repliedById` int(11) DEFAULT NULL,
  `ipHash` varchar(64) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `contact_message_status_createdAt_idx` (`status`,`createdAt`),
  KEY `contact_message_email_createdAt_idx` (`email`,`createdAt`),
  KEY `contact_message_ipHash_createdAt_idx` (`ipHash`,`createdAt`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_message`
--

LOCK TABLES `contact_message` WRITE;
/*!40000 ALTER TABLE `contact_message` DISABLE KEYS */;
INSERT INTO `contact_message` VALUES
(1,'Manzi Enock','IMPANO','impanomanzienock@gmail.com','+250791105800','Commercial','nnnnnnnnnn','ARCHIVED',NULL,NULL,NULL,NULL,'ccae132e8dc61298d98098c1764f88eb3b539e742229b20220d1c2a78d3a0939','2026-10-18 01:00:39.276');
/*!40000 ALTER TABLE `contact_message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupon`
--

DROP TABLE IF EXISTS `coupon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `coupon` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `type` enum('PERCENT','FIXED') NOT NULL,
  `value` decimal(12,2) NOT NULL,
  `minOrderAmount` decimal(12,2) DEFAULT NULL,
  `maxUses` int(11) DEFAULT NULL,
  `usedCount` int(11) NOT NULL DEFAULT 0,
  `startsAt` datetime(3) DEFAULT NULL,
  `expiresAt` datetime(3) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `coupon_code_key` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupon`
--

LOCK TABLES `coupon` WRITE;
/*!40000 ALTER TABLE `coupon` DISABLE KEYS */;
INSERT INTO `coupon` VALUES
(1,'MCC-W4UE-WCGB-9RE6',NULL,'PERCENT',30.00,NULL,NULL,1,'2026-10-07 22:00:00.000','2026-10-30 22:00:00.000',1,'2026-10-25 02:33:21.743');
/*!40000 ALTER TABLE `coupon` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `currency`
--

DROP TABLE IF EXISTS `currency`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `currency` (
  `code` varchar(3) NOT NULL,
  `name` varchar(80) NOT NULL,
  `symbol` varchar(8) NOT NULL,
  `decimal_digits` int(11) NOT NULL DEFAULT 2,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `is_base` tinyint(1) NOT NULL DEFAULT 0,
  `rate_to_base` decimal(20,10) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`code`),
  KEY `currency_enabled_idx` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currency`
--

LOCK TABLES `currency` WRITE;
/*!40000 ALTER TABLE `currency` DISABLE KEYS */;
INSERT INTO `currency` VALUES
('RWF','Rwandan franc','FRw',0,1,1,1.0000000000,'2026-10-24 14:33:04.021','2026-10-24 14:33:04.021'),
('USD','UD Dollar','$',2,1,0,1450.0000000000,'2026-10-24 18:30:47.533','2026-10-24 18:30:47.533');
/*!40000 ALTER TABLE `currency` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deliveryzone`
--

DROP TABLE IF EXISTS `deliveryzone`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deliveryzone` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `districts` text NOT NULL,
  `baseFee` decimal(12,2) NOT NULL,
  `feePerBox` decimal(65,30) NOT NULL,
  `freeOverAmount` decimal(12,2) DEFAULT NULL,
  `estimatedDays` int(11) NOT NULL DEFAULT 2,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deliveryzone`
--

LOCK TABLES `deliveryzone` WRITE;
/*!40000 ALTER TABLE `deliveryzone` DISABLE KEYS */;
/*!40000 ALTER TABLE `deliveryzone` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_blocklist`
--

DROP TABLE IF EXISTS `email_blocklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `email_blocklist` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `reason` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `created_by_id` int(11) DEFAULT NULL,
  `revoked_at` datetime(3) DEFAULT NULL,
  `revoked_by_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_blocklist_email_key` (`email`),
  KEY `email_blocklist_is_active_created_at_idx` (`is_active`,`created_at`),
  KEY `email_blocklist_created_by_id_fkey` (`created_by_id`),
  KEY `email_blocklist_revoked_by_id_fkey` (`revoked_by_id`),
  CONSTRAINT `email_blocklist_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `email_blocklist_revoked_by_id_fkey` FOREIGN KEY (`revoked_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_blocklist`
--

LOCK TABLES `email_blocklist` WRITE;
/*!40000 ALTER TABLE `email_blocklist` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_blocklist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_blocklist_events`
--

DROP TABLE IF EXISTS `email_blocklist_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `email_blocklist_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `action` enum('BLOCKED','UNBLOCKED') NOT NULL,
  `reason` varchar(500) DEFAULT NULL,
  `actor_user_id` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `email_blocklist_events_email_created_at_idx` (`email`,`created_at`),
  KEY `email_blocklist_events_actor_user_id_idx` (`actor_user_id`),
  CONSTRAINT `email_blocklist_events_actor_user_id_fkey` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_blocklist_events`
--

LOCK TABLES `email_blocklist_events` WRITE;
/*!40000 ALTER TABLE `email_blocklist_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_blocklist_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `forgetpasswordrequest`
--

DROP TABLE IF EXISTS `forgetpasswordrequest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `forgetpasswordrequest` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `codeHash` varchar(191) NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `attempts` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `ForgetPasswordRequest_userId_idx` (`userId`),
  CONSTRAINT `ForgetPasswordRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `forgetpasswordrequest`
--

LOCK TABLES `forgetpasswordrequest` WRITE;
/*!40000 ALTER TABLE `forgetpasswordrequest` DISABLE KEYS */;
/*!40000 ALTER TABLE `forgetpasswordrequest` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `variantId` int(11) NOT NULL,
  `onHandBoxes` decimal(65,30) NOT NULL,
  `reservedBoxes` decimal(65,30) NOT NULL,
  `reorderLevel` decimal(12,2) NOT NULL DEFAULT 0.00,
  `allowBackorder` tinyint(1) NOT NULL DEFAULT 0,
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `inventory_variantId_key` (`variantId`),
  CONSTRAINT `inventory_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `productvariant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
INSERT INTO `inventory` VALUES
(1,1,200.000000000000000000000000000000,22.000000000000000000000000000000,20.00,0,'2026-10-15 21:53:26.722'),
(2,2,200.000000000000000000000000000000,0.000000000000000000000000000000,20.00,0,'2026-10-15 21:53:26.763'),
(3,3,200.000000000000000000000000000000,13.000000000000000000000000000000,20.00,0,'2026-10-15 21:53:26.799'),
(4,4,200.000000000000000000000000000000,2.000000000000000000000000000000,20.00,0,'2026-10-15 21:53:26.835'),
(5,5,200.000000000000000000000000000000,121.000000000000000000000000000000,20.00,0,'2026-10-15 21:53:26.866'),
(6,6,200.000000000000000000000000000000,0.000000000000000000000000000000,20.00,0,'2026-10-15 21:53:26.903'),
(7,7,200.000000000000000000000000000000,1.000000000000000000000000000000,20.00,0,'2026-10-15 21:53:26.943'),
(8,8,200.000000000000000000000000000000,1.000000000000000000000000000000,20.00,0,'2026-10-15 21:53:26.980'),
(9,9,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.034'),
(10,10,600.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-22 08:56:43.945'),
(11,11,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.083'),
(12,12,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.134'),
(13,13,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.154'),
(14,14,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.185'),
(15,15,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.213'),
(16,16,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.240'),
(17,17,350.000000000000000000000000000000,4.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.272'),
(18,18,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.294'),
(19,19,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.329'),
(20,20,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.351'),
(21,21,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.379'),
(22,22,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.398'),
(23,23,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.430'),
(24,24,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.456'),
(25,25,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.494'),
(26,26,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.527'),
(27,27,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.551'),
(28,28,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.587'),
(29,29,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.612'),
(30,30,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.633'),
(31,31,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.684'),
(32,32,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.701'),
(33,33,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.718'),
(34,34,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.750'),
(35,35,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.770'),
(36,36,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.801'),
(37,37,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.822'),
(38,38,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.852'),
(39,39,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.873'),
(40,40,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.896'),
(41,41,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.911'),
(42,42,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.939'),
(43,43,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.967'),
(44,44,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:27.985'),
(45,45,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.015'),
(46,46,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.046'),
(47,47,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.220'),
(48,48,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.264'),
(49,49,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.300'),
(50,50,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.322'),
(51,51,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.351'),
(52,52,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.370'),
(53,53,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.396'),
(54,54,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.424'),
(55,55,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.443'),
(56,56,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.476'),
(57,57,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.493'),
(58,58,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.519'),
(59,59,350.000000000000000000000000000000,10.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.544'),
(60,60,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.558'),
(61,61,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.588'),
(62,62,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.614'),
(63,63,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.641'),
(64,64,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.659'),
(65,65,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.682'),
(66,66,350.000000000000000000000000000000,0.000000000000000000000000000000,25.00,0,'2026-10-15 21:53:28.700'),
(67,67,70.000000000000000000000000000000,11.000000000000000000000000000000,0.00,0,'2026-10-25 02:33:48.413'),
(68,69,0.000000000000000000000000000000,0.000000000000000000000000000000,0.00,0,'2026-10-22 20:28:16.233');
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice`
--

DROP TABLE IF EXISTS `invoice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invoice` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orderId` int(11) NOT NULL,
  `kind` enum('PROFORMA','INVOICE','CREDIT_NOTE') NOT NULL,
  `number` varchar(40) NOT NULL,
  `fileKey` varchar(64) NOT NULL,
  `sha256` varchar(64) NOT NULL,
  `sizeBytes` int(11) NOT NULL,
  `total` decimal(12,2) NOT NULL,
  `currency` varchar(3) NOT NULL,
  `issuedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number_key` (`number`),
  UNIQUE KEY `invoice_fileKey_key` (`fileKey`),
  UNIQUE KEY `invoice_orderId_kind_key` (`orderId`,`kind`),
  KEY `invoice_orderId_idx` (`orderId`),
  CONSTRAINT `invoice_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice`
--

LOCK TABLES `invoice` WRITE;
/*!40000 ALTER TABLE `invoice` DISABLE KEYS */;
INSERT INTO `invoice` VALUES
(1,1,'INVOICE','INV-20261018-205190','cae0b202639c8a25667d9cd02ffc7464.pdf','e4bdbe581d96beee8a4803ab00867491610b05572480f37b3d65665d57025bd7',206516,192010.00,'RWF','2026-10-22 00:02:48.049'),
(2,2,'PROFORMA','PF-20261021-952507','acbb55a48639bf003f95030231769022.pdf','cd1500f2b12323db20769eb7cfa0768b155f2777bd06cfbc51ba1603952093fd',210697,243410.00,'RWF','2026-10-22 00:14:49.386'),
(3,7,'PROFORMA','PF-20261022-365464','e92819e221706b8efd6689b7966ae4c4.pdf','7a6cfb822f0a4deffe109427ba02a957c5ced036ebfb31e346b0c2db23d178bf',206773,236000.00,'RWF','2026-10-22 22:09:46.354'),
(4,5,'INVOICE','INV-20261022-495692','28a257a8e6ea80202398f2889efe1390.pdf','f6f7a824ae2e41d5494a3ce3703e65e91b8641d6345ea598cf20cc69e78095a6',205453,236000.00,'RWF','2026-10-22 22:14:42.224'),
(5,7,'INVOICE','INV-20261022-365464','347e30789a6c72da5cb599f95fb279a6.pdf','032f210f776c56c1577f1de253d2e9455036f65bee9b17e071f5ff2c65a92cca',205499,236000.00,'RWF','2026-10-22 22:14:59.260'),
(6,6,'INVOICE','INV-20261022-799561','e8fedfa2d2bf8d822cee6e7baba17ab6.pdf','5ba486962cdf0940bde6e618674d17cc3585e6bf0b6152129d09d918fb0b7419',205631,236000.00,'RWF','2026-10-22 22:19:07.557'),
(7,4,'INVOICE','INV-20261022-358890','d694ad3d55c4bff0658c24c81480cde1.pdf','58d3215aea24fe92ec6b434a0754bedebfe2936df6d33d590f759e18d4248b21',205937,2619600.00,'RWF','2026-10-22 22:23:06.609'),
(8,8,'PROFORMA','PF-20261023-684278','128fbe673ac2f0d9180d986b2983bb8c.pdf','989b442e9749584c74dad783780df2844dc243da5ee68dcbe13158e35e610624',207733,520970.00,'RWF','2026-10-23 03:42:20.550'),
(9,8,'INVOICE','INV-20261023-684278','4a6a12b7bf3c6baec58d64f97d208597.pdf','3cd49138d998391adb553df22176c7b6b8b182a5ba8f83544f4f688d9ad3190d',206242,520970.00,'RWF','2026-10-23 04:07:18.596'),
(10,9,'PROFORMA','PF-20261025-764799','00232454e9ce0a50b71b7ff328c196a7.pdf','35441017679815041414466627c844dd7abfd180adf4b5f92ab15eae487e1d7a',208307,94990.00,'RWF','2026-10-25 02:34:25.794'),
(11,9,'INVOICE','INV-20261025-764799','2bf70804431684af9083aa8b22e9881d.pdf','e4759f9406b1d6e9f0499ee96cdf6a1e7ee5604224b6e50e1b9f02beb1ada4cb',207526,94990.00,'RWF','2026-10-26 21:21:18.962');
/*!40000 ALTER TABLE `invoice` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `legal_acceptances`
--

DROP TABLE IF EXISTS `legal_acceptances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `legal_acceptances` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `legal_version_id` int(11) NOT NULL,
  `accepted_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `ip` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `legal_acceptances_user_id_legal_version_id_key` (`user_id`,`legal_version_id`),
  KEY `legal_acceptances_legal_version_id_accepted_at_idx` (`legal_version_id`,`accepted_at`),
  CONSTRAINT `legal_acceptances_legal_version_id_fkey` FOREIGN KEY (`legal_version_id`) REFERENCES `legal_document_versions` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `legal_acceptances_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `legal_acceptances`
--

LOCK TABLES `legal_acceptances` WRITE;
/*!40000 ALTER TABLE `legal_acceptances` DISABLE KEYS */;
/*!40000 ALTER TABLE `legal_acceptances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `legal_document_versions`
--

DROP TABLE IF EXISTS `legal_document_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `legal_document_versions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `document_type` enum('TERMS_AND_CONDITIONS','TERMS_OF_SERVICE','PRIVACY_POLICY') NOT NULL,
  `version` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `title_fr` varchar(255) NOT NULL,
  `title_rw` varchar(255) NOT NULL,
  `content_markdown` longtext NOT NULL,
  `content_markdown_fr` longtext NOT NULL,
  `content_markdown_rw` longtext NOT NULL,
  `created_by_id` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `published_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `legal_document_versions_document_type_version_key` (`document_type`,`version`),
  KEY `legal_document_versions_document_type_published_at_version_idx` (`document_type`,`published_at`,`version`),
  KEY `legal_document_versions_created_by_id_fkey` (`created_by_id`),
  CONSTRAINT `legal_document_versions_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `legal_document_versions`
--

LOCK TABLES `legal_document_versions` WRITE;
/*!40000 ALTER TABLE `legal_document_versions` DISABLE KEYS */;
INSERT INTO `legal_document_versions` VALUES
(1,'TERMS_AND_CONDITIONS',1,'nnnnnnnnnnnn','','','### Heading\n\n\n| Column 1 | Column 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn\nlllllllllllllllll\nlllllll\n','','',3,'2026-10-25 05:29:25.567',NULL);
/*!40000 ALTER TABLE `legal_document_versions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `media_file`
--

DROP TABLE IF EXISTS `media_file`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `media_file` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `url` varchar(500) NOT NULL,
  `kind` varchar(10) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `size` int(11) NOT NULL,
  `alt` varchar(255) DEFAULT NULL,
  `uploaded_by_id` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `media_file_url_key` (`url`),
  KEY `media_file_kind_created_at_idx` (`kind`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media_file`
--

LOCK TABLES `media_file` WRITE;
/*!40000 ALTER TABLE `media_file` DISABLE KEYS */;
INSERT INTO `media_file` VALUES
(3,'download','download.jpg','/uploads/images/803d7a6e-1f0f-4706-b7ef-dbbf8c6a5396.jpg','image','image/jpeg',20045,NULL,3,'2026-10-19 00:52:59.924'),
(4,'Bricks097_1K-JPG_Displacement','Bricks097_1K-JPG_Displacement.jpg','/uploads/images/324b4021-301c-4541-aac0-bbef020d7eb6.jpg','image','image/jpeg',199314,NULL,3,'2026-10-19 01:07:03.576'),
(5,'WhatsApp Image 2024-12-19 at 15.03.37_98cfcf01','WhatsApp Image 2024-12-19 at 15.03.37_98cfcf01.png','/uploads/images/f4692ab9-c0b9-4c81-9f42-446f3ff04892.png','image','image/png',331516,NULL,3,'2026-10-22 15:12:27.780'),
(6,'MCC_Customer_Catalogue','MCC_Customer_Catalogue.pdf','/uploads/files/b76ea890-9e92-457a-8795-8ccd45b53db3.pdf','file','application/pdf',826726,NULL,3,'2026-10-26 02:08:26.322');
/*!40000 ALTER TABLE `media_file` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `newsletter_campaign_recipients`
--

DROP TABLE IF EXISTS `newsletter_campaign_recipients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `newsletter_campaign_recipients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `campaign_id` int(11) NOT NULL,
  `subscription_id` int(11) NOT NULL,
  `unsubscribe_token_hash` varchar(64) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `sent_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `newsletter_campaign_recipients_unsubscribe_token_hash_key` (`unsubscribe_token_hash`),
  UNIQUE KEY `newsletter_campaign_recipients_campaign_id_subscription_id_key` (`campaign_id`,`subscription_id`),
  KEY `newsletter_campaign_recipients_campaign_id_status_id_idx` (`campaign_id`,`status`,`id`),
  KEY `newsletter_campaign_recipients_subscription_id_fkey` (`subscription_id`),
  CONSTRAINT `newsletter_campaign_recipients_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `newsletter_campaigns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `newsletter_campaign_recipients_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `newsletter_subscriptions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `newsletter_campaign_recipients`
--

LOCK TABLES `newsletter_campaign_recipients` WRITE;
/*!40000 ALTER TABLE `newsletter_campaign_recipients` DISABLE KEYS */;
/*!40000 ALTER TABLE `newsletter_campaign_recipients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `newsletter_campaigns`
--

DROP TABLE IF EXISTS `newsletter_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `newsletter_campaigns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject` varchar(200) NOT NULL,
  `body_markdown` longtext NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'QUEUED',
  `created_by_id` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `sent_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `newsletter_campaigns_status_created_at_idx` (`status`,`created_at`),
  KEY `newsletter_campaigns_created_by_id_fkey` (`created_by_id`),
  CONSTRAINT `newsletter_campaigns_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `newsletter_campaigns`
--

LOCK TABLES `newsletter_campaigns` WRITE;
/*!40000 ALTER TABLE `newsletter_campaigns` DISABLE KEYS */;
/*!40000 ALTER TABLE `newsletter_campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `newsletter_subscriptions`
--

DROP TABLE IF EXISTS `newsletter_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `newsletter_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `consent_at` datetime(3) NOT NULL,
  `confirmed_at` datetime(3) DEFAULT NULL,
  `unsubscribed_at` datetime(3) DEFAULT NULL,
  `confirmation_token_hash` varchar(64) DEFAULT NULL,
  `confirmation_expires_at` datetime(3) DEFAULT NULL,
  `unsubscribe_token_hash` varchar(64) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `newsletter_subscriptions_email_key` (`email`),
  UNIQUE KEY `newsletter_subscriptions_confirmation_token_hash_key` (`confirmation_token_hash`),
  UNIQUE KEY `newsletter_subscriptions_unsubscribe_token_hash_key` (`unsubscribe_token_hash`),
  KEY `newsletter_subscriptions_status_created_at_idx` (`status`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `newsletter_subscriptions`
--

LOCK TABLES `newsletter_subscriptions` WRITE;
/*!40000 ALTER TABLE `newsletter_subscriptions` DISABLE KEYS */;
INSERT INTO `newsletter_subscriptions` VALUES
(1,'impanomanzienock@gmail.com','PENDING','2026-10-25 05:21:24.895',NULL,NULL,'abae0b7c7ca3dbc3b6d02c65f83b887baa743e7de4194d1757c71c646fed77ad','2026-10-26 05:21:24.895','adad9e8305462f08d31f0d2e4bfc598399db92b93ac0d80c0ca1887fe53dad77','2026-10-25 05:20:51.511','2026-10-25 05:21:24.904');
/*!40000 ALTER TABLE `newsletter_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order`
--

DROP TABLE IF EXISTS `order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orderNumber` varchar(30) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `guestEmail` varchar(255) DEFAULT NULL,
  `guestPhone` varchar(20) DEFAULT NULL,
  `status` enum('PENDING','PAID','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  `paymentStatus` enum('PENDING','AUTHORIZED','PAID','FAILED','REFUNDED','PARTIALLY_REFUNDED') NOT NULL DEFAULT 'PENDING',
  `fulfillment` enum('DELIVERY','PICKUP') NOT NULL DEFAULT 'DELIVERY',
  `subtotal` decimal(12,2) NOT NULL,
  `discountTotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `shippingFee` decimal(12,2) NOT NULL DEFAULT 0.00,
  `taxTotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `grandTotal` decimal(12,2) NOT NULL,
  `currency` varchar(3) NOT NULL,
  `couponId` int(11) DEFAULT NULL,
  `deliveryZoneId` int(11) DEFAULT NULL,
  `shipFullName` varchar(255) DEFAULT NULL,
  `shipPhone` varchar(20) NOT NULL,
  `shipDistrict` varchar(100) DEFAULT NULL,
  `shipSector` varchar(100) DEFAULT NULL,
  `shipStreet` varchar(255) DEFAULT NULL,
  `shipNotes` text DEFAULT NULL,
  `customerNote` text DEFAULT NULL,
  `internalNote` text DEFAULT NULL,
  `placedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `paidAt` datetime(3) DEFAULT NULL,
  `shippedAt` datetime(3) DEFAULT NULL,
  `deliveredAt` datetime(3) DEFAULT NULL,
  `cancelledAt` datetime(3) DEFAULT NULL,
  `updatedAt` datetime(3) NOT NULL,
  `shipProvince` varchar(100) DEFAULT NULL,
  `tin` varchar(9) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_orderNumber_key` (`orderNumber`),
  KEY `order_userId_idx` (`userId`),
  KEY `order_status_placedAt_idx` (`status`,`placedAt`),
  KEY `order_couponId_fkey` (`couponId`),
  KEY `order_deliveryZoneId_fkey` (`deliveryZoneId`),
  CONSTRAINT `order_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupon` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `order_deliveryZoneId_fkey` FOREIGN KEY (`deliveryZoneId`) REFERENCES `deliveryzone` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order`
--

LOCK TABLES `order` WRITE;
/*!40000 ALTER TABLE `order` DISABLE KEYS */;
INSERT INTO `order` VALUES
(1,'MCC-20261018-205190',3,NULL,NULL,'PAID','PAID','DELIVERY',162720.00,0.00,0.00,29290.00,192010.00,'RWF',NULL,NULL,'manzi enock impano','+250791105800','muhanga',NULL,'Muhanga',NULL,NULL,NULL,'2026-10-18 02:33:13.811','2026-10-22 01:54:44.997',NULL,NULL,NULL,'2026-10-22 01:54:45.006',NULL,NULL),
(2,'MCC-20261021-952507',3,NULL,NULL,'PAID','PENDING','DELIVERY',206280.00,0.00,0.00,37130.00,243410.00,'RWF',NULL,NULL,'manzi enock impano','+250791105800','Gasabo','Jabana','Cyapa, Gikombe, Kamurera, Kamembe, Rusizi, Iburengerazuba',NULL,NULL,NULL,'2026-10-21 21:40:48.884',NULL,NULL,NULL,NULL,'2026-10-22 08:59:26.071','Kigali',NULL),
(3,'MCC-20261021-860400',3,NULL,NULL,'PAID','PAID','DELIVERY',108000.00,0.00,5000.00,20340.00,133340.00,'RWF',NULL,NULL,'manzi enock impano','+250791105800','Kicukiro','Kanombe','Muhanga',NULL,NULL,NULL,'2026-10-21 22:16:32.266','2026-10-22 01:54:58.614',NULL,NULL,NULL,'2026-10-22 01:54:58.619','Kigali',NULL),
(4,'MCC-20261022-358890',3,NULL,NULL,'PAID','PAID','PICKUP',2220000.00,0.00,0.00,399600.00,2619600.00,'RWF',NULL,NULL,'manzi enock impano','+250791105800',NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-22 07:57:38.127','2026-10-22 22:23:06.133',NULL,NULL,NULL,'2026-10-22 22:23:06.148',NULL,NULL),
(5,'MCC-20261022-495692',3,NULL,NULL,'PAID','PENDING','PICKUP',200000.00,0.00,0.00,36000.00,236000.00,'RWF',NULL,NULL,'manzi enock impano','+250791105800',NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-22 21:52:11.849','2026-10-22 22:14:41.175',NULL,NULL,NULL,'2026-10-22 22:14:41.279',NULL,NULL),
(6,'MCC-20261022-799561',3,NULL,NULL,'PAID','PAID','PICKUP',200000.00,0.00,0.00,36000.00,236000.00,'RWF',NULL,NULL,'manzi enock impano','+250791105800',NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-22 21:59:24.940','2026-10-22 22:19:07.041',NULL,NULL,NULL,'2026-10-22 22:19:07.100',NULL,NULL),
(7,'MCC-20261022-365464',3,NULL,NULL,'SHIPPED','PAID','PICKUP',200000.00,0.00,0.00,36000.00,236000.00,'RWF',NULL,NULL,'manzi enock impano','+250791105800',NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-22 22:09:45.597','2026-10-22 22:14:58.975','2026-10-24 19:04:47.598',NULL,NULL,'2026-10-24 19:04:47.625',NULL,NULL),
(8,'MCC-20261023-684278',3,NULL,NULL,'CANCELLED','PAID','PICKUP',441500.00,0.00,0.00,79470.00,520970.00,'RWF',NULL,NULL,'manzi enock impano','+250791105800',NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-23 03:42:19.568','2026-10-23 04:07:07.400',NULL,NULL,'2026-10-26 17:03:00.000','2026-10-26 17:03:47.051',NULL,NULL),
(9,'MCC-20261025-764799',3,NULL,NULL,'DELIVERED','PAID','PICKUP',115000.00,34500.00,0.00,14490.00,94990.00,'RWF',1,NULL,'manzi enock impano','+250791105800',NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-25 02:34:24.486','2026-10-26 21:21:00.000','2026-10-26 21:21:00.000','2026-10-26 21:22:00.000',NULL,'2026-10-26 21:22:06.950',NULL,NULL);
/*!40000 ALTER TABLE `order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orderitem`
--

DROP TABLE IF EXISTS `orderitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orderitem` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orderId` int(11) NOT NULL,
  `variantId` int(11) DEFAULT NULL,
  `productName` varchar(255) NOT NULL,
  `sku` varchar(64) NOT NULL,
  `size` varchar(50) NOT NULL,
  `finish` varchar(50) DEFAULT NULL,
  `shadeCode` varchar(50) DEFAULT NULL,
  `image` text DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `sqmPerBox` decimal(8,3) DEFAULT NULL,
  `unitPrice` decimal(12,2) NOT NULL,
  `lineTotal` decimal(12,2) NOT NULL,
  `containers` int(11) DEFAULT NULL,
  `saleType` enum('SQM','CONTAINER') NOT NULL DEFAULT 'SQM',
  PRIMARY KEY (`id`),
  KEY `orderitem_orderId_idx` (`orderId`),
  KEY `orderitem_variantId_fkey` (`variantId`),
  CONSTRAINT `orderitem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `orderitem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `productvariant` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orderitem`
--

LOCK TABLES `orderitem` WRITE;
/*!40000 ALTER TABLE `orderitem` DISABLE KEYS */;
INSERT INTO `orderitem` VALUES
(1,1,3,'Azure Metro','MCC-AM-3060','30x60','glossy',NULL,'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80',1.00,1.440,30240.00,30240.00,NULL,'SQM'),
(2,1,17,'Aquaria Grey','MCC-AQUARIA-GR-6060','60x60','matt',NULL,'/tiles/aquaria-grey.jpg',4.00,1.440,33120.00,132480.00,NULL,'SQM'),
(3,2,1,'Terrain Sandstone','MCC-TS-6060','60x60','matt',NULL,'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',1.00,1.440,31680.00,31680.00,NULL,'SQM'),
(4,2,3,'Azure Metro','MCC-AM-3060','30x60','glossy',NULL,'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80',1.00,1.440,30240.00,30240.00,NULL,'SQM'),
(5,2,4,'Greenstone Exterior','MCC-OBM-60120','60x120','polished',NULL,'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80',1.00,1.440,46080.00,46080.00,NULL,'SQM'),
(6,2,5,'Gold Metallic Series','MCC-GE-4040','40x40','textured',NULL,'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80',1.00,1.440,28800.00,28800.00,NULL,'SQM'),
(7,2,7,'Onyx Black Marble','MCC-GMS-3030','30x30','metallic',NULL,'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80',1.00,1.080,37800.00,37800.00,NULL,'SQM'),
(8,2,8,'Ivory Travertine','MCC-IT-3060','30x60','matt',NULL,'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',1.00,1.440,31680.00,31680.00,NULL,'SQM'),
(9,3,1,'Terrain Sandstone','MCC-TS-6060','60x60','matt',NULL,'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',1.00,1.440,31680.00,31680.00,NULL,'SQM'),
(10,3,3,'Azure Metro','MCC-AM-3060','30x60','glossy',NULL,'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80',1.00,1.440,30240.00,30240.00,NULL,'SQM'),
(11,3,4,'Greenstone Exterior','MCC-OBM-60120','60x120','polished',NULL,'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80',1.00,1.440,46080.00,46080.00,NULL,'SQM'),
(12,4,1,'Terrain Sandstone','MCC-TS-6060','60x60','matt',NULL,'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',10.00,NULL,22000.00,220000.00,NULL,'SQM'),
(13,4,5,'Gold Metallic Series','MCC-GE-4040','40x40','textured',NULL,'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80',100.00,NULL,20000.00,2000000.00,NULL,'SQM'),
(14,5,59,'Stone White','MCC-STONE-WH-3060','30x60','glossy',NULL,'/tiles/stone-white.jpg',10.00,NULL,20000.00,200000.00,NULL,'SQM'),
(15,6,5,'Gold Metallic Series','MCC-GE-4040','40x40','textured',NULL,'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80',10.00,NULL,20000.00,200000.00,NULL,'SQM'),
(16,7,5,'Gold Metallic Series','MCC-GE-4040','40x40','textured',NULL,'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80',10.00,NULL,20000.00,200000.00,NULL,'SQM'),
(17,8,1,'Terrain Sandstone','MCC-TS-6060','60x60','matt',NULL,'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',10.00,NULL,22000.00,220000.00,NULL,'SQM'),
(18,8,3,'Azure Metro','MCC-AM-3060','30x60','glossy',NULL,'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80',10.00,NULL,21000.00,210000.00,NULL,'SQM'),
(19,8,67,'Terrain Sandstone','TERRAIN-SANDSTONE','60x60',NULL,NULL,'/uploads/images/324b4021-301c-4541-aac0-bbef020d7eb6.jpg',1.00,NULL,11500.00,11500.00,NULL,'SQM'),
(20,9,67,'Terrain Sandstone','TERRAIN-SANDSTONE','60x60',NULL,NULL,'/uploads/images/324b4021-301c-4541-aac0-bbef020d7eb6.jpg',10.00,NULL,11500.00,115000.00,NULL,'SQM');
/*!40000 ALTER TABLE `orderitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orderstatushistory`
--

DROP TABLE IF EXISTS `orderstatushistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orderstatushistory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orderId` int(11) NOT NULL,
  `status` enum('PENDING','PAID','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED') NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `changedById` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `orderstatushistory_orderId_idx` (`orderId`),
  KEY `orderstatushistory_changedById_fkey` (`changedById`),
  CONSTRAINT `orderstatushistory_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orderstatushistory_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orderstatushistory`
--

LOCK TABLES `orderstatushistory` WRITE;
/*!40000 ALTER TABLE `orderstatushistory` DISABLE KEYS */;
INSERT INTO `orderstatushistory` VALUES
(1,1,'PENDING','Order placed',3,'2026-10-18 02:33:13.811'),
(2,1,'PAID','Status changed from PENDING to PAID',3,'2026-10-19 00:24:47.134'),
(3,2,'PENDING','Order placed',3,'2026-10-21 21:40:48.884'),
(4,3,'PENDING','Order placed',3,'2026-10-21 22:16:32.266'),
(5,1,'PENDING','Payment no longer covers the order total',3,'2026-10-22 01:53:42.977'),
(6,1,'PAID','Payment received in full',3,'2026-10-22 01:54:45.020'),
(7,3,'PAID','Payment received in full',3,'2026-10-22 01:54:58.633'),
(8,4,'PENDING','Order placed',3,'2026-10-22 07:57:38.127'),
(9,2,'PAID',NULL,3,'2026-10-22 08:59:26.094'),
(10,5,'PENDING','Order placed',3,'2026-10-22 21:52:11.849'),
(11,6,'PENDING','Order placed',3,'2026-10-22 21:59:24.940'),
(12,7,'PENDING','Order placed',3,'2026-10-22 22:09:45.597'),
(13,5,'PAID','Status changed from PENDING to PAID',3,'2026-10-22 22:14:41.306'),
(14,7,'PAID','Status changed from PENDING to PAID',3,'2026-10-22 22:14:59.008'),
(15,6,'PAID','Status changed from PENDING to PAID',3,'2026-10-22 22:19:07.114'),
(16,4,'PAID','Status changed from PENDING to PAID',3,'2026-10-22 22:23:06.232'),
(17,8,'PENDING','Order placed',3,'2026-10-23 03:42:19.568'),
(18,8,'PAID','Status changed from PENDING to PAID',3,'2026-10-23 04:07:07.623'),
(19,7,'SHIPPED','Status changed from PAID to SHIPPED',3,'2026-10-24 19:04:47.694'),
(20,9,'PENDING','Order placed',3,'2026-10-25 02:34:24.486'),
(21,8,'CANCELLED','Status changed from PAID to CANCELLED',3,'2026-10-26 17:03:00.000'),
(22,9,'PAID','Status changed from PENDING to PAID',3,'2026-10-26 21:21:00.000'),
(23,9,'PROCESSING','Status changed from PAID to PROCESSING',3,'2026-10-26 21:21:00.000'),
(24,9,'SHIPPED','Status changed from PROCESSING to SHIPPED',3,'2026-10-26 21:21:00.000'),
(25,9,'DELIVERED','Status changed from SHIPPED to DELIVERED',3,'2026-10-26 21:22:00.000');
/*!40000 ALTER TABLE `orderstatushistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orderId` int(11) NOT NULL,
  `method` enum('MTN_MOMO','AIRTEL_MONEY','CARD','BANK_TRANSFER','CASH_ON_DELIVERY') NOT NULL,
  `status` enum('PENDING','AUTHORIZED','PAID','FAILED','REFUNDED','PARTIALLY_REFUNDED') NOT NULL DEFAULT 'PENDING',
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(3) NOT NULL,
  `provider` varchar(50) DEFAULT NULL,
  `providerRef` varchar(150) DEFAULT NULL,
  `payerPhone` varchar(20) DEFAULT NULL,
  `failureReason` varchar(255) DEFAULT NULL,
  `rawResponse` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`rawResponse`)),
  `paidAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `recordedById` int(11) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `proofUrl` text DEFAULT NULL,
  `refundReason` varchar(255) DEFAULT NULL,
  `refundedAmount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `refundedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_providerRef_key` (`providerRef`),
  KEY `payment_orderId_idx` (`orderId`),
  KEY `payment_status_idx` (`status`),
  KEY `payment_recordedById_fkey` (`recordedById`),
  CONSTRAINT `payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `payment_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment`
--

LOCK TABLES `payment` WRITE;
/*!40000 ALTER TABLE `payment` DISABLE KEYS */;
INSERT INTO `payment` VALUES
(1,2,'MTN_MOMO','PENDING',243410.00,'RWF',NULL,NULL,'+250791105800',NULL,NULL,NULL,'2026-10-21 21:40:48.884','2026-10-21 21:40:48.884',NULL,NULL,NULL,NULL,0.00,NULL),
(2,3,'CASH_ON_DELIVERY','PAID',133340.00,'RWF',NULL,NULL,'+250791105800',NULL,NULL,'2026-10-22 01:54:58.589','2026-10-21 22:16:32.266','2026-10-22 01:54:58.599',3,NULL,NULL,NULL,0.00,NULL),
(3,1,'CASH_ON_DELIVERY','PAID',192010.00,'RWF','manual',NULL,NULL,NULL,NULL,'2026-10-22 01:54:44.955','2026-10-22 01:53:42.887','2026-10-22 01:54:44.970',3,'mmmmmmm',NULL,NULL,0.00,NULL),
(4,4,'MTN_MOMO','PAID',2619600.00,'RWF','manual',NULL,'+250791105800',NULL,NULL,'2026-10-22 22:23:06.133','2026-10-22 07:57:38.127','2026-10-22 22:23:06.223',3,NULL,NULL,NULL,0.00,NULL),
(5,5,'AIRTEL_MONEY','PENDING',236000.00,'RWF','manual',NULL,'+250791105800',NULL,NULL,NULL,'2026-10-22 21:52:11.849','2026-10-22 21:52:11.849',NULL,NULL,NULL,NULL,0.00,NULL),
(6,6,'MTN_MOMO','PENDING',236000.00,'RWF','manual',NULL,'+250791105800',NULL,NULL,NULL,'2026-10-22 21:59:24.940','2026-10-22 21:59:24.940',NULL,NULL,NULL,NULL,0.00,NULL),
(7,7,'MTN_MOMO','PAID',236000.00,'RWF','manual',NULL,'+250791105800',NULL,NULL,'2026-10-23 03:39:00.306','2026-10-22 22:09:45.597','2026-10-23 03:39:00.329',3,NULL,NULL,NULL,0.00,NULL),
(8,8,'MTN_MOMO','PAID',520970.00,'RWF','manual',NULL,'+250791105800',NULL,NULL,'2026-10-23 04:07:07.400','2026-10-23 03:42:19.568','2026-10-23 04:07:07.560',3,NULL,NULL,NULL,0.00,NULL),
(9,9,'MTN_MOMO','PAID',94990.00,'RWF','manual',NULL,'+250791105800',NULL,NULL,'2026-10-26 21:21:00.000','2026-10-25 02:34:24.486','2026-10-26 21:21:18.133',3,NULL,NULL,NULL,0.00,NULL);
/*!40000 ALTER TABLE `payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permission_logs`
--

DROP TABLE IF EXISTS `permission_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permission_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `target_user_id` int(11) NOT NULL,
  `actor_user_id` int(11) DEFAULT NULL,
  `permission_code` varchar(100) NOT NULL,
  `action` varchar(20) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `permission_logs_target_user_id_idx` (`target_user_id`),
  CONSTRAINT `permission_logs_target_user_id_fkey` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permission_logs`
--

LOCK TABLES `permission_logs` WRITE;
/*!40000 ALTER TABLE `permission_logs` DISABLE KEYS */;
INSERT INTO `permission_logs` VALUES
(1,3,3,'admin','GRANTED','2026-10-22 15:13:24.185'),
(2,3,3,'products.manage','GRANTED','2026-10-22 15:13:24.222'),
(3,3,3,'inventory.manage','GRANTED','2026-10-22 15:13:24.254'),
(4,3,3,'coupons.manage','GRANTED','2026-10-22 15:13:24.285'),
(15,1,3,'customer.reviews.create','GRANTED','2026-10-25 05:23:04.663'),
(16,8,3,'customer.reviews.create','GRANTED','2026-10-25 15:19:06.986');
/*!40000 ALTER TABLE `permission_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_code_key` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES
(1,'admin','Everything, including managing users and permissions.','2026-10-22 15:13:24.150'),
(2,'products.manage','Create, edit and delete products, variants, pricing and categories.','2026-10-22 15:13:24.201'),
(3,'inventory.manage','Adjust stock and reorder levels.','2026-10-22 15:13:24.234'),
(4,'coupons.manage','Create and edit discount codes.','2026-10-22 15:13:24.266'),
(5,'orders.view','See all orders and customers.','2026-10-22 15:21:03.369'),
(6,'orders.manage','Change order status, notes, invoices.','2026-10-22 15:21:03.404'),
(7,'payments.view','See payment records.','2026-10-22 15:21:03.438'),
(8,'products.view','See all products incl. drafts and archived.','2026-10-23 16:04:31.532'),
(9,'products.create','Add new products.','2026-10-23 16:04:31.548'),
(10,'products.update','Edit product details, images and specs.','2026-10-23 16:04:31.568'),
(11,'products.publish','Change product status (ACTIVE/DRAFT/ARCHIVED) and featured flag.','2026-10-23 16:04:31.579'),
(12,'products.delete','Permanently delete products.','2026-10-23 16:04:31.593'),
(13,'variants.manage','Create, edit and delete variants / SKUs (non-price fields).','2026-10-23 16:04:31.627'),
(14,'pricing.manage','Change prices, container prices, compare-at prices and currency.','2026-10-23 16:04:31.637'),
(15,'categories.manage','Create, edit, reorder and delete categories.','2026-10-23 16:04:31.648'),
(16,'collections.manage','Create and edit collections and their products.','2026-10-23 16:04:31.659'),
(17,'inventory.view','See stock levels and the stock-movement ledger.','2026-10-23 16:04:31.684'),
(18,'inventory.adjust','Record purchases, returns and manual adjustments.','2026-10-23 16:04:31.696'),
(19,'inventory.settings','Change reorder levels and backorder rules.','2026-10-23 16:04:31.709'),
(20,'coupons.view','See discount codes and usage.','2026-10-23 16:04:31.732'),
(21,'delivery.view','See delivery zones and fees.','2026-10-23 16:04:31.753'),
(22,'delivery.manage','Create and edit delivery zones and fees.','2026-10-23 16:04:31.764'),
(23,'orders.update_status','Move orders through processing / shipped / delivered.','2026-10-23 16:04:31.792'),
(24,'orders.cancel','Cancel orders on behalf of customers.','2026-10-23 16:04:31.801'),
(25,'orders.note','Write internal notes on orders.','2026-10-23 16:04:31.811'),
(26,'orders.export','Download order data (CSV).','2026-10-23 16:04:31.821'),
(27,'invoices.view','See and download invoices / proformas.','2026-10-23 16:04:31.833'),
(28,'invoices.issue','Generate invoices, proformas and credit notes.','2026-10-23 16:04:31.843'),
(29,'payments.record','Record manual payments (cash, bank transfer) and mark orders paid.','2026-10-23 16:04:31.890'),
(30,'payments.refund','Record and issue refunds (up to the refund limit).','2026-10-23 16:04:31.897'),
(31,'payments.manage','Everything on payments, incl. refunds above the limit.','2026-10-23 16:04:31.904'),
(32,'customers.view','See customer profiles, addresses and order history.','2026-10-23 16:04:31.912'),
(33,'customers.update','Edit customer profiles and addresses, deactivate customer accounts.','2026-10-23 16:04:31.919'),
(34,'reviews.moderate','Approve, reject and delete product reviews.','2026-10-23 16:04:31.927'),
(35,'messages.view','Read messages from the contact form.','2026-10-23 16:04:31.934'),
(36,'messages.reply','Reply to contact messages.','2026-10-23 16:04:31.943'),
(37,'messages.manage','Archive and delete contact messages.','2026-10-23 16:04:31.950'),
(38,'projects.manage','Create and edit project showcases.','2026-10-23 16:04:31.960'),
(39,'testimonials.manage','Create and edit testimonials.','2026-10-23 16:04:31.969'),
(40,'catalogues.manage','Upload and edit downloadable catalogues.','2026-10-23 16:04:31.977'),
(41,'visualizer.scenes.manage','Create and edit room scenes and surfaces.','2026-10-23 16:04:31.986'),
(42,'visualizer.designs.view','See designs customers saved in the visualizer.','2026-10-23 16:04:31.994'),
(43,'team.manage','Edit job title, bio and homepage visibility of staff.','2026-10-23 16:04:32.003'),
(44,'content.manage','Projects, collections, testimonials, catalogues, media, blog, visualizer, team.','2026-10-23 16:04:32.013'),
(45,'media.view','Browse uploaded files.','2026-10-23 16:04:32.021'),
(46,'media.upload','Upload images and files.','2026-10-23 16:04:32.030'),
(47,'media.delete','Delete uploaded files.','2026-10-23 16:04:32.040'),
(48,'media.manage','View, upload, edit and delete media.','2026-10-23 16:04:32.049'),
(49,'blog.view','See drafts and archived posts.','2026-10-23 16:04:32.058'),
(50,'blog.write','Create posts and edit your OWN drafts.','2026-10-23 16:04:32.065'),
(51,'blog.edit_any','Edit posts written by other people.','2026-10-23 16:04:32.073'),
(52,'blog.publish','Publish, unpublish and archive posts.','2026-10-23 16:04:32.080'),
(53,'blog.delete','Permanently delete posts.','2026-10-23 16:04:32.087'),
(54,'blog.manage','Everything on the blog.','2026-10-23 16:04:32.095'),
(55,'reports.view','Analytics dashboards.','2026-10-23 16:04:32.124'),
(56,'reports.export','Download report data.','2026-10-23 16:04:32.132'),
(57,'reports.financial','Revenue, margins and payment reports.','2026-10-23 16:04:32.140'),
(58,'audit.view','See who changed what (permissions, payments, prices).','2026-10-23 16:04:32.148'),
(59,'settings.manage','Change global site settings.','2026-10-23 16:04:32.156'),
(60,'users.view','See every account, staff included.','2026-10-23 16:04:32.164'),
(61,'users.create','Create staff and customer accounts.','2026-10-23 16:04:32.171'),
(62,'users.update','Edit any user\'s profile.','2026-10-23 16:04:32.179'),
(63,'users.deactivate','Deactivate / reactivate accounts (revokes sessions).','2026-10-23 16:04:32.187'),
(64,'users.sessions','Revoke a user\'s refresh tokens / sign them out.','2026-10-23 16:04:32.195'),
(65,'users.permissions','Grant and revoke permissions (only ones you hold yourself).','2026-10-23 16:04:32.203'),
(66,'users.manage','Create users and assign permissions.','2026-10-23 16:04:32.210'),
(67,'customer.reviews.create','Write product reviews','2026-10-25 05:23:04.639');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `category` varchar(191) NOT NULL,
  `categoryLabel` varchar(191) NOT NULL,
  `description` text NOT NULL,
  `sizes` varchar(191) NOT NULL,
  `badge` varchar(191) DEFAULT NULL,
  `gradient` text NOT NULL,
  `image` text NOT NULL,
  `colors` text NOT NULL,
  `useCase` varchar(191) NOT NULL,
  `collection` varchar(191) NOT NULL,
  `featured` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `categoryId` int(11) DEFAULT NULL,
  `isRectified` tinyint(1) NOT NULL DEFAULT 0,
  `material` varchar(100) DEFAULT NULL,
  `origin` varchar(100) DEFAULT NULL,
  `seoDescription` varchar(500) DEFAULT NULL,
  `seoTitle` varchar(255) DEFAULT NULL,
  `slipRating` varchar(50) DEFAULT NULL,
  `slug` varchar(200) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `waterAbsorption` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_slug_key` (`slug`),
  KEY `product_categoryId_idx` (`categoryId`),
  KEY `product_status_featured_idx` (`status`,`featured`),
  CONSTRAINT `product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES
(1,'Terrain Sandstone','floor','Floor Tiles','Natural sandstone finish. Slip-resistant surface ideal for living areas and corridors.','600×600mm & 800×800mm','Bestseller','from-[#c8b89a] to-[#a0896e]','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80','[\"#c8b89a\",\"#7a6248\",\"#e0d5c5\",\"#654d35\"]','Living rooms, corridors, outdoor terraces','Terrain Series',1,'2026-09-18 10:17:32.294','2026-10-19 01:14:23.136',NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',NULL),
(2,'Azure Metro','wall','Wall Tiles','Sleek subway-style wall tiles with a high-gloss glaze. Perfect for kitchens and bathrooms.','300×600mm','New','from-[#b0c4de] to-[#6a8fc8]','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80','[\"#6a8fc8\",\"#ffffff\",\"#4a5568\",\"#754e27\"]','Kitchens, bathrooms, feature walls','Azure Collection',0,'2026-09-18 10:17:32.298','2026-10-19 01:14:02.110',NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',NULL),
(3,'Greenstone Exterior','outdoor','Outdoor Tiles','Heavy-duty tiles engineered for outdoor use. UV-resistant, frost-proof, and anti-slip.','400×400mm & 600×600mm',NULL,'from-[#5a8a5a] to-[#2d5a2d]','/uploads/images/803d7a6e-1f0f-4706-b7ef-dbbf8c6a5396.jpg','[\"#5a8a5a\",\"#8B7355\",\"#666666\"]','Patios, driveways, pool surrounds, rooftops','Terrain Series',0,'2026-09-18 10:17:32.299','2026-10-22 07:51:25.271',NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',NULL),
(4,'Gold Metallic Series','special','Special Finish','Metallic-glazed decorative tiles that add a touch of elegance to accent walls and feature areas.','300×300mm & 600×600mm','Premium','from-[#d4af37] to-[#a0832a]','https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80','[\"#d4af37\",\"#c0c0c0\",\"#b87333\"]','Accent walls, feature areas, luxury bathrooms','Gold & Ivory Classics',1,'2026-09-18 10:17:32.300','2026-10-18 23:55:51.878',NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',NULL),
(5,'Onyx Black Marble','floor','Floor Tiles','Luxurious polished porcelain with authentic marble veining. Makes any space feel premium.','600×1200mm',NULL,'from-[#2d2d2d] to-[#555555]','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80','[\"#2d2d2d\",\"#888888\"]','Hotel lobbies, executive offices, premium residences','Onyx Prestige',1,'2026-09-18 10:17:32.301','2026-09-18 10:17:32.301',NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',NULL),
(6,'Ivory Travertine','wall','Wall Tiles','Warm, natural-looking travertine-effect wall tiles. Brings timeless elegance to any room.','300×600mm & 600×600mm',NULL,'from-[#f5f0e8] to-[#ddd5c0]','https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80','[\"#f5f0e8\",\"#d2b48c\"]','Bathrooms, living areas, spa interiors','Gold & Ivory Classics',0,'2026-09-18 10:17:32.326','2026-09-18 10:17:32.326',NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',NULL),
(7,'Agape Beige','floor','Floor Tiles','Refined porcelain tile with soft beige tones, subtle veining and durable finish for high-traffic elegance.','600×600mm & 300×600mm','Bestseller','from-[#2d2d2d] to-[#555555]','/tiles/agape-beige.jpg','[\"#d9cbba\",\"#8c7a6b\"]','Living rooms, hallways, bathrooms','Agape Collection',1,'2026-10-15 21:53:27.006','2026-10-15 21:53:27.006',NULL,0,'Porcelain',NULL,NULL,NULL,NULL,'agape-beige','ACTIVE',NULL),
(8,'Agape Grey','floor','Floor Tiles','Contemporary cool grey porcelain with delicate mineral variations, providing an understated modern backdrop.','600×600mm & 600×1200mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/agape-grey.jpg','[\"#a3a3a3\",\"#525252\"]','Living rooms, commercial, bathrooms','Agape Collection',0,'2026-10-15 21:53:27.103','2026-10-15 21:53:27.103',NULL,0,'Porcelain',NULL,NULL,NULL,NULL,'agape-grey','ACTIVE',NULL),
(9,'Apollo Grey','floor','Floor Tiles','Industrial-inspired concrete aesthetic with subtle tonal movement for minimalist architecture.','600×600mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/apollo-grey.jpg','[\"#808080\",\"#333333\"]','Offices, modern living rooms','Apollo Series',0,'2026-10-15 21:53:27.168','2026-10-15 21:53:27.168',NULL,0,'Porcelain',NULL,NULL,NULL,NULL,'apollo-grey','ACTIVE',NULL),
(10,'Aquaria Brown','floor','Floor Tiles','Deep earthy stone texture blending warm browns and bronze mineral streaks.','600×600mm & 300×600mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/aquaria-brown.jpg','[\"#7a5230\",\"#c29b74\"]','Terraces, kitchens, dining rooms','Aquaria Series',0,'2026-10-15 21:53:27.193','2026-10-15 21:53:27.193',NULL,0,'Natural Stone Look',NULL,NULL,NULL,NULL,'aquaria-brown','ACTIVE',NULL),
(11,'Aquaria Grey','floor','Floor Tiles','Cool slate and river-stone textures with natural stone depth and slip-resistant surface.','600×600mm & 600×1200mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/aquaria-grey.jpg','[\"#70757a\",\"#3c4043\"]','Bathrooms, living spaces','Aquaria Series',0,'2026-10-15 21:53:27.253','2026-10-15 21:53:27.253',NULL,0,'Natural Stone Look',NULL,NULL,NULL,NULL,'aquaria-grey','ACTIVE',NULL),
(12,'Ash Grey','wall','Wall Tiles','Soft grey ceramic tile crafted specifically for wall cladding with easy-clean glossy and satin options.','300×600mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/ash-grey.jpg','[\"#9e9e9e\",\"#e0e0e0\"]','Kitchen walls, bathrooms','Ash Collection',0,'2026-10-15 21:53:27.304','2026-10-15 21:53:27.304',NULL,0,'Ceramic',NULL,NULL,NULL,NULL,'ash-grey','ACTIVE',NULL),
(13,'Ash White','wall','Wall Tiles','Pristine white ceramic tile with subtle ash undertones, maximizing light in smaller interiors.','300×600mm','Bestseller','from-[#2d2d2d] to-[#555555]','/tiles/ash-white.jpg','[\"#f5f5f5\",\"#cccccc\"]','Kitchens, shower walls, feature walls','Ash Collection',1,'2026-10-15 21:53:27.360','2026-10-15 21:53:27.360',NULL,0,'Ceramic',NULL,NULL,NULL,NULL,'ash-white','ACTIVE',NULL),
(14,'Borgo Beige','floor','Floor Tiles','Tuscan-inspired limestone effect bringing timeless Mediterranean warmth to residential floors.','600×600mm & 600×1200mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/borgo-beige.jpg','[\"#dfd3c3\",\"#a69580\"]','Living rooms, bedrooms','Borgo Series',0,'2026-10-15 21:53:27.407','2026-10-15 21:53:27.407',NULL,0,'Porcelain',NULL,NULL,NULL,NULL,'borgo-beige','ACTIVE',NULL),
(15,'Borgo Brown','floor','Floor Tiles','Rich terracotta-brown stone with rustic edging and high slip resistance.','600×600mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/borgo-brown.jpg','[\"#6f4e37\",\"#a67b5b\"]','Corridors, lounges, dining areas','Borgo Series',0,'2026-10-15 21:53:27.467','2026-10-15 21:53:27.467',NULL,0,'Porcelain',NULL,NULL,NULL,NULL,'borgo-brown','ACTIVE',NULL),
(16,'Borgo Grey','floor','Floor Tiles','Aged architectural stone with gentle mottling, harmonizing with both modern wood and metal accents.','600×600mm & 600×1200mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/borgo-grey.jpg','[\"#616161\",\"#9e9e9e\"]','Hotels, modern homes, lobbies','Borgo Series',0,'2026-10-15 21:53:27.502','2026-10-15 21:53:27.502',NULL,0,'Porcelain',NULL,NULL,NULL,NULL,'borgo-grey','ACTIVE',NULL),
(17,'Calacatta Beige','floor','Floor Tiles','Supreme Italian Calacatta recreation with striking gold-beige ribbons across a warm cream porcelain body.','600×600mm & 600×1200mm','Premium','from-[#2d2d2d] to-[#555555]','/tiles/calacatta-beige.jpg','[\"#f7f4ee\",\"#c4b59d\"]','Bathrooms, luxury living rooms, entries','Calacatta Marble',1,'2026-10-15 21:53:27.564','2026-10-15 21:53:27.564',NULL,0,'Marble Look Porcelain',NULL,NULL,NULL,NULL,'calacatta-beige','ACTIVE',NULL),
(18,'Calacatta Grey','floor','Floor Tiles','Classic white marble with high-contrast charcoal veining, mirror-polish reflective sheen.','600×600mm & 600×1200mm','Bestseller','from-[#2d2d2d] to-[#555555]','/tiles/calacatta-grey.jpg','[\"#ffffff\",\"#757575\"]','Luxury master bath, hotel lobbies','Calacatta Marble',1,'2026-10-15 21:53:27.645','2026-10-15 21:53:27.645',NULL,0,'Marble Look Porcelain',NULL,NULL,NULL,NULL,'calacatta-grey','ACTIVE',NULL),
(19,'Calacatta Pink','special','Special Finish','Exclusive blush pink marble veining designed to make bold architectural statements in luxury projects.','600×1200mm & 300×600mm','New','from-[#2d2d2d] to-[#555555]','/tiles/calacatta-pink.jpg','[\"#fce4ec\",\"#d81b60\"]','Feature walls, vanity backsplash, boutique spaces','Calacatta Marble',1,'2026-10-15 21:53:27.727','2026-10-15 21:53:27.727',NULL,0,'Marble Look Porcelain',NULL,NULL,NULL,NULL,'calacatta-pink','ACTIVE',NULL),
(20,'Classic Black','floor','Floor Tiles','High-density solid jet black porcelain with micro-crystalline mirror shine.','600×600mm & 600×1200mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/classic-black.jpg','[\"#121212\",\"#424242\"]','Executive offices, modern baths, statement floors','Prestige Series',0,'2026-10-15 21:53:27.780','2026-10-15 21:53:27.780',NULL,0,'Porcelain',NULL,NULL,NULL,NULL,'classic-black','ACTIVE',NULL),
(21,'Cremino Brown','floor','Floor Tiles','Warm mocha and cocoa marble blend with soft caramel crystal veins.','600×600mm & 600×1200mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/cremino-brown.jpg','[\"#5d4037\",\"#d7ccc8\"]','Dining rooms, reception areas','Cremino Collection',0,'2026-10-15 21:53:27.832','2026-10-15 21:53:27.832',NULL,0,'Marble Look',NULL,NULL,NULL,NULL,'cremino-brown','ACTIVE',NULL),
(22,'Elm Yellow Wood','floor','Floor Tiles','Warm elm timber reproduction with lifelike wood grain ridges and knot detailing without warping.','200×1200mm & 300×600mm','New','from-[#2d2d2d] to-[#555555]','/tiles/elm_yellow_wood.jpg','[\"#c68b59\",\"#dfba8f\"]','Bedrooms, living rooms, studios','Timber Wood Series',1,'2026-10-15 21:53:27.881','2026-10-15 21:53:27.881',NULL,0,'Wood Look Porcelain',NULL,NULL,NULL,NULL,'elm-yellow-wood','ACTIVE',NULL),
(23,'Flam Wood Grey','floor','Floor Tiles','Weathered grey oak plank porcelain tile, perfect for sleek contemporary styling.','200×1200mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/flam-wood-grey.jpg','[\"#787878\",\"#a8a8a8\"]','Modern Scandinavian interiors, bedrooms','Timber Wood Series',0,'2026-10-15 21:53:27.918','2026-10-15 21:53:27.918',NULL,0,'Wood Look Porcelain',NULL,NULL,NULL,NULL,'flam-wood-grey','ACTIVE',NULL),
(24,'Ganga Stone','outdoor','Outdoor Tiles','Rugged riverbed stone texture engineered for all-weather outdoor durability and R11 slip rating.','600×600mm & 400×400mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/ganga-stone.jpg','[\"#546e7a\",\"#b0bec5\"]','Patios, pool surrounds, outdoor corridors','Nature Stone Series',0,'2026-10-15 21:53:27.949','2026-10-15 21:53:27.949',NULL,0,'Stone Look Porcelain',NULL,NULL,NULL,NULL,'ganga-stone','ACTIVE',NULL),
(25,'Gemini Beige','floor','Floor Tiles','Soft travertine look with balanced beige and cream gradients.','600×600mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/gemini-beige.jpg','[\"#e6d5b8\",\"#a89474\"]','Residential living, kitchens','Gemini Collection',0,'2026-10-15 21:53:27.993','2026-10-15 21:53:27.993',NULL,0,'Ceramic',NULL,NULL,NULL,NULL,'gemini-beige','ACTIVE',NULL),
(26,'Gemini Brown','floor','Floor Tiles','Deep chestnut ceramic tile with rich undertones and hard-wearing glaze.','600×600mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/gemini-brown.jpg','[\"#6d4c41\",\"#bcaaa4\"]','Warm living spaces, corridors','Gemini Collection',0,'2026-10-15 21:53:28.027','2026-10-15 21:53:28.027',NULL,0,'Ceramic',NULL,NULL,NULL,NULL,'gemini-brown','ACTIVE',NULL),
(27,'Kruk Stone White','wall','Wall Tiles','Textured white limestone look offering architectural tactile depth.','300×600mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/kruk-stone-white.jpg','[\"#fafafa\",\"#9e9e9e\"]','Bathrooms, exterior facades, accent walls','Krukstone Collection',0,'2026-10-15 21:53:28.054','2026-10-15 21:53:28.054',NULL,0,'Stone Look',NULL,NULL,NULL,NULL,'kruk-stone-white','ACTIVE',NULL),
(28,'Krukstone Grey','outdoor','Outdoor Tiles','Heavy granite aggregate pattern suited for high load bearing and exterior exposure.','600×600mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/krukstone-grey.jpg','[\"#424242\",\"#757575\"]','Terraces, walkways, parking zones','Krukstone Collection',0,'2026-10-15 21:53:28.234','2026-10-15 21:53:28.234',NULL,0,'Stone Look',NULL,NULL,NULL,NULL,'krukstone-grey','ACTIVE',NULL),
(29,'Milano Grey','floor','Floor Tiles','Polished Italian grey terrazzo aesthetic with fine white quartz speckles.','600×600mm & 600×1200mm','Bestseller','from-[#2d2d2d] to-[#555555]','/tiles/milano-grey.jpg','[\"#616161\",\"#e0e0e0\"]','Living rooms, retail showrooms','Milano Collection',1,'2026-10-15 21:53:28.277','2026-10-15 21:53:28.277',NULL,0,'Porcelain',NULL,NULL,NULL,NULL,'milano-grey','ACTIVE',NULL),
(30,'Narmanda Brown','floor','Floor Tiles','Deep brown marble with gold and quartz fissure veins for an opulent floor finish.','600×600mm & 600×1200mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/narmanda-brown.jpg','[\"#4e342e\",\"#8d6e63\"]','Spacious lounges, hotel entrances','Narmanda Series',0,'2026-10-15 21:53:28.334','2026-10-15 21:53:28.334',NULL,0,'Natural Stone Look',NULL,NULL,NULL,NULL,'narmanda-brown','ACTIVE',NULL),
(31,'Oliver Wood','floor','Floor Tiles','Golden honey oak plank tile offering the warmth of natural hardwood with porcelain ease.','200×1200mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/oliver-wood.jpg','[\"#8d5524\",\"#c68642\"]','Living rooms, corridors, home offices','Timber Wood Series',0,'2026-10-15 21:53:28.380','2026-10-15 21:53:28.380',NULL,0,'Wood Look Porcelain',NULL,NULL,NULL,NULL,'oliver-wood','ACTIVE',NULL),
(32,'Rubino Grey','floor','Floor Tiles','Smoky grey cloud marble pattern with subtle pearlescent crystallization.','600×600mm & 600×1200mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/rubino-grey.jpg','[\"#4a4a4a\",\"#878787\"]','Modern interiors, open-plan homes','Rubino Series',0,'2026-10-15 21:53:28.404','2026-10-15 21:53:28.404',NULL,0,'Porcelain',NULL,NULL,NULL,NULL,'rubino-grey','ACTIVE',NULL),
(33,'Silk Grey','floor','Floor Tiles','Ultra-smooth satin silk glaze that feels warm underfoot with soft light diffusion.','600×600mm & 600×1200mm','Premium','from-[#2d2d2d] to-[#555555]','/tiles/silk-grey.jpg','[\"#b0bec5\",\"#eceff1\"]','Master bedrooms, living rooms','Silk Luxury Series',1,'2026-10-15 21:53:28.452','2026-10-15 21:53:28.452',NULL,0,'Silk Finish Porcelain',NULL,NULL,NULL,NULL,'silk-grey','ACTIVE',NULL),
(34,'Silk Brown','floor','Floor Tiles','Gentle chocolate and caramel satin porcelain with soft touch texture.','600×600mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/silk-brown.jpg','[\"#795548\",\"#d7ccc8\"]','Bedrooms, elegant dining rooms','Silk Luxury Series',0,'2026-10-15 21:53:28.503','2026-10-15 21:53:28.503',NULL,0,'Silk Finish Porcelain',NULL,NULL,NULL,NULL,'silk-brown','ACTIVE',NULL),
(35,'Stone White','wall','Wall Tiles','Pure white crystallized limestone appearance for clean and luminous vertical surfaces.','300×600mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/stone-white.jpg','[\"#ffffff\",\"#cfd8dc\"]','Kitchen backsplash, bathroom walls','Nature Stone Series',0,'2026-10-15 21:53:28.527','2026-10-15 21:53:28.527',NULL,0,'Natural Stone Look',NULL,NULL,NULL,NULL,'stone-white','ACTIVE',NULL),
(36,'Tik Wood Brown','floor','Floor Tiles','Authentic teak wood planking with rich grain contrast and warm natural patina.','200×1200mm','Bestseller','from-[#2d2d2d] to-[#555555]','/tiles/tik-wood-brown.jpg','[\"#5c4033\",\"#8b5a2b\"]','Living rooms, bedrooms, verandas','Timber Wood Series',1,'2026-10-15 21:53:28.565','2026-10-15 21:53:28.565',NULL,0,'Wood Look Porcelain',NULL,NULL,NULL,NULL,'tik-wood-brown','ACTIVE',NULL),
(37,'Tik Wood Red','floor','Floor Tiles','Warm African mahogany and red teak tones with deep wood grain embossing.','200×1200mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/tik-wood-red.jpg','[\"#800000\",\"#a52a2a\"]','Feature flooring, restaurants, lounges','Timber Wood Series',0,'2026-10-15 21:53:28.598','2026-10-15 21:53:28.598',NULL,0,'Wood Look Porcelain',NULL,NULL,NULL,NULL,'tik-wood-red','ACTIVE',NULL),
(38,'Travinto Green','special','Special Finish','Unique forest green onyx and travertine composite with emerald and jade translucency.','600×1200mm & 600×600mm','New','from-[#2d2d2d] to-[#555555]','/tiles/travinto-green.jpg','[\"#2e7d32\",\"#a5d6a7\"]','Luxury bathrooms, boutique hotels, feature walls','Travinto Series',1,'2026-10-15 21:53:28.623','2026-10-15 21:53:28.623',NULL,0,'Travertine Porcelain',NULL,NULL,NULL,NULL,'travinto-green','ACTIVE',NULL),
(39,'Travinto Grey','floor','Floor Tiles','Silver travertine with linear cross-cut striations offering subtle architectural rhythm.','600×600mm & 600×1200mm',NULL,'from-[#2d2d2d] to-[#555555]','/tiles/travinto-grey.jpg','[\"#616161\",\"#bdbdbd\"]','Contemporary living, lobbies','Travinto Series',0,'2026-10-15 21:53:28.666','2026-10-15 21:53:28.666',NULL,0,'Travertine Porcelain',NULL,NULL,NULL,NULL,'travinto-grey','ACTIVE',NULL);
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productimage`
--

DROP TABLE IF EXISTS `productimage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `productimage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `productId` int(11) NOT NULL,
  `url` text NOT NULL,
  `alt` varchar(255) DEFAULT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `isPrimary` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `productimage_productId_idx` (`productId`),
  CONSTRAINT `productimage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productimage`
--

LOCK TABLES `productimage` WRITE;
/*!40000 ALTER TABLE `productimage` DISABLE KEYS */;
/*!40000 ALTER TABLE `productimage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productvariant`
--

DROP TABLE IF EXISTS `productvariant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `productvariant` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `productId` int(11) NOT NULL,
  `sku` varchar(64) NOT NULL,
  `size` varchar(50) NOT NULL,
  `finish` varchar(50) DEFAULT NULL,
  `color` varchar(80) DEFAULT NULL,
  `thicknessMm` decimal(4,1) DEFAULT NULL,
  `shadeCode` varchar(50) DEFAULT NULL,
  `piecesPerBox` int(11) NOT NULL DEFAULT 1,
  `sqmPerBox` decimal(8,3) NOT NULL DEFAULT 1.000,
  `weightKgPerBox` decimal(8,2) DEFAULT NULL,
  `pricePerSqm` decimal(12,2) NOT NULL,
  `pricePerBox` decimal(12,2) NOT NULL DEFAULT 0.00,
  `compareAtPrice` decimal(12,2) DEFAULT NULL,
  `currency` varchar(3) NOT NULL,
  `image` text DEFAULT NULL,
  `textureUrl` text DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `containerPricePerSqm` decimal(12,2) DEFAULT NULL,
  `sqmPerContainer` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `productvariant_sku_key` (`sku`),
  KEY `productvariant_productId_idx` (`productId`),
  CONSTRAINT `productvariant_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productvariant`
--

LOCK TABLES `productvariant` WRITE;
/*!40000 ALTER TABLE `productvariant` DISABLE KEYS */;
INSERT INTO `productvariant` VALUES
(1,1,'MCC-TS-6060','60x60','matt','Sandstone',NULL,NULL,4,1.440,NULL,11500.00,31680.00,NULL,'RWF','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',1,'2026-10-15 21:53:26.659','2026-10-25 19:20:02.276',NULL,NULL),
(2,1,'MCC-TS-8080','80x80','matt','Sandstone',NULL,NULL,2,1.280,NULL,26000.00,33280.00,NULL,'RWF','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',1,'2026-10-15 21:53:26.747','2026-10-15 21:53:26.747',NULL,NULL),
(3,2,'MCC-AM-3060','30x60','glossy','Azure Blue',NULL,NULL,8,1.440,NULL,21000.00,30240.00,NULL,'RWF','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80',1,'2026-10-15 21:53:26.785','2026-10-15 21:53:26.785',NULL,NULL),
(4,3,'MCC-OBM-60120','60x120','polished','Onyx Black',NULL,NULL,2,1.440,NULL,11000.00,46080.00,NULL,'RWF','https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80','https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80',1,'2026-10-15 21:53:26.822','2026-10-22 07:51:53.745',NULL,NULL),
(5,4,'MCC-GE-4040','40x40','textured','Greenstone',NULL,NULL,9,1.440,NULL,20000.00,28800.00,NULL,'RWF','https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80','https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80',1,'2026-10-15 21:53:26.853','2026-10-15 21:53:26.853',NULL,NULL),
(6,4,'MCC-GE-6060','60x60','textured','Greenstone',NULL,NULL,4,1.440,NULL,23000.00,33120.00,NULL,'RWF','/uploads/images/324b4021-301c-4541-aac0-bbef020d7eb6.jpg','https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80',1,'2026-10-15 21:53:26.889','2026-10-19 01:07:15.026',NULL,NULL),
(7,5,'MCC-GMS-3030','30x30','metallic','Gold Metallic',NULL,NULL,12,1.080,NULL,35000.00,37800.00,NULL,'RWF','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80',1,'2026-10-15 21:53:26.926','2026-10-15 21:53:26.926',NULL,NULL),
(8,6,'MCC-IT-3060','30x60','matt','Ivory',NULL,NULL,8,1.440,NULL,22000.00,31680.00,NULL,'RWF','https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80','https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',1,'2026-10-15 21:53:26.965','2026-10-15 21:53:26.965',NULL,NULL),
(9,7,'MCC-AGAPE-BG-6060','60x60','polished','Agape Beige',NULL,NULL,4,1.440,NULL,24000.00,34560.00,NULL,'RWF','/tiles/agape-beige.jpg','/tiles/agape-beige.jpg',1,'2026-10-15 21:53:27.024','2026-10-15 21:53:27.024',NULL,NULL),
(10,7,'MCC-AGAPE-BG-3060','30x60','matt','Agape Beige',NULL,NULL,8,1.440,NULL,22000.00,31680.00,NULL,'RWF','/tiles/agape-beige.jpg','/tiles/agape-beige.jpg',1,'2026-10-15 21:53:27.048','2026-10-15 21:53:27.048',NULL,NULL),
(11,7,'MCC-AGAPE-BG-60120','60x120','polished','Agape Beige',NULL,NULL,2,1.440,NULL,28000.00,40320.00,NULL,'RWF','/tiles/agape-beige.jpg','/tiles/agape-beige.jpg',1,'2026-10-15 21:53:27.070','2026-10-15 21:53:27.070',NULL,NULL),
(12,8,'MCC-AGAPE-GR-6060','60x60','matt','Agape Grey',NULL,NULL,4,1.440,NULL,23000.00,33120.00,NULL,'RWF','/tiles/agape-grey.jpg','/tiles/agape-grey.jpg',1,'2026-10-15 21:53:27.123','2026-10-15 21:53:27.123',NULL,NULL),
(13,8,'MCC-AGAPE-GR-60120','60x120','polished','Agape Grey',NULL,NULL,2,1.440,NULL,27000.00,38880.00,NULL,'RWF','/tiles/agape-grey.jpg','/tiles/agape-grey.jpg',1,'2026-10-15 21:53:27.143','2026-10-15 21:53:27.143',NULL,NULL),
(14,9,'MCC-APOLLO-GR-6060','60x60','matt','Apollo Grey',NULL,NULL,4,1.440,NULL,21000.00,30240.00,NULL,'RWF','/tiles/apollo-grey.jpg','/tiles/apollo-grey.jpg',1,'2026-10-15 21:53:27.178','2026-10-15 21:53:27.178',NULL,NULL),
(15,10,'MCC-AQUARIA-BR-6060','60x60','Matt','Aquaria Brown',NULL,NULL,4,1.440,NULL,11500.00,33840.00,NULL,'RWF','/uploads/images/324b4021-301c-4541-aac0-bbef020d7eb6.jpg','/uploads/images/324b4021-301c-4541-aac0-bbef020d7eb6.jpg',1,'2026-10-15 21:53:27.204','2026-10-25 19:22:37.349',NULL,NULL),
(16,10,'MCC-AQUARIA-BR-3060','30x60','matt','Aquaria Brown',NULL,NULL,8,1.440,NULL,21500.00,30960.00,NULL,'RWF','/tiles/aquaria-brown.jpg','/tiles/aquaria-brown.jpg',1,'2026-10-15 21:53:27.229','2026-10-15 21:53:27.229',NULL,NULL),
(17,11,'MCC-AQUARIA-GR-6060','60x60','matt','Aquaria Grey',NULL,NULL,4,1.440,NULL,23000.00,33120.00,NULL,'RWF','/tiles/aquaria-grey.jpg','/tiles/aquaria-grey.jpg',1,'2026-10-15 21:53:27.264','2026-10-15 21:53:27.264',NULL,NULL),
(18,11,'MCC-AQUARIA-GR-60120','60x120','polished','Aquaria Grey',NULL,NULL,2,1.440,NULL,28000.00,40320.00,NULL,'RWF','/tiles/aquaria-grey.jpg','/tiles/aquaria-grey.jpg',1,'2026-10-15 21:53:27.282','2026-10-15 21:53:27.282',NULL,NULL),
(19,12,'MCC-ASH-GR-3060','30x60','glossy','Ash Grey',NULL,NULL,8,1.440,NULL,19500.00,28080.00,NULL,'RWF','/tiles/ash-grey.jpg','/tiles/ash-grey.jpg',1,'2026-10-15 21:53:27.318','2026-10-15 21:53:27.318',NULL,NULL),
(20,12,'MCC-ASH-GR-6060','60x60','matt','Ash Grey',NULL,NULL,4,1.440,NULL,21000.00,30240.00,NULL,'RWF','/tiles/ash-grey.jpg','/tiles/ash-grey.jpg',1,'2026-10-15 21:53:27.341','2026-10-15 21:53:27.341',NULL,NULL),
(21,13,'MCC-ASH-WH-3060','30x60','glossy','Ash White',NULL,NULL,8,1.440,NULL,19500.00,28080.00,NULL,'RWF','/tiles/ash-white.jpg','/tiles/ash-white.jpg',1,'2026-10-15 21:53:27.370','2026-10-15 21:53:27.370',NULL,NULL),
(22,13,'MCC-ASH-WH-6060','60x60','polished','Ash White',NULL,NULL,4,1.440,NULL,22000.00,31680.00,NULL,'RWF','/tiles/ash-white.jpg','/tiles/ash-white.jpg',1,'2026-10-15 21:53:27.389','2026-10-15 21:53:27.389',NULL,NULL),
(23,14,'MCC-BORGO-BG-6060','60x60','matt','Borgo Beige',NULL,NULL,4,1.440,NULL,23500.00,33840.00,NULL,'RWF','/tiles/borgo-beige.jpg','/tiles/borgo-beige.jpg',1,'2026-10-15 21:53:27.419','2026-10-15 21:53:27.419',NULL,NULL),
(24,14,'MCC-BORGO-BG-60120','60x120','polished','Borgo Beige',NULL,NULL,2,1.440,NULL,27500.00,39600.00,NULL,'RWF','/tiles/borgo-beige.jpg','/tiles/borgo-beige.jpg',1,'2026-10-15 21:53:27.445','2026-10-15 21:53:27.445',NULL,NULL),
(25,15,'MCC-BORGO-BR-6060','60x60','matt','Borgo Brown',NULL,NULL,4,1.440,NULL,22500.00,32400.00,NULL,'RWF','/tiles/borgo-brown.jpg','/tiles/borgo-brown.jpg',1,'2026-10-15 21:53:27.483','2026-10-15 21:53:27.483',NULL,NULL),
(26,16,'MCC-BORGO-GR-6060','60x60','polished','Borgo Grey',NULL,NULL,4,1.440,NULL,24000.00,34560.00,NULL,'RWF','/tiles/borgo-grey.jpg','/tiles/borgo-grey.jpg',1,'2026-10-15 21:53:27.515','2026-10-15 21:53:27.515',NULL,NULL),
(27,16,'MCC-BORGO-GR-60120','60x120','polished','Borgo Grey',NULL,NULL,2,1.440,NULL,28500.00,41040.00,NULL,'RWF','/tiles/borgo-grey.jpg','/tiles/borgo-grey.jpg',1,'2026-10-15 21:53:27.541','2026-10-15 21:53:27.541',NULL,NULL),
(28,17,'MCC-CAL-BG-6060','60x60','polished','Calacatta Beige',NULL,NULL,4,1.440,NULL,26000.00,37440.00,NULL,'RWF','/tiles/calacatta-beige.jpg','/tiles/calacatta-beige.jpg',1,'2026-10-15 21:53:27.578','2026-10-15 21:53:27.578',NULL,NULL),
(29,17,'MCC-CAL-BG-60120','60x120','polished','Calacatta Beige',NULL,NULL,2,1.440,NULL,31000.00,44640.00,NULL,'RWF','/tiles/calacatta-beige.jpg','/tiles/calacatta-beige.jpg',1,'2026-10-15 21:53:27.601','2026-10-15 21:53:27.601',NULL,NULL),
(30,17,'MCC-CAL-BG-3060','30x60','polished','Calacatta Beige',NULL,NULL,8,1.440,NULL,24000.00,34560.00,NULL,'RWF','/tiles/calacatta-beige.jpg','/tiles/calacatta-beige.jpg',1,'2026-10-15 21:53:27.624','2026-10-15 21:53:27.624',NULL,NULL),
(31,18,'MCC-CAL-GR-6060','60x60','polished','Calacatta Grey',NULL,NULL,4,1.440,NULL,26000.00,37440.00,NULL,'RWF','/tiles/calacatta-grey.jpg','/tiles/calacatta-grey.jpg',1,'2026-10-15 21:53:27.675','2026-10-15 21:53:27.675',NULL,NULL),
(32,18,'MCC-CAL-GR-60120','60x120','polished','Calacatta Grey',NULL,NULL,2,1.440,NULL,31000.00,44640.00,NULL,'RWF','/tiles/calacatta-grey.jpg','/tiles/calacatta-grey.jpg',1,'2026-10-15 21:53:27.693','2026-10-15 21:53:27.693',NULL,NULL),
(33,18,'MCC-CAL-GR-3060','30x60','polished','Calacatta Grey',NULL,NULL,8,1.440,NULL,24000.00,34560.00,NULL,'RWF','/tiles/calacatta-grey.jpg','/tiles/calacatta-grey.jpg',1,'2026-10-15 21:53:27.710','2026-10-15 21:53:27.710',NULL,NULL),
(34,19,'MCC-CAL-PK-60120','60x120','polished','Calacatta Pink',NULL,NULL,2,1.440,NULL,33000.00,47520.00,NULL,'RWF','/tiles/calacatta-pink.jpg','/tiles/calacatta-pink.jpg',1,'2026-10-15 21:53:27.740','2026-10-15 21:53:27.740',NULL,NULL),
(35,19,'MCC-CAL-PK-3060','30x60','polished','Calacatta Pink',NULL,NULL,8,1.440,NULL,27000.00,38880.00,NULL,'RWF','/tiles/calacatta-pink.jpg','/tiles/calacatta-pink.jpg',1,'2026-10-15 21:53:27.760','2026-10-15 21:53:27.760',NULL,NULL),
(36,20,'MCC-BLK-6060','60x60','polished','Classic Black',NULL,NULL,4,1.440,NULL,25000.00,36000.00,NULL,'RWF','/tiles/classic-black.jpg','/tiles/classic-black.jpg',1,'2026-10-15 21:53:27.791','2026-10-15 21:53:27.791',NULL,NULL),
(37,20,'MCC-BLK-60120','60x120','polished','Classic Black',NULL,NULL,2,1.440,NULL,30000.00,43200.00,NULL,'RWF','/tiles/classic-black.jpg','/tiles/classic-black.jpg',1,'2026-10-15 21:53:27.812','2026-10-15 21:53:27.812',NULL,NULL),
(38,21,'MCC-CREM-BR-6060','60x60','polished','Cremino Brown',NULL,NULL,4,1.440,NULL,24500.00,35280.00,NULL,'RWF','/tiles/cremino-brown.jpg','/tiles/cremino-brown.jpg',1,'2026-10-15 21:53:27.844','2026-10-15 21:53:27.844',NULL,NULL),
(39,21,'MCC-CREM-BR-60120','60x120','polished','Cremino Brown',NULL,NULL,2,1.440,NULL,29500.00,42480.00,NULL,'RWF','/tiles/cremino-brown.jpg','/tiles/cremino-brown.jpg',1,'2026-10-15 21:53:27.864','2026-10-15 21:53:27.864',NULL,NULL),
(40,22,'MCC-WOOD-ELM-20120','20x120','matt','Elm Yellow Wood',NULL,NULL,6,1.440,NULL,25000.00,36000.00,NULL,'RWF','/tiles/elm_yellow_wood.jpg','/tiles/elm_yellow_wood.jpg',1,'2026-10-15 21:53:27.888','2026-10-15 21:53:27.888',NULL,NULL),
(41,22,'MCC-WOOD-ELM-3060','30x60','matt','Elm Yellow Wood',NULL,NULL,8,1.440,NULL,22000.00,31680.00,NULL,'RWF','/tiles/elm_yellow_wood.jpg','/tiles/elm_yellow_wood.jpg',1,'2026-10-15 21:53:27.904','2026-10-15 21:53:27.904',NULL,NULL),
(42,23,'MCC-WOOD-FLAM-20120','20x120','matt','Flam Wood Grey',NULL,NULL,6,1.440,NULL,25000.00,36000.00,NULL,'RWF','/tiles/flam-wood-grey.jpg','/tiles/flam-wood-grey.jpg',1,'2026-10-15 21:53:27.928','2026-10-15 21:53:27.928',NULL,NULL),
(43,24,'MCC-GANGA-6060','60x60','textured','Ganga Stone',NULL,NULL,4,1.440,NULL,22000.00,31680.00,NULL,'RWF','/tiles/ganga-stone.jpg','/tiles/ganga-stone.jpg',1,'2026-10-15 21:53:27.959','2026-10-15 21:53:27.959',NULL,NULL),
(44,24,'MCC-GANGA-3060','30x60','textured','Ganga Stone',NULL,NULL,8,1.440,NULL,20000.00,28800.00,NULL,'RWF','/tiles/ganga-stone.jpg','/tiles/ganga-stone.jpg',1,'2026-10-15 21:53:27.976','2026-10-15 21:53:27.976',NULL,NULL),
(45,25,'MCC-GEMINI-BG-6060','60x60','matt','Gemini Beige',NULL,NULL,4,1.440,NULL,20500.00,29520.00,NULL,'RWF','/tiles/gemini-beige.jpg','/tiles/gemini-beige.jpg',1,'2026-10-15 21:53:28.007','2026-10-15 21:53:28.007',NULL,NULL),
(46,26,'MCC-GEMINI-BR-6060','60x60','matt','Gemini Brown',NULL,NULL,4,1.440,NULL,20500.00,29520.00,NULL,'RWF','/tiles/gemini-brown.jpg','/tiles/gemini-brown.jpg',1,'2026-10-15 21:53:28.037','2026-10-15 21:53:28.037',NULL,NULL),
(47,27,'MCC-KRUK-WH-3060','30x60','matt','Kruk Stone White',NULL,NULL,8,1.440,NULL,21500.00,30960.00,NULL,'RWF','/tiles/kruk-stone-white.jpg','/tiles/kruk-stone-white.jpg',1,'2026-10-15 21:53:28.132','2026-10-15 21:53:28.132',NULL,NULL),
(48,28,'MCC-KRUK-GR-6060','60x60','textured','Krukstone Grey',NULL,NULL,4,1.440,NULL,22500.00,32400.00,NULL,'RWF','/tiles/krukstone-grey.jpg','/tiles/krukstone-grey.jpg',1,'2026-10-15 21:53:28.252','2026-10-15 21:53:28.252',NULL,NULL),
(49,29,'MCC-MIL-GR-6060','60x60','polished','Milano Grey',NULL,NULL,4,1.440,NULL,25000.00,36000.00,NULL,'RWF','/tiles/milano-grey.jpg','/tiles/milano-grey.jpg',1,'2026-10-15 21:53:28.291','2026-10-15 21:53:28.291',NULL,NULL),
(50,29,'MCC-MIL-GR-60120','60x120','polished','Milano Grey',NULL,NULL,2,1.440,NULL,29500.00,42480.00,NULL,'RWF','/tiles/milano-grey.jpg','/tiles/milano-grey.jpg',1,'2026-10-15 21:53:28.312','2026-10-15 21:53:28.312',NULL,NULL),
(51,30,'MCC-NARM-BR-6060','60x60','polished','Narmanda Brown',NULL,NULL,4,1.440,NULL,24500.00,35280.00,NULL,'RWF','/tiles/narmanda-brown.jpg','/tiles/narmanda-brown.jpg',1,'2026-10-15 21:53:28.343','2026-10-15 21:53:28.343',NULL,NULL),
(52,30,'MCC-NARM-BR-60120','60x120','polished','Narmanda Brown',NULL,NULL,2,1.440,NULL,29000.00,41760.00,NULL,'RWF','/tiles/narmanda-brown.jpg','/tiles/narmanda-brown.jpg',1,'2026-10-15 21:53:28.362','2026-10-15 21:53:28.362',NULL,NULL),
(53,31,'MCC-WOOD-OLV-20120','20x120','matt','Oliver Wood',NULL,NULL,6,1.440,NULL,25000.00,36000.00,NULL,'RWF','/tiles/oliver-wood.jpg','/tiles/oliver-wood.jpg',1,'2026-10-15 21:53:28.388','2026-10-15 21:53:28.388',NULL,NULL),
(54,32,'MCC-RUB-GR-6060','60x60','polished','Rubino Grey',NULL,NULL,4,1.440,NULL,24000.00,34560.00,NULL,'RWF','/tiles/rubino-grey.jpg','/tiles/rubino-grey.jpg',1,'2026-10-15 21:53:28.415','2026-10-15 21:53:28.415',NULL,NULL),
(55,32,'MCC-RUB-GR-60120','60x120','polished','Rubino Grey',NULL,NULL,2,1.440,NULL,28500.00,41040.00,NULL,'RWF','/tiles/rubino-grey.jpg','/tiles/rubino-grey.jpg',1,'2026-10-15 21:53:28.434','2026-10-15 21:53:28.434',NULL,NULL),
(56,33,'MCC-SILK-GR-6060','60x60','matt','Silk Grey',NULL,NULL,4,1.440,NULL,27000.00,38880.00,NULL,'RWF','/tiles/silk-grey.jpg','/tiles/silk-grey.jpg',1,'2026-10-15 21:53:28.465','2026-10-15 21:53:28.465',NULL,NULL),
(57,33,'MCC-SILK-GR-60120','60x120','matt','Silk Grey',NULL,NULL,2,1.440,NULL,32000.00,46080.00,NULL,'RWF','/tiles/silk-grey.jpg','/tiles/silk-grey.jpg',1,'2026-10-15 21:53:28.484','2026-10-15 21:53:28.484',NULL,NULL),
(58,34,'MCC-SILK-BR-6060','60x60','matt','Silk Brown',NULL,NULL,4,1.440,NULL,27000.00,38880.00,NULL,'RWF','/tiles/silk-brown.jpg','/tiles/silk-brown.jpg',1,'2026-10-15 21:53:28.513','2026-10-15 21:53:28.513',NULL,NULL),
(59,35,'MCC-STONE-WH-3060','30x60','glossy','Stone White',NULL,NULL,8,1.440,NULL,20000.00,28800.00,NULL,'RWF','/tiles/stone-white.jpg','/tiles/stone-white.jpg',1,'2026-10-15 21:53:28.536','2026-10-15 21:53:28.536',NULL,NULL),
(60,35,'MCC-STONE-WH-6060','60x60','matt','Stone White',NULL,NULL,4,1.440,NULL,22000.00,31680.00,NULL,'RWF','/tiles/stone-white.jpg','/tiles/stone-white.jpg',1,'2026-10-15 21:53:28.551','2026-10-15 21:53:28.551',NULL,NULL),
(61,36,'MCC-TIK-BR-20120','20x120','matt','Tik Wood Brown',NULL,NULL,6,1.440,NULL,25500.00,36720.00,NULL,'RWF','/tiles/tik-wood-brown.jpg','/tiles/tik-wood-brown.jpg',1,'2026-10-15 21:53:28.578','2026-10-15 21:53:28.578',NULL,NULL),
(62,37,'MCC-TIK-RD-20120','20x120','matt','Tik Wood Red',NULL,NULL,6,1.440,NULL,25500.00,36720.00,NULL,'RWF','/tiles/tik-wood-red.jpg','/tiles/tik-wood-red.jpg',1,'2026-10-15 21:53:28.606','2026-10-15 21:53:28.606',NULL,NULL),
(63,38,'MCC-TRAV-GN-60120','60x120','polished','Travinto Green',NULL,NULL,2,1.440,NULL,32000.00,46080.00,NULL,'RWF','/tiles/travinto-green.jpg','/tiles/travinto-green.jpg',1,'2026-10-15 21:53:28.633','2026-10-15 21:53:28.633',NULL,NULL),
(64,38,'MCC-TRAV-GN-6060','60x60','polished','Travinto Green',NULL,NULL,4,1.440,NULL,27000.00,38880.00,NULL,'RWF','/tiles/travinto-green.jpg','/tiles/travinto-green.jpg',1,'2026-10-15 21:53:28.650','2026-10-15 21:53:28.650',NULL,NULL),
(65,39,'MCC-TRAV-GR-6060','60x60','matt','Travinto Grey',NULL,NULL,4,1.440,NULL,24000.00,34560.00,NULL,'RWF','/tiles/travinto-grey.jpg','/tiles/travinto-grey.jpg',1,'2026-10-15 21:53:28.674','2026-10-15 21:53:28.674',NULL,NULL),
(66,39,'MCC-TRAV-GR-60120','60x120','polished','Travinto Grey',NULL,NULL,2,1.440,NULL,29000.00,41760.00,NULL,'RWF','/tiles/travinto-grey.jpg','/tiles/travinto-grey.jpg',1,'2026-10-15 21:53:28.691','2026-10-15 21:53:28.691',NULL,NULL),
(67,1,'TERRAIN-SANDSTONE','60x60',NULL,NULL,NULL,NULL,1,1.000,NULL,11500.00,0.00,12000.00,'RWF','/uploads/images/324b4021-301c-4541-aac0-bbef020d7eb6.jpg','/uploads/images/324b4021-301c-4541-aac0-bbef020d7eb6.jpg',1,'2026-10-22 09:07:40.632','2026-10-22 09:07:40.632',11000.00,500.00),
(69,1,'TERRAIN-SANDSTONE-60X60-MATT','60x60','Matt',NULL,NULL,NULL,1,1.000,NULL,11500.00,0.00,NULL,'RWF','/uploads/images/324b4021-301c-4541-aac0-bbef020d7eb6.jpg','/uploads/images/324b4021-301c-4541-aac0-bbef020d7eb6.jpg',1,'2026-10-22 20:28:16.207','2026-10-22 20:28:16.207',11000.00,110.93);
/*!40000 ALTER TABLE `productvariant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project`
--

DROP TABLE IF EXISTS `project`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `description` text NOT NULL,
  `gradient` text NOT NULL,
  `image` text NOT NULL,
  `large` tinyint(1) NOT NULL DEFAULT 0,
  `location` varchar(191) NOT NULL,
  `area` varchar(191) NOT NULL,
  `year` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project`
--

LOCK TABLES `project` WRITE;
/*!40000 ALTER TABLE `project` DISABLE KEYS */;
INSERT INTO `project` VALUES
(1,'Kigali Convention Centre Hotel','Hospitality','Supplied over 12,000 m² of premium floor and wall tiles for the iconic convention centre hotel complex.','from-[#1a3a2a] to-[#2d6a4f]','https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',1,'Kigali, Rwanda','12,000 m²','2022','2026-09-18 10:17:32.412','2026-09-18 10:17:32.412'),
(2,'Vision City Mall','Commercial','8,500 m² of large-format porcelain tiles for Rwanda\'s premier shopping destination.','from-[#2c3e70] to-[#4a6fa5]','/uploads/images/324b4021-301c-4541-aac0-bbef020d7eb6.jpg',0,'Kigali, Rwanda','8,500 m²','2021','2026-09-18 10:17:32.420','2026-10-25 03:14:00.396'),
(3,'Kimihurura Luxury Villas','Residential','Custom-designed tiles for 40+ premium villas in Kigali\'s most prestigious neighbourhood.','from-[#5a3e1b] to-[#8b6330]','https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',0,'Kimihurura, Kigali','4,200 m²','2023','2026-09-18 10:17:32.429','2026-09-18 10:17:32.429'),
(4,'Kigali International Airport','Infrastructure','Heavy-duty floor tiles for Rwanda\'s flagship international gateway — durable, elegant, and easy to maintain.','from-[#1a2a3a] to-[#2d4a6a]','https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80',0,'Kanombe, Kigali','22,000 m²','2020','2026-09-18 10:17:32.438','2026-09-18 10:17:32.438'),
(5,'King Faisal Hospital Expansion','Healthcare','Antibacterial, easy-clean tiles for clinical areas and patient wards across the hospital expansion.','from-[#3a1a2a] to-[#6a2d4a]','https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80',0,'Kacyiru, Kigali','3,800 m²','2023','2026-09-18 10:17:32.447','2026-09-18 10:17:32.447');
/*!40000 ALTER TABLE `project` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projecttile`
--

DROP TABLE IF EXISTS `projecttile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `projecttile` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `projectId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `projecttile_projectId_productId_key` (`projectId`,`productId`),
  KEY `projecttile_productId_fkey` (`productId`),
  CONSTRAINT `projecttile_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `projecttile_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projecttile`
--

LOCK TABLES `projecttile` WRITE;
/*!40000 ALTER TABLE `projecttile` DISABLE KEYS */;
INSERT INTO `projecttile` VALUES
(1,1,3),
(2,1,5),
(17,2,1),
(18,2,3),
(5,3,5),
(6,3,6),
(7,4,1),
(8,4,4),
(9,5,2),
(10,5,6);
/*!40000 ALTER TABLE `projecttile` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `publication`
--

DROP TABLE IF EXISTS `publication`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `publication` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(200) NOT NULL,
  `title` varchar(200) NOT NULL,
  `summary` varchar(500) NOT NULL DEFAULT '',
  `content_markdown` longtext NOT NULL DEFAULT '',
  `cover_image` text DEFAULT NULL,
  `file_url` text DEFAULT NULL,
  `placement` varchar(24) NOT NULL DEFAULT 'PUBLIC_PAGE',
  `active` tinyint(1) NOT NULL DEFAULT 0,
  `starts_at` datetime(3) DEFAULT NULL,
  `ends_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `publication_slug_key` (`slug`),
  KEY `publication_active_placement_starts_at_ends_at_idx` (`active`,`placement`,`starts_at`,`ends_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `publication`
--

LOCK TABLES `publication` WRITE;
/*!40000 ALTER TABLE `publication` DISABLE KEYS */;
/*!40000 ALTER TABLE `publication` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `refresh_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `family_id` varchar(36) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `revoked_at` datetime(3) DEFAULT NULL,
  `replaced_by_id` int(11) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `refresh_tokens_token_hash_key` (`token_hash`),
  KEY `refresh_tokens_user_id_idx` (`user_id`),
  KEY `refresh_tokens_family_id_idx` (`family_id`),
  KEY `refresh_tokens_expires_at_idx` (`expires_at`),
  CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=213 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES
(1,3,'154511ddcf7d128c33dcb4284135e4ea7285e6ed072e5257df0be51514213321','b935a557-e597-43a1-85ec-4defaadab925','2026-10-31 00:19:58.731','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 00:19:58.762'),
(2,3,'eb4f75e949ebe11a855ff8311aacadd509ddc2aa11db43fdc1d3c1faff893634','04c2e69d-bdf5-479f-a8af-bf8702822c45','2026-10-31 00:24:47.283','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 00:24:47.286'),
(3,3,'572d3e040d669aedbf3fbe842ab0950e9a18bbd30cdfb4ce1a69935d7aeb2a61','04c2e69d-bdf5-479f-a8af-bf8702822c45','2026-10-31 00:31:12.390','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 00:31:12.396'),
(5,3,'7f0f2781d3dfdb77270b4032a45d3bb6ec3cbff380d4f694c63c8a96c5be7b37','04c2e69d-bdf5-479f-a8af-bf8702822c45','2026-10-31 18:18:59.637','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 18:18:59.665'),
(6,3,'b1d1f6968f6b5b8ccaef72cc21a679ece60f417ac7491afb313a50045011962a','04c2e69d-bdf5-479f-a8af-bf8702822c45','2026-10-31 18:34:20.072','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 18:34:20.075'),
(7,3,'5023b92644d6a58622248b985804ecedaa85b44d265ee80b16b02ad439e85d91','6e72ce7e-a08e-4687-b272-d62b5ad0c8bb','2026-10-31 18:39:14.347','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 18:39:14.350'),
(8,3,'19270be8695ce7f77c0e00e5a710d180f5009137bd2a5f9e557da602309523e0','7c174876-5375-4f35-b0fe-cd0876502dd0','2026-10-31 18:41:42.355','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 18:41:42.357'),
(9,3,'c0eb7b1d7cc4f16a7e3bbc3a032e9b73268c15f13f4ec3431ed4b76489b9fd97','7a3b9945-b271-4097-aa1e-9c4c00b5a233','2026-10-31 18:43:51.340','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 18:43:51.343'),
(10,3,'45e56506f3ade13694fc2f63f6bd5bab2490604aa6c650bb2627a989c0d9f75a','7a3b9945-b271-4097-aa1e-9c4c00b5a233','2026-10-31 18:52:31.784','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 18:52:31.787'),
(11,3,'95f2a29f2580635dab9f597dd8200b5cd7b936a2e17f8e8cd671fcf85c3c1033','7a3b9945-b271-4097-aa1e-9c4c00b5a233','2026-10-31 18:52:38.240','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 18:52:38.242'),
(12,3,'1a0105610058f4f595db4de92568e7c65734671fe441f112e2ea35b1c4b8e9c0','7a3b9945-b271-4097-aa1e-9c4c00b5a233','2026-10-31 18:56:33.583','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 18:56:33.593'),
(13,3,'b4a5384e65cb44ce85b2bd18583643cd6a9361bda731c96642af6bd51af6064e','7a3b9945-b271-4097-aa1e-9c4c00b5a233','2026-10-31 18:56:39.439','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 18:56:39.441'),
(14,3,'714fa342f538451c246ee514d1df99c08973254b5232b44d8442f1452b6f8d9e','7a3b9945-b271-4097-aa1e-9c4c00b5a233','2026-10-31 19:16:16.181','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Linux; Android 14; Pixel 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','::1','2026-10-24 19:16:16.184'),
(15,3,'dd25389f6c42996f5980b3cab018d0cc19409268091411f4f348763f4257e6c7','7a3b9945-b271-4097-aa1e-9c4c00b5a233','2026-10-31 19:20:42.027','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 19:20:42.030'),
(16,3,'27c2032b34f72421400bf0772034e96151d70995322da7e93fcee3cb2969971c','7a3b9945-b271-4097-aa1e-9c4c00b5a233','2026-10-31 21:43:38.064','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Linux; Android 14; Pixel 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','::1','2026-10-24 21:43:38.067'),
(17,3,'b3ce7f4c59b65374059c88fcad4e36bb0e00198769f4673533c08e1ec6424b34','7a3b9945-b271-4097-aa1e-9c4c00b5a233','2026-10-31 21:50:50.975','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 21:50:50.995'),
(18,3,'d790d1384cdd5819acecd72bed113e0918c260d44294c1f9669c01b0ce473cb6','7a3b9945-b271-4097-aa1e-9c4c00b5a233','2026-10-31 21:51:07.865','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 21:51:07.867'),
(19,3,'6a789665c602e9c6fa1d7cac8518c0c4529ed387d226538268813c568323666b','7a3b9945-b271-4097-aa1e-9c4c00b5a233','2026-10-31 21:57:50.634','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 21:57:50.639'),
(20,3,'b6b451b083ffda0d0d88212773b8c0c5612bf9e98b5c2266dd4ac96d58405755','7a3b9945-b271-4097-aa1e-9c4c00b5a233','2026-10-31 22:09:21.628','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-24 22:09:21.661'),
(21,3,'48d8e13ea87e66a00dab4dfed1a7ed1f59b28af2acc45783735bb352c6595cba','7a3b9945-b271-4097-aa1e-9c4c00b5a233','2026-11-01 00:47:24.110','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 00:47:24.139'),
(22,3,'a6d91b7d76a247a1c9187087624a7c97136590c6dfe7ded0118d598ea55837c0','ef0e4107-8626-4cb0-8583-1750f4c8518c','2026-11-01 00:48:42.637','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 00:48:42.640'),
(23,3,'aaff041efd525af0187b1c3b5a7abdfa4f4c7d0dec2826eba4d97bc10e137272','ef0e4107-8626-4cb0-8583-1750f4c8518c','2026-11-01 00:51:25.457','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 00:51:25.461'),
(24,3,'feb1767820cf54b0809d8a8977c8e99a5fc082994861979d8d15d4cb489d4d79','ef0e4107-8626-4cb0-8583-1750f4c8518c','2026-11-01 01:03:28.755','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Linux; Android 14; SM-A556B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','::1','2026-10-25 01:03:28.759'),
(25,3,'767c7dda293070f37185e0043273cc0e6f0f334c9c16f9969a98895a81f8e93c','ef0e4107-8626-4cb0-8583-1750f4c8518c','2026-11-01 01:08:28.031','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 01:08:28.034'),
(26,3,'9a8597f2c38b5f008db799f3e060eb789fcc16a11bcbcc07a0860fadfb2f0d4a','ef0e4107-8626-4cb0-8583-1750f4c8518c','2026-11-01 01:08:34.896','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 01:08:34.898'),
(27,3,'f093df4c043acfd627dc192e1999f4baae375250fa7c5c2ed3a48a96b940e181','ef0e4107-8626-4cb0-8583-1750f4c8518c','2026-11-01 01:19:47.324','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 01:19:47.331'),
(28,3,'1a5bffd6c31d7dc269f24c135ea256c864f9ac8eb3f3da648e70b6c6833144d7','ef0e4107-8626-4cb0-8583-1750f4c8518c','2026-11-01 01:20:13.654','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 01:20:13.658'),
(29,3,'7420927d67683abb5d45f03ff413045b4f6bc1f95e6fea231bbf42c822b10036','ef0e4107-8626-4cb0-8583-1750f4c8518c','2026-11-01 01:21:29.808','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 01:21:29.811'),
(30,3,'dca65a8a9306d492ff36322b5f2793f9ae5d49cca65309602686229b0dfccd70','ef0e4107-8626-4cb0-8583-1750f4c8518c','2026-11-01 01:45:39.266','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 01:45:39.307'),
(31,3,'48fb85b5e3a13132fbba97db00f0a9b586c090a93c09271669d4c5e306a3a835','ef0e4107-8626-4cb0-8583-1750f4c8518c','2026-11-01 01:56:14.399','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 01:56:14.403'),
(32,3,'6f9ab4a7326f5cf169f59d48a6ac1c78fb2a343ec999428d2762d8bd28d0faae','ef0e4107-8626-4cb0-8583-1750f4c8518c','2026-11-01 02:10:34.440','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 02:10:34.456'),
(33,3,'8daa94345721ec960c73c9c40c8df2e7dd1a4a10cbf09fde52e2ccd67060c712','ef0e4107-8626-4cb0-8583-1750f4c8518c','2026-11-01 02:14:21.125','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 02:14:21.130'),
(34,3,'0d239bf1313b637911f8f2f9ff478c5fbd610317ce69158a7570172d92f9235b','ef0e4107-8626-4cb0-8583-1750f4c8518c','2026-11-01 02:24:03.249','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Linux; Android 14; SM-A556B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','::1','2026-10-25 02:24:03.254'),
(35,3,'51542213e47efb42cbfe2be8bcf4c74535de35be9b0c46f44b3e44ebe2191c7e','ef0e4107-8626-4cb0-8583-1750f4c8518c','2026-11-01 02:39:05.307','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 02:39:05.309'),
(36,3,'a53612f91f9d783cd2e34e0adcb35da0a3b6ea06fa4f41f237e3aef6e50d8588','ef0e4107-8626-4cb0-8583-1750f4c8518c','2026-11-01 02:42:48.098','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 02:42:48.103'),
(37,3,'7b30d4fa6a76bda3e35204cec8fee47ca3c177aeaa12ee4404be6a833ce9766f','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 02:51:39.702','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 02:51:39.706'),
(38,3,'37dc6d5c991ccbc7e07e0de1135e591f4cdfa66f7258472f03dcd9bc20c83022','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 02:59:34.330','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 02:59:34.335'),
(39,3,'7a1e7dfe04138a14bf2bad814e394c8b0f755b65a8c0be403547c5ee7fe63967','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 03:14:35.477','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 03:14:35.482'),
(40,3,'30c348ec6f8ce21663a41ae4515717965bac540dfd21c2b9425d01b8603694bf','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 03:29:41.434','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 03:29:41.437'),
(41,3,'5e1f5fea7ce37cdea1ff14e47b05f3e0fab04c55e82d9874c627f42484b78123','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 03:30:03.113','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 03:30:03.116'),
(42,3,'e0bb38ebc026ec730b98e3328d9dbb6d4276e94f75eb7092e9a19a58954e4518','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 03:30:51.142','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 03:30:51.147'),
(43,3,'29c64dc8bc4ba4bf6548979570d7747b026c1c230bc4895841d0b8e5acacc76b','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 03:36:45.831','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 03:36:45.837'),
(44,3,'bc36688902f5968f15b75d31e782e3fa5411495a3c9ce5bd048aaae969158ad4','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 03:53:18.880','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 03:53:18.890'),
(45,3,'60c91fc6b4db5c2559f6a8d4a6f64a8e6294344b13865b754d1662beeb0625fb','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 03:58:00.476','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 03:58:00.482'),
(46,3,'4153425ad20e958ff7347f3fcaabe880b869fe25d48a4ecd66bdb63866bc4b61','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 04:05:47.224','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 04:05:47.270'),
(47,3,'d10d8268bf163fe5c6190f8c4d612963a37cccab8b3637d56bb65fb9044f381d','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 04:52:40.737','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 04:52:40.751'),
(48,3,'149448af3fddb893ddc08261e45162be63d3fcee49a0660dd98879b3f2ee58e0','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 05:02:16.960','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 05:02:16.998'),
(49,3,'c1cbf8b02d728f6f3cec3fc531c732da6aa7adf94b0aa97bd4d6ba6189964815','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 05:17:12.402','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 05:17:12.407'),
(50,3,'357ce7e416f0864542fe10a9795a7f5b1ac20b4cebe613bc611a4b34e663c6f7','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 05:18:05.561','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 05:18:05.564'),
(51,3,'bb90abbd11010bc48e5d836d978efe063035566c106d29e49085adf43b6f25b4','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 05:33:28.447','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 05:33:28.450'),
(52,3,'5f34e224a201fc6a112fb8ff646bac62125adb78a33e1784d6a7ed49ed3501bb','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 05:48:31.358','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 05:48:31.361'),
(53,3,'90ae9ae8f3c38e8db73c6cf29226303258e1e86ae5a6450bb606a1b259e4fdd1','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 06:03:34.263','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 06:03:34.265'),
(54,3,'42543a2d913188039e93143f2bbee774ae4439053d368823b6b57c4b81df5a45','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 06:18:37.368','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 06:18:37.372'),
(55,3,'a6ac1a4dcc5cbd2be8696acc41eef9de3d35c0aca89491ee1b0f237803a06509','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 06:33:40.733','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 06:33:40.742'),
(56,3,'50ad5fa95e56bd7da99134a427dbd1dd466c5c0b3e5c93f355386af098a019a1','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 06:48:43.822','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 06:48:43.824'),
(57,3,'87edbddd893dd4e2c38ba7b5a15042496d5e5a15cddbe26a00d022c760ab7527','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 07:03:46.799','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 07:03:46.801'),
(58,3,'238755681183e4323b4e7ab24c8c55a3ff5a4540d6abd55ec1108365d5f31fe1','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 07:18:49.763','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 07:18:49.766'),
(59,3,'0124e8616f814938cec5b76361c83955a851a94dc88076c6cfd4e50c72e73bd8','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 07:33:52.704','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 07:33:52.708'),
(60,3,'6f75b750173e6936102d30969a857cb3627dfcd40a9b6522cb4b362b507567ee','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 07:48:55.719','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 07:48:55.723'),
(61,3,'e85c10f3a53451e649a3d404bb9e4ae956c44aa256fb52da67fc39f9580ee4fc','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 08:03:58.767','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 08:03:58.772'),
(62,3,'a4118216f17317e06bd88ecd6f077100a9964a63a7b9d9accfce4c7cfb144ca7','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 08:19:01.826','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 08:19:01.829'),
(63,3,'9f7ac15f034f4ec73c93381ae40732c7e8a903bb876c273a2a3f1cbd153032ca','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 08:34:04.562','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 08:34:04.564'),
(64,3,'c3da04f6f49d3b37446d2f9a23bbe6ece1af952f4af4e698cd5c2a20e13a4ac5','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 08:49:07.432','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 08:49:07.434'),
(65,3,'bd1ef51b0f356f9929df95c2b9364bd8e8416614b31ca7a962f505e60e38f96c','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 09:04:10.457','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 09:04:10.460'),
(66,3,'569fc22b711370b2df038992d638b896801b827025e53f4f4bdfe2ca997bfae2','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 09:19:13.201','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 09:19:13.204'),
(67,3,'96ea04d957f6ee34dff7bec29376cc21145cdfe47b4e1467199e58575cd05081','ed9eb30b-6a3f-48cc-a1bb-05cf23a49d13','2026-11-01 15:07:59.624','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 15:07:59.626'),
(68,3,'ebb6d6dc074dc0fa485d5c5c9b5d44f528e4ef700d214c317188fac07cfc738b','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:19:29.001','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:19:29.036'),
(69,3,'7592b662bf93a1160c824018e7127fe660bc832323c990aeca44762a3b678d59','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:25:32.788','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:25:32.790'),
(70,3,'d739ef4635a49b1bda226a68c8bd9b5a739fe967521489c0708435bb9c2a633c','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:26:44.008','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:26:44.009'),
(71,3,'158db9caaf25b0305e99944a7924f7a65a296b774a61eca886512ddb6823b838','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:41:58.470','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:41:58.472'),
(72,3,'986048048cd7359d1d008a74d507ac96b09e92751a1153e4ce48715b75cc5232','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:43:23.913','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:43:23.914'),
(73,3,'07e80b06e784f9b5c96af96d8fd7e8930e817f4a5f1ca0552be78c6855766019','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:43:28.733','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:43:28.734'),
(74,3,'33288b1fcfa2b27502feb7d5c23bf4d00f78f9dbc07c852036934fbef042454c','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:45:14.302','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:45:14.303'),
(75,3,'15c96b5e1ad959a41c288dcf804f3670ca9872ee78d27288a41141a8bccef26e','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:45:29.043','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:45:29.044'),
(76,3,'f617cfedb970311dbe6c3ec7e95b06693329fcd41e364df2a6247794c6abfe81','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:45:32.355','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:45:32.356'),
(77,3,'790d57522930479fdd2e29c4f24982bfb3506b0beaa2e4a82cbbeedc2e4d2149','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:45:59.233','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:45:59.234'),
(78,3,'c01780e468abacb7bafd187b2e49574e11d42b32a84def89336041bff6e83653','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:46:02.668','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:46:02.669'),
(79,3,'f2ffbb9b8c5ba8bbc31f9eab593ebfd00be87ba45135473806daba7aeee5f59b','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:46:29.361','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:46:29.362'),
(80,3,'a26b1d552ab7dfa7cc82ad31f9eaf2497f6ccd9124f01a4c69cf3ac14a404823','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:46:32.811','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:46:32.811'),
(81,3,'6186d441b655c2d2ac1595fc3fe077e42e483c933bcdc778822057d1c6f545b1','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:46:38.761','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:46:38.762'),
(82,3,'151973ad85d08b0fbbb4f58c66d2d69e5d0abccd63478489c61b572f112996a1','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:47:03.074','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:47:03.075'),
(83,3,'2545036af2886ef8578faf1d3949a7942a75c4865b9f2aa1a4eaeef950bfb8b2','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:47:03.505','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:47:03.506'),
(84,3,'32b2b90f0dc51d5668ed18766712a625473c7f2ca06abe8a0d486b5275a35408','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:47:33.223','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:47:33.224'),
(85,3,'f20f413acb11d5ff5ae76ff7c4783a3d865ef5894c46eb5fd1f0e7b7fe18439a','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:47:33.766','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:47:33.766'),
(86,3,'9b063e293c2c0150689cb50935a120adf4eb4150a0760a35927dc7498d7fd948','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:48:03.354','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:48:03.355'),
(87,3,'12ae854acde5c13b5ea932631658dadf0e8229d168df918a46dd17abc5e860ca','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:48:03.896','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:48:03.897'),
(88,3,'7823970e8aa890dfa0d0921fb532040e82f87dae2472a18aeca66e19bb8b37bd','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:48:33.492','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:48:33.492'),
(89,3,'45e42e5d4110e69e53dae04299b7f8238cdd4e6e564b33edea9ac197350bb981','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:48:34.016','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:48:34.017'),
(90,3,'30d5188fd67ffa5504d4b9bf5925f63c5c32cbfa521063acb08ef1e7e45af028','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:49:03.639','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:49:03.640'),
(91,3,'db42f4352e1f09745ba3bfe186e76f73b2bd8f77d9b105173abaa0058462a62b','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:49:04.136','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:49:04.137'),
(92,3,'9e1f28dede40f07a65753802033e61c1443d7bcf83e2beae10d8213508afa25f','38dc93b3-96bd-484b-a18e-74bf7a064bc0','2026-11-01 19:49:33.780','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:49:33.781'),
(93,3,'4efb75d4da21d99fb895edb54ff877fdf400f3c642d60e3eccf17d98ff7ee46d','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 19:50:07.853','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 19:50:07.854'),
(94,3,'d4df14e763ed346e1a6853dfc31c82c97b198c176cad30da7f4f14d83223b2ff','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:04:37.113','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:04:37.114'),
(95,3,'ac859de67ea11dba022522c7e59b50328de9553af934f7d79335a21f57c77f24','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:04:42.638','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:04:42.638'),
(96,3,'f2b2786266ce638965cf6f3a85aa0e95e4f07b502a4b527e910c1ab12f398138','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:05:07.577','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:05:07.578'),
(97,3,'84fa93a2f6ca4b3a402c059e2198f3254a1ee7a6819e470fd5f686dc6bb9232c','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:05:15.050','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:05:15.078'),
(98,3,'52c5922e3c9f40ed32d042009850f0557ac6f6dfd631d95286eea125a8af3c59','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:05:37.846','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:05:37.846'),
(99,3,'6c02ce103f9ada25b91718ad41014c594fe55e127ac8c9f9471094bc93c2f503','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:05:46.673','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:05:46.674'),
(100,3,'778d21a3d776b0ef426e165388efe2391c9a9ffc62aa38c1a014c9309ddc3c71','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:06:08.002','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:06:08.003'),
(101,3,'6f1a5979a344356be8c4b491300b93acce1894943de5200b8ebffc31cd9ddb4f','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:06:16.923','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:06:16.924'),
(102,3,'a126b78bf6b3e969add7ce6b825777517759c16a9dacb100d802ba54446b1529','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:06:38.142','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:06:38.143'),
(103,3,'261d58ae3c172581cd8f3d097ae1e95fae80812593433340c9dc9fbc9ad9a528','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:06:47.112','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:06:47.113'),
(104,3,'b2b6d8350748c844a8d53cf2eb444f0c55fe736b1f3e7ce3cf51bee7f6a71cba','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:07:08.275','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:07:08.276'),
(105,3,'661803f1a0a899223d6d639e02bee23ec44bced3d0fd0309e70d0c21cfcd4273','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:07:17.283','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:07:17.284'),
(106,3,'8a0463d4b5f231f36e0c35f8fa89c16f4cd32bd10d416064668107c7849aba26','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:07:38.420','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:07:38.420'),
(107,3,'4de63ec08891cf20a9e87910ffdd86b3adfe89829b2dfb1b8b3d310b2498e5c7','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:07:45.056','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:07:45.057'),
(108,3,'ec6fff70d3198a8c2269bb17fe0bd370ad59831db327735aefe21011eb7cbd8e','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:08:08.570','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:08:08.571'),
(109,3,'6c728b4ce1d64a39ae463ec49f9ad59cf59db50f7a0bcff1f31d0233155d8dd4','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:08:15.692','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:08:15.693'),
(110,3,'fdb746e9ace5cbf6e9ab3de3a494faba2666f414aa3ee8b2b3301eb1099189a8','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:08:38.719','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:08:38.719'),
(111,3,'93a6df8b729a87e91430686041cfb965c87c51f3d968aaa35a580d9d4eebdf6f','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:08:45.893','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:08:45.894'),
(112,3,'93cce3a85f7a38b6f39089aec6cdb22ffbcd835f94a5852e4c96f35d5918e2ca','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:09:08.854','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:09:08.855'),
(113,3,'6935f4d623298f00e67aef43c4879e75f9bc9208ead907f10bd3749965efbb0c','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:09:16.085','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:09:16.086'),
(114,3,'2082c89598f3c59bc7662c445cd52c38230446abdd472c3a01f568e0d11ab28e','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:09:38.992','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:09:38.993'),
(115,3,'0b466db84bfc4a769be60a7bd48a201069e5539bbf6171d0e5045cfdd24675c8','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:09:46.271','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:09:46.272'),
(116,3,'5a738bf01d8adffb8bf8146b95407d5ecb4bc734e1c5eed006cca1ea33ab7456','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:10:10.008','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:10:10.009'),
(117,3,'c2e8c8df2c579877cc263917181ad2048a427bc93cbe997b0775dc51149ed1a6','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:10:16.437','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:10:16.438'),
(118,3,'594d4d51869f2e2dabb3bb5892a8462e630ff530be8cc7fc3b34ab97fca6ec54','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:10:40.444','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:10:40.445'),
(119,3,'4af7ffbc2d48b093c688cacb751643c9aef5276e8d9583d67f3f3cfd3a84c91b','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:10:46.591','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:10:46.592'),
(120,3,'a0fae4611033d4f5d558741bae4aa695d7ef4520e4757d217015b02812e127ad','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:11:10.589','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:11:10.590'),
(121,3,'c174d7fa84b9ddb2a35e635e91b54db4949f59305280ef8fcf29a60177bf961a','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:11:16.726','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:11:16.727'),
(122,3,'3c31ee563efd3c4fd667bc3462849b85e3325bc394ff9a4cecf8e871de31c842','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:11:40.730','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:11:40.730'),
(123,3,'91968a6f56796449211cafca094b8108c35de73468fde05df3f69efdd797dde8','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:11:46.857','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:11:46.857'),
(124,3,'83a39e09be3f787df17b66568d6717671d132c3a78f282b4b16fb1e14f77724c','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:12:10.844','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:12:10.844'),
(125,3,'fa19993ba17b7d4d8b9f291d660775c3ccde23a2a0da1071a81facc87436eb44','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:12:16.979','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:12:16.980'),
(126,3,'760cb4ed2957f0afd433cd31d2e4c33ccecb8222c15553b696fa121f629d045c','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:12:40.959','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:12:40.960'),
(127,3,'e4c9f085ba47dc7322d6648ce731a36f53c89342274afcc68e2799e00fc96747','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:12:47.115','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:12:47.116'),
(128,3,'b2fc3d35863d217e4304878c321b6ca84047c448eee3797be69be92e3b3a711f','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:13:11.086','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:13:11.086'),
(129,3,'7a730a57e908cd0c4f1dceebfde89972524f3a8fd27f2a05099879d75d357037','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:13:17.251','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:13:17.252'),
(130,3,'3fdca6bad9d7fd2fef62fecc8aceba0c5796e809bda69b566ac19e6d3aae7d8e','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 20:28:18.635','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 20:28:18.636'),
(131,3,'77071f24da9a0617c307de849cccf39080ec2ec4f4f440503b80f6cecca6b822','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 21:23:14.630','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 21:23:14.632'),
(132,3,'11ff3165e82e848a8fd1e8a45df251ef7891784a62b365c9c29ef156052a9276','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 21:27:04.554','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 21:27:04.555'),
(133,3,'be6580fe3d4ecaa3441605bc5e94a34529fd3a1ae7430fafc59f65f93e54a6bd','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 21:27:10.297','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 21:27:10.298'),
(134,3,'70dd421e75767fe933472b0f8e707c7d2611a853e3c2b516181321a84a946e42','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 21:33:26.133','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 21:33:26.136'),
(135,3,'1d826744db080f926ed5d930de54a93379bacbfdf3bf770f3da4f0e8cb862385','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 21:33:40.694','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 21:33:40.695'),
(136,3,'1e5a5cb0d8f25ade7e4bdb5a8fe6894ecb75766b55deadc00d69ba1e2cad3ff7','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-01 22:43:30.746','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-25 22:43:30.750'),
(137,3,'f2d2fb18f8d69f8a50ec6a91b2149de8532621db72aec0462d3c8d483265943b','0d3c0c99-e323-47a2-80e0-bc18b04a21d5','2026-11-02 01:46:28.563','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 01:46:28.776'),
(138,3,'46801a101b49b986bc47510efac349dc799b3fb5b162b1b822a3c53dfad0991b','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 01:48:52.530','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 01:48:52.544'),
(139,3,'c22ff5a7b7f65e053cd83dc7c3e90f47e43ab179cf439a282f774589eaf79480','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 01:57:12.455','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 01:57:12.461'),
(140,3,'1b9d53b38eaefc9fab5e1862eff0831438a038c8dc4bf18e324c95ee3e091c59','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 01:57:14.094','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 01:57:14.096'),
(141,3,'d0c2f4e41ece8638c91ec3bd08c56856f22c5797bf19d23a4ee49997d98b29d4','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 01:58:47.373','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 01:58:47.376'),
(142,3,'95413b479df3b2c98c6faa64d65b7d8fefb8ddc9e8599506c8fb6231a1c48d00','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 01:58:56.531','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 01:58:56.535'),
(143,3,'75a8179e1edaa810ff047d9d9da87b836e8935f5df7f09110a999c0f8d4da1b9','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 01:59:17.341','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 01:59:17.342'),
(144,3,'7fbe0d2c9f10baaa3c98179295326a31a8ca754c6ed766d7fd7eef771beab5b0','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 01:59:28.495','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 01:59:28.497'),
(145,3,'63a9529d65915a4ec5df51161acff357fe2f5850e6bb9b5a2e798e01a2dffc01','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 02:02:07.374','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 02:02:07.378'),
(146,3,'776db2cc9f3f2fd66cb78f3789a41bfdbc36c5b36c1b1fa4287059df5b48d6a2','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 02:15:22.159','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 02:15:22.210'),
(147,3,'bb8e7b7db6f2520554717a06e39e4ba5a1f10d17a922e6d7fac6607214722bb9','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 02:15:24.546','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 02:15:24.548'),
(148,3,'ffb8549a4e03cf06c4ef2c5ee767cea3f099c1e3dbe5e848c692800a144a087b','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 02:15:28.241','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 02:15:28.244'),
(149,3,'7ba0fc6df5e3662ca5738f1eae5ccc26d21d397d9e9210a4582fcbf0572a775e','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 02:20:24.392','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 02:20:24.395'),
(150,3,'e5ee19c1f7e782e735f9b6e1ab6e4396306c5368b250f5ca7a48ca4b9b2eb2fc','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 02:21:43.597','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 02:21:43.599'),
(151,3,'2ed0c8f7e23076515616444704da65ab067582eb80442beafd8ae35a619937b7','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 02:22:01.484','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 02:22:01.492'),
(152,3,'b962b701a594494820bd09255eefa2a015ba680d52bd250b1b374603608055a7','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 02:22:03.893','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 02:22:03.895'),
(153,3,'5d2d0e47e0dd3a9b3e958deea4f0af563122f82a0375af88abae0da179e6c374','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 02:22:05.625','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 02:22:05.627'),
(154,3,'172b8edba7caf2ad22006b41e2d7197cefa269538066751d0b1af23306fe9fe8','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 02:22:07.161','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 02:22:07.164'),
(155,3,'311f3cd6d81dedb9983afb9e44bab9c4ef46a615add09c6e705f5ff9cebaec5e','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 02:22:09.247','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 02:22:09.256'),
(156,3,'ff9ad602e0570433f37865bc100f5cf7f4f07c12ed2e94cc685d0982ce02faed','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 02:22:10.744','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 02:22:10.775'),
(157,3,'809718768856b9d428838e193e00103fba30535513c00f397bfc48d671fa8a1d','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 02:22:12.117','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 02:22:12.120'),
(158,3,'d9715b62225fe110e0b1258367265091a4709c90b8fa2ea404fc9207b0dc35dd','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 02:22:14.323','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 02:22:14.325'),
(159,3,'334aac2d6944fc16f9602f97ad1f298a2763953b0915ee893c402de8b7bb3a4b','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 02:22:15.775','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 02:22:15.777'),
(160,3,'482abaecb89a45cc63999108612c364cc2a72224c4ca53e76d9822a64f04fb7c','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 15:30:29.705','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 15:30:29.729'),
(161,3,'ea9e241515eb5286bb28fd8bf5c511d5146cbaa3b59fad4393b12933cd417a13','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 15:45:34.924','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 15:45:34.926'),
(162,3,'605b150ebb52d1e8b5eb78e8327b9d9f56352324519c94c5d225d1859160ae8b','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 15:47:18.007','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 15:47:18.009'),
(163,3,'1f57030a2bee5a9e5745c0e8b4bdabac7ebee3199b5607ef353b19543d99a862','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 16:03:27.691','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 16:03:27.707'),
(164,3,'75365e62f2063cd16249e25ab58de2a070d4177de878930c5554af11211dbe6d','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 17:02:13.108','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 17:02:13.120'),
(165,3,'1495ff005639a8842e2a0911510f5855db307843a00f681ba26a2d5f6239c01c','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 17:17:53.194','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 17:17:53.405'),
(166,3,'41200b8c0b3f3dcd67864d56f1996225092861fd34d076f67ed4c28b5d2798f6','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 17:33:29.717','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 17:33:29.720'),
(167,3,'ec2c14be9c56a19dc9309151eeb614debf6c00cceded8be2e327433fbaff08a6','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 17:48:53.551','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 17:48:53.556'),
(168,3,'e739caa65386c1b8dcd62d81c710768b2e26b006ecc270eed5e4c15589ad9b69','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 18:04:56.557','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 18:04:56.763'),
(170,3,'aefbc87a990d4a995b09ffcbe8319d0c49ca8c178a60dbd0e3de15d07f9d8ce7','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 20:30:20.207','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 20:30:20.465'),
(171,3,'7c40732c1e5af6465935828e231a1d5bf00c476810e07e99c1f49ba7baf41ae8','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 20:38:59.819','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 20:38:59.821'),
(172,3,'e311dbb462a96c894443117b28daf7bab0cea0c0dc6a635e4dfa3d1a25fcd0b0','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 20:47:55.541','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 20:47:55.545'),
(173,3,'f47a55d1332f6610abca79a2057faafe48183fa9de534a3fc666b3e128380d76','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 20:56:39.061','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 20:56:39.065'),
(174,3,'70bec473f9353aaa935c40265758bcbdc0255da0d6bf8365b036a87ccd477b86','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 20:58:16.460','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 20:58:16.466'),
(175,3,'27e937a1e3d8c38e73047dca3253d6b7209f7c3a410def0db01256af9d1d8f5f','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 20:58:57.468','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 20:58:57.474'),
(176,3,'0d4d070df7829094317d320a58948353e4f26e2f4ad11df1a99520f57f83168b','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 20:59:47.044','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 20:59:47.045'),
(177,3,'aff221ac07d18169799b41d079f73426a240916cb5dbc58fcedcdf8fd6f7eb9c','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 21:19:15.383','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Linux; Android 14; SM-A556B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','::1','2026-10-26 21:19:15.389'),
(178,3,'4dad100163ce332b72de716fb7d66a89bee10e530308d922f2f3040f449f82bf','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 21:30:33.053','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 21:30:33.056'),
(179,3,'d278c48ec28d0c09d2fa193ebddcd9afeb6e4e5a0798f41603c88daf706c681a','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 21:32:37.545','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 21:32:37.546'),
(180,3,'06a660d5d2b39f5089d9a4e24ece93d7a51ef23a2a4001ce2b874feb8652175d','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 21:33:50.705','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 21:33:50.707'),
(181,3,'495c6c036dc95ea5050ac5397d38b044e75a711ff59a2dc4c5d97c8f5073f6fa','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 21:34:31.388','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 21:34:31.408'),
(182,3,'688bf33cd879cb50d15ce48a5b01a227e7cf9106475de68b6c2a3c2a45564307','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 21:35:04.707','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 21:35:04.711'),
(183,3,'a69edd8ef4177bd0d06c63f5e0e260677576bc20f6a32b097695b8ca5bf150b4','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 21:35:34.587','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 21:35:34.589'),
(184,3,'10e31bb17075066b36a914aed8d2883ba46160914bc22ec28518f73dcad9e951','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 21:36:48.907','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 21:36:48.909'),
(185,3,'2016c1718f6f5cc00697ec97ffdda0a1fce21b4b3366bd3add8266dbe39b1363','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 21:51:50.512','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 21:51:50.516'),
(186,3,'6153a4f83201236ca3b9562f6d66b0a5b32d9088054b046f97ebbbdbc28ecf92','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 21:51:51.494','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 21:51:51.499'),
(187,3,'af46969c770473814fc6a0a6d0a93796822bb9245a29126e3369100572e7ff78','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 22:51:43.512','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 22:51:43.677'),
(188,3,'cb520924fbddadc13013b66268902e18cff51982f387570425ef8c70291dfd03','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 22:55:22.382','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 22:55:22.468'),
(189,3,'d80f8dada6b12d73fa1b4071082a46fb80e09a93c6b667917e7ec7773c5969fa','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 22:57:36.427','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 22:57:36.493'),
(190,3,'cd75e56387b23bbc93c430de814016ddb823bb35e40c0ac5422e1d1a411bfd51','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 23:01:37.145','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 23:01:37.151'),
(191,3,'975636d2e129d9a7ce7499568518f35cfd11ce87cde8f94368beb6978aef015d','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 23:04:22.204','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 23:04:22.206'),
(192,3,'f469a2df9d9ddf20379f67b3242f9e3dcb160d533aa7ebb6c5c6bf7351023b1c','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 23:16:25.823','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Linux; Android 14; SM-A556B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','::1','2026-10-26 23:16:25.828'),
(193,3,'505f01d0ee739186f60fde1f33af6b7cac96f91794bc5c8f435b08a5e1ada076','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 23:31:15.487','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 23:31:15.493'),
(194,3,'7be605b5930fbb7f7b59d8634ae7331d076c959917debee39ac99f787005ce99','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 23:31:23.721','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 23:31:23.723'),
(195,3,'eb776fbd20eaef53df093104c7c17a8a6771650e12b129d1a352471c2777907a','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 23:34:23.937','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 23:34:23.939'),
(196,3,'6befb595b357b396f45799e5d2bfab9cd713343700388f12141b81a92ac1adab','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 23:37:59.784','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 23:37:59.787'),
(197,3,'022ecc6433e13dde869ab0446c92e6a72b47c92e77f82dfa12319fa3be5ffce4','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 23:50:57.085','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 23:50:57.091'),
(198,3,'8682d5d91cbca33b6fadc2317004700c15bfe75c57c1acab21f8170d4a5685ae','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 23:51:09.735','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 23:51:09.738'),
(199,3,'bc7429f239962455d004e67763be49fad0b0fa21680c3b4a47160ad2416789c3','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-02 23:51:41.289','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-26 23:51:41.291'),
(200,3,'9fc4d45ae4e2eb2862614c6233e98b7ad8d44deccb7389d5aebd9270e0f587df','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-03 00:13:31.847','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-27 00:13:31.852'),
(201,3,'c5e153861acba77b1197764df83e209adbd65ca6355ee3ddcb1f46083168c8d6','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-03 00:19:34.700','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-27 00:19:34.716'),
(202,3,'6c0f4882179585fb152dc70927ac2c6a1521a7ffe5532d663fcb2c91d68c707a','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-03 00:19:47.676','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-27 00:19:47.683'),
(203,3,'320421cb86f68a9269fa917b11b14bb88b91b5df6d15dd4fb513c2569aebf56e','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-03 00:20:43.191','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-27 00:20:43.195'),
(204,3,'65a74599b0f8f1d126cf965077b2f482c9c35af3c4ae67af21ab96c9f648cbad','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-03 00:21:55.697','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-27 00:21:55.699'),
(205,3,'abbd7824001873e1596d1435097a45649b4e254048579c316ed2a023ca2b49bc','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-03 00:22:03.468','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-27 00:22:03.471'),
(206,3,'6ac8d33f493abd2d1c7f004ae8f88e19e48b3cd082025419c00053b46a5ee243','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-03 00:22:22.981','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-27 00:22:22.983'),
(207,3,'e5c18c60849c631abf157b336f0bb384e72ffa10e0e3119ea632b6f2c4c51cc2','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-03 00:23:28.340','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-27 00:23:28.343'),
(208,3,'806bbe8336c115b4fc21605ef022c9b66f9c2d0c10d948417a6ae23a06e5cf4e','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-03 00:26:01.270','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-27 00:26:01.279'),
(209,3,'a64bf6399064d04112c6c622b3918ca6adb535c8a288deb063198121f6a1160d','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-03 00:28:11.972','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-27 00:28:11.976'),
(210,3,'2bf57a567f3ec013c323b5dd9bb1b2fabc1f620f139ad35200d6b02b04dc416e','b6317ba9-b9e9-4e3c-9e0b-afa26aee6c26','2026-11-03 00:30:22.278','2026-10-27 00:38:19.240',NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-27 00:30:22.284'),
(211,3,'ef526f6ff8d3dfc22a35d67698e18b6fa9c5564714b262ba4cc4174a7bf5ce79','73e689bb-53a2-4ff2-9514-43bd6db04468','2026-11-03 00:38:51.580','2026-10-27 00:53:56.540',212,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-27 00:38:51.585'),
(212,3,'c5ca743478ffabad503bf55f0f467e5584f7287eb947df52cf474779f1853362','73e689bb-53a2-4ff2-9514-43bd6db04468','2026-11-03 00:53:56.584',NULL,NULL,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','::1','2026-10-27 00:53:56.589');
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `review`
--

DROP TABLE IF EXISTS `review`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `review` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `productId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `rating` int(11) NOT NULL,
  `title` varchar(150) DEFAULT NULL,
  `body` text DEFAULT NULL,
  `approved` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `review_productId_userId_key` (`productId`,`userId`),
  KEY `review_userId_fkey` (`userId`),
  CONSTRAINT `review_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `review_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review`
--

LOCK TABLES `review` WRITE;
/*!40000 ALTER TABLE `review` DISABLE KEYS */;
INSERT INTO `review` VALUES
(1,1,3,2,NULL,'mmmmmmmmmmm',1,'2026-10-23 01:43:44.374','2026-10-23 01:46:47.594'),
(2,2,3,5,NULL,'😃🥶 ggghghghghghh',1,'2026-10-23 01:54:19.350','2026-10-23 01:54:45.889');
/*!40000 ALTER TABLE `review` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role` (
  `id` int(11) NOT NULL,
  `roleName` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Role_roleName_key` (`roleName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role`
--

LOCK TABLES `role` WRITE;
/*!40000 ALTER TABLE `role` DISABLE KEYS */;
INSERT INTO `role` VALUES
(2,'ADMIN'),
(5,'CONTENT_MANAGER'),
(7,'CONTRACTOR'),
(8,'CUSTOMER'),
(9,'GUEST'),
(3,'INVENTORY_MANAGER'),
(4,'SALES_STAFF'),
(1,'SUPER_ADMIN'),
(6,'SUPPORT_STAFF');
/*!40000 ALTER TABLE `role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stockmovement`
--

DROP TABLE IF EXISTS `stockmovement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stockmovement` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `variantId` int(11) NOT NULL,
  `type` enum('PURCHASE','SALE','RETURN','ADJUSTMENT','RESERVE','RELEASE') NOT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `createdById` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `stockmovement_variantId_createdAt_idx` (`variantId`,`createdAt`),
  KEY `stockmovement_createdById_fkey` (`createdById`),
  CONSTRAINT `stockmovement_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `stockmovement_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `productvariant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stockmovement`
--

LOCK TABLES `stockmovement` WRITE;
/*!40000 ALTER TABLE `stockmovement` DISABLE KEYS */;
INSERT INTO `stockmovement` VALUES
(1,3,'RESERVE',1.00,'MCC-20261018-205190',NULL,3,'2026-10-18 02:33:13.849'),
(2,17,'RESERVE',4.00,'MCC-20261018-205190',NULL,3,'2026-10-18 02:33:13.849'),
(3,10,'ADJUSTMENT',100.00,NULL,'Manual: 350 → 450',3,'2026-10-19 00:14:20.722'),
(4,1,'RESERVE',1.00,'MCC-20261021-952507',NULL,3,'2026-10-21 21:40:48.962'),
(5,3,'RESERVE',1.00,'MCC-20261021-952507',NULL,3,'2026-10-21 21:40:48.962'),
(6,4,'RESERVE',1.00,'MCC-20261021-952507',NULL,3,'2026-10-21 21:40:48.962'),
(7,5,'RESERVE',1.00,'MCC-20261021-952507',NULL,3,'2026-10-21 21:40:48.962'),
(8,7,'RESERVE',1.00,'MCC-20261021-952507',NULL,3,'2026-10-21 21:40:48.962'),
(9,8,'RESERVE',1.00,'MCC-20261021-952507',NULL,3,'2026-10-21 21:40:48.962'),
(10,1,'RESERVE',1.00,'MCC-20261021-860400',NULL,3,'2026-10-21 22:16:32.313'),
(11,3,'RESERVE',1.00,'MCC-20261021-860400',NULL,3,'2026-10-21 22:16:32.313'),
(12,4,'RESERVE',1.00,'MCC-20261021-860400',NULL,3,'2026-10-21 22:16:32.313'),
(13,10,'ADJUSTMENT',50.00,NULL,'Manual: 450 → 500 m²',3,'2026-10-22 07:20:08.163'),
(14,10,'ADJUSTMENT',10.00,NULL,'Manual: 500 → 510 m²',3,'2026-10-22 07:20:28.556'),
(15,1,'RESERVE',10.00,'MCC-20261022-358890',NULL,3,'2026-10-22 07:57:38.177'),
(16,5,'RESERVE',100.00,'MCC-20261022-358890',NULL,3,'2026-10-22 07:57:38.177'),
(17,10,'ADJUSTMENT',90.00,NULL,'Manual: 510 → 600 m²',3,'2026-10-22 08:56:43.994'),
(18,67,'ADJUSTMENT',70.00,NULL,'Manual: 0 → 70 m²',3,'2026-10-22 09:09:34.927'),
(19,59,'RESERVE',10.00,'MCC-20261022-495692',NULL,3,'2026-10-22 21:52:11.917'),
(20,5,'RESERVE',10.00,'MCC-20261022-799561',NULL,3,'2026-10-22 21:59:24.983'),
(21,5,'RESERVE',10.00,'MCC-20261022-365464',NULL,3,'2026-10-22 22:09:45.662'),
(22,1,'RESERVE',10.00,'MCC-20261023-684278',NULL,3,'2026-10-23 03:42:19.692'),
(23,3,'RESERVE',10.00,'MCC-20261023-684278',NULL,3,'2026-10-23 03:42:19.692'),
(24,67,'RESERVE',1.00,'MCC-20261023-684278',NULL,3,'2026-10-23 03:42:19.692'),
(25,67,'RESERVE',10.00,'checkout:f05c6af1ec2fdd89626cabd288399fe41ed25c4236162f58935d906b1125492e','Temporary checkout hold',NULL,'2026-10-25 01:15:30.706'),
(26,67,'RELEASE',10.00,'checkout:f05c6af1ec2fdd89626cabd288399fe41ed25c4236162f58935d906b1125492e','Checkout hold expired or was replaced',NULL,'2026-10-25 02:33:48.426'),
(27,67,'RESERVE',10.00,'checkout:9e87a0aef501e07eedfa3dc919eb955d68a98b666ee9d16b14e72fe424c11b59','Temporary checkout hold',NULL,'2026-10-25 02:33:48.658');
/*!40000 ALTER TABLE `stockmovement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `testimonial`
--

DROP TABLE IF EXISTS `testimonial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `testimonial` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `text` text NOT NULL,
  `name` varchar(191) NOT NULL,
  `role` varchar(191) NOT NULL,
  `initials` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `testimonial`
--

LOCK TABLES `testimonial` WRITE;
/*!40000 ALTER TABLE `testimonial` DISABLE KEYS */;
INSERT INTO `testimonial` VALUES
(1,'MCC tiles transformed our hotel lobby completely. The quality is outstanding and the team was incredibly professional throughout the entire project. We\'ll never use another supplier.','Jean-Marie Nkurunziza','CEO, Horizon Hospitality Group','JM','2026-09-18 10:17:32.471','2026-10-19 00:13:03.294'),
(2,'As an architect, I specify tiles for every project. MCC consistently delivers products that match the specs perfectly and arrive on time. Their range is also the best I\'ve seen in East Africa.','Amina Cyusa','Principal Architect, Cyusa & Associates','AC','2026-09-18 10:17:32.471','2026-09-18 10:17:32.471'),
(3,'We used MCC tiles for our entire housing development — 120 units. Not a single quality complaint from any homeowner. The price-to-quality ratio is simply unbeatable in the region.','Patrick Kalisa','Director, Kalisa Property Developers','PK','2026-09-18 10:17:32.471','2026-09-18 10:17:32.471');
/*!40000 ALTER TABLE `testimonial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_permissions`
--

DROP TABLE IF EXISTS `user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_permissions` (
  `user_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `granted_by_id` int(11) DEFAULT NULL,
  `granted_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`user_id`,`permission_id`),
  KEY `user_permissions_permission_id_fkey` (`permission_id`),
  KEY `user_permissions_granted_by_id_fkey` (`granted_by_id`),
  CONSTRAINT `user_permissions_granted_by_id_fkey` FOREIGN KEY (`granted_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `user_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_permissions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permissions`
--

LOCK TABLES `user_permissions` WRITE;
/*!40000 ALTER TABLE `user_permissions` DISABLE KEYS */;
INSERT INTO `user_permissions` VALUES
(1,67,3,'2026-10-25 05:23:04.651'),
(3,1,3,'2026-10-22 15:13:24.171'),
(3,2,3,'2026-10-22 15:13:24.209'),
(3,3,3,'2026-10-22 15:13:24.245'),
(3,4,3,'2026-10-22 15:13:24.277'),
(8,67,3,'2026-10-25 15:19:06.976');
/*!40000 ALTER TABLE `user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `password` text NOT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `email_verified_at` datetime(3) DEFAULT NULL,
  `last_login` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `bio` varchar(500) DEFAULT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `job_title` varchar(100) DEFAULT NULL,
  `show_on_homepage` tinyint(1) NOT NULL DEFAULT 0,
  `two_factor_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `two_factor_method` varchar(30) DEFAULT NULL,
  `two_factor_pending_secret` text DEFAULT NULL,
  `two_factor_secret` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  UNIQUE KEY `users_phone_number_key` (`phone_number`),
  KEY `users_show_on_homepage_display_order_idx` (`show_on_homepage`,`display_order`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'impanodeveloper@gmail.com',NULL,'impano','enock','$2b$10$B.iMOy/cIUSDJUFVjWHL0ef6GbyymboMrJKy0fjngSbGHEKzZ2.yS',NULL,1,'2026-10-22 23:16:22.743','2026-10-18 02:59:27.062','2026-10-18 01:42:42.647','2026-10-25 05:23:04.598',NULL,0,NULL,0,0,NULL,NULL,NULL),
(3,'impanomanzienock@gmail.com','+250791105800','manzi','enock impano','$2b$12$qEmLnSGfSlllCK2Dso1Pl.n6akYQ2kFnzPUOEMm5K.SCYznnOxOJm','/uploads/images/f4692ab9-c0b9-4c81-9f42-446f3ff04892.png',1,'2026-10-24 00:19:14.808','2026-10-27 00:38:51.613','2026-10-18 01:42:42.647','2026-10-27 00:38:51.636','lorem ipsum',0,'manager',0,1,'authenticator',NULL,'-Ygj_MGnxTlxeJjIk9Nwvz-uARz0Yt84zsHSZUfJWM4OY4_CkkxyxCcIk1-eN82QR2Cpc0LEBnl5LxpB'),
(5,'impanomanzienonnnck@gmail.com',NULL,'mmmmmmmm',NULL,'$2b$12$CkymVYlSXZV1Bwq9U.ODGOHCz7uxDFER4..ccQrWTZj/clhhVWh6W',NULL,0,NULL,NULL,'2026-10-19 00:33:25.832','2026-10-19 00:33:41.118',NULL,0,NULL,0,0,NULL,NULL,NULL),
(7,'imerafiki@gmail.com','imerafiki@gmail.com','Manzi Enock','IMPANO','$2b$12$H6qL1A4J22hI4agDa9NKs.9./huiy2lOc0aZUGlFokt9CVTdhTes2',NULL,1,NULL,'2026-10-23 03:50:29.890','2026-10-23 03:50:22.505','2026-10-23 03:50:29.918',NULL,0,NULL,0,0,NULL,NULL,NULL),
(8,'gilbertkendrick@gmail.com','+250737664870','rugaba',NULL,'$2b$12$0AR9XcdA.taapTpWmWBjJeA9z3gZRF7aW/ofwMXClSHC0HXa8VkwC',NULL,1,NULL,NULL,'2026-10-25 15:19:06.934','2026-10-25 15:19:06.934',NULL,0,NULL,0,0,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visualizerdesign`
--

DROP TABLE IF EXISTS `visualizerdesign`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `visualizerdesign` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `sessionId` varchar(100) DEFAULT NULL,
  `sceneId` int(11) DEFAULT NULL,
  `name` varchar(150) DEFAULT NULL,
  `shareToken` varchar(64) DEFAULT NULL,
  `previewImage` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `visualizerdesign_shareToken_key` (`shareToken`),
  KEY `visualizerdesign_userId_idx` (`userId`),
  KEY `visualizerdesign_sceneId_fkey` (`sceneId`),
  CONSTRAINT `visualizerdesign_sceneId_fkey` FOREIGN KEY (`sceneId`) REFERENCES `visualizerscene` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `visualizerdesign_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visualizerdesign`
--

LOCK TABLES `visualizerdesign` WRITE;
/*!40000 ALTER TABLE `visualizerdesign` DISABLE KEYS */;
INSERT INTO `visualizerdesign` VALUES
(1,3,NULL,NULL,'My room design','200e649f1c39fb2ae0a109ab713eda67',NULL,'2026-10-23 00:16:46.867','2026-10-23 00:16:46.867'),
(2,3,NULL,NULL,'My room design1','f2dc12718238b446a3498070c99cb1be',NULL,'2026-10-23 00:17:59.752','2026-10-23 00:17:59.752'),
(3,3,NULL,4,'My room design','5796a1465f867612638b0e5644b0cbf7',NULL,'2026-10-23 00:22:54.641','2026-10-23 00:48:25.938'),
(4,NULL,'23dbcbf6-a85c-49f0-8e14-a1aecc734205',NULL,'My room design with previews','7128286e10e29982e512989070f85afa','data:image/webp;base64,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','2026-10-26 02:01:12.229','2026-10-26 02:01:12.229');
/*!40000 ALTER TABLE `visualizerdesign` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visualizerdesignitem`
--

DROP TABLE IF EXISTS `visualizerdesignitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `visualizerdesignitem` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `designId` int(11) NOT NULL,
  `variantId` int(11) NOT NULL,
  `surfaceKey` varchar(50) NOT NULL,
  `groutColor` varchar(20) DEFAULT NULL,
  `rotation` int(11) NOT NULL DEFAULT 0,
  `layout` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `visualizerdesignitem_designId_surfaceKey_key` (`designId`,`surfaceKey`),
  KEY `visualizerdesignitem_variantId_fkey` (`variantId`),
  CONSTRAINT `visualizerdesignitem_designId_fkey` FOREIGN KEY (`designId`) REFERENCES `visualizerdesign` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `visualizerdesignitem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `productvariant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visualizerdesignitem`
--

LOCK TABLES `visualizerdesignitem` WRITE;
/*!40000 ALTER TABLE `visualizerdesignitem` DISABLE KEYS */;
INSERT INTO `visualizerdesignitem` VALUES
(1,1,59,'1','Almond',0,'Stack Bond Horizontal'),
(2,2,59,'1','Almond',0,'Stack Bond Horizontal'),
(12,3,25,'left:1','Almond',0,'Stack Bond Horizontal'),
(13,3,36,'right:1','Almond',0,'Stack Bond Horizontal'),
(14,3,36,'right:3','Almond',0,'Stack Bond Horizontal'),
(15,4,36,'left:1','Almond',0,'Stack Bond Horizontal');
/*!40000 ALTER TABLE `visualizerdesignitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visualizerscene`
--

DROP TABLE IF EXISTS `visualizerscene`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `visualizerscene` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `roomType` varchar(50) NOT NULL,
  `image` text NOT NULL,
  `thumbnail` text DEFAULT NULL,
  `surfaces` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`surfaces`)),
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visualizerscene`
--

LOCK TABLES `visualizerscene` WRITE;
/*!40000 ALTER TABLE `visualizerscene` DISABLE KEYS */;
INSERT INTO `visualizerscene` VALUES
(1,'Bathroom 1','bathroom','/scenes/bathroom_1/base.jpg','/scenes/bathroom_1/base.jpg','\"[{\\\"sortOrder\\\":1,\\\"name\\\":\\\"Floor\\\",\\\"type\\\":\\\"FLOOR\\\",\\\"category\\\":\\\"Floor\\\",\\\"mask\\\":\\\"/scenes/bathroom_1/masks/mask_1.png\\\"},{\\\"sortOrder\\\":2,\\\"name\\\":\\\"Wall\\\",\\\"type\\\":\\\"WALL\\\",\\\"category\\\":\\\"Wall\\\",\\\"mask\\\":\\\"/scenes/bathroom_1/masks/mask_2.png\\\"},{\\\"sortOrder\\\":3,\\\"name\\\":\\\"Shower Walls\\\",\\\"type\\\":\\\"WALL\\\",\\\"category\\\":\\\"Wall\\\",\\\"mask\\\":\\\"/scenes/bathroom_1/masks/mask_3.png\\\"},{\\\"sortOrder\\\":4,\\\"name\\\":\\\"Countertop\\\",\\\"type\\\":\\\"COUNTER\\\",\\\"category\\\":\\\"Counter\\\",\\\"mask\\\":\\\"/scenes/bathroom_1/masks/mask_4.png\\\"},{\\\"sortOrder\\\":5,\\\"name\\\":\\\"Cabinets\\\",\\\"type\\\":\\\"CABINETS\\\",\\\"category\\\":\\\"Cabinet\\\",\\\"mask\\\":\\\"/scenes/bathroom_1/masks/mask_5.png\\\"},{\\\"sortOrder\\\":6,\\\"name\\\":\\\"Painted Walls\\\",\\\"type\\\":\\\"PAINTED WALL\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/bathroom_1/masks/mask_6.png\\\"},{\\\"sortOrder\\\":7,\\\"name\\\":\\\"Trim\\\",\\\"type\\\":\\\"TRIM\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/bathroom_1/masks/mask_7.png\\\"}]\"',1,0,'2026-10-15 21:53:28.716','2026-10-15 21:53:28.716'),
(2,'Bathroom 2','bathroom','/scenes/bathroom_2/base.jpg','/scenes/bathroom_2/base.jpg','\"[{\\\"sortOrder\\\":1,\\\"name\\\":\\\"Floor\\\",\\\"type\\\":\\\"FLOOR\\\",\\\"category\\\":\\\"Floor\\\",\\\"mask\\\":\\\"/scenes/bathroom_2/masks/mask_1.png\\\"},{\\\"sortOrder\\\":2,\\\"name\\\":\\\"Shower Floor\\\",\\\"type\\\":\\\"FLOOR\\\",\\\"category\\\":\\\"Floor\\\",\\\"mask\\\":\\\"/scenes/bathroom_2/masks/mask_2.png\\\"},{\\\"sortOrder\\\":3,\\\"name\\\":\\\"Shower Surround\\\",\\\"type\\\":\\\"WALL\\\",\\\"category\\\":\\\"Wall\\\",\\\"mask\\\":\\\"/scenes/bathroom_2/masks/mask_3.png\\\"},{\\\"sortOrder\\\":4,\\\"name\\\":\\\"Wall\\\",\\\"type\\\":\\\"WALL\\\",\\\"category\\\":\\\"Wall\\\",\\\"mask\\\":\\\"/scenes/bathroom_2/masks/mask_4.png\\\"},{\\\"sortOrder\\\":5,\\\"name\\\":\\\"Shower Wall\\\",\\\"type\\\":\\\"WALL\\\",\\\"category\\\":\\\"Wall\\\",\\\"mask\\\":\\\"/scenes/bathroom_2/masks/mask_5.png\\\"},{\\\"sortOrder\\\":6,\\\"name\\\":\\\"Shower Curb\\\",\\\"type\\\":\\\"COUNTER\\\",\\\"category\\\":\\\"Counter\\\",\\\"mask\\\":\\\"/scenes/bathroom_2/masks/mask_6.png\\\"},{\\\"sortOrder\\\":7,\\\"name\\\":\\\"Trim\\\",\\\"type\\\":\\\"TRIM\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/bathroom_2/masks/mask_7.png\\\"},{\\\"sortOrder\\\":8,\\\"name\\\":\\\"Painted Walls\\\",\\\"type\\\":\\\"PAINTED WALL\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/bathroom_2/masks/mask_8.png\\\"}]\"',1,1,'2026-10-15 21:53:28.734','2026-10-15 21:53:28.734'),
(3,'Bathroom 3','bathroom','/scenes/bathroom_3/base.jpg','/scenes/bathroom_3/base.jpg','\"[{\\\"sortOrder\\\":1,\\\"name\\\":\\\"Floor\\\",\\\"type\\\":\\\"FLOOR\\\",\\\"category\\\":\\\"Floor\\\",\\\"mask\\\":\\\"/scenes/bathroom_3/masks/mask_1.png\\\"},{\\\"sortOrder\\\":2,\\\"name\\\":\\\"Shower Floor\\\",\\\"type\\\":\\\"FLOOR\\\",\\\"category\\\":\\\"Floor\\\",\\\"mask\\\":\\\"/scenes/bathroom_3/masks/mask_2.png\\\"},{\\\"sortOrder\\\":3,\\\"name\\\":\\\"Shower Walls\\\",\\\"type\\\":\\\"WALL\\\",\\\"category\\\":\\\"Wall\\\",\\\"mask\\\":\\\"/scenes/bathroom_3/masks/mask_3.png\\\"},{\\\"sortOrder\\\":4,\\\"name\\\":\\\"Shower Accent\\\",\\\"type\\\":\\\"WALL\\\",\\\"category\\\":\\\"Wall\\\",\\\"mask\\\":\\\"/scenes/bathroom_3/masks/mask_4.png\\\"},{\\\"sortOrder\\\":5,\\\"name\\\":\\\"Shower Niche\\\",\\\"type\\\":\\\"WALL\\\",\\\"category\\\":\\\"Wall\\\",\\\"mask\\\":\\\"/scenes/bathroom_3/masks/mask_5.png\\\"},{\\\"sortOrder\\\":6,\\\"name\\\":\\\"Shower Bench\\\",\\\"type\\\":\\\"WALL\\\",\\\"category\\\":\\\"Wall\\\",\\\"mask\\\":\\\"/scenes/bathroom_3/masks/mask_6.png\\\"},{\\\"sortOrder\\\":7,\\\"name\\\":\\\"Trim\\\",\\\"type\\\":\\\"TRIM\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/bathroom_3/masks/mask_7.png\\\"},{\\\"sortOrder\\\":8,\\\"name\\\":\\\"Painted Walls\\\",\\\"type\\\":\\\"PAINTED WALL\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/bathroom_3/masks/mask_8.png\\\"}]\"',1,2,'2026-10-15 21:53:28.746','2026-10-15 21:53:28.746'),
(4,'Bathroom 4','bathroom','/scenes/bathroom_4/base.jpg','/scenes/bathroom_4/base.jpg','\"[{\\\"sortOrder\\\":1,\\\"name\\\":\\\"Floor\\\",\\\"type\\\":\\\"FLOOR\\\",\\\"category\\\":\\\"Floor\\\",\\\"mask\\\":\\\"/scenes/bathroom_4/masks/mask_1.png\\\"},{\\\"sortOrder\\\":2,\\\"name\\\":\\\"Walls\\\",\\\"type\\\":\\\"WALL\\\",\\\"category\\\":\\\"Wall\\\",\\\"mask\\\":\\\"/scenes/bathroom_4/masks/mask_2.png\\\"},{\\\"sortOrder\\\":3,\\\"name\\\":\\\"Accent Wall\\\",\\\"type\\\":\\\"WALL\\\",\\\"category\\\":\\\"Wall\\\",\\\"mask\\\":\\\"/scenes/bathroom_4/masks/mask_3.png\\\"},{\\\"sortOrder\\\":4,\\\"name\\\":\\\"Countertop\\\",\\\"type\\\":\\\"COUNTER\\\",\\\"category\\\":\\\"Counter\\\",\\\"mask\\\":\\\"/scenes/bathroom_4/masks/mask_4.png\\\"},{\\\"sortOrder\\\":5,\\\"name\\\":\\\"Cabinets\\\",\\\"type\\\":\\\"CABINETS\\\",\\\"category\\\":\\\"Cabinet\\\",\\\"mask\\\":\\\"/scenes/bathroom_4/masks/mask_5.png\\\"},{\\\"sortOrder\\\":6,\\\"name\\\":\\\"Trim\\\",\\\"type\\\":\\\"TRIM\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/bathroom_4/masks/mask_6.png\\\"}]\"',1,3,'2026-10-15 21:53:28.759','2026-10-15 21:53:28.759'),
(5,'Bathroom 5','bathroom','/scenes/bathroom_5/base.jpg','/scenes/bathroom_5/base.jpg','\"[{\\\"sortOrder\\\":1,\\\"name\\\":\\\"Floor\\\",\\\"type\\\":\\\"FLOOR\\\",\\\"category\\\":\\\"Floor\\\",\\\"mask\\\":\\\"/scenes/bathroom_5/masks/mask_1.png\\\"},{\\\"sortOrder\\\":2,\\\"name\\\":\\\"Shower Floor\\\",\\\"type\\\":\\\"FLOOR\\\",\\\"category\\\":\\\"Floor\\\",\\\"mask\\\":\\\"/scenes/bathroom_5/masks/mask_2.png\\\"},{\\\"sortOrder\\\":3,\\\"name\\\":\\\"Backsplash\\\",\\\"type\\\":\\\"BACKSPLASH\\\",\\\"category\\\":\\\"Backsplash\\\",\\\"mask\\\":\\\"/scenes/bathroom_5/masks/mask_3.png\\\"},{\\\"sortOrder\\\":4,\\\"name\\\":\\\"Shower Surround\\\",\\\"type\\\":\\\"WALL\\\",\\\"category\\\":\\\"Wall\\\",\\\"mask\\\":\\\"/scenes/bathroom_5/masks/mask_4.png\\\"},{\\\"sortOrder\\\":5,\\\"name\\\":\\\"Shower Walls\\\",\\\"type\\\":\\\"WALL\\\",\\\"category\\\":\\\"Wall\\\",\\\"mask\\\":\\\"/scenes/bathroom_5/masks/mask_5.png\\\"},{\\\"sortOrder\\\":6,\\\"name\\\":\\\"Shower Accent\\\",\\\"type\\\":\\\"WALL\\\",\\\"category\\\":\\\"Wall\\\",\\\"mask\\\":\\\"/scenes/bathroom_5/masks/mask_6.png\\\"},{\\\"sortOrder\\\":7,\\\"name\\\":\\\"Shower Curb\\\",\\\"type\\\":\\\"COUNTER\\\",\\\"category\\\":\\\"Counter\\\",\\\"mask\\\":\\\"/scenes/bathroom_5/masks/mask_7.png\\\"},{\\\"sortOrder\\\":8,\\\"name\\\":\\\"Countertop\\\",\\\"type\\\":\\\"COUNTER\\\",\\\"category\\\":\\\"Counter\\\",\\\"mask\\\":\\\"/scenes/bathroom_5/masks/mask_8.png\\\"},{\\\"sortOrder\\\":9,\\\"name\\\":\\\"Cabinet\\\",\\\"type\\\":\\\"CABINETS\\\",\\\"category\\\":\\\"Cabinet\\\",\\\"mask\\\":\\\"/scenes/bathroom_5/masks/mask_9.png\\\"},{\\\"sortOrder\\\":10,\\\"name\\\":\\\"Trim\\\",\\\"type\\\":\\\"TRIM\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/bathroom_5/masks/mask_10.png\\\"},{\\\"sortOrder\\\":11,\\\"name\\\":\\\"Painted Walls\\\",\\\"type\\\":\\\"PAINTED WALL\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/bathroom_5/masks/mask_11.png\\\"}]\"',1,4,'2026-10-15 21:53:28.770','2026-10-15 21:53:28.770'),
(6,'Kitchen 1','kitchen','/scenes/kitchen_1/base.jpg','/scenes/kitchen_1/base.jpg','\"[{\\\"sortOrder\\\":1,\\\"name\\\":\\\"Floor\\\",\\\"type\\\":\\\"FLOOR\\\",\\\"category\\\":\\\"Floor\\\",\\\"mask\\\":\\\"/scenes/kitchen_1/masks/mask_1.png\\\"},{\\\"sortOrder\\\":2,\\\"name\\\":\\\"Backsplash\\\",\\\"type\\\":\\\"BACKSPLASH\\\",\\\"category\\\":\\\"Backsplash\\\",\\\"mask\\\":\\\"/scenes/kitchen_1/masks/mask_2.png\\\"},{\\\"sortOrder\\\":3,\\\"name\\\":\\\"Countertops\\\",\\\"type\\\":\\\"COUNTER\\\",\\\"category\\\":\\\"Counter\\\",\\\"mask\\\":\\\"/scenes/kitchen_1/masks/mask_3.png\\\"},{\\\"sortOrder\\\":4,\\\"name\\\":\\\"Island Countertop\\\",\\\"type\\\":\\\"COUNTER\\\",\\\"category\\\":\\\"Counter\\\",\\\"mask\\\":\\\"/scenes/kitchen_1/masks/mask_4.png\\\"},{\\\"sortOrder\\\":5,\\\"name\\\":\\\"Cabinets\\\",\\\"type\\\":\\\"CABINETS\\\",\\\"category\\\":\\\"Cabinet\\\",\\\"mask\\\":\\\"/scenes/kitchen_1/masks/mask_5.png\\\"},{\\\"sortOrder\\\":6,\\\"name\\\":\\\"Island Cabinets\\\",\\\"type\\\":\\\"CABINETS\\\",\\\"category\\\":\\\"Cabinet\\\",\\\"mask\\\":\\\"/scenes/kitchen_1/masks/mask_6.png\\\"},{\\\"sortOrder\\\":7,\\\"name\\\":\\\"Painted Walls\\\",\\\"type\\\":\\\"PAINTED WALL\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/kitchen_1/masks/mask_7.png\\\"},{\\\"sortOrder\\\":8,\\\"name\\\":\\\"Trim\\\",\\\"type\\\":\\\"TRIM\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/kitchen_1/masks/mask_8.png\\\"}]\"',1,5,'2026-10-15 21:53:28.786','2026-10-15 21:53:28.786'),
(7,'Kitchen 2','kitchen','/scenes/kitchen_2/base.jpg','/scenes/kitchen_2/base.jpg','\"[{\\\"sortOrder\\\":1,\\\"name\\\":\\\"Floor\\\",\\\"type\\\":\\\"FLOOR\\\",\\\"category\\\":\\\"Floor\\\",\\\"mask\\\":\\\"/scenes/kitchen_2/masks/mask_1.png\\\"},{\\\"sortOrder\\\":2,\\\"name\\\":\\\"Backsplash\\\",\\\"type\\\":\\\"BACKSPLASH\\\",\\\"category\\\":\\\"Backsplash\\\",\\\"mask\\\":\\\"/scenes/kitchen_2/masks/mask_2.png\\\"},{\\\"sortOrder\\\":3,\\\"name\\\":\\\"Countertops\\\",\\\"type\\\":\\\"COUNTER\\\",\\\"category\\\":\\\"Counter\\\",\\\"mask\\\":\\\"/scenes/kitchen_2/masks/mask_3.png\\\"},{\\\"sortOrder\\\":4,\\\"name\\\":\\\"Island Countertop\\\",\\\"type\\\":\\\"COUNTER\\\",\\\"category\\\":\\\"Counter\\\",\\\"mask\\\":\\\"/scenes/kitchen_2/masks/mask_4.png\\\"},{\\\"sortOrder\\\":5,\\\"name\\\":\\\"Cabinets\\\",\\\"type\\\":\\\"CABINETS\\\",\\\"category\\\":\\\"Cabinet\\\",\\\"mask\\\":\\\"/scenes/kitchen_2/masks/mask_5.png\\\"},{\\\"sortOrder\\\":6,\\\"name\\\":\\\"Island Cabinets\\\",\\\"type\\\":\\\"CABINETS\\\",\\\"category\\\":\\\"Cabinet\\\",\\\"mask\\\":\\\"/scenes/kitchen_2/masks/mask_6.png\\\"},{\\\"sortOrder\\\":7,\\\"name\\\":\\\"Painted Walls\\\",\\\"type\\\":\\\"PAINTED WALL\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/kitchen_2/masks/mask_7.png\\\"},{\\\"sortOrder\\\":8,\\\"name\\\":\\\"Trim\\\",\\\"type\\\":\\\"TRIM\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/kitchen_2/masks/mask_8.png\\\"}]\"',1,6,'2026-10-15 21:53:28.805','2026-10-15 21:53:28.805'),
(8,'Kitchen 3','kitchen','/scenes/kitchen_3/base.jpg','/scenes/kitchen_3/base.jpg','\"[{\\\"sortOrder\\\":1,\\\"name\\\":\\\"Floor\\\",\\\"type\\\":\\\"FLOOR\\\",\\\"category\\\":\\\"Floor\\\",\\\"mask\\\":\\\"/scenes/kitchen_3/masks/mask_1.png\\\"},{\\\"sortOrder\\\":2,\\\"name\\\":\\\"Backsplash\\\",\\\"type\\\":\\\"BACKSPLASH\\\",\\\"category\\\":\\\"Backsplash\\\",\\\"mask\\\":\\\"/scenes/kitchen_3/masks/mask_2.png\\\"},{\\\"sortOrder\\\":3,\\\"name\\\":\\\"Countertops\\\",\\\"type\\\":\\\"COUNTER\\\",\\\"category\\\":\\\"Counter\\\",\\\"mask\\\":\\\"/scenes/kitchen_3/masks/mask_3.png\\\"},{\\\"sortOrder\\\":4,\\\"name\\\":\\\"Island Countertop\\\",\\\"type\\\":\\\"COUNTER\\\",\\\"category\\\":\\\"Counter\\\",\\\"mask\\\":\\\"/scenes/kitchen_3/masks/mask_4.png\\\"},{\\\"sortOrder\\\":5,\\\"name\\\":\\\"Cabinets\\\",\\\"type\\\":\\\"CABINETS\\\",\\\"category\\\":\\\"Cabinet\\\",\\\"mask\\\":\\\"/scenes/kitchen_3/masks/mask_5.png\\\"},{\\\"sortOrder\\\":6,\\\"name\\\":\\\"Island Cabinets\\\",\\\"type\\\":\\\"CABINETS\\\",\\\"category\\\":\\\"Cabinet\\\",\\\"mask\\\":\\\"/scenes/kitchen_3/masks/mask_6.png\\\"},{\\\"sortOrder\\\":7,\\\"name\\\":\\\"Painted Walls\\\",\\\"type\\\":\\\"PAINTED WALL\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/kitchen_3/masks/mask_7.png\\\"},{\\\"sortOrder\\\":8,\\\"name\\\":\\\"Trim\\\",\\\"type\\\":\\\"TRIM\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/kitchen_3/masks/mask_8.png\\\"}]\"',1,7,'2026-10-15 21:53:28.820','2026-10-15 21:53:28.820'),
(9,'Kitchen 4','kitchen','/scenes/kitchen_4/base.jpg','/scenes/kitchen_4/base.jpg','\"[{\\\"sortOrder\\\":1,\\\"name\\\":\\\"Floor\\\",\\\"type\\\":\\\"FLOOR\\\",\\\"category\\\":\\\"Floor\\\",\\\"mask\\\":\\\"/scenes/kitchen_4/masks/mask_1.png\\\"},{\\\"sortOrder\\\":2,\\\"name\\\":\\\"Backsplash\\\",\\\"type\\\":\\\"BACKSPLASH\\\",\\\"category\\\":\\\"Backsplash\\\",\\\"mask\\\":\\\"/scenes/kitchen_4/masks/mask_2.png\\\"},{\\\"sortOrder\\\":3,\\\"name\\\":\\\"Countertops\\\",\\\"type\\\":\\\"COUNTER\\\",\\\"category\\\":\\\"Counter\\\",\\\"mask\\\":\\\"/scenes/kitchen_4/masks/mask_3.png\\\"},{\\\"sortOrder\\\":4,\\\"name\\\":\\\"Island Countertop\\\",\\\"type\\\":\\\"COUNTER\\\",\\\"category\\\":\\\"Counter\\\",\\\"mask\\\":\\\"/scenes/kitchen_4/masks/mask_4.png\\\"},{\\\"sortOrder\\\":5,\\\"name\\\":\\\"Cabinets\\\",\\\"type\\\":\\\"CABINETS\\\",\\\"category\\\":\\\"Cabinet\\\",\\\"mask\\\":\\\"/scenes/kitchen_4/masks/mask_5.png\\\"},{\\\"sortOrder\\\":6,\\\"name\\\":\\\"Island Cabinets\\\",\\\"type\\\":\\\"CABINETS\\\",\\\"category\\\":\\\"Cabinet\\\",\\\"mask\\\":\\\"/scenes/kitchen_4/masks/mask_6.png\\\"},{\\\"sortOrder\\\":7,\\\"name\\\":\\\"Painted Walls\\\",\\\"type\\\":\\\"PAINTED WALL\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/kitchen_4/masks/mask_7.png\\\"},{\\\"sortOrder\\\":8,\\\"name\\\":\\\"Trim\\\",\\\"type\\\":\\\"TRIM\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/kitchen_4/masks/mask_8.png\\\"}]\"',1,8,'2026-10-15 21:53:28.836','2026-10-15 21:53:28.836'),
(10,'Kitchen 5','kitchen','/scenes/kitchen_5/base.jpg','/scenes/kitchen_5/base.jpg','\"[{\\\"sortOrder\\\":1,\\\"name\\\":\\\"Floor\\\",\\\"type\\\":\\\"FLOOR\\\",\\\"category\\\":\\\"Floor\\\",\\\"mask\\\":\\\"/scenes/kitchen_5/masks/mask_1.png\\\"},{\\\"sortOrder\\\":2,\\\"name\\\":\\\"Backsplash\\\",\\\"type\\\":\\\"BACKSPLASH\\\",\\\"category\\\":\\\"Backsplash\\\",\\\"mask\\\":\\\"/scenes/kitchen_5/masks/mask_2.png\\\"},{\\\"sortOrder\\\":3,\\\"name\\\":\\\"Accent\\\",\\\"type\\\":\\\"BACKSPLASH\\\",\\\"category\\\":\\\"Backsplash\\\",\\\"mask\\\":\\\"/scenes/kitchen_5/masks/mask_3.png\\\"},{\\\"sortOrder\\\":4,\\\"name\\\":\\\"Countertops\\\",\\\"type\\\":\\\"COUNTER\\\",\\\"category\\\":\\\"Counter\\\",\\\"mask\\\":\\\"/scenes/kitchen_5/masks/mask_4.png\\\"},{\\\"sortOrder\\\":5,\\\"name\\\":\\\"Cabinets\\\",\\\"type\\\":\\\"CABINETS\\\",\\\"category\\\":\\\"Cabinet\\\",\\\"mask\\\":\\\"/scenes/kitchen_5/masks/mask_5.png\\\"}]\"',1,9,'2026-10-15 21:53:28.848','2026-10-15 21:53:28.848'),
(11,'Laundry Room 1','laundry','/scenes/laundry_room_1/base.jpg','/scenes/laundry_room_1/base.jpg','\"[{\\\"sortOrder\\\":1,\\\"name\\\":\\\"Floor\\\",\\\"type\\\":\\\"FLOOR\\\",\\\"category\\\":\\\"Floor\\\",\\\"mask\\\":\\\"/scenes/laundry_room_1/masks/mask_1.png\\\"},{\\\"sortOrder\\\":2,\\\"name\\\":\\\"Accent Wall\\\",\\\"type\\\":\\\"WALL\\\",\\\"category\\\":\\\"Wall\\\",\\\"mask\\\":\\\"/scenes/laundry_room_1/masks/mask_2.png\\\"},{\\\"sortOrder\\\":3,\\\"name\\\":\\\"Countertops\\\",\\\"type\\\":\\\"COUNTER\\\",\\\"category\\\":\\\"Counter\\\",\\\"mask\\\":\\\"/scenes/laundry_room_1/masks/mask_3.png\\\"},{\\\"sortOrder\\\":4,\\\"name\\\":\\\"Cabinets\\\",\\\"type\\\":\\\"CABINETS\\\",\\\"category\\\":\\\"Cabinet\\\",\\\"mask\\\":\\\"/scenes/laundry_room_1/masks/mask_4.png\\\"},{\\\"sortOrder\\\":5,\\\"name\\\":\\\"Painted Walls\\\",\\\"type\\\":\\\"PAINTED WALL\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/laundry_room_1/masks/mask_5.png\\\"},{\\\"sortOrder\\\":6,\\\"name\\\":\\\"Trim\\\",\\\"type\\\":\\\"TRIM\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/laundry_room_1/masks/mask_6.png\\\"}]\"',1,10,'2026-10-15 21:53:28.860','2026-10-15 21:53:28.860'),
(12,'Foyer 1','foyer','/scenes/foyer_1/base.jpg','/scenes/foyer_1/base.jpg','\"[{\\\"sortOrder\\\":1,\\\"name\\\":\\\"Floor\\\",\\\"type\\\":\\\"FLOOR\\\",\\\"category\\\":\\\"Floor\\\",\\\"mask\\\":\\\"/scenes/foyer_1/masks/mask_1.png\\\"},{\\\"sortOrder\\\":2,\\\"name\\\":\\\"Painted Walls\\\",\\\"type\\\":\\\"PAINTED WALL\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/foyer_1/masks/mask_2.png\\\"},{\\\"sortOrder\\\":3,\\\"name\\\":\\\"Trim\\\",\\\"type\\\":\\\"TRIM\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/foyer_1/masks/mask_3.png\\\"}]\"',1,11,'2026-10-15 21:53:28.876','2026-10-15 21:53:28.876'),
(13,'Dining Room 1','dining','/scenes/dining_room_1/base.jpg','/scenes/dining_room_1/base.jpg','\"[{\\\"sortOrder\\\":1,\\\"name\\\":\\\"Floor\\\",\\\"type\\\":\\\"FLOOR\\\",\\\"category\\\":\\\"Floor\\\",\\\"mask\\\":\\\"/scenes/dining_room_1/masks/mask_1.png\\\"},{\\\"sortOrder\\\":2,\\\"name\\\":\\\"Painted Walls\\\",\\\"type\\\":\\\"PAINTED WALL\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/dining_room_1/masks/mask_2.png\\\"},{\\\"sortOrder\\\":3,\\\"name\\\":\\\"Trim\\\",\\\"type\\\":\\\"TRIM\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/dining_room_1/masks/mask_3.png\\\"}]\"',1,12,'2026-10-15 21:53:28.893','2026-10-15 21:53:28.893'),
(14,'Living Room 1','living','/scenes/living_room_1/base.jpg','/scenes/living_room_1/base.jpg','\"[{\\\"sortOrder\\\":1,\\\"name\\\":\\\"Floor\\\",\\\"type\\\":\\\"FLOOR\\\",\\\"category\\\":\\\"Floor\\\",\\\"mask\\\":\\\"/scenes/living_room_1/masks/mask_1.png\\\"},{\\\"sortOrder\\\":2,\\\"name\\\":\\\"Fireplace\\\",\\\"type\\\":\\\"FIREPLACE\\\",\\\"category\\\":\\\"Wall\\\",\\\"mask\\\":\\\"/scenes/living_room_1/masks/mask_2.png\\\"},{\\\"sortOrder\\\":3,\\\"name\\\":\\\"Cabinets\\\",\\\"type\\\":\\\"CABINETS\\\",\\\"category\\\":\\\"Cabinet\\\",\\\"mask\\\":\\\"/scenes/living_room_1/masks/mask_3.png\\\"},{\\\"sortOrder\\\":4,\\\"name\\\":\\\"Painted Walls\\\",\\\"type\\\":\\\"PAINTED WALL\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/living_room_1/masks/mask_4.png\\\"},{\\\"sortOrder\\\":5,\\\"name\\\":\\\"Trim\\\",\\\"type\\\":\\\"TRIM\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/living_room_1/masks/mask_5.png\\\"}]\"',1,13,'2026-10-15 21:53:28.909','2026-10-15 21:53:28.909'),
(15,'Basement 1','basement','/scenes/basement_1/base.jpg','/scenes/basement_1/base.jpg','\"[{\\\"sortOrder\\\":1,\\\"name\\\":\\\"Floor\\\",\\\"type\\\":\\\"FLOOR\\\",\\\"category\\\":\\\"Floor\\\",\\\"mask\\\":\\\"/scenes/basement_1/masks/mask_1.png\\\"},{\\\"sortOrder\\\":2,\\\"name\\\":\\\"Backsplash\\\",\\\"type\\\":\\\"BACKSPLASH\\\",\\\"category\\\":\\\"Backsplash\\\",\\\"mask\\\":\\\"/scenes/basement_1/masks/mask_2.png\\\"},{\\\"sortOrder\\\":3,\\\"name\\\":\\\"Countertops\\\",\\\"type\\\":\\\"COUNTER\\\",\\\"category\\\":\\\"Counter\\\",\\\"mask\\\":\\\"/scenes/basement_1/masks/mask_3.png\\\"},{\\\"sortOrder\\\":4,\\\"name\\\":\\\"Fireplace\\\",\\\"type\\\":\\\"FIREPLACE\\\",\\\"category\\\":\\\"Wall\\\",\\\"mask\\\":\\\"/scenes/basement_1/masks/mask_4.png\\\"},{\\\"sortOrder\\\":5,\\\"name\\\":\\\"Cabinets\\\",\\\"type\\\":\\\"CABINETS\\\",\\\"category\\\":\\\"Cabinet\\\",\\\"mask\\\":\\\"/scenes/basement_1/masks/mask_5.png\\\"},{\\\"sortOrder\\\":6,\\\"name\\\":\\\"Painted Walls\\\",\\\"type\\\":\\\"PAINTED WALL\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/basement_1/masks/mask_6.png\\\"},{\\\"sortOrder\\\":7,\\\"name\\\":\\\"Trim\\\",\\\"type\\\":\\\"TRIM\\\",\\\"category\\\":\\\"Paint\\\",\\\"mask\\\":\\\"/scenes/basement_1/masks/mask_7.png\\\"}]\"',1,14,'2026-10-15 21:53:28.923','2026-10-15 21:53:28.923');
/*!40000 ALTER TABLE `visualizerscene` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlistitem`
--

DROP TABLE IF EXISTS `wishlistitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wishlistitem` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `wishlistitem_userId_productId_key` (`userId`,`productId`),
  KEY `wishlistitem_productId_fkey` (`productId`),
  CONSTRAINT `wishlistitem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `wishlistitem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlistitem`
--

LOCK TABLES `wishlistitem` WRITE;
/*!40000 ALTER TABLE `wishlistitem` DISABLE KEYS */;
INSERT INTO `wishlistitem` VALUES
(1,3,1,'2026-10-22 01:17:42.059');
/*!40000 ALTER TABLE `wishlistitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'mcc_dev'
--

--
-- Dumping routines for database 'mcc_dev'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-10-27  3:31:24
