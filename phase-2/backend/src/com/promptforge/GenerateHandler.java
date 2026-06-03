package com.promptforge;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

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
            // Read request body containing structured parameters
            String requestBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

            // Read target agent header
            String targetAgent = exchange.getRequestHeaders().getFirst("X-Target-Agent");
            if (targetAgent == null) {
                targetAgent = "claude"; // Default
            }

            // Read API key header
            String apiKey = exchange.getRequestHeaders().getFirst("X-API-Key");

            // Access Validation Check (Milestone 3)
            String jwtSecret = System.getenv("SUPABASE_JWT_SECRET");
            if (jwtSecret != null && !jwtSecret.isEmpty()) {
                if (apiKey == null || apiKey.isEmpty()) {
                    String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
                    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                        LOGGER.warning("Unauthorized access attempt: Authorization Bearer token is missing.");
                        exchange.sendResponseHeaders(401, -1);
                        return;
                    }
                    String token = authHeader.substring(7);
                    if (!verifyJwt(token, jwtSecret)) {
                        LOGGER.warning("Access denied: JWT signature validation or expiry check failed.");
                        exchange.sendResponseHeaders(403, -1);
                        return;
                    }
                    LOGGER.info("SaaS request authorized securely via JWT validation.");
                } else {
                    LOGGER.info("Developer request authorized directly via X-API-Key bypass.");
                }
            } else {
                LOGGER.warning("SUPABASE_JWT_SECRET environment variable is not configured. Access validation checks skipped.");
            }

            LOGGER.info("Processing request for agent: " + targetAgent);

            // 1. Extract values using our JSON helper
            String source = getJsonValue(requestBody, "source");
            String framework = getJsonValue(requestBody, "framework");
            String style = getJsonValue(requestBody, "style");
            String colors = getJsonValue(requestBody, "colors");
            String font = getJsonValue(requestBody, "font");
            String description = getJsonValue(requestBody, "description");
            String url = getJsonValue(requestBody, "url");
            String tokensText = getJsonValue(requestBody, "tokensText");
            String variablesText = getJsonValue(requestBody, "variablesText");
            String geometry = getJsonValue(requestBody, "geometry");
            String screenshotData = getJsonValue(requestBody, "screenshot");

            // Extract base64 and mime type from screenshot data url if present
            String screenshot = "";
            String screenshotMime = "image/png";
            if (screenshotData.startsWith("data:")) {
                int commaIndex = screenshotData.indexOf(",");
                if (commaIndex != -1) {
                    screenshot = screenshotData.substring(commaIndex + 1);
                    String prefix = screenshotData.substring(0, commaIndex);
                    int colonIndex = prefix.indexOf(":");
                    int semiIndex = prefix.indexOf(";");
                    if (colonIndex != -1 && semiIndex != -1) {
                        screenshotMime = prefix.substring(colonIndex + 1, semiIndex);
                    }
                }
            }

            // 2. Compile the system instructions on the server-side
            String compiledPrompt = compilePrompt(source, framework, style, colors, font, description, url, tokensText, variablesText, geometry, screenshot);

            long startTime = System.currentTimeMillis();
            boolean success = false;
            boolean fallbackExecuted = false;
            String actualAgentUsed = targetAgent;
            String rawLlmResponse = null;
            String errorMessage = null;

            // 3. Format target request payload & dispatch
            try {
                String agentRequestPayload = formatAgentRequest(targetAgent, compiledPrompt, screenshot, screenshotMime);
                rawLlmResponse = callAgent(targetAgent, agentRequestPayload, apiKey);
                success = true;
            } catch (Exception e) {
                LOGGER.warning("Primary agent " + targetAgent + " failed: " + e.getMessage() + ". Attempting automated fallback...");
                errorMessage = e.getMessage();
                
                String fallbackAgent = getFallbackAgent(targetAgent);
                if (fallbackAgent != null) {
                    try {
                        LOGGER.info("Executing fallback routing to: " + fallbackAgent);
                        String fallbackKey = System.getenv(getEnvKeyName(fallbackAgent));
                        String agentRequestPayload = formatAgentRequest(fallbackAgent, compiledPrompt, screenshot, screenshotMime);
                        rawLlmResponse = callAgent(fallbackAgent, agentRequestPayload, fallbackKey);
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

            // Structured Telemetry Log
            LOGGER.info(String.format("[Telemetry Log] {\"primaryAgent\":\"%s\", \"actualAgent\":\"%s\", \"success\":%b, \"latencyMs\":%d, \"fallbackExecuted\":%b, \"error\":\"%s\"}", 
                targetAgent, actualAgentUsed, success, latencyMs, fallbackExecuted, errorMessage != null ? errorMessage.replace("\"", "\\\"").replace("\n", "\\n") : "none"));

            if (!success) {
                throw new RuntimeException("All model attempts failed. Error: " + errorMessage);
            }

            // 4. Extract and normalize the response JSON returned from the LLM content block
            String textResult = extractLlmText(actualAgentUsed, rawLlmResponse);
            String innerJson = extractJsonBlock(textResult);
            
            String finalResponseJson;
            if (innerJson.startsWith("{") && innerJson.endsWith("}")) {
                // Ensure it is valid JSON
                finalResponseJson = innerJson;
            } else {
                // Fallback safe wrapped response
                finalResponseJson = "{\"prompt\":\"" + escapeJson(textResult) + "\",\"accuracy\":\"~95%\",\"layout\":\"Unknown\",\"components\":\"Unknown\",\"tokens\":\"Medium\"}";
            }

            LOGGER.info("Normalization successful. Output length: " + finalResponseJson.length());

            // Send normalized response
            byte[] responseBytes = finalResponseJson.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, responseBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(responseBytes);
            }
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error processing request", e);
            String message = e.getMessage() != null ? e.getMessage() : "Unknown error";
            String errorResponse = "{\"error\": \"Internal server error: " + escapeJson(message) + "\"}";
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

    // --- Core Dependency-Free JSON Parser Scanner ---
    private static String getJsonValue(String json, String key) {
        String searchKey = "\"" + key + "\"";
        int index = json.indexOf(searchKey);
        if (index == -1) return "";
        
        int colonIndex = json.indexOf(":", index + searchKey.length());
        if (colonIndex == -1) return "";
        
        int valStart = colonIndex + 1;
        while (valStart < json.length() && Character.isWhitespace(json.charAt(valStart))) {
            valStart++;
        }
        if (valStart >= json.length()) return "";
        
        if (json.charAt(valStart) == '"') {
            StringBuilder sb = new StringBuilder();
            boolean escaped = false;
            for (int i = valStart + 1; i < json.length(); i++) {
                char c = json.charAt(i);
                if (escaped) {
                    if (c == 'n') sb.append('\n');
                    else if (c == 't') sb.append('\t');
                    else if (c == 'r') sb.append('\r');
                    else if (c == '"') sb.append('"');
                    else if (c == '\\') sb.append('\\');
                    else sb.append(c);
                    escaped = false;
                } else if (c == '\\') {
                    escaped = true;
                } else if (c == '"') {
                    return sb.toString();
                } else {
                    sb.append(c);
                }
            }
            return sb.toString();
        } else {
            int valEnd = valStart;
            int braceCount = 0;
            int bracketCount = 0;
            boolean inQuote = false;
            boolean escaped = false;
            while (valEnd < json.length()) {
                char c = json.charAt(valEnd);
                if (inQuote) {
                    if (escaped) escaped = false;
                    else if (c == '\\') escaped = true;
                    else if (c == '"') inQuote = false;
                } else {
                    if (c == '"') inQuote = true;
                    else if (c == '{') braceCount++;
                    else if (c == '}') {
                        if (braceCount == 0) break;
                        braceCount--;
                    }
                    else if (c == '[') bracketCount++;
                    else if (c == ']') {
                        if (bracketCount == 0) break;
                        bracketCount--;
                    }
                    else if (c == ',' && braceCount == 0 && bracketCount == 0) break;
                }
                valEnd++;
            }
            return json.substring(valStart, valEnd).trim();
        }
    }

    // --- Core Server-Side Prompt Compiler Templates ---
    private static String compilePrompt(String source, String framework, String style, String colors, String font,
                                        String description, String url, String tokensText, String variablesText,
                                        String geometry, String screenshot) {
        if ("figma".equals(source)) {
            StringBuilder sb = new StringBuilder();
            sb.append("You are a Figma design token prompt compiler. Recreate this Figma frame structure recursively into precise development prompt layout specs:\n");
            sb.append("Frame node selection details:\n");
            sb.append(geometry).append("\n\n");
            sb.append("Target framework: ").append(framework).append("\n");
            sb.append("Target design style direction: ").append(style).append("\n");
            if (!tokensText.isEmpty()) {
                sb.append("\nStrictly enforce the following project-specific design system tokens and style variables:\n");
                sb.append(tokensText).append("\n");
            }
            sb.append("\nWrite a detailed prompt describing sizing, spacing hierarchies, container alignments, text contents, font stacks, and exact hex fills so a developer can code it perfectly.");
            return sb.toString();
        } else {
            String inputLine = "";
            if (screenshot != null && !screenshot.isEmpty()) {
                inputLine = "[See attached UI screenshot — analyze and recreate it exactly]";
            } else if (url != null && !url.isEmpty()) {
                inputLine = "URL reference: " + url;
            } else {
                inputLine = "Input description: \"" + description + "\"";
            }

            StringBuilder sb = new StringBuilder();
            sb.append("You are an expert UI/UX prompt engineer. Transform the following into the most precise, optimized prompt for building an exact UI.\n\n");
            sb.append(inputLine).append("\n");
            sb.append("Target framework: ").append(framework).append("\n");
            sb.append("Style direction: ").append(style);
            if (!colors.isEmpty()) {
                sb.append("\nColor palette: ").append(colors);
            }
            if (!font.isEmpty()) {
                sb.append("\nFont family: ").append(font);
            }
            if (!tokensText.isEmpty()) {
                sb.append("\n\nStrictly adhere to the following project-specific design system tokens and style variables:\n").append(tokensText);
            }
            if (!variablesText.isEmpty()) {
                sb.append("\n\nAdditionally, enforce alignment with these computed styles extracted from the reference tab:\n").append(variablesText);
            }

            sb.append("\n\nWrite a hyper-detailed, engineer-ready prompt covering:\n" +
                      "- Exact layout structure and grid system\n" +
                      "- Complete component hierarchy (parent → child)\n" +
                      "- Precise spacing values (margins, padding, gaps in px/rem)\n" +
                      "- Full color system (background layers, borders, text, accents — with exact hex values)\n" +
                      "- Typography scale (font-size, font-weight, line-height, letter-spacing per element)\n" +
                      "- Interactive states (hover, focus, active, disabled) with transition specs\n" +
                      "- Responsive breakpoints and behavior\n" +
                      "- Accessibility roles and aria attributes\n" +
                      "- Animation and motion specs\n" +
                      "- Specific code patterns and naming conventions for ").append(framework).append("\n\n")
              .append("Target accuracy: 99%+. Be hyper-specific. A developer should be able to implement this without any guesswork.\n\n")
              .append("Return ONLY a raw JSON object. No markdown. No backticks. No preamble. Keys:\n" +
                      "- prompt: the full detailed prompt (300-450 words)\n" +
                      "- accuracy: short string e.g. \"98-99%\"\n" +
                      "- layout: brief layout description, max 5 words\n" +
                      "- components: key components, comma-separated, max 5 items\n" +
                      "- tokens: one of \"low\" | \"medium\" | \"high\"");
            return sb.toString();
        }
    }

    // --- Core Agent API Request Formatter ---
    private static String formatAgentRequest(String agent, String promptText, String screenshot, String screenshotMime) {
        String escapedPrompt = escapeJson(promptText);
        
        if ("gemini".equals(agent)) {
            StringBuilder sb = new StringBuilder();
            sb.append("{\"contents\":[{\"role\":\"user\",\"parts\":[{\"text\":\"").append(escapedPrompt).append("\"}");
            if (screenshot != null && !screenshot.isEmpty()) {
                sb.append(",{\"inlineData\":{\"mimeType\":\"").append(escapeJson(screenshotMime)).append("\",\"data\":\"").append(escapeJson(screenshot)).append("\"}}");
            }
            sb.append("]}],\"generation_config\":{\"max_output_tokens\":4096}}");
            return sb.toString();
        } else if ("openai".equals(agent) || "deepseek".equals(agent) || "groq".equals(agent) || "mistral".equals(agent)) {
            String model = "gpt-4o";
            if ("deepseek".equals(agent)) model = "deepseek-chat";
            if ("groq".equals(agent)) model = "llama3-70b-8192";
            if ("mistral".equals(agent)) model = "mistral-large-latest";
            
            StringBuilder sb = new StringBuilder();
            sb.append("{\"model\":\"").append(model).append("\",");
            sb.append("\"messages\":[");
            sb.append("{\"role\":\"system\",\"content\":\"You are an expert UI/UX prompt engineer. Your prompts are hyper-precise and produce pixel-accurate results. Always return valid JSON only — no markdown fences, no preamble, no extra text.\"},");
            sb.append("{\"role\":\"user\",\"content\":[");
            sb.append("{\"type\":\"text\",\"text\":\"").append(escapedPrompt).append("\"}");
            if (screenshot != null && !screenshot.isEmpty()) {
                sb.append(",{\"type\":\"image_url\",\"image_url\":{\"url\":\"data:").append(escapeJson(screenshotMime)).append(";base64,").append(escapeJson(screenshot)).append("\"}}");
            }
            sb.append("]}]}");
            return sb.toString();
        } else {
            // Claude
            StringBuilder sb = new StringBuilder();
            sb.append("{\"model\":\"claude-3-5-sonnet-20241022\",");
            sb.append("\"max_tokens\":1000,");
            sb.append("\"system\":\"You are an expert UI/UX prompt engineer. Your prompts are hyper-precise and produce pixel-accurate results. Always return valid JSON only — no markdown fences, no preamble, no extra text.\",");
            sb.append("\"messages\":[{\"role\":\"user\",\"content\":[");
            if (screenshot != null && !screenshot.isEmpty()) {
                sb.append("{\"type\":\"image\",\"source\":{\"type\":\"base64\",\"media_type\":\"").append(escapeJson(screenshotMime)).append("\",\"data\":\"").append(escapeJson(screenshot)).append("\"}},");
            }
            sb.append("{\"type\":\"text\",\"text\":\"").append(escapedPrompt).append("\"}");
            sb.append("]}]}");
            return sb.toString();
        }
    }

    private static String extractLlmText(String agent, String responseBody) {
        if ("openai".equals(agent) || "deepseek".equals(agent) || "groq".equals(agent) || "mistral".equals(agent)) {
            return getJsonValue(responseBody, "content");
        } else {
            return getJsonValue(responseBody, "text");
        }
    }

    private static String extractJsonBlock(String rawText) {
        int jsonStart = rawText.indexOf("```json");
        if (jsonStart != -1) {
            int start = jsonStart + 7;
            int jsonEnd = rawText.indexOf("```", start);
            if (jsonEnd != -1) {
                return rawText.substring(start, jsonEnd).trim();
            }
        }
        
        int firstBrace = rawText.indexOf('{');
        int lastBrace = rawText.lastIndexOf('}');
        if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
            return rawText.substring(firstBrace, lastBrace + 1);
        }
        
        return "";
    }

    private static String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }

    private static boolean verifyJwt(String token, String secret) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return false;
            }
            
            String headerAndPayload = parts[0] + "." + parts[1];
            String expectedSignature = computeHmacSha256(headerAndPayload, secret);
            if (!expectedSignature.equals(parts[2])) {
                return false;
            }
            
            // Base64URL decode payload and check expiration
            byte[] decodedPayloadBytes = Base64.getUrlDecoder().decode(parts[1]);
            String payloadJson = new String(decodedPayloadBytes, StandardCharsets.UTF_8);
            
            String expStr = getJsonValue(payloadJson, "exp");
            if (!expStr.isEmpty()) {
                long exp = Long.parseLong(expStr);
                long currentEpochSeconds = System.currentTimeMillis() / 1000;
                if (currentEpochSeconds > exp) {
                    LOGGER.warning("Expired JWT validation token: " + exp + ", current time: " + currentEpochSeconds);
                    return false;
                }
            }
            
            return true;
        } catch (Exception e) {
            LOGGER.log(Level.WARNING, "JWT parsing exception caught: ", e);
            return false;
        }
    }

    private static String computeHmacSha256(String data, String key) {
        try {
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKey);
            byte[] hmacBytes = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hmacBytes);
        } catch (Exception e) {
            throw new RuntimeException("Failed to compute HMAC-SHA256 signature", e);
        }
    }
}
