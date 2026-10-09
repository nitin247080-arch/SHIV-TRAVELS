package com.travelbooking.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

public class StaticFileHandler implements HttpHandler {
    private final String baseDir;

    public StaticFileHandler(String baseDir) {
        this.baseDir = baseDir;
        ensureUploadedImagesCopied();
    }

    private void ensureUploadedImagesCopied() {
        try {
            File destDir = new File("assets/images");
            if (!destDir.exists()) {
                destDir.mkdirs();
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        if (path.equals("/") || path.isBlank()) {
            path = "/index.html";
        }

        File file;
        if (path.startsWith("/assets/")) {
            file = new File("." + path);
        } else {
            file = new File(baseDir + path);
        }

        if (!file.exists() || file.isDirectory()) {
            // Check assets images fallback
            if (path.startsWith("/assets/images/")) {
                String name = path.substring("/assets/images/".length());
                file = new File("assets/images/" + name);

                // Fallbacks to user uploaded
                if (!file.exists()) {
                    if (name.equals("ayodhya_ram_mandir.jpg")) {
                        file = new File("C:/Users/NITIN/.gemini/antigravity/brain/11385e56-a418-418a-b528-b0a77c96a829/.user_uploaded/media_1791276087076.jpg");
                    } else if (name.equals("swiss_alps.jpg")) {
                        file = new File("C:/Users/NITIN/.gemini/antigravity/brain/11385e56-a418-418a-b528-b0a77c96a829/.user_uploaded/media_1791275714095.jpg");
                    } else if (name.equals("thailand_phiphi.jpg")) {
                        file = new File("C:/Users/NITIN/.gemini/antigravity/brain/11385e56-a418-418a-b528-b0a77c96a829/.user_uploaded/media_1791275718662.jpg");
                    } else if (name.equals("jaipur_maota_lake.webp")) {
                        file = new File("C:/Users/NITIN/.gemini/antigravity/brain/11385e56-a418-418a-b528-b0a77c96a829/.user_uploaded/media_1791275725534.webp");
                    } else if (name.equals("manali_snow_peaks.jpg")) {
                        file = new File("C:/Users/NITIN/.gemini/antigravity/brain/11385e56-a418-418a-b528-b0a77c96a829/.user_uploaded/media_1791275737651.jpg");
                    }
                }
            } else if (path.endsWith(".html") || !path.contains(".")) {
                file = new File(baseDir + "/index.html");
            }
        }

        if (!file.exists() || file.isDirectory()) {
            String notFound = "404 Not Found: " + path;
            byte[] bytes = notFound.getBytes();
            exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=UTF-8");
            exchange.sendResponseHeaders(404, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
            return;
        }

        String mimeType = getMimeType(file.getName());
        exchange.getResponseHeaders().set("Content-Type", mimeType);
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Cache-Control", "no-cache");

        byte[] fileBytes = Files.readAllBytes(file.toPath());
        exchange.sendResponseHeaders(200, fileBytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(fileBytes);
        }
    }

    private String getMimeType(String filename) {
        filename = filename.toLowerCase();
        if (filename.endsWith(".html")) return "text/html; charset=UTF-8";
        if (filename.endsWith(".css")) return "text/css; charset=UTF-8";
        if (filename.endsWith(".js")) return "application/javascript; charset=UTF-8";
        if (filename.endsWith(".json")) return "application/json; charset=UTF-8";
        if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
        if (filename.endsWith(".webp")) return "image/webp";
        if (filename.endsWith(".png")) return "image/png";
        if (filename.endsWith(".gif")) return "image/gif";
        if (filename.endsWith(".svg")) return "image/svg+xml";
        if (filename.endsWith(".ico")) return "image/x-icon";
        return "application/octet-stream";
    }
}
