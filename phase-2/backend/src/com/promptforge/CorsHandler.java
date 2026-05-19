package com.promptforge;

import com.sun.net.httpserver.HttpExchange;

public class CorsHandler {
    public static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, X-Target-Agent, X-API-Key");
    }
}
