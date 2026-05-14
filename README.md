# PromptForge Production Release

PromptForge is a state-of-the-art, fully optimized Chrome Extension designed to generate hyper-precise, context-aware AI prompts for building beautiful, high-fidelity, and pixel-accurate user interfaces. It seamlessly transforms plain English text descriptions, uploaded interface mockups, or live website URLs into advanced, deterministic markdown instructions tailored for modern web and mobile application development.

---

## ✨ Premium Features & Visual Advancements

### 🎨 Infinite Spectrum Color Picker & Dynamic Palette Syncing
- The manual color field is beautifully labeled as **`Color Palette`** and starts exceptionally pristine and unpolluted.
- Integrated a custom **Infinite Color Picker** indicator (represented by a sleek multicolor spectrum circle) embedded perfectly inside the right corner of the text box.
- Clicking the spectrum circle triggers the system's rich visual color canvas, allowing builders to smoothly drag their cursor across millions of hues, pick any custom shade, and instantly append its uppercase Hex string into the field, with real-time border active color sync feedback.

### 💎 Luxury Typography & Startup Font Suites
- Upgraded the simple font field into a high-end dropdown selection menu featuring globally adopted luxury, editorial, and startup fonts:
  - **Default UI (Outfit)**: Preserves an unpolluted baseline instruction footprint.
  - **Inter**: The global standard for high-performance SaaS and responsive web application systems.
  - **Playfair Display**: Classic high-end luxury editorial typography.
  - **Cinzel**: High-fashion, geometric classical lettering inspired by Roman architectural inscriptions.
  - **Cormorant Garamond**: Deeply sophisticated, elegant traditional serif.
  - **Montserrat**: Clean, geometric multi-weight modern sans-serif.
  - **Syne**: Artistic, avant-garde display sans-serif popular among elite creative studios.
  - **Plus Jakarta Sans**: Highly trending modern sans-serif loved by premium cloud startups.
  - **SF Pro / System Standard**: Renders flawlessly optimized native operating system interfaces.

### 🚀 Comprehensive Frameworks & Visual Design Trends
- **Curated Global Frameworks**: Next.js, Tailwind CSS, Angular, Svelte, Flutter / Mobile, React, Vue, HTML + CSS, Figma Spec, Any.
- **Cutting-Edge Design Directions**: SaaS Bento Grid, Neo-Brutalism, Skeuomorphic, Material Design, Pixel-perfect, Minimal clean, Dark mode, Glassmorphism, Neumorphism.

### 📝 Integrated Markdown Rich Text Editor (RTE)
- Replaced standard inputs with a built-in toolbar workspace supporting Bold, Italic, Underline, and Bulleted Lists.
- Dynamically parses multi-styled content directly into clean semantic markdown strings embedded deterministically inside prompt instructions.
- **AI Grammar Refinement (`✨ Refine`)**: Integrated an automatic text refinement button directly into the text toolbar. With a single click, the extension delegates your unpolished draft to the active AI engine to correct grammar, spelling, punctuation, and phrasing clarity instantly — ensuring hyper-professional input queries.
- **Extended Capacity**: Supports up to **1500 characters** of highly complex functional and architectural UI design guidelines.

### 🌐 Multi-Model Global AI Engine Support
Connect securely to the most powerful and widely adopted large language models across the globe:
- **Google Gemini**: Flash / Multimodal AI infrastructure.
- **Anthropic Claude**: Opus / Sonnet premium UI translation models.
- **OpenAI ChatGPT**: World-standard GPT-4o inference backbones.
- **DeepSeek**: Cutting-edge general intelligence platforms.
- **Groq**: High-speed open weights (Llama 3) inference execution.
- **Mistral AI**: Globally recognized developer open API standards.

### 🔒 Enhanced UX Layout & Advanced Security
- **Settings Architecture**: Streamlined the upper toolbar by replacing the static green `"Ready"` badge with a premium Settings gear icon. Completely eliminated the redundant footer block to maximize vertical space.
- **Premium Custom Scrollbars**: Replaced intrusive OS-default scrollbars with ultra-sleek, custom WebKit scrollbars (`::-webkit-scrollbar`) optimized to blend flawlessly into the dark/glassmorphic extension theme.
- **Developer Hardening**: Advanced configs (Java Proxy URL, mode selection) are secured inside a collapsible `"⚙️ Developer options"` zone inside the settings panel, protecting the core layout from accidental misconfigurations by non-technical users.
- **Strict CSP Validation**: Adheres rigorously to Chrome Manifest V3 Content Security Policy directives, utilizing `'unsafe-inline'` under `style-src` to dynamically sync selected colors while guaranteeing zero unsafe script execution vectors.

---

## 📁 System Architecture & Core Repositories

```
promptForge/
├── extension/                # Production-ready Chrome Extension codebase
│   ├── manifest.json         # MV3 metadata config & security policies
│   ├── popup.html            # High-fidelity premium HTML view layer
│   ├── popup.js              # UI Controller, fetch engines, RTE parser, tab screen capture
│   ├── popup.css             # Custom design tokens, glassmorphism variables, custom dropdown options
│   └── icons/                # Standard packaged icon sets
└── backend/                  # Java HTTP Proxy Backend Gateway
    ├── src/                  # Clean pass-through routing handlers (GenerateHandler, GeminiClient, ClaudeClient)
    ├── compile.sh            # Native compiler script
    └── run.sh                # Local application startup script
```

---

## ⚙️ Setup & Installation Guide

### Loading the Extension
1. Open Google Chrome and navigate directly to **`chrome://extensions/`**.
2. Enable **Developer mode** via the switch in the top-right corner.
3. Click **Load unpacked** and target the `extension/` directory inside this codebase.
4. The PromptForge icon will initialize inside your browser extension toolbar.

### Compiling & Running the Backend Gateway (Optional)
The Java Proxy mode routes extension payloads transparently through a local HTTP listener to circumvent external origin network limitations.
1. Navigate to the backend environment:
   ```bash
   cd backend/
   ```
2. Grant execution privileges to build files:
   ```bash
   chmod +x compile.sh run.sh
   ```
3. Build the source tree into class libraries:
   ```bash
   ./compile.sh
   ```
4. Boot up the HTTP proxy listener:
   ```bash
   ./run.sh
   ```
   The listener automatically binds to `http://localhost:8080` and handles pure zero-truncation API forwarding directly to Google Gemini and Anthropic APIs.

---

## 🔧 Configuration Protocol

1. Click the PromptForge toolbar button to reveal the interactive generation canvas.
2. Select the top-right **Settings gear icon** to open your API preferences.
3. Provide active keys for **Gemini** or **Claude** model execution engines.
4. (Optional): Open `"⚙️ Developer options"` to toggle between **Direct API** mode (extension queries external endpoints directly) and **Java Proxy** mode.
5. Click **Save settings** to securely persist state across tabs and extension lifecycle restarts.

---

## 📜 License & Compliance
Fully developed and aligned under open production standards. Ready for deployment on the Google Chrome Web Store.
