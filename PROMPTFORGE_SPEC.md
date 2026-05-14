# PromptForge — Chrome Extension
## Project Specification & Build Guide

> **Purpose:** A Chrome browser extension that takes a plain-English description OR a UI screenshot and generates a hyper-optimized, engineer-ready AI prompt to rebuild that UI with ~99% accuracy.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [File & Folder Structure](#4-file--folder-structure)
5. [Chrome Extension Setup](#5-chrome-extension-setup)
6. [Frontend — Popup UI](#6-frontend--popup-ui)
7. [Backend — Java Core Server](#7-backend--java-core-server)
8. [API Integration](#8-api-integration)
9. [Feature Breakdown](#9-feature-breakdown)
10. [Data Flow](#10-data-flow)
11. [Error Handling](#11-error-handling)
12. [Build & Run Instructions](#12-build--run-instructions)
13. [Constraints & Rules](#13-constraints--rules)

---

## 1. Project Overview

**PromptForge** is a Chrome extension with an optional lightweight Java backend. The user opens the extension popup, either types what they want to build in plain English or uploads a UI screenshot, selects a target framework and style, and clicks **Generate**. The extension sends the input to the Anthropic Claude API (directly from the popup or via the Java backend proxy) and returns a detailed, structured prompt ready to paste into any AI coding agent (Cursor, Copilot, Claude, ChatGPT, etc.).

### Core User Journey

```
User opens extension
        ↓
Types description OR uploads screenshot
        ↓
Selects: Framework | Style | Colors | Font
        ↓
Clicks "Generate Optimized Prompt"
        ↓
Extension calls Claude API
        ↓
Receives structured prompt + accuracy score
        ↓
User copies prompt → pastes into AI agent → builds UI
```

---

## 2. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Extension shell | Chrome Extension Manifest V3 | Required for Chrome |
| Frontend UI | HTML5 + CSS3 + Bootstrap 5.3 | Simple, no build step, universally understood |
| JavaScript | Vanilla ES6+ | No framework dependency |
| Backend (optional) | Java 17+ Core (HttpServer) | API key proxy, request logging |
| HTTP client (Java) | `java.net.http.HttpClient` | Built-in, no Maven needed |
| AI model | Anthropic Claude API (`claude-sonnet-4-20250514`) | Best prompt generation quality |
| Storage | `chrome.storage.local` | Persist API key + settings |

> **Note:** The backend Java server is OPTIONAL. If the user is comfortable storing their API key in the extension settings, the popup can call the Anthropic API directly. The Java server acts as a proxy to keep the API key server-side.

---

## 3. Architecture

### Mode A — Direct (No Backend)

```
[Chrome Popup] ──── fetch() ────▶ [Anthropic API]
                                        │
                                        ▼
                              [Generated Prompt JSON]
                                        │
                                        ▼
                              [Displayed in Popup]
```

### Mode B — Proxied (With Java Backend)

```
[Chrome Popup] ──── fetch() ────▶ [Java HttpServer :8080]
                                        │
                                    /generate
                                        │
                              [java.net.http.HttpClient]
                                        │
                                        ▼
                              [Anthropic API]
                                        │
                                        ▼
                              [Response → Popup]
```

The Java server holds the API key in an environment variable, never exposing it to the browser.

---

## 4. File & Folder Structure

```
promptforge/
│
├── extension/                        ← Chrome extension root
│   ├── manifest.json                 ← Extension manifest (MV3)
│   ├── popup.html                    ← Main popup UI (Bootstrap)
│   ├── popup.js                      ← All popup logic
│   ├── popup.css                     ← Custom styles on top of Bootstrap
│   ├── background.js                 ← Service worker (minimal)
│   ├── icons/
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── lib/
│       └── bootstrap.min.css         ← Bootstrap 5.3 bundled locally
│
├── backend/                          ← Optional Java backend
│   ├── src/
│   │   └── com/promptforge/
│   │       ├── Main.java             ← Entry point, starts HttpServer
│   │       ├── GenerateHandler.java  ← Handles POST /generate
│   │       ├── ClaudeClient.java     ← Calls Anthropic API
│   │       └── CorsHandler.java      ← Adds CORS headers
│   ├── compile.sh                    ← Compile script
│   └── run.sh                        ← Run script
│
├── PROMPTFORGE_SPEC.md               ← This file
└── AGENT_PROMPT.md                   ← Prompt for AI agents to build this
```

---

## 5. Chrome Extension Setup

### manifest.json

```json
{
  "manifest_version": 3,
  "name": "PromptForge",
  "version": "1.0.0",
  "description": "Generate optimized AI prompts from plain English or UI screenshots",
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "background": {
    "service_worker": "background.js"
  },
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://api.anthropic.com/*",
    "http://localhost:8080/*"
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

**Key points:**
- `host_permissions` must include `api.anthropic.com` for direct mode, and `localhost:8080` for backend mode.
- `manifest_version: 3` is required. No `manifest_version: 2`.
- No inline scripts anywhere — all JS must be in `.js` files.

---

## 6. Frontend — Popup UI

### popup.html — Complete Structure

The popup must be exactly **420px wide** and **auto height** (max ~600px with scroll). It uses Bootstrap 5.3 loaded from the local `lib/` folder (no CDN — Chrome extensions block external scripts by default).

#### Key UI Sections

**Section 1 — Header**
- Extension logo (SVG inline or `<img>` from icons/)
- Title: "PromptForge"
- Subtitle: "UI Prompt Generator"
- Badge: "~99% accuracy" (Bootstrap badge, `bg-success`)

**Section 2 — Input Tabs**
- Bootstrap Nav Tabs: "Describe it" | "Upload Image"
- Tab 1 (Describe): `<textarea>` with placeholder, 800 char max, live character counter
- Tab 2 (Upload): Drag-and-drop zone `<div>` + hidden `<input type="file" accept="image/*">` + image preview with remove button

**Section 3 — Options**
- Framework pills (radio-style Bootstrap buttons): React | HTML/CSS | Vue | Figma Spec | Any
- Style pills: Pixel-perfect | Clean Minimal | Dark Mode | Glassmorphism
- Two text inputs: Color Palette | Font Family

**Section 4 — Generate Button**
- Full-width Bootstrap primary button
- Shows spinner (`<div class="spinner-border">`) while loading
- Disabled during API call

**Section 5 — Output (hidden until generated)**
- Label: "Generated Prompt" + accuracy badge
- `<pre>` or `<div>` with monospace font, scrollable, max-height 220px
- Breakdown row: Layout | Components | Token size (3 Bootstrap cards)
- Action buttons: Copy | Regenerate | Settings (icon)

**Section 6 — Settings Panel (collapsible)**
- API key input (`<input type="password">`)
- Backend mode toggle (Direct / Java Proxy)
- Backend URL input (default: `http://localhost:8080`)
- Save button

### popup.css — Custom Overrides

```css
/* Popup container */
body {
  width: 420px;
  min-height: 300px;
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 13px;
}

/* Tab active state */
.nav-tabs .nav-link.active {
  font-weight: 600;
  color: #0d6efd;
}

/* Drop zone */
.drop-zone {
  border: 2px dashed #ced4da;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.drop-zone.drag-over {
  border-color: #0d6efd;
  background: #f0f6ff;
}

/* Option pills */
.pill-btn {
  font-size: 11.5px;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid #ced4da;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
}

.pill-btn.active {
  background: #212529;
  color: #fff;
  border-color: #212529;
}

/* Output box */
.output-box {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 12px;
  max-height: 220px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Breakdown mini cards */
.breakdown-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 8px 10px;
  text-align: center;
}

.breakdown-label {
  font-size: 10px;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.breakdown-value {
  font-size: 12px;
  font-weight: 600;
  color: #212529;
}
```

---

## 7. Backend — Java Core Server

The backend is a plain Java 17 program using `com.sun.net.httpserver.HttpServer`. No Spring, no Maven, no external libraries. Compile and run with `javac` and `java` directly.

### Main.java

```java
package com.promptforge;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;

public class Main {
    public static void main(String[] args) throws Exception {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/generate", new GenerateHandler());
        server.createContext("/health",  exchange -> {
            byte[] body = "OK".getBytes();
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.getResponseBody().close();
        });
        server.start();
        System.out.println("PromptForge backend running on port " + port);
    }
}
```

### GenerateHandler.java

Handles `POST /generate`. Reads JSON body from popup, forwards to Anthropic API, returns response.

```java
package com.promptforge;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.*;
import java.nio.charset.StandardCharsets;

public class GenerateHandler implements HttpHandler {

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        // CORS preflight
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        if (!"POST".equals(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(405, -1);
            return;
        }

        // Read request body
        String requestBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

        // Call Claude API
        ClaudeClient client = new ClaudeClient();
        String result = client.generate(requestBody);

        // Send response
        byte[] responseBytes = result.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, responseBytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(responseBytes);
        os.close();
    }
}
```

### ClaudeClient.java

```java
package com.promptforge;

import java.net.URI;
import java.net.http.*;
import java.time.Duration;

public class ClaudeClient {

    private static final String API_URL = "https://api.anthropic.com/v1/messages";
    private static final String API_KEY  = System.getenv("ANTHROPIC_API_KEY");
    private static final String MODEL    = "claude-sonnet-4-20250514";

    private final HttpClient httpClient;

    public ClaudeClient() {
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();
    }

    public String generate(String requestJson) throws Exception {
        // requestJson is the raw body from the popup — forward as-is
        // The popup must shape the payload in the Anthropic messages format

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(API_URL))
            .header("Content-Type", "application/json")
            .header("x-api-key", API_KEY)
            .header("anthropic-version", "2023-06-01")
            .POST(HttpRequest.BodyPublishers.ofString(requestJson))
            .timeout(Duration.ofSeconds(60))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }
}
```

### compile.sh

```bash
#!/bin/bash
mkdir -p out
javac -d out src/com/promptforge/*.java
echo "Compiled successfully."
```

### run.sh

```bash
#!/bin/bash
export ANTHROPIC_API_KEY="your-api-key-here"
java -cp out com.promptforge.Main
```

---

## 8. API Integration

### Anthropic API Request Shape

The popup (or Java proxy) sends this JSON to Anthropic:

```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1000,
  "system": "You are an expert UI/UX prompt engineer. Your prompts are hyper-precise, structured, and produce pixel-accurate results. Always return valid JSON only — no markdown fences, no preamble.",
  "messages": [
    {
      "role": "user",
      "content": "<assembled prompt — see below>"
    }
  ]
}
```

### Text Mode — User Message Content

```
Transform this rough description into the most precise, optimized prompt for building an exact UI with {framework}.

Input: "{user description}"
Framework: {framework}
Style focus: {style}
Colors: {colors if provided}
Font: {font if provided}

Generate a prompt covering: layout structure, component hierarchy, exact spacing/sizing, color tokens, typography scale, interactions, responsive behavior, accessibility attributes, and exact code patterns.

Return ONLY a JSON object with no markdown fences:
{
  "prompt": "the full optimized prompt (200-400 words)",
  "accuracy": "e.g. 98-99%",
  "layout": "brief layout description, max 5 words",
  "components": "key components comma-separated, max 5",
  "tokens": "low | medium | high"
}
```

### Image Mode — User Message Content

For image uploads, the content array includes both the base64 image and the text instruction:

```json
[
  {
    "type": "image",
    "source": {
      "type": "base64",
      "media_type": "image/png",
      "data": "<base64 string>"
    }
  },
  {
    "type": "text",
    "text": "Analyze this UI screenshot and generate an ultra-precise, engineer-ready prompt to recreate it exactly. Framework: {framework}. Style: {style}. Return ONLY JSON: { prompt, accuracy, layout, components, tokens }"
  }
]
```

### Response Parsing

```javascript
const data = await response.json();
const rawText = data.content.map(b => b.text || '').join('');
const clean = rawText.replace(/```json|```/g, '').trim();
const parsed = JSON.parse(clean);
// parsed.prompt, parsed.accuracy, parsed.layout, parsed.components, parsed.tokens
```

---

## 9. Feature Breakdown

### F1 — Text Description Input
- `<textarea>` with 800-character hard limit
- Live character counter (e.g., "142 / 800")
- Auto-resize or fixed height with scroll

### F2 — Image Upload
- Click-to-upload via hidden `<input type="file">`
- Drag-and-drop support on the drop zone div
- Preview uploaded image (max 200px height, object-fit: cover)
- Remove button overlay on image preview
- Accepted formats: PNG, JPG, WEBP, GIF
- File size warning if > 4MB (Claude API limit for base64)

### F3 — Framework Selector
Options (single-select pill buttons):
- React
- HTML/CSS
- Vue
- Figma Spec
- Any

### F4 — Style Selector
Options (single-select pill buttons):
- Pixel-perfect
- Clean Minimal
- Dark Mode
- Glassmorphism

### F5 — Color & Font Inputs
- Free text inputs, not required
- Color: accepts any format (hex, name, Tailwind token, design system name)
- Font: any font name or family

### F6 — Generate Button
- Disabled during loading
- Shows Bootstrap spinner while loading
- Re-enables on success or error

### F7 — Output Display
- Monospace `<pre>` block, scrollable at 220px max-height
- Accuracy badge (green Bootstrap badge)
- Breakdown row: Layout type | Key components | Token size

### F8 — Copy Button
- `navigator.clipboard.writeText(prompt)`
- Button text changes to "Copied ✓" for 2 seconds

### F9 — Regenerate
- Clears output, calls API again with same inputs

### F10 — Settings Panel
- API key input (stored via `chrome.storage.local`)
- Mode toggle: Direct API / Java Proxy
- Proxy URL field (default `http://localhost:8080`)
- Save button

---

## 10. Data Flow

### Step-by-step (Text Mode, Direct)

```
1. User types description in textarea
2. User selects framework pill → stored in JS variable `selectedFramework`
3. User selects style pill → stored in `selectedStyle`
4. User optionally fills color/font inputs
5. User clicks "Generate"
6. popup.js:
   a. Reads all values
   b. Validates: description must not be empty
   c. Assembles Claude API request body (JSON string)
   d. Retrieves API key from chrome.storage.local
   e. Calls fetch('https://api.anthropic.com/v1/messages', { method:'POST', ... })
   f. Sets button to loading state
7. Claude API responds with JSON
8. popup.js:
   a. Parses response → extracts content[0].text
   b. Strips markdown fences
   c. JSON.parse() the result
   d. Renders prompt in output box
   e. Updates accuracy badge
   f. Renders breakdown cards
   g. Reveals output section
   h. Re-enables button
```

### Step-by-step (Image Mode, Java Proxy)

```
1. User uploads image → FileReader converts to base64
2. User clicks "Generate"
3. popup.js assembles payload:
   { model, max_tokens, system, messages: [{ role:'user', content: [image_block, text_block] }] }
4. fetch('http://localhost:8080/generate', { method:'POST', body: JSON.stringify(payload) })
5. Java GenerateHandler receives request
6. Java ClaudeClient forwards to api.anthropic.com with server-side API key
7. Anthropic responds → Java returns response body to popup
8. popup.js parses and renders (same as above)
```

---

## 11. Error Handling

| Error | Display |
|---|---|
| Empty description | Inline red text below textarea: "Please describe what you want to build." |
| No image uploaded | Inline red text: "Please upload a UI image." |
| No API key saved | Settings panel opens automatically with message: "Add your Anthropic API key to get started." |
| API error (4xx/5xx) | Red Bootstrap alert below button: "API error. Check your API key and try again." |
| Network error | Red Bootstrap alert: "Network error. Check your internet connection." |
| JSON parse failure | Red Bootstrap alert: "Unexpected response from API. Please try again." |
| Image > 4MB | Inline warning on drop zone: "Image too large. Max 4MB. Please compress and retry." |
| Java backend unreachable | Red alert: "Java backend not running. Switch to Direct mode in Settings, or start the backend." |

All errors auto-dismiss after 5 seconds. Dismiss X button also shown.

---

## 12. Build & Run Instructions

### Loading the Extension in Chrome

```
1. Clone or copy the /extension folder to your machine
2. Open Chrome → chrome://extensions
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked"
5. Select the /extension folder
6. PromptForge icon appears in the toolbar
7. Click icon → popup opens
```

### Direct Mode (No Backend)

```
1. Open popup → click Settings gear
2. Paste your Anthropic API key
3. Select mode: "Direct"
4. Click Save
5. Use normally — no backend needed
```

### Backend Mode (Java Server)

```bash
# 1. Navigate to backend folder
cd promptforge/backend

# 2. Set your API key
export ANTHROPIC_API_KEY="sk-ant-..."

# 3. Compile
chmod +x compile.sh && ./compile.sh

# 4. Run
chmod +x run.sh && ./run.sh
# Output: "PromptForge backend running on port 8080"

# 5. In the extension popup → Settings → Mode: Java Proxy
# 6. Backend URL: http://localhost:8080
# 7. Save and generate
```

### Java Requirements

- Java 17 or later (`java --version`)
- No Maven, no Gradle, no external JARs
- Uses only `java.net.http`, `com.sun.net.httpserver` (both in JDK 17+)

---

## 13. Constraints & Rules

### Must Follow

- HTML must be valid HTML5. No inline `onclick` handlers — use `addEventListener` in popup.js.
- All JavaScript in `popup.js` only. No `<script>` tags in HTML (Chrome MV3 CSP blocks them).
- Bootstrap 5.3 must be bundled locally in `lib/bootstrap.min.css` — no CDN links.
- API key must never be hardcoded in source files. Store in `chrome.storage.local` (Direct mode) or in environment variable (Java backend mode).
- Image base64 conversion must happen in `FileReader` in JS — never send raw binary.
- Java backend must handle CORS headers on every response (`Access-Control-Allow-Origin: *`).
- Java `HttpServer` must respond to `OPTIONS` preflight with `204`.
- All user-visible strings must be sentence case. No ALL CAPS labels.
- The popup width is fixed at `420px`. Do not make it wider or add horizontal scroll.
- Output `<pre>` block must have `white-space: pre-wrap` and `word-break: break-word` to prevent overflow.

### Must Not Do

- Do not use React, Vue, Angular, or any JS framework in the extension popup.
- Do not use Maven or Gradle for the Java backend.
- Do not use Spring, Micronaut, or any Java framework.
- Do not use external Java libraries (no Gson, no OkHttp). Only JDK 17 standard library.
- Do not use `manifest_version: 2`.
- Do not use `eval()` or dynamic code execution anywhere.
- Do not store the API key in `localStorage` (it's not available in extension popups — use `chrome.storage.local`).
- Do not make the popup taller than 600px without an internal scroll container.

---

*End of specification. See AGENT_PROMPT.md for the single-shot agent build prompt.*
