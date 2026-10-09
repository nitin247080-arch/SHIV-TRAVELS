package com.travelbooking.models;

public enum BookingStatus {
    PENDING,
    CONFIRMED,
    CANCELLED;

    public static BookingStatus fromString(String val) {
        if (val == null) return CONFIRMED;
        val = val.trim().toUpperCase();
        for (BookingStatus status : values()) {
            if (status.name().equals(val)) return status;
        }
        return CONFIRMED;
    }
}
