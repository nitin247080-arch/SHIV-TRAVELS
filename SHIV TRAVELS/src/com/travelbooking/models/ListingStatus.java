package com.travelbooking.models;

public enum ListingStatus {
    PENDING,
    APPROVED,
    REJECTED;

    public static ListingStatus fromString(String val) {
        if (val == null) return PENDING;
        val = val.trim().toUpperCase();
        for (ListingStatus status : values()) {
            if (status.name().equals(val)) return status;
        }
        return PENDING;
    }
}
