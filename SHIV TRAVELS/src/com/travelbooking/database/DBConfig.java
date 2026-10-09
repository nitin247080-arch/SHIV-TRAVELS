package com.travelbooking.database;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.Properties;

/**
 * DBConfig handles database configuration parameters.
 * Reads settings from db.properties if available, otherwise falls back to defaults.
 */
public class DBConfig {
    private static String host = "localhost";
    private static int port = 3306;
    private static String dbName = "voyagehub_db";
    private static String user = "root";
    private static String password = "";
    private static boolean enabled = true;
    private static boolean autoSync = true;

    static {
        loadProperties();
    }

    public static void loadProperties() {
        File propFile = new File("db.properties");
        if (propFile.exists()) {
            try (InputStream in = new FileInputStream(propFile)) {
                Properties props = new Properties();
                props.load(in);
                host = props.getProperty("db.host", host).trim();
                try {
                    port = Integer.parseInt(props.getProperty("db.port", String.valueOf(port)).trim());
                } catch (NumberFormatException ignored) {}
                dbName = props.getProperty("db.name", dbName).trim();
                user = props.getProperty("db.user", user).trim();
                password = props.getProperty("db.password", password).trim();
                enabled = Boolean.parseBoolean(props.getProperty("db.enabled", "true").trim());
                autoSync = Boolean.parseBoolean(props.getProperty("db.autoSync", "true").trim());
            } catch (Exception e) {
                System.err.println("[DBConfig] Error reading db.properties: " + e.getMessage());
            }
        }
    }

    public static String getJdbcUrl() {
        return "jdbc:mysql://" + host + ":" + port + "/" + dbName
                + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8&autoReconnect=true";
    }

    public static String getRootServerJdbcUrl() {
        return "jdbc:mysql://" + host + ":" + port + "/"
                + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8&autoReconnect=true";
    }

    public static String getHost() { return host; }
    public static int getPort() { return port; }
    public static String getDbName() { return dbName; }
    public static String getUser() { return user; }
    public static String getPassword() { return password; }
    public static boolean isEnabled() { return enabled; }
    public static boolean isAutoSync() { return autoSync; }

    public static void setPassword(String newPass) {
        password = newPass;
    }
}
