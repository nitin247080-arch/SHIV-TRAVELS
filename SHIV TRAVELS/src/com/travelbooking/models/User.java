package com.travelbooking.models;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class User {
    private String id;
    private String name;
    private String email;
    private String role; // "ADMIN", "AGENT", "TRAVELER"
    private String phone;
    private String status; // "ACTIVE", "INACTIVE"
    private String password;
    private int loyaltyPoints;
    private String features;
    private String createdAt;

    public User() {
        this.createdAt = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        this.status = "ACTIVE";
        this.password = "pass123";
        this.loyaltyPoints = 0;
        this.features = "";
    }

    public User(String id, String name, String email, String role, String phone, String status) {
        this(id, name, email, role, phone, status, "pass123", 0, "");
    }

    public User(String id, String name, String email, String role, String phone, String status, String password, int loyaltyPoints, String features) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role != null ? role.toUpperCase() : "TRAVELER";
        this.phone = phone != null ? phone : "";
        this.status = status != null ? status : "ACTIVE";
        this.password = password != null ? password : "pass123";
        this.loyaltyPoints = loyaltyPoints;
        this.features = features != null ? features : "";
        this.createdAt = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public int getLoyaltyPoints() { return loyaltyPoints; }
    public void setLoyaltyPoints(int loyaltyPoints) { this.loyaltyPoints = loyaltyPoints; }

    public String getFeatures() { return features; }
    public void setFeatures(String features) { this.features = features; }

    public String toJson() {
        return "{"
                + "\"id\":\"" + escape(id) + "\","
                + "\"name\":\"" + escape(name) + "\","
                + "\"email\":\"" + escape(email) + "\","
                + "\"role\":\"" + escape(role) + "\","
                + "\"phone\":\"" + escape(phone) + "\","
                + "\"status\":\"" + escape(status) + "\","
                + "\"password\":\"" + escape(password) + "\","
                + "\"loyaltyPoints\":" + loyaltyPoints + ","
                + "\"features\":\"" + escape(features) + "\","
                + "\"createdAt\":\"" + escape(createdAt) + "\""
                + "}";
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
