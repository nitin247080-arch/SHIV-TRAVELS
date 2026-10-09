package com.travelbooking;

import com.sun.net.httpserver.HttpServer;
import com.travelbooking.handlers.ApiHandler;
import com.travelbooking.handlers.StaticFileHandler;
import com.travelbooking.storage.DataStore;

import java.awt.Desktop;
import java.io.File;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.util.concurrent.Executors;

public class Main {
    private static final int DEFAULT_PORT = 8181;

    public static void main(String[] args) {
        int port = DEFAULT_PORT;
        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException ignored) {}
        }

        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

            // Handlers
            server.createContext("/api", new ApiHandler());
            server.createContext("/", new StaticFileHandler("web"));

            // Concurrency executor
            server.setExecutor(Executors.newFixedThreadPool(10));
            server.start();

            // Initialize data
            DataStore store = DataStore.getInstance();
            // Sync exact project credentials and profiles
            store.updateUser("USR-001", "Nitin Chaudhary", "nitin.admin@travel.com", "ADMIN", "+91 98111 22334", "ACTIVE", "admin123", 0, "User Management, Listing Approvals, System Settings (GST %, Commission), Revenue & Booking Overview");
            store.updateUser("USR-002", "Aman Sharma", "agent@travel.com", "AGENT", "+91 98222 33445", "ACTIVE", "agent123", 0, "Manage Listings, User Interaction, Track Bookings");
            store.updateUser("USR-003", "Nitin", "nitin@traveler.com", "TRAVELER", "+91 98333 44556", "ACTIVE", "pass123", 1500, "Book Flights / Hotels / Cars, View & Export Itinerary, Loyalty Points");
            store.updateUser("USR-004", "Ashutosh", "ashutosh@traveler.com", "TRAVELER", "+91 98444 55667", "ACTIVE", "pass123", 450, "Bookings, Cancel Reservations, Chat with Agent");
            store.updateUser("USR-005", "Himanshu", "himanshu@traveler.com", "TRAVELER", "+91 98555 66778", "ACTIVE", "pass123", 600, "Bookings, Itinerary Viewer, Feedback Desk");
            store.deleteUser("USR-006");

            // Check database connectivity
            boolean dbConnected = com.travelbooking.database.DBConnection.checkConnection(true);

            String url = "http://localhost:" + port;

            System.out.println("==================================================================");
            System.out.println("      SHIV TRAVELS - ONLINE TRAVEL BOOKING PLATFORM (JAVA 17)     ");
            System.out.println("       B.Tech Computer Science & Engineering - Semester 3         ");
            System.out.println("==================================================================");
            System.out.println("[+] Server successfully started on: " + url);
            System.out.println("[+] Platform REST APIs live on:     " + url + "/api/stats");
            System.out.println("[+] Database Engine:               " + (dbConnected ? "MySQL 8.0 (voyagehub_db)" : "In-Memory DataStore (Dual-mode fallback)"));
            System.out.println("[+] Serving Web UI from:            web/index.html");
            System.out.println("[+] Local Image Assets loaded:     assets/images/");
            System.out.println("------------------------------------------------------------------");
            System.out.println("Available Roles:");
            System.out.println("  1. Admin        (Manage Users, Approve/Reject Listings, System Settings)");
            System.out.println("  2. Travel Agent (Submit Listings, Inquiries & Feedback, Track Bookings)");
            System.out.println("  3. Traveler     (Book Flights/Hotels/Cars, My Bookings, Itineraries)");
            System.out.println("------------------------------------------------------------------");
            System.out.println("Open in Browser: " + url);
            System.out.println("Press Ctrl+C to stop the server.");
            System.out.println("==================================================================");

            // Attempt to open default browser if supported
            if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                try {
                    Desktop.getDesktop().browse(new URI(url));
                } catch (Exception ignored) {}
            }

        } catch (IOException e) {
            System.err.println("[-] Error starting server on port " + port + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
}
