package com.travelbooking.database;

import com.travelbooking.models.*;
import com.travelbooking.storage.DataStore;

import java.sql.*;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * DatabaseManager handles all CRUD and relational synchronization operations
 * between SHIV TRAVELS and the MySQL relational database.
 */
public class DatabaseManager {
    private static DatabaseManager instance;
    private final ExecutorService asyncPool = Executors.newFixedThreadPool(2);

    private DatabaseManager() {}

    public static synchronized DatabaseManager getInstance() {
        if (instance == null) {
            instance = new DatabaseManager();
        }
        return instance;
    }

    // =========================================================================
    // 1. DATA LOADING (MySQL -> SHIV TRAVELS DataStore)
    // =========================================================================

    public List<User> loadAllUsers() {
        List<User> list = new ArrayList<>();
        String sql = "SELECT id, name, email, role, phone, status, password, loyalty_points, features FROM users ORDER BY created_at ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                String id = rs.getString("id");
                String name = rs.getString("name");
                String email = rs.getString("email");
                String role = rs.getString("role");
                String phone = rs.getString("phone");
                String status = rs.getString("status");
                String password = rs.getString("password");
                int loyaltyPoints = rs.getInt("loyalty_points");
                String features = rs.getString("features");

                list.add(new User(id, name, email, role, phone, status, password, loyaltyPoints, features));
            }
        } catch (SQLException e) {
            System.err.println("[DatabaseManager] Error loading users: " + e.getMessage());
        }
        return list;
    }

    public List<TravelListing> loadAllListings() {
        List<TravelListing> list = new ArrayList<>();
        String sql = "SELECT id, title, type, location, origin, destination, price, rating, image_url, status, " +
                "agent_id, agent_name, description, features, available_units, featured FROM travel_listings ORDER BY created_at ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                String id = rs.getString("id");
                String title = rs.getString("title");
                String typeStr = rs.getString("type");
                ListingType type = ListingType.valueOf(typeStr);
                String location = rs.getString("location");
                String origin = rs.getString("origin");
                String destination = rs.getString("destination");
                double price = rs.getDouble("price");
                double rating = rs.getDouble("rating");
                String imageUrl = rs.getString("image_url");
                String statusStr = rs.getString("status");
                ListingStatus status = ListingStatus.valueOf(statusStr);
                String agentId = rs.getString("agent_id");
                String agentName = rs.getString("agent_name");
                String description = rs.getString("description");
                String features = rs.getString("features");
                int units = rs.getInt("available_units");
                boolean featured = rs.getBoolean("featured");

                TravelListing item = new TravelListing(id, title, type, location, origin, destination,
                        price, rating, imageUrl, status, agentId, agentName, description, features, units, featured);
                list.add(item);
            }
        } catch (SQLException e) {
            System.err.println("[DatabaseManager] Error loading listings: " + e.getMessage());
        }
        return list;
    }

    public List<Booking> loadAllBookings() {
        List<Booking> list = new ArrayList<>();
        String sql = "SELECT id, traveler_id, traveler_name, traveler_email, traveler_phone, listing_id, " +
                "listing_title, listing_type, destination, booking_date, travel_date, return_date, " +
                "pickup_location, vehicle_type, units, price_per_unit, tax_amount, total_price, " +
                "status, special_requests, payment_method, payment_status FROM bookings ORDER BY created_at ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                String id = rs.getString("id");
                String travelerId = rs.getString("traveler_id");
                String travelerName = rs.getString("traveler_name");
                String travelerEmail = rs.getString("traveler_email");
                String travelerPhone = rs.getString("traveler_phone");
                String listingId = rs.getString("listing_id");
                String listingTitle = rs.getString("listing_title");
                ListingType type = ListingType.valueOf(rs.getString("listing_type"));
                String destination = rs.getString("destination");
                String bookingDate = rs.getString("booking_date");
                String travelDate = rs.getString("travel_date");
                String returnDate = rs.getString("return_date");
                String pickupLocation = rs.getString("pickup_location");
                String vehicleType = rs.getString("vehicle_type");
                int units = rs.getInt("units");
                double pricePerUnit = rs.getDouble("price_per_unit");
                double taxAmount = rs.getDouble("tax_amount");
                double totalPrice = rs.getDouble("total_price");
                String statusStr = rs.getString("status");
                String specialRequests = rs.getString("special_requests");
                String paymentMethod = rs.getString("payment_method");
                String paymentStatus = rs.getString("payment_status");

                int travelerAge = 0;
                try {
                    travelerAge = rs.getInt("traveler_age");
                } catch (SQLException ignored) {}

                boolean hasReturn = (type == ListingType.FLIGHT && returnDate != null && !returnDate.trim().isEmpty());
                Booking b = new Booking(id, travelerId, travelerName, travelerAge, travelerEmail, travelerPhone,
                        listingId, listingTitle, type, destination, travelDate, returnDate,
                        units, pricePerUnit, 5.0,
                        specialRequests, paymentMethod, pickupLocation, vehicleType,
                        BookingStatus.valueOf(statusStr), hasReturn);

                b.setBookingDate(bookingDate);
                b.setPaymentStatus(paymentStatus);
                if (taxAmount > 0) b.setTaxAmount(taxAmount);
                if (totalPrice > 0) b.setTotalPrice(totalPrice);
                list.add(b);
            }
        } catch (SQLException e) {
            System.err.println("[DatabaseManager] Error loading bookings: " + e.getMessage());
        }
        return list;
    }

    public List<Itinerary> loadAllItineraries() {
        List<Itinerary> list = new ArrayList<>();
        String sql = "SELECT id, traveler_id, traveler_name, trip_title, destination, start_date, end_date, " +
                "estimated_budget, total_cost, status, plan_details FROM itineraries ORDER BY created_at ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                String id = rs.getString("id");
                String travelerId = rs.getString("traveler_id");
                String travelerName = rs.getString("traveler_name");
                String tripTitle = rs.getString("trip_title");
                String destination = rs.getString("destination");
                String startDate = rs.getString("start_date");
                String endDate = rs.getString("end_date");
                double budget = rs.getDouble("estimated_budget");
                double totalCost = rs.getDouble("total_cost");
                String status = rs.getString("status");
                String planDetails = rs.getString("plan_details");

                list.add(new Itinerary(id, travelerId, travelerName, tripTitle, destination, startDate, endDate, budget, totalCost, status, planDetails));
            }
        } catch (SQLException e) {
            System.err.println("[DatabaseManager] Error loading itineraries: " + e.getMessage());
        }
        return list;
    }

    public List<Message> loadAllMessages() {
        List<Message> list = new ArrayList<>();
        String sql = "SELECT id, sender_id, sender_name, sender_role, recipient_id, recipient_name, " +
                "subject, message_text, listing_reference, status, reply, timestamp FROM messages ORDER BY created_at ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                String id = rs.getString("id");
                String senderId = rs.getString("sender_id");
                String senderName = rs.getString("sender_name");
                String senderRole = rs.getString("sender_role");
                String recipientId = rs.getString("recipient_id");
                String recipientName = rs.getString("recipient_name");
                String subject = rs.getString("subject");
                String messageText = rs.getString("message_text");
                String listingRef = rs.getString("listing_reference");
                String status = rs.getString("status");
                String reply = rs.getString("reply");
                String timestamp = rs.getString("timestamp");

                Message m = new Message(id, senderId, senderName, senderRole, recipientId, recipientName, subject, messageText, listingRef);
                m.setStatus(status);
                m.setReply(reply);
                m.setTimestamp(timestamp);
                list.add(m);
            }
        } catch (SQLException e) {
            System.err.println("[DatabaseManager] Error loading messages: " + e.getMessage());
        }
        return list;
    }

    public SystemSettings loadSystemSettings() {
        String sql = "SELECT platform_name, currency_symbol, currency_code, default_tax_rate, maintenance_mode, " +
                "contact_email, support_phone, allow_agent_registration, max_bookings_per_user, terms_and_conditions FROM system_settings LIMIT 1";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                SystemSettings s = new SystemSettings();
                s.setPlatformName(rs.getString("platform_name"));
                s.setCurrencySymbol(rs.getString("currency_symbol"));
                s.setCurrencyCode(rs.getString("currency_code"));
                s.setDefaultTaxRate(rs.getDouble("default_tax_rate"));
                s.setMaintenanceMode(rs.getBoolean("maintenance_mode"));
                s.setContactEmail(rs.getString("contact_email"));
                s.setSupportPhone(rs.getString("support_phone"));
                s.setAllowAgentRegistration(rs.getBoolean("allow_agent_registration"));
                s.setMaxBookingsPerUser(rs.getInt("max_bookings_per_user"));
                s.setTermsAndConditions(rs.getString("terms_and_conditions"));
                return s;
            }
        } catch (SQLException e) {
            System.err.println("[DatabaseManager] Error loading system settings: " + e.getMessage());
        }
        return null;
    }

    // =========================================================================
    // 2. DATA PERSISTENCE & MUTATION METHODS (PreparedStatements)
    // =========================================================================

    public void saveUser(User u) {
        if (!DBConnection.isAvailable()) return;
        String sql = "INSERT INTO users (id, name, email, password, role, phone, status, loyalty_points, features) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), password=VALUES(password), " +
                "role=VALUES(role), phone=VALUES(phone), status=VALUES(status), loyalty_points=VALUES(loyalty_points), features=VALUES(features)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, u.getId());
            ps.setString(2, u.getName());
            ps.setString(3, u.getEmail());
            ps.setString(4, u.getPassword());
            ps.setString(5, u.getRole());
            ps.setString(6, u.getPhone());
            ps.setString(7, u.getStatus());
            ps.setInt(8, u.getLoyaltyPoints());
            ps.setString(9, u.getFeatures());
            ps.executeUpdate();
        } catch (SQLException e) {
            System.err.println("[DatabaseManager] Error saving user " + u.getId() + ": " + e.getMessage());
        }
    }

    public void deleteUser(String id) {
        if (!DBConnection.isAvailable()) return;
        String sql = "DELETE FROM users WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            System.err.println("[DatabaseManager] Error deleting user " + id + ": " + e.getMessage());
        }
    }

    public void saveListing(TravelListing l) {
        if (!DBConnection.isAvailable()) return;
        String sql = "INSERT INTO travel_listings (id, title, type, location, origin, destination, price, rating, " +
                "image_url, status, agent_id, agent_name, description, features, available_units, featured) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE title=VALUES(title), type=VALUES(type), location=VALUES(location), " +
                "origin=VALUES(origin), destination=VALUES(destination), price=VALUES(price), rating=VALUES(rating), " +
                "image_url=VALUES(image_url), status=VALUES(status), agent_id=VALUES(agent_id), agent_name=VALUES(agent_name), " +
                "description=VALUES(description), features=VALUES(features), available_units=VALUES(available_units), featured=VALUES(featured)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, l.getId());
            ps.setString(2, l.getTitle());
            ps.setString(3, l.getType().name());
            ps.setString(4, l.getLocation());
            ps.setString(5, l.getOrigin());
            ps.setString(6, l.getDestination());
            ps.setDouble(7, l.getPrice());
            ps.setDouble(8, l.getRating());
            ps.setString(9, l.getImageUrl());
            ps.setString(10, l.getStatus().name());
            ps.setString(11, l.getAgentId());
            ps.setString(12, l.getAgentName());
            ps.setString(13, l.getDescription());
            ps.setString(14, l.getFeatures());
            ps.setInt(15, l.getAvailableUnits());
            ps.setBoolean(16, l.isFeatured());
            ps.executeUpdate();
        } catch (SQLException e) {
            System.err.println("[DatabaseManager] Error saving listing " + l.getId() + ": " + e.getMessage());
        }
    }

    public void updateListingStatus(String id, ListingStatus status) {
        if (!DBConnection.isAvailable()) return;
        String sql = "UPDATE travel_listings SET status = ? WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status.name());
            ps.setString(2, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            System.err.println("[DatabaseManager] Error updating listing status " + id + ": " + e.getMessage());
        }
    }

    public void deleteListing(String id) {
        if (!DBConnection.isAvailable()) return;
        String sql = "DELETE FROM travel_listings WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            System.err.println("[DatabaseManager] Error deleting listing " + id + ": " + e.getMessage());
        }
    }

    private static volatile boolean bookingSchemaChecked = false;

    public void ensureBookingSchema() {
        if (bookingSchemaChecked || !DBConnection.isAvailable()) return;
        synchronized (DatabaseManager.class) {
            if (bookingSchemaChecked) return;
            try (Connection conn = DBConnection.getConnection();
                 Statement stmt = conn.createStatement()) {
                DatabaseMetaData md = conn.getMetaData();
                try (ResultSet rs = md.getColumns(null, null, "bookings", "traveler_age")) {
                    if (!rs.next()) {
                        stmt.executeUpdate("ALTER TABLE bookings ADD COLUMN traveler_age INT DEFAULT 0 COMMENT 'Passenger Age' AFTER traveler_name");
                        System.out.println("[DatabaseManager] Added 'traveler_age' column to MySQL bookings table.");
                    }
                }
                bookingSchemaChecked = true;
            } catch (SQLException e) {
                System.err.println("[DatabaseManager] Booking schema note: " + e.getMessage());
            }
        }
    }

    public void saveBooking(Booking b) {
        if (!DBConnection.isAvailable()) return;
        ensureBookingSchema();
        String sql = "INSERT INTO bookings (id, traveler_id, traveler_name, traveler_age, traveler_email, traveler_phone, " +
                "listing_id, listing_title, listing_type, destination, booking_date, travel_date, return_date, " +
                "pickup_location, vehicle_type, units, price_per_unit, tax_amount, total_price, status, " +
                "special_requests, payment_method, payment_status) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE traveler_name=VALUES(traveler_name), traveler_age=VALUES(traveler_age), " +
                "traveler_phone=VALUES(traveler_phone), status=VALUES(status), payment_status=VALUES(payment_status), " +
                "pickup_location=VALUES(pickup_location), vehicle_type=VALUES(vehicle_type), return_date=VALUES(return_date)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, b.getId());
            ps.setString(2, b.getTravelerId());
            ps.setString(3, b.getTravelerName());
            ps.setInt(4, b.getTravelerAge());
            ps.setString(5, b.getTravelerEmail());
            ps.setString(6, b.getTravelerPhone());
            ps.setString(7, b.getListingId());
            ps.setString(8, b.getListingTitle());
            ps.setString(9, b.getListingType() != null ? b.getListingType().name() : "HOTEL");
            ps.setString(10, b.getDestination());
            ps.setString(11, b.getBookingDate());
            ps.setString(12, b.getTravelDate());
            ps.setString(13, b.getReturnDate() != null ? b.getReturnDate() : "");
            ps.setString(14, b.getPickupLocation() != null ? b.getPickupLocation() : "");
            ps.setString(15, b.getVehicleType() != null ? b.getVehicleType() : "");
            ps.setInt(16, b.getUnits());
            ps.setDouble(17, b.getPricePerUnit());
            ps.setDouble(18, b.getTaxAmount());
            ps.setDouble(19, b.getTotalPrice());
            ps.setString(20, b.getStatus());
            ps.setString(21, b.getSpecialRequests());
            ps.setString(22, b.getPaymentMethod());
            ps.setString(23, b.getPaymentStatus());
            ps.executeUpdate();
        } catch (SQLException e) {
            System.err.println("[DatabaseManager] Primary saveBooking attempt failed, trying legacy fallback: " + e.getMessage());
            saveBookingLegacy(b);
        }
    }

    private void saveBookingLegacy(Booking b) {
        String sql = "INSERT INTO bookings (id, traveler_id, traveler_name, traveler_email, traveler_phone, " +
                "listing_id, listing_title, listing_type, destination, booking_date, travel_date, return_date, " +
                "pickup_location, vehicle_type, units, price_per_unit, tax_amount, total_price, status, " +
                "special_requests, payment_method, payment_status) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE status=VALUES(status), payment_status=VALUES(payment_status), " +
                "pickup_location=VALUES(pickup_location), vehicle_type=VALUES(vehicle_type), return_date=VALUES(return_date)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, b.getId());
            ps.setString(2, b.getTravelerId());
            ps.setString(3, b.getTravelerName());
            ps.setString(4, b.getTravelerEmail());
            ps.setString(5, b.getTravelerPhone());
            ps.setString(6, b.getListingId());
            ps.setString(7, b.getListingTitle());
            ps.setString(8, b.getListingType() != null ? b.getListingType().name() : "HOTEL");
            ps.setString(9, b.getDestination());
            ps.setString(10, b.getBookingDate());
            ps.setString(11, b.getTravelDate());
            ps.setString(12, b.getReturnDate() != null ? b.getReturnDate() : "");
            ps.setString(13, b.getPickupLocation() != null ? b.getPickupLocation() : "");
            ps.setString(14, b.getVehicleType() != null ? b.getVehicleType() : "");
            ps.setInt(15, b.getUnits());
            ps.setDouble(16, b.getPricePerUnit());
            ps.setDouble(17, b.getTaxAmount());
            ps.setDouble(18, b.getTotalPrice());
            ps.setString(19, b.getStatus());
            ps.setString(20, b.getSpecialRequests());
            ps.setString(21, b.getPaymentMethod());
            ps.setString(22, b.getPaymentStatus());
            ps.executeUpdate();
        } catch (SQLException e2) {
            System.err.println("[DatabaseManager] Error saving booking legacy " + b.getId() + ": " + e2.getMessage());
        }
    }

    public void updateBookingStatus(String id, String status) {
        if (!DBConnection.isAvailable()) return;
        String sql = "UPDATE bookings SET status = ? WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setString(2, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            System.err.println("[DatabaseManager] Error updating booking status " + id + ": " + e.getMessage());
        }
    }

    public void saveItinerary(Itinerary it) {
        if (!DBConnection.isAvailable()) return;
        String sql = "INSERT INTO itineraries (id, traveler_id, traveler_name, trip_title, destination, " +
                "start_date, end_date, estimated_budget, total_cost, status, plan_details) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE trip_title=VALUES(trip_title), destination=VALUES(destination), " +
                "start_date=VALUES(start_date), end_date=VALUES(end_date), estimated_budget=VALUES(estimated_budget), " +
                "total_cost=VALUES(total_cost), status=VALUES(status), plan_details=VALUES(plan_details)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, it.getId());
            ps.setString(2, it.getTravelerId());
            ps.setString(3, it.getTravelerName());
            ps.setString(4, it.getTripTitle());
            ps.setString(5, it.getDestination());
            ps.setString(6, it.getStartDate());
            ps.setString(7, it.getEndDate());
            ps.setDouble(8, it.getEstimatedBudget());
            ps.setDouble(9, it.getTotalCost());
            ps.setString(10, it.getStatus());
            ps.setString(11, it.getPlanDetails());
            ps.executeUpdate();
        } catch (SQLException e) {
            System.err.println("[DatabaseManager] Error saving itinerary " + it.getId() + ": " + e.getMessage());
        }
    }

    public void deleteItinerary(String id) {
        if (!DBConnection.isAvailable()) return;
        String sql = "DELETE FROM itineraries WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            System.err.println("[DatabaseManager] Error deleting itinerary " + id + ": " + e.getMessage());
        }
    }

    public void saveMessage(Message m) {
        if (!DBConnection.isAvailable()) return;
        String sql = "INSERT INTO messages (id, sender_id, sender_name, sender_role, recipient_id, recipient_name, " +
                "subject, message_text, listing_reference, status, reply, timestamp) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE status=VALUES(status), reply=VALUES(reply)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, m.getId());
            ps.setString(2, m.getSenderId());
            ps.setString(3, m.getSenderName());
            ps.setString(4, m.getSenderRole());
            ps.setString(5, m.getRecipientId());
            ps.setString(6, m.getRecipientName());
            ps.setString(7, m.getSubject());
            ps.setString(8, m.getMessageText());
            ps.setString(9, m.getListingReference());
            ps.setString(10, m.getStatus());
            ps.setString(11, m.getReply());
            ps.setString(12, m.getTimestamp());
            ps.executeUpdate();
        } catch (SQLException e) {
            System.err.println("[DatabaseManager] Error saving message " + m.getId() + ": " + e.getMessage());
        }
    }

    public void saveSystemSettings(SystemSettings s) {
        if (!DBConnection.isAvailable()) return;
        String sql = "INSERT INTO system_settings (id, platform_name, currency_symbol, currency_code, default_tax_rate, " +
                "maintenance_mode, contact_email, support_phone, allow_agent_registration, max_bookings_per_user, terms_and_conditions) " +
                "VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE platform_name=VALUES(platform_name), currency_symbol=VALUES(currency_symbol), " +
                "currency_code=VALUES(currency_code), default_tax_rate=VALUES(default_tax_rate), maintenance_mode=VALUES(maintenance_mode), " +
                "contact_email=VALUES(contact_email), support_phone=VALUES(support_phone), allow_agent_registration=VALUES(allow_agent_registration), " +
                "max_bookings_per_user=VALUES(max_bookings_per_user), terms_and_conditions=VALUES(terms_and_conditions)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, s.getPlatformName());
            ps.setString(2, s.getCurrencySymbol());
            ps.setString(3, s.getCurrencyCode());
            ps.setDouble(4, s.getDefaultTaxRate());
            ps.setBoolean(5, s.isMaintenanceMode());
            ps.setString(6, s.getContactEmail());
            ps.setString(7, s.getSupportPhone());
            ps.setBoolean(8, s.isAllowAgentRegistration());
            ps.setInt(9, s.getMaxBookingsPerUser());
            ps.setString(10, s.getTermsAndConditions());
            ps.executeUpdate();
        } catch (SQLException e) {
            System.err.println("[DatabaseManager] Error saving system settings: " + e.getMessage());
        }
    }

    // =========================================================================
    // 3. ASYNC MUTATION WRAPPERS (Non-blocking UI response)
    // =========================================================================

    public void asyncSaveUser(User u) {
        asyncPool.submit(() -> saveUser(u));
    }

    public void asyncDeleteUser(String id) {
        asyncPool.submit(() -> deleteUser(id));
    }

    public void asyncSaveListing(TravelListing l) {
        asyncPool.submit(() -> saveListing(l));
    }

    public void asyncUpdateListingStatus(String id, ListingStatus status) {
        asyncPool.submit(() -> updateListingStatus(id, status));
    }

    public void asyncDeleteListing(String id) {
        asyncPool.submit(() -> deleteListing(id));
    }

    public void asyncSaveBooking(Booking b) {
        asyncPool.submit(() -> saveBooking(b));
    }

    public void asyncUpdateBookingStatus(String id, String status) {
        asyncPool.submit(() -> updateBookingStatus(id, status));
    }

    public void asyncSaveItinerary(Itinerary it) {
        asyncPool.submit(() -> saveItinerary(it));
    }

    public void asyncDeleteItinerary(String id) {
        asyncPool.submit(() -> deleteItinerary(id));
    }

    public void asyncSaveMessage(Message m) {
        asyncPool.submit(() -> saveMessage(m));
    }

    public void asyncSaveSystemSettings(SystemSettings s) {
        asyncPool.submit(() -> saveSystemSettings(s));
    }

    // =========================================================================
    // 4. DATABASE INITIAL SYNC HELPER
    // =========================================================================

    /**
     * Synchronizes memory DataStore to MySQL if database is connected but tables are empty.
     */
    public void syncMemoryToDatabase(DataStore store) {
        if (!DBConnection.isAvailable()) return;

        try (Connection conn = DBConnection.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT COUNT(*) AS total FROM users")) {
            if (rs.next() && rs.getInt("total") == 0) {
                System.out.println("[DatabaseManager] MySQL tables are empty. Seeding initial records into MySQL database...");
                for (User u : store.getAllUsers()) saveUser(u);
                for (TravelListing l : store.getAllListings()) saveListing(l);
                for (Booking b : store.getAllBookings()) saveBooking(b);
                for (Itinerary it : store.getAllItineraries()) saveItinerary(it);
                for (Message m : store.getAllMessages()) saveMessage(m);
                saveSystemSettings(store.getSystemSettings());
                System.out.println("[DatabaseManager] Initial records successfully synchronized to MySQL!");
            }
        } catch (SQLException e) {
            System.err.println("[DatabaseManager] Initial sync skipped: " + e.getMessage());
        }
    }
}
