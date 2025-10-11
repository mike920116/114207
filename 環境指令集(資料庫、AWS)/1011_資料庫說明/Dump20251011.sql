-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: flaskdb
-- ------------------------------------------------------
-- Server version	8.0.39

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `aichatlogs`
--

DROP TABLE IF EXISTS `aichatlogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aichatlogs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int DEFAULT NULL,
  `role` enum('user','ai','admin') NOT NULL,
  `message` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  CONSTRAINT `aichatlogs_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `aichatsessions` (`session_id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `aichatsessions`
--

DROP TABLE IF EXISTS `aichatsessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aichatsessions` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `user_email` varchar(255) DEFAULT NULL,
  `conversation_id` varchar(64) DEFAULT NULL,
  `is_open` tinyint DEFAULT '1',
  `need_human` tinyint DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  KEY `user_email` (`user_email`),
  CONSTRAINT `aichatsessions_ibfk_1` FOREIGN KEY (`user_email`) REFERENCES `user` (`User_Email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `start_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `end_time` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `card_invitations`
--

DROP TABLE IF EXISTS `card_invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `card_invitations` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '邀請記錄唯一識別ID',
  `card_id` int NOT NULL COMMENT '任務卡片ID，關聯到task_cards表',
  `sender_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '發送者Email',
  `receiver_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '接收者Email',
  `status` enum('pending','accepted','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT '邀請狀態',
  `invitation_message` text COLLATE utf8mb4_unicode_ci COMMENT '可選的邀請附加訊息',
  `card_snapshot` json NOT NULL COMMENT '發送時的卡片資訊快照',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '邀請發送時間',
  `responded_at` timestamp NULL DEFAULT NULL COMMENT '接收者回應時間',
  PRIMARY KEY (`id`),
  KEY `idx_receiver_status` (`receiver_email`,`status`),
  KEY `idx_sender_created` (`sender_email`,`created_at`),
  KEY `idx_card_invitations` (`card_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_status_created` (`status`,`created_at`),
  CONSTRAINT `card_invitations_ibfk_1` FOREIGN KEY (`card_id`) REFERENCES `task_cards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `card_invitations_ibfk_2` FOREIGN KEY (`sender_email`) REFERENCES `user` (`User_Email`) ON DELETE CASCADE,
  CONSTRAINT `card_invitations_ibfk_3` FOREIGN KEY (`receiver_email`) REFERENCES `user` (`User_Email`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任務卡片邀請表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `card_participants`
--

DROP TABLE IF EXISTS `card_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `card_participants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `card_id` int NOT NULL COMMENT '卡片ID',
  `user_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入時間',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active' COMMENT '參與狀態',
  `role` enum('host','participant') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'participant' COMMENT '參與者角色：host(主持者), participant(參與者)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_card_user` (`card_id`,`user_id`),
  KEY `idx_card_id` (`card_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role` (`role`),
  KEY `idx_card_role` (`card_id`,`role`),
  CONSTRAINT `fk_card_participants_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`User_Email`) ON DELETE CASCADE,
  CONSTRAINT `fk_participants_card` FOREIGN KEY (`card_id`) REFERENCES `task_cards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='卡片參與者表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `Comment_id` int NOT NULL AUTO_INCREMENT,
  `Post_id` int DEFAULT NULL,
  `User_Email` varchar(255) DEFAULT NULL,
  `Content` text,
  `Is_public` tinyint(1) DEFAULT '1',
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reply_to_id` int DEFAULT NULL,
  `reply_to_username` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`Comment_id`),
  KEY `Post_id` (`Post_id`),
  KEY `User_Email` (`User_Email`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`Post_id`) REFERENCES `posts` (`Post_id`),
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`User_Email`) REFERENCES `user` (`User_Email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `diaryinteractions`
--

DROP TABLE IF EXISTS `diaryinteractions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diaryinteractions` (
  `Interaction_id` int NOT NULL AUTO_INCREMENT,
  `Diary_id` int DEFAULT NULL,
  `User_message` text,
  `AI_response` text,
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Interaction_id`),
  KEY `Diary_id` (`Diary_id`),
  CONSTRAINT `diaryinteractions_ibfk_1` FOREIGN KEY (`Diary_id`) REFERENCES `diaryrecords` (`Diary_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `diaryrecords`
--

DROP TABLE IF EXISTS `diaryrecords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diaryrecords` (
  `Diary_id` int NOT NULL AUTO_INCREMENT,
  `User_Email` varchar(255) DEFAULT NULL,
  `Diary_Content` text,
  `Emotion_status` varchar(255) DEFAULT NULL,
  `AI_analysis_content` text,
  `AI_suggestions` text,
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Diary_id`),
  KEY `User_Email` (`User_Email`),
  CONSTRAINT `diaryrecords_ibfk_1` FOREIGN KEY (`User_Email`) REFERENCES `user` (`User_Email`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `diarysummaries`
--

DROP TABLE IF EXISTS `diarysummaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diarysummaries` (
  `Summary_id` int NOT NULL AUTO_INCREMENT,
  `User_Email` varchar(255) DEFAULT NULL,
  `Summary_start_period` varchar(255) DEFAULT NULL,
  `Summary_end_period` varchar(255) DEFAULT NULL,
  `Summary_content` text,
  `Generate_date` date DEFAULT NULL,
  PRIMARY KEY (`Summary_id`),
  KEY `User_Email` (`User_Email`),
  CONSTRAINT `diarysummaries_ibfk_1` FOREIGN KEY (`User_Email`) REFERENCES `user` (`User_Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `emotion_goals`
--

DROP TABLE IF EXISTS `emotion_goals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emotion_goals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_email` varchar(255) NOT NULL,
  `goal_type` varchar(50) NOT NULL COMMENT '目標類型(stability, positivity, etc)',
  `target_value` decimal(5,2) DEFAULT NULL COMMENT '目標數值',
  `current_value` decimal(5,2) DEFAULT '0.00' COMMENT '當前數值',
  `start_date` date NOT NULL COMMENT '開始日期',
  `end_date` date DEFAULT NULL COMMENT '結束日期',
  `status` enum('active','completed','paused') DEFAULT 'active' COMMENT '狀態',
  `description` text COMMENT '目標描述',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  KEY `idx_user_email` (`user_email`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='情緒目標管理表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `emotion_history`
--

DROP TABLE IF EXISTS `emotion_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emotion_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_email` varchar(255) NOT NULL,
  `message_id` varchar(100) DEFAULT NULL COMMENT '訊息ID',
  `user_emotions` json NOT NULL COMMENT '用戶情緒分析結果',
  `ai_emotions` json DEFAULT NULL COMMENT 'AI回應情緒分析結果',
  `confidence_score` int DEFAULT '5' COMMENT '分析信心度(1-10)',
  `overall_tone` varchar(100) DEFAULT NULL COMMENT '整體語調',
  `session_id` varchar(100) DEFAULT NULL COMMENT '對話會話ID',
  `interaction_type` varchar(50) DEFAULT 'chat' COMMENT '互動類型',
  `message_content` text COMMENT '訊息內容(可選儲存)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
  PRIMARY KEY (`id`),
  KEY `idx_user_email` (`user_email`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_user_date` (`user_email`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='情緒分析歷史紀錄表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `follows`
--

DROP TABLE IF EXISTS `follows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `follows` (
  `id` int NOT NULL AUTO_INCREMENT,
  `follower_email` varchar(255) NOT NULL COMMENT '追蹤者的Email',
  `following_email` varchar(255) NOT NULL COMMENT '被追蹤者的Email',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '追蹤時間',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_follow` (`follower_email`,`following_email`),
  KEY `idx_follower` (`follower_email`),
  KEY `idx_following` (`following_email`),
  CONSTRAINT `follows_ibfk_1` FOREIGN KEY (`follower_email`) REFERENCES `user` (`User_Email`) ON DELETE CASCADE,
  CONSTRAINT `follows_ibfk_2` FOREIGN KEY (`following_email`) REFERENCES `user` (`User_Email`) ON DELETE CASCADE,
  CONSTRAINT `follows_chk_1` CHECK ((`follower_email` <> `following_email`))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用戶追蹤關係表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `friend_requests`
--

DROP TABLE IF EXISTS `friend_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friend_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `requester_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `receiver_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `status` enum('pending','accepted','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT '請求狀態',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_friend_request` (`requester_email`,`receiver_email`),
  KEY `idx_requester` (`requester_email`),
  KEY `idx_receiver` (`receiver_email`),
  KEY `idx_status` (`status`),
  KEY `idx_receiver_status` (`receiver_email`,`status`),
  KEY `idx_requester_status` (`requester_email`,`status`),
  CONSTRAINT `fk_friend_requests_receiver` FOREIGN KEY (`receiver_email`) REFERENCES `user` (`User_Email`) ON DELETE CASCADE,
  CONSTRAINT `fk_friend_requests_requester` FOREIGN KEY (`requester_email`) REFERENCES `user` (`User_Email`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友請求管理表格';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `likes`
--

DROP TABLE IF EXISTS `likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `likes` (
  `Like_id` int NOT NULL AUTO_INCREMENT,
  `User_Email` varchar(255) DEFAULT NULL,
  `Post_id` int DEFAULT NULL,
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Like_id`),
  UNIQUE KEY `unique_like` (`User_Email`,`Post_id`),
  KEY `Post_id` (`Post_id`),
  CONSTRAINT `likes_ibfk_1` FOREIGN KEY (`User_Email`) REFERENCES `user` (`User_Email`),
  CONSTRAINT `likes_ibfk_2` FOREIGN KEY (`Post_id`) REFERENCES `posts` (`Post_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `migration_log`
--

DROP TABLE IF EXISTS `migration_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migration_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `rollback_script` text COLLATE utf8mb4_unicode_ci,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `migration_name` (`migration_name`),
  KEY `idx_migration_name` (`migration_name`),
  KEY `idx_applied_at` (`applied_at`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='資料庫遷移歷史記錄表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `postcollections`
--

DROP TABLE IF EXISTS `postcollections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `postcollections` (
  `Collection_id` int NOT NULL AUTO_INCREMENT,
  `User_Email` varchar(255) DEFAULT NULL,
  `Post_id` int DEFAULT NULL,
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Collection_id`),
  KEY `User_Email` (`User_Email`),
  KEY `Post_id` (`Post_id`),
  CONSTRAINT `postcollections_ibfk_1` FOREIGN KEY (`User_Email`) REFERENCES `user` (`User_Email`),
  CONSTRAINT `postcollections_ibfk_2` FOREIGN KEY (`Post_id`) REFERENCES `posts` (`Post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `Post_id` int NOT NULL AUTO_INCREMENT,
  `User_Email` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `Content` text,
  `Mood` enum('happy','sad','angry','surprised','relaxed','neutral') DEFAULT 'neutral',
  `Is_Anonymous` tinyint(1) DEFAULT '0',
  `Image_URL` varchar(500) DEFAULT NULL,
  `Is_public` tinyint(1) DEFAULT '1',
  `likes_count` int DEFAULT '0' COMMENT '貼文獲得的讚數',
  `comments_count` int DEFAULT '0' COMMENT '貼文獲得的評論數',
  `shares_count` int DEFAULT '0' COMMENT '貼文被分享的次數',
  `reposts_count` int DEFAULT '0' COMMENT '貼文被轉發的次數',
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Post_id`),
  KEY `idx_posts_mood` (`Mood`),
  KEY `idx_posts_user_email` (`User_Email`),
  KEY `idx_posts_created_at` (`Created_at`),
  KEY `idx_posts_is_anonymous` (`Is_Anonymous`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`User_Email`) REFERENCES `user` (`User_Email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `report_audit_log`
--

DROP TABLE IF EXISTS `report_audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report_audit_log` (
  `Log_id` int NOT NULL AUTO_INCREMENT,
  `Report_id` int DEFAULT NULL,
  `Action` enum('ai_check','manual_review','notify_user','close') NOT NULL,
  `Performed_by` varchar(255) NOT NULL,
  `Description` text,
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Log_id`),
  KEY `Report_id` (`Report_id`),
  CONSTRAINT `report_audit_log_ibfk_1` FOREIGN KEY (`Report_id`) REFERENCES `reports` (`Report_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `Report_id` int NOT NULL AUTO_INCREMENT,
  `User_Email` varchar(255) DEFAULT NULL,
  `Post_id` int DEFAULT NULL,
  `Theme` varchar(255) DEFAULT NULL,
  `Options` text,
  `Context` text,
  `AI_Valid` tinyint DEFAULT NULL,
  `AI_Confidence` float DEFAULT NULL,
  `AI_Reason` text,
  `AI_Suggest_Action` text,
  `Status` enum('pending','accepted','rejected','closed') DEFAULT 'pending',
  `Staff_Reply` text,
  `Notified` tinyint(1) DEFAULT '0',
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Report_id`),
  KEY `User_Email` (`User_Email`),
  KEY `Post_id` (`Post_id`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`User_Email`) REFERENCES `user` (`User_Email`),
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`Post_id`) REFERENCES `posts` (`Post_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `task_cards`
--

DROP TABLE IF EXISTS `task_cards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_cards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `title` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '卡片標題主旨',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '卡片內容',
  `stamp_icon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'fas fa-heart' COMMENT '象徵性郵戳圖標(FontAwesome類名)',
  `daily_executions` int DEFAULT '2' COMMENT '每日執行次數',
  `duration_days` int DEFAULT '3' COMMENT '持續天數',
  `max_participants` int DEFAULT '5' COMMENT '參與人數上限',
  `status` enum('draft','published','archived') COLLATE utf8mb4_unicode_ci DEFAULT 'published' COMMENT '卡片狀態',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  `daily_completed_count` int DEFAULT '0' COMMENT '今日已完成次數',
  `last_reset_date` date DEFAULT (curdate()) COMMENT '上次重置日期',
  `end_date` date NOT NULL COMMENT '任務結束日期，取代duration_days的固定天數邏輯',
  `participants_count` int DEFAULT '1' COMMENT '參與人數',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_last_reset_date` (`last_reset_date`),
  KEY `idx_end_date` (`end_date`),
  KEY `idx_participants_count` (`participants_count`),
  CONSTRAINT `fk_task_cards_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`User_Email`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任務卡片表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `User_Email` varchar(255) NOT NULL,
  `User_name` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `User_Avatar` varchar(255) DEFAULT NULL,
  `Is_Anonymous` char(1) DEFAULT 'N',
  `is_verified` tinyint DEFAULT '0',
  `email_verification_token` varchar(255) DEFAULT NULL,
  `token_expiry` datetime DEFAULT NULL,
  `reset_token` text,
  `reset_token_expiry` datetime DEFAULT NULL,
  `bio` text,
  `user_level` int DEFAULT '1' COMMENT '用戶等級(1-7)',
  `user_points` int DEFAULT '0' COMMENT '用戶總積分',
  `posts_count` int DEFAULT '0' COMMENT '發文數量',
  `likes_received` int DEFAULT '0' COMMENT '獲得讚數',
  `comments_made` int DEFAULT '0' COMMENT '發表評論數',
  `login_days` int DEFAULT '1' COMMENT '連續登入天數',
  `last_level_update` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最後等級更新時間',
  `last_login_ip` varchar(255) DEFAULT NULL,
  `last_login_time` datetime DEFAULT NULL,
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` varchar(50) DEFAULT NULL COMMENT '用戶友善ID，用於好友搜尋和識別',
  PRIMARY KEY (`User_Email`),
  UNIQUE KEY `idx_user_id` (`user_id`),
  KEY `idx_user_level` (`user_level`),
  KEY `idx_user_points` (`user_points`),
  KEY `idx_user_id_notnull` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `userdailyactivity`
--

DROP TABLE IF EXISTS `userdailyactivity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userdailyactivity` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_email` varchar(255) NOT NULL,
  `activity_date` date NOT NULL,
  `posts_created` int DEFAULT '0',
  `likes_given` int DEFAULT '0',
  `comments_made` int DEFAULT '0',
  `login_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_date` (`user_email`,`activity_date`),
  KEY `idx_activity_date` (`activity_date`),
  CONSTRAINT `userdailyactivity_ibfk_1` FOREIGN KEY (`user_email`) REFERENCES `user` (`User_Email`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `userlevelhistory`
--

DROP TABLE IF EXISTS `userlevelhistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userlevelhistory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_email` varchar(255) NOT NULL,
  `old_level` int NOT NULL,
  `new_level` int NOT NULL,
  `old_title` varchar(100) DEFAULT NULL,
  `new_title` varchar(100) DEFAULT NULL,
  `points_earned` int DEFAULT '0',
  `reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_email` (`user_email`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `userlevelhistory_ibfk_1` FOREIGN KEY (`user_email`) REFERENCES `user` (`User_Email`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping events for database 'flaskdb'
--

--
-- Dumping routines for database 'flaskdb'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-11 17:42:23
