package com.promptforge;

import com.sun.net.httpserver.HttpExchange;

public class CorsHandler {
    public static void addCorsHeaders(HttpExchange exchange) {
        String origin = exchange.getRequestHeaders().getFirst("Origin");
        if (origin != null && (origin.startsWith("chrome-extension://") || origin.startsWith("http://localhost:") || origin.equals("https://www.figma.com"))) {
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", origin);
        } else {
            // Safe fallback default to localhost if header is missing during simple client tools
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "http://localhost:8080");
        }
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, X-Target-Agent, X-API-Key, Authorization");
    }
}
