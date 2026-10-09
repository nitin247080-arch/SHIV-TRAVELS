package com.travelbooking;

import com.travelbooking.models.*;
import com.travelbooking.storage.DataStore;

import java.util.List;
import java.util.Scanner;

public class ConsoleApp {
    private static final DataStore store = DataStore.getInstance();
    private static final Scanner scanner = new Scanner(System.in);

    public static void main(String[] args) {
        // Sync exact credentials and accounts
        store.updateUser("USR-001", "Nitin Chaudhary", "nitin.admin@travel.com", "ADMIN", "+91 98111 22334", "ACTIVE", "admin123", 0, "User Management, Listing Approvals, System Settings (GST %, Commission), Revenue & Booking Overview");
        store.updateUser("USR-002", "Aman Sharma", "agent@travel.com", "AGENT", "+91 98222 33445", "ACTIVE", "agent123", 0, "Manage Listings, User Interaction, Track Bookings");
        store.updateUser("USR-003", "Nitin", "nitin@traveler.com", "TRAVELER", "+91 98333 44556", "ACTIVE", "pass123", 1500, "Book Flights / Hotels / Cars, View & Export Itinerary, Loyalty Points");
        store.updateUser("USR-004", "Ashutosh", "ashutosh@traveler.com", "TRAVELER", "+91 98444 55667", "ACTIVE", "pass123", 450, "Bookings, Cancel Reservations, Chat with Agent");
        store.updateUser("USR-005", "Himanshu", "himanshu@traveler.com", "TRAVELER", "+91 98555 66778", "ACTIVE", "pass123", 600, "Bookings, Itinerary Viewer, Feedback Desk");
        store.deleteUser("USR-006");

        System.out.println("==========================================================");
        System.out.println("  SHIV TRAVELS TRAVEL PLATFORM - CONSOLE INTERACTIVE MODE ");
        System.out.println("   B.Tech 3rd Semester OOP & Project Demonstration        ");
        System.out.println("==========================================================");

        boolean running = true;
        while (running) {
            System.out.println("\nSelect Role to Proceed:");
            System.out.println("1. Administrator Dashboard");
            System.out.println("2. Travel Agent Dashboard");
            System.out.println("3. Traveler Booking Portal");
            System.out.println("4. Exit Console Mode");
            System.out.print("Enter choice (1-4): ");

            String choice = scanner.nextLine().trim();
            switch (choice) {
                case "1":
                    adminMenu();
                    break;
                case "2":
                    agentMenu();
                    break;
                case "3":
                    travelerMenu();
                    break;
                case "4":
                    running = false;
                    System.out.println("Exiting SHIV TRAVELS Console. Goodbye!");
                    break;
                default:
                    System.out.println("[!] Invalid option. Please choose 1-4.");
            }
        }
    }

    private static void adminMenu() {
        boolean back = false;
        while (!back) {
            System.out.println("\n--- [ADMIN DASHBOARD] ---");
            System.out.println("1. List All Users");
            System.out.println("2. Add New User");
            System.out.println("3. Review Travel Listings (Approve/Reject)");
            System.out.println("4. View & Update System Settings");
            System.out.println("5. View Platform Booking Statistics");
            System.out.println("6. Back to Main Menu");
            System.out.print("Choice: ");

            String choice = scanner.nextLine().trim();
            switch (choice) {
                case "1":
                    System.out.println("\nRegistered Users:");
                    for (User u : store.getAllUsers()) {
                        System.out.printf("  [%s] %s | %s | Password: %s | Role: %s | Loyalty: %d pts | Status: %s\n      Features: %s\n",
                                u.getId(), u.getName(), u.getEmail(), u.getPassword(), u.getRole(), u.getLoyaltyPoints(), u.getStatus(), u.getFeatures());
                    }
                    break;
                case "2":
                    System.out.print("Enter Name: ");
                    String name = scanner.nextLine().trim();
                    System.out.print("Enter Email: ");
                    String email = scanner.nextLine().trim();
                    System.out.print("Enter Role (ADMIN / AGENT / TRAVELER): ");
                    String role = scanner.nextLine().trim().toUpperCase();
                    System.out.print("Enter Phone: ");
                    String phone = scanner.nextLine().trim();
                    User created = store.addUser(name, email, role, phone);
                    System.out.println("[+] User created successfully with ID: " + created.getId());
                    break;
                case "3":
                    System.out.println("\nPending Listings for Review:");
                    List<TravelListing> all = store.getAllListings();
                    int count = 0;
                    for (TravelListing l : all) {
                        System.out.printf("  [%s] %s | Type: %s | Price: ₹%.0f | Status: %s\n",
                                l.getId(), l.getTitle(), l.getType(), l.getPrice(), l.getStatus());
                        if (l.getStatus() == ListingStatus.PENDING) count++;
                    }
                    if (count > 0) {
                        System.out.print("\nEnter Listing ID to update status (or press enter to skip): ");
                        String lid = scanner.nextLine().trim();
                        if (!lid.isBlank()) {
                            System.out.print("Set status (1: APPROVED, 2: REJECTED): ");
                            String stChoice = scanner.nextLine().trim();
                            ListingStatus ns = "1".equals(stChoice) ? ListingStatus.APPROVED : ListingStatus.REJECTED;
                            if (store.updateListingStatus(lid, ns)) {
                                System.out.println("[+] Listing status updated to " + ns);
                            } else {
                                System.out.println("[-] Listing ID not found.");
                            }
                        }
                    }
                    break;
                case "4":
                    SystemSettings s = store.getSystemSettings();
                    System.out.println("\nCurrent System Settings:");
                    System.out.println("  Platform Name: " + s.getPlatformName());
                    System.out.println("  Currency:      " + s.getCurrencySymbol() + " (" + s.getCurrencyCode() + ")");
                    System.out.println("  Tax Rate:      " + s.getDefaultTaxRate() + "%");
                    System.out.println("  Contact Email: " + s.getContactEmail());
                    System.out.println("  Support Phone: " + s.getSupportPhone());
                    break;
                case "5":
                    System.out.println("\nBooking Statistics:");
                    System.out.println("  Total Bookings: " + store.getAllBookings().size());
                    double rev = store.getAllBookings().stream()
                            .filter(b -> !"CANCELLED".equals(b.getStatus()))
                            .mapToDouble(Booking::getTotalPrice).sum();
                    System.out.printf("  Total Confirmed Revenue: ₹%.2f\n", rev);
                    break;
                case "6":
                    back = true;
                    break;
                default:
                    System.out.println("[!] Invalid choice.");
            }
        }
    }

    private static void agentMenu() {
        boolean back = false;
        while (!back) {
            System.out.println("\n--- [TRAVEL AGENT DASHBOARD] ---");
            System.out.println("1. Submit New Travel Listing (Flight/Hotel/Car)");
            System.out.println("2. View My Listings");
            System.out.println("3. Track All Bookings");
            System.out.println("4. User Communications & Feedback Messages");
            System.out.println("5. Back to Main Menu");
            System.out.print("Choice: ");

            String choice = scanner.nextLine().trim();
            switch (choice) {
                case "1":
                    System.out.print("Title: ");
                    String title = scanner.nextLine().trim();
                    System.out.print("Type (1: FLIGHT, 2: HOTEL, 3: CAR_RENTAL): ");
                    String tc = scanner.nextLine().trim();
                    ListingType lt = "1".equals(tc) ? ListingType.FLIGHT : ("3".equals(tc) ? ListingType.CAR_RENTAL : ListingType.HOTEL);
                    System.out.print("Destination / Location: ");
                    String loc = scanner.nextLine().trim();
                    System.out.print("Price (₹): ");
                    double pr = Double.parseDouble(scanner.nextLine().trim());
                    System.out.print("Key Features / Amenities: ");
                    String feats = scanner.nextLine().trim();

                    TravelListing tl = new TravelListing(null, title, lt, loc, "", loc, pr, 4.8,
                            "/assets/images/taj_mahal.webp", ListingStatus.PENDING, "USR-002", "Priya Patel",
                            "New listing created via Console CLI", feats, 10, false);
                    store.addListing(tl);
                    System.out.println("[+] Listing submitted successfully! Sent to Admin for approval.");
                    break;
                case "2":
                    System.out.println("\nCurrent Travel Listings:");
                    for (TravelListing l : store.getAllListings()) {
                        System.out.printf("  [%s] %s (%s) - ₹%.0f [%s]\n",
                                l.getId(), l.getTitle(), l.getType(), l.getPrice(), l.getStatus());
                    }
                    break;
                case "3":
                    System.out.println("\nBookings Tracker:");
                    for (Booking b : store.getAllBookings()) {
                        System.out.printf("  [%s] %s booked '%s' on %s | Total: ₹%.2f | Status: %s\n",
                                b.getId(), b.getTravelerName(), b.getListingTitle(), b.getTravelDate(), b.getTotalPrice(), b.getStatus());
                    }
                    break;
                case "4":
                    System.out.println("\nUser Messages & Inquiries:");
                    for (Message m : store.getAllMessages()) {
                        System.out.printf("  [%s] From: %s (%s) | Subject: %s\n      Message: %s\n",
                                m.getId(), m.getSenderName(), m.getSenderRole(), m.getSubject(), m.getMessageText());
                    }
                    break;
                case "5":
                    back = true;
                    break;
                default:
                    System.out.println("[!] Invalid choice.");
            }
        }
    }

    private static void travelerMenu() {
        boolean back = false;
        while (!back) {
            System.out.println("\n--- [TRAVELER PORTAL] ---");
            System.out.println("1. Browse Available Flights, Hotels & Car Rentals");
            System.out.println("2. Book a Travel Listing");
            System.out.println("3. View My Bookings");
            System.out.println("4. View Travel Itineraries");
            System.out.println("5. Create New Travel Itinerary");
            System.out.println("6. Send Inquiry / Feedback to Travel Agent");
            System.out.println("7. Back to Main Menu");
            System.out.print("Choice: ");

            String choice = scanner.nextLine().trim();
            switch (choice) {
                case "1":
                    System.out.println("\nFeatured & Approved Destinations:");
                    for (TravelListing l : store.getApprovedListings()) {
                        System.out.printf("  [%s] %s\n      Category: %s | Location: %s | Price: ₹%.0f | Rating: ★%.1f\n",
                                l.getId(), l.getTitle(), l.getType(), l.getLocation(), l.getPrice(), l.getRating());
                    }
                    break;
                case "2":
                    System.out.print("Enter Listing ID to Book: ");
                    String lid = scanner.nextLine().trim();
                    TravelListing l = store.getListingById(lid);
                    if (l == null) {
                        System.out.println("[-] Listing not found.");
                        break;
                    }
                    System.out.print("Enter Travel Date (YYYY-MM-DD): ");
                    String td = scanner.nextLine().trim();
                    System.out.print("Enter Number of Units (Guests/Tickets/Days): ");
                    int units = Integer.parseInt(scanner.nextLine().trim());
                    System.out.print("Enter Special Requests (e.g., Sea View, High Floor): ");
                    String spec = scanner.nextLine().trim();
                    System.out.print("Payment Method (1: UPI, 2: Card, 3: NetBanking): ");
                    String pm = "1".equals(scanner.nextLine().trim()) ? "UPI" : "Card";

                    Booking b = store.createBooking("USR-004", "Rahul Verma", "rahul@gmail.com",
                            "+91 98444 55667", lid, td, "", units, spec, pm);
                    if (b != null) {
                        System.out.println("\n[+] BOOKING CONFIRMED!");
                        System.out.printf("    Booking ID: %s\n    Listing: %s\n    Total Amount: ₹%.2f (incl. tax)\n    Status: %s\n",
                                b.getId(), b.getListingTitle(), b.getTotalPrice(), b.getStatus());
                    }
                    break;
                case "3":
                    System.out.println("\nMy Bookings:");
                    for (Booking bk : store.getBookingsByTraveler("USR-004")) {
                        System.out.printf("  [%s] %s | Date: %s | Total: ₹%.2f | Status: %s\n",
                                bk.getId(), bk.getListingTitle(), bk.getTravelDate(), bk.getTotalPrice(), bk.getStatus());
                    }
                    break;
                case "4":
                    System.out.println("\nTravel Itineraries:");
                    for (Itinerary it : store.getItinerariesByTraveler("USR-004")) {
                        System.out.printf("  [%s] %s (%s to %s)\n      Budget: ₹%.0f | Cost: ₹%.0f\n      Plan: %s\n",
                                it.getId(), it.getTripTitle(), it.getStartDate(), it.getEndDate(),
                                it.getEstimatedBudget(), it.getTotalCost(), it.getPlanDetails());
                    }
                    break;
                case "5":
                    System.out.print("Trip Title: ");
                    String tt = scanner.nextLine().trim();
                    System.out.print("Destination: ");
                    String dest = scanner.nextLine().trim();
                    System.out.print("Start Date (YYYY-MM-DD): ");
                    String sd = scanner.nextLine().trim();
                    System.out.print("End Date (YYYY-MM-DD): ");
                    String ed = scanner.nextLine().trim();
                    System.out.print("Estimated Budget (₹): ");
                    double bd = Double.parseDouble(scanner.nextLine().trim());
                    System.out.print("Day-by-Day Plan: ");
                    String plan = scanner.nextLine().trim();

                    Itinerary newIt = store.addItinerary("USR-004", "Rahul Verma", tt, dest, sd, ed, bd, bd * 0.9, plan);
                    System.out.println("[+] Itinerary planned successfully with ID: " + newIt.getId());
                    break;
                case "6":
                    System.out.print("Subject: ");
                    String subj = scanner.nextLine().trim();
                    System.out.print("Message for Travel Agent: ");
                    String msg = scanner.nextLine().trim();
                    store.addMessage("USR-004", "Rahul Verma", "TRAVELER", "USR-002", "Priya Patel", subj, msg, "");
                    System.out.println("[+] Message sent successfully to Travel Agent!");
                    break;
                case "7":
                    back = true;
                    break;
                default:
                    System.out.println("[!] Invalid choice.");
            }
        }
    }
}
