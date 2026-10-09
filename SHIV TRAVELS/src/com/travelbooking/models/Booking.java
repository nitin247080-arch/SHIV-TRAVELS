package com.travelbooking.models;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class Booking {
    private String id;
    private String travelerId;
    private String travelerName;
    private int travelerAge;
    private String travelerEmail;
    private String travelerPhone;
    private String listingId;
    private String listingTitle;
    private ListingType listingType;
    private String destination;
    private String bookingDate;
    private String travelDate;
    private String returnDate;
    private int units; // passengers / rooms / rental days
    private double pricePerUnit;
    private boolean hasReturnTicket;
    private double oneWayFare;
    private double returnFare;
    private double subtotal;
    private double taxAmount;
    private double totalPrice;
    private BookingStatus status; // CONFIRMED, PENDING, CANCELLED
    private String specialRequests;
    private String paymentMethod;
    private String paymentStatus;
    private String pickupLocation;
    private String vehicleType;

    public Booking() {
        this.status = BookingStatus.CONFIRMED;
        this.paymentStatus = "PAID";
        this.paymentMethod = "UPI";
        this.bookingDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        this.pickupLocation = "";
        this.vehicleType = "";
        this.hasReturnTicket = false;
        this.oneWayFare = 0.0;
        this.returnFare = 0.0;
        this.subtotal = 0.0;
        this.travelerAge = 0;
    }

    public Booking(String id, String travelerId, String travelerName, String travelerEmail,
                   String travelerPhone, String listingId, String listingTitle,
                   ListingType listingType, String destination, String travelDate,
                   String returnDate, int units, double pricePerUnit, double taxRate,
                   String specialRequests, String paymentMethod) {
        this(id, travelerId, travelerName, 0, travelerEmail, travelerPhone, listingId, listingTitle,
             listingType, destination, travelDate, returnDate, units, pricePerUnit, taxRate,
             specialRequests, paymentMethod, "", "", BookingStatus.CONFIRMED,
             (listingType == ListingType.FLIGHT && returnDate != null && !returnDate.trim().isEmpty()));
    }

    public Booking(String id, String travelerId, String travelerName, String travelerEmail,
                   String travelerPhone, String listingId, String listingTitle,
                   ListingType listingType, String destination, String travelDate,
                   String returnDate, int units, double pricePerUnit, double taxRate,
                   String specialRequests, String paymentMethod,
                   String pickupLocation, String vehicleType, BookingStatus status) {
        this(id, travelerId, travelerName, 0, travelerEmail, travelerPhone, listingId, listingTitle,
             listingType, destination, travelDate, returnDate, units, pricePerUnit, taxRate,
             specialRequests, paymentMethod, pickupLocation, vehicleType, status,
             (listingType == ListingType.FLIGHT && returnDate != null && !returnDate.trim().isEmpty()));
    }

    public Booking(String id, String travelerId, String travelerName, String travelerEmail,
                   String travelerPhone, String listingId, String listingTitle,
                   ListingType listingType, String destination, String travelDate,
                   String returnDate, int units, double pricePerUnit, double taxRate,
                   String specialRequests, String paymentMethod,
                   String pickupLocation, String vehicleType, BookingStatus status,
                   boolean hasReturnTicket) {
        this(id, travelerId, travelerName, 0, travelerEmail, travelerPhone, listingId, listingTitle,
             listingType, destination, travelDate, returnDate, units, pricePerUnit, taxRate,
             specialRequests, paymentMethod, pickupLocation, vehicleType, status, hasReturnTicket);
    }

    public Booking(String id, String travelerId, String travelerName, int travelerAge, String travelerEmail,
                   String travelerPhone, String listingId, String listingTitle,
                   ListingType listingType, String destination, String travelDate,
                   String returnDate, int units, double pricePerUnit, double taxRate,
                   String specialRequests, String paymentMethod,
                   String pickupLocation, String vehicleType, BookingStatus status,
                   boolean hasReturnTicket) {
        this.id = id;
        this.travelerId = travelerId;
        this.travelerName = travelerName;
        this.travelerAge = Math.max(0, travelerAge);
        this.travelerEmail = travelerEmail;
        this.travelerPhone = travelerPhone != null ? travelerPhone : "";
        this.listingId = listingId;
        this.listingTitle = listingTitle;
        this.listingType = listingType;
        this.destination = destination;
        this.travelDate = travelDate;
        this.returnDate = returnDate != null ? returnDate : "";
        this.units = Math.max(1, units);
        this.pricePerUnit = pricePerUnit;

        boolean isFlight = (this.listingType == ListingType.FLIGHT);
        if (hasReturnTicket) {
            this.hasReturnTicket = true;
        } else if (isFlight && this.returnDate != null && !this.returnDate.trim().isEmpty()) {
            this.hasReturnTicket = true;
        } else if (isFlight && specialRequests != null && specialRequests.toLowerCase().contains("return ticket")) {
            this.hasReturnTicket = true;
        } else {
            this.hasReturnTicket = false;
        }

        this.oneWayFare = Math.round((this.units * this.pricePerUnit) * 100.0) / 100.0;
        if (isFlight && this.hasReturnTicket) {
            this.returnFare = Math.round((this.units * this.pricePerUnit) * 100.0) / 100.0;
            this.subtotal = Math.round((this.oneWayFare + this.returnFare) * 100.0) / 100.0;
        } else {
            this.returnFare = 0.0;
            this.subtotal = this.oneWayFare;
        }

        this.taxAmount = Math.round((this.subtotal * (taxRate / 100.0)) * 100.0) / 100.0;
        this.totalPrice = Math.round((this.subtotal + this.taxAmount) * 100.0) / 100.0;
        this.status = status != null ? status : BookingStatus.CONFIRMED;
        this.paymentMethod = paymentMethod != null ? paymentMethod : "UPI";
        this.paymentStatus = "PAID";
        this.specialRequests = specialRequests != null ? specialRequests : "";
        this.pickupLocation = pickupLocation != null ? pickupLocation : "";
        this.vehicleType = vehicleType != null ? vehicleType : "";
        this.bookingDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTravelerId() { return travelerId; }
    public void setTravelerId(String travelerId) { this.travelerId = travelerId; }

    public String getTravelerName() { return travelerName; }
    public void setTravelerName(String travelerName) { this.travelerName = travelerName; }

    public int getTravelerAge() { return travelerAge; }
    public void setTravelerAge(int travelerAge) { this.travelerAge = Math.max(0, travelerAge); }

    public String getTravelerEmail() { return travelerEmail; }
    public void setEmail(String travelerEmail) { this.travelerEmail = travelerEmail; }

    public String getTravelerPhone() { return travelerPhone; }
    public void setTravelerPhone(String travelerPhone) { this.travelerPhone = travelerPhone; }

    public String getListingId() { return listingId; }
    public void setListingId(String listingId) { this.listingId = listingId; }

    public String getListingTitle() { return listingTitle; }
    public void setListingTitle(String listingTitle) { this.listingTitle = listingTitle; }

    public ListingType getListingType() { return listingType; }
    public void setListingType(ListingType listingType) { this.listingType = listingType; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public String getBookingDate() { return bookingDate; }
    public void setBookingDate(String bookingDate) { this.bookingDate = bookingDate; }

    public String getTravelDate() { return travelDate; }
    public void setTravelDate(String travelDate) { this.travelDate = travelDate; }

    public String getReturnDate() { return returnDate; }
    public void setReturnDate(String returnDate) { this.returnDate = returnDate; }

    public int getUnits() { return units; }
    public void setUnits(int units) { this.units = units; }

    public double getPricePerUnit() { return pricePerUnit; }
    public void setPricePerUnit(double pricePerUnit) { this.pricePerUnit = pricePerUnit; }

    public double getTaxAmount() { return taxAmount; }
    public void setTaxAmount(double taxAmount) { this.taxAmount = taxAmount; }

    public double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(double totalPrice) { this.totalPrice = totalPrice; }

    public String getStatus() { return status != null ? status.name() : "CONFIRMED"; }
    public BookingStatus getBookingStatus() { return status; }
    public void setStatus(String status) { this.status = BookingStatus.fromString(status); }
    public void setBookingStatus(BookingStatus status) { this.status = status; }

    public String getPickupLocation() { return pickupLocation; }
    public void setPickupLocation(String pickupLocation) { this.pickupLocation = pickupLocation; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getSpecialRequests() { return specialRequests; }
    public void setSpecialRequests(String specialRequests) { this.specialRequests = specialRequests; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public boolean isHasReturnTicket() { return hasReturnTicket; }
    public boolean getHasReturnTicket() { return hasReturnTicket; }
    public void setHasReturnTicket(boolean hasReturnTicket) { this.hasReturnTicket = hasReturnTicket; }

    public double getOneWayFare() { return oneWayFare; }
    public void setOneWayFare(double oneWayFare) { this.oneWayFare = oneWayFare; }

    public double getReturnFare() { return returnFare; }
    public void setReturnFare(double returnFare) { this.returnFare = returnFare; }

    public double getSubtotal() { return subtotal; }
    public void setSubtotal(double subtotal) { this.subtotal = subtotal; }

    public String toJson() {
        return "{"
                + "\"id\":\"" + escape(id) + "\","
                + "\"travelerId\":\"" + escape(travelerId) + "\","
                + "\"travelerName\":\"" + escape(travelerName) + "\","
                + "\"travelerAge\":" + travelerAge + ","
                + "\"travelerEmail\":\"" + escape(travelerEmail) + "\","
                + "\"travelerPhone\":\"" + escape(travelerPhone) + "\","
                + "\"listingId\":\"" + escape(listingId) + "\","
                + "\"listingTitle\":\"" + escape(listingTitle) + "\","
                + "\"listingType\":\"" + (listingType != null ? listingType.name() : "HOTEL") + "\","
                + "\"destination\":\"" + escape(destination) + "\","
                + "\"bookingDate\":\"" + escape(bookingDate) + "\","
                + "\"travelDate\":\"" + escape(travelDate) + "\","
                + "\"returnDate\":\"" + escape(returnDate) + "\","
                + "\"pickupLocation\":\"" + escape(pickupLocation) + "\","
                + "\"vehicleType\":\"" + escape(vehicleType) + "\","
                + "\"units\":" + units + ","
                + "\"pricePerUnit\":" + pricePerUnit + ","
                + "\"hasReturnTicket\":" + hasReturnTicket + ","
                + "\"oneWayFare\":" + oneWayFare + ","
                + "\"returnFare\":" + returnFare + ","
                + "\"subtotal\":" + subtotal + ","
                + "\"taxAmount\":" + taxAmount + ","
                + "\"totalPrice\":" + totalPrice + ","
                + "\"status\":\"" + (status != null ? status.name() : "CONFIRMED") + "\","
                + "\"specialRequests\":\"" + escape(specialRequests) + "\","
                + "\"paymentMethod\":\"" + escape(paymentMethod) + "\","
                + "\"paymentStatus\":\"" + escape(paymentStatus) + "\""
                + "}";
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
