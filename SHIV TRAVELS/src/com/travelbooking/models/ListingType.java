package com.travelbooking.models;

public enum ListingType {
    FLIGHT,
    HOTEL,
    CAR_RENTAL;

    public static ListingType fromString(String val) {
        if (val == null) return HOTEL;
        val = val.trim().toUpperCase().replace("-", "_").replace(" ", "_");
        for (ListingType type : values()) {
            if (type.name().equals(val)) return type;
        }
        return HOTEL;
    }
}
