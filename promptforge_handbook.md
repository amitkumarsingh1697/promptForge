# PromptForge: The Complete Product Handbook
## Product Requirements Document (PRD), Technical Architecture, and User Guide

---

# 1. Executive Summary

## 1.1 Product Overview
**PromptForge** is an enterprise-grade developer utility and software-as-a-service (SaaS) ecosystem designed to bridge the gap between design concepts and front-end code generation. The product allows developers, designers, and product teams to translate plain-English descriptions, visual mockups, live DOM stylesheets, or Figma layers recursively into hyper-precise, engineer-ready prompt specifications. These generated prompts are optimized for consumption by AI code generation platforms such as Vercel v0, Cursor, Windsurf, Claude Artifacts, and ChatGPT, enabling near-instant UI recreation with up to 99% layout and styling fidelity.

PromptForge is packaged as a two-part frontend collection—a high-performance **Chrome Extension** (Manifest V3) and a native **Figma Plugin Companion**—supported by a resilient, multi-threaded **Java proxy routing gateway** middleware and a hosted **Supabase cloud database** backend.

```
+-----------------------------------------------------------------+
|                         PROMPTFORGE CLIENTS                     |
|                                                                 |
|  +---------------------------+     +-------------------------+  |
|  | Chrome Extension (MV3)    |     | Figma Plugin Companion  |  |
|  | - Computed DOM Harvester  |     | - Recursively parses    |  |
|  | - Screenshot Capture      |     |   geometry tree         |  |
|  +---------------------------+     +-------------------------+  |
+-----------------------------------------------------------------+
                                |
             +------------------+------------------+
             |                                     |
             v                                     v
+--------------------------+             +------------------------+
|    Direct Client API     |             |   Java Proxy Gateway   |
| (Optional Bypass Route)  |             | (Default Secure Route) |
| - Calls LLMs directly    |             | - Injects server keys  |
| - Key stored in local    |             | - Handles Fallbacks    |
|   extension storage      |             | - JWT Signature check  |
|                          |             | - Telemetry Logging    |
+--------------------------+             +------------------------+
             |                                     |
             +------------------+------------------+
                                |
                                v
+-----------------------------------------------------------------+
|                       CLOUD SERVICES LAYER                      |
|                                                                 |
|  +---------------------------+     +-------------------------+  |
|  |  Supabase Cloud Database  |     |   Global LLM Engines    |  |
|  |  - workspace_presets      |     |  - Gemini 1.5 Flash     |  |
|  |  - prompt_history         |     |  - Claude 3.5 Sonnet    |  |
|  |  - User Identity Auth     |     |  - GPT-4o / DeepSeek    |  |
|  +---------------------------+     +-------------------------+  |
+-----------------------------------------------------------------+
```

## 1.2 Vision and Mission
*   **Vision**: To establish the industry-standard translation layer between visual designs and generative AI coding engines, eliminating the manual overhead of writing CSS styles and layout definitions.
*   **Mission**: To empower builders to convert screenshots, code variable sheets, or Figma layers into production-ready front-end code bases within seconds, using precise and automated prompt compilation.

## 1.3 Problem Statement
Generative AI models are highly capable of writing clean React, Vue, Svelte, or HTML code. However, they suffer from a severe **design-context gap**. Plain-English prompts like *"build a beautiful dark-mode dashboard"* contain zero instructions on spacing hierarchies, margin scales, typographic scales, active borders, container alignments, or color palettes. As a result:
1.  Generative outcomes achieve less than 70% layout and visual parity.
2.  Developers waste hours copy-pasting CSS styles, adjusting Tailwind classes, and matching typography to design files.
3.  Designers struggle to enforce corporate design system tokens (spacing, typography, color palettes) during rapid AI-driven prototyping.

## 1.4 Solution Offered
PromptForge captures the underlying design details directly from the source—either through live page DOM style traversal, automated tab screenshots, or Figma selection vector trees—and combines them with framework presets and design system tokens. It processes this raw information through an instructions compiler, generating a structured layout specification. The model then outputs a prompt defining:
*   Exact layout systems (CSS Grid, Flexbox, columns) and alignments.
*   Typographic hierarchies (font sizes, line heights, letter spacing, font families).
*   Complete color token allocations (surface layers, borders, accents, text levels).
*   Interactive behaviors (hover transitions, active, focused, and disabled states).
*   Component relationships (parent-to-child nested tree structures).

## 1.5 Target Audience
*   **Frontend Developers**: Seeking to skip boilerplate HTML/CSS construction and move straight to business logic.
*   **UI/UX Designers**: Wanting to translate Figma assets into working prototypes without engineering handoff delays.
*   **Product Managers & Prototypers**: Looking to generate functional high-fidelity UI simulations for feedback sessions.
*   **Software Teams**: Operating within shared design systems that require strict token compliance.

## 1.6 Competitive Advantages & Key Differentiators
*   **Hybrid Execution Infrastructure**: Supports Bring-Your-Own-Key (BYOK) direct client-side routing for power developers, alongside secure SaaS routing via a cloud gateway proxy.
*   **Multi-Model Resilient Fallback Routing**: If the primary LLM client fails or encounters rate limits (e.g., Claude), the Java gateway automatically retries with a secondary network provider (e.g., Gemini) in milliseconds, preventing downtime.
*   **Deep DOM Style Harvester**: A content script extracts computed styles, custom CSS properties (`--*`), and layout configurations from any active web tab.
*   **Figma Geometry Sandbox Analyzer**: Companion plugin reads Figma frame layouts recursively, translating nested nodes, spacing parameters, solid colors, and coordinates into text instructions.
*   **Downstream Specialized Exporters**: Rather than exporting generic markdown text, PromptForge structures outputs with specific XML tag hooks optimized for Cursor, v0.dev, or Claude Artifacts.

---

# 2. Product Architecture

PromptForge uses a modular, decoupled client-server architecture. Below is a detailed description of the components and the technical systems governing the application lifecycle.

## 2.1 System Architecture Diagram
```
                              +--------------------+
                              |  Figma Selection   |
                              +---------+----------+
                                        |
                                        v
+------------------+          +---------+----------+          +------------------+
|  Active Web Tab  |          | Figma Companion    |          | Chrome Extension |
|  - HTML & CSS    |          | Plugin (ui.html)   |          | Popup UI         |
+--------+---------+          +---------+----------+          +--------+---------+
         |                              |                              |
         | (content.js injection)       | (postMessage iframe bridge)  |
         +----------------------------->+<-----------------------------+
                                        |
                                        v
                              +---------+----------+
                              | Client State Engine|
                              | - Presets cache    |
                              | - Token parsing    |
                              | - Base64 imaging   |
                              +---------+----------+
                                        |
                                        +-------------------------------------+
                                        |                                     |
                                 (Direct Route)                        (Proxy Route)
                                        |                                     |
                                        v                                     v
                              +---------+----------+                +---------+----------+
                              | Public LLM APIs    |                | Java Proxy Gateway |
                              | - Gemini API       |                | (GenerateHandler)  |
                              +--------------------+                +---------+----------+
                                                                              |
                                                                              | (verifyJwt token)
                                                                              v
                                                                    +---------+----------+
                                                                    | Supabase Auth / DB |
                                                                    | - token verify     |
                                                                    +---------+----------+
                                                                              |
                                                                              | (Server API Key)
                                                                              v
                                                                    +---------+----------+
                                                                    | Premium LLM APIs   |
                                                                    | - Gemini / Claude  |
                                                                    +--------------------+
```

## 2.2 Frontend Architecture (Chrome Extension & Figma Plugin)
The client interfaces are constructed as lightweight, bootstrap-free, performance-optimized, single-page web assets.
*   **Chrome Extension Shell**: Built upon Manifest V3, the extension uses `chrome.storage.local` to securely cache configuration keys, session states, and saved workspaces. An active content script (`content.js`) is injected programmatically into web tabs to extract design systems and calculated variables, communicating them back to the popup controllers using Chrome runtime message passing.
*   **Figma Plugin Companion**: Runs in Figma's sandboxed canvas environment. The background controller (`code.js`) traverses the selected node layer, extracts details from the canvas node tree, and sends this data through a `postMessage` bridge to the user interface iframe (`ui.html`).

## 2.3 Backend Architecture (Java Proxy Gateway)
The middleware is a lightweight, zero-dependency Java HttpServer built on JDK 17 standard libraries. It uses a cached thread executor to handle concurrent requests under load.
*   **Entry Point (`Main.java`)**: Configures port bindings, spins up the thread pool, and maps path routing contexts for `/generate`, `/telemetry`, and `/health`.
*   **CORS Route Validation (`CorsHandler.java`)**: Implements strict cross-origin policies, checking incoming browser Origin headers against an allowed list of Chrome extensions, Figma domains, and localhost dev spaces.
*   **Proxy Routing Middleware (`GenerateHandler.java`)**:
    1.  Receives request payloads containing UI variables, screenshot imagery, or node variables.
    2.  Verifies the authorization status of incoming connections (checks developer API bypass keys or executes JWT signature checks).
    3.  Compiles layout and style instructions on the server.
    4.  Formats request payloads according to the target LLM client's schema.
    5.  Implements error-capturing client dispatch loops with automated fallbacks.
    6.  Parses responses, extracts prompt values, and normalizes output structures before returning them to the user.

## 2.4 Database Architecture
Persistent state, workspace configurations, and user history are backed by a hosted Supabase database. The client applications communicate with the database via REST queries through Supabase's PostgREST engine.
*   **`workspace_presets` Table**: Saves target styles, colors, frameworks, and team identifiers, allowing team configurations to sync across client popups.
*   **`prompt_history` Table**: Stores compiled prompts, styles, and favorite bookmarks, allowing users to restore past configurations.

## 2.5 API Architecture & Client Interfaces
The API is split into two modes:
1.  **Direct Mode (No Backend)**: The client application communicates directly with the LLM API endpoints (e.g., Anthropic Messages API or Google Generative Language API) using the user's personal API keys, which are stored securely in local browser memory.
2.  **Proxied Mode (With Java Backend)**: Requests are sent to the Java proxy server `/generate` endpoint. The proxy manages all model API connections, timeout handling, and server-side model fallback configurations, keeping API keys hidden from the browser client.

## 2.6 Authentication & Authorization Flow
Authentication is managed via Supabase's JSON Web Token (JWT) system.
1.  **User Log In**: The user enters their email and password or uses OAuth (Google/GitHub) in the settings panel.
2.  **Token Issuance**: Supabase returns a signed JWT containing user metadata, expiry timestamps (`exp`), and role claims.
3.  **Proxy Authorization Check**: The client includes the JWT token as a Bearer header in requests to the Java backend. The `GenerateHandler` verifies the signature using the server's `SUPABASE_JWT_SECRET` key and checks if the token has expired before granting access.
4.  **Bypass Access**: Developers running the backend locally can bypass JWT checks by providing a direct API key header (`X-API-Key`), allowing them to make proxy requests without authentication.

## 2.7 Multi-Model Fallback Routing & Failure Handling
The proxy handler contains a fallback loop to protect against model failures, rate limits, or network timeouts:
*   **Default Route**: The client requests prompt generation using a preferred model (e.g., Claude 3.5 Sonnet).
*   **Failure Trigger**: If the primary request fails, times out (after 60 seconds), or returns a status code other than 200, the proxy logs the failure.
*   **Fallback Dispatch**: The proxy selects the fallback model (e.g., Gemini 1.5 Flash), reads its API key from the environment variables, formats the payload for the new model, and dispatches the request.
*   **Telemetry Log**: The proxy logs the execution duration, the success status of the fallback, and the errors encountered during the request.

---

# 3. Technology Stack

Below is the complete list of technologies powering the PromptForge ecosystem:

### 3.1 Frontend (Chrome Extension & Figma Plugin)
*   **Core UI Shell**: HTML5 and Vanilla CSS3.
*   **Logic Controller**: Vanilla JavaScript (ES6+), with no build tools or package dependencies to ensure low latency and security.
*   **Icon Assets**: Raw vector inline SVGs, style-responsive and scale-independent.
*   **Avatar Renderer**: Dicebear bot avatar generator integration.
*   **Typography**: Outfit (UI primary sans-serif) and JetBrains Mono (monospaced prompt rendering) loaded via Google Fonts.

### 3.2 Backend (Proxy Gateway)
*   **Runtime Environment**: Java Standard Edition (JDK 17 or higher).
*   **Networking**: Standard `com.sun.net.httpserver.HttpServer` and `java.net.http.HttpClient`.
*   **Multithreading**: Native `java.util.concurrent.ThreadPoolExecutor` configured as a cached thread pool.
*   **Cryptography & Signature Checks**: `javax.crypto.Mac` using HMAC-SHA256 algorithms.

### 3.3 Database & Cloud SaaS Storage
*   **Database Management System**: PostgreSQL hosted on Supabase Cloud.
*   **Client Communication Protocol**: Supabase PostgREST (native HTTP API calls).
*   **Authentication Engine**: Supabase GoTrue Auth (supporting password logins and OAuth2 providers).

### 3.4 AI Stack & Model Integrations
*   **Anthropic API**: Connecting to `claude-3-5-sonnet-20241022` (primary prompt generation model).
*   **Google Gemini API**: Connecting to `gemini-1.5-flash` (used as the primary fallback model).
*   **OpenAI API**: Supporting standard GPT-4o models.
*   **DeepSeek API**: Compatible with OpenAI-style endpoints for cost-optimized generations.
*   **Groq API**: For ultra-fast Llama-3-70b-8192 inference.
*   **Mistral AI API**: Connects to the Mistral Large model family.

### 3.5 DevOps & Deployment
*   **Containerization**: Docker configuration for deploying the Java gateway.
*   **Hosting**: Render / Heroku compatibility for backend proxies, and Vercel for Figma plugins.
*   **Logging**: Standard `java.util.logging.Logger` outputting structured JSON statements to system logs.

---

# 4. Complete Feature Inventory

Here is the complete functional catalog of the PromptForge ecosystem, including user workflows, edge cases, and technical details.

## 4.1 Input Context System

### 4.1.1 Text Input & Rich Text Editor (RTE)
*   **Purpose**: Enables plain-English descriptions of layout desires.
*   **User Benefit & Business Value**: Accelerates initial developer onboarding by removing structural syntax requirements. Speeds up mock-up scoping processes to reduce time-to-market.
*   **Technical Implementation**: Custom toolbar selectors map standard `document.execCommand` methods to a `contenteditable` layout wrapper (`#desc-txt`), which formats inputs on the fly.
*   **User Workflow**: User types description -> clicks bold/italic formatting buttons or inputs bullet details -> views live character count update.
*   **Edge Cases**:
    *   *Paste Overflow*: Programmatically intercepts paste events and truncates characters exceeding the 1500 limit.
    *   *HTML Strip Down*: Converts complex styling blocks down to Markdown formatting tags before prompt assembly.
*   **Error Handling**: Triggers red alert warnings if user attempts compile submissions while input remains empty.

### 4.1.2 AI "Refine Description" Tool
*   **Purpose**: Enhances user descriptions for grammatical accuracy.
*   **User Benefit & Business Value**: Enhances prompt specificity to ensure higher generation accuracy. Prevents developer errors caused by vague or poorly structured input text.
*   **Technical Implementation**: Serializes active text and calls a specialized, system-prompted LLM endpoint to output clean grammar revisions.
*   **User Workflow**: User clicks the ✨ Refine button -> loading indicator spins -> corrected text loads into editor.
*   **Edge Cases**:
    *   *Offline Target Agents*: Reverts to local direct overrides if proxy endpoint is offline.
*   **Error Handling**: Logs failures to the error banner and preserves the user's original text.

### 4.1.3 Screenshot Image Upload (Drag-and-Drop)
*   **Purpose**: Ingests design screenshots.
*   **User Benefit & Business Value**: Replaces manual asset inspection with automated image processing. Speeds up UI layout verification for QA testers.
*   **Technical Implementation**: Listens to drag-and-drop actions on a zone container, processes files using `FileReader`, and stores them as base64 data URLs.
*   **User Workflow**: User drags mockup image -> drop zone displays image preview -> clicks (✕) remove icon to clear.
*   **Edge Cases**:
    *   *Huge Files*: Blocks images over 4MB to prevent connection timeouts.
*   **Error Handling**: Displays file size warnings directly inside the drop zone area.

### 4.1.4 Deep DOM & URL Style Harvester
*   **Purpose**: Extracts CSS variables, typography configurations, and theme metadata from active web pages.
*   **User Benefit & Business Value**: Captures live production variables instantly, eliminating the need to inspect page elements manually. Enforces styling consistency for developers migrating designs to code.
*   **Technical Implementation**: Injects `content.js` to parse root variables and metadata across available stylesheets, capturing screenshots using browser APIs.
*   **User Workflow**: User enters active URL -> content scripts scrape page styles -> extension captures tab screenshots.
*   **Edge Cases**:
    *   *Cross-Origin Blocking*: Filters out cross-origin stylesheets to prevent browser security blocks.
*   **Error Handling**: Logs issues in developer console logs and falls back to scanning default Tailwind styles.

---

## 4.2 Workspace Customization System

### 4.2.1 Framework & Style Selectors
*   **Purpose**: Configures output styles and target development frameworks.
*   **User Benefit & Business Value**: Ensures prompts align with the team's tech stack (e.g., React, Svelte, Tailwind), reducing manual code refactoring.
*   **Technical Implementation**: Pill buttons bind selection states to JavaScript strings, which are appended to compiler system instructions.
*   **User Workflow**: User clicks framework options -> active styling highlights selected pill.

### 4.2.2 Color Palette Input & Spectrum Picker
*   **Purpose**: Enforces specific brand colors in prompts.
*   **User Benefit & Business Value**: Ensures generated UIs align with brand guidelines. Reduces developer design review cycles.
*   **Technical Implementation**: Custom text inputs sync color properties with a native spectrum color picker.
*   **User Workflow**: User changes color value or opens color spectrum picker -> interface border colors update to match selection.

### 4.2.3 Typography Selection Dropdown
*   **Purpose**: Enforces brand font standards.
*   **User Benefit & Business Value**: Ensures typography consistency across all UI generation platforms.
*   **Technical Implementation**: Selection dropdown menus map target fonts to final prompt instructions.
*   **User Workflow**: User selects font option (e.g., Inter) -> dropdown updates display value.

### 4.2.4 Design Tokens Input Panel
*   **Purpose**: Restricts prompts to custom design system variables.
*   **User Benefit & Business Value**: Automates compliance with corporate design systems, preventing layout inconsistencies.
*   **Technical Implementation**: Parses pasted JSON and CSS variables to extract custom design tokens.
*   **User Workflow**: User pastes JSON or CSS custom variables -> status label displays parsed variables.
*   **Edge Cases**:
    *   *Malformed JSON*: Logs syntax validation errors without crashing the app.
*   **Error Handling**: Displays *"No design tokens parsed"* if validation fails.

---

## 4.3 Workspace Presets Engine
*   **Purpose**: Caches environment configurations (frameworks, styles, colors, fonts) to allow users to apply saved workspaces quickly.
*   **User Benefit & Business Value**: Reduces workspace setup time for designers and developers. Enables teams to share consistent design baselines.
*   **Technical Implementation**: Limits presets to 3 entries, syncing changes with local memory storage and Supabase servers.
*   **User Workflow**: User enters preset name -> clicks Save -> preset pill appears -> clicks pill to load settings.
*   **Edge Cases**:
    *   *Quota Overflow*: Blocks users from saving more than 3 presets.
*   **Error Handling**: Alerts user with: *"Maximum 3 presets allowed. Please delete an existing preset first."*

---

## 4.4 Generation & Output Actions

### 4.4.1 Split Copy Control with Specialized Exports
*   **Purpose**: Formats compiled prompts for specific coding platforms (v0.dev, Cursor, Claude).
*   **User Benefit & Business Value**: Eliminates manual copy-pasting and formatting steps, speeding up the design-to-code workflow.
*   **Technical Implementation**: Arrow triggers display dropdown actions, wrapping output prompts in specific XML structures.
*   **User Workflow**: User clicks copy dropdown -> selects target platform (e.g., Cursor) -> copies formatted output -> copies raw text.
*   **Edge Cases**:
    *   *Null Prompts*: Blocks copy actions if the output prompt field is empty.
*   **Error Handling**: Reverts button label to original state after 2 seconds.

### 4.4.2 Qualitative Satisfaction Loop
*   **Purpose**: Collects user feedback on prompt quality.
*   **User Benefit & Business Value**: Provides administrators with quality metrics to help optimize model performance.
*   **Technical Implementation**: Button selection handlers dispatch upvote/downvote satisfaction ratings to telemetry logs.
*   **User Workflow**: User clicks thumbs-up/down icons -> icon highlights -> updates database.

### 4.4.3 Prompt History Drawer
*   **Purpose**: Logs past prompt generations.
*   **User Benefit & Business Value**: Prevents data loss and allows developers to track and compare prompt versions.
*   **Technical Implementation**: Caches up to 30 history entries in local storage and Supabase, supporting search filter actions.
*   **User Workflow**: User clicks history toggle -> slide drawer reveals log -> stars/pin favorites -> clicks Restore to reload configurations.
*   **Edge Cases**:
    *   *History Limit*: Automatically deletes the oldest entries once the history log reaches 30 items.
*   **Error Handling**: Displays *"No prompt history found"* when empty.

---

## 4.5 SaaS Authentication & Monetization Paywall

### 4.5.1 Identity Sign-in Panels
*   **Purpose**: Manages user accounts and syncs settings across devices.
*   **User Benefit & Business Value**: Secures user data and allows teams to share workspaces and presets.
*   **Technical Implementation**: Uses Supabase GoTrue Auth to manage logins and generate session JWTs.
*   **User Workflow**: User submits email/password or authenticates via OAuth (Google/GitHub) -> interface displays profile info.
*   **Error Handling**: Displays sign-in errors via the error banner.

### 4.5.2 Usage Limit & Upgrade Paywall
*   **Purpose**: Manages limits for free tier accounts.
*   **User Benefit & Business Value**: Monetizes the service while allowing users to try features before upgrading.
*   **Technical Implementation**: Checks usage logs and disables generation buttons if a free user exceeds 10 compiles, directing them to a mock Stripe checkout.
*   **User Workflow**: User reaches 10 runs -> button updates to *"Upgrade to Pro"* -> user upgrades -> unlimited compilations unlock.
*   **Error Handling**: Displays a warning alert when compile limits are exceeded.

---

## 4.6 Micro-Features, UI Details, and Technical Constraints

To ensure complete accuracy, here is the implementation status of specific micro-features:

### 4.6.1 Toast Notifications & Messages
*   **Implementation Status**: Fully Implemented.
*   **Details**: The Javascript controller features a custom `showToast(text, isSuccess)` helper. It injects a styled message overlay at the top of the viewport, styled with green (`--green`) for success states or red (`#EF4444`) for error states. Toast notifications auto-dismiss after 2500ms.

### 4.6.2 Toolbar Actions & Tooltips
*   **Implementation Status**: Fully Implemented.
*   **Details**: Rich text formatting toolbar buttons (Bold, Italic, Underline, Lists) feature native HTML `title` attributes (e.g., `title="Bold (Ctrl+B)"`). The settings toggle gear icon, copy buttons, and history list actions also use title tooltips.

### 4.6.3 Loading Indicators & Spinners
*   **Implementation Status**: Fully Implemented.
*   **Details**: Custom loading spinners are built into the main generation button (`#spinner`) and the refiner button (`.refine-spinner`). Spinners are styled with a CSS rotation animation:
    `@keyframes spin { to { transform: rotate(360deg); } }`
    The spinner displays during active API requests while disabling button interactions.

### 4.6.4 Skeleton Loaders
*   **Implementation Status**: **Not Implemented**.
*   **Details**: The application does not use skeleton loaders. Content containers transition directly from hidden to visible once the API response payload is processed.

### 4.6.5 Search Functionality
*   **Implementation Status**: **Not Implemented**.
*   **Details**: There is no search bar or filter field in the presets container or the history drawer. Presets and past prompt generations are rendered as flat, scrollable lists.

### 4.6.6 Keyboard Shortcuts
*   **Implementation Status**: Partially Implemented (Browser-Native Only).
*   **Details**: The custom rich text editor supports default browser shortcuts (Ctrl+B, Ctrl+I, Ctrl+U) inside the `contenteditable` container. Custom keyboard shortcut listeners are not implemented.

### 4.6.7 Theme Switching
*   **Implementation Status**: **Not Implemented**.
*   **Details**: The user interface is locked to the dark-mode theme, using custom CSS variables (e.g., `--bg: #0A0A0F`). There is no option to switch to a light theme.

### 4.6.8 Accessibility (ARIA) Features
*   **Implementation Status**: **Not Implemented**.
*   **Details**: The HTML structure does not contain custom ARIA roles, label attributes, or keyboard navigation configurations for screen readers.

---

# 5. User Interface Documentation

PromptForge uses a dark-mode developer-centric design theme, with styling consistent across the Chrome extension popup and the Figma plugin companion.

```
+-----------------------------------------------------------+
| [Hexagon] PromptForge   [Ready status indicator] 📚 ⚙️     |
+-----------------------------------------------------------+
|  Describe it  |  Upload image  |  URL / Link              |
+-----------------------------------------------------------+
|                                                           |
|  [ RTE toolbar: B I U - list bullet/numbered - Refine ]   |
|  +-----------------------------------------------------+  |
|  | Enter prompt description...                         |  |
|  |                                            0/1500   |  |
|  +-----------------------------------------------------+  |
|                                                           |
|  Target Framework                                         |
|  [React (On)]  [Next.js]  [Tailwind CSS]  [Vue]  [HTML]   |
|                                                           |
|  Style Direction                                          |
|  [Pixel-perfect (On)]  [Bento Grid]  [Neo-Brutalism]      |
|                                                           |
|  Color Palette                  Custom Font               |
|  [e.g. #7C6AFA, #A78BFA]        [Default UI (Outfit)  v]  |
|                                                           |
|  Workspace Presets           + Save loadout               |
|  [👥 Presets Name (x)]  [My-React (x)]                    |
|                                                           |
|  Design Tokens                                            |
|  +-----------------------------------------------------+  |
|  | Paste tokens.json or CSS custom vars...             |  |
|  +-----------------------------------------------------+  |
|  *No design tokens parsed*                      [Clear]   |
|                                                           |
|  +-----------------------------------------------------+  |
|  | ⚡ Generate optimized prompt                        |  |
|  +-----------------------------------------------------+  |
|                                                           |
|  + - - - - - - - - - - - - - - - - - - - - - - - - - - +  |
|  |  Generated Prompt                           👍 👎   |
|  |  +-----------------------------------------------+  |
|  |  | Spec prompt content here...                   |  |
|  |  +-----------------------------------------------+  |
|  |  Layout          Components         Prompt Size     |
|  |  [ Bento Card ]  [ Header, Grid ]   [ Medium ]      |
|  |                                                     |
|  |  [ Copy v ]  [ Regenerate ]  [ Refine ]             |
|  + - - - - - - - - - - - - - - - - - - - - - - - - - - +  |
+-----------------------------------------------------------+
| [Settings]               [Direct API]      claude-sonnet  |
+-----------------------------------------------------------+
```

## 5.1 Design Tokens Reference

### 5.1.1 Color Palette
*   `--bg`: `#0A0A0F` (Outer background space).
*   `--surface`: `#111118` (Primary card and header background).
*   `--surface2`: `#18181F` (Input fields, drop zones, output fields).
*   `--surface3`: `#1E1E28` (Settings background).
*   `--border`: `rgba(255, 255, 255, 0.07)` (Subtle element separation borders).
*   `--border-bright`: `rgba(255, 255, 255, 0.13)` (Hover indicator borders).
*   `--accent`: `#7C6AFA` (Electric purple, active actions and branding).
*   `--accent2`: `#A78BFA` (Accent text color).
*   `--green`: `#34D399` (Emerald green, indicates active states).
*   `--green-dim`: `rgba(52, 211, 153, 0.12)` (Green text highlight background).

### 5.1.2 Typography
*   `--font`: `'Outfit', sans-serif` (Primary typography font family).
*   `--mono`: `'JetBrains Mono', monospace` (Used for code fields and prompt outputs).
*   `line-height`: `1.6` for text descriptions, `1.7` for prompt output boxes.

## 5.2 UI Component Walkthrough

### 5.2.1 Extension Shell
*   **Dimensions**: Width is locked at `420px`. The height auto-adjusts based on active drawers, up to a maximum of `600px` to prevent layout overflow.
*   **Atmospheric Glow**: The top of the shell features a purple gradient background glow:
    `radial-gradient(ellipse, rgba(124, 106, 250, 0.18) 0%, transparent 70%)`

### 5.2.2 Header Area
*   **Logo Mark**: A 32x32px square featuring a linear purple gradient background and a glowing box shadow (`box-shadow: 0 0 16px rgba(124,106,250,0.4)`). Renders an inline white SVG hexagon with a checkmark in the center.
*   **Status Indicator**: A blinking green status dot (`#34D399`) with a pulsing animation (`pulse 2s ease infinite`) that displays "Ready" when active.
*   **Drawers Icons**: Two action icons:
    *   *History Toggle*: Toggles the history list slide-over drawer.
    *   *Settings Gear*: Opens the configuration settings panel.

### 5.2.3 Input Tabs Panel
*   Uses a tab layout containing three options: **Describe it**, **Upload image**, and **URL / Link**.
*   **Active States**: Active tabs display a background matching the extension shell, highlighted with `--accent2` text, and use a bottom border trick to visually merge the active tab with the content area.

### 5.2.4 Interactive Options Grid
*   **Framework Options & Style Options**: Rendered as a grid of selectable buttons.
*   **Color & Font Fields**: Multi-column form fields with custom icons and styling.
*   **Workspace Presets Row**: Lists saved workspace configurations. Presets shared with a team space display a 👥 icon.
*   **Design Tokens Input**: An input area for pasting custom tokens. Shows parsing status states.

### 5.2.5 Output Area (Hidden by Default)
*   Remains hidden until a prompt is successfully generated.
*   **Monospace Output Field**: A scrollable monospaced container (`#output-box`) with a max height of `200px` for rendering prompt text.
*   **Feedback & Accuracy Metrics**: Displays the qualitative feedback buttons and the compiler accuracy indicator.
*   **Breakdown Row**: Renders three metadata cards: Layout, Key Components, and Token Size.

### 5.2.6 Settings Drawer
*   A slide-over options container toggled by the settings icon. It contains configuration options for:
    *   *Active Agent*: A dropdown menu to select the active LLM provider.
    *   *API Key Field*: A masked password input for the active provider's API key.
    *   *SaaS Identity Card*: Handles Google, GitHub, and email/password user logins.
    *   *Developer Options Toggle*: A toggle to reveal development settings (Java proxy URLs and API routing modes).
    *   *Supabase Sync Configurations*: Fields to set the Supabase URL, anon key, client user ID, and team space ID.

### 5.2.7 History Drawer
*   Renders a scrollable list of up to 30 past prompt generations.
*   **History Card**: Contains the creation timestamp, framework tags, a copy button, a restore button, a delete button, and a star toggle button. Starred items are pinned to the top of the history feed.

---

# 6. End-to-End User Journeys

Here are the step-by-step user workflows for PromptForge.

## 6.1 New User Journey
```
[User Installs Extension]
          │
          ▼
[Opens Popup, Settings Drawer displays automatically]
          │
          ▼
[Enters email/password or logs in via Google/GitHub]
          │
          ▼
[Logs in: Free Account tier initialized with 10 free compiles]
          │
          ▼
[Writes UI description in text box -> clicks Generate]
          │
          ▼
[Prompt compiled, output displayed, quota updates to 1/10 runs]
```

## 6.2 Experienced Developer Journey (BYOK Direct API Mode)
```
[User opens settings drawer]
          │
          ▼
[Dropdown: Agent = Claude -> Inputs Personal Anthropic Key]
          │
          ▼
[Toggle: Developer Mode -> Active Route = Direct API]
          │
          ▼
[Pastes a JSON token list into Design Tokens field]
          │
          ▼
[Enters prompt text -> clicks Generate -> prompt generated]
```

## 6.3 Team Design System Journey (Figma to Code)
```
[Designer selects dashboard page frame inside Figma workspace]
          │
          ▼
[Opens PromptForge Companion -> clicks Scan Selection]
          │
          ▼
[Node parsed recursively, layouts and style details loaded]
          │
          ▼
[Designer clicks Save Loadout -> checks Share with Team Space]
          │
          ▼
[Preset uploaded to Supabase and synced to developer's extension]
```

---

# 7. Prompt Creation Engine

The engine compiles input parameters and design configurations into the system prompt sent to the LLM.

## 7.1 Compiler Execution Lifecycles
```
+-----------------------------------------------------------------------+
|                       INPUT VARIABLES COLLECTION                      |
|  1. Capture raw text, files, screenshots, or design tokens            |
|  2. If URL mode, inject content.js and scrape computed CSS styles     |
|  3. If Figma mode, traverse selection geometries recursively           |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                    VARIABLE SANITIZATION & MATCHING                  |
|  - Convert uploaded image buffers or screenshots to base64            |
|  - Filter parsed design token structures down to standard variables   |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                       PROMPT COMPILATION LOOP                         |
|  - Merge framework selectors, style direction, color, and font info   |
|  - Append custom design system tokens and extracted page variables     |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                       SYSTEM PROMPT ASSEMBLY                          |
|  - Apply formatting rules and output constraint templates             |
|  - Append target prompt length targets (300-450 words)                |
+-----------------------------------------------------------------------+
```

## 7.2 Core Prompt Compilation Script
The Java server builds compile templates using the `compilePrompt` helper in `GenerateHandler.java`:

```java
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
```

---

# 8. AI Capabilities

PromptForge uses several AI systems to capture design data and format prompt outputs.

## 8.1 Active Model Configuration Mapping
The proxy gateway formats requests for different model APIs using the `formatAgentRequest` helper in `GenerateHandler.java`:

*   **Claude Suite (`claude-3-5-sonnet-20241022`)**: Relies on system-level prompts to guide generation. Captures uploaded screenshots as base64 images passed via Anthropic's image payload structure.
*   **Gemini Suite (`gemini-1.5-flash`)**: Sends prompt instructions and screenshots as parts within the Google Generative Language content array structure.
*   **OpenAI/DeepSeek/Groq/Mistral**: Uses Chat Completion endpoints to format requests as system and user messages.

## 8.2 Context Management & Token Optimization
*   **Prompt Window Constraints**: Custom prompt outputs are capped at a maximum of `1000` tokens using system configurations to keep processing fast and cost-effective.
*   **Response Extraction**: Responses from model completions are parsed to extract clean JSON blocks:
    ```javascript
    // Strip code fences if the model wraps output in markdown code blocks
    const codeBlockMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
    ```
    If JSON parsing fails, the proxy creates a safe fallback JSON object containing the raw response text, ensuring the client receives a readable prompt.

---

# 9. Data Model & Database Design

Below is the database structure hosted on Supabase, showing the table schemas and relational links.

```
                  +----------------------------------+
                  |      public.workspace_presets    |
                  +----------------------------------+
                  | id (UUID) [PK]                   |
                  | user_id (TEXT)                   |
                  | team_id (TEXT)                   |
                  | name (TEXT)                      |
                  | fw (TEXT)                        |
                  | st (TEXT)                        |
                  | colors (TEXT)                    |
                  | font (TEXT)                      |
                  | created_at (TIMESTAMP)           |
                  +----------------------------------+

                  +----------------------------------+
                  |       public.prompt_history      |
                  +----------------------------------+
                  | id (UUID) [PK]                   |
                  | user_id (TEXT)                   |
                  | prompt (TEXT)                    |
                  | fw (TEXT)                        |
                  | st (TEXT)                        |
                  | colors (TEXT)                    |
                  | font (TEXT)                      |
                  | starred (BOOLEAN)                |
                  | created_at (TIMESTAMP)           |
                  +----------------------------------+
```

### 9.1 `workspace_presets` Table Schema
```sql
create table public.workspace_presets (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  team_id text,
  name text not null,
  fw text,
  st text,
  colors text,
  font text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### 9.2 `prompt_history` Table Schema
```sql
create table public.prompt_history (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  prompt text not null,
  fw text,
  st text,
  colors text,
  font text,
  starred boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

---

# 10. Security & Compliance

PromptForge enforces strict data isolation and secure API communications:

*   **API Key Protection**: API keys are never stored on the server filesystem. Direct client API keys are stored in `chrome.storage.local` within the user's browser, while proxied keys are read from server environment variables at runtime.
*   **JWT Authentication**: Requests to the proxy gateway include a bearer JWT signed by Supabase. The proxy validates the token signature using HMAC-SHA256 and the `SUPABASE_JWT_SECRET` key, verifying the token's expiration date before processing the request.
*   **CORS Policies**: The proxy gateway's CORS filters restrict API access to the Chrome extension's ID, Figma canvas origins (`https://www.figma.com`), and local developer spaces.
*   **Data Minimization**: Scraped DOM data is limited to styling rules, typography variables, and page metadata. No user input data, cookies, or session variables are collected.

---

# 11. Performance and Scalability

*   **Multi-Threaded Proxy**: The Java HttpListener uses a cached thread pool to process incoming generate and telemetry requests asynchronously under load.
*   **Zero Node Dependency**: The client applications are built with native Vanilla JS, HTML, and CSS, eliminating large bundle files to ensure fast load times.
*   **Cached Stylesheet Scanning**: The Chrome extension's content script skips cross-origin stylesheets, avoiding CORS blocks and reducing scanning times on heavy web pages.

---

# 12. Analytics & Monitoring

*   **Structured Telemetry Logs**: The proxy handler logs API performance and metadata as JSON strings to system output logs:
    ```
    [Telemetry Log] {"primaryAgent":"claude", "actualAgent":"claude", "success":true, "latencyMs":4812, "fallbackExecuted":false, "error":"none"}
    ```
*   **Feedback Integration**: Qualitative thumbs-up/down ratings from users are logged directly via `/telemetry` to trace model performance.
*   **Usage Tracking**: User compilation counts are synchronized with database profiles to monitor account quotas.

---

# 13. API Documentation

## 13.1 Endpoint: `POST /generate`
Generates a design system prompt based on visual data, text descriptions, and styling options.

### Request Headers
*   `Content-Type`: `application/json`
*   `X-Target-Agent` (Optional): Target model identifier (`claude`, `gemini`, `openai`, `deepseek`, `groq`, `mistral`). Defaults to `claude`.
*   `X-API-Key` (Optional): Developer bypass key.
*   `Authorization` (Optional): Bearer JWT authentication token.

### Request Body Schema
```json
{
  "source": "extension",
  "framework": "React",
  "style": "Pixel-perfect",
  "colors": "#7C6AFA, #A78BFA",
  "font": "Inter",
  "description": "A dark dashboard containing 4 KPI metrics elements...",
  "url": "https://dribbble.com/shots/xyz",
  "tokensText": "- primary-color: #7C6AFA\n- font-family: Inter",
  "variablesText": "- --background: #0A0A0F\n- --font: Inter",
  "screenshot": "data:image/png;base64,iVBORw0KGgoAAA..."
}
```

### Response Schema (Status 200)
```json
{
  "prompt": "You are building a React component using Tailwind CSS... [Full prompt body]",
  "accuracy": "99% accuracy",
  "layout": "Bento Grid Dashboard Layout",
  "components": "Header, Sidebar, KPI Cards, Area Chart",
  "tokens": "medium"
}
```

### Error Responses
*   `401 Unauthorized`: Returned when the JWT token is missing from the request header.
*   `403 Forbidden`: Returned when JWT token signature verification or expiration check fails.
*   `405 Method Not Allowed`: Returned when the request is not a `POST` or `OPTIONS` preflight request.
*   `500 Internal Server Error`: Returned when all model generation attempts fail.

---

## 13.2 Endpoint: `POST /telemetry`
Logs user satisfaction feedback for prompt generations.

### Request Body Schema
```json
{
  "promptLength": 1284,
  "agent": "claude",
  "framework": "React",
  "style": "Pixel-perfect",
  "font": "Inter",
  "satisfaction": "up",
  "timestamp": 178239019283
}
```

### Response Schema (Status 200)
```json
{
  "status": "success"
}
```

---

# 14. Admin Features

*   **JWT Secret Isolation**: Administrators can configure JWT access controls by updating the `SUPABASE_JWT_SECRET` environment variable on the hosting platform.
*   **API Usage Monitoring**: System administrators can query Supabase database logs to audit compile runs and usage metadata.
*   **Fallback Configuration Management**: Fallback model options can be configured on the server by setting the `ANTHROPIC_API_KEY` and `GEMINI_API_KEY` environment variables.

---

# 15. Future Roadmap

*   **Figma Variables Integration**: Connect the plugin directly to Figma design variables and design library systems.
*   **Cursor IDE Extension**: Develop a dedicated extension for Cursor and VS Code to paste generated prompt structures directly into codebases.
*   **Advanced RAG Pipelines**: Implement server-side RAG pipelines to enrich prompts with corporate design guidelines and component libraries automatically.

---

# 16. Feature Checklist

Below is the complete checklist of features implemented in PromptForge:

*   [x] **Context Ingestion Engine**
    *   [x] Rich Text Editor (RTE) container
    *   [x] Text toolbar formatter (Bold, Italic, Underline, Lists)
    *   [x] 1500 character counter and truncator
    *   [x] AI "Refine Description" grammar optimizer
    *   [x] Screenshot drop zone (Drag-and-Drop)
    *   [x] Image preview with remove overlay (✕)
    *   [x] Deep DOM style harvester content script
    *   [x] CSS variables and theme metadata scanner
    *   [x] Active tab screenshot capture API
    *   [x] Figma Plugin page Selection listener
    *   [x] Figma Sandbox node properties collector (width, height, flexbox margins/paddings, custom text fonts, solid colors)
    *   [x] Nested node children canvas recursor
*   [x] **Workspace Configuration Options**
    *   [x] Framework Selectors (React, Next.js, Tailwind, Vue, Angular, Svelte, HTML+CSS, Flutter, Figma Spec)
    *   [x] Style Selectors (Pixel-perfect, Clean, Bento Grid, Brutalism, Skeuomorphic, Material, Dark, Glassmorphism, Neumorphism)
    *   [x] Custom Color Palette text input
    *   [x] Color Spectrum Picker dialog
    *   [x] Typography dropdown selector (Inter, Montserrat, Playfair Display, Cinzel, Montserrat, Cormorant, Syne, Jakarta, SF Pro)
    *   [x] JSON/CSS Design System variables panel parser
    *   [x] Parsed variables badge counter
*   [x] **Workspace Presets Management**
    *   [x] Preset quota limit validator (3 preset slots)
    *   [x] Local preset caching system
    *   [x] Cloud preset synchronization
    *   [x] Team presets checkbox share flag
    *   [x] Preset deletion logic (✕)
    *   [x] Preset load controller
*   [x] **SaaS Authentication & Monetization**
    *   [x] Email/Password Sign-up and Sign-in forms
    *   [x] Google OAuth Login integration
    *   [x] GitHub OAuth Login integration
    *   [x] Dicebear custom bot user avatar renderer
    *   [x] Account tier subscription badges (Free vs Pro)
    *   [x] Compiles quota bar limit indicator (0/10 runs)
    *   [x] Upgrade Checkout payment redirect button
    *   [x] Pro tier compile runs quota bypass controller
*   [x] **Compilation & Output Features**
    *   [x] Multi-agent settings selection list (Claude, Gemini, OpenAI, DeepSeek, Groq, Mistral)
    *   [x] API Key save caching
    *   [x] Developer options drawer toggle
    *   [x] Direct API mode vs Java proxy routing mode switcher
    *   [x] Supabase cloud keys input fields
    *   [x] Clear cached keys action button
    *   [x] Multi-agent request formatters
    *   [x] Monospace generated prompt container
    *   [x] Visual layout metadata breakdown cards (Layout type, Key components, Prompt size)
    *   [x] Specialized export target dropdown (Format for v0, copy for Cursor, Send to Claude Artifacts)
    *   [x] Copied confirmation status badge updates
    *   [x] Telemetry thumbs-up/down qualitative satisfaction rating buttons
    *   [x] Active tab screenshot compiler image payload assembler
*   [x] **History Log Drawer**
    *   [x] History list drawer toggler
    *   [x] Last 30 compiles history list log
    *   [x] Cloud history logger sync
    *   [x] Starred bookmarked items pinned container
    *   [x] Delete history card action button
    *   [x] Restore history item action button
    *   [x] Clear all history entries action button
*   [x] **Resilient Proxy Middleware**
    *   [x] Main port router binding
    *   [x] Cached thread pool executor pool
    *   [x] CORS allowed domains parser and OPTIONS preflight responder (204)
    *   [x] JWT verify signature HMAC-SHA256 evaluator
    *   [x] JWT expired token evaluator
    *   [x] Multi-agent client caller handlers
    *   [x] Primary API failure logging retrier
    *   [x] Automated fallback backup routing (Claude -> Gemini / Gemini -> Claude)
    *   [x] Output JSON block extractor and brackets scanner
    *   [x] Telemetry ingestion endpoint handler
    *   [x] Health status endpoint responder
