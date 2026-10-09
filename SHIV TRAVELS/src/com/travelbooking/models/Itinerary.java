package com.travelbooking.models;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class Itinerary {
    private String id;
    private String travelerId;
    private String travelerName;
    private String tripTitle;
    private String destination;
    private String startDate;
    private String endDate;
    private double estimatedBudget;
    private double totalCost;
    private String status; // "PLANNED", "CONFIRMED", "COMPLETED"
    private String planDetails; // Day-wise itinerary string or JSON
    private String createdAt;

    public Itinerary() {
        this.status = "PLANNED";
        this.createdAt = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }

    public Itinerary(String id, String travelerId, String travelerName, String tripTitle,
                     String destination, String startDate, String endDate,
                     double estimatedBudget, double totalCost, String status,
                     String planDetails) {
        this.id = id;
        this.travelerId = travelerId;
        this.travelerName = travelerName;
        this.tripTitle = tripTitle;
        this.destination = destination;
        this.startDate = startDate;
        this.endDate = endDate;
        this.estimatedBudget = estimatedBudget;
        this.totalCost = totalCost;
        this.status = status != null ? status : "PLANNED";
        this.planDetails = planDetails != null ? planDetails : "";
        this.createdAt = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTravelerId() { return travelerId; }
    public void setTravelerId(String travelerId) { this.travelerId = travelerId; }

    public String getTravelerName() { return travelerName; }
    public void setTravelerName(String travelerName) { this.travelerName = travelerName; }

    public String getTripTitle() { return tripTitle; }
    public void setTripTitle(String tripTitle) { this.tripTitle = tripTitle; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    public double getEstimatedBudget() { return estimatedBudget; }
    public void setEstimatedBudget(double estimatedBudget) { this.estimatedBudget = estimatedBudget; }

    public double getTotalCost() { return totalCost; }
    public void setTotalCost(double totalCost) { this.totalCost = totalCost; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPlanDetails() { return planDetails; }
    public void setPlanDetails(String planDetails) { this.planDetails = planDetails; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String toJson() {
        return "{"
                + "\"id\":\"" + escape(id) + "\","
                + "\"travelerId\":\"" + escape(travelerId) + "\","
                + "\"travelerName\":\"" + escape(travelerName) + "\","
                + "\"tripTitle\":\"" + escape(tripTitle) + "\","
                + "\"destination\":\"" + escape(destination) + "\","
                + "\"startDate\":\"" + escape(startDate) + "\","
                + "\"endDate\":\"" + escape(endDate) + "\","
                + "\"estimatedBudget\":" + estimatedBudget + ","
                + "\"totalCost\":" + totalCost + ","
                + "\"status\":\"" + escape(status) + "\","
                + "\"planDetails\":\"" + escape(planDetails) + "\","
                + "\"createdAt\":\"" + escape(createdAt) + "\""
                + "}";
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
