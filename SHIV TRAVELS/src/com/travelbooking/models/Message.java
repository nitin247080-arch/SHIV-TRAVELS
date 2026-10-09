package com.travelbooking.models;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class Message {
    private String id;
    private String senderId;
    private String senderName;
    private String senderRole; // "TRAVELER", "AGENT", "ADMIN"
    private String recipientId;
    private String recipientName;
    private String subject;
    private String messageText;
    private String listingReference;
    private String status; // "UNREAD", "REPLIED"
    private String reply = "";
    private String timestamp;

    public Message() {
        this.status = "UNREAD";
        this.reply = "";
        this.timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }

    public Message(String id, String senderId, String senderName, String senderRole,
                   String recipientId, String recipientName, String subject,
                   String messageText, String listingReference) {
        this.id = id;
        this.senderId = senderId;
        this.senderName = senderName;
        this.senderRole = senderRole;
        this.recipientId = recipientId;
        this.recipientName = recipientName;
        this.subject = subject;
        this.messageText = messageText;
        this.listingReference = listingReference != null ? listingReference : "";
        this.status = "UNREAD";
        this.timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getSenderRole() { return senderRole; }
    public void setSenderRole(String senderRole) { this.senderRole = senderRole; }

    public String getRecipientId() { return recipientId; }
    public void setRecipientId(String recipientId) { this.recipientId = recipientId; }

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getMessageText() { return messageText; }
    public void setMessageText(String messageText) { this.messageText = messageText; }

    public String getListingReference() { return listingReference; }
    public void setListingReference(String listingReference) { this.listingReference = listingReference; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReply() { return reply != null ? reply : ""; }
    public void setReply(String reply) { this.reply = reply; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String toJson() {
        return "{"
                + "\"id\":\"" + escape(id) + "\","
                + "\"senderId\":\"" + escape(senderId) + "\","
                + "\"senderName\":\"" + escape(senderName) + "\","
                + "\"senderRole\":\"" + escape(senderRole) + "\","
                + "\"recipientId\":\"" + escape(recipientId) + "\","
                + "\"recipientName\":\"" + escape(recipientName) + "\","
                + "\"subject\":\"" + escape(subject) + "\","
                + "\"messageText\":\"" + escape(messageText) + "\","
                + "\"listingReference\":\"" + escape(listingReference) + "\","
                + "\"status\":\"" + escape(status) + "\","
                + "\"reply\":\"" + escape(reply) + "\","
                + "\"timestamp\":\"" + escape(timestamp) + "\""
                + "}";
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
