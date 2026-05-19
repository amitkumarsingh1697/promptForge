package com.promptforge;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class OpenAICompatibleClient {

    private final String apiUrl;
    private final String fallbackEnvKey;
    private final HttpClient httpClient;

    public OpenAICompatibleClient(String apiUrl, String envVarName) {
        this.apiUrl = apiUrl;
        this.fallbackEnvKey = System.getenv(envVarName);
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();
    }

    public String generate(String requestJson, String passedKey) throws Exception {
        String effectiveKey = passedKey;
        if (effectiveKey == null || effectiveKey.isEmpty()) {
            effectiveKey = fallbackEnvKey;
        }

        if (effectiveKey == null || effectiveKey.isEmpty()) {
            throw new IllegalStateException("API key is not provided in request and environment variable for provider is not set.");
        }

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(apiUrl))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + effectiveKey)
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
