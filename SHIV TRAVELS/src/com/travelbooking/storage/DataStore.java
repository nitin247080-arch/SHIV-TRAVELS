package com.travelbooking.storage;

import com.travelbooking.models.*;
import com.travelbooking.database.DBConnection;
import com.travelbooking.database.DBConfig;
import com.travelbooking.database.DatabaseManager;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

public class DataStore {
    private static DataStore instance;

    private final Map<String, User> users = new ConcurrentHashMap<>();
    private final Map<String, TravelListing> listings = new ConcurrentHashMap<>();
    private final Map<String, Booking> bookings = new ConcurrentHashMap<>();
    private final Map<String, Itinerary> itineraries = new ConcurrentHashMap<>();
    private final Map<String, Message> messages = new ConcurrentHashMap<>();
    private SystemSettings systemSettings = new SystemSettings();

    private final AtomicInteger userSeq = new AtomicInteger(100);
    private final AtomicInteger listingSeq = new AtomicInteger(500);
    private final AtomicInteger bookingSeq = new AtomicInteger(1004);
    private final AtomicInteger itinerarySeq = new AtomicInteger(205);
    private final AtomicInteger messageSeq = new AtomicInteger(305);

    private DataStore() {
        seedInitialData();
        initDatabaseSync();
    }

    private void initDatabaseSync() {
        try {
            if (DBConnection.isAvailable() && DBConfig.isAutoSync()) {
                DatabaseManager db = DatabaseManager.getInstance();
                List<User> dbUsers = db.loadAllUsers();
                if (dbUsers != null && !dbUsers.isEmpty()) {
                    System.out.println("[DataStore] Loading persistent records from MySQL database...");
                    users.clear();
                    for (User u : dbUsers) users.put(u.getId(), u);

                    List<TravelListing> dbListings = db.loadAllListings();
                    if (dbListings != null && !dbListings.isEmpty()) {
                        listings.clear();
                        for (TravelListing l : dbListings) listings.put(l.getId(), l);
                    }

                    List<Booking> dbBookings = db.loadAllBookings();
                    if (dbBookings != null && !dbBookings.isEmpty()) {
                        bookings.clear();
                        for (Booking b : dbBookings) bookings.put(b.getId(), b);
                    }

                    List<Itinerary> dbItins = db.loadAllItineraries();
                    if (dbItins != null && !dbItins.isEmpty()) {
                        itineraries.clear();
                        for (Itinerary it : dbItins) itineraries.put(it.getId(), it);
                    }

                    List<Message> dbMsgs = db.loadAllMessages();
                    if (dbMsgs != null && !dbMsgs.isEmpty()) {
                        messages.clear();
                        for (Message m : dbMsgs) messages.put(m.getId(), m);
                    }

                    SystemSettings s = db.loadSystemSettings();
                    if (s != null) this.systemSettings = s;

                    System.out.println("[DataStore] Synchronization successful: " + users.size() + " users, "
                            + listings.size() + " listings, " + bookings.size() + " bookings loaded from MySQL.");
                } else {
                    // Seed initial data into MySQL if DB is empty
                    db.syncMemoryToDatabase(this);
                }
            } else {
                System.out.println("[DataStore] Running with In-Memory storage engine (MySQL offline or unconfigured).");
            }
        } catch (Throwable t) {
            System.err.println("[DataStore] Note on DB initialization: " + t.getMessage());
        }
    }

    public static synchronized DataStore getInstance() {
        if (instance == null) {
            instance = new DataStore();
        }
        return instance;
    }

    // --- Users ---
    public List<User> getAllUsers() {
        return new ArrayList<>(users.values());
    }

    public User getUserById(String id) {
        return users.get(id);
    }

    public User getUserByEmail(String email) {
        if (email == null) return null;
        for (User u : users.values()) {
            if (u.getEmail().equalsIgnoreCase(email.trim())) {
                return u;
            }
        }
        return null;
    }

    public synchronized User addUser(String name, String email, String role, String phone) {
        return addUser(name, email, role, phone, "pass123", 0, "");
    }

    public synchronized User addUser(String name, String email, String role, String phone, String password, int loyaltyPoints, String features) {
        String id = "USR-" + userSeq.incrementAndGet();
        User u = new User(id, name, email, role, phone, "ACTIVE", password, loyaltyPoints, features);
        users.put(id, u);
        DatabaseManager.getInstance().asyncSaveUser(u);
        return u;
    }

    public synchronized boolean updateUser(String id, String name, String email, String role, String phone, String status) {
        return updateUser(id, name, email, role, phone, status, null, null, null);
    }

    public synchronized boolean updateUser(String id, String name, String email, String role, String phone, String status, String password, Integer loyaltyPoints, String features) {
        User u = users.get(id);
        if (u == null) return false;
        if (name != null && !name.isBlank()) u.setName(name);
        if (email != null && !email.isBlank()) u.setEmail(email);
        if (role != null && !role.isBlank()) u.setRole(role);
        if (phone != null) u.setPhone(phone);
        if (status != null && !status.isBlank()) u.setStatus(status);
        if (password != null && !password.isBlank()) u.setPassword(password);
        if (loyaltyPoints != null) u.setLoyaltyPoints(loyaltyPoints);
        if (features != null && !features.isBlank()) u.setFeatures(features);
        DatabaseManager.getInstance().asyncSaveUser(u);
        return true;
    }

    public synchronized boolean deleteUser(String id) {
        boolean removed = users.remove(id) != null;
        if (removed) DatabaseManager.getInstance().asyncDeleteUser(id);
        return removed;
    }

    // --- Listings ---
    public List<TravelListing> getAllListings() {
        return new ArrayList<>(listings.values());
    }

    public List<TravelListing> getApprovedListings() {
        return listings.values().stream()
                .filter(l -> l.getStatus() == ListingStatus.APPROVED)
                .collect(Collectors.toList());
    }

    public TravelListing getListingById(String id) {
        return listings.get(id);
    }

    public synchronized TravelListing addListing(TravelListing listing) {
        if (listing.getId() == null || listing.getId().isBlank()) {
            listing.setId("LST-" + listingSeq.incrementAndGet());
        }
        listings.put(listing.getId(), listing);
        DatabaseManager.getInstance().asyncSaveListing(listing);
        return listing;
    }

    public synchronized boolean updateListingStatus(String id, ListingStatus newStatus) {
        TravelListing l = listings.get(id);
        if (l == null) return false;
        l.setStatus(newStatus);
        DatabaseManager.getInstance().asyncUpdateListingStatus(id, newStatus);
        return true;
    }

    public synchronized boolean deleteListing(String id) {
        boolean removed = listings.remove(id) != null;
        if (removed) DatabaseManager.getInstance().asyncDeleteListing(id);
        return removed;
    }

    // --- Bookings ---
    public List<Booking> getAllBookings() {
        return new ArrayList<>(bookings.values());
    }

    public List<Booking> getBookingsByTraveler(String travelerId) {
        return bookings.values().stream()
                .filter(b -> b.getTravelerId().equals(travelerId))
                .collect(Collectors.toList());
    }

    public synchronized Booking createBooking(String travelerId, String travelerName, String travelerEmail,
                                              String travelerPhone, String listingId, String travelDate,
                                              String returnDate, int units, String specialRequests,
                                              String paymentMethod) {
        return createBooking(travelerId, travelerName, travelerEmail, travelerPhone, listingId,
                travelDate, returnDate, units, specialRequests, paymentMethod, "", "", BookingStatus.CONFIRMED);
    }

    public synchronized Booking createBooking(String travelerId, String travelerName, String travelerEmail,
                                              String travelerPhone, String listingId, String travelDate,
                                              String returnDate, int units, String specialRequests,
                                              String paymentMethod, String pickupLocation, String vehicleType,
                                              BookingStatus status) {
        TravelListing l = listings.get(listingId);
        boolean hasReturn = (l != null && l.getType() == ListingType.FLIGHT && returnDate != null && !returnDate.trim().isEmpty());
        return createBooking(travelerId, travelerName, travelerEmail, travelerPhone, listingId, travelDate,
                returnDate, units, specialRequests, paymentMethod, pickupLocation, vehicleType, status, hasReturn);
    }

    public synchronized Booking createBooking(String travelerId, String travelerName, String travelerEmail,
                                              String travelerPhone, String listingId, String travelDate,
                                              String returnDate, int units, String specialRequests,
                                              String paymentMethod, String pickupLocation, String vehicleType,
                                              BookingStatus status, boolean hasReturnTicket) {
        return createBooking(travelerId, travelerName, 0, travelerEmail, travelerPhone, listingId, travelDate,
                returnDate, units, specialRequests, paymentMethod, pickupLocation, vehicleType, status, hasReturnTicket);
    }

    public synchronized Booking createBooking(String travelerId, String travelerName, int travelerAge, String travelerEmail,
                                              String travelerPhone, String listingId, String travelDate,
                                              String returnDate, int units, String specialRequests,
                                              String paymentMethod, String pickupLocation, String vehicleType,
                                              BookingStatus status, boolean hasReturnTicket) {
        TravelListing l = listings.get(listingId);
        if (l == null) return null;

        String id;
        do {
            id = "BKG-" + bookingSeq.incrementAndGet();
        } while (bookings.containsKey(id));

        Booking b = new Booking(id, travelerId, travelerName, travelerAge, travelerEmail, travelerPhone,
                listingId, l.getTitle(), l.getType(), l.getLocation(), travelDate,
                returnDate, units, l.getPrice(), systemSettings.getDefaultTaxRate(),
                specialRequests, paymentMethod, pickupLocation, vehicleType,
                status != null ? status : BookingStatus.CONFIRMED, hasReturnTicket);
        bookings.put(id, b);
        DatabaseManager.getInstance().asyncSaveBooking(b);

        if (l.getAvailableUnits() > 0) {
            l.setAvailableUnits(Math.max(0, l.getAvailableUnits() - units));
            DatabaseManager.getInstance().asyncSaveListing(l);
        }
        return b;
    }

    public synchronized boolean cancelBooking(String bookingId) {
        Booking b = bookings.get(bookingId);
        if (b == null) return false;
        b.setStatus("CANCELLED");
        DatabaseManager.getInstance().asyncUpdateBookingStatus(bookingId, "CANCELLED");
        return true;
    }

    // --- Itineraries ---
    public List<Itinerary> getAllItineraries() {
        return new ArrayList<>(itineraries.values());
    }

    public List<Itinerary> getItinerariesByTraveler(String travelerId) {
        return itineraries.values().stream()
                .filter(it -> it.getTravelerId().equals(travelerId))
                .collect(Collectors.toList());
    }

    public synchronized Itinerary addItinerary(String travelerId, String travelerName, String tripTitle,
                                               String destination, String practicalStartDate, String practicalEndDate,
                                               double budget, double cost, String planDetails) {
        String id;
        do {
            id = "ITN-" + itinerarySeq.incrementAndGet();
        } while (itineraries.containsKey(id));
        Itinerary it = new Itinerary(id, travelerId, travelerName, tripTitle, destination,
                practicalStartDate, practicalEndDate, budget, cost, "PLANNED", planDetails);
        itineraries.put(id, it);
        DatabaseManager.getInstance().asyncSaveItinerary(it);
        return it;
    }

    public synchronized boolean deleteItinerary(String id) {
        boolean removed = itineraries.remove(id) != null;
        if (removed) DatabaseManager.getInstance().asyncDeleteItinerary(id);
        return removed;
    }

    // --- Messages ---
    public List<Message> getAllMessages() {
        return new ArrayList<>(messages.values());
    }

    public synchronized Message addMessage(String senderId, String senderName, String senderRole,
                                           String recipientId, String recipientName, String subject,
                                           String text, String listingRef) {
        String id;
        do {
            id = "MSG-" + messageSeq.incrementAndGet();
        } while (messages.containsKey(id));
        Message msg = new Message(id, senderId, senderName, senderRole, recipientId, recipientName, subject, text, listingRef);
        messages.put(id, msg);
        DatabaseManager.getInstance().asyncSaveMessage(msg);
        return msg;
    }

    public synchronized boolean markMessageReplied(String id) {
        Message msg = messages.get(id);
        if (msg == null) return false;
        msg.setStatus("REPLIED");
        DatabaseManager.getInstance().asyncSaveMessage(msg);
        return true;
    }

    // --- Settings ---
    public SystemSettings getSystemSettings() {
        return systemSettings;
    }

    public synchronized void updateSystemSettings(SystemSettings s) {
        this.systemSettings = s;
        DatabaseManager.getInstance().asyncSaveSystemSettings(s);
    }

    // --- Seed Initial Data ---
    private void seedInitialData() {
        // Users
        User admin = new User("USR-001", "Nitin Chaudhary (Platform Admin)", "admin@shivtravels.com", "ADMIN", "+91 98111 22334", "ACTIVE");
        User agent1 = new User("USR-002", "Priya Patel (Wanderlust Travels)", "priya@wandertravels.com", "AGENT", "+91 98222 33445", "ACTIVE");
        User agent2 = new User("USR-003", "Arjun Nair (Skyline Voyages)", "arjun@skylinevoyages.com", "AGENT", "+91 98333 44556", "ACTIVE");
        User traveler1 = new User("USR-004", "Rahul Verma", "rahul@gmail.com", "TRAVELER", "+91 98444 55667", "ACTIVE");
        User traveler2 = new User("USR-005", "Ananya Sen", "ananya@gmail.com", "TRAVELER", "+91 98555 66778", "ACTIVE");
        User traveler3 = new User("USR-006", "Nitin Kumar", "nitin@traveler.com", "TRAVELER", "+91 98666 77889", "ACTIVE");

        users.put(admin.getId(), admin);
        users.put(agent1.getId(), agent1);
        users.put(agent2.getId(), agent2);
        users.put(traveler1.getId(), traveler1);
        users.put(traveler2.getId(), traveler2);
        users.put(traveler3.getId(), traveler3);

        // --- 0. AYODHYA RAM MANDIR (New Featured Holy Destination!) ---
        TravelListing l21 = new TravelListing("LST-121", "Shree Ram Janmabhoomi Teerth Heritage Stay & VIP Darshan",
                ListingType.HOTEL, "Ayodhya, Uttar Pradesh, India", "", "Ayodhya, India",
                6499.0, 4.98, "/assets/images/ayodhya_ram_mandir.jpg", ListingStatus.APPROVED,
                "USR-002", "Priya Patel",
                "Divine spiritual retreat within walking distance of the sacred Shree Ram Janmabhoomi Mandir. Includes VIP Sugam Darshan coordination, evening Saryu Maha Aarti, and Satvik cuisine.",
                "VIP Sugam Darshan Pass Included, Walking Distance to Ram Mandir, Saryu Aarti Cruise, Pure Veg Satvik Dining, Free Temple Shuttle",
                25, true);

        TravelListing l22 = new TravelListing("LST-122", "Air India Express IX-114: Delhi (DEL) → Ayodhya Dham (AYJ)",
                ListingType.FLIGHT, "Ayodhya Dham, India", "New Delhi (DEL)", "Ayodhya Dham (AYJ)",
                3899.0, 4.88, "/assets/images/ayodhya_ram_mandir.jpg", ListingStatus.APPROVED,
                "USR-003", "Arjun Nair",
                "Direct morning flight connecting Delhi to Maharishi Valmiki International Airport Ayodhya Dham. Quick 1 hour 15 minutes journey with prasad allowance.",
                "Direct 1h 15m Flight, Boeing 737, Extra Baggage for Holy Prasad, Refreshment Included",
                50, true);

        TravelListing l23 = new TravelListing("LST-123", "Chauffeur-Driven AC Innova: Ayodhya-Varanasi-Prayagraj Teerth Cab",
                ListingType.CAR_RENTAL, "Ayodhya, Uttar Pradesh, India", "Ayodhya Airport (AYJ) / Dham Station", "Ayodhya, Kashi Varanasi, Prayagraj Sangam",
                3200.0, 4.90, "/assets/images/ayodhya_ram_mandir.jpg", ListingStatus.APPROVED,
                "USR-002", "Priya Patel",
                "Full-day AC vehicle with verified respectful driver guide for complete Ram Mandir, Hanuman Garhi, Kanak Bhavan, and Saryu Ghat holy pilgrimage tour.",
                "7-Seater AC Innova Crysta, Devotional Guide Driver, All Parking & Tolls Included, Mineral Water",
                16, true);

        // --- 1. Taj Mahal ---
        TravelListing l1 = new TravelListing("LST-101", "The Oberoi Amarvilas - Taj Mahal Heritage Suite",
                ListingType.HOTEL, "Agra, Uttar Pradesh, India", "", "Agra",
                18500.0, 4.95, "/assets/images/taj_mahal.webp", ListingStatus.APPROVED,
                "USR-002", "Priya Patel",
                "Luxury 5-star hotel offering uninterrupted, magical views of the Taj Mahal from every room, private balcony dining, and royal Mughal architecture.",
                "Taj Mahal Balcony View, Butler Service, Luxury Spa, Infinity Pool, Heritage Walk",
                12, true);

        TravelListing l2 = new TravelListing("LST-102", "IndiGo Express 6E-204: Delhi (DEL) → Agra (AGR)",
                ListingType.FLIGHT, "Agra, India", "New Delhi (DEL)", "Agra (AGR)",
                3499.0, 4.82, "/assets/images/taj_mahal.webp", ListingStatus.APPROVED,
                "USR-003", "Arjun Nair",
                "Fast, reliable morning flight connecting the national capital to the City of Taj. Includes express boarding and extra legroom seating options.",
                "Airbus A320neo, Non-stop 45 mins, 15kg Luggage, Complimentary Snack",
                45, true);

        // --- 2. Bali Rice Terraces ---
        TravelListing l3 = new TravelListing("LST-103", "Tegallalang Bali Rainforest Villa & Infinity Retreat",
                ListingType.HOTEL, "Ubud, Bali, Indonesia", "", "Bali, Indonesia",
                12800.0, 4.90, "/assets/images/bali_rice_terraces.jpg", ListingStatus.APPROVED,
                "USR-002", "Priya Patel",
                "Nestled among the world-famous emerald rice terraces of Tegallalang, featuring open-air bamboo suites, floating breakfasts, and authentic Balinese healing spa.",
                "Overlooking Rice Terraces, Private Plunge Pool, Floating Breakfast, Daily Morning Yoga",
                8, true);

        TravelListing l4 = new TravelListing("LST-104", "Garuda Indonesia GA-872: Mumbai (BOM) → Bali (DPS)",
                ListingType.FLIGHT, "Bali, Indonesia", "Mumbai (BOM)", "Bali Denpasar (DPS)",
                26500.0, 4.86, "/assets/images/bali_rice_terraces.jpg", ListingStatus.APPROVED,
                "USR-002", "Priya Patel",
                "Direct premium international flight connecting India's financial capital to the tropical paradise of Bali with world-class hospitality.",
                "Boeing 777-300ER, Multi-course Meal, 30kg Luggage, 4K Entertainment",
                28, false);

        // --- 3. Dubai Marina ---
        TravelListing l5 = new TravelListing("LST-105", "Dubai Marina Luxury Waterfront Suite & Sky Lounge",
                ListingType.HOTEL, "Dubai Marina, United Arab Emirates", "", "Dubai, UAE",
                24500.0, 4.94, "/assets/images/dubai_marina.webp", ListingStatus.APPROVED,
                "USR-003", "Arjun Nair",
                "Spectacular high-floor luxury suite overlooking the glittering Dubai Marina yachts, private rooftop sky pool, infinity bar, and direct marina promenade access.",
                "Panoramic Marina View, Rooftop Sky Pool, 24/7 Concierge, Private Jacuzzi, Valet",
                10, true);

        TravelListing l6 = new TravelListing("LST-106", "Dubai Marina Supercar Rental: Ferrari F8 / Mustang GT",
                ListingType.CAR_RENTAL, "Dubai, United Arab Emirates", "Dubai Marina / DXB Airport", "Dubai City & Palm Jumeirah",
                14500.0, 4.92, "/assets/images/dubai_marina.webp", ListingStatus.APPROVED,
                "USR-003", "Arjun Nair",
                "Experience the glamour of Dubai roads in a thrilling convertible sports car with door-to-door delivery and 24/7 roadside assistance.",
                "Automatic V8 Engine, Convertible Roof, Zero Security Deposit, GPS & Apple CarPlay",
                5, true);

        // --- 4. Goa Beach ---
        TravelListing l7 = new TravelListing("LST-107", "Taj Exotica Resort & Private Beachfront Villa",
                ListingType.HOTEL, "Benaulim, South Goa, India", "", "South Goa",
                15999.0, 4.88, "/assets/images/goa_beach.jpg", ListingStatus.APPROVED,
                "USR-002", "Priya Patel",
                "Sprawling Mediterranean-style 5-star haven spread across 56 acres overlooking the serene Arabian Sea with pristine white sandy private beach.",
                "Private Beach Access, Golf Course, Sunset Catamaran Cruise, Beachside Seafood Grill",
                15, true);

        TravelListing l8 = new TravelListing("LST-108", "Open-Top Mahindra Thar 4x4 Beach Cruiser",
                ListingType.CAR_RENTAL, "Goa, India", "Goa Dabolim / Mopa Airport", "All Goa Beaches & Waterfalls",
                2800.0, 4.78, "/assets/images/goa_beach.jpg", ListingStatus.APPROVED,
                "USR-002", "Priya Patel",
                "Cruise through Goa's scenic palm-lined coastal roads and serene backwaters in an iconic open-top 4x4 rugged convertible Thar.",
                "4x4 Automatic, Removable Hard-top, High-Bass Sound System, Unlimited Kilometers",
                14, false);

        // --- 5. Amber Fort & Jaipur ---
        TravelListing l9 = new TravelListing("LST-109", "Amber Fort Royal Heritage Haveli & Palace Stay",
                ListingType.HOTEL, "Amer, Jaipur, Rajasthan, India", "", "Jaipur, Rajasthan",
                13500.0, 4.93, "/assets/images/jaipur_amber_fort.jpg", ListingStatus.APPROVED,
                "USR-002", "Priya Patel",
                "Historic 250-year-old restored Rajput royal haveli with direct views of the Amber Fort, authentic royal courtyards, and puppet & folk dance evenings.",
                "Fort View Terrace, Royal Rajasthani Banquet, Vintage Car Welcome, Swimming Pool",
                9, true);

        TravelListing l10 = new TravelListing("LST-110", "Chauffeur-Driven Royal Toyota Crysta & Fort Tour Cab",
                ListingType.CAR_RENTAL, "Jaipur, Rajasthan, India", "Jaipur Airport / Railway Station", "Jaipur, Amber, Nahargarh, Hawa Mahal",
                3900.0, 4.81, "/assets/images/jaipur_amber_fort.jpg", ListingStatus.APPROVED,
                "USR-002", "Priya Patel",
                "Full-day luxury air-conditioned transport with an experienced courteous chauffeur and licensed local tour guide for Jaipur sight-seeing.",
                "7-Seater Luxury AC, English/Hindi Driver, All Tolls & Parking Covered, Mineral Water",
                18, false);

        TravelListing l11 = new TravelListing("LST-111", "Emirates EK-512: Delhi (DEL) → Dubai (DXB)",
                ListingType.FLIGHT, "Dubai, United Arab Emirates", "New Delhi (DEL)", "Dubai (DXB)",
                19800.0, 4.91, "/assets/images/dubai_marina.webp", ListingStatus.APPROVED,
                "USR-003", "Arjun Nair",
                "World's leading flagship carrier offering iconic Airbus A380 experience, multi-course international cuisine, and ICE entertainment system.",
                "Airbus A380, Free High-speed WiFi, 35kg Baggage, Direct 3h 40m",
                32, false);

        // --- 6. Swiss Alps ---
        TravelListing l14 = new TravelListing("LST-114", "Bachalpsee Alpine Panorama Chalet & Ski Resort",
                ListingType.HOTEL, "Grindelwald, Swiss Alps, Switzerland", "", "Switzerland",
                34500.0, 4.98, "/assets/images/swiss_alps.jpg", ListingStatus.APPROVED,
                "USR-003", "Arjun Nair",
                "Spectacular 5-star mountain chalet perched above Grindelwald facing alpine lakes and glaciated peaks. Features open fireplace, thermal outdoor infinity bath, and ski-in access.",
                "Glacier & Lake View, Thermal Spa, Fireplace Lounge, Heated Ski Gear Storage, Gourmet Fondue",
                6, true);

        TravelListing l15 = new TravelListing("LST-115", "SWISS International Air LX-147: Mumbai (BOM) → Zurich (ZRH)",
                ListingType.FLIGHT, "Zurich & Swiss Alps, Switzerland", "Mumbai (BOM)", "Zurich (ZRH)",
                48900.0, 4.92, "/assets/images/swiss_alps.jpg", ListingStatus.APPROVED,
                "USR-003", "Arjun Nair",
                "Fly directly to Switzerland in comfort with premium Swiss chocolates, artisanal wines, and complimentary ski luggage allowance.",
                "Boeing 777, Swiss Fine Dining, Free Ski Baggage, Lie-Flat Seats Available",
                22, true);

        // --- 7. Thailand Phi Phi Island ---
        TravelListing l16 = new TravelListing("LST-116", "Phi Phi Island Overwater Luxury Villa & Private Beach",
                ListingType.HOTEL, "Koh Phi Phi, Krabi, Thailand", "", "Thailand",
                16800.0, 4.91, "/assets/images/thailand_phiphi.jpg", ListingStatus.APPROVED,
                "USR-002", "Priya Patel",
                "Perched right on the crystal-clear emerald waters of the Andaman Sea surrounded by towering limestone karst cliffs. Includes glass-floor ocean bedroom and private sunset deck.",
                "Direct Ocean Access, Glass Floor Bedroom, Sunset Longtail Boat Ride, Daily Snorkeling Gear",
                10, true);

        TravelListing l17 = new TravelListing("LST-117", "Private Luxury Speedboat & Karst Lagoon Tour",
                ListingType.CAR_RENTAL, "Phuket / Krabi, Thailand", "Ao Nang Pier / Phuket Marina", "Phi Phi, Maya Bay & Bamboo Island",
                9500.0, 4.88, "/assets/images/thailand_phiphi.jpg", ListingStatus.APPROVED,
                "USR-002", "Priya Patel",
                "Charter your private twin-engine speedboat for exploring secluded lagoons, snorkeling with reef fish, and cruising iconic limestone formations at your own pace.",
                "Private Captain & Crew, Snorkeling Equipment, Fresh Fruits & Soft Drinks, National Park Passes",
                8, true);

        // --- 8. Jaipur Maota Lake ---
        TravelListing l18 = new TravelListing("LST-118", "Maota Lake Royal Palace View Luxury Suites",
                ListingType.HOTEL, "Amber Fort, Jaipur, Rajasthan, India", "", "Jaipur, Rajasthan",
                17200.0, 4.94, "/assets/images/jaipur_maota_lake.webp", ListingStatus.APPROVED,
                "USR-002", "Priya Patel",
                "Wake up to the breath-taking reflection of the grand Amber Fort shimmering in the calm waters of Maota Lake. Authentic Jharokha seating and Mewari royal hospitality.",
                "Direct Lake & Fort Reflection, Jharokha Balconies, Royal Sitar Dinners, Private Peacock Garden",
                11, true);

        // --- 9. Manali Snow Peaks ---
        TravelListing l19 = new TravelListing("LST-119", "Snow Peak Luxury Himalayan Chalet & Apple Orchard",
                ListingType.HOTEL, "Old Manali, Himachal Pradesh, India", "", "Manali, Himachal Pradesh",
                11500.0, 4.89, "/assets/images/manali_snow_peaks.jpg", ListingStatus.APPROVED,
                "USR-003", "Arjun Nair",
                "Cosy pine-wood luxury chalets nestled amidst snow-blanketed deodar forests and apple orchards with panoramic views of Pir Panjal snow peaks.",
                "Snow Peak Balcony, Traditional Bukhari Fireplace, Bonfire Evenings, Mountain Trout Dining",
                14, true);

        TravelListing l20 = new TravelListing("LST-120", "Snow Expedition Mahindra Thar 4x4 & Rohtang Pass Cab",
                ListingType.CAR_RENTAL, "Manali, Himachal Pradesh, India", "Manali Mall Road / Bhuntar Airport", "Rohtang Pass, Solang Valley, Atal Tunnel",
                3500.0, 4.84, "/assets/images/manali_snow_peaks.jpg", ListingStatus.APPROVED,
                "USR-003", "Arjun Nair",
                "Heavy-duty 4x4 vehicle equipped with all-terrain snow chains and an experienced Himalayan driver to conquer high-altitude mountain passes.",
                "4x4 Snow Tires & Chains, Heated Cabin, Rohtang Green Permit Included, Oxygen Kit",
                12, true);

        // PENDING Listings for Admin Approval Demo
        TravelListing l12 = new TravelListing("LST-112", "Eiffel Tower View Luxury Penthouse - Paris",
                ListingType.HOTEL, "Paris, France", "", "Paris, France",
                32000.0, 4.85, "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80", ListingStatus.PENDING,
                "USR-003", "Arjun Nair",
                "Elegant Haussmann-style Parisian apartment directly opposite the Champ de Mars with champagne balcony looking straight at the illuminated Eiffel Tower.",
                "Eiffel Tower View, Champagne on Arrival, Chef Breakfast, Metro 2 mins walk",
                4, false);

        TravelListing l13 = new TravelListing("LST-113", "Air France AF-225: Mumbai (BOM) → Paris (CDG)",
                ListingType.FLIGHT, "Paris, France", "Mumbai (BOM)", "Paris Charles de Gaulle (CDG)",
                44500.0, 4.79, "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80", ListingStatus.PENDING,
                "USR-003", "Arjun Nair",
                "Non-stop overnight flight to the City of Light with French fine wines and cheeses included.",
                "Boeing 787 Dreamliner, 2x23kg Baggage, USB-C Fast Charging, Complimentary Champagne",
                20, false);

        listings.put(l21.getId(), l21);
        listings.put(l22.getId(), l22);
        listings.put(l23.getId(), l23);
        listings.put(l1.getId(), l1);
        listings.put(l2.getId(), l2);
        listings.put(l3.getId(), l3);
        listings.put(l4.getId(), l4);
        listings.put(l5.getId(), l5);
        listings.put(l6.getId(), l6);
        listings.put(l7.getId(), l7);
        listings.put(l8.getId(), l8);
        listings.put(l9.getId(), l9);
        listings.put(l10.getId(), l10);
        listings.put(l11.getId(), l11);
        listings.put(l14.getId(), l14);
        listings.put(l15.getId(), l15);
        listings.put(l16.getId(), l16);
        listings.put(l17.getId(), l17);
        listings.put(l18.getId(), l18);
        listings.put(l19.getId(), l19);
        listings.put(l20.getId(), l20);
        listings.put(l12.getId(), l12);
        listings.put(l13.getId(), l13);

        // Sample Bookings
        Booking b1 = new Booking("BKG-1001", "USR-004", "Rahul Verma", 28, "rahul@gmail.com",
                "+91 98444 55667", "LST-121", "Shree Ram Janmabhoomi Teerth Heritage Stay & VIP Darshan",
                ListingType.HOTEL, "Ayodhya, India", "2026-10-24", "2026-10-27", 2,
                6499.0, 5.0, "VIP Aarti passes for evening Saryu Aarti", "UPI", "", "", BookingStatus.CONFIRMED, false);
        b1.setStatus("CONFIRMED");

        Booking b2 = new Booking("BKG-1002", "USR-005", "Ananya Sen", 26, "ananya@gmail.com",
                "+91 98555 66778", "LST-105", "Dubai Marina Luxury Waterfront Suite & Sky Lounge",
                ListingType.HOTEL, "Dubai Marina, UAE", "2026-11-05", "2026-11-10", 1,
                24500.0, 5.0, "High floor requested with late checkout", "CREDIT_CARD", "", "", BookingStatus.CONFIRMED, false);
        b2.setStatus("CONFIRMED");

        Booking b3 = new Booking("BKG-1003", "USR-006", "Nitin Kumar", 24, "nitin@traveler.com",
                "+91 98666 77889", "LST-119", "Snow Peak Luxury Himalayan Chalet & Apple Orchard",
                ListingType.HOTEL, "Manali, Himachal Pradesh", "2026-11-20", "2026-11-25", 2,
                11500.0, 5.0, "Snow facing upper deck chalet requested", "UPI", "", "", BookingStatus.CONFIRMED, false);
        b3.setStatus("CONFIRMED");

        Booking b4 = new Booking("BKG-1004", "USR-004", "Rahul Verma", 28, "rahul@gmail.com",
                "+91 98444 55667", "LST-116", "Phi Phi Island Overwater Luxury Villa & Private Beach",
                ListingType.HOTEL, "Krabi / Phuket, Thailand", "2026-12-10", "2026-12-15", 1,
                16800.0, 5.0, "Sunset catamaran boat pickup included", "UPI", "", "", BookingStatus.CONFIRMED, false);
        b4.setStatus("CONFIRMED");

        // Seed PENDING booking for Car Rental
        Booking b5 = new Booking("BKG-1005", "USR-006", "Nitin Kumar", 24, "nitin@traveler.com",
                "+91 98666 77889", "LST-120", "Snow Expedition Mahindra Thar 4x4 & Rohtang Pass Cab",
                ListingType.CAR_RENTAL, "Manali, Himachal Pradesh", "2026-11-22", "2026-11-25", 3,
                3500.0, 5.0, "Snow chains and experienced Himalayan driver", "UPI",
                "Manali Mall Road & Hotel Pickup", "4x4 Heavy SUV", BookingStatus.PENDING, false);

        // Seed CANCELLED booking
        Booking b6 = new Booking("BKG-1006", "USR-005", "Ananya Sen", 26, "ananya@gmail.com",
                "+91 98555 66778", "LST-111", "Emirates EK-512: Delhi (DEL) → Dubai (DXB)",
                ListingType.FLIGHT, "Dubai, United Arab Emirates", "2026-11-04", "2026-11-12", 1,
                19800.0, 5.0, "Trip rescheduled by traveler", "CREDIT_CARD", "", "", BookingStatus.CANCELLED, true);

        bookings.put(b1.getId(), b1);
        bookings.put(b2.getId(), b2);
        bookings.put(b3.getId(), b3);
        bookings.put(b4.getId(), b4);
        bookings.put(b5.getId(), b5);
        bookings.put(b6.getId(), b6);

        // Sample Itineraries
        Itinerary it0 = new Itinerary("ITN-200", "USR-004", "Rahul Verma",
                "Divine Ayodhya Dham & Kashi Vishwanath Yatra",
                "Ayodhya & Varanasi, India", "2026-10-24", "2026-10-28",
                25000.0, 21800.0, "CONFIRMED",
                "Day 1: Arrival at Ayodhya Dham & check-in | Day 2: Morning VIP Darshan at Shree Ram Janmabhoomi Mandir & evening Saryu Maha Aarti | Day 3: Drive to Kashi Varanasi via AC Cab & Ganga Aarti | Day 4: Kashi Vishwanath Darshan & departure.");

        Itinerary it1 = new Itinerary("ITN-201", "USR-004", "Rahul Verma",
                "Golden Triangle Heritage Tour (Agra & Jaipur)",
                "Agra & Jaipur, India", "2026-10-20", "2026-10-26",
                60000.0, 53200.0, "CONFIRMED",
                "Day 1: Arrival & Oberoi Amarvilas check-in | Day 2: Taj Mahal sunrise view & Agra Fort | Day 3: Drive to Jaipur via Fatehpur Sikri | Day 4: Amber Fort & Maota Lake view | Day 5: Departure.");

        Itinerary it2 = new Itinerary("ITN-202", "USR-006", "Nitin Kumar",
                "Himalayan Snow Adventure & Rohtang Pass Expedition",
                "Manali & Rohtang, India", "2026-11-20", "2026-11-26",
                45000.0, 38500.0, "CONFIRMED",
                "Day 1: Arrival at Old Manali Chalet & Bonfire | Day 2: 4x4 Thar drive through Atal Tunnel & Sissu Waterfall | Day 3: Snow activities at Solang & Rohtang | Day 4: Apple orchard walk & departure.");

        itineraries.put(it0.getId(), it0);
        itineraries.put(it1.getId(), it1);
        itineraries.put(it2.getId(), it2);

        // Sample Messages
        Message m0 = new Message("MSG-300", "USR-004", "Rahul Verma", "TRAVELER",
                "USR-002", "Priya Patel", "Ayodhya Ram Mandir Aarti Passes & Dress Code",
                "Namaste Priya ji! Does the Ayodhya package include morning Shringar Aarti or evening Sandhya Aarti passes for family?",
                "LST-121");

        Message m1 = new Message("MSG-301", "USR-004", "Rahul Verma", "TRAVELER",
                "USR-002", "Priya Patel", "Taj Mahal Sunrise Timings & Photographer",
                "Hi Priya! Is it possible to arrange a verified guide and professional photographer for the early morning 6 AM Taj Mahal sunrise shoot?",
                "LST-101");

        Message m2 = new Message("MSG-302", "USR-002", "Priya Patel", "AGENT",
                "USR-004", "Rahul Verma", "Re: Ayodhya Ram Mandir Aarti Passes & Dress Code",
                "Namaste Rahul ji! Yes, we pre-book official Sugam Darshan and Saryu Aarti slots with private temple corridor access. Traditional decent clothing is requested.",
                "LST-121");
        m2.setStatus("REPLIED");

        Message m3 = new Message("MSG-303", "USR-006", "Nitin Kumar", "TRAVELER",
                "USR-003", "Arjun Nair", "Swiss Alps Ski Passes & Equipment Rental",
                "Hi Arjun, does the Bachalpsee Chalet booking include daily Grindelwald ski lift passes, or do we buy them on the spot?",
                "LST-114");

        messages.put(m0.getId(), m0);
        messages.put(m1.getId(), m1);
        messages.put(m2.getId(), m2);
        messages.put(m3.getId(), m3);
    }
}
