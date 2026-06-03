# PromptForge: Enterprise SaaS Prompt Compiler MVP

PromptForge is a state-of-the-art developer utility transformed into a comprehensive SaaS MVP. It compiles design systems, live DOM styles, and Figma frame geometries into hyper-precise LLM instructions optimized for instant code generation (v0.dev, Cursor, Claude).

PromptForge is packaged as a high-performance **Chrome Extension** and a native **Figma Plugin Companion**, backed by a resilient **Java proxy routing gateway** and a hosted **Supabase cloud database** backend.

---

## 💎 Core SaaS Features

### 1. Advanced Context Ingestion & Figma Bridge
*   **Deep DOM Style Harvester**: Injected Chrome content scripts capture computed CSS variables (`--*`), page typography stacks, and container borders instantly.
*   **Figma Geometry Analyzer**: Standalone Figma plugin companion scans layers recursively, extracting coordinates, flex layout attributes, solid hex fills, and padding specs.
*   **Brand Token Dropzone**: Allows users to drop `tokens.json` or Tailwind CSS files to dynamically inject guideline enforcements inside instructions.

### 2. Workspace Presets & Collaborative Spaces
*   **Persistent Preset Quota**: Caches frameworks, custom colors, and editorial typography configurations into 3 slots.
*   **Supabase Cloud Syncing**: Synchronizes workspace loadouts and prompts history instantly via client-side REST calls.
*   **Shared Team Workspaces**: Save presets with a `team_id` Space ID. Team templates display with a 👥 icon and are shared collaboratively.

### 3. Iterative History Drawers
*   **Specs Log drawers**: Slide-over panel logging prompt versions.
*   **Favorites & Bookmarking**: Star history items to pin them to the top of the feed. One-click "Restore" automatically resets options pills and input values.

### 4. Monetization & Onboarding Gates
*   **Google & GitHub Auth**: Sign-in widgets inside settings drawers to sync identities and profile logs.
*   **Stripe Quota Paywall**: Free tier accounts are capped at **10 compiles**. Reaching the limit locks the generation button, prompting a glowing upgrade CTA. Upgrading via Stripe checkout instantly unlocks Pro Tier with `Unlimited runs`.
*   **BYOK Bypasses**: Logged-in users skip local API key requirements; calls fallback to proxy-managed platform keys.

### 5. Resilient Telemetry & Fallbacks Routing
*   **Structured Latency metrics**: Proxy GenerateHandler computes execution durations in milliseconds and logs details as structured JSON.
*   **Automated fallbacks**: If a primary LLM request times out or fails (e.g., ClaudeSonnet rate-limited), the proxy automatically redirects execution routes to backup models (e.g. GeminiFlash) before returning client responses.
*   **Satisfaction Rating Loop**: Embeds upvote/downvote qualitative buttons on generated specs.

---

## 📁 Repository Directory Structure

```
promptForge/
├── README.md                 # Project Overview & Quickstart Guide
├── knowledge_graph.md        # Ecosystem Architecture & Mermaid mapping diagram
└── phase-2/                  # Production SaaS MVP Workspace
    ├── extension/            # Chrome Extension (OAuth, Quotas, Presets & History)
    │   ├── manifest.json     # Extension Manifest V3 configuration
    │   ├── popup.html        # Glassmorphic user interface layer
    │   ├── popup.js          # Controller handlers & Supabase PostgREST sync client
    │   └── popup.css         # Styling system
    ├── figma-plugin/         # stand-alone Figma Plugin workspace
    │   ├── manifest.json     # Figma plugin permission manifest
    │   ├── code.js           # Figma sandbox selector node parsing engine
    │   └── ui.html           # Figma companion UI, mirrored presets, tokens & telemetry
    └── backend/              # Resilient Java proxy routing gateway
        ├── src/com/promptforge/
        │   ├── Main.java             # HTTP server entry point (Port 8080)
        │   ├── GenerateHandler.java  # Fallbacks routing, timing latencies & logs
        │   └── TelemetryHandler.java # Qualitative ratings logger
        ├── compile.sh        # Java javac compiler script
        └── run.sh            # Java execution launch script
```

---

## ⚙️ Quickstart Installation

### 1. Chrome Extension
1. Open Google Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the `phase-2/extension/` directory.

### 2. Figma Plugin
1. Open Figma Desktop App.
2. Go to Plugins → Development → New plugin.
3. Click "Link existing manifest" and select `phase-2/figma-plugin/manifest.json`.

### 3. Java Backend Gateway
1. Navigate to the backend folder:
   ```bash
   cd phase-2/backend/
   ```
2. Build and run the server:
   ```bash
   chmod +x compile.sh run.sh
   ./compile.sh
   ./run.sh
   ```
   The backend server binds to `http://localhost:8080/`. Configure your Gemini/Claude environment variables (e.g. `export GEMINI_API_KEY="..."`) to support platform fallback requests.

---

## 🔧 Production Database setup

Create the following tables inside your Supabase Project SQL Editor to support cloud synchronizations:

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

Configure your Supabase URL and Key inside settings panel drawers to activate syncing.
