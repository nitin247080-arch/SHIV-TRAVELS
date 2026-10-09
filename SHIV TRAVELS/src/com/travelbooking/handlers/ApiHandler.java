package com.travelbooking.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.travelbooking.models.*;
import com.travelbooking.storage.DataStore;
import com.travelbooking.utils.JsonUtil;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

public class ApiHandler implements HttpHandler {
    private final DataStore store = DataStore.getInstance();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        // Enable CORS
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");

        String method = exchange.getRequestMethod().toUpperCase();
        if (method.equals("OPTIONS")) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        String path = exchange.getRequestURI().getPath();
        Map<String, String> queryParams = parseQueryParams(exchange.getRequestURI().getQuery());
        String body = readRequestBody(exchange);

        try {
            if (path.equals("/api/stats")) {
                handleStats(exchange);
            } else if (path.equals("/api/users")) {
                handleUsers(exchange, method, queryParams, body);
            } else if (path.startsWith("/api/listings")) {
                handleListings(exchange, method, path, queryParams, body);
            } else if (path.startsWith("/api/bookings")) {
                handleBookings(exchange, method, path, queryParams, body);
            } else if (path.startsWith("/api/itineraries")) {
                handleItineraries(exchange, method, queryParams, body);
            } else if (path.startsWith("/api/messages")) {
                handleMessages(exchange, method, path, queryParams, body);
            } else if (path.equals("/api/settings")) {
                handleSettings(exchange, method, body);
            } else if (path.startsWith("/api/vouchers")) {
                handleVouchers(exchange, method, path, queryParams, body);
            } else if (path.startsWith("/api/notifications")) {
                handleNotifications(exchange, method, path, queryParams, body);
            } else if (path.startsWith("/api/auth")) {
                handleAuth(exchange, method, path, body);
            } else {
                sendJsonResponse(exchange, 404, "{\"error\":\"API route not found: " + path + "\"}");
            }
        } catch (Exception e) {
            e.printStackTrace();
            sendJsonResponse(exchange, 500, "{\"error\":\"Internal Server Error: " + JsonUtil.escape(e.getMessage()) + "\"}");
        }
    }

    // --- Overview Stats ---
    private void handleStats(HttpExchange exchange) throws IOException {
        long totalUsers = store.getAllUsers().size();
        long totalListings = store.getAllListings().size();
        long pendingListings = store.getAllListings().stream().filter(l -> l.getStatus() == ListingStatus.PENDING).count();
        long approvedListings = store.getAllListings().stream().filter(l -> l.getStatus() == ListingStatus.APPROVED).count();
        long totalBookings = store.getAllBookings().size();
        long confirmedBookings = store.getAllBookings().stream().filter(b -> "CONFIRMED".equalsIgnoreCase(b.getStatus())).count();
        long pendingBookings = store.getAllBookings().stream().filter(b -> "PENDING".equalsIgnoreCase(b.getStatus())).count();
        long cancelledBookings = store.getAllBookings().stream().filter(b -> "CANCELLED".equalsIgnoreCase(b.getStatus())).count();
        double totalRevenue = store.getAllBookings().stream()
                .filter(b -> !"CANCELLED".equalsIgnoreCase(b.getStatus()))
                .mapToDouble(Booking::getTotalPrice)
                .sum();
        long totalItineraries = store.getAllItineraries().size();
        long unreadMessages = store.getAllMessages().stream().filter(m -> "UNREAD".equalsIgnoreCase(m.getStatus())).count();

        String json = "{"
                + "\"success\":true,"
                + "\"totalUsers\":" + totalUsers + ","
                + "\"totalListings\":" + totalListings + ","
                + "\"pendingListings\":" + pendingListings + ","
                + "\"approvedListings\":" + approvedListings + ","
                + "\"totalBookings\":" + totalBookings + ","
                + "\"confirmedBookings\":" + confirmedBookings + ","
                + "\"pendingBookings\":" + pendingBookings + ","
                + "\"cancelledBookings\":" + cancelledBookings + ","
                + "\"totalRevenue\":" + Math.round(totalRevenue * 100.0) / 100.0 + ","
                + "\"totalItineraries\":" + totalItineraries + ","
                + "\"unreadMessages\":" + unreadMessages
                + "}";
        sendJsonResponse(exchange, 200, json);
    }

    // --- Users API ---
    private void handleUsers(HttpExchange exchange, String method, Map<String, String> qp, String body) throws IOException {
        if (method.equals("GET")) {
            List<User> list = store.getAllUsers();
            List<String> items = list.stream().map(User::toJson).collect(Collectors.toList());
            sendJsonResponse(exchange, 200, "{\"success\":true,\"users\":" + JsonUtil.toJsonList(items) + "}");
        } else if (method.equals("POST")) {
            String name = JsonUtil.getString(body, "name", "New User");
            String email = JsonUtil.getString(body, "email", "");
            String role = JsonUtil.getString(body, "role", "TRAVELER");
            String phone = JsonUtil.getString(body, "phone", "");
            String password = JsonUtil.getString(body, "password", "pass123");
            int loyaltyPoints = JsonUtil.getInt(body, "loyaltyPoints", role.equalsIgnoreCase("TRAVELER") ? 500 : 0);
            String features = JsonUtil.getString(body, "features", "Book Flights / Hotels / Cars, View & Export Itinerary, Loyalty Points");

            if (email.isBlank()) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Email is required!\"}");
                return;
            }

            User existing = store.getUserByEmail(email);
            if (existing != null) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"User with this email already exists!\"}");
                return;
            }

            User created = store.addUser(name, email, role, phone, password, loyaltyPoints, features);
            sendJsonResponse(exchange, 201, "{\"success\":true,\"message\":\"User created successfully!\",\"user\":" + created.toJson() + "}");
        } else if (method.equals("PUT")) {
            String id = JsonUtil.getString(body, "id", "");
            String name = JsonUtil.getString(body, "name", "");
            String email = JsonUtil.getString(body, "email", "");
            String role = JsonUtil.getString(body, "role", "");
            String phone = JsonUtil.getString(body, "phone", "");
            String status = JsonUtil.getString(body, "status", "");

            boolean updated = store.updateUser(id, name, email, role, phone, status);
            if (updated) {
                sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"User updated successfully!\"}");
            } else {
                sendJsonResponse(exchange, 404, "{\"success\":false,\"message\":\"User not found!\"}");
            }
        } else if (method.equals("DELETE")) {
            String id = qp.get("id");
            if (id == null && body != null) {
                id = JsonUtil.getString(body, "id", null);
            }
            if (id != null && store.deleteUser(id)) {
                sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"User deleted successfully!\"}");
            } else {
                sendJsonResponse(exchange, 404, "{\"success\":false,\"message\":\"User not found or ID missing!\"}");
            }
        }
    }

    // --- Authentication API (Login & Register) ---
    private void handleAuth(HttpExchange exchange, String method, String path, String body) throws IOException {
        if (!method.equalsIgnoreCase("POST")) {
            sendJsonResponse(exchange, 405, "{\"success\":false,\"message\":\"Method Not Allowed\"}");
            return;
        }

        if (path.equals("/api/auth/login")) {
            String email = JsonUtil.getString(body, "email", "").trim();
            String password = JsonUtil.getString(body, "password", "").trim();

            if (email.isBlank() || password.isBlank()) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Please enter both email and password!\"}");
                return;
            }

            User user = store.getUserByEmail(email);
            if (user == null || user.getPassword() == null || !user.getPassword().equals(password)) {
                sendJsonResponse(exchange, 401, "{\"success\":false,\"message\":\"Invalid email or password! Please check credentials.\"}");
                return;
            }

            if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
                sendJsonResponse(exchange, 403, "{\"success\":false,\"message\":\"Your account has been deactivated. Please contact Administrator Nitin Chaudhary.\"}");
                return;
            }

            sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Login successful! Welcome back, " + JsonUtil.escape(user.getName()) + ".\",\"user\":" + user.toJson() + "}");
            return;
        }

        if (path.equals("/api/auth/register")) {
            String name = JsonUtil.getString(body, "name", "").trim();
            String email = JsonUtil.getString(body, "email", "").trim();
            String password = JsonUtil.getString(body, "password", "pass123").trim();
            String phone = JsonUtil.getString(body, "phone", "+91 98000 00000").trim();
            String role = JsonUtil.getString(body, "role", "TRAVELER").trim().toUpperCase();

            if (name.isBlank() || email.isBlank()) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Full name and email address are required!\"}");
                return;
            }

            if (password.isBlank()) {
                password = "pass123";
            }

            if (!role.equals("ADMIN") && !role.equals("AGENT") && !role.equals("TRAVELER")) {
                role = "TRAVELER";
            }

            User existing = store.getUserByEmail(email);
            if (existing != null) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"An account with email '" + email + "' is already registered! Please sign in.\"}");
                return;
            }

            int loyaltyPoints = role.equals("TRAVELER") ? 500 : 0;
            String features = role.equals("ADMIN") ? "User Management, Listing Approvals, System Settings, Revenue & Booking Overview" :
                    (role.equals("AGENT") ? "Manage Listings, User Interaction, Track Bookings" :
                            "Book Flights / Hotels / Cars, View & Export Itinerary, Loyalty Points (500 pts welcome bonus!)");

            User created = store.addUser(name, email, role, phone, password, loyaltyPoints, features);
            sendJsonResponse(exchange, 201, "{\"success\":true,\"message\":\"Account registered successfully! Welcome to SHIV TRAVELS, " + JsonUtil.escape(created.getName()) + ".\",\"user\":" + created.toJson() + "}");
            return;
        }

        sendJsonResponse(exchange, 404, "{\"success\":false,\"message\":\"Unknown auth endpoint: " + path + "\"}");
    }

    // --- Listings API ---
    private void handleListings(HttpExchange exchange, String method, String path, Map<String, String> qp, String body) throws IOException {
        if (path.equals("/api/listings/status") && method.equals("PUT")) {
            // Admin approves or rejects listing
            String id = JsonUtil.getString(body, "id", "");
            String statusStr = JsonUtil.getString(body, "status", "APPROVED");
            ListingStatus status = ListingStatus.fromString(statusStr);

            boolean ok = store.updateListingStatus(id, status);
            if (ok) {
                sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Listing status updated to " + status + " successfully!\",\"status\":\"" + status + "\"}");
            } else {
                sendJsonResponse(exchange, 404, "{\"success\":false,\"message\":\"Listing not found!\"}");
            }
            return;
        }

        if (method.equals("GET")) {
            String typeFilter = qp.get("type");
            String statusFilter = qp.get("status"); // APPROVED, PENDING, ALL
            String search = qp.get("q");

            List<TravelListing> list = store.getAllListings();
            if (statusFilter != null && !statusFilter.equalsIgnoreCase("ALL")) {
                ListingStatus st = ListingStatus.fromString(statusFilter);
                list = list.stream().filter(l -> l.getStatus() == st).collect(Collectors.toList());
            } else if (statusFilter == null) {
                // By default show approved listings for travelers
                list = list.stream().filter(l -> l.getStatus() == ListingStatus.APPROVED).collect(Collectors.toList());
            }

            if (typeFilter != null && !typeFilter.equalsIgnoreCase("ALL")) {
                ListingType lt = ListingType.fromString(typeFilter);
                list = list.stream().filter(l -> l.getType() == lt).collect(Collectors.toList());
            }

            if (search != null && !search.isBlank()) {
                String q = search.toLowerCase();
                list = list.stream().filter(l ->
                        l.getTitle().toLowerCase().contains(q) ||
                        l.getLocation().toLowerCase().contains(q) ||
                        l.getDestination().toLowerCase().contains(q) ||
                        l.getOrigin().toLowerCase().contains(q)
                ).collect(Collectors.toList());
            }

            List<String> items = list.stream().map(TravelListing::toJson).collect(Collectors.toList());
            sendJsonResponse(exchange, 200, "{\"success\":true,\"listings\":" + JsonUtil.toJsonList(items) + "}");
        } else if (method.equals("POST")) {
            // Travel agent creates a listing
            String title = JsonUtil.getString(body, "title", "Travel Package");
            String typeStr = JsonUtil.getString(body, "type", "HOTEL");
            String location = JsonUtil.getString(body, "location", "India");
            String origin = JsonUtil.getString(body, "origin", "");
            String destination = JsonUtil.getString(body, "destination", location);
            double price = JsonUtil.getDouble(body, "price", 999.0);
            double rating = JsonUtil.getDouble(body, "rating", 4.8);
            String imageUrl = JsonUtil.getString(body, "imageUrl", "/assets/images/taj_mahal.webp");
            String agentId = JsonUtil.getString(body, "agentId", "USR-002");
            String agentName = JsonUtil.getString(body, "agentName", "Priya Patel");
            String desc = JsonUtil.getString(body, "description", "");
            String features = JsonUtil.getString(body, "features", "");
            int units = JsonUtil.getInt(body, "availableUnits", 10);
            boolean featured = JsonUtil.getBoolean(body, "featured", false);

            TravelListing listing = new TravelListing(null, title, ListingType.fromString(typeStr),
                    location, origin, destination, price, rating, imageUrl,
                    ListingStatus.PENDING, agentId, agentName, desc, features, units, featured);

            TravelListing added = store.addListing(listing);
            sendJsonResponse(exchange, 201, "{\"success\":true,\"message\":\"Travel listing submitted successfully! Sent to Admin for approval.\",\"listing\":" + added.toJson() + "}");
        } else if (method.equals("DELETE")) {
            String id = qp.get("id");
            if (id == null && body != null) id = JsonUtil.getString(body, "id", null);
            if (id != null && store.deleteListing(id)) {
                sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Listing removed successfully!\"}");
            } else {
                sendJsonResponse(exchange, 404, "{\"success\":false,\"message\":\"Listing not found!\"}");
            }
        }
    }

    // --- Bookings API ---
    private void handleBookings(HttpExchange exchange, String method, String path, Map<String, String> qp, String body) throws IOException {
        if (path.equals("/api/bookings/cancel") && method.equals("PUT")) {
            String id = JsonUtil.getString(body, "id", "");
            if (store.cancelBooking(id)) {
                sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Booking " + id + " cancelled successfully! Refund initiated.\" }");
            } else {
                sendJsonResponse(exchange, 404, "{\"success\":false,\"message\":\"Booking not found!\"}");
            }
            return;
        }

        if (method.equals("GET")) {
            String travelerId = qp.get("travelerId");
            List<Booking> list;
            if (travelerId != null && !travelerId.isBlank()) {
                list = store.getBookingsByTraveler(travelerId);
            } else {
                list = store.getAllBookings();
            }
            List<String> items = list.stream().map(Booking::toJson).collect(Collectors.toList());
            sendJsonResponse(exchange, 200, "{\"success\":true,\"bookings\":" + JsonUtil.toJsonList(items) + "}");
        } else if (method.equals("POST")) {
            String travelerId = JsonUtil.getString(body, "travelerId", "USR-004");
            String travelerName = JsonUtil.getString(body, "travelerName", "").trim();
            int travelerAge = JsonUtil.getInt(body, "travelerAge", 0);
            String travelerEmail = JsonUtil.getString(body, "travelerEmail", "traveler@shivtravels.com").trim();
            String travelerPhone = JsonUtil.getString(body, "travelerPhone", "").trim();
            String listingId = JsonUtil.getString(body, "listingId", "");
            String travelDate = JsonUtil.getString(body, "travelDate", "2026-10-25");
            String returnDate = JsonUtil.getString(body, "returnDate", "");
            int units = JsonUtil.getInt(body, "units", 1);
            String specialReq = JsonUtil.getString(body, "specialRequests", "");
            String paymentMethod = JsonUtil.getString(body, "paymentMethod", "UPI");
            String pickupLocation = JsonUtil.getString(body, "pickupLocation", "");
            String vehicleType = JsonUtil.getString(body, "vehicleType", "");
            String statusStr = JsonUtil.getString(body, "status", "CONFIRMED");
            BookingStatus bookingStatus = BookingStatus.fromString(statusStr);
            boolean hasReturnTicket = JsonUtil.getBoolean(body, "hasReturnTicket", false);

            if (listingId.isBlank()) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Listing ID is required to book!\"}");
                return;
            }

            TravelListing l = store.getListingById(listingId);
            if (l == null) {
                sendJsonResponse(exchange, 404, "{\"success\":false,\"message\":\"Listing not found!\"}");
                return;
            }

            boolean isFlight = (l.getType() == ListingType.FLIGHT);
            if (isFlight) {
                if (travelerName.isBlank()) {
                    sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Full Name must not be empty!\"}");
                    return;
                }
                if (travelerAge <= 0) {
                    sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Age must be a valid positive number!\"}");
                    return;
                }
                String cleanDigits = travelerPhone.replaceAll("[^0-9]", "");
                if (cleanDigits.startsWith("91") && cleanDigits.length() == 12) {
                    cleanDigits = cleanDigits.substring(2);
                }
                if (cleanDigits.length() != 10) {
                    sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Mobile Number must contain exactly 10 digits for Indian mobile numbers!\"}");
                    return;
                }
                travelerPhone = cleanDigits;

                if (!hasReturnTicket && returnDate != null && !returnDate.trim().isEmpty()) {
                    hasReturnTicket = true;
                }
            }

            if (travelerName.isBlank()) {
                travelerName = "Traveler";
            }

            Booking booking = store.createBooking(travelerId, travelerName, travelerAge, travelerEmail, travelerPhone,
                    listingId, travelDate, returnDate, units, specialReq, paymentMethod,
                    pickupLocation, vehicleType, bookingStatus, hasReturnTicket);

            if (booking != null) {
                sendJsonResponse(exchange, 201, "{\"success\":true,\"message\":\"Booking processed successfully! Booking ID: " + booking.getId() + "\",\"booking\":" + booking.toJson() + "}");
            } else {
                sendJsonResponse(exchange, 404, "{\"success\":false,\"message\":\"Listing not found!\"}");
            }
        }
    }

    // --- Itineraries API ---
    private void handleItineraries(HttpExchange exchange, String method, Map<String, String> qp, String body) throws IOException {
        if (method.equals("GET")) {
            String travelerId = qp.get("travelerId");
            List<Itinerary> list;
            if (travelerId != null && !travelerId.isBlank()) {
                list = store.getItinerariesByTraveler(travelerId);
            } else {
                list = store.getAllItineraries();
            }
            List<String> items = list.stream().map(Itinerary::toJson).collect(Collectors.toList());
            sendJsonResponse(exchange, 200, "{\"success\":true,\"itineraries\":" + JsonUtil.toJsonList(items) + "}");
        } else if (method.equals("POST")) {
            String travelerId = JsonUtil.getString(body, "travelerId", "USR-004");
            String travelerName = JsonUtil.getString(body, "travelerName", "Traveler");
            String tripTitle = JsonUtil.getString(body, "tripTitle", "My Trip");
            String destination = JsonUtil.getString(body, "destination", "India");
            String startDate = JsonUtil.getString(body, "startDate", "2026-10-20");
            String endDate = JsonUtil.getString(body, "endDate", "2026-10-25");
            double budget = JsonUtil.getDouble(body, "estimatedBudget", 50000.0);
            double cost = JsonUtil.getDouble(body, "totalCost", 35000.0);
            String planDetails = JsonUtil.getString(body, "planDetails", "Day 1: Sightseeing | Day 2: Relaxation");

            Itinerary it = store.addItinerary(travelerId, travelerName, tripTitle, destination, startDate, endDate, budget, cost, planDetails);
            sendJsonResponse(exchange, 201, "{\"success\":true,\"message\":\"Itinerary created successfully!\",\"itinerary\":" + it.toJson() + "}");
        } else if (method.equals("DELETE")) {
            String id = qp.get("id");
            if (id == null && body != null) id = JsonUtil.getString(body, "id", null);
            if (id != null && store.deleteItinerary(id)) {
                sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Itinerary deleted successfully!\"}");
            } else {
                sendJsonResponse(exchange, 404, "{\"success\":false,\"message\":\"Itinerary not found!\"}");
            }
        }
    }

    // --- Messages API ---
    private void handleMessages(HttpExchange exchange, String method, String path, Map<String, String> qp, String body) throws IOException {
        if (path.equals("/api/messages/reply") && method.equals("PUT")) {
            String id = JsonUtil.getString(body, "id", "");
            if (store.markMessageReplied(id)) {
                sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Message marked as replied!\"}");
            } else {
                sendJsonResponse(exchange, 404, "{\"success\":false,\"message\":\"Message not found!\"}");
            }
            return;
        }

        if (method.equals("GET")) {
            List<Message> list = store.getAllMessages();
            List<String> items = list.stream().map(Message::toJson).collect(Collectors.toList());
            sendJsonResponse(exchange, 200, "{\"success\":true,\"messages\":" + JsonUtil.toJsonList(items) + "}");
        } else if (method.equals("POST")) {
            String senderId = JsonUtil.getString(body, "senderId", "USR-004");
            String senderName = JsonUtil.getString(body, "senderName", "Traveler");
            String senderRole = JsonUtil.getString(body, "senderRole", "TRAVELER");
            String recipientId = JsonUtil.getString(body, "recipientId", "USR-002");
            String recipientName = JsonUtil.getString(body, "recipientName", "Travel Agent");
            String subject = JsonUtil.getString(body, "subject", "General Inquiry");
            String text = JsonUtil.getString(body, "messageText", "");
            String listingRef = JsonUtil.getString(body, "listingReference", "");

            if (text.isBlank()) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Message text cannot be empty!\"}");
                return;
            }

            Message msg = store.addMessage(senderId, senderName, senderRole, recipientId, recipientName, subject, text, listingRef);
            sendJsonResponse(exchange, 201, "{\"success\":true,\"message\":\"Message sent successfully! The agent has been notified.\",\"message\":" + msg.toJson() + "}");
        }
    }

    // --- Settings API ---
    private void handleSettings(HttpExchange exchange, String method, String body) throws IOException {
        if (method.equals("GET")) {
            sendJsonResponse(exchange, 200, "{\"success\":true,\"settings\":" + store.getSystemSettings().toJson() + "}");
        } else if (method.equals("PUT")) {
            SystemSettings current = store.getSystemSettings();
            String name = JsonUtil.getString(body, "platformName", current.getPlatformName());
            String curSym = JsonUtil.getString(body, "currencySymbol", current.getCurrencySymbol());
            String curCode = JsonUtil.getString(body, "currencyCode", current.getCurrencyCode());
            double tax = JsonUtil.getDouble(body, "defaultTaxRate", current.getDefaultTaxRate());
            boolean maint = JsonUtil.getBoolean(body, "maintenanceMode", current.isMaintenanceMode());
            String email = JsonUtil.getString(body, "contactEmail", current.getContactEmail());
            String phone = JsonUtil.getString(body, "supportPhone", current.getSupportPhone());
            boolean allowAgent = JsonUtil.getBoolean(body, "allowAgentRegistration", current.isAllowAgentRegistration());
            int maxBkg = JsonUtil.getInt(body, "maxBookingsPerUser", current.getMaxBookingsPerUser());
            String terms = JsonUtil.getString(body, "termsAndConditions", current.getTermsAndConditions());

            current.setPlatformName(name);
            current.setCurrencySymbol(curSym);
            current.setCurrencyCode(curCode);
            current.setDefaultTaxRate(tax);
            current.setMaintenanceMode(maint);
            current.setContactEmail(email);
            current.setSupportPhone(phone);
            current.setAllowAgentRegistration(allowAgent);
            current.setMaxBookingsPerUser(maxBkg);
            current.setTermsAndConditions(terms);

            store.updateSystemSettings(current);
            sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"System settings updated successfully!\",\"settings\":" + current.toJson() + "}");
        }
    }

    // --- Voucher Management & Redemption ---
    public static class Voucher {
        private String id;
        private String code;
        private String discountType; // "PERCENTAGE" or "FLAT"
        private double discountValue;
        private double minAmount;
        private String expiryDate;
        private int usageLimit;
        private int timesUsed;
        private String description;
        private String status; // "ACTIVE", "DISABLED", "EXHAUSTED"
        private String createdDate;

        public Voucher(String id, String code, String discountType, double discountValue, double minAmount, String expiryDate, int usageLimit, String description) {
            this.id = id;
            this.code = (code != null ? code.trim().toUpperCase() : "VCH");
            this.discountType = (discountType != null ? discountType.trim().toUpperCase() : "FLAT");
            this.discountValue = discountValue;
            this.minAmount = minAmount;
            this.expiryDate = (expiryDate != null && !expiryDate.isBlank() ? expiryDate : "2026-12-31");
            this.usageLimit = usageLimit > 0 ? usageLimit : 100;
            this.timesUsed = 0;
            this.description = (description != null ? description : "");
            this.status = "ACTIVE";
            this.createdDate = java.time.LocalDate.now().toString();
        }

        public String getId() { return id; }
        public String getCode() { return code; }
        public String getDiscountType() { return discountType; }
        public double getDiscountValue() { return discountValue; }
        public double getMinAmount() { return minAmount; }
        public String getExpiryDate() { return expiryDate; }
        public int getUsageLimit() { return usageLimit; }
        public int getTimesUsed() { return timesUsed; }
        public void setTimesUsed(int timesUsed) { this.timesUsed = timesUsed; }
        public String getDescription() { return description; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String toJson() {
            return "{"
                + "\"id\":\"" + JsonUtil.escape(id) + "\","
                + "\"code\":\"" + JsonUtil.escape(code) + "\","
                + "\"discountType\":\"" + JsonUtil.escape(discountType) + "\","
                + "\"discountValue\":" + discountValue + ","
                + "\"minAmount\":" + minAmount + ","
                + "\"expiryDate\":\"" + JsonUtil.escape(expiryDate) + "\","
                + "\"usageLimit\":" + usageLimit + ","
                + "\"timesUsed\":" + timesUsed + ","
                + "\"description\":\"" + JsonUtil.escape(description) + "\","
                + "\"status\":\"" + JsonUtil.escape(status) + "\","
                + "\"createdDate\":\"" + JsonUtil.escape(createdDate) + "\""
                + "}";
        }
    }

    private static final List<Voucher> voucherList = new java.util.concurrent.CopyOnWriteArrayList<>();
    static {
        voucherList.add(new Voucher("VCH-001", "NITIN2026", "FLAT", 500, 1000, "2026-12-31", 100, "Special Welcome Voucher by Administrator Nitin Chaudhary"));
        voucherList.add(new Voucher("VCH-002", "SHIV20", "PERCENTAGE", 20, 2000, "2026-12-31", 50, "Festive 20% Discount across Flights, Stays & Tours"));
        voucherList.add(new Voucher("VCH-004", "VOYAGE20", "PERCENTAGE", 20, 2000, "2026-12-31", 50, "Festive 20% Discount across Flights, Stays & Tours (Legacy Alias)"));
        voucherList.add(new Voucher("VCH-003", "EXPLORE1000", "FLAT", 1000, 5000, "2026-12-31", 25, "Flat ₹1,000 Off on Luxury Destinations"));
    }

    private void handleVouchers(HttpExchange exchange, String method, String path, Map<String, String> queryParams, String body) throws IOException {
        if (path.equals("/api/vouchers/redeem") && method.equals("POST")) {
            // Redeem voucher
            String code = JsonUtil.getString(body, "code", "").trim().toUpperCase();
            double bookingAmount = JsonUtil.getDouble(body, "amount", 0.0);

            if (code.isBlank()) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Please enter a valid voucher code.\"}");
                return;
            }

            Voucher matched = null;
            for (Voucher v : voucherList) {
                if (v.getCode().equalsIgnoreCase(code)) {
                    matched = v;
                    break;
                }
            }

            if (matched == null) {
                sendJsonResponse(exchange, 404, "{\"success\":false,\"message\":\"Voucher code '" + JsonUtil.escape(code) + "' is invalid or does not exist.\"}");
                return;
            }

            if (!"ACTIVE".equalsIgnoreCase(matched.getStatus())) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Voucher code '" + JsonUtil.escape(code) + "' is " + matched.getStatus() + ".\"}");
                return;
            }

            if (matched.getTimesUsed() >= matched.getUsageLimit()) {
                matched.setStatus("EXHAUSTED");
                sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Voucher code usage limit has been reached.\"}");
                return;
            }

            if (bookingAmount > 0 && bookingAmount < matched.getMinAmount()) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Minimum booking amount of ₹" + ((int)matched.getMinAmount()) + " is required to redeem this voucher.\"}");
                return;
            }

            double discountAmount = 0;
            if ("PERCENTAGE".equalsIgnoreCase(matched.getDiscountType())) {
                discountAmount = (bookingAmount > 0) ? (bookingAmount * (matched.getDiscountValue() / 100.0)) : 0;
            } else {
                discountAmount = (bookingAmount > 0) ? Math.min(matched.getDiscountValue(), bookingAmount) : matched.getDiscountValue();
            }

            boolean finalize = JsonUtil.getBoolean(body, "finalize", false);
            if (finalize) {
                matched.setTimesUsed(matched.getTimesUsed() + 1);
                if (matched.getTimesUsed() >= matched.getUsageLimit()) {
                    matched.setStatus("EXHAUSTED");
                }
            }

            double finalAmount = Math.max(0, bookingAmount - discountAmount);

            String json = "{"
                    + "\"success\":true,"
                    + "\"message\":\"Voucher " + JsonUtil.escape(matched.getCode()) + " successfully applied!\","
                    + "\"code\":\"" + JsonUtil.escape(matched.getCode()) + "\","
                    + "\"discountType\":\"" + JsonUtil.escape(matched.getDiscountType()) + "\","
                    + "\"discountValue\":" + matched.getDiscountValue() + ","
                    + "\"discountAmount\":" + discountAmount + ","
                    + "\"finalAmount\":" + finalAmount + ","
                    + "\"voucher\":" + matched.toJson()
                    + "}";
            sendJsonResponse(exchange, 200, json);

        } else if (method.equals("GET")) {
            String vJson = voucherList.stream().map(Voucher::toJson).collect(Collectors.joining(","));
            sendJsonResponse(exchange, 200, "{\"success\":true,\"vouchers\":[" + vJson + "]}");

        } else if (method.equals("POST")) {
            // Admin generate new voucher
            String code = JsonUtil.getString(body, "code", "").trim().toUpperCase();
            if (code.isBlank()) {
                code = "VCH" + (int)(1000 + Math.random() * 9000);
            }
            String discountType = JsonUtil.getString(body, "discountType", "FLAT").toUpperCase();
            double discountValue = JsonUtil.getDouble(body, "discountValue", 500.0);
            double minAmount = JsonUtil.getDouble(body, "minAmount", 1000.0);
            String expiry = JsonUtil.getString(body, "expiryDate", "2026-12-31");
            int limit = JsonUtil.getInt(body, "usageLimit", 50);
            String desc = JsonUtil.getString(body, "description", "Exclusive Voucher generated by Administrator Nitin Chaudhary");

            String newId = "VCH-" + String.format("%03d", voucherList.size() + 1);
            Voucher newVoucher = new Voucher(newId, code, discountType, discountValue, minAmount, expiry, limit, desc);
            voucherList.add(newVoucher);

            sendJsonResponse(exchange, 201, "{\"success\":true,\"message\":\"Voucher code '" + JsonUtil.escape(code) + "' generated successfully!\",\"voucher\":" + newVoucher.toJson() + "}");

        } else if (method.equals("DELETE")) {
            String id = queryParams.get("id");
            if (id != null) {
                voucherList.removeIf(v -> v.getId().equalsIgnoreCase(id));
                sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Voucher " + JsonUtil.escape(id) + " deleted successfully.\"}");
            } else {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Missing voucher ID.\"}");
            }
        } else if (method.equals("PUT")) {
            String id = JsonUtil.getString(body, "id", "");
            String newStatus = JsonUtil.getString(body, "status", "ACTIVE");
            for (Voucher v : voucherList) {
                if (v.getId().equalsIgnoreCase(id)) {
                    v.setStatus(newStatus);
                    sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Voucher status updated to " + JsonUtil.escape(newStatus) + "\",\"voucher\":" + v.toJson() + "}");
                    return;
                }
            }
            sendJsonResponse(exchange, 404, "{\"success\":false,\"message\":\"Voucher not found\"}");
        } else {
            sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
        }
    }

    // --- Notifications Management API ---
    public static class AppNotification {
        private String id;
        private String title;
        private String message;
        private String category; // "BOOKING", "PROMOTION", "APP_UPDATE", "ADS"
        private String senderRole; // "ADMIN", "AGENT", "SYSTEM"
        private String senderName;
        private String targetAudience; // "ALL_TRAVELERS" or specific ID
        private String timestamp;
        private String icon;
        private boolean isRead;

        public AppNotification(String id, String title, String message, String category, String senderRole, String senderName, String targetAudience, String timestamp, String icon, boolean isRead) {
            this.id = id;
            this.title = title;
            this.message = message;
            this.category = category;
            this.senderRole = senderRole;
            this.senderName = senderName;
            this.targetAudience = targetAudience;
            this.timestamp = timestamp;
            this.icon = icon;
            this.isRead = isRead;
        }

        public String getId() { return id; }
        public String getCategory() { return category; }
        public boolean isRead() { return isRead; }
        public void setRead(boolean read) { isRead = read; }

        public String toJson() {
            return "{"
                + "\"id\":\"" + JsonUtil.escape(id) + "\","
                + "\"title\":\"" + JsonUtil.escape(title) + "\","
                + "\"message\":\"" + JsonUtil.escape(message) + "\","
                + "\"category\":\"" + JsonUtil.escape(category) + "\","
                + "\"senderRole\":\"" + JsonUtil.escape(senderRole) + "\","
                + "\"senderName\":\"" + JsonUtil.escape(senderName) + "\","
                + "\"targetAudience\":\"" + JsonUtil.escape(targetAudience) + "\","
                + "\"timestamp\":\"" + JsonUtil.escape(timestamp) + "\","
                + "\"icon\":\"" + JsonUtil.escape(icon) + "\","
                + "\"isRead\":" + isRead
                + "}";
        }
    }

    private static final List<AppNotification> notificationList = new java.util.concurrent.CopyOnWriteArrayList<>();
    private static final java.util.concurrent.atomic.AtomicInteger notifSeq = new java.util.concurrent.atomic.AtomicInteger(100);

    static {
        notificationList.add(new AppNotification(
            "NOTIF-101",
            "\uD83C\uDF89 Flight & Resort Booking Confirmed!",
            "Your luxury Swiss Alps Chalet and Air France flight booking has been confirmed! Digital e-voucher & barcode are ready in your profile.",
            "BOOKING",
            "SYSTEM",
            "SHIV TRAVELS Booking Engine",
            "ALL_TRAVELERS",
            "Today, 10:30 AM",
            "\uD83C\uDF9F",
            false
        ));
        notificationList.add(new AppNotification(
            "NOTIF-102",
            "\uD83D\uDD25 20% Winter Holiday Flash Discount!",
            "Use promo voucher code SHIV20 at checkout for flat 20% off on all Ayodhya, Manali & Thailand hotel and flight bookings!",
            "PROMOTION",
            "ADMIN",
            "Nitin Chaudhary (Admin)",
            "ALL_TRAVELERS",
            "Yesterday, 04:15 PM",
            "\uD83C\uDF81",
            false
        ));
        notificationList.add(new AppNotification(
            "NOTIF-103",
            "\uD83D\uDE80 New App Update: 360 VR Tour & 24/7 Helplines",
            "We have upgraded SHIV TRAVELS with 360 VR interactive tours and 2 dedicated 24/7 Traveler Helplines (1800-123-8692 & WhatsApp +91 98765-43210).",
            "APP_UPDATE",
            "ADMIN",
            "SHIV TRAVELS Engineering",
            "ALL_TRAVELERS",
            "2 days ago",
            "\uD83D\uDCF1",
            false
        ));
        notificationList.add(new AppNotification(
            "NOTIF-104",
            "\uD83C\uDF1F Sponsored Deal: Luxury Ayodhya Ram Mandir VIP Darshan Pass",
            "Special 3-Day Ayodhya package with complimentary Sugam Aarti passes and luxury heritage stay. Book now with code EXPLORE1000 for Rs.1,000 off!",
            "ADS",
            "AGENT",
            "Aman Sharma (Travel Agent)",
            "ALL_TRAVELERS",
            "3 days ago",
            "\uD83D\uDCE2",
            true
        ));
    }

    private void handleNotifications(HttpExchange exchange, String method, String path, Map<String, String> queryParams, String body) throws IOException {
        if (method.equals("GET")) {
            String category = queryParams.getOrDefault("category", "ALL");
            List<AppNotification> filtered = notificationList;
            if (!"ALL".equalsIgnoreCase(category)) {
                filtered = notificationList.stream()
                        .filter(n -> n.getCategory().equalsIgnoreCase(category))
                        .collect(Collectors.toList());
            }

            long unreadCount = notificationList.stream().filter(n -> !n.isRead()).count();
            String items = filtered.stream().map(AppNotification::toJson).collect(Collectors.joining(","));
            String json = "{\"success\":true,\"unreadCount\":" + unreadCount + ",\"totalCount\":" + notificationList.size() + ",\"notifications\":[" + items + "]}";
            sendJsonResponse(exchange, 200, json);

        } else if (method.equals("POST")) {
            // Create & broadcast notification
            String title = JsonUtil.getString(body, "title", "").trim();
            String message = JsonUtil.getString(body, "message", "").trim();
            String category = JsonUtil.getString(body, "category", "GENERAL").trim().toUpperCase();
            String senderRole = JsonUtil.getString(body, "senderRole", "ADMIN").trim().toUpperCase();
            String senderName = JsonUtil.getString(body, "senderName", "System Admin").trim();
            String targetAudience = JsonUtil.getString(body, "targetAudience", "ALL_TRAVELERS").trim();

            if (title.isBlank() || message.isBlank()) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Title and message text are required.\"}");
                return;
            }

            String icon = "\uD83D\uDD14";
            if (category.contains("BOOKING")) icon = "\uD83C\uDF9F";
            else if (category.contains("PROMOTION") || category.contains("PROMO") || category.contains("OFFER")) icon = "\uD83C\uDF81";
            else if (category.contains("APP")) icon = "\uD83D\uDCF1";
            else if (category.contains("AD")) icon = "\uD83D\uDCE2";

            String id = "NOTIF-" + notifSeq.incrementAndGet();
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
            String timestamp = now.format(dtf);

            AppNotification notif = new AppNotification(id, title, message, category, senderRole, senderName, targetAudience, timestamp, icon, false);
            // Insert at beginning of list so latest is first
            notificationList.add(0, notif);

            sendJsonResponse(exchange, 201, "{\"success\":true,\"message\":\"Notification broadcasted successfully to all travelers!\",\"notification\":" + notif.toJson() + "}");

        } else if (method.equals("PUT")) {
            // Mark read
            String id = JsonUtil.getString(body, "id", "all").trim();
            if ("all".equalsIgnoreCase(id)) {
                for (AppNotification n : notificationList) {
                    n.setRead(true);
                }
                sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"All notifications marked as read.\"}");
            } else {
                boolean found = false;
                for (AppNotification n : notificationList) {
                    if (n.getId().equalsIgnoreCase(id)) {
                        n.setRead(true);
                        found = true;
                        break;
                    }
                }
                if (found) {
                    sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Notification marked as read.\"}");
                } else {
                    sendJsonResponse(exchange, 404, "{\"success\":false,\"message\":\"Notification not found.\"}");
                }
            }

        } else if (method.equals("DELETE")) {
            String id = queryParams.get("id");
            if (id != null && !id.isBlank()) {
                boolean removed = notificationList.removeIf(n -> n.getId().equalsIgnoreCase(id));
                if (removed) {
                    sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Notification deleted.\"}");
                    return;
                }
            }
            sendJsonResponse(exchange, 404, "{\"success\":false,\"message\":\"Notification not found.\"}");

        } else {
            sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
        }
    }

    // --- Helpers ---
    private void sendJsonResponse(HttpExchange exchange, int statusCode, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private String readRequestBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private Map<String, String> parseQueryParams(String query) {
        Map<String, String> map = new HashMap<>();
        if (query == null || query.isBlank()) return map;
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf("=");
            if (idx > 0 && idx < pair.length() - 1) {
                String key = java.net.URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8);
                String val = java.net.URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8);
                map.put(key, val);
            } else if (idx > 0) {
                String key = java.net.URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8);
                map.put(key, "");
            }
        }
        return map;
    }
}
