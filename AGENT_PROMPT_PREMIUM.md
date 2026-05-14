# AGENT_PROMPT_PREMIUM.md
## Single-Shot Build Prompt — PromptForge Premium UI (100% Accuracy)

> Copy everything below the line and paste it into any AI coding agent.
> This prompt is self-contained. The agent must produce all files without any clarifying questions.

---

## PROMPT START

You are a senior front-end engineer and UI specialist. Build the **PromptForge** Chrome extension with a premium, production-quality UI. Follow every pixel spec exactly. Do not substitute any colors, fonts, or measurements. Produce every file listed.

---

## OVERVIEW

PromptForge is a Chrome Extension popup (420px wide). It takes a plain-English description OR an uploaded UI screenshot OR a URL, and calls the Anthropic Claude API to return a hyper-optimized, engineer-ready prompt for rebuilding that UI with ~99% accuracy.

**Stack:**
- Chrome Extension Manifest V3
- Pure HTML5 + custom CSS (NO Bootstrap, NO Tailwind, NO external CSS frameworks)
- Vanilla ES6+ JavaScript (NO React, NO Vue, NO jQuery)
- Google Fonts: Outfit + JetBrains Mono (loaded from fonts.googleapis.com)
- Anthropic Claude API (`claude-sonnet-4-20250514`)

---

## DESIGN SYSTEM — COPY EXACTLY

### CSS Custom Properties (paste into `:root`)

```css
:root {
  --bg:             #0A0A0F;
  --surface:        #111118;
  --surface2:       #18181F;
  --surface3:       #1E1E28;
  --border:         rgba(255, 255, 255, 0.07);
  --border-bright:  rgba(255, 255, 255, 0.13);
  --accent:         #7C6AFA;
  --accent2:        #A78BFA;
  --accent-glow:    rgba(124, 106, 250, 0.15);
  --green:          #34D399;
  --green-dim:      rgba(52, 211, 153, 0.12);
  --text:           #F0EFF8;
  --text-muted:     #8887A0;
  --text-dim:       #4A4960;
  --font:           'Outfit', sans-serif;
  --mono:           'JetBrains Mono', monospace;
}
```

### Font Loading (in `<head>`)
```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## FILE 1 — manifest.json

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
  "background": { "service_worker": "background.js" },
  "permissions": ["storage", "activeTab"],
  "host_permissions": [
    "https://api.anthropic.com/*",
    "http://localhost:8080/*",
    "https://fonts.googleapis.com/*",
    "https://fonts.gstatic.com/*"
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; font-src https://fonts.gstatic.com; style-src 'self' https://fonts.googleapis.com"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

---

## FILE 2 — popup.html

Write the COMPLETE, valid HTML. No inline scripts. No inline onclick. All JS in popup.js only.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PromptForge</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="popup.css">
</head>
<body>

<div class="ext-shell">

  <div class="header">
    <div class="logo-mark">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L17 6V14L10 18L3 14V6L10 2Z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M7 10L9.5 12.5L13.5 8" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="header-text">
      <div class="header-title">PromptForge</div>
      <div class="header-sub">UI prompt generator</div>
    </div>
    <div class="status-dot">Ready</div>
  </div>

  <div class="tab-bar">
    <button class="tab-btn active" id="tab-text">
      <svg class="tab-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="3" width="12" height="10" rx="2"/>
        <line x1="5" y1="6" x2="11" y2="6"/>
        <line x1="5" y1="8.5" x2="9" y2="8.5"/>
      </svg>
      Describe it
    </button>
    <button class="tab-btn" id="tab-image">
      <svg class="tab-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="3" width="12" height="10" rx="2"/>
        <circle cx="5.5" cy="7" r="1.2"/>
        <path d="M2 11l3-3 2.5 2.5 2.5-2.5 3.5 3.5"/>
      </svg>
      Upload image
    </button>
    <button class="tab-btn" id="tab-url">
      <svg class="tab-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M6.5 9.5l3-3"/>
        <path d="M6 6.5l-1.5 1.5a2.12 2.12 0 000 3l.5.5a2.12 2.12 0 003 0l1.5-1.5"/>
        <path d="M10 9.5l1.5-1.5a2.12 2.12 0 000-3l-.5-.5a2.12 2.12 0 00-3 0L6.5 6"/>
      </svg>
      URL / Link
    </button>
  </div>

  <div class="content">

    <div id="pane-text" class="pane">
      <div class="input-wrap">
        <textarea id="desc-txt" maxlength="800"
          placeholder="Describe your UI in plain English… e.g. A SaaS dashboard with a collapsible dark sidebar, top nav with user avatar, 4 KPI cards showing revenue metrics, an area chart for monthly growth, and a paginated data table with filter chips."></textarea>
        <span class="char-badge" id="char-count">0/800</span>
      </div>
    </div>

    <div id="pane-image" class="pane" style="display:none">
      <div class="drop-zone" id="drop-zone">
        <div class="drop-icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="1.5">
            <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor"/>
            <circle cx="8" cy="10" r="1.5" stroke="currentColor"/>
            <path d="M3 16l4.5-4.5 3 3 3.5-3.5 5 5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="drop-title">Drop screenshot or mockup</div>
        <div class="drop-sub">PNG, JPG, WEBP · max 4 MB</div>
      </div>
      <input type="file" id="file-inp" accept="image/*">
      <div class="img-preview-area" id="img-prev-area">
        <img id="img-prev" src="" alt="Uploaded UI">
        <button class="img-remove" id="img-remove-btn">✕</button>
      </div>
    </div>

    <div id="pane-url" class="pane" style="display:none">
      <input class="extra-input url-full-input" id="url-inp" type="url"
        placeholder="https://dribbble.com/shots/... or any public UI URL">
      <div class="url-info-box">
        Paste a public design URL (Dribbble, Behance, a live site). The extension will screenshot and analyze it automatically.
      </div>
    </div>

    <div class="options-block">
      <span class="opt-label">Target framework</span>
      <div class="pill-group" id="fw-group">
        <button class="pill on">React</button>
        <button class="pill">HTML + CSS</button>
        <button class="pill">Vue</button>
        <button class="pill">Figma spec</button>
        <button class="pill">Any</button>
      </div>
    </div>

    <div class="options-block" style="margin-top:10px">
      <span class="opt-label">Style direction</span>
      <div class="pill-group" id="st-group">
        <button class="pill on">Pixel-perfect</button>
        <button class="pill">Minimal clean</button>
        <button class="pill">Dark mode</button>
        <button class="pill">Glassmorphism</button>
        <button class="pill">Neumorphism</button>
      </div>
    </div>

    <div class="extra-inputs">
      <input class="extra-input" id="clr-inp" type="text" placeholder="🎨 Colors (e.g. #6355E0)">
      <input class="extra-input" id="fnt-inp" type="text" placeholder="Aa Font (e.g. Outfit)">
    </div>

    <button class="gen-btn" id="gen-btn">
      <div class="spinner" id="spinner"></div>
      <svg id="btn-icon" width="15" height="15" viewBox="0 0 18 18" fill="none">
        <path d="M9 2l1.8 5.4H16l-4.5 3.3 1.7 5.3L9 13l-4.2 3 1.7-5.3L2 7.4h5.2L9 2z"
          stroke="white" stroke-width="1.3" stroke-linejoin="round"/>
      </svg>
      <span id="btn-txt">Generate optimized prompt</span>
    </button>

    <div class="err-banner" id="err-banner"></div>

    <div class="output-wrap" id="output-wrap">
      <div class="divider"></div>
      <div class="out-header">
        <span class="out-label">Generated prompt</span>
        <span class="acc-pill" id="acc-pill">99% accuracy</span>
      </div>
      <div class="output-box" id="output-box"></div>
      <div class="breakdown">
        <div class="bdcard">
          <div class="bdcard-lbl">Layout</div>
          <div class="bdcard-val" id="bd-layout">—</div>
        </div>
        <div class="bdcard">
          <div class="bdcard-lbl">Components</div>
          <div class="bdcard-val" id="bd-comp">—</div>
        </div>
        <div class="bdcard">
          <div class="bdcard-lbl">Prompt size</div>
          <div class="bdcard-val" id="bd-tok">—</div>
        </div>
      </div>
      <div class="actions">
        <button class="act-btn" id="copy-btn">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="4" y="4" width="8" height="8" rx="1.5"/>
            <path d="M2 10V2h8"/>
          </svg>
          Copy prompt
        </button>
        <button class="act-btn" id="regen-btn">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M2 7a5 5 0 009.5-2M12 7a5 5 0 01-9.5 2"/>
            <path d="M10.5 4.5L12 2.5l1.5 2"/>
          </svg>
          Regenerate
        </button>
        <button class="act-btn" id="refine-btn">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M2 12l4-4 6-6"/>
            <path d="M8 2h4v4"/>
          </svg>
          Refine ↗
        </button>
      </div>
    </div>

  </div>

  <div class="settings-panel" id="settings-panel">
    <div class="settings-row">
      <div class="settings-field">
        <span class="settings-lbl">Anthropic API key</span>
        <input class="settings-input" type="password" id="api-key-inp" placeholder="sk-ant-api03-...">
      </div>
      <div class="settings-field">
        <span class="settings-lbl">Mode</span>
        <div class="mode-btns">
          <button class="mode-toggle direct" id="mode-direct">● Direct API</button>
          <button class="mode-toggle" id="mode-proxy">◌ Java proxy</button>
        </div>
      </div>
      <div class="settings-field" id="proxy-field">
        <span class="settings-lbl">Proxy URL</span>
        <input class="settings-input" id="proxy-url-inp" type="text" value="http://localhost:8080">
      </div>
      <button class="save-btn" id="save-btn">Save settings</button>
    </div>
  </div>

  <div class="bottom-bar">
    <button class="settings-toggle" id="settings-toggle-btn">
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">
        <circle cx="8" cy="8" r="2.5"/>
        <path d="M8 2v1M8 13v1M2 8H1m13 0h1M3.8 3.8l.7.7M11.5 11.5l.7.7M3.8 12.2l.7-.7M11.5 4.5l.7-.7"/>
      </svg>
      Settings
    </button>
    <button class="mode-toggle direct" id="mode-badge">Direct API</button>
    <div class="model-label">
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3">
        <circle cx="6" cy="6" r="5"/>
        <path d="M6 7V5m0 3v.5"/>
      </svg>
      claude-sonnet-4
    </div>
  </div>

</div>

<script src="popup.js"></script>
</body>
</html>
```

---

## FILE 3 — popup.css

Write this COMPLETE CSS file verbatim:

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --bg: #0A0A0F;
  --surface: #111118;
  --surface2: #18181F;
  --surface3: #1E1E28;
  --border: rgba(255,255,255,0.07);
  --border-bright: rgba(255,255,255,0.13);
  --accent: #7C6AFA;
  --accent2: #A78BFA;
  --green: #34D399;
  --green-dim: rgba(52,211,153,0.12);
  --text: #F0EFF8;
  --text-muted: #8887A0;
  --text-dim: #4A4960;
  --font: 'Outfit', sans-serif;
  --mono: 'JetBrains Mono', monospace;
}

body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  width: 420px;
  min-height: 300px;
}

.ext-shell {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 40px 80px rgba(0,0,0,0.8);
  position: relative;
}

.ext-shell::before {
  content: '';
  position: absolute;
  top: -60px; left: 50%; transform: translateX(-50%);
  width: 280px; height: 120px;
  background: radial-gradient(ellipse, rgba(124,106,250,0.18) 0%, transparent 70%);
  pointer-events: none; z-index: 0;
}

/* HEADER */
.header {
  padding: 16px 18px 14px;
  display: flex; align-items: center; gap: 10px;
  border-bottom: 1px solid var(--border);
  position: relative; z-index: 1;
}

.logo-mark {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, #7C6AFA, #A78BFA);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 16px rgba(124,106,250,0.4);
}

.header-text { flex: 1; }

.header-title {
  font-size: 14px; font-weight: 600; letter-spacing: -0.01em;
  background: linear-gradient(90deg, #E0DEFF, #A78BFA);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-sub {
  font-size: 11px; color: var(--text-dim);
  margin-top: 1px; font-weight: 400;
}

.status-dot {
  display: flex; align-items: center; gap: 5px;
  font-size: 10.5px; color: var(--green); font-weight: 500;
}

.status-dot::before {
  content: '';
  width: 6px; height: 6px;
  background: var(--green); border-radius: 50%;
  box-shadow: 0 0 6px rgba(52,211,153,0.6);
  animation: pulse 2s ease infinite;
}

@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
@keyframes spin { to{transform:rotate(360deg)} }

/* TABS */
.tab-bar {
  display: flex; gap: 2px;
  padding: 10px 12px 0;
  border-bottom: 1px solid var(--border);
}

.tab-btn {
  flex: 1; padding: 8px 10px;
  font-size: 12px; font-weight: 500; font-family: var(--font);
  background: transparent; border: none; cursor: pointer;
  color: var(--text-dim); border-radius: 8px 8px 0 0;
  transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  position: relative; bottom: -1px;
}

.tab-btn:hover:not(.active) { color: var(--text-muted); }

.tab-btn.active {
  color: var(--accent2);
  border: 1px solid var(--border);
  border-bottom: 1px solid var(--surface);
  background: var(--surface);
}

.tab-icon { flex-shrink: 0; opacity: 0.7; }
.tab-btn.active .tab-icon { opacity: 1; }

/* CONTENT */
.content { padding: 0 14px; }
.pane { padding-top: 12px; }

/* TEXTAREA */
.input-wrap { position: relative; }

textarea {
  width: 100%; resize: none; height: 96px;
  padding: 12px 50px 12px 14px;
  font-size: 12.5px; line-height: 1.6; font-family: var(--font);
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 12px; color: var(--text);
  outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  caret-color: var(--accent2);
}

textarea::placeholder { color: var(--text-dim); font-size: 12px; }

textarea:focus {
  border-color: rgba(124,106,250,0.35);
  box-shadow: 0 0 0 3px rgba(124,106,250,0.08);
}

.char-badge {
  position: absolute; bottom: 10px; right: 12px;
  font-size: 10px; color: var(--text-dim);
  font-family: var(--mono);
  background: var(--surface3); border-radius: 4px;
  padding: 2px 5px;
}

/* DROP ZONE */
.drop-zone {
  border: 1.5px dashed var(--border-bright);
  border-radius: 12px; padding: 24px 20px;
  text-align: center; cursor: pointer;
  background: var(--surface2); transition: all 0.2s;
}

.drop-zone:hover, .drop-zone.dragover {
  border-color: rgba(124,106,250,0.4);
  background: rgba(124,106,250,0.04);
}

.drop-icon-wrap {
  width: 44px; height: 44px; border-radius: 12px;
  background: var(--surface3); border: 1px solid var(--border-bright);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 10px;
}

.drop-icon-wrap svg { stroke: var(--text-muted); }
.drop-title { font-size: 13px; font-weight: 500; color: var(--text); margin-bottom: 3px; }
.drop-sub { font-size: 11px; color: var(--text-dim); }

#file-inp { display: none; }

.img-preview-area {
  display: none; position: relative;
  border-radius: 10px; overflow: hidden;
  border: 1px solid var(--border);
}

.img-preview-area img {
  width: 100%; max-height: 160px; object-fit: cover; display: block;
}

.img-remove {
  position: absolute; top: 7px; right: 7px;
  background: rgba(0,0,0,0.7); color: white;
  border: none; border-radius: 50%;
  width: 22px; height: 22px; cursor: pointer;
  font-size: 12px;
  display: flex; align-items: center; justify-content: center;
}

/* URL PANE */
.url-full-input {
  width: 100%; padding: 10px 12px;
  font-size: 12.5px; border-radius: 12px;
}

.url-info-box {
  margin-top: 8px; padding: 9px 11px;
  background: rgba(124,106,250,0.06);
  border: 1px solid rgba(124,106,250,0.15);
  border-radius: 9px;
  font-size: 11px; color: #9090B8; line-height: 1.6;
}

/* OPTIONS */
.options-block { margin-top: 12px; }

.opt-label {
  font-size: 10.5px; font-weight: 600; letter-spacing: 0.07em;
  text-transform: uppercase; color: var(--text-dim);
  margin-bottom: 6px; display: block;
}

.pill-group { display: flex; flex-wrap: wrap; gap: 5px; }

.pill {
  font-size: 11.5px; font-weight: 500; padding: 5px 11px;
  border-radius: 20px; border: 1px solid var(--border-bright);
  cursor: pointer; color: var(--text-muted);
  background: var(--surface2);
  transition: all 0.15s; font-family: var(--font);
}

.pill:hover { border-color: rgba(124,106,250,0.3); color: var(--text); }

.pill.on {
  background: rgba(124,106,250,0.15);
  border-color: rgba(124,106,250,0.4);
  color: var(--accent2);
}

/* EXTRA INPUTS */
.extra-inputs {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 8px; margin-top: 10px;
}

.extra-input {
  padding: 8px 11px;
  font-size: 12px; font-family: var(--font);
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 9px; color: var(--text);
  outline: none; transition: border-color 0.2s;
}

.extra-input::placeholder { color: var(--text-dim); font-size: 11.5px; }
.extra-input:focus { border-color: rgba(124,106,250,0.3); }

/* GENERATE BUTTON */
.gen-btn {
  width: 100%; margin-top: 14px; padding: 11px;
  font-size: 13px; font-weight: 600; letter-spacing: 0.01em;
  font-family: var(--font);
  background: linear-gradient(135deg, #6355E0, #9174FA);
  color: white; border: none; border-radius: 12px; cursor: pointer;
  transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  position: relative; overflow: hidden;
}

.gen-btn::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.08), transparent);
  pointer-events: none;
}

.gen-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(124,106,250,0.4);
}

.gen-btn:active { transform: scale(0.99); }
.gen-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: white; border-radius: 50%;
  animation: spin 0.65s linear infinite;
  display: none;
}

/* ERROR */
.err-banner {
  display: none; margin-top: 8px; padding: 8px 12px;
  border-radius: 9px;
  background: rgba(228,70,70,0.1);
  border: 1px solid rgba(228,70,70,0.2);
  font-size: 11.5px; color: #F87171;
}

.err-banner.show { display: block; }

/* OUTPUT */
.output-wrap { display: none; }
.output-wrap.visible { display: block; }

.divider {
  height: 1px; background: var(--border);
  margin: 14px 0 12px;
}

.out-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}

.out-label {
  font-size: 10.5px; font-weight: 600; letter-spacing: 0.07em;
  text-transform: uppercase; color: var(--text-dim);
  display: flex; align-items: center; gap: 6px;
}

.out-label::before {
  content: '';
  width: 5px; height: 5px;
  background: var(--green); border-radius: 50%;
  box-shadow: 0 0 6px rgba(52,211,153,0.7);
}

.acc-pill {
  font-size: 10.5px; font-weight: 600; letter-spacing: 0.03em;
  padding: 3px 9px; border-radius: 20px;
  background: var(--green-dim);
  border: 1px solid rgba(52,211,153,0.2);
  color: var(--green);
}

.output-box {
  font-family: var(--mono);
  font-size: 11.5px; line-height: 1.7;
  padding: 13px 14px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 12px; color: #C9C8E0;
  max-height: 200px; overflow-y: auto;
  white-space: pre-wrap; word-break: break-word;
  scrollbar-width: thin; scrollbar-color: var(--surface3) transparent;
}

.breakdown {
  display: grid; grid-template-columns: repeat(3,1fr);
  gap: 6px; margin-top: 8px;
}

.bdcard {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 9px; padding: 8px 10px;
}

.bdcard-lbl {
  font-size: 9.5px; color: var(--text-dim);
  text-transform: uppercase; letter-spacing: 0.06em;
  margin-bottom: 3px;
}

.bdcard-val { font-size: 11.5px; font-weight: 500; color: var(--text); }

.actions { display: flex; gap: 6px; margin-top: 8px; }

.act-btn {
  flex: 1; padding: 8px 6px;
  font-size: 11.5px; font-weight: 500; font-family: var(--font);
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 9px; cursor: pointer; color: var(--text-muted);
  transition: all 0.15s;
  display: flex; align-items: center; justify-content: center; gap: 5px;
}

.act-btn:hover {
  border-color: var(--border-bright);
  color: var(--text); background: var(--surface3);
}

.act-btn.copied {
  background: var(--green-dim);
  border-color: rgba(52,211,153,0.2);
  color: var(--green);
}

/* SETTINGS PANEL */
.settings-panel {
  display: none; padding: 14px;
  border-top: 1px solid var(--border);
  background: rgba(0,0,0,0.2);
}

.settings-panel.open { display: block; }

.settings-row { display: flex; flex-direction: column; gap: 8px; }
.settings-field { display: flex; flex-direction: column; gap: 4px; }

.settings-lbl {
  font-size: 10.5px; color: var(--text-dim); font-weight: 500;
  letter-spacing: 0.04em; text-transform: uppercase;
}

.settings-input {
  padding: 8px 11px;
  font-size: 12px; font-family: var(--mono);
  background: var(--surface3);
  border: 1px solid var(--border);
  border-radius: 8px; color: var(--text); outline: none;
  transition: border-color 0.2s;
}

.settings-input::placeholder { color: var(--text-dim); font-family: var(--font); }
.settings-input:focus { border-color: rgba(124,106,250,0.3); }

.mode-btns { display: flex; gap: 6px; }

.mode-toggle {
  flex: 1; padding: 7px;
  font-size: 11px; font-weight: 500; font-family: var(--font);
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px; cursor: pointer; color: var(--text-dim);
  transition: all 0.15s;
}

.mode-toggle.direct {
  color: var(--green);
  border-color: rgba(52,211,153,0.2);
  background: var(--green-dim);
}

#proxy-field { display: none; }

.save-btn {
  width: 100%; padding: 9px;
  font-size: 12.5px; font-weight: 600; font-family: var(--font);
  background: rgba(124,106,250,0.1);
  border: 1px solid rgba(124,106,250,0.25);
  border-radius: 9px; color: var(--accent2);
  cursor: pointer; margin-top: 4px; transition: all 0.15s;
}

.save-btn:hover { background: rgba(124,106,250,0.18); }

/* BOTTOM BAR */
.bottom-bar {
  padding: 10px 14px 14px;
  display: flex; gap: 6px; align-items: center;
  border-top: 1px solid var(--border);
  margin-top: 14px;
}

.settings-toggle {
  padding: 7px 12px;
  font-size: 11.5px; font-weight: 500; font-family: var(--font);
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px; cursor: pointer; color: var(--text-muted);
  display: flex; align-items: center; gap: 5px;
  transition: all 0.15s;
}

.settings-toggle:hover { border-color: var(--border-bright); color: var(--text); }

#mode-badge { flex: 1; }

.model-label {
  font-size: 10px; color: var(--text-dim);
  display: flex; align-items: center; gap: 4px;
  white-space: nowrap;
}
```

---

## FILE 4 — popup.js

Write the COMPLETE JavaScript file. Entry point: `document.addEventListener('DOMContentLoaded', init)`.

```javascript
'use strict';

let currentTab = 'text';
let imgData = null;
let imgMime = null;
let mode = 'direct';
let lastPrompt = '';

function init() {
  setupTabs();
  setupPills();
  setupImageUpload();
  setupTextarea();
  setupGenerate();
  setupOutput();
  setupSettings();
  setupBottomBar();
}

function setupTabs() {
  ['text','image','url'].forEach(id => {
    document.getElementById('tab-' + id).addEventListener('click', () => switchTab(id));
  });
}

function switchTab(t) {
  currentTab = t;
  ['text','image','url'].forEach(id => {
    document.getElementById('tab-' + id).classList.toggle('active', id === t);
    document.getElementById('pane-' + id).style.display = id === t ? 'block' : 'none';
  });
}

function setupPills() {
  document.getElementById('fw-group').querySelectorAll('.pill').forEach(btn => {
    btn.addEventListener('click', () => selectPill(btn, 'fw-group'));
  });
  document.getElementById('st-group').querySelectorAll('.pill').forEach(btn => {
    btn.addEventListener('click', () => selectPill(btn, 'st-group'));
  });
}

function selectPill(btn, groupId) {
  document.getElementById(groupId).querySelectorAll('.pill').forEach(p => p.classList.remove('on'));
  btn.classList.add('on');
}

function getSelected(groupId) {
  const el = document.querySelector('#' + groupId + ' .pill.on');
  return el ? el.textContent.trim() : '';
}

function setupTextarea() {
  const ta = document.getElementById('desc-txt');
  const counter = document.getElementById('char-count');
  ta.addEventListener('input', () => {
    counter.textContent = ta.value.length + '/800';
  });
}

function setupImageUpload() {
  const zone = document.getElementById('drop-zone');
  const fileInp = document.getElementById('file-inp');
  const prevArea = document.getElementById('img-prev-area');
  const removeBtn = document.getElementById('img-remove-btn');

  zone.addEventListener('click', () => fileInp.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('dragover');
    const f = e.dataTransfer.files[0];
    if (f) loadImageFile(f);
  });
  fileInp.addEventListener('change', e => {
    if (e.target.files[0]) loadImageFile(e.target.files[0]);
  });
  removeBtn.addEventListener('click', () => {
    imgData = null; imgMime = null;
    prevArea.style.display = 'none';
    zone.style.display = 'block';
    fileInp.value = '';
  });
}

function loadImageFile(file) {
  if (file.size > 4 * 1024 * 1024) {
    showError('Image too large (max 4 MB). Please compress and retry.');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    imgData = e.target.result;
    imgMime = file.type;
    document.getElementById('img-prev').src = imgData;
    document.getElementById('drop-zone').style.display = 'none';
    document.getElementById('img-prev-area').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function setupGenerate() {
  document.getElementById('gen-btn').addEventListener('click', generate);
}

async function generate() {
  const fw = getSelected('fw-group');
  const st = getSelected('st-group');
  const colors = document.getElementById('clr-inp').value.trim();
  const font = document.getElementById('fnt-inp').value.trim();
  const desc = document.getElementById('desc-txt').value.trim();
  const urlVal = document.getElementById('url-inp').value.trim();
  const apiKey = document.getElementById('api-key-inp').value.trim();

  if (currentTab === 'text' && !desc) { showError('Please describe the UI you want to build.'); return; }
  if (currentTab === 'image' && !imgData) { showError('Please upload a UI screenshot first.'); return; }
  if (currentTab === 'url' && !urlVal) { showError('Please paste a URL.'); return; }
  if (!apiKey) { document.getElementById('settings-panel').classList.add('open'); showError('Add your Anthropic API key in Settings first.'); return; }

  setLoading(true);
  document.getElementById('output-wrap').classList.remove('visible');

  const instruction = buildInstruction(fw, st, colors, font, desc, urlVal);
  let userContent;

  if (currentTab === 'image' && imgData) {
    const b64 = imgData.split(',')[1];
    userContent = [
      { type: 'image', source: { type: 'base64', media_type: imgMime, data: b64 } },
      { type: 'text', text: instruction }
    ];
  } else {
    userContent = [{ type: 'text', text: instruction }];
  }

  const payload = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: 'You are an expert UI/UX prompt engineer. Your prompts are hyper-precise and produce pixel-accurate results. Always return valid JSON only — no markdown fences, no preamble, no extra text.',
    messages: [{ role: 'user', content: userContent }]
  };

  try {
    const endpoint = mode === 'proxy'
      ? document.getElementById('proxy-url-inp').value.trim() + '/generate'
      : 'https://api.anthropic.com/v1/messages';

    const headers = { 'Content-Type': 'application/json' };
    if (mode === 'direct') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    }

    const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('API returned ' + res.status);

    const data = await res.json();
    const raw = (data.content || []).map(b => b.text || '').join('');
    const clean = raw.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(clean);

    renderOutput(parsed);
  } catch (e) {
    showError('Error: ' + (e.message || 'Check your API key and try again.'));
  } finally {
    setLoading(false);
  }
}

function buildInstruction(fw, st, colors, font, desc, urlVal) {
  const inputLine = currentTab === 'url'
    ? `URL reference: ${urlVal}`
    : currentTab === 'image'
      ? `[See attached UI screenshot — analyze and recreate it exactly]`
      : `Input description: "${desc}"`;

  return `You are an expert UI/UX prompt engineer. Transform the following into the most precise, optimized prompt for building an exact UI.

${inputLine}
Target framework: ${fw}
Style direction: ${st}${colors ? `\nColor palette: ${colors}` : ''}${font ? `\nFont family: ${font}` : ''}

Write a hyper-detailed, engineer-ready prompt covering:
- Exact layout structure and grid system
- Complete component hierarchy (parent → child)
- Precise spacing values (margins, padding, gaps in px/rem)
- Full color system (background layers, borders, text, accents — with exact hex values)
- Typography scale (font-size, font-weight, line-height, letter-spacing per element)
- Interactive states (hover, focus, active, disabled) with transition specs
- Responsive breakpoints and behavior
- Accessibility roles and aria attributes
- Animation and motion specs
- Specific code patterns and naming conventions for ${fw}

Target accuracy: 99%+. Be hyper-specific. A developer should be able to implement this without any guesswork.

Return ONLY a raw JSON object. No markdown. No backticks. No preamble. Keys:
- prompt: the full detailed prompt (300-450 words)
- accuracy: short string e.g. "98-99%"
- layout: brief layout description, max 5 words
- components: key components, comma-separated, max 5 items
- tokens: one of "low" | "medium" | "high"`;
}

function renderOutput(parsed) {
  lastPrompt = parsed.prompt || '';
  document.getElementById('output-box').textContent = lastPrompt;
  document.getElementById('acc-pill').textContent = parsed.accuracy || '~99% accuracy';
  document.getElementById('bd-layout').textContent = parsed.layout || '—';
  document.getElementById('bd-comp').textContent = parsed.components || '—';
  document.getElementById('bd-tok').textContent = parsed.tokens || '—';
  document.getElementById('output-wrap').classList.add('visible');
}

function setupOutput() {
  document.getElementById('copy-btn').addEventListener('click', () => {
    if (!lastPrompt) return;
    navigator.clipboard.writeText(lastPrompt).then(() => {
      const btn = document.getElementById('copy-btn');
      btn.classList.add('copied');
      btn.textContent = '✓ Copied!';
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="8" height="8" rx="1.5"/><path d="M2 10V2h8"/></svg> Copy prompt';
      }, 2000);
    });
  });

  document.getElementById('regen-btn').addEventListener('click', () => {
    document.getElementById('output-wrap').classList.remove('visible');
    generate();
  });

  document.getElementById('refine-btn').addEventListener('click', () => {
    if (lastPrompt) alert('Copy the prompt above and paste it into Claude with: "Please refine this UI prompt to be even more precise for pixel-perfect implementation."');
  });
}

function setupSettings() {
  document.getElementById('mode-direct').addEventListener('click', () => setMode('direct'));
  document.getElementById('mode-proxy').addEventListener('click', () => setMode('proxy'));
  document.getElementById('save-btn').addEventListener('click', saveSettings);
}

function setMode(m) {
  mode = m;
  document.getElementById('mode-direct').classList.toggle('direct', m === 'direct');
  document.getElementById('mode-proxy').classList.toggle('direct', m === 'proxy');
  document.getElementById('proxy-field').style.display = m === 'proxy' ? 'flex' : 'none';
  const badge = document.getElementById('mode-badge');
  badge.textContent = m === 'direct' ? 'Direct API' : 'Java Proxy';
  badge.classList.toggle('direct', m === 'direct');
}

function saveSettings() {
  document.getElementById('settings-panel').classList.remove('open');
}

function setupBottomBar() {
  document.getElementById('settings-toggle-btn').addEventListener('click', () => {
    document.getElementById('settings-panel').classList.toggle('open');
  });
  document.getElementById('mode-badge').addEventListener('click', () => {
    setMode(mode === 'direct' ? 'proxy' : 'direct');
  });
}

function setLoading(on) {
  const btn = document.getElementById('gen-btn');
  btn.disabled = on;
  document.getElementById('spinner').style.display = on ? 'block' : 'none';
  document.getElementById('btn-icon').style.display = on ? 'none' : 'inline';
  document.getElementById('btn-txt').textContent = on ? 'Generating...' : 'Generate optimized prompt';
}

function showError(msg) {
  const el = document.getElementById('err-banner');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 5000);
}

document.addEventListener('DOMContentLoaded', init);
```

---

## FILE 5 — background.js

```javascript
chrome.runtime.onInstalled.addListener(() => {
  console.log('PromptForge installed.');
});
```

---

## CRITICAL RULES

1. Copy all CSS variables, hex values, border-radius, opacity values EXACTLY as listed — no substitutions
2. The `border-bottom: 1px solid var(--surface)` on active tab is what makes the tab visually connect to the content — do not omit it
3. The `::before` glow on `.ext-shell` uses `position: absolute; top: -60px` — it intentionally extends outside the element top
4. The generate button has BOTH a gradient background AND a `::after` gloss overlay — both are required
5. `font-family: var(--mono)` (JetBrains Mono) applies to: output box, char badge, settings input
6. Image base64 string sent to API must strip the `data:...;base64,` prefix — use `imgData.split(',')[1]`
7. No inline `onclick` in HTML — all event listeners via `addEventListener` in popup.js
8. No `<script>` tags in popup.html — only `<script src="popup.js">` at end of body
9. `#proxy-field` defaults to `display: none` and is revealed only in Java Proxy mode
10. The status dot pulse animation is `2s ease infinite` — not linear

## CHECKLIST

- [ ] All 5 CSS background layers use correct hex values (`#0A0A0F`, `#111118`, `#18181F`, `#1E1E28`)
- [ ] Header title has gradient text (not solid color)
- [ ] Logo mark has `box-shadow: 0 0 16px rgba(124,106,250,0.4)`
- [ ] Active tab has `border-bottom: 1px solid var(--surface)` (not transparent)
- [ ] Textarea has `caret-color: var(--accent2)`
- [ ] Textarea focus has `box-shadow: 0 0 0 3px rgba(124,106,250,0.08)`
- [ ] Generate button has `::after` overlay pseudo-element
- [ ] Spinner animation is `0.65s linear infinite` (not 1s)
- [ ] Output box uses JetBrains Mono at 11.5px / color `#C9C8E0`
- [ ] Copy button `.copied` state turns green (not purple)
- [ ] Settings input uses JetBrains Mono (not Outfit)
- [ ] `#proxy-field` is hidden by default via CSS `display: none`
- [ ] Status dot pulse is `2s ease infinite`

## PROMPT END
