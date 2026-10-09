package com.travelbooking.models;

public class SystemSettings {
    private String platformName;
    private String currencySymbol;
    private String currencyCode;
    private double defaultTaxRate;
    private boolean maintenanceMode;
    private String contactEmail;
    private String supportPhone;
    private boolean allowAgentRegistration;
    private int maxBookingsPerUser;
    private String termsAndConditions;

    public SystemSettings() {
        this.platformName = "SHIV TRAVELS - Global Travel Booking";
        this.currencySymbol = "₹";
        this.currencyCode = "INR";
        this.defaultTaxRate = 5.0;
        this.maintenanceMode = false;
        this.contactEmail = "admin@shivtravels.com";
        this.supportPhone = "+91 98765 43210";
        this.allowAgentRegistration = true;
        this.maxBookingsPerUser = 20;
        this.termsAndConditions = "Bookings can be cancelled up to 48 hours prior to journey. Instant refund applies for premium members.";
    }

    public String getPlatformName() { return platformName; }
    public void setPlatformName(String platformName) { this.platformName = platformName; }

    public String getCurrencySymbol() { return currencySymbol; }
    public void setCurrencySymbol(String currencySymbol) { this.currencySymbol = currencySymbol; }

    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }

    public double getDefaultTaxRate() { return defaultTaxRate; }
    public void setDefaultTaxRate(double defaultTaxRate) { this.defaultTaxRate = defaultTaxRate; }

    public boolean isMaintenanceMode() { return maintenanceMode; }
    public void setMaintenanceMode(boolean maintenanceMode) { this.maintenanceMode = maintenanceMode; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getSupportPhone() { return supportPhone; }
    public void setSupportPhone(String supportPhone) { this.supportPhone = supportPhone; }

    public boolean isAllowAgentRegistration() { return allowAgentRegistration; }
    public void setAllowAgentRegistration(boolean allowAgentRegistration) { this.allowAgentRegistration = allowAgentRegistration; }

    public int getMaxBookingsPerUser() { return maxBookingsPerUser; }
    public void setMaxBookingsPerUser(int maxBookingsPerUser) { this.maxBookingsPerUser = maxBookingsPerUser; }

    public String getTermsAndConditions() { return termsAndConditions; }
    public void setTermsAndConditions(String termsAndConditions) { this.termsAndConditions = termsAndConditions; }

    public String toJson() {
        return "{"
                + "\"platformName\":\"" + escape(platformName) + "\","
                + "\"currencySymbol\":\"" + escape(currencySymbol) + "\","
                + "\"currencyCode\":\"" + escape(currencyCode) + "\","
                + "\"defaultTaxRate\":" + defaultTaxRate + ","
                + "\"maintenanceMode\":" + maintenanceMode + ","
                + "\"contactEmail\":\"" + escape(contactEmail) + "\","
                + "\"supportPhone\":\"" + escape(supportPhone) + "\","
                + "\"allowAgentRegistration\":" + allowAgentRegistration + ","
                + "\"maxBookingsPerUser\":" + maxBookingsPerUser + ","
                + "\"termsAndConditions\":\"" + escape(termsAndConditions) + "\""
                + "}";
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
