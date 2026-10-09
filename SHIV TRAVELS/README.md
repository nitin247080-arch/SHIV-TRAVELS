# ✈️ SHIV TRAVELS - Online Travel Booking Platform
**B.Tech Computer Science & Engineering | Semester 3 Object Oriented Programming Project**  
*Project Topic #32: Online Travel Booking Platform*

---

## 📌 Project Overview
**SHIV TRAVELS** is a **comprehensive Java-based Online Travel Booking Platform** built with **pure Java 17** (Standard Edition). It enables users to browse and book flights, hotels, and rental cars, while providing personalized travel itineraries. The platform features strict role-based access control with specialized dashboards for **Administrators**, **Travel Agents**, and **Travelers**.

> **Note on Architecture:** The platform features **Dual-Mode Persistence**:
> 1. **MySQL 8.0 Relational Database Integration**: Comprehensive schema with full Foreign Keys, InnoDB engine, and ACID compliance across Users, Listings, Bookings, Itineraries, Messages, and System Settings. Full setup guide & ER diagram: [database/README_DATABASE.md](database/README_DATABASE.md).
> 2. **Zero-Failure In-Memory DataStore Fallback**: If MySQL credentials are not configured or the service is offline during evaluation, SHIV TRAVELS automatically runs in high-performance memory mode without crashing.

### 🌟 Key Highlights
- **Full MySQL 8.0 Integration**: Includes `setup_database.sql`, `schema.sql`, `seed_data.sql`, and `mysql-connector-j.jar` with automated connection management via `db.properties`.
- **Zero External Framework Overhead**: Pure Java 17 Standard Edition using standard `com.sun.net.httpserver.HttpServer`. No heavy Tomcat, Spring, or Maven bloat required.
- **Dual Interface Modes**:
  1. **Modern Responsive Web Application** (`http://localhost:8181`) with sleek travel UI, live search, role switcher, modals, and printable boarding passes / booking receipts.
  2. **Interactive Console CLI Mode** for direct terminal demonstration and oral viva evaluation.
- **Simulated Payment Gateways**: UPI (GPay/PhonePe), Credit/Debit Card, and Net Banking are simulated for safe demonstration and testing.
- **Strict Decoupling of Statuses**:
  - **Listing Status**: `PENDING`, `APPROVED`, `REJECTED`
  - **Booking Status**: `PENDING`, `CONFIRMED`, `CANCELLED`
- **Full RESTful Architecture**: Clean JSON-based REST APIs backing every user action.

---

## 👥 User Roles & Dashboard Features

### 👑 1. Administrator Dashboard
- **Booking Statistics**:
  - Displays comprehensive booking metrics right on the dashboard:
    - **Total Bookings**: Complete count of all reservations placed on the platform.
    - **Confirmed Bookings**: Active and paid reservations.
    - **Pending Bookings**: Bookings awaiting final processing.
    - **Cancelled Bookings**: Cancelled bookings with refund tracking.
  - Interactive status filter pills (`All`, `Confirmed`, `Pending`, `Cancelled`) with reverse-chronological ledger (most recent bookings appear at the top).
- **Pending Approvals Section**:
  - Dedicated, clearly visible **Pending Approvals** section on the Admin Dashboard showing all travel listings waiting for Admin review.
  - Displays listing thumbnail, title, service category, location, price, and submitting Travel Agent.
  - Allows the Admin to directly **Approve** (publish to travelers) or **Reject** pending listings with one click.
  - "Approve All Pending" batch action for high efficiency.
- **User Management**:
  - View all registered users (Admins, Travel Agents, Travelers).
  - Add new users, edit role permissions, deactivate or remove accounts.
- **System Settings Configuration**:
  - Configure platform name, currency symbol (`₹`), GST / tax rate (%), contact email, helpline number, maximum bookings per user, and maintenance mode.
  - **Confirmation Message**: Clearly displays **"System settings updated successfully."** upon saving changes via both an in-page banner and a notification toast.
- **Promo & Voucher Management**:
  - Generate discount vouchers (percentage or flat amount) with expiry dates and usage limits.

---

### 💼 2. Travel Agent Dashboard
- **Manage Listings**:
  - Submit new packages for Flights ✈️, Hotels 🏨, and Car Rentals 🚗.
  - Set destination imagery, custom pricing, available inventory (seats/rooms/vehicles), and amenities.
  - Track listing review status: `PENDING`, `APPROVED`, or `REJECTED`.
  - Approved listings immediately appear in the Traveler booking catalog.
- **User Interaction & Communications**:
  - Dedicated inbox to receive queries, custom itinerary requests, and feedback from travelers.
  - Direct reply mechanism to resolve customer inquiries.
- **Booking Tracker**:
  - Real-time tracker displaying all travelers who booked listings managed by the agent.

---

### 🌍 3. Traveler Portal
- **Search & Bookings**:
  - **Flights**: Search origin, destination, travel dates, passenger counts, and book airline tickets.
  - **Hotels**: Search destinations, select check-in / check-out dates, guest counts, and room types.
  - **Car Rentals**:
    - **Pickup Location** field for rental car bookings.
    - **Pickup Date** field.
    - **Return Date** field.
    - **Vehicle Type Selection**: Travelers can select their preferred vehicle type (e.g., *SUV / 4x4 (Mahindra Thar, Fortuner)*, *Luxury Sedan*, *Convertible / Open-Top*, *Supercar*, *Executive Sedan*, *Compact / EV*).
- **Simulated Payment Checkout & Receipts**:
  - Clear simulation of UPI, Credit/Debit Card, and Net Banking payment options.
  - Transparent fare calculation with GST tax breakdown.
  - Instant digital voucher / ticket receipt with "Print Ticket" functionality.
- **Traveler — My Bookings**:
  - Displays all user reservations categorized clearly by **Booking Status**:
    - **Confirmed** bookings (`✅ CONFIRMED`)
    - **Pending** bookings (`⏳ PENDING`)
    - **Cancelled** bookings (`❌ CANCELLED`)
  - Status filter buttons (`All`, `Confirmed`, `Pending`, `Cancelled`) with live counts.
  - Option to cancel eligible bookings and view printable digital tickets.
- **Travel Itineraries**:
  - Create and manage day-by-day travel schedules, track estimated budgets, and organize multi-city trips.
- **24/7 Traveler Help & Support**:
  - Dedicated toll-free phone and WhatsApp helpline buttons for rapid assistance.
  - Multi-language switcher supporting English, Hindi, Bengali, Marathi, Gujarati, and Spanish.

---

## 🏗️ Project Architecture & OOP Principles

```
online-travel-booking/
├── src/
│   └── com/travelbooking/
│       ├── Main.java                 # Entry point: Initializes HTTP server on port 8181
│       ├── ConsoleApp.java           # Terminal CLI runner for viva demonstration
│       ├── models/
│       │   ├── User.java             # User entity (Encapsulation, Role types)
│       │   ├── ListingType.java      # Enum: FLIGHT, HOTEL, CAR_RENTAL
│       │   ├── ListingStatus.java    # Enum: PENDING, APPROVED, REJECTED (Listing status)
│       │   ├── BookingStatus.java    # Enum: PENDING, CONFIRMED, CANCELLED (Booking status)
│       │   ├── TravelListing.java    # Polymorphic Travel Package model
│       │   ├── Booking.java          # Reservation & Transaction model (Pickup location & vehicle type)
│       │   ├── Itinerary.java        # Trip schedule and budget model
│       │   ├── Message.java          # Interaction and feedback model
│       │   └── SystemSettings.java   # Platform configuration entity
│       ├── storage/
│       │   └── DataStore.java        # Singleton pattern in-memory repository with thread safety
│       ├── handlers/
│       │   ├── StaticFileHandler.java# HTTP asset server (HTML, CSS, JS, Images)
│       │   └── ApiHandler.java       # Full REST API controller
│       └── utils/
│           └── JsonUtil.java         # Dependency-free JSON parser and serializer
├── web/
├── index.html                    # Single Page Application (SPA) UI
│   ├── css/
│   │   └── style.css                 # Modern responsive styling & printable voucher
│   └── js/
│       └── app.js                    # Reactive frontend controller & API client
├── assets/
│   └── images/                       # Destination images
├── run.bat                           # 1-Click Windows Batch Runner
├── run.ps1                           # PowerShell Launch Script
├── run-console.bat                   # 1-Click Console Terminal Runner
└── README.md                         # Project Report & Documentation
```

### OOP Concepts Demonstrated:
1. **Encapsulation**: All fields in `User`, `TravelListing`, `Booking`, etc., are private with getters, setters, and validation methods.
2. **Decoupled Enums & Type Safety**:
   - `ListingStatus` (`PENDING`, `APPROVED`, `REJECTED`) strictly governs travel listing moderation.
   - `BookingStatus` (`PENDING`, `CONFIRMED`, `CANCELLED`) strictly manages passenger reservation lifecycles.
   - `ListingType` (`FLIGHT`, `HOTEL`, `CAR_RENTAL`) differentiates services.
3. **Singleton Pattern**: `DataStore.getInstance()` provides a synchronized, thread-safe in-memory data store.
4. **Separation of Concerns (MVC)**:
   - **Model**: `models/*.java`
   - **View**: `web/index.html` + `web/css/style.css`
   - **Controller / Service**: `handlers/ApiHandler.java` + `storage/DataStore.java`
5. **Concurrency & Thread Safety**: Uses `ConcurrentHashMap`, `AtomicInteger`, and synchronized blocks to handle simultaneous user actions without race conditions.

---

## 🚀 How to Run the Project

### Prerequisites:
- Java SE Development Kit (**JDK 17** or higher).
- Windows 10/11.

### Method 1: Web Application (Recommended for Demo)
1. Double-click **`run.bat`** (or execute `.\run.ps1` in PowerShell).
2. The script compiles the Java sources into the `bin/` folder.
3. The server starts on **`http://localhost:8181`** and opens your default browser automatically.

### Method 2: Console CLI Mode (For Viva / Terminal Evaluation)
1. Double-click **`run-console.bat`**.
2. An interactive text menu will guide you through Admin, Travel Agent, and Traveler workflows directly from the Command Prompt.

---

## 🎓 Viva Questions & Answers (For Practical Examination)

**Q1: Why did you use `com.sun.net.httpserver.HttpServer` instead of Spring Boot or external servlet containers?**  
> *Answer:* Standard Java's built-in `HttpServer` allows the project to run on any computer with pure JDK 17 installed with zero external dependencies, zero classpath errors, and an instant 1-second startup time. It demonstrates deep understanding of socket networking, HTTP request/response lifecycles, and multi-threading without relying on third-party black-box libraries.

**Q2: How are Listing Status and Booking Status kept separate?**  
> *Answer:* They represent two completely independent lifecycles governed by two separate enums:
> - `ListingStatus` (`PENDING`, `APPROVED`, `REJECTED`) controls whether a travel listing submitted by an agent is published and visible for booking.
> - `BookingStatus` (`PENDING`, `CONFIRMED`, `CANCELLED`) represents a passenger's reservation transaction state.

**Q3: How does the Admin approval workflow work?**  
> *Answer:* When a Travel Agent submits a listing via `POST /api/listings`, its initial state is set to `ListingStatus.PENDING`. It is displayed in the dedicated **Pending Approvals** section on the Admin Dashboard. The Admin can inspect details and click **Approve** or **Reject** (`PUT /api/listings/status`). Only approved listings are shown in the Traveler catalog.

**Q4: How are payments handled in the project?**  
> *Answer:* UPI, Credit/Debit Card, and Net Banking options are simulated payment methods designed for academic demonstration. The system generates realistic transaction IDs and ticket vouchers without requiring live merchant banking APIs.

**Q5: How are Car Rental bookings customized?**  
> *Answer:* When booking a car rental, the platform dynamically captures the Traveler's **Pickup Location**, **Pickup Date**, **Return Date**, and selected **Vehicle Type** (e.g., SUV / 4x4, Sedan, Convertible), storing them in the `Booking` record and printing them on the boarding voucher.
