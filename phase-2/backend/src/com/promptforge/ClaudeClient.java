package com.promptforge;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class ClaudeClient {

    private static final String API_URL = "https://api.anthropic.com/v1/messages";
    private static final String API_KEY = System.getenv("ANTHROPIC_API_KEY");

    private final HttpClient httpClient;

    public ClaudeClient() {
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();
    }

    public String generate(String requestJson, String passedKey) throws Exception {
        String effectiveKey = passedKey;
        if (effectiveKey == null || effectiveKey.isEmpty()) {
            effectiveKey = API_KEY;
        }

        if (effectiveKey == null || effectiveKey.isEmpty()) {
            throw new IllegalStateException("API key is not provided in request and ANTHROPIC_API_KEY environment variable is not set.");
        }

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(API_URL))
            .header("Content-Type", "application/json")
            .header("x-api-key", effectiveKey)
            .header("anthropic-version", "2023-06-01")
            .POST(HttpRequest.BodyPublishers.ofString(requestJson))
            .timeout(Duration.ofSeconds(60))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        if (response.statusCode() != 200) {
             throw new RuntimeException("API call failed with status code " + response.statusCode() + ": " + response.body());
        }
        
        return response.body();
    }
}
