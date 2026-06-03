package com.promptforge;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.logging.Logger;

public class TelemetryHandler implements HttpHandler {
    private static final Logger LOGGER = Logger.getLogger(TelemetryHandler.class.getName());

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        CorsHandler.addCorsHeaders(exchange);

        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        if (!"POST".equals(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(405, -1);
            return;
        }

        try {
            // Read request body carrying JSON telemetry details
            String requestBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

            LOGGER.info("[Telemetry Ingest] Feedback received payload: " + requestBody);

            String responseJson = "{\"status\": \"success\"}";
            byte[] responseBytes = responseJson.getBytes(StandardCharsets.UTF_8);
            
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, responseBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(responseBytes);
            }
        } catch (Exception e) {
            LOGGER.severe("Failed to process telemetry payload: " + e.getMessage());
            String errorResponse = "{\"error\": \"Failed to process telemetry: " + e.getMessage() + "\"}";
            byte[] errorBytes = errorResponse.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(500, errorBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(errorBytes);
            }
        }
    }
}
