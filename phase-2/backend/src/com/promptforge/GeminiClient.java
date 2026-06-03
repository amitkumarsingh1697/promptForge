package com.promptforge;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class GeminiClient {

    private static final String API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
    private static final String API_KEY = System.getenv("GEMINI_API_KEY");

    private final HttpClient httpClient;

    public GeminiClient() {
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
            throw new IllegalStateException("API key is not provided in request and GEMINI_API_KEY environment variable is not set.");
        }

        // Append key to URL
        String urlWithKey = API_URL + "?key=" + effectiveKey;

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(urlWithKey))
            .header("Content-Type", "application/json")
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
