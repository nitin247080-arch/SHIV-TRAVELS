package com.travelbooking.models;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class TravelListing {
    private String id;
    private String title;
    private ListingType type;
    private String location;
    private String origin;
    private String destination;
    private double price;
    private double rating;
    private String imageUrl;
    private ListingStatus status;
    private String agentId;
    private String agentName;
    private String description;
    private String features;
    private int availableUnits;
    private boolean featured;
    private String createdAt;

    public TravelListing() {
        this.status = ListingStatus.PENDING;
        this.rating = 4.8;
        this.availableUnits = 20;
        this.createdAt = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }

    public TravelListing(String id, String title, ListingType type, String location,
                         String origin, String destination, double price, double rating,
                         String imageUrl, ListingStatus status, String agentId,
                         String agentName, String description, String features,
                         int availableUnits, boolean featured) {
        this.id = id;
        this.title = title;
        this.type = type;
        this.location = location;
        this.origin = origin != null ? origin : "";
        this.destination = destination != null ? destination : location;
        this.price = price;
        this.rating = rating;
        this.imageUrl = imageUrl;
        this.status = status != null ? status : ListingStatus.PENDING;
        this.agentId = agentId;
        this.agentName = agentName;
        this.description = description;
        this.features = features;
        this.availableUnits = availableUnits;
        this.featured = featured;
        this.createdAt = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public ListingType getType() { return type; }
    public void setType(ListingType type) { this.type = type; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public ListingStatus getStatus() { return status; }
    public void setStatus(ListingStatus status) { this.status = status; }

    public String getAgentId() { return agentId; }
    public void setAgentId(String agentId) { this.agentId = agentId; }

    public String getAgentName() { return agentName; }
    public void setAgentName(String agentName) { this.agentName = agentName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getFeatures() { return features; }
    public void setFeatures(String features) { this.features = features; }

    public int getAvailableUnits() { return availableUnits; }
    public void setAvailableUnits(int availableUnits) { this.availableUnits = availableUnits; }

    public boolean isFeatured() { return featured; }
    public void setFeatured(boolean featured) { this.featured = featured; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String toJson() {
        return "{"
                + "\"id\":\"" + escape(id) + "\","
                + "\"title\":\"" + escape(title) + "\","
                + "\"type\":\"" + (type != null ? type.name() : "HOTEL") + "\","
                + "\"location\":\"" + escape(location) + "\","
                + "\"origin\":\"" + escape(origin) + "\","
                + "\"destination\":\"" + escape(destination) + "\","
                + "\"price\":" + price + ","
                + "\"rating\":" + rating + ","
                + "\"imageUrl\":\"" + escape(imageUrl) + "\","
                + "\"status\":\"" + (status != null ? status.name() : "PENDING") + "\","
                + "\"agentId\":\"" + escape(agentId) + "\","
                + "\"agentName\":\"" + escape(agentName) + "\","
                + "\"description\":\"" + escape(description) + "\","
                + "\"features\":\"" + escape(features) + "\","
                + "\"availableUnits\":" + availableUnits + ","
                + "\"featured\":" + featured + ","
                + "\"createdAt\":\"" + escape(createdAt) + "\""
                + "}";
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
