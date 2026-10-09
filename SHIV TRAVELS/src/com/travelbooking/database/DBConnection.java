package com.travelbooking.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * DBConnection manages JDBC connections to the MySQL database.
 * Supports connectivity checking and graceful fallback if MySQL is offline.
 */
public class DBConnection {
    private static boolean driverLoaded = false;
    private static Boolean available = null;
    private static long lastCheckTime = 0;
    private static final long CHECK_INTERVAL_MS = 60000; // recheck every 1 minute if failed

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            driverLoaded = true;
        } catch (ClassNotFoundException e) {
            System.err.println("[DBConnection] MySQL JDBC Driver not found in classpath. Ensure mysql-connector-j.jar is in lib/");
            driverLoaded = false;
        }
    }

    public static boolean isDriverLoaded() {
        return driverLoaded;
    }

    /**
     * Obtains a new Connection to voyagehub_db.
     */
    public static Connection getConnection() throws SQLException {
        if (!driverLoaded) {
            throw new SQLException("MySQL JDBC Driver (com.mysql.cj.jdbc.Driver) is not available.");
        }
        return DriverManager.getConnection(DBConfig.getJdbcUrl(), DBConfig.getUser(), DBConfig.getPassword());
    }

    /**
     * Checks if MySQL database is currently reachable and available.
     * Caches the result to prevent high latency on every query.
     */
    public static synchronized boolean isAvailable() {
        if (!DBConfig.isEnabled() || !driverLoaded) {
            return false;
        }

        long now = System.currentTimeMillis();
        if (available != null && (now - lastCheckTime < CHECK_INTERVAL_MS)) {
            return available;
        }

        lastCheckTime = now;
        try (Connection conn = getConnection()) {
            boolean valid = conn.isValid(2);
            available = valid;
            return valid;
        } catch (Exception e) {
            available = false;
            return false;
        }
    }

    /**
     * Forces a fresh check of database availability.
     */
    public static synchronized boolean checkConnection(boolean printLog) {
        lastCheckTime = System.currentTimeMillis();
        if (!driverLoaded) {
            if (printLog) System.out.println("[DBConnection] MySQL JDBC driver not present in classpath.");
            available = false;
            return false;
        }
        try (Connection conn = getConnection()) {
            boolean valid = conn.isValid(2);
            available = valid;
            if (printLog) {
                if (valid) {
                    System.out.println("[DBConnection] Successfully connected to MySQL database: " + DBConfig.getDbName() + " on " + DBConfig.getHost() + ":" + DBConfig.getPort());
                } else {
                    System.out.println("[DBConnection] MySQL connection test failed (isValid returned false).");
                }
            }
            return valid;
        } catch (SQLException e) {
            available = false;
            if (printLog) {
                System.out.println("[DBConnection] MySQL is currently not reachable (" + e.getMessage() + ").");
                System.out.println("[DBConnection] Note: SHIV TRAVELS will seamlessly run in In-Memory mode without errors!");
            }
            return false;
        }
    }
}
