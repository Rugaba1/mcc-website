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
  `quantity` int(11) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cartitem_cartId_variantId_key` (`cartId`,`variantId`),
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `catalogue`
--

LOCK TABLES `catalogue` WRITE;
/*!40000 ALTER TABLE `catalogue` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_message`
--

LOCK TABLES `contact_message` WRITE;
/*!40000 ALTER TABLE `contact_message` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupon`
--

LOCK TABLES `coupon` WRITE;
/*!40000 ALTER TABLE `coupon` DISABLE KEYS */;
/*!40000 ALTER TABLE `coupon` ENABLE KEYS */;
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
  `feePerBox` decimal(12,2) NOT NULL DEFAULT 0.00,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
  `onHandBoxes` int(11) NOT NULL DEFAULT 0,
  `reservedBoxes` int(11) NOT NULL DEFAULT 0,
  `reorderLevel` int(11) NOT NULL DEFAULT 0,
  `allowBackorder` tinyint(1) NOT NULL DEFAULT 0,
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `inventory_variantId_key` (`variantId`),
  CONSTRAINT `inventory_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `productvariant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
INSERT INTO `inventory` VALUES
(1,1,200,0,20,0,'2026-10-15 21:53:26.722'),
(2,2,200,0,20,0,'2026-10-15 21:53:26.763'),
(3,3,200,0,20,0,'2026-10-15 21:53:26.799'),
(4,4,200,0,20,0,'2026-10-15 21:53:26.835'),
(5,5,200,0,20,0,'2026-10-15 21:53:26.866'),
(6,6,200,0,20,0,'2026-10-15 21:53:26.903'),
(7,7,200,0,20,0,'2026-10-15 21:53:26.943'),
(8,8,200,0,20,0,'2026-10-15 21:53:26.980'),
(9,9,350,0,25,0,'2026-10-15 21:53:27.034'),
(10,10,350,0,25,0,'2026-10-15 21:53:27.059'),
(11,11,350,0,25,0,'2026-10-15 21:53:27.083'),
(12,12,350,0,25,0,'2026-10-15 21:53:27.134'),
(13,13,350,0,25,0,'2026-10-15 21:53:27.154'),
(14,14,350,0,25,0,'2026-10-15 21:53:27.185'),
(15,15,350,0,25,0,'2026-10-15 21:53:27.213'),
(16,16,350,0,25,0,'2026-10-15 21:53:27.240'),
(17,17,350,0,25,0,'2026-10-15 21:53:27.272'),
(18,18,350,0,25,0,'2026-10-15 21:53:27.294'),
(19,19,350,0,25,0,'2026-10-15 21:53:27.329'),
(20,20,350,0,25,0,'2026-10-15 21:53:27.351'),
(21,21,350,0,25,0,'2026-10-15 21:53:27.379'),
(22,22,350,0,25,0,'2026-10-15 21:53:27.398'),
(23,23,350,0,25,0,'2026-10-15 21:53:27.430'),
(24,24,350,0,25,0,'2026-10-15 21:53:27.456'),
(25,25,350,0,25,0,'2026-10-15 21:53:27.494'),
(26,26,350,0,25,0,'2026-10-15 21:53:27.527'),
(27,27,350,0,25,0,'2026-10-15 21:53:27.551'),
(28,28,350,0,25,0,'2026-10-15 21:53:27.587'),
(29,29,350,0,25,0,'2026-10-15 21:53:27.612'),
(30,30,350,0,25,0,'2026-10-15 21:53:27.633'),
(31,31,350,0,25,0,'2026-10-15 21:53:27.684'),
(32,32,350,0,25,0,'2026-10-15 21:53:27.701'),
(33,33,350,0,25,0,'2026-10-15 21:53:27.718'),
(34,34,350,0,25,0,'2026-10-15 21:53:27.750'),
(35,35,350,0,25,0,'2026-10-15 21:53:27.770'),
(36,36,350,0,25,0,'2026-10-15 21:53:27.801'),
(37,37,350,0,25,0,'2026-10-15 21:53:27.822'),
(38,38,350,0,25,0,'2026-10-15 21:53:27.852'),
(39,39,350,0,25,0,'2026-10-15 21:53:27.873'),
(40,40,350,0,25,0,'2026-10-15 21:53:27.896'),
(41,41,350,0,25,0,'2026-10-15 21:53:27.911'),
(42,42,350,0,25,0,'2026-10-15 21:53:27.939'),
(43,43,350,0,25,0,'2026-10-15 21:53:27.967'),
(44,44,350,0,25,0,'2026-10-15 21:53:27.985'),
(45,45,350,0,25,0,'2026-10-15 21:53:28.015'),
(46,46,350,0,25,0,'2026-10-15 21:53:28.046'),
(47,47,350,0,25,0,'2026-10-15 21:53:28.220'),
(48,48,350,0,25,0,'2026-10-15 21:53:28.264'),
(49,49,350,0,25,0,'2026-10-15 21:53:28.300'),
(50,50,350,0,25,0,'2026-10-15 21:53:28.322'),
(51,51,350,0,25,0,'2026-10-15 21:53:28.351'),
(52,52,350,0,25,0,'2026-10-15 21:53:28.370'),
(53,53,350,0,25,0,'2026-10-15 21:53:28.396'),
(54,54,350,0,25,0,'2026-10-15 21:53:28.424'),
(55,55,350,0,25,0,'2026-10-15 21:53:28.443'),
(56,56,350,0,25,0,'2026-10-15 21:53:28.476'),
(57,57,350,0,25,0,'2026-10-15 21:53:28.493'),
(58,58,350,0,25,0,'2026-10-15 21:53:28.519'),
(59,59,350,0,25,0,'2026-10-15 21:53:28.544'),
(60,60,350,0,25,0,'2026-10-15 21:53:28.558'),
(61,61,350,0,25,0,'2026-10-15 21:53:28.588'),
(62,62,350,0,25,0,'2026-10-15 21:53:28.614'),
(63,63,350,0,25,0,'2026-10-15 21:53:28.641'),
(64,64,350,0,25,0,'2026-10-15 21:53:28.659'),
(65,65,350,0,25,0,'2026-10-15 21:53:28.682'),
(66,66,350,0,25,0,'2026-10-15 21:53:28.700');
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
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
  `currency` varchar(3) NOT NULL DEFAULT 'RWF',
  `couponId` int(11) DEFAULT NULL,
  `deliveryZoneId` int(11) DEFAULT NULL,
  `shipFullName` varchar(255) DEFAULT NULL,
  `shipPhone` varchar(20) DEFAULT NULL,
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_orderNumber_key` (`orderNumber`),
  KEY `order_userId_idx` (`userId`),
  KEY `order_status_placedAt_idx` (`status`,`placedAt`),
  KEY `order_couponId_fkey` (`couponId`),
  KEY `order_deliveryZoneId_fkey` (`deliveryZoneId`),
  CONSTRAINT `order_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupon` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `order_deliveryZoneId_fkey` FOREIGN KEY (`deliveryZoneId`) REFERENCES `deliveryzone` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order`
--

LOCK TABLES `order` WRITE;
/*!40000 ALTER TABLE `order` DISABLE KEYS */;
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
  `quantity` int(11) NOT NULL,
  `sqmPerBox` decimal(8,3) NOT NULL,
  `unitPrice` decimal(12,2) NOT NULL,
  `lineTotal` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `orderitem_orderId_idx` (`orderId`),
  KEY `orderitem_variantId_fkey` (`variantId`),
  CONSTRAINT `orderitem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `orderitem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `productvariant` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orderitem`
--

LOCK TABLES `orderitem` WRITE;
/*!40000 ALTER TABLE `orderitem` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orderstatushistory`
--

LOCK TABLES `orderstatushistory` WRITE;
/*!40000 ALTER TABLE `orderstatushistory` DISABLE KEYS */;
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
  `currency` varchar(3) NOT NULL DEFAULT 'RWF',
  `provider` varchar(50) DEFAULT NULL,
  `providerRef` varchar(150) DEFAULT NULL,
  `payerPhone` varchar(20) DEFAULT NULL,
  `failureReason` varchar(255) DEFAULT NULL,
  `rawResponse` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`rawResponse`)),
  `paidAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_providerRef_key` (`providerRef`),
  KEY `payment_orderId_idx` (`orderId`),
  KEY `payment_status_idx` (`status`),
  CONSTRAINT `payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment`
--

LOCK TABLES `payment` WRITE;
/*!40000 ALTER TABLE `payment` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permission_logs`
--

LOCK TABLES `permission_logs` WRITE;
/*!40000 ALTER TABLE `permission_logs` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
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
(1,'Terrain Sandstone','floor','Floor Tiles','Natural sandstone finish. Slip-resistant surface ideal for living areas and corridors.','600×600mm & 800×800mm','Bestseller','from-[#c8b89a] to-[#a0896e]','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80','[\"#c8b89a\",\"#7a6248\",\"#e0d5c5\"]','Living rooms, corridors, outdoor terraces','Terrain Series',1,'2026-09-18 10:17:32.294','2026-09-18 10:17:32.294',NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',NULL),
(2,'Azure Metro','wall','Wall Tiles','Sleek subway-style wall tiles with a high-gloss glaze. Perfect for kitchens and bathrooms.','300×600mm','New','from-[#b0c4de] to-[#6a8fc8]','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80','[\"#6a8fc8\",\"#ffffff\",\"#4a5568\"]','Kitchens, bathrooms, feature walls','Azure Collection',0,'2026-09-18 10:17:32.298','2026-09-18 10:17:32.298',NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',NULL),
(3,'Greenstone Exterior','outdoor','Outdoor Tiles','Heavy-duty tiles engineered for outdoor use. UV-resistant, frost-proof, and anti-slip.','400×400mm & 600×600mm',NULL,'from-[#5a8a5a] to-[#2d5a2d]','https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80','[\"#5a8a5a\",\"#8B7355\",\"#666666\"]','Patios, driveways, pool surrounds, rooftops','Terrain Series',0,'2026-09-18 10:17:32.299','2026-09-18 10:17:32.299',NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',NULL),
(4,'Gold Metallic Series','special','Special Finish','Metallic-glazed decorative tiles that add a touch of elegance to accent walls and feature areas.','300×300mm & 600×600mm','Premium','from-[#d4af37] to-[#a0832a]','https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80','[\"#d4af37\",\"#c0c0c0\",\"#b87333\"]','Accent walls, feature areas, luxury bathrooms','Gold & Ivory Classics',1,'2026-09-18 10:17:32.300','2026-09-18 10:17:32.300',NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',NULL),
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
  `sqmPerBox` decimal(8,3) NOT NULL,
  `weightKgPerBox` decimal(8,2) DEFAULT NULL,
  `pricePerSqm` decimal(12,2) NOT NULL,
  `pricePerBox` decimal(12,2) NOT NULL,
  `compareAtPrice` decimal(12,2) DEFAULT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'RWF',
  `image` text DEFAULT NULL,
  `textureUrl` text DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `productvariant_sku_key` (`sku`),
  KEY `productvariant_productId_idx` (`productId`),
  CONSTRAINT `productvariant_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productvariant`
--

LOCK TABLES `productvariant` WRITE;
/*!40000 ALTER TABLE `productvariant` DISABLE KEYS */;
INSERT INTO `productvariant` VALUES
(1,1,'MCC-TS-6060','60x60','matt','Sandstone',NULL,NULL,4,1.440,NULL,22000.00,31680.00,NULL,'RWF','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',1,'2026-10-15 21:53:26.659','2026-10-15 21:53:26.659'),
(2,1,'MCC-TS-8080','80x80','matt','Sandstone',NULL,NULL,2,1.280,NULL,26000.00,33280.00,NULL,'RWF','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',1,'2026-10-15 21:53:26.747','2026-10-15 21:53:26.747'),
(3,2,'MCC-AM-3060','30x60','glossy','Azure Blue',NULL,NULL,8,1.440,NULL,21000.00,30240.00,NULL,'RWF','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80',1,'2026-10-15 21:53:26.785','2026-10-15 21:53:26.785'),
(4,3,'MCC-OBM-60120','60x120','polished','Onyx Black',NULL,NULL,2,1.440,NULL,32000.00,46080.00,NULL,'RWF','https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80','https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80',1,'2026-10-15 21:53:26.822','2026-10-15 21:53:26.822'),
(5,4,'MCC-GE-4040','40x40','textured','Greenstone',NULL,NULL,9,1.440,NULL,20000.00,28800.00,NULL,'RWF','https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80','https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80',1,'2026-10-15 21:53:26.853','2026-10-15 21:53:26.853'),
(6,4,'MCC-GE-6060','60x60','textured','Greenstone',NULL,NULL,4,1.440,NULL,23000.00,33120.00,NULL,'RWF','https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80','https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80',1,'2026-10-15 21:53:26.889','2026-10-15 21:53:26.889'),
(7,5,'MCC-GMS-3030','30x30','metallic','Gold Metallic',NULL,NULL,12,1.080,NULL,35000.00,37800.00,NULL,'RWF','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80',1,'2026-10-15 21:53:26.926','2026-10-15 21:53:26.926'),
(8,6,'MCC-IT-3060','30x60','matt','Ivory',NULL,NULL,8,1.440,NULL,22000.00,31680.00,NULL,'RWF','https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80','https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',1,'2026-10-15 21:53:26.965','2026-10-15 21:53:26.965'),
(9,7,'MCC-AGAPE-BG-6060','60x60','polished','Agape Beige',NULL,NULL,4,1.440,NULL,24000.00,34560.00,NULL,'RWF','/tiles/agape-beige.jpg','/tiles/agape-beige.jpg',1,'2026-10-15 21:53:27.024','2026-10-15 21:53:27.024'),
(10,7,'MCC-AGAPE-BG-3060','30x60','matt','Agape Beige',NULL,NULL,8,1.440,NULL,22000.00,31680.00,NULL,'RWF','/tiles/agape-beige.jpg','/tiles/agape-beige.jpg',1,'2026-10-15 21:53:27.048','2026-10-15 21:53:27.048'),
(11,7,'MCC-AGAPE-BG-60120','60x120','polished','Agape Beige',NULL,NULL,2,1.440,NULL,28000.00,40320.00,NULL,'RWF','/tiles/agape-beige.jpg','/tiles/agape-beige.jpg',1,'2026-10-15 21:53:27.070','2026-10-15 21:53:27.070'),
(12,8,'MCC-AGAPE-GR-6060','60x60','matt','Agape Grey',NULL,NULL,4,1.440,NULL,23000.00,33120.00,NULL,'RWF','/tiles/agape-grey.jpg','/tiles/agape-grey.jpg',1,'2026-10-15 21:53:27.123','2026-10-15 21:53:27.123'),
(13,8,'MCC-AGAPE-GR-60120','60x120','polished','Agape Grey',NULL,NULL,2,1.440,NULL,27000.00,38880.00,NULL,'RWF','/tiles/agape-grey.jpg','/tiles/agape-grey.jpg',1,'2026-10-15 21:53:27.143','2026-10-15 21:53:27.143'),
(14,9,'MCC-APOLLO-GR-6060','60x60','matt','Apollo Grey',NULL,NULL,4,1.440,NULL,21000.00,30240.00,NULL,'RWF','/tiles/apollo-grey.jpg','/tiles/apollo-grey.jpg',1,'2026-10-15 21:53:27.178','2026-10-15 21:53:27.178'),
(15,10,'MCC-AQUARIA-BR-6060','60x60','textured','Aquaria Brown',NULL,NULL,4,1.440,NULL,23500.00,33840.00,NULL,'RWF','/tiles/aquaria-brown.jpg','/tiles/aquaria-brown.jpg',1,'2026-10-15 21:53:27.204','2026-10-15 21:53:27.204'),
(16,10,'MCC-AQUARIA-BR-3060','30x60','matt','Aquaria Brown',NULL,NULL,8,1.440,NULL,21500.00,30960.00,NULL,'RWF','/tiles/aquaria-brown.jpg','/tiles/aquaria-brown.jpg',1,'2026-10-15 21:53:27.229','2026-10-15 21:53:27.229'),
(17,11,'MCC-AQUARIA-GR-6060','60x60','matt','Aquaria Grey',NULL,NULL,4,1.440,NULL,23000.00,33120.00,NULL,'RWF','/tiles/aquaria-grey.jpg','/tiles/aquaria-grey.jpg',1,'2026-10-15 21:53:27.264','2026-10-15 21:53:27.264'),
(18,11,'MCC-AQUARIA-GR-60120','60x120','polished','Aquaria Grey',NULL,NULL,2,1.440,NULL,28000.00,40320.00,NULL,'RWF','/tiles/aquaria-grey.jpg','/tiles/aquaria-grey.jpg',1,'2026-10-15 21:53:27.282','2026-10-15 21:53:27.282'),
(19,12,'MCC-ASH-GR-3060','30x60','glossy','Ash Grey',NULL,NULL,8,1.440,NULL,19500.00,28080.00,NULL,'RWF','/tiles/ash-grey.jpg','/tiles/ash-grey.jpg',1,'2026-10-15 21:53:27.318','2026-10-15 21:53:27.318'),
(20,12,'MCC-ASH-GR-6060','60x60','matt','Ash Grey',NULL,NULL,4,1.440,NULL,21000.00,30240.00,NULL,'RWF','/tiles/ash-grey.jpg','/tiles/ash-grey.jpg',1,'2026-10-15 21:53:27.341','2026-10-15 21:53:27.341'),
(21,13,'MCC-ASH-WH-3060','30x60','glossy','Ash White',NULL,NULL,8,1.440,NULL,19500.00,28080.00,NULL,'RWF','/tiles/ash-white.jpg','/tiles/ash-white.jpg',1,'2026-10-15 21:53:27.370','2026-10-15 21:53:27.370'),
(22,13,'MCC-ASH-WH-6060','60x60','polished','Ash White',NULL,NULL,4,1.440,NULL,22000.00,31680.00,NULL,'RWF','/tiles/ash-white.jpg','/tiles/ash-white.jpg',1,'2026-10-15 21:53:27.389','2026-10-15 21:53:27.389'),
(23,14,'MCC-BORGO-BG-6060','60x60','matt','Borgo Beige',NULL,NULL,4,1.440,NULL,23500.00,33840.00,NULL,'RWF','/tiles/borgo-beige.jpg','/tiles/borgo-beige.jpg',1,'2026-10-15 21:53:27.419','2026-10-15 21:53:27.419'),
(24,14,'MCC-BORGO-BG-60120','60x120','polished','Borgo Beige',NULL,NULL,2,1.440,NULL,27500.00,39600.00,NULL,'RWF','/tiles/borgo-beige.jpg','/tiles/borgo-beige.jpg',1,'2026-10-15 21:53:27.445','2026-10-15 21:53:27.445'),
(25,15,'MCC-BORGO-BR-6060','60x60','matt','Borgo Brown',NULL,NULL,4,1.440,NULL,22500.00,32400.00,NULL,'RWF','/tiles/borgo-brown.jpg','/tiles/borgo-brown.jpg',1,'2026-10-15 21:53:27.483','2026-10-15 21:53:27.483'),
(26,16,'MCC-BORGO-GR-6060','60x60','polished','Borgo Grey',NULL,NULL,4,1.440,NULL,24000.00,34560.00,NULL,'RWF','/tiles/borgo-grey.jpg','/tiles/borgo-grey.jpg',1,'2026-10-15 21:53:27.515','2026-10-15 21:53:27.515'),
(27,16,'MCC-BORGO-GR-60120','60x120','polished','Borgo Grey',NULL,NULL,2,1.440,NULL,28500.00,41040.00,NULL,'RWF','/tiles/borgo-grey.jpg','/tiles/borgo-grey.jpg',1,'2026-10-15 21:53:27.541','2026-10-15 21:53:27.541'),
(28,17,'MCC-CAL-BG-6060','60x60','polished','Calacatta Beige',NULL,NULL,4,1.440,NULL,26000.00,37440.00,NULL,'RWF','/tiles/calacatta-beige.jpg','/tiles/calacatta-beige.jpg',1,'2026-10-15 21:53:27.578','2026-10-15 21:53:27.578'),
(29,17,'MCC-CAL-BG-60120','60x120','polished','Calacatta Beige',NULL,NULL,2,1.440,NULL,31000.00,44640.00,NULL,'RWF','/tiles/calacatta-beige.jpg','/tiles/calacatta-beige.jpg',1,'2026-10-15 21:53:27.601','2026-10-15 21:53:27.601'),
(30,17,'MCC-CAL-BG-3060','30x60','polished','Calacatta Beige',NULL,NULL,8,1.440,NULL,24000.00,34560.00,NULL,'RWF','/tiles/calacatta-beige.jpg','/tiles/calacatta-beige.jpg',1,'2026-10-15 21:53:27.624','2026-10-15 21:53:27.624'),
(31,18,'MCC-CAL-GR-6060','60x60','polished','Calacatta Grey',NULL,NULL,4,1.440,NULL,26000.00,37440.00,NULL,'RWF','/tiles/calacatta-grey.jpg','/tiles/calacatta-grey.jpg',1,'2026-10-15 21:53:27.675','2026-10-15 21:53:27.675'),
(32,18,'MCC-CAL-GR-60120','60x120','polished','Calacatta Grey',NULL,NULL,2,1.440,NULL,31000.00,44640.00,NULL,'RWF','/tiles/calacatta-grey.jpg','/tiles/calacatta-grey.jpg',1,'2026-10-15 21:53:27.693','2026-10-15 21:53:27.693'),
(33,18,'MCC-CAL-GR-3060','30x60','polished','Calacatta Grey',NULL,NULL,8,1.440,NULL,24000.00,34560.00,NULL,'RWF','/tiles/calacatta-grey.jpg','/tiles/calacatta-grey.jpg',1,'2026-10-15 21:53:27.710','2026-10-15 21:53:27.710'),
(34,19,'MCC-CAL-PK-60120','60x120','polished','Calacatta Pink',NULL,NULL,2,1.440,NULL,33000.00,47520.00,NULL,'RWF','/tiles/calacatta-pink.jpg','/tiles/calacatta-pink.jpg',1,'2026-10-15 21:53:27.740','2026-10-15 21:53:27.740'),
(35,19,'MCC-CAL-PK-3060','30x60','polished','Calacatta Pink',NULL,NULL,8,1.440,NULL,27000.00,38880.00,NULL,'RWF','/tiles/calacatta-pink.jpg','/tiles/calacatta-pink.jpg',1,'2026-10-15 21:53:27.760','2026-10-15 21:53:27.760'),
(36,20,'MCC-BLK-6060','60x60','polished','Classic Black',NULL,NULL,4,1.440,NULL,25000.00,36000.00,NULL,'RWF','/tiles/classic-black.jpg','/tiles/classic-black.jpg',1,'2026-10-15 21:53:27.791','2026-10-15 21:53:27.791'),
(37,20,'MCC-BLK-60120','60x120','polished','Classic Black',NULL,NULL,2,1.440,NULL,30000.00,43200.00,NULL,'RWF','/tiles/classic-black.jpg','/tiles/classic-black.jpg',1,'2026-10-15 21:53:27.812','2026-10-15 21:53:27.812'),
(38,21,'MCC-CREM-BR-6060','60x60','polished','Cremino Brown',NULL,NULL,4,1.440,NULL,24500.00,35280.00,NULL,'RWF','/tiles/cremino-brown.jpg','/tiles/cremino-brown.jpg',1,'2026-10-15 21:53:27.844','2026-10-15 21:53:27.844'),
(39,21,'MCC-CREM-BR-60120','60x120','polished','Cremino Brown',NULL,NULL,2,1.440,NULL,29500.00,42480.00,NULL,'RWF','/tiles/cremino-brown.jpg','/tiles/cremino-brown.jpg',1,'2026-10-15 21:53:27.864','2026-10-15 21:53:27.864'),
(40,22,'MCC-WOOD-ELM-20120','20x120','matt','Elm Yellow Wood',NULL,NULL,6,1.440,NULL,25000.00,36000.00,NULL,'RWF','/tiles/elm_yellow_wood.jpg','/tiles/elm_yellow_wood.jpg',1,'2026-10-15 21:53:27.888','2026-10-15 21:53:27.888'),
(41,22,'MCC-WOOD-ELM-3060','30x60','matt','Elm Yellow Wood',NULL,NULL,8,1.440,NULL,22000.00,31680.00,NULL,'RWF','/tiles/elm_yellow_wood.jpg','/tiles/elm_yellow_wood.jpg',1,'2026-10-15 21:53:27.904','2026-10-15 21:53:27.904'),
(42,23,'MCC-WOOD-FLAM-20120','20x120','matt','Flam Wood Grey',NULL,NULL,6,1.440,NULL,25000.00,36000.00,NULL,'RWF','/tiles/flam-wood-grey.jpg','/tiles/flam-wood-grey.jpg',1,'2026-10-15 21:53:27.928','2026-10-15 21:53:27.928'),
(43,24,'MCC-GANGA-6060','60x60','textured','Ganga Stone',NULL,NULL,4,1.440,NULL,22000.00,31680.00,NULL,'RWF','/tiles/ganga-stone.jpg','/tiles/ganga-stone.jpg',1,'2026-10-15 21:53:27.959','2026-10-15 21:53:27.959'),
(44,24,'MCC-GANGA-3060','30x60','textured','Ganga Stone',NULL,NULL,8,1.440,NULL,20000.00,28800.00,NULL,'RWF','/tiles/ganga-stone.jpg','/tiles/ganga-stone.jpg',1,'2026-10-15 21:53:27.976','2026-10-15 21:53:27.976'),
(45,25,'MCC-GEMINI-BG-6060','60x60','matt','Gemini Beige',NULL,NULL,4,1.440,NULL,20500.00,29520.00,NULL,'RWF','/tiles/gemini-beige.jpg','/tiles/gemini-beige.jpg',1,'2026-10-15 21:53:28.007','2026-10-15 21:53:28.007'),
(46,26,'MCC-GEMINI-BR-6060','60x60','matt','Gemini Brown',NULL,NULL,4,1.440,NULL,20500.00,29520.00,NULL,'RWF','/tiles/gemini-brown.jpg','/tiles/gemini-brown.jpg',1,'2026-10-15 21:53:28.037','2026-10-15 21:53:28.037'),
(47,27,'MCC-KRUK-WH-3060','30x60','matt','Kruk Stone White',NULL,NULL,8,1.440,NULL,21500.00,30960.00,NULL,'RWF','/tiles/kruk-stone-white.jpg','/tiles/kruk-stone-white.jpg',1,'2026-10-15 21:53:28.132','2026-10-15 21:53:28.132'),
(48,28,'MCC-KRUK-GR-6060','60x60','textured','Krukstone Grey',NULL,NULL,4,1.440,NULL,22500.00,32400.00,NULL,'RWF','/tiles/krukstone-grey.jpg','/tiles/krukstone-grey.jpg',1,'2026-10-15 21:53:28.252','2026-10-15 21:53:28.252'),
(49,29,'MCC-MIL-GR-6060','60x60','polished','Milano Grey',NULL,NULL,4,1.440,NULL,25000.00,36000.00,NULL,'RWF','/tiles/milano-grey.jpg','/tiles/milano-grey.jpg',1,'2026-10-15 21:53:28.291','2026-10-15 21:53:28.291'),
(50,29,'MCC-MIL-GR-60120','60x120','polished','Milano Grey',NULL,NULL,2,1.440,NULL,29500.00,42480.00,NULL,'RWF','/tiles/milano-grey.jpg','/tiles/milano-grey.jpg',1,'2026-10-15 21:53:28.312','2026-10-15 21:53:28.312'),
(51,30,'MCC-NARM-BR-6060','60x60','polished','Narmanda Brown',NULL,NULL,4,1.440,NULL,24500.00,35280.00,NULL,'RWF','/tiles/narmanda-brown.jpg','/tiles/narmanda-brown.jpg',1,'2026-10-15 21:53:28.343','2026-10-15 21:53:28.343'),
(52,30,'MCC-NARM-BR-60120','60x120','polished','Narmanda Brown',NULL,NULL,2,1.440,NULL,29000.00,41760.00,NULL,'RWF','/tiles/narmanda-brown.jpg','/tiles/narmanda-brown.jpg',1,'2026-10-15 21:53:28.362','2026-10-15 21:53:28.362'),
(53,31,'MCC-WOOD-OLV-20120','20x120','matt','Oliver Wood',NULL,NULL,6,1.440,NULL,25000.00,36000.00,NULL,'RWF','/tiles/oliver-wood.jpg','/tiles/oliver-wood.jpg',1,'2026-10-15 21:53:28.388','2026-10-15 21:53:28.388'),
(54,32,'MCC-RUB-GR-6060','60x60','polished','Rubino Grey',NULL,NULL,4,1.440,NULL,24000.00,34560.00,NULL,'RWF','/tiles/rubino-grey.jpg','/tiles/rubino-grey.jpg',1,'2026-10-15 21:53:28.415','2026-10-15 21:53:28.415'),
(55,32,'MCC-RUB-GR-60120','60x120','polished','Rubino Grey',NULL,NULL,2,1.440,NULL,28500.00,41040.00,NULL,'RWF','/tiles/rubino-grey.jpg','/tiles/rubino-grey.jpg',1,'2026-10-15 21:53:28.434','2026-10-15 21:53:28.434'),
(56,33,'MCC-SILK-GR-6060','60x60','matt','Silk Grey',NULL,NULL,4,1.440,NULL,27000.00,38880.00,NULL,'RWF','/tiles/silk-grey.jpg','/tiles/silk-grey.jpg',1,'2026-10-15 21:53:28.465','2026-10-15 21:53:28.465'),
(57,33,'MCC-SILK-GR-60120','60x120','matt','Silk Grey',NULL,NULL,2,1.440,NULL,32000.00,46080.00,NULL,'RWF','/tiles/silk-grey.jpg','/tiles/silk-grey.jpg',1,'2026-10-15 21:53:28.484','2026-10-15 21:53:28.484'),
(58,34,'MCC-SILK-BR-6060','60x60','matt','Silk Brown',NULL,NULL,4,1.440,NULL,27000.00,38880.00,NULL,'RWF','/tiles/silk-brown.jpg','/tiles/silk-brown.jpg',1,'2026-10-15 21:53:28.513','2026-10-15 21:53:28.513'),
(59,35,'MCC-STONE-WH-3060','30x60','glossy','Stone White',NULL,NULL,8,1.440,NULL,20000.00,28800.00,NULL,'RWF','/tiles/stone-white.jpg','/tiles/stone-white.jpg',1,'2026-10-15 21:53:28.536','2026-10-15 21:53:28.536'),
(60,35,'MCC-STONE-WH-6060','60x60','matt','Stone White',NULL,NULL,4,1.440,NULL,22000.00,31680.00,NULL,'RWF','/tiles/stone-white.jpg','/tiles/stone-white.jpg',1,'2026-10-15 21:53:28.551','2026-10-15 21:53:28.551'),
(61,36,'MCC-TIK-BR-20120','20x120','matt','Tik Wood Brown',NULL,NULL,6,1.440,NULL,25500.00,36720.00,NULL,'RWF','/tiles/tik-wood-brown.jpg','/tiles/tik-wood-brown.jpg',1,'2026-10-15 21:53:28.578','2026-10-15 21:53:28.578'),
(62,37,'MCC-TIK-RD-20120','20x120','matt','Tik Wood Red',NULL,NULL,6,1.440,NULL,25500.00,36720.00,NULL,'RWF','/tiles/tik-wood-red.jpg','/tiles/tik-wood-red.jpg',1,'2026-10-15 21:53:28.606','2026-10-15 21:53:28.606'),
(63,38,'MCC-TRAV-GN-60120','60x120','polished','Travinto Green',NULL,NULL,2,1.440,NULL,32000.00,46080.00,NULL,'RWF','/tiles/travinto-green.jpg','/tiles/travinto-green.jpg',1,'2026-10-15 21:53:28.633','2026-10-15 21:53:28.633'),
(64,38,'MCC-TRAV-GN-6060','60x60','polished','Travinto Green',NULL,NULL,4,1.440,NULL,27000.00,38880.00,NULL,'RWF','/tiles/travinto-green.jpg','/tiles/travinto-green.jpg',1,'2026-10-15 21:53:28.650','2026-10-15 21:53:28.650'),
(65,39,'MCC-TRAV-GR-6060','60x60','matt','Travinto Grey',NULL,NULL,4,1.440,NULL,24000.00,34560.00,NULL,'RWF','/tiles/travinto-grey.jpg','/tiles/travinto-grey.jpg',1,'2026-10-15 21:53:28.674','2026-10-15 21:53:28.674'),
(66,39,'MCC-TRAV-GR-60120','60x120','polished','Travinto Grey',NULL,NULL,2,1.440,NULL,29000.00,41760.00,NULL,'RWF','/tiles/travinto-grey.jpg','/tiles/travinto-grey.jpg',1,'2026-10-15 21:53:28.691','2026-10-15 21:53:28.691');
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project`
--

LOCK TABLES `project` WRITE;
/*!40000 ALTER TABLE `project` DISABLE KEYS */;
INSERT INTO `project` VALUES
(1,'Kigali Convention Centre Hotel','Hospitality','Supplied over 12,000 m² of premium floor and wall tiles for the iconic convention centre hotel complex.','from-[#1a3a2a] to-[#2d6a4f]','https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',1,'Kigali, Rwanda','12,000 m²','2022','2026-09-18 10:17:32.412','2026-09-18 10:17:32.412'),
(2,'Vision City Mall','Commercial','8,500 m² of large-format porcelain tiles for Rwanda\'s premier shopping destination.','from-[#2c3e70] to-[#4a6fa5]','https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80',0,'Kigali, Rwanda','8,500 m²','2021','2026-09-18 10:17:32.420','2026-09-18 10:17:32.420'),
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projecttile`
--

LOCK TABLES `projecttile` WRITE;
/*!40000 ALTER TABLE `projecttile` DISABLE KEYS */;
INSERT INTO `projecttile` VALUES
(1,1,3),
(2,1,5),
(3,2,1),
(4,2,3),
(5,3,5),
(6,3,6),
(7,4,1),
(8,4,4),
(9,5,2),
(10,5,6);
/*!40000 ALTER TABLE `projecttile` ENABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review`
--

LOCK TABLES `review` WRITE;
/*!40000 ALTER TABLE `review` DISABLE KEYS */;
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
  `quantity` int(11) NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `createdById` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `stockmovement_variantId_createdAt_idx` (`variantId`,`createdAt`),
  KEY `stockmovement_createdById_fkey` (`createdById`),
  CONSTRAINT `stockmovement_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `stockmovement_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `productvariant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stockmovement`
--

LOCK TABLES `stockmovement` WRITE;
/*!40000 ALTER TABLE `stockmovement` DISABLE KEYS */;
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
(1,'MCC tiles transformed our hotel lobby completely. The quality is outstanding and the team was incredibly professional throughout the entire project. We\'ll never use another supplier.','Jean-Marie Nkurunziza','CEO, Horizon Hospitality Group','JM','2026-09-18 10:17:32.471','2026-09-18 10:17:32.471'),
(2,'As an architect, I specify tiles for every project. MCC consistently delivers products that match the specs perfectly and arrive on time. Their range is also the best I\'ve seen in East Africa.','Amina Cyusa','Principal Architect, Cyusa & Associates','AC','2026-09-18 10:17:32.471','2026-09-18 10:17:32.471'),
(3,'We used MCC tiles for our entire housing development — 120 units. Not a single quality complaint from any homeowner. The price-to-quality ratio is simply unbeatable in the region.','Patrick Kalisa','Director, Kalisa Property Developers','PK','2026-09-18 10:17:32.471','2026-09-18 10:17:32.471'),
(4,'Their design consultation service is a hidden gem. The consultant helped us choose a tile combination that made our restaurant look like it cost twice the budget. Highly recommend!','Grace Mutoni','Owner, Terrasse Restaurant, Kigali','GM','2026-09-18 10:17:32.471','2026-09-18 10:17:32.471');
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  UNIQUE KEY `users_phone_number_key` (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visualizerdesign`
--

LOCK TABLES `visualizerdesign` WRITE;
/*!40000 ALTER TABLE `visualizerdesign` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visualizerdesignitem`
--

LOCK TABLES `visualizerdesignitem` WRITE;
/*!40000 ALTER TABLE `visualizerdesignitem` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlistitem`
--

LOCK TABLES `wishlistitem` WRITE;
/*!40000 ALTER TABLE `wishlistitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `wishlistitem` ENABLE KEYS */;
UNLOCK TABLES;

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

-- Dump completed on 2026-10-16 11:52:27
