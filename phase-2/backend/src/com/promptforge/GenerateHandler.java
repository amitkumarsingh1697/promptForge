package com.promptforge;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.logging.Level;
import java.util.logging.Logger;

public class GenerateHandler implements HttpHandler {
    private static final Logger LOGGER = Logger.getLogger(GenerateHandler.class.getName());

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
            // Read request body
            String requestBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

            // Read target agent header
            String targetAgent = exchange.getRequestHeaders().getFirst("X-Target-Agent");
            if (targetAgent == null) {
                targetAgent = "claude"; // Default
            }

            // Read API key header
            String apiKey = exchange.getRequestHeaders().getFirst("X-API-Key");

            LOGGER.info("Processing request for agent: " + targetAgent);
            LOGGER.info("API Key provided in request header: " + (apiKey != null && !apiKey.isEmpty()));

            String result;
            if ("gemini".equals(targetAgent)) {
                GeminiClient client = new GeminiClient();
                result = client.generate(requestBody, apiKey);
            } else if ("openai".equals(targetAgent)) {
                OpenAICompatibleClient client = new OpenAICompatibleClient("https://api.openai.com/v1/chat/completions", "OPENAI_API_KEY");
                result = client.generate(requestBody, apiKey);
            } else if ("deepseek".equals(targetAgent)) {
                OpenAICompatibleClient client = new OpenAICompatibleClient("https://api.deepseek.com/chat/completions", "DEEPSEEK_API_KEY");
                result = client.generate(requestBody, apiKey);
            } else if ("groq".equals(targetAgent)) {
                OpenAICompatibleClient client = new OpenAICompatibleClient("https://api.groq.com/openai/v1/chat/completions", "GROQ_API_KEY");
                result = client.generate(requestBody, apiKey);
            } else if ("mistral".equals(targetAgent)) {
                OpenAICompatibleClient client = new OpenAICompatibleClient("https://api.mistral.ai/v1/chat/completions", "MISTRAL_API_KEY");
                result = client.generate(requestBody, apiKey);
            } else {
                ClaudeClient client = new ClaudeClient();
                result = client.generate(requestBody, apiKey);
            }

            LOGGER.info("API call successful. Response: " + result);

            // Send response
            byte[] responseBytes = result.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, responseBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(responseBytes);
            }
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error processing request", e);
            String message = e.getMessage() != null ? e.getMessage() : "Unknown error";
            message = message.replace("\\", "\\\\")
                             .replace("\"", "\\\"")
                             .replace("\n", "\\n")
                             .replace("\r", "\\r")
                             .replace("\t", "\\t");
            String errorResponse = "{\"error\": \"Internal server error: " + message + "\"}";
            byte[] errorBytes = errorResponse.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(500, errorBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(errorBytes);
            }
        }
    }
}
