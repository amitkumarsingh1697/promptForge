# AGENT_PROMPT.md
## Single-Shot Build Prompt — PromptForge Chrome Extension

> **How to use:** Copy everything below the horizontal rule and paste it into any AI coding agent (Cursor, Claude, ChatGPT, Copilot, Gemini, etc.) as a single message. The agent should produce every file needed to run the extension without any follow-up questions.

---

## PROMPT START — COPY FROM HERE

You are a senior full-stack engineer. Build a complete, production-ready Chrome browser extension called **PromptForge** from scratch. Follow every instruction exactly. Do not use any framework not listed. Do not skip any file.

---

### WHAT THE EXTENSION DOES

PromptForge is a Chrome extension popup that:
1. Accepts a plain-English description of a UI the user wants to build, OR accepts a UI screenshot uploaded by the user.
2. Lets the user select a target framework (React / HTML+CSS / Vue / Figma Spec / Any), a style focus (Pixel-perfect / Clean Minimal / Dark Mode / Glassmorphism), and optionally a color palette and font.
3. Sends the input to the Anthropic Claude API and receives back a structured, hyper-detailed prompt engineered to recreate the described or shown UI with ~99% accuracy.
4. Displays the generated prompt in a copyable monospace output box, along with an accuracy badge, layout type, key components, and token size estimate.

---

### TECH STACK — STRICT

| Layer | Technology |
|---|---|
| Extension shell | Chrome Extension Manifest V3 |
| Popup UI | HTML5 + CSS3 + Bootstrap 5.3 (bundled locally, NO CDN) |
| JavaScript | Vanilla ES6+ only. No React, No Vue, No jQuery |
| Backend (optional) | Java 17 Core only. No Spring, No Maven, No external JARs |
| AI model | Anthropic Claude API, model: `claude-sonnet-4-20250514` |
| Key storage | `chrome.storage.local` (Direct mode) OR env var (Java mode) |

---

### FILES TO CREATE — ALL ARE REQUIRED

```
promptforge/
├── extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── popup.css
│   ├── background.js
│   ├── icons/
│   │   └── (placeholder 16x16, 48x48, 128x128 PNG icons — generate simple solid-color squares if needed)
│   └── lib/
│       └── bootstrap.min.css    ← NOTE: Download Bootstrap 5.3 CSS and bundle it here
│
└── backend/
    ├── src/com/promptforge/
    │   ├── Main.java
    │   ├── GenerateHandler.java
    │   ├── ClaudeClient.java
    │   └── CorsHandler.java
    ├── compile.sh
    └── run.sh
```

---

### FILE 1 — manifest.json

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
  "permissions": ["storage", "activeTab"],
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

---

### FILE 2 — popup.html

Write a complete, valid HTML5 file. Width is exactly 420px set on `<body>`. Use Bootstrap 5.3 classes throughout. Structure:

**Header row:**
- Left: SVG logo icon (20x20, hexagon shape, dark fill) + "PromptForge" title (bold, 15px) + subtitle "UI Prompt Generator" (muted, 11px)
- Right: Bootstrap badge `bg-success` with text "~99% accuracy"

**Input tabs (Bootstrap nav-tabs):**
- Tab 1 label: "Describe it"
- Tab 2 label: "Upload image"

**Tab 1 content:**
- `<textarea id="desc-input">` with placeholder: `e.g. A fintech dashboard with dark sidebar, KPI cards, revenue chart, and transaction table...`
- maxlength="800"
- Below textarea: character counter `<small id="char-count">0 / 800</small>` right-aligned

**Tab 2 content:**
- `<div id="drop-zone" class="drop-zone">` with upload SVG icon, text "Click to upload or drag & drop", subtext "PNG, JPG, WEBP"
- Hidden `<input type="file" id="file-input" accept="image/*">`
- `<div id="img-preview-wrap" style="display:none">` containing `<img id="img-preview">` and `<button id="img-remove">✕</button>`

**Options section (below tabs, always visible):**
- Label: "Framework" (small, muted)
- 5 pill buttons: React (default selected), HTML/CSS, Vue, Figma Spec, Any — use class `pill-btn` and `active` for selected
- Label: "Style focus"
- 4 pill buttons: Pixel-perfect (default selected), Clean Minimal, Dark Mode, Glassmorphism
- Two Bootstrap `<input type="text">` side by side:
  - id="color-input" placeholder="Color palette (e.g. #1a1a2e, indigo)"
  - id="font-input" placeholder="Font (e.g. Inter, DM Sans)"

**Generate button:**
- `<button id="gen-btn" class="btn btn-dark w-100">`
- Content: `<span class="spinner-border spinner-border-sm d-none" id="spinner"></span> <span id="btn-text">Generate optimized prompt</span>`

**Error message:**
- `<div id="error-msg" class="alert alert-danger mt-2 d-none small py-2"></div>`

**Output section** (`<div id="output-section" class="d-none">`):
- `<hr>`
- Row: label "Generated Prompt" (small, uppercase, muted) + `<span id="acc-badge" class="badge bg-success">`
- `<div id="output-box" class="output-box"></div>`
- Breakdown: 3-column grid of `.breakdown-card` divs, each with `.breakdown-label` and `.breakdown-value`
  - id="breakdown-layout", id="breakdown-components", id="breakdown-tokens"
- 3 action buttons in a row: id="copy-btn" text "Copy prompt", id="regen-btn" text "Regenerate", id="settings-btn" text "⚙"

**Settings panel** (`<div id="settings-panel" class="d-none border-top mt-2 pt-2">`):
- Label + `<input type="password" id="api-key-input" class="form-control form-control-sm">` placeholder "sk-ant-..."
- Label "Mode" + Bootstrap button group: id="mode-direct" "Direct" | id="mode-proxy" "Java Proxy"
- Proxy URL: `<input type="text" id="proxy-url" class="form-control form-control-sm" value="http://localhost:8080">`
- `<button id="save-settings-btn" class="btn btn-sm btn-primary w-100">Save settings</button>`
- `<small id="settings-msg" class="text-muted"></small>`

Link to local CSS files only: `<link rel="stylesheet" href="lib/bootstrap.min.css">` and `<link rel="stylesheet" href="popup.css">`. Link script: `<script src="popup.js"></script>` at end of body.

No inline `<script>` blocks. No inline `onclick` attributes.

---

### FILE 3 — popup.css

Write CSS for:
- `body { width: 420px; min-height: 300px; font-size: 13px; padding: 12px; }`
- `.drop-zone` — dashed border, centered content, hover and `.drag-over` states
- `.pill-btn` — rounded pill style, border, cursor pointer. `.active` state: dark background, white text
- `.output-box` — monospace font (Courier New), 12px, line-height 1.6, light gray background, border, 6px radius, 12px padding, max-height 220px, overflow-y auto, white-space pre-wrap, word-break break-word
- `.breakdown-card` — light gray bg, border, 6px radius, 8px padding, text-align center
- `.breakdown-label` — 10px, uppercase, letter-spacing, muted gray
- `.breakdown-value` — 12px, font-weight 600
- `#img-preview` — width 100%, max-height 180px, object-fit cover, border-radius 6px
- `#img-remove` — absolute positioned top-right of preview wrap, dark bg, white color, 24x24px, border-radius 50%, border none, cursor pointer

---

### FILE 4 — popup.js

Write complete vanilla JS. All logic here. No `onclick` in HTML. Use `document.addEventListener('DOMContentLoaded', ...)` as the entry point.

**State variables at top:**
```js
let currentTab = 'text';       // 'text' | 'image'
let uploadedImageData = null;  // base64 data URL string
let uploadedMimeType = null;   // 'image/png' etc
let selectedFramework = 'React';
let selectedStyle = 'Pixel-perfect';
let lastGeneratedPrompt = '';
let isProxyMode = false;
let proxyUrl = 'http://localhost:8080';
```

**Functions to implement:**

`initTabs()` — click listeners on both tab buttons. On click: set currentTab, toggle `.active` on nav links, show/hide tab content divs.

`initPills()` — click listeners on all `.pill-btn` elements. On click: remove `.active` from siblings in same group, add `.active` to clicked, update selectedFramework or selectedStyle.

`initImageUpload()` — click on drop-zone triggers file-input click. dragover: prevent default + add `.drag-over`. dragleave: remove `.drag-over`. drop: handle file. change on file-input: handle file. Remove button: clears image state, hides preview, shows drop-zone.

`loadImageFile(file)` — validate type (image/*) and size (max 4MB, else show error). Use FileReader to read as data URL. On load: set uploadedImageData and uploadedMimeType, show img-preview-wrap, hide drop-zone.

`updateCharCount()` — input event on textarea, update char-count span.

`showError(msg)` — show error-msg div, auto-hide after 5000ms.

`showOutput(parsed)` — reveal output-section, set output-box textContent to parsed.prompt, set acc-badge text to parsed.accuracy, set breakdown cards from parsed.layout / parsed.components / parsed.tokens. Store in lastGeneratedPrompt.

`buildApiPayload(apiKey)` — assembles the Anthropic API request body as a JS object:
- model: 'claude-sonnet-4-20250514'
- max_tokens: 1000
- system: "You are an expert UI/UX prompt engineer. Your prompts are hyper-precise, structured, and produce pixel-accurate results. Always return valid JSON only — no markdown fences, no preamble."
- For text mode: messages[0].content is a string with the full instruction including selectedFramework, selectedStyle, color/font values, and the user's description.
- For image mode: messages[0].content is an array: [{type:'image', source:{type:'base64', media_type: uploadedMimeType, data: base64DataOnly}}, {type:'text', text: instruction string}]

The user content/instruction must explicitly ask Claude to return ONLY a JSON object (no markdown) with keys: prompt, accuracy, layout, components, tokens.

`callApi(payload)` — async function. If isProxyMode: fetch proxyUrl + '/generate', POST, JSON body = payload (Claude API format — the Java backend forwards it as-is). If Direct mode: fetch 'https://api.anthropic.com/v1/messages', POST, headers include 'x-api-key' and 'anthropic-version: 2023-06-01'. Parse response JSON, extract text from content array, strip markdown fences, JSON.parse, return parsed object.

`generatePrompt()` — main handler for gen-btn click:
1. Validate inputs
2. Load API key from chrome.storage.local
3. If no API key → open settings panel, show message
4. Set loading state (disable btn, show spinner, update btn text)
5. Call buildApiPayload() then callApi()
6. On success: call showOutput()
7. On error: showError()
8. Always: restore btn state

`copyPrompt()` — navigator.clipboard.writeText(lastGeneratedPrompt), change copy-btn text to "Copied ✓" for 2s.

`initSettings()` — on DOMContentLoaded, load saved settings from chrome.storage.local (api key, mode, proxy url), populate inputs. Settings btn click: toggle settings-panel visibility. Save btn click: read inputs, save to chrome.storage.local, show "Saved!" in settings-msg.

---

### FILE 5 — background.js

```js
// Service worker placeholder — required by Manifest V3
chrome.runtime.onInstalled.addListener(() => {
  console.log('PromptForge installed.');
});
```

---

### FILE 6 — backend/src/com/promptforge/Main.java

```java
package com.promptforge;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;

public class Main {
    public static void main(String[] args) throws Exception {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/generate", new GenerateHandler());
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
```

---

### FILE 7 — backend/src/com/promptforge/GenerateHandler.java

Implement `HttpHandler`. On every response, add CORS headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

Handle OPTIONS (preflight) → 204 no content.
Handle non-POST → 405.
Handle POST: read full request body as UTF-8 string, pass to `new ClaudeClient().generate(body)`, write result as response with Content-Type application/json, status 200.
Wrap in try-catch: on IOException, return 500 with error message JSON.

---

### FILE 8 — backend/src/com/promptforge/ClaudeClient.java

Use `java.net.http.HttpClient` and `java.net.http.HttpRequest`. Read API key from `System.getenv("ANTHROPIC_API_KEY")`. Throw `IllegalStateException` if null.

POST to `https://api.anthropic.com/v1/messages` with:
- Header: `Content-Type: application/json`
- Header: `x-api-key: {API_KEY}`
- Header: `anthropic-version: 2023-06-01`
- Body: the requestJson passed in (the full Anthropic API payload sent by the popup)

Set connect timeout 15s, request timeout 60s. Return the raw response body string.

---

### FILE 9 — backend/src/com/promptforge/CorsHandler.java

Utility class with a static method `addCorsHeaders(HttpExchange exchange)` that adds the three CORS headers. GenerateHandler calls this at the top of every handle() call.

---

### FILE 10 — backend/compile.sh

```bash
#!/bin/bash
set -e
mkdir -p out
find src -name "*.java" | xargs javac -d out
echo "Build successful. Run with: ./run.sh"
```

---

### FILE 11 — backend/run.sh

```bash
#!/bin/bash
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "Error: ANTHROPIC_API_KEY environment variable is not set."
  echo "Usage: ANTHROPIC_API_KEY=sk-ant-... ./run.sh"
  exit 1
fi
java -cp out com.promptforge.Main
```

---

### BEHAVIOR RULES — ENFORCE THESE IN YOUR CODE

1. No inline `onclick` attributes in HTML. All event listeners via `addEventListener` in popup.js.
2. No `<script>` tags inside popup.html (Chrome MV3 CSP will block them).
3. Bootstrap must be referenced as `lib/bootstrap.min.css` — a local file. No CDN link.
4. API key is retrieved from `chrome.storage.local` on every generate call. Never hardcode.
5. Image base64 string passed to the API must NOT include the `data:image/png;base64,` prefix — strip it before sending.
6. Java backend must handle CORS. The OPTIONS preflight must return 204 (not 200).
7. The Java backend receives the full Anthropic API payload from the popup and forwards it as-is. The backend does NOT construct the Claude prompt — it only proxies.
8. All error messages shown in the popup must auto-dismiss after 5 seconds.
9. Popup width is exactly 420px. No horizontal scroll.
10. Output div must use `white-space: pre-wrap` and `word-break: break-word`.

---

### EXPECTED OUTPUT FORMAT FROM CLAUDE API

The popup parses the Claude API response and expects the content text to be a raw JSON object (no markdown fences) with exactly these keys:

```json
{
  "prompt": "Full detailed engineering prompt, 200-400 words, covering layout, components, spacing, colors, typography, interactions, responsive behavior, accessibility, and exact code patterns for the specified framework.",
  "accuracy": "98-99%",
  "layout": "Sidebar + main content",
  "components": "NavBar, KPI Cards, LineChart, DataTable",
  "tokens": "medium"
}
```

If parsing fails, show error: "Unexpected response from API. Please try again."

---

### FINAL CHECKLIST — BEFORE DECLARING DONE

- [ ] `manifest.json` has `manifest_version: 3`
- [ ] `popup.html` has no inline scripts and no CDN links
- [ ] `popup.js` uses `DOMContentLoaded` and `addEventListener` only
- [ ] `chrome.storage.local` is used for API key storage
- [ ] Image upload strips `data:...base64,` prefix before sending to API
- [ ] Java server handles OPTIONS preflight → 204
- [ ] Java server adds CORS headers on every response
- [ ] Java `ClaudeClient` reads API key from `ANTHROPIC_API_KEY` env var
- [ ] `compile.sh` and `run.sh` are executable and correct
- [ ] Output box prevents horizontal overflow
- [ ] Settings panel saves and loads from chrome.storage.local
- [ ] Character counter updates on textarea input
- [ ] Copy button gives 2-second "Copied ✓" feedback
- [ ] Generate button re-enables after success or error

## PROMPT END
