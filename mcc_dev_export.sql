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
  PRIMARY KEY (`id`),
  UNIQUE KEY `Collection_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `collection`
--

LOCK TABLES `collection` WRITE;
/*!40000 ALTER TABLE `collection` DISABLE KEYS */;
INSERT INTO `collection` VALUES
(1,'Terrain Series','Natural earth-tone finishes inspired by rocky landscapes. Ideal for living spaces, corridors and outdoor areas.','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80',1,'2026-09-18 10:17:32.343','2026-09-18 10:17:32.343'),
(2,'Azure Collection','Cool blues and clean whites — subway-style and metro tiles for kitchens, bathrooms, and feature walls.','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=80',0,'2026-09-18 10:17:32.356','2026-09-18 10:17:32.356'),
(3,'Onyx Prestige','Dark, dramatic surfaces with authentic marble veining. For spaces that demand a premium statement.','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=80',1,'2026-09-18 10:17:32.370','2026-09-18 10:17:32.370'),
(4,'Gold & Ivory Classics','Timeless warmth. Metallic glazes and travertine effects that bring elegance to any interior.','https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=900&q=80',0,'2026-09-18 10:17:32.381','2026-09-18 10:17:32.381');
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
  UNIQUE KEY `CollectionItem_collectionId_productId_key` (`collectionId`,`productId`),
  KEY `CollectionItem_productId_fkey` (`productId`),
  CONSTRAINT `CollectionItem_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `collection` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CollectionItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES
(1,'Terrain Sandstone','floor','Floor Tiles','Natural sandstone finish. Slip-resistant surface ideal for living areas and corridors.','600×600mm & 800×800mm','Bestseller','from-[#c8b89a] to-[#a0896e]','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80','[\"#c8b89a\",\"#7a6248\",\"#e0d5c5\"]','Living rooms, corridors, outdoor terraces','Terrain Series',1,'2026-09-18 10:17:32.294','2026-09-18 10:17:32.294'),
(2,'Azure Metro','wall','Wall Tiles','Sleek subway-style wall tiles with a high-gloss glaze. Perfect for kitchens and bathrooms.','300×600mm','New','from-[#b0c4de] to-[#6a8fc8]','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80','[\"#6a8fc8\",\"#ffffff\",\"#4a5568\"]','Kitchens, bathrooms, feature walls','Azure Collection',0,'2026-09-18 10:17:32.298','2026-09-18 10:17:32.298'),
(3,'Greenstone Exterior','outdoor','Outdoor Tiles','Heavy-duty tiles engineered for outdoor use. UV-resistant, frost-proof, and anti-slip.','400×400mm & 600×600mm',NULL,'from-[#5a8a5a] to-[#2d5a2d]','https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80','[\"#5a8a5a\",\"#8B7355\",\"#666666\"]','Patios, driveways, pool surrounds, rooftops','Terrain Series',0,'2026-09-18 10:17:32.299','2026-09-18 10:17:32.299'),
(4,'Gold Metallic Series','special','Special Finish','Metallic-glazed decorative tiles that add a touch of elegance to accent walls and feature areas.','300×300mm & 600×600mm','Premium','from-[#d4af37] to-[#a0832a]','https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80','[\"#d4af37\",\"#c0c0c0\",\"#b87333\"]','Accent walls, feature areas, luxury bathrooms','Gold & Ivory Classics',1,'2026-09-18 10:17:32.300','2026-09-18 10:17:32.300'),
(5,'Onyx Black Marble','floor','Floor Tiles','Luxurious polished porcelain with authentic marble veining. Makes any space feel premium.','600×1200mm',NULL,'from-[#2d2d2d] to-[#555555]','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80','[\"#2d2d2d\",\"#888888\"]','Hotel lobbies, executive offices, premium residences','Onyx Prestige',1,'2026-09-18 10:17:32.301','2026-09-18 10:17:32.301'),
(6,'Ivory Travertine','wall','Wall Tiles','Warm, natural-looking travertine-effect wall tiles. Brings timeless elegance to any room.','300×600mm & 600×600mm',NULL,'from-[#f5f0e8] to-[#ddd5c0]','https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80','[\"#f5f0e8\",\"#d2b48c\"]','Bathrooms, living areas, spa interiors','Gold & Ivory Classics',0,'2026-09-18 10:17:32.326','2026-09-18 10:17:32.326');
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
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
  UNIQUE KEY `ProjectTile_projectId_productId_key` (`projectId`,`productId`),
  KEY `ProjectTile_productId_fkey` (`productId`),
  CONSTRAINT `ProjectTile_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ProjectTile_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `role` varchar(191) NOT NULL DEFAULT 'staff',
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `canProducts` tinyint(1) NOT NULL DEFAULT 1,
  `canCollections` tinyint(1) NOT NULL DEFAULT 1,
  `canProjects` tinyint(1) NOT NULL DEFAULT 1,
  `canTestimonials` tinyint(1) NOT NULL DEFAULT 1,
  `canUsers` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-09-18 12:24:14
