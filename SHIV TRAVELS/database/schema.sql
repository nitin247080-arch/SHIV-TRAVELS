-- =====================================================================
-- SHIV TRAVELS - Online Travel Booking Platform
-- MySQL Database Schema (DDL)
-- =====================================================================
-- Target Database: MySQL 8.0+ / MariaDB 10.4+
-- Storage Engine: InnoDB (Full ACID compliance & Foreign Key support)
-- Character Set: utf8mb4 (Full Unicode & Emoji support for travel tags)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `voyagehub_db`
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE `voyagehub_db`;

-- Drop existing tables in reverse dependency order if recreating
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `itineraries`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `travel_listings`;
DROP TABLE IF EXISTS `vouchers`;
DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- TABLE 1: users
-- Stores all platform participants: Administrators, Certified Travel
-- Agents, and Registered Travelers.
-- =====================================================================
CREATE TABLE `users` (
    `id` VARCHAR(50) NOT NULL COMMENT 'Unique User Identifier (e.g. USR-1001)',
    `name` VARCHAR(100) NOT NULL COMMENT 'Full Legal / Profile Name',
    `email` VARCHAR(150) NOT NULL COMMENT 'Unique Login Email Address',
    `password` VARCHAR(255) NOT NULL DEFAULT 'pass123' COMMENT 'Hashed or demo password',
    `role` ENUM('ADMIN', 'AGENT', 'TRAVELER') NOT NULL DEFAULT 'TRAVELER' COMMENT 'Security & Portal Access Role',
    `phone` VARCHAR(30) DEFAULT '' COMMENT 'Primary Contact Number',
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Account Lifecycle State',
    `loyalty_points` INT NOT NULL DEFAULT 0 COMMENT 'Earned reward points for booking discounts',
    `features` VARCHAR(255) DEFAULT '' COMMENT 'Role-specific privilege flags or notes',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Registration Timestamp',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_users_email` (`email`),
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Master User Accounts and Roles Table';

-- =====================================================================
-- TABLE 2: travel_listings
-- Stores travel products: Flights, Hotels, and Rental Cars submitted
-- by Travel Agents and moderated by the Admin.
-- RELATIONSHIP: Many-to-One with `users` (agent_id -> users.id)
-- =====================================================================
CREATE TABLE `travel_listings` (
    `id` VARCHAR(50) NOT NULL COMMENT 'Unique Listing Identifier (e.g. LST-101)',
    `title` VARCHAR(200) NOT NULL COMMENT 'Package or Service Headline',
    `type` ENUM('FLIGHT', 'HOTEL', 'CAR_RENTAL') NOT NULL COMMENT 'Travel Service Category',
    `location` VARCHAR(150) NOT NULL COMMENT 'City / Region of Service',
    `origin` VARCHAR(150) DEFAULT '' COMMENT 'Flight Origin or Departure Hub',
    `destination` VARCHAR(150) NOT NULL COMMENT 'Destination City / Landmark',
    `price` DECIMAL(12, 2) NOT NULL COMMENT 'Base Rate (₹ INR) per unit/night/seat',
    `rating` DECIMAL(3, 2) NOT NULL DEFAULT 4.80 COMMENT 'Customer Review Rating (0.00 - 5.00)',
    `image_url` VARCHAR(255) NOT NULL DEFAULT '/assets/images/default.jpg' COMMENT 'High-res thumbnail asset path',
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING' COMMENT 'Listing Moderation Lifecycle',
    `agent_id` VARCHAR(50) NOT NULL COMMENT 'Foreign Key referencing submitting Travel Agent',
    `agent_name` VARCHAR(100) DEFAULT '' COMMENT 'Denormalized Agent Name for quick lookup',
    `description` TEXT COMMENT 'Detailed package overview and highlights',
    `features` TEXT COMMENT 'Comma-separated amenities (e.g. WiFi, Breakfast, GPS)',
    `available_units` INT NOT NULL DEFAULT 10 COMMENT 'Available inventory (Seats, Rooms, Vehicles)',
    `featured` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Promoted on Home Showcase banner',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation Timestamp',
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_listings_agent`
        FOREIGN KEY (`agent_id`)
        REFERENCES `users` (`id`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    INDEX `idx_listings_agent` (`agent_id`),
    INDEX `idx_listings_type` (`type`),
    INDEX `idx_listings_status` (`status`),
    INDEX `idx_listings_location` (`location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Travel Inventory Catalog (Flights, Hotels, Car Rentals)';

-- =====================================================================
-- TABLE 3: bookings
-- Stores customer reservations and financial transaction records.
-- RELATIONSHIPS:
--   1. Many-to-One with `users` (traveler_id -> users.id)
--   2. Many-to-One with `travel_listings` (listing_id -> travel_listings.id)
-- =====================================================================
CREATE TABLE `bookings` (
    `id` VARCHAR(50) NOT NULL COMMENT 'Unique Booking Identifier (e.g. BKG-1001)',
    `traveler_id` VARCHAR(50) NOT NULL COMMENT 'Foreign Key referencing booking Traveler',
    `traveler_name` VARCHAR(100) NOT NULL COMMENT 'Passenger Full Name',
    `traveler_age` INT DEFAULT 0 COMMENT 'Passenger Age in years',
    `traveler_email` VARCHAR(150) NOT NULL COMMENT 'Confirmation Contact Email',
    `traveler_phone` VARCHAR(30) DEFAULT '' COMMENT 'Passenger Contact Mobile',
    `listing_id` VARCHAR(50) NOT NULL COMMENT 'Foreign Key referencing booked Travel Listing',
    `listing_title` VARCHAR(200) NOT NULL COMMENT 'Service title snapshot at time of booking',
    `listing_type` ENUM('FLIGHT', 'HOTEL', 'CAR_RENTAL') NOT NULL COMMENT 'Booked Service Category',
    `destination` VARCHAR(150) NOT NULL COMMENT 'Travel Destination or Rental City',
    `booking_date` VARCHAR(50) NOT NULL COMMENT 'Formatted Order Placement Date/Time',
    `travel_date` VARCHAR(50) NOT NULL COMMENT 'Departure / Check-In / Pickup Date',
    `return_date` VARCHAR(50) DEFAULT '' COMMENT 'Return / Check-Out / Drop-Off Date',
    `pickup_location` VARCHAR(150) DEFAULT '' COMMENT 'Car Rental Specific: Physical Pickup Station',
    `vehicle_type` VARCHAR(100) DEFAULT '' COMMENT 'Car Rental Specific: Selected Vehicle Class (SUV, Sedan, etc.)',
    `units` INT NOT NULL DEFAULT 1 COMMENT 'Quantity (Passengers / Rooms / Rental Days)',
    `price_per_unit` DECIMAL(12, 2) NOT NULL COMMENT 'Unit price at time of booking',
    `tax_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Computed GST / Tourism tax (₹)',
    `total_price` DECIMAL(12, 2) NOT NULL COMMENT 'Final Paid Amount including taxes (₹)',
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED' COMMENT 'Booking Status Lifecycle',
    `special_requests` TEXT COMMENT 'Passenger requests (Window seat, late check-in, infant seat)',
    `payment_method` ENUM('UPI', 'CREDIT_CARD', 'NET_BANKING') NOT NULL DEFAULT 'UPI' COMMENT 'Simulated Payment Channel',
    `payment_status` ENUM('PAID', 'PENDING', 'REFUNDED') NOT NULL DEFAULT 'PAID' COMMENT 'Settlement Status',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record Creation Timestamp',
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_bookings_traveler`
        FOREIGN KEY (`traveler_id`)
        REFERENCES `users` (`id`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT `fk_bookings_listing`
        FOREIGN KEY (`listing_id`)
        REFERENCES `travel_listings` (`id`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    INDEX `idx_bookings_traveler` (`traveler_id`),
    INDEX `idx_bookings_listing` (`listing_id`),
    INDEX `idx_bookings_status` (`status`),
    INDEX `idx_bookings_date` (`travel_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Passenger Reservations & Financial Transactions Ledger';

-- =====================================================================
-- TABLE 4: itineraries
-- Stores personalized multi-day trip schedules and vacation budgets.
-- RELATIONSHIP: Many-to-One with `users` (traveler_id -> users.id)
-- =====================================================================
CREATE TABLE `itineraries` (
    `id` VARCHAR(50) NOT NULL COMMENT 'Unique Itinerary Identifier (e.g. ITN-101)',
    `traveler_id` VARCHAR(50) NOT NULL COMMENT 'Foreign Key referencing Trip Planner / Traveler',
    `traveler_name` VARCHAR(100) NOT NULL COMMENT 'Traveler Name',
    `trip_title` VARCHAR(200) NOT NULL COMMENT 'Vacation Plan Name (e.g. Goa Beach Vacation)',
    `destination` VARCHAR(150) NOT NULL COMMENT 'Primary Vacation Destination',
    `start_date` VARCHAR(50) NOT NULL COMMENT 'Vacation Start Date',
    `end_date` VARCHAR(50) NOT NULL COMMENT 'Vacation End Date',
    `estimated_budget` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Planned Travel Budget (₹)',
    `total_cost` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Computed Actual Cost (₹)',
    `status` ENUM('PLANNED', 'CONFIRMED', 'COMPLETED') NOT NULL DEFAULT 'PLANNED' COMMENT 'Trip Planning State',
    `plan_details` TEXT COMMENT 'Day-wise sightseeing schedule and activities',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation Timestamp',
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_itineraries_traveler`
        FOREIGN KEY (`traveler_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX `idx_itineraries_traveler` (`traveler_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Traveler Personalized Itineraries and Budgets';

-- =====================================================================
-- TABLE 5: messages
-- Stores two-way communication inquiries, custom requests, and reviews.
-- RELATIONSHIPS:
--   1. sender_id -> users.id (Foreign Key)
--   2. recipient_id -> users.id (Foreign Key)
-- =====================================================================
CREATE TABLE `messages` (
    `id` VARCHAR(50) NOT NULL COMMENT 'Unique Message Identifier (e.g. MSG-101)',
    `sender_id` VARCHAR(50) NOT NULL COMMENT 'Foreign Key referencing Sender User',
    `sender_name` VARCHAR(100) NOT NULL COMMENT 'Sender Display Name',
    `sender_role` ENUM('ADMIN', 'AGENT', 'TRAVELER') NOT NULL COMMENT 'Role of Sender',
    `recipient_id` VARCHAR(50) NOT NULL COMMENT 'Foreign Key referencing Recipient User',
    `recipient_name` VARCHAR(100) NOT NULL COMMENT 'Recipient Display Name',
    `subject` VARCHAR(200) NOT NULL COMMENT 'Inquiry Subject / Topic',
    `message_text` TEXT NOT NULL COMMENT 'Detailed Inquiry / Feedback Body',
    `listing_reference` VARCHAR(150) DEFAULT '' COMMENT 'Associated Listing ID or Package Title',
    `status` ENUM('UNREAD', 'READ', 'REPLIED') NOT NULL DEFAULT 'UNREAD' COMMENT 'Processing State',
    `reply` TEXT COMMENT 'Agent or Admin Response Text',
    `timestamp` VARCHAR(50) NOT NULL COMMENT 'Submission Date/Time string',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation Timestamp',
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_messages_sender`
        FOREIGN KEY (`sender_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_messages_recipient`
        FOREIGN KEY (`recipient_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX `idx_messages_sender` (`sender_id`),
    INDEX `idx_messages_recipient` (`recipient_id`),
    INDEX `idx_messages_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Traveler Inquiries, Agent Communications & Feedback Desk';

-- =====================================================================
-- TABLE 6: system_settings
-- Stores platform-wide parameters configured exclusively by the Admin.
-- =====================================================================
CREATE TABLE `system_settings` (
    `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Settings Row ID',
    `platform_name` VARCHAR(150) NOT NULL DEFAULT 'SHIV TRAVELS - Global Travel Booking' COMMENT 'Brand Title',
    `currency_symbol` VARCHAR(10) NOT NULL DEFAULT '₹' COMMENT 'Currency Glyph',
    `currency_code` VARCHAR(10) NOT NULL DEFAULT 'INR' COMMENT 'ISO 4217 Currency Code',
    `default_tax_rate` DECIMAL(5, 2) NOT NULL DEFAULT 5.00 COMMENT 'GST / Tourism Surcharge (%)',
    `maintenance_mode` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Restricts checkout when enabled',
    `contact_email` VARCHAR(150) NOT NULL DEFAULT 'admin@shivtravels.com' COMMENT 'Official Support Email',
    `support_phone` VARCHAR(50) NOT NULL DEFAULT '1800-123-8692' COMMENT 'Toll-free 24/7 Helpline',
    `allow_agent_registration` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Toggle Agent Self-Signup',
    `max_bookings_per_user` INT NOT NULL DEFAULT 20 COMMENT 'Anti-abuse limit per user',
    `terms_and_conditions` TEXT COMMENT 'Platform Booking & Cancellation Terms',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last Revision Timestamp',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Global Platform Configuration & Business Rules';

-- =====================================================================
-- TABLE 7: vouchers (Bonus Entity for Promotional Discounts)
-- Stores discount coupon codes generated by Admin and redeemed by Travelers.
-- =====================================================================
CREATE TABLE `vouchers` (
    `id` VARCHAR(50) NOT NULL COMMENT 'Unique Voucher Identifier (e.g. VOUCH-101)',
    `code` VARCHAR(50) NOT NULL COMMENT 'Uppercase Coupon Code (e.g. SHIV20)',
    `discount_type` ENUM('PERCENT', 'FLAT') NOT NULL DEFAULT 'PERCENT' COMMENT 'Percentage or Fixed INR',
    `discount_value` DECIMAL(10, 2) NOT NULL COMMENT 'Discount amount (e.g. 20.00 for 20% or 500 for ₹500)',
    `min_spend` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Minimum booking cart total required',
    `usage_count` INT NOT NULL DEFAULT 0 COMMENT 'Number of times code has been redeemed',
    `max_usage` INT NOT NULL DEFAULT 100 COMMENT 'Maximum allowed redemptions',
    `expiry_date` VARCHAR(50) NOT NULL COMMENT 'Voucher Expiry Date (YYYY-MM-DD)',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Active / Inactive Status',
    `campaign_note` VARCHAR(255) DEFAULT '' COMMENT 'Marketing Campaign Description',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation Timestamp',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_vouchers_code` (`code`),
    INDEX `idx_vouchers_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Promotional Coupon & Voucher Codes';
