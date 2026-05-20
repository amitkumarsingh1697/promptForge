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

            long startTime = System.currentTimeMillis();
            boolean success = false;
            boolean fallbackExecuted = false;
            String actualAgentUsed = targetAgent;
            String result = null;
            String errorMessage = null;

            try {
                result = callAgent(targetAgent, requestBody, apiKey);
                success = true;
            } catch (Exception e) {
                LOGGER.warning("Primary agent " + targetAgent + " failed: " + e.getMessage() + ". Attempting automated fallback...");
                errorMessage = e.getMessage();
                
                String fallbackAgent = getFallbackAgent(targetAgent);
                if (fallbackAgent != null) {
                    try {
                        LOGGER.info("Executing fallback routing to: " + fallbackAgent);
                        String fallbackKey = System.getenv(getEnvKeyName(fallbackAgent));
                        result = callAgent(fallbackAgent, requestBody, fallbackKey);
                        success = true;
                        fallbackExecuted = true;
                        actualAgentUsed = fallbackAgent;
                    } catch (Exception ex) {
                        LOGGER.severe("Fallback agent " + fallbackAgent + " failed as well: " + ex.getMessage());
                        errorMessage = "Primary: " + e.getMessage() + " | Fallback: " + ex.getMessage();
                    }
                }
            }

            long latencyMs = System.currentTimeMillis() - startTime;

            // Observation Structured Logging
            LOGGER.info(String.format("[Telemetry Log] {\"primaryAgent\":\"%s\", \"actualAgent\":\"%s\", \"success\":%b, \"latencyMs\":%d, \"fallbackExecuted\":%b, \"error\":\"%s\"}", 
                targetAgent, actualAgentUsed, success, latencyMs, fallbackExecuted, errorMessage != null ? errorMessage.replace("\"", "\\\"").replace("\n", "\\n") : "none"));

            if (!success) {
                throw new RuntimeException("All model attempts failed. Error: " + errorMessage);
            }

            LOGGER.info("API call successful. Response length: " + result.length());

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

    private String callAgent(String agent, String requestBody, String apiKey) throws Exception {
        if ("gemini".equals(agent)) {
            GeminiClient client = new GeminiClient();
            return client.generate(requestBody, apiKey);
        } else if ("openai".equals(agent)) {
            OpenAICompatibleClient client = new OpenAICompatibleClient("https://api.openai.com/v1/chat/completions", "OPENAI_API_KEY");
            return client.generate(requestBody, apiKey);
        } else if ("deepseek".equals(agent)) {
            OpenAICompatibleClient client = new OpenAICompatibleClient("https://api.deepseek.com/chat/completions", "DEEPSEEK_API_KEY");
            return client.generate(requestBody, apiKey);
        } else if ("groq".equals(agent)) {
            OpenAICompatibleClient client = new OpenAICompatibleClient("https://api.groq.com/openai/v1/chat/completions", "GROQ_API_KEY");
            return client.generate(requestBody, apiKey);
        } else if ("mistral".equals(agent)) {
            OpenAICompatibleClient client = new OpenAICompatibleClient("https://api.mistral.ai/v1/chat/completions", "MISTRAL_API_KEY");
            return client.generate(requestBody, apiKey);
        } else {
            ClaudeClient client = new ClaudeClient();
            return client.generate(requestBody, apiKey);
        }
    }

    private String getFallbackAgent(String primaryAgent) {
        if ("gemini".equals(primaryAgent)) {
            return "claude";
        } else {
            return "gemini";
        }
    }

    private String getEnvKeyName(String agent) {
        if ("gemini".equals(agent)) {
            return "GEMINI_API_KEY";
        } else if ("openai".equals(agent)) {
            return "OPENAI_API_KEY";
        } else if ("deepseek".equals(agent)) {
            return "DEEPSEEK_API_KEY";
        } else if ("groq".equals(agent)) {
            return "GROQ_API_KEY";
        } else if ("mistral".equals(agent)) {
            return "MISTRAL_API_KEY";
        } else {
            return "ANTHROPIC_API_KEY";
        }
    }
}
