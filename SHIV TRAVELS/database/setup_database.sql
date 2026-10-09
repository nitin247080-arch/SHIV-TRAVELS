-- =====================================================================
-- SHIV TRAVELS - Online Travel Booking Platform (B.Tech 3rd Semester)
-- UNIFIED DATABASE SETUP SCRIPT (DDL + DML + INTEGRITY CHECKS)
-- =====================================================================
-- Target Database: MySQL 8.0+ / MariaDB 10.4+
-- Storage Engine:  InnoDB (Full ACID compliance, Foreign Keys, Transactions)
-- Character Set:   utf8mb4 (Full Unicode & Emoji support)
-- =====================================================================

-- Step 1: Create Database
CREATE DATABASE IF NOT EXISTS `voyagehub_db`
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE `voyagehub_db`;

-- Step 2: Safely disable foreign key checks during schema re-creation
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
-- Description: Master table for all system actors (Admin, Agent, Traveler)
-- Primary Key: id
-- =====================================================================
CREATE TABLE `users` (
    `id` VARCHAR(50) NOT NULL COMMENT 'Unique User Identifier (e.g. USR-001)',
    `name` VARCHAR(100) NOT NULL COMMENT 'Full Legal / Profile Name',
    `email` VARCHAR(150) NOT NULL COMMENT 'Unique Login Email Address',
    `password` VARCHAR(255) NOT NULL DEFAULT 'pass123' COMMENT 'User password for authentication',
    `role` ENUM('ADMIN', 'AGENT', 'TRAVELER') NOT NULL DEFAULT 'TRAVELER' COMMENT 'Security & Portal Access Role',
    `phone` VARCHAR(30) DEFAULT '' COMMENT 'Primary Contact Mobile Number',
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
-- Description: Travel services (Flights, Hotels, Car Rentals)
-- Relationship: Many-to-One with users (agent_id -> users.id)
-- Primary Key: id
-- Foreign Key: agent_id REFERENCES users(id)
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
    `image_url` VARCHAR(255) NOT NULL DEFAULT '/assets/images/ayodhya_ram_mandir.jpg' COMMENT 'High-res thumbnail asset path',
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
-- Description: Customer reservations and financial transactions
-- Relationships:
--   1. traveler_id REFERENCES users(id)
--   2. listing_id REFERENCES travel_listings(id)
-- Primary Key: id
-- Foreign Keys: traveler_id, listing_id
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
-- Description: Personalized trip plans and vacation schedules
-- Relationship: traveler_id REFERENCES users(id)
-- Primary Key: id
-- Foreign Key: traveler_id
-- =====================================================================
CREATE TABLE `itineraries` (
    `id` VARCHAR(50) NOT NULL COMMENT 'Unique Itinerary Identifier (e.g. ITN-200)',
    `traveler_id` VARCHAR(50) NOT NULL COMMENT 'Foreign Key referencing Trip Planner / Traveler',
    `traveler_name` VARCHAR(100) NOT NULL COMMENT 'Traveler Name',
    `trip_title` VARCHAR(200) NOT NULL COMMENT 'Vacation Plan Name',
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
-- Description: Two-way inquiries, reviews, and customer support chats
-- Relationships:
--   1. sender_id REFERENCES users(id)
--   2. recipient_id REFERENCES users(id)
-- Primary Key: id
-- Foreign Keys: sender_id, recipient_id
-- =====================================================================
CREATE TABLE `messages` (
    `id` VARCHAR(50) NOT NULL COMMENT 'Unique Message Identifier (e.g. MSG-300)',
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
-- Description: Global platform rules and parameters managed by Admin
-- Primary Key: id
-- =====================================================================
CREATE TABLE `system_settings` (
    `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Settings Row ID',
    `platform_name` VARCHAR(150) NOT NULL DEFAULT 'SHIV TRAVELS - Luxury & Global Travel' COMMENT 'Brand Title',
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
-- TABLE 7: vouchers
-- Description: Promotional discount codes created by Admin & redeemed by Travelers
-- Primary Key: id
-- Unique Key: code
-- =====================================================================
CREATE TABLE `vouchers` (
    `id` VARCHAR(50) NOT NULL COMMENT 'Unique Voucher Identifier (e.g. VCH-001)',
    `code` VARCHAR(50) NOT NULL COMMENT 'Uppercase Coupon Code (e.g. VOYAGE20)',
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

-- =====================================================================
-- SECTION 2: SEED DATA (DML INSERTS)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. SEED DATA: users (Admin, Travel Agents, Travelers)
-- ---------------------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `status`, `loyalty_points`, `features`) VALUES
('USR-001', 'Nitin Chaudhary', 'nitin.admin@travel.com', 'admin123', 'ADMIN', '+91 98111 22334', 'ACTIVE', 5000, 'User Management, Listing Approvals, System Settings (GST %, Commission), Revenue & Booking Overview'),
('USR-002', 'Aman Sharma', 'agent@travel.com', 'agent123', 'AGENT', '+91 98222 33445', 'ACTIVE', 1200, 'Manage Listings, User Interaction, Track Bookings'),
('USR-003', 'Arjun Nair (Skyline Travels)', 'arjun@skylinetravels.com', 'agent123', 'AGENT', '+91 98333 44556', 'ACTIVE', 950, 'Certified Global Airline & Tour Partner'),
('USR-004', 'Ashutosh', 'ashutosh@traveler.com', 'pass123', 'TRAVELER', '+91 98444 55667', 'ACTIVE', 450, 'Bookings, Cancel Reservations, Chat with Agent'),
('USR-005', 'Himanshu', 'himanshu@traveler.com', 'pass123', 'TRAVELER', '+91 98555 66778', 'ACTIVE', 600, 'Bookings, Itinerary Viewer, Feedback Desk'),
('USR-006', 'Nitin', 'nitin@traveler.com', 'pass123', 'TRAVELER', '+91 98765 43210', 'ACTIVE', 1500, 'Book Flights / Hotels / Cars, View & Export Itinerary, Loyalty Points'),
('USR-007', 'Rahul Verma', 'rahul@gmail.com', 'pass123', 'TRAVELER', '+91 98999 11223', 'ACTIVE', 750, 'Frequent Flyer Member'),
('USR-008', 'Ananya Sen', 'ananya@gmail.com', 'pass123', 'TRAVELER', '+91 98777 66554', 'ACTIVE', 300, 'Adventure Explorer');

-- ---------------------------------------------------------------------
-- 2. SEED DATA: travel_listings (Linked to agent_id -> USR-002, USR-003)
-- ---------------------------------------------------------------------
INSERT INTO `travel_listings` (`id`, `title`, `type`, `location`, `origin`, `destination`, `price`, `rating`, `image_url`, `status`, `agent_id`, `agent_name`, `description`, `features`, `available_units`, `featured`) VALUES
('LST-101', 'The Oberoi Amarvilas - Taj Mahal Heritage Suite', 'HOTEL', 'Agra, Uttar Pradesh, India', '', 'Agra', 18500.00, 4.95, '/assets/images/taj_mahal.webp', 'APPROVED', 'USR-002', 'Aman Sharma', 'Luxury 5-star hotel offering uninterrupted, magical views of the Taj Mahal from every room, private balcony dining, and royal Mughal architecture.', 'Taj Mahal Balcony View, Butler Service, Luxury Spa, Infinity Pool, Heritage Walk', 12, TRUE),
('LST-102', 'IndiGo Express 6E-204: Delhi (DEL) → Agra (AGR)', 'FLIGHT', 'Agra, India', 'New Delhi (DEL)', 'Agra (AGR)', 3499.00, 4.82, '/assets/images/taj_mahal.webp', 'APPROVED', 'USR-003', 'Arjun Nair', 'Fast, reliable morning flight connecting the national capital to the City of Taj. Includes express boarding and extra legroom seating options.', 'Airbus A320neo, Non-stop 45 mins, 15kg Luggage, Complimentary Snack', 45, TRUE),
('LST-103', 'Tegallalang Bali Rainforest Villa & Infinity Retreat', 'HOTEL', 'Ubud, Bali, Indonesia', '', 'Bali, Indonesia', 12800.00, 4.90, '/assets/images/bali_rice_terraces.jpg', 'APPROVED', 'USR-002', 'Aman Sharma', 'Nestled among the world-famous emerald rice terraces of Tegallalang, featuring open-air bamboo suites, floating breakfasts, and authentic Balinese healing spa.', 'Overlooking Rice Terraces, Private Plunge Pool, Floating Breakfast, Daily Morning Yoga', 8, TRUE),
('LST-104', 'Garuda Indonesia GA-872: Mumbai (BOM) → Bali (DPS)', 'FLIGHT', 'Bali, Indonesia', 'Mumbai (BOM)', 'Bali Denpasar (DPS)', 26500.00, 4.86, '/assets/images/bali_rice_terraces.jpg', 'APPROVED', 'USR-002', 'Aman Sharma', 'Direct premium international flight connecting India\'s financial capital to the tropical paradise of Bali with world-class hospitality.', 'Boeing 777-300ER, Multi-course Meal, 30kg Luggage, 4K Entertainment', 28, FALSE),
('LST-105', 'Dubai Marina Luxury Waterfront Suite & Sky Lounge', 'HOTEL', 'Dubai Marina, United Arab Emirates', '', 'Dubai, UAE', 24500.00, 4.94, '/assets/images/dubai_marina.webp', 'APPROVED', 'USR-003', 'Arjun Nair', 'Spectacular high-floor luxury suite overlooking the glittering Dubai Marina yachts, private rooftop sky pool, infinity bar, and direct marina promenade access.', 'Panoramic Marina View, Rooftop Sky Pool, 24/7 Concierge, Private Jacuzzi, Valet', 10, TRUE),
('LST-106', 'Dubai Marina Supercar Rental: Ferrari F8 / Mustang GT', 'CAR_RENTAL', 'Dubai, United Arab Emirates', 'Dubai Marina / DXB Airport', 'Dubai City & Palm Jumeirah', 14500.00, 4.92, '/assets/images/dubai_marina.webp', 'APPROVED', 'USR-003', 'Arjun Nair', 'Experience the glamour of Dubai roads in a thrilling convertible sports car with door-to-door delivery and 24/7 roadside assistance.', 'Automatic V8 Engine, Convertible Roof, Zero Security Deposit, GPS & Apple CarPlay', 5, TRUE),
('LST-107', 'Taj Exotica Resort & Private Beachfront Villa', 'HOTEL', 'Benaulim, South Goa, India', '', 'South Goa', 15999.00, 4.88, '/assets/images/goa_beach.jpg', 'APPROVED', 'USR-002', 'Aman Sharma', 'Sprawling Mediterranean-style 5-star haven spread across 56 acres overlooking the serene Arabian Sea with pristine white sandy private beach.', 'Private Beach Access, Golf Course, Sunset Catamaran Cruise, Beachside Seafood Grill', 15, TRUE),
('LST-108', 'Open-Top Mahindra Thar 4x4 Beach Cruiser', 'CAR_RENTAL', 'Goa, India', 'Goa Dabolim / Mopa Airport', 'All Goa Beaches & Waterfalls', 2800.00, 4.78, '/assets/images/goa_beach.jpg', 'APPROVED', 'USR-002', 'Aman Sharma', 'Cruise through Goa\'s scenic palm-lined coastal roads and serene backwaters in an iconic open-top 4x4 rugged convertible Thar.', '4x4 Automatic, Removable Hard-top, High-Bass Sound System, Unlimited Kilometers', 14, FALSE),
('LST-109', 'Amber Fort Royal Heritage Haveli & Palace Stay', 'HOTEL', 'Amer, Jaipur, Rajasthan, India', '', 'Jaipur, Rajasthan', 13500.00, 4.93, '/assets/images/jaipur_amber_fort.jpg', 'APPROVED', 'USR-002', 'Aman Sharma', 'Historic 250-year-old restored Rajput royal haveli with direct views of the Amber Fort, authentic royal courtyards, and puppet & folk dance evenings.', 'Fort View Terrace, Royal Rajasthani Banquet, Vintage Car Welcome, Swimming Pool', 9, TRUE),
('LST-110', 'Chauffeur-Driven Royal Toyota Crysta & Fort Tour Cab', 'CAR_RENTAL', 'Jaipur, Rajasthan, India', 'Jaipur Airport / Railway Station', 'Jaipur, Amber, Nahargarh, Hawa Mahal', 3900.00, 4.81, '/assets/images/jaipur_amber_fort.jpg', 'APPROVED', 'USR-002', 'Aman Sharma', 'Full-day luxury air-conditioned transport with an experienced courteous chauffeur and licensed local tour guide for Jaipur sight-seeing.', '7-Seater Luxury AC, English/Hindi Driver, All Tolls & Parking Covered, Mineral Water', 18, FALSE),
('LST-111', 'Emirates EK-512: Delhi (DEL) → Dubai (DXB)', 'FLIGHT', 'Dubai, United Arab Emirates', 'New Delhi (DEL)', 'Dubai (DXB)', 19800.00, 4.91, '/assets/images/dubai_marina.webp', 'APPROVED', 'USR-003', 'Arjun Nair', 'World\'s leading flagship carrier offering iconic Airbus A380 experience, multi-course international cuisine, and ICE entertainment system.', 'Airbus A380, Free High-speed WiFi, 35kg Baggage, Direct 3h 40m', 32, FALSE),
('LST-114', 'Bachalpsee Alpine Panorama Chalet & Ski Resort', 'HOTEL', 'Grindelwald, Swiss Alps, Switzerland', '', 'Switzerland', 34500.00, 4.98, '/assets/images/swiss_alps.jpg', 'APPROVED', 'USR-003', 'Arjun Nair', 'Spectacular 5-star mountain chalet perched above Grindelwald facing alpine lakes and glaciated peaks. Features open fireplace, thermal outdoor infinity bath, and ski-in access.', 'Glacier & Lake View, Thermal Spa, Fireplace Lounge, Heated Ski Gear Storage, Gourmet Fondue', 6, TRUE),
('LST-115', 'SWISS International Air LX-147: Mumbai (BOM) → Zurich (ZRH)', 'FLIGHT', 'Zurich & Swiss Alps, Switzerland', 'Mumbai (BOM)', 'Zurich (ZRH)', 48900.00, 4.92, '/assets/images/swiss_alps.jpg', 'APPROVED', 'USR-003', 'Arjun Nair', 'Fly directly to Switzerland in comfort with premium Swiss chocolates, artisanal wines, and complimentary ski luggage allowance.', 'Boeing 777, Swiss Fine Dining, Free Ski Baggage, Lie-Flat Seats Available', 22, TRUE),
('LST-116', 'Phi Phi Island Overwater Luxury Villa & Private Beach', 'HOTEL', 'Koh Phi Phi, Krabi, Thailand', '', 'Thailand', 16800.00, 4.91, '/assets/images/thailand_phiphi.jpg', 'APPROVED', 'USR-002', 'Aman Sharma', 'Perched right on the crystal-clear emerald waters of the Andaman Sea surrounded by towering limestone karst cliffs. Includes glass-floor ocean bedroom and private sunset deck.', 'Direct Ocean Access, Glass Floor Bedroom, Sunset Longtail Boat Ride, Daily Snorkeling Gear', 10, TRUE),
('LST-117', 'Private Luxury Speedboat & Karst Lagoon Tour', 'CAR_RENTAL', 'Phuket / Krabi, Thailand', 'Ao Nang Pier / Phuket Marina', 'Phi Phi, Maya Bay & Bamboo Island', 9500.00, 4.88, '/assets/images/thailand_phiphi.jpg', 'APPROVED', 'USR-002', 'Aman Sharma', 'Charter your private twin-engine speedboat for exploring secluded lagoons, snorkeling with reef fish, and cruising iconic limestone formations at your own pace.', 'Private Captain & Crew, Snorkeling Equipment, Fresh Fruits & Soft Drinks, National Park Passes', 8, TRUE),
('LST-118', 'Maota Lake Royal Palace View Luxury Suites', 'HOTEL', 'Amber Fort, Jaipur, Rajasthan, India', '', 'Jaipur, Rajasthan', 17200.00, 4.94, '/assets/images/jaipur_maota_lake.webp', 'APPROVED', 'USR-002', 'Aman Sharma', 'Wake up to the breath-taking reflection of the grand Amber Fort shimmering in the calm waters of Maota Lake. Authentic Jharokha seating and Mewari royal hospitality.', 'Direct Lake & Fort Reflection, Jharokha Balconies, Royal Sitar Dinners, Private Peacock Garden', 11, TRUE),
('LST-119', 'Snow Peak Luxury Himalayan Chalet & Apple Orchard', 'HOTEL', 'Old Manali, Himachal Pradesh, India', '', 'Manali, Himachal Pradesh', 11500.00, 4.89, '/assets/images/manali_snow_peaks.jpg', 'APPROVED', 'USR-003', 'Arjun Nair', 'Cosy pine-wood luxury chalets nestled amidst snow-blanketed deodar forests and apple orchards with panoramic views of Pir Panjal snow peaks.', 'Snow Peak Balcony, Traditional Bukhari Fireplace, Bonfire Evenings, Mountain Trout Dining', 14, TRUE),
('LST-120', 'Snow Expedition Mahindra Thar 4x4 & Rohtang Pass Cab', 'CAR_RENTAL', 'Manali, Himachal Pradesh, India', 'Manali Mall Road / Bhuntar Airport', 'Rohtang Pass, Solang Valley, Atal Tunnel', 3500.00, 4.84, '/assets/images/manali_snow_peaks.jpg', 'APPROVED', 'USR-003', 'Arjun Nair', 'Heavy-duty 4x4 vehicle equipped with all-terrain snow chains and an experienced Himalayan driver to conquer high-altitude mountain passes.', '4x4 Snow Tires & Chains, Heated Cabin, Rohtang Green Permit Included, Oxygen Kit', 12, TRUE),
('LST-121', 'Shree Ram Janmabhoomi Teerth Heritage Stay & VIP Darshan', 'HOTEL', 'Ayodhya, Uttar Pradesh, India', '', 'Ayodhya, India', 6499.00, 4.98, '/assets/images/ayodhya_ram_mandir.jpg', 'APPROVED', 'USR-002', 'Aman Sharma', 'Divine spiritual retreat within walking distance of the sacred Shree Ram Janmabhoomi Mandir. Includes VIP Sugam Darshan coordination, evening Saryu Maha Aarti, and Satvik cuisine.', 'VIP Sugam Darshan Pass Included, Walking Distance to Ram Mandir, Saryu Aarti Cruise, Pure Veg Satvik Dining, Free Temple Shuttle', 25, TRUE),
('LST-122', 'Air India Express IX-114: Delhi (DEL) → Ayodhya Dham (AYJ)', 'FLIGHT', 'Ayodhya Dham, India', 'New Delhi (DEL)', 'Ayodhya Dham (AYJ)', 3899.00, 4.88, '/assets/images/ayodhya_ram_mandir.jpg', 'APPROVED', 'USR-003', 'Arjun Nair', 'Direct morning flight connecting Delhi to Maharishi Valmiki International Airport Ayodhya Dham. Quick 1 hour 15 minutes journey with prasad allowance.', 'Direct 1h 15m Flight, Boeing 737, Extra Baggage for Holy Prasad, Refreshment Included', 50, TRUE),
('LST-123', 'Chauffeur-Driven AC Innova: Ayodhya-Varanasi-Prayagraj Teerth Cab', 'CAR_RENTAL', 'Ayodhya, Uttar Pradesh, India', 'Ayodhya Airport (AYJ) / Dham Station', 'Ayodhya, Kashi Varanasi, Prayagraj Sangam', 3200.00, 4.90, '/assets/images/ayodhya_ram_mandir.jpg', 'APPROVED', 'USR-002', 'Aman Sharma', 'Full-day AC vehicle with verified respectful driver guide for complete Ram Mandir, Hanuman Garhi, Kanak Bhavan, and Saryu Ghat holy pilgrimage tour.', '7-Seater AC Innova Crysta, Devotional Guide Driver, All Parking & Tolls Included, Mineral Water', 16, TRUE),
-- Pending approval listings for Admin Moderation Demo
('LST-112', 'Eiffel Tower View Luxury Penthouse - Paris', 'HOTEL', 'Paris, France', '', 'Paris, France', 32000.00, 4.85, '/assets/images/swiss_alps.jpg', 'PENDING', 'USR-003', 'Arjun Nair', 'Elegant Haussmann-style Parisian apartment directly opposite the Champ de Mars with champagne balcony looking straight at the illuminated Eiffel Tower.', 'Eiffel Tower View, Champagne on Arrival, Chef Breakfast, Metro 2 mins walk', 4, FALSE),
('LST-113', 'Air France AF-225: Mumbai (BOM) → Paris (CDG)', 'FLIGHT', 'Paris, France', 'Mumbai (BOM)', 'Paris Charles de Gaulle (CDG)', 44500.00, 4.79, '/assets/images/swiss_alps.jpg', 'PENDING', 'USR-003', 'Arjun Nair', 'Non-stop overnight flight to the City of Light with French fine wines and cheeses included.', 'Boeing 787 Dreamliner, 2x23kg Baggage, USB-C Fast Charging, Complimentary Champagne', 20, FALSE);

-- ---------------------------------------------------------------------
-- 3. SEED DATA: bookings (Linked to traveler_id -> users, listing_id -> listings)
-- ---------------------------------------------------------------------
INSERT INTO `bookings` (`id`, `traveler_id`, `traveler_name`, `traveler_age`, `traveler_email`, `traveler_phone`, `listing_id`, `listing_title`, `listing_type`, `destination`, `booking_date`, `travel_date`, `return_date`, `pickup_location`, `vehicle_type`, `units`, `price_per_unit`, `tax_amount`, `total_price`, `status`, `special_requests`, `payment_method`, `payment_status`) VALUES
('BKG-1001', 'USR-004', 'Ashutosh', 28, 'ashutosh@traveler.com', '+91 98444 55667', 'LST-121', 'Shree Ram Janmabhoomi Teerth Heritage Stay & VIP Darshan', 'HOTEL', 'Ayodhya, India', '2026-10-06 14:30', '2026-10-24', '2026-10-27', '', '', 2, 6499.00, 649.90, 13647.90, 'CONFIRMED', 'VIP Aarti passes for evening Saryu Aarti', 'UPI', 'PAID'),
('BKG-1002', 'USR-005', 'Himanshu', 26, 'himanshu@traveler.com', '+91 98555 66778', 'LST-105', 'Dubai Marina Luxury Waterfront Suite & Sky Lounge', 'HOTEL', 'Dubai Marina, UAE', '2026-10-06 16:15', '2026-11-05', '2026-11-10', '', '', 1, 24500.00, 1225.00, 25725.00, 'CONFIRMED', 'High floor requested with late checkout', 'CREDIT_CARD', 'PAID'),
('BKG-1003', 'USR-006', 'Nitin', 24, 'nitin@traveler.com', '+91 98765 43210', 'LST-119', 'Snow Peak Luxury Himalayan Chalet & Apple Orchard', 'HOTEL', 'Manali, Himachal Pradesh', '2026-10-07 10:20', '2026-11-20', '2026-11-25', '', '', 2, 11500.00, 1150.00, 24150.00, 'CONFIRMED', 'Snow facing upper deck chalet requested', 'UPI', 'PAID'),
('BKG-1004', 'USR-004', 'Ashutosh', 28, 'ashutosh@traveler.com', '+91 98444 55667', 'LST-116', 'Phi Phi Island Overwater Luxury Villa & Private Beach', 'HOTEL', 'Krabi / Phuket, Thailand', '2026-10-07 15:40', '2026-12-10', '2026-12-15', '', '', 1, 16800.00, 840.00, 17640.00, 'CONFIRMED', 'Sunset catamaran boat pickup included', 'UPI', 'PAID'),
('BKG-1005', 'USR-006', 'Nitin', 24, 'nitin@traveler.com', '+91 98765 43210', 'LST-120', 'Snow Expedition Mahindra Thar 4x4 & Rohtang Pass Cab', 'CAR_RENTAL', 'Manali, Himachal Pradesh', '2026-10-07 18:00', '2026-11-22', '2026-11-25', 'Manali Mall Road & Hotel Pickup', '4x4 Heavy SUV', 3, 3500.00, 525.00, 11025.00, 'PENDING', 'Snow chains and experienced Himalayan driver', 'UPI', 'PENDING'),
('BKG-1006', 'USR-005', 'Himanshu', 26, 'himanshu@traveler.com', '+91 98555 66778', 'LST-111', 'Emirates EK-512: Delhi (DEL) → Dubai (DXB)', 'FLIGHT', 'Dubai, United Arab Emirates', '2026-10-07 20:10', '2026-11-04', '2026-11-12', '', '', 1, 19800.00, 990.00, 20790.00, 'CANCELLED', 'Trip rescheduled by traveler', 'CREDIT_CARD', 'REFUNDED');

-- ---------------------------------------------------------------------
-- 4. SEED DATA: itineraries (Linked to traveler_id -> users)
-- ---------------------------------------------------------------------
INSERT INTO `itineraries` (`id`, `traveler_id`, `traveler_name`, `trip_title`, `destination`, `start_date`, `end_date`, `estimated_budget`, `total_cost`, `status`, `plan_details`) VALUES
('ITN-200', 'USR-004', 'Ashutosh', 'Divine Ayodhya Dham & Kashi Vishwanath Yatra', 'Ayodhya & Varanasi, India', '2026-10-24', '2026-10-28', 25000.00, 21800.00, 'CONFIRMED', 'Day 1: Arrival at Ayodhya Dham & check-in | Day 2: Morning VIP Darshan at Shree Ram Janmabhoomi Mandir & evening Saryu Maha Aarti | Day 3: Drive to Kashi Varanasi via AC Cab & Ganga Aarti | Day 4: Kashi Vishwanath Darshan & departure.'),
('ITN-201', 'USR-004', 'Ashutosh', 'Golden Triangle Heritage Tour (Agra & Jaipur)', 'Agra & Jaipur, India', '2026-10-20', '2026-10-26', 60000.00, 53200.00, 'CONFIRMED', 'Day 1: Arrival & Oberoi Amarvilas check-in | Day 2: Taj Mahal sunrise view & Agra Fort | Day 3: Drive to Jaipur via Fatehpur Sikri | Day 4: Amber Fort & Maota Lake view | Day 5: Departure.'),
('ITN-202', 'USR-006', 'Nitin', 'Himalayan Snow Adventure & Rohtang Pass Expedition', 'Manali & Rohtang, India', '2026-11-20', '2026-11-26', 45000.00, 38500.00, 'CONFIRMED', 'Day 1: Arrival at Old Manali Chalet & Bonfire | Day 2: 4x4 Thar drive through Atal Tunnel & Sissu Waterfall | Day 3: Snow activities at Solang & Rohtang | Day 4: Apple orchard walk & departure.');

-- ---------------------------------------------------------------------
-- 5. SEED DATA: messages (Linked to sender_id -> users, recipient_id -> users)
-- ---------------------------------------------------------------------
INSERT INTO `messages` (`id`, `sender_id`, `sender_name`, `sender_role`, `recipient_id`, `recipient_name`, `subject`, `message_text`, `listing_reference`, `status`, `reply`, `timestamp`) VALUES
('MSG-300', 'USR-004', 'Ashutosh', 'TRAVELER', 'USR-002', 'Aman Sharma', 'Ayodhya Ram Mandir Aarti Passes & Dress Code', 'Namaste Aman ji! Does the Ayodhya package include morning Shringar Aarti or evening Sandhya Aarti passes for family?', 'LST-121', 'REPLIED', 'Namaste Ashutosh ji! Yes, we pre-book official Sugam Darshan and Saryu Aarti slots with private temple corridor access. Traditional decent clothing is requested.', '2026-10-07 11:30'),
('MSG-301', 'USR-004', 'Ashutosh', 'TRAVELER', 'USR-002', 'Aman Sharma', 'Taj Mahal Sunrise Timings & Photographer', 'Hi Aman! Is it possible to arrange a verified guide and professional photographer for the early morning 6 AM Taj Mahal sunrise shoot?', 'LST-101', 'UNREAD', '', '2026-10-07 14:45'),
('MSG-302', 'USR-006', 'Nitin', 'TRAVELER', 'USR-003', 'Arjun Nair', 'Swiss Alps Ski Passes & Equipment Rental', 'Hi Arjun, does the Bachalpsee Chalet booking include daily Grindelwald ski lift passes, or do we buy them on the spot?', 'LST-114', 'REPLIED', 'Hello Nitin! Yes, Grindelwald First 3-day ski lift passes and heated boot lockers are fully bundled in this package.', '2026-10-08 09:15');

-- ---------------------------------------------------------------------
-- 6. SEED DATA: system_settings
-- ---------------------------------------------------------------------
INSERT INTO `system_settings` (`id`, `platform_name`, `currency_symbol`, `currency_code`, `default_tax_rate`, `maintenance_mode`, `contact_email`, `support_phone`, `allow_agent_registration`, `max_bookings_per_user`, `terms_and_conditions`) VALUES
(1, 'SHIV TRAVELS - Luxury & Global Travel', '₹', 'INR', 5.00, FALSE, 'admin@shivtravels.com', '1800-123-8692', TRUE, 20, 'Bookings can be cancelled up to 48 hours prior to journey. Instant refund applies for premium members. Simulated payment transactions for demonstration.');

-- ---------------------------------------------------------------------
-- 7. SEED DATA: vouchers
-- ---------------------------------------------------------------------
INSERT INTO `vouchers` (`id`, `code`, `discount_type`, `discount_value`, `min_spend`, `usage_count`, `max_usage`, `expiry_date`, `is_active`, `campaign_note`) VALUES
('VCH-001', 'NITIN2026', 'FLAT', 500.00, 1000.00, 2, 100, '2026-12-31', TRUE, 'Special Welcome Voucher by Administrator Nitin Chaudhary'),
('VCH-002', 'SHIV20', 'PERCENT', 20.00, 2000.00, 5, 50, '2026-12-31', TRUE, 'Festive 20% Discount across Flights, Stays & Tours'),
('VCH-003', 'EXPLORE1000', 'FLAT', 1000.00, 5000.00, 1, 25, '2026-12-31', TRUE, 'Flat ₹1,000 Off on Luxury Destinations'),
('VCH-004', 'SHIV35', 'PERCENT', 35.00, 15000.00, 0, 100, '2026-11-30', TRUE, 'Luxury Packages Mega Savings 35% OFF');

-- =====================================================================
-- SECTION 3: DATABASE INTEGRITY & AUDIT VERIFICATION
-- =====================================================================
-- Run these queries in MySQL Workbench or mysql CLI to verify table linkage:

-- Check table row counts
SELECT 'users' AS table_name, COUNT(*) AS total_rows FROM users
UNION ALL
SELECT 'travel_listings', COUNT(*) FROM travel_listings
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'itineraries', COUNT(*) FROM itineraries
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'system_settings', COUNT(*) FROM system_settings
UNION ALL
SELECT 'vouchers', COUNT(*) FROM vouchers;

-- Relational Verification: Join Bookings with Traveler and Listing
SELECT 
    b.id AS booking_id,
    u.name AS traveler_name,
    u.email AS traveler_email,
    l.title AS package_name,
    l.type AS package_type,
    b.travel_date,
    b.total_price,
    b.status AS booking_status
FROM bookings b
INNER JOIN users u ON b.traveler_id = u.id
INNER JOIN travel_listings l ON b.listing_id = l.id
ORDER BY b.id ASC;

-- Relational Verification: Join Travel Listings with Travel Agents
SELECT 
    l.id AS listing_id,
    l.title,
    l.type,
    l.price,
    l.status,
    u.name AS agent_name,
    u.email AS agent_email
FROM travel_listings l
INNER JOIN users u ON l.agent_id = u.id
ORDER BY l.id ASC;
