package com.promptforge;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;

public class Main {
    public static void main(String[] args) throws Exception {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/generate", new GenerateHandler());
        server.createContext("/telemetry", new TelemetryHandler());
        server.createContext("/health", exchange -> {
            byte[] body = "OK".getBytes();
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.getResponseBody().close();
        });
        server.start();
        System.out.println("PromptForge backend running on port " + port);
    }
}
