# PromptForge — Premium Chrome Extension UI Specification
## Complete Design System & Component Blueprint (100% Accuracy Guide)

> **This document is the single source of truth for the PromptForge extension UI.**
> Every measurement, color value, font, animation, and component is defined here precisely.
> Any agent or developer following this document should produce a pixel-identical result.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design Tokens — Complete Reference](#2-design-tokens--complete-reference)
3. [Typography System](#3-typography-system)
4. [Extension Shell & Layout](#4-extension-shell--layout)
5. [Header Component](#5-header-component)
6. [Tab Navigation Bar](#6-tab-navigation-bar)
7. [Input Panes (Text / Image / URL)](#7-input-panes)
8. [Options Section (Pills + Extra Inputs)](#8-options-section)
9. [Generate Button](#9-generate-button)
10. [Output Section](#10-output-section)
11. [Settings Panel](#11-settings-panel)
12. [Bottom Bar](#12-bottom-bar)
13. [States & Interactions](#13-states--interactions)
14. [Animations & Motion](#14-animations--motion)
15. [Complete File Structure](#15-complete-file-structure)
16. [Full HTML Structure (Annotated)](#16-full-html-structure-annotated)
17. [Full CSS (popup.css)](#17-full-css-popupcss)

---

## 1. Design Philosophy

**Aesthetic Direction:** Premium dark-mode developer tool. Think: VS Code meets Linear meets Vercel dashboard. Dark surfaces, electric purple accent, subtle glows, sharp typography. The popup feels like a native app — not a website crammed into 420px.

**Guiding principles:**
- Every surface is a shade of near-black, layered in depth
- The purple accent (`#7C6AFA`) is the only saturated color — used sparingly for active states and the CTA
- Green (`#34D399`) is used exclusively for status and success
- Text is almost-white, never pure white — prevents eye strain
- Borders are ultra-subtle (7% white opacity) — create structure without heaviness
- All corners are consistently rounded (12px for containers, 9px for inner elements, 20px for pills)
- Glow effects are used only on the logo mark and the status dot — restraint is key

---

## 2. Design Tokens — Complete Reference

### Color Palette

```css
:root {
  /* Backgrounds — layered dark surfaces */
  --bg:           #0A0A0F;   /* page/chrome background */
  --surface:      #111118;   /* extension shell */
  --surface2:     #18181F;   /* inputs, cards, drop zones */
  --surface3:     #1E1E28;   /* innermost elements, settings bg */

  /* Borders */
  --border:        rgba(255, 255, 255, 0.07);   /* default subtle border */
  --border-bright: rgba(255, 255, 255, 0.13);   /* hover / emphasis border */

  /* Accent — electric purple */
  --accent:           #7C6AFA;
  --accent2:          #A78BFA;   /* lighter purple, used on text */
  --accent-glow:      rgba(124, 106, 250, 0.15);
  --accent-glow-bright: rgba(124, 106, 250, 0.25);

  /* Status — emerald green */
  --green:     #34D399;
  --green-dim: rgba(52, 211, 153, 0.12);

  /* Text */
  --text:       #F0EFF8;   /* primary text — near-white with a cool tint */
  --text-muted: #8887A0;   /* secondary text */
  --text-dim:   #4A4960;   /* placeholder / disabled text */

  /* Fonts */
  --font: 'Outfit', sans-serif;
  --mono: 'JetBrains Mono', monospace;
}
```

### Spacing Scale

| Token | Value | Usage |
|---|---|---|
| xs | 4px | Icon gap, tight padding |
| sm | 6px | Pill gap, small element gap |
| md | 8px | Input internal padding (v), card padding |
| base | 10px | Options block margin, breakdown gap |
| lg | 12px | Content padding, section gap |
| xl | 14px | Content area top padding, section divider margin |
| 2xl | 16px | Header padding |
| 3xl | 18px | Header padding horizontal |

### Border Radius Scale

| Token | Value | Usage |
|---|---|---|
| pill | 20px | All pill/tag buttons |
| btn | 12px | Generate button, textarea, drop zone |
| card | 12px | Output box, options panels |
| inner | 9px | Extra inputs, action buttons, breakdown cards, save button |
| shell | 20px | Extension shell outer container |
| logo | 10px | Logo mark square |
| tab | 8px 8px 0 0 | Tab buttons (top only rounded) |
| icon-wrap | 12px | Drop zone icon container |

---

## 3. Typography System

### Font Loading

```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Type Scale

| Element | Font | Size | Weight | Color | Notes |
|---|---|---|---|---|---|
| Header title | Outfit | 14px | 600 | gradient: `#E0DEFF` → `#A78BFA` | `-webkit-background-clip: text` |
| Header subtitle | Outfit | 11px | 400 | `--text-dim` | |
| Tab button | Outfit | 12px | 500 | `--text-dim` (inactive) / `--accent2` (active) | |
| Option label (uppercase) | Outfit | 10.5px | 600 | `--text-dim` | `letter-spacing: 0.07em; text-transform: uppercase` |
| Pill button | Outfit | 11.5px | 500 | `--text-muted` (off) / `--accent2` (on) | |
| Textarea | Outfit | 12.5px | 400 | `--text` | `line-height: 1.6` |
| Placeholder | Outfit | 12px | 400 | `--text-dim` | |
| Extra input | Outfit | 12px | 400 | `--text` | |
| Extra input placeholder | Outfit | 11.5px | 400 | `--text-dim` | |
| Generate button | Outfit | 13px | 600 | `#FFFFFF` | `letter-spacing: 0.01em` |
| Output label (uppercase) | Outfit | 10.5px | 600 | `--text-dim` | `letter-spacing: 0.07em` |
| Accuracy pill | Outfit | 10.5px | 600 | `--green` | `letter-spacing: 0.03em` |
| Output box | JetBrains Mono | 11.5px | 400 | `#C9C8E0` | `line-height: 1.7` |
| Breakdown label | Outfit | 9.5px | 400 | `--text-dim` | `letter-spacing: 0.06em; text-transform: uppercase` |
| Breakdown value | Outfit | 11.5px | 500 | `--text` | |
| Action button | Outfit | 11.5px | 500 | `--text-muted` | |
| Settings label | Outfit | 10.5px | 500 | `--text-dim` | `letter-spacing: 0.04em; text-transform: uppercase` |
| Settings input | JetBrains Mono | 12px | 400 | `--text` | |
| Save button | Outfit | 12.5px | 600 | `--accent2` | |
| Status dot text | Outfit | 10.5px | 500 | `--green` | |
| Bottom bar model label | Outfit | 10px | 400 | `--text-dim` | |
| Char count badge | JetBrains Mono | 10px | 400 | `--text-dim` | |

---

## 4. Extension Shell & Layout

### Outer Container

```
width: 420px
background: #111118  (--surface)
border: 1px solid rgba(255,255,255,0.07)  (--border)
border-radius: 20px
overflow: hidden
box-shadow:
  0 0 0 1px rgba(255,255,255,0.03),
  0 40px 80px rgba(0,0,0,0.8)
position: relative
```

### Top Glow Pseudo-element

Applied as `::before` on the shell. Creates a purple atmospheric glow at the top.

```css
.ext-shell::before {
  content: '';
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 280px;
  height: 120px;
  background: radial-gradient(ellipse, rgba(124,106,250,0.18) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}
```

### Stacking Order (top to bottom)

```
1. .header          — 16px top / 18px sides / 14px bottom padding, border-bottom
2. .tab-bar         — 10px top / 12px sides, border-bottom
3. .content         — 14px sides, 0 bottom (bottom padding comes from children)
   ├── #pane-text / #pane-image / #pane-url   — 12px top padding
   ├── .options-block (framework)             — 12px margin-top
   ├── .options-block (style)                 — 10px margin-top
   ├── .extra-inputs                          — 10px margin-top
   ├── .gen-btn                               — 14px margin-top
   ├── .err-banner                            — 8px margin-top
   └── .output-wrap                           — contains divider + output UI
4. .settings-panel  — 14px padding all sides
5. .bottom-bar      — 10px top / 14px sides / 14px bottom, border-top
```

---

## 5. Header Component

**Container:** `padding: 16px 18px 14px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border); position: relative; z-index: 1;`

### Logo Mark

```
width: 32px
height: 32px
background: linear-gradient(135deg, #7C6AFA, #A78BFA)
border-radius: 10px
display: flex; align-items: center; justify-content: center
box-shadow: 0 0 16px rgba(124,106,250,0.4)
```

**SVG icon inside logo:** 16×16, white strokes, hexagon with checkmark:
```svg
<svg viewBox="0 0 20 20" fill="none">
  <path d="M10 2L17 6V14L10 18L3 14V6L10 2Z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M7 10L9.5 12.5L13.5 8" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

### Title Block

```
flex: 1
.header-title:
  font-size: 14px
  font-weight: 600
  letter-spacing: -0.01em
  background: linear-gradient(90deg, #E0DEFF, #A78BFA)
  -webkit-background-clip: text
  -webkit-text-fill-color: transparent
  background-clip: text
  color: transparent

.header-sub:
  font-size: 11px
  color: var(--text-dim)
  margin-top: 1px
  font-weight: 400
```

### Status Dot

Position: `margin-left: auto` (pushed to right by flex).

```css
.status-dot {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  color: var(--green);
  font-weight: 500;
}

.status-dot::before {
  content: '';
  width: 6px; height: 6px;
  background: #34D399;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(52, 211, 153, 0.6);
  animation: pulse 2s ease infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

Text content: `"Ready"`

---

## 6. Tab Navigation Bar

**Container:** `padding: 10px 12px 0; display: flex; gap: 2px; border-bottom: 1px solid var(--border);`

Three tabs: **Describe it** | **Upload image** | **URL / Link**

### Tab Button (inactive)

```
flex: 1
padding: 8px 10px
font-size: 12px; font-weight: 500
font-family: var(--font)
background: transparent
border: none
cursor: pointer
color: var(--text-dim)
border-radius: 8px 8px 0 0
display: flex; align-items: center; justify-content: center; gap: 6px
position: relative; bottom: -1px
transition: all 0.2s
```

### Tab Button (active)

Add these on top of the inactive styles:

```
color: var(--accent2)
border: 1px solid var(--border)
border-bottom: 1px solid var(--surface)   ← CRITICAL: hides the container border-bottom
background: var(--surface)
```

### Tab Icons

Each tab has a 13×13 SVG icon. `opacity: 0.7` on inactive, `opacity: 1` on active. Stroke color inherits from button `color`.

**Tab 1 — "Describe it" icon:**
```svg
<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="2" y="3" width="12" height="10" rx="2"/>
  <line x1="5" y1="6" x2="11" y2="6"/>
  <line x1="5" y1="8.5" x2="9" y2="8.5"/>
</svg>
```

**Tab 2 — "Upload image" icon:**
```svg
<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="2" y="3" width="12" height="10" rx="2"/>
  <circle cx="5.5" cy="7" r="1.2"/>
  <path d="M2 11l3-3 2.5 2.5 2.5-2.5 3.5 3.5"/>
</svg>
```

**Tab 3 — "URL / Link" icon:**
```svg
<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M6.5 9.5l3-3"/>
  <path d="M6 6.5l-1.5 1.5a2.12 2.12 0 000 3l.5.5a2.12 2.12 0 003 0l1.5-1.5"/>
  <path d="M10 9.5l1.5-1.5a2.12 2.12 0 000-3l-.5-.5a2.12 2.12 0 00-3 0L6.5 6"/>
</svg>
```

---

## 7. Input Panes

Only one pane is visible at a time. Hidden panes use `display: none`. All panes have `padding-top: 12px`.

### Pane 1 — Text Description

**Textarea wrapper:** `position: relative`

**Textarea:**
```
width: 100%
resize: none
height: 96px
padding: 12px 14px
padding-right: 50px    ← room for char badge
font-size: 12.5px; line-height: 1.6
font-family: var(--font)
background: var(--surface2)
border: 1px solid var(--border)
border-radius: 12px
color: var(--text)
outline: none
caret-color: var(--accent2)
transition: border-color 0.2s, box-shadow 0.2s
maxlength: 800

:focus state:
  border-color: rgba(124,106,250,0.35)
  box-shadow: 0 0 0 3px rgba(124,106,250,0.08)
```

**Character count badge:**
```
position: absolute; bottom: 10px; right: 12px
font-size: 10px; font-family: var(--mono)
color: var(--text-dim)
background: var(--surface3)
border-radius: 4px
padding: 2px 5px
```
Format: `"0/800"` — updates live on input event.

### Pane 2 — Image Upload

**Drop zone (visible by default in this pane):**
```
border: 1.5px dashed rgba(255,255,255,0.13)  (--border-bright)
border-radius: 12px
padding: 24px 20px
text-align: center
cursor: pointer
background: var(--surface2)
transition: all 0.2s

:hover and .drag-over state:
  border-color: rgba(124,106,250,0.4)
  background: rgba(124,106,250,0.04)
```

**Drop zone icon container:**
```
width: 44px; height: 44px
border-radius: 12px
background: var(--surface3)
border: 1px solid rgba(255,255,255,0.13)
display: flex; align-items: center; justify-content: center
margin: 0 auto 10px
```

Icon SVG (20×20, stroke: `var(--text-muted)`, stroke-width: 1.5):
```svg
<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5">
  <path d="M4 16l4-4 3 3 4-4 5 5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor"/>
  <circle cx="8" cy="10" r="1.5" stroke="currentColor"/>
</svg>
```

**Drop title:** `font-size: 13px; font-weight: 500; color: var(--text); margin-bottom: 3px`
**Drop subtitle:** `font-size: 11px; color: var(--text-dim)`
Content: `"Drop screenshot or mockup"` / `"PNG, JPG, WEBP · max 4 MB"`

**Image preview area** (hidden until image loaded):
```
display: none → block when image loaded
position: relative
border-radius: 10px
overflow: hidden
border: 1px solid var(--border)
```

**Preview image:** `width: 100%; max-height: 160px; object-fit: cover; display: block`

**Remove button:**
```
position: absolute; top: 7px; right: 7px
background: rgba(0,0,0,0.7); color: white
border: none; border-radius: 50%
width: 22px; height: 22px; cursor: pointer
font-size: 12px
display: flex; align-items: center; justify-content: center
```
Content: `"✕"`

### Pane 3 — URL Input

Full-width text input (same `.extra-input` styles but width 100%, padding 10px 12px, border-radius 12px, font-size 12.5px).

Info box below:
```
margin-top: 8px
padding: 9px 11px
background: rgba(124,106,250,0.06)
border: 1px solid rgba(124,106,250,0.15)
border-radius: 9px
font-size: 11px; color: #9090B8; line-height: 1.6
```
Content: `"Paste a public design URL (Dribbble, Behance, a live site). The extension will screenshot and analyze it automatically."`

---

## 8. Options Section

### Framework Pills Block

```
margin-top: 12px
```

**Label:** `font-size: 10.5px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: var(--text-dim); margin-bottom: 6px; display: block`
Content: `"Target framework"`

**Pill group:** `display: flex; flex-wrap: wrap; gap: 5px`

Options (in order): `React` (default selected), `HTML + CSS`, `Vue`, `Figma spec`, `Any`

**Pill button (off state):**
```
font-size: 11.5px; font-weight: 500
padding: 5px 11px
border-radius: 20px
border: 1px solid rgba(255,255,255,0.13)  (--border-bright)
cursor: pointer; color: var(--text-muted)
background: var(--surface2)
transition: all 0.15s; font-family: var(--font)

:hover:
  border-color: rgba(124,106,250,0.3)
  color: var(--text)
```

**Pill button (on/active state):**
```
background: rgba(124,106,250,0.15)
border-color: rgba(124,106,250,0.4)
color: var(--accent2)   → #A78BFA
```

### Style Pills Block

```
margin-top: 10px
```

Label content: `"Style direction"`

Options (in order): `Pixel-perfect` (default selected), `Minimal clean`, `Dark mode`, `Glassmorphism`, `Neumorphism`

Same pill styling as framework pills.

### Extra Inputs Row

```
display: grid
grid-template-columns: 1fr 1fr
gap: 8px
margin-top: 10px
```

**Each input:**
```
padding: 8px 11px
font-size: 12px; font-family: var(--font)
background: var(--surface2)
border: 1px solid var(--border)
border-radius: 9px; color: var(--text)
outline: none
transition: border-color 0.2s

:focus:
  border-color: rgba(124,106,250,0.3)

::placeholder:
  color: var(--text-dim)
  font-size: 11.5px
```

Input 1 placeholder: `"🎨 Colors (e.g. #6355E0)"`
Input 2 placeholder: `"Aa Font (e.g. Outfit)"`

---

## 9. Generate Button

```
width: 100%
margin-top: 14px; margin-bottom: 0
padding: 11px
font-size: 13px; font-weight: 600; letter-spacing: 0.01em
font-family: var(--font)
background: linear-gradient(135deg, #6355E0, #9174FA)
color: white; border: none
border-radius: 12px; cursor: pointer
transition: all 0.2s
display: flex; align-items: center; justify-content: center; gap: 8px
position: relative; overflow: hidden

::after (inner gloss overlay):
  content: ''
  position: absolute; inset: 0
  background: linear-gradient(135deg, rgba(255,255,255,0.08), transparent)
  pointer-events: none

:hover:
  transform: translateY(-1px)
  box-shadow: 0 8px 24px rgba(124,106,250,0.4)

:active:
  transform: scale(0.99)

:disabled:
  opacity: 0.5; cursor: not-allowed
  transform: none; box-shadow: none
```

**Button icon (star/spark SVG):**
```svg
<svg viewBox="0 0 18 18" fill="none" width="15" height="15">
  <path d="M9 2l1.8 5.4H16l-4.5 3.3 1.7 5.3L9 13l-4.2 3 1.7-5.3L2 7.4h5.2L9 2z"
    stroke="white" stroke-width="1.3" stroke-linejoin="round"/>
</svg>
```

**Loading spinner (shown during API call):**
```
width: 14px; height: 14px
border: 2px solid rgba(255,255,255,0.25)
border-top-color: white
border-radius: 50%
animation: spin 0.65s linear infinite
display: none  ← shown during loading

@keyframes spin { to { transform: rotate(360deg); } }
```

**State management:**
- Default: icon visible, spinner hidden, text = `"Generate optimized prompt"`
- Loading: icon hidden, spinner visible, text = `"Generating..."`, button disabled
- After response: revert to default state

---

## 10. Output Section

Hidden (`display: none`) until API call succeeds. Shown by adding class `visible` which sets `display: block`.

### Divider

```
height: 1px
background: rgba(255,255,255,0.07)  (--border)
margin: 14px 0 12px
```

### Output Header Row

```
display: flex; align-items: center; justify-content: space-between
margin-bottom: 8px
```

**Output label:**
```
font-size: 10.5px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase
color: var(--text-dim)
display: flex; align-items: center; gap: 6px

::before (green dot):
  content: ''
  width: 5px; height: 5px
  background: #34D399
  border-radius: 50%
  box-shadow: 0 0 6px rgba(52,211,153,0.7)
```
Text: `"Generated prompt"`

**Accuracy pill:**
```
font-size: 10.5px; font-weight: 600; letter-spacing: 0.03em
padding: 3px 9px; border-radius: 20px
background: rgba(52,211,153,0.12)  (--green-dim)
border: 1px solid rgba(52,211,153,0.2)
color: #34D399  (--green)
```
Content: populated from API response `parsed.accuracy` (e.g. `"98-99%"`)

### Output Box

```
font-family: 'JetBrains Mono', monospace
font-size: 11.5px; line-height: 1.7
padding: 13px 14px
background: var(--surface2)
border: 1px solid var(--border)
border-radius: 12px
color: #C9C8E0
max-height: 200px; overflow-y: auto
white-space: pre-wrap; word-break: break-word
scrollbar-width: thin; scrollbar-color: var(--surface3) transparent
```

### Breakdown Grid

```
display: grid; grid-template-columns: repeat(3, 1fr)
gap: 6px; margin-top: 8px
```

**Each card:**
```
background: var(--surface2)
border: 1px solid var(--border)
border-radius: 9px
padding: 8px 10px
```

Card label: `font-size: 9.5px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px`
Card value: `font-size: 11.5px; font-weight: 500; color: var(--text)`

Three cards (in order):
1. Label: `"Layout"` / Value: from `parsed.layout`
2. Label: `"Components"` / Value: from `parsed.components`
3. Label: `"Prompt size"` / Value: from `parsed.tokens`

### Action Buttons Row

```
display: flex; gap: 6px; margin-top: 8px
```

**Each button:**
```
flex: 1; padding: 8px 6px
font-size: 11.5px; font-weight: 500; font-family: var(--font)
background: var(--surface2)
border: 1px solid var(--border)
border-radius: 9px
cursor: pointer; color: var(--text-muted)
transition: all 0.15s
display: flex; align-items: center; justify-content: center; gap: 5px

:hover:
  border-color: var(--border-bright)
  color: var(--text)
  background: var(--surface3)
```

**Three buttons:**
1. `id="copy-btn"` — Copy icon (14px) + `"Copy prompt"`
2. `id="regen-btn"` — Refresh icon (14px) + `"Regenerate"`
3. Refine button — Arrow icon (14px) + `"Refine ↗"`

**Copy button "Copied" state:**
```
background: rgba(52,211,153,0.12)
border-color: rgba(52,211,153,0.2)
color: #34D399
content: "✓ Copied!"
```
Reverts after 2000ms.

**SVG icons for action buttons (14×14, stroke: currentColor, stroke-width: 1.5):**

Copy:
```svg
<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="4" y="4" width="8" height="8" rx="1.5"/>
  <path d="M2 10V2h8"/>
</svg>
```

Regenerate:
```svg
<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M2 7a5 5 0 009.5-2M12 7a5 5 0 01-9.5 2"/>
  <path d="M10.5 4.5L12 2.5l1.5 2"/>
</svg>
```

Refine/arrow:
```svg
<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M2 12l4-4 6-6"/>
  <path d="M8 2h4v4"/>
</svg>
```

---

## 11. Settings Panel

Hidden by default. Toggled by settings button in bottom bar. Uses CSS class `.open` to show.

```
display: none → block (.open)
padding: 14px all sides
border-top: 1px solid var(--border)
background: rgba(0,0,0,0.2)
```

### Inside settings panel:

**Settings row:** `display: flex; flex-direction: column; gap: 8px`

**Each field:** `display: flex; flex-direction: column; gap: 4px`

**Field label:** `font-size: 10.5px; color: var(--text-dim); font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase`

**Settings text input:**
```
padding: 8px 11px
font-size: 12px; font-family: var(--mono)
background: var(--surface3)
border: 1px solid var(--border)
border-radius: 8px; color: var(--text)
outline: none
transition: border-color 0.2s

:focus:
  border-color: rgba(124,106,250,0.3)

::placeholder:
  color: var(--text-dim); font-family: var(--font)
```

**Field 1:** API Key label + password input, placeholder `"sk-ant-api03-..."`

**Field 2:** Mode label + two mode buttons side by side (flex, gap 6px)

**Mode toggle button (base):**
```
flex: 1; padding: 7px
font-size: 11px; font-weight: 500; font-family: var(--font)
background: var(--surface2)
border: 1px solid var(--border)
border-radius: 8px; cursor: pointer; color: var(--text-dim)
transition: all 0.15s
```

**Mode toggle button (active/`.direct` state):**
```
color: #34D399  (--green)
border-color: rgba(52,211,153,0.2)
background: rgba(52,211,153,0.12)  (--green-dim)
```

Button 1 text: `"● Direct API"` (default active)
Button 2 text: `"◌ Java proxy"`

**Field 3:** Proxy URL (hidden when mode is Direct, shown when Java Proxy selected)
Label: `"Proxy URL"` / Input default value: `"http://localhost:8080"`

**Save button:**
```
width: 100%; padding: 9px
font-size: 12.5px; font-weight: 600; font-family: var(--font)
background: rgba(124,106,250,0.1)
border: 1px solid rgba(124,106,250,0.25)
border-radius: 9px; color: var(--accent2)  → #A78BFA
cursor: pointer; margin-top: 4px
transition: all 0.15s

:hover:
  background: rgba(124,106,250,0.18)
```
Content: `"Save settings"`

---

## 12. Bottom Bar

```
padding: 10px 14px 14px
display: flex; gap: 6px
border-top: 1px solid var(--border)
margin-top: 14px
align-items: center
```

**Three items in the row:**

1. **Settings toggle button:**
```
padding: 7px 12px
font-size: 11.5px; font-weight: 500; font-family: var(--font)
background: var(--surface2)
border: 1px solid var(--border)
border-radius: 8px; cursor: pointer; color: var(--text-muted)
display: flex; align-items: center; gap: 5px
transition: all 0.15s

:hover:
  border-color: var(--border-bright)
  color: var(--text)
```
Content: gear SVG (13×13) + `"Settings"`

Gear SVG:
```svg
<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">
  <circle cx="8" cy="8" r="2.5"/>
  <path d="M8 2v1M8 13v1M2 8H1m13 0h1M3.8 3.8l.7.7M11.5 11.5l.7.7M3.8 12.2l.7-.7M11.5 4.5l.7-.7"/>
</svg>
```

2. **Mode badge button:**
```
flex: 1; padding: 7px
font-size: 11px; font-weight: 500; font-family: var(--font)
Same base + .direct state as mode toggle buttons above
```
Default content: `"Direct API"` (with .direct class active)
Syncs with mode selection in settings.

3. **Model label:**
```
font-size: 10px; color: var(--text-dim)
display: flex; align-items: center; gap: 4px; white-space: nowrap
```
Content: info circle SVG (10×10) + `"claude-sonnet-4"`

Info circle SVG:
```svg
<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3">
  <path d="M6 1a5 5 0 100 10A5 5 0 006 1zM6 7V5m0 3v.5"/>
</svg>
```

---

## 13. States & Interactions

### Tab Switching

- On tab click: set `display: none` on all 3 panes, `display: block` on selected pane
- Toggle `.active` class on tab buttons
- Active tab uses `border-bottom: 1px solid var(--surface)` to visually merge with content area (hiding the container's border-bottom)

### Pill Selection (Single Select per Group)

- On click: remove `.on` from all pills in same group, add `.on` to clicked
- Two independent groups: framework (`id="fw-group"`) and style (`id="st-group"`)

### Image Upload

- Click on drop zone → trigger hidden file input click
- `dragover`: prevent default + set border-color to `rgba(124,106,250,0.4)`
- `dragleave`: reset border-color
- `drop`: prevent default + reset border + call readFile()
- `FileReader.readAsDataURL()` → store result in `imgData`, MIME in `imgMime`
- On load: hide drop zone, show img-preview-area, set `<img>` src
- Remove button: clear imgData/imgMime, hide preview, show drop zone, reset file input

### Generate Button States

| State | Button | Spinner | Icon | Text |
|---|---|---|---|---|
| Default | Enabled | Hidden | Visible | "Generate optimized prompt" |
| Loading | Disabled | Visible | Hidden | "Generating..." |
| Success | Enabled | Hidden | Visible | "Generate optimized prompt" |
| Error | Enabled | Hidden | Visible | "Generate optimized prompt" |

### Settings Toggle

`document.getElementById('settings-panel').classList.toggle('open')` on settings button click.

When Java Proxy mode selected: `document.getElementById('proxy-field').style.display = 'block'`
When Direct mode selected: `document.getElementById('proxy-field').style.display = 'none'`

### Error Banner

```
display: none → block (.show)
margin-top: 8px
padding: 8px 12px; border-radius: 9px
background: rgba(228,70,70,0.1)
border: 1px solid rgba(228,70,70,0.2)
font-size: 11.5px; color: #F87171
```
Auto-hides after 5000ms. Text set via JS.

---

## 14. Animations & Motion

All animations defined as `@keyframes`:

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
/* Used on: status dot ::before */
/* Duration: 2s ease infinite */

@keyframes spin {
  to { transform: rotate(360deg); }
}
/* Used on: spinner div */
/* Duration: 0.65s linear infinite */
```

**Transition durations:**
- Pill buttons: `0.15s`
- Tab buttons: `0.2s`
- Textarea focus: `0.2s` (border-color + box-shadow)
- Generate button hover: `0.2s`
- Action buttons: `0.15s`
- Extra inputs focus: `0.2s`
- Drop zone: `0.2s`
- Settings toggle: `0.15s`
- Save button: `0.15s`

---

## 15. Complete File Structure

```
promptforge-extension/
├── manifest.json
├── popup.html
├── popup.js
├── popup.css
├── background.js
└── icons/
    ├── icon16.png    (solid #7C6AFA bg, white hexagon, 16×16)
    ├── icon48.png    (same, 48×48)
    └── icon128.png   (same, 128×128)
```

**Note:** No Bootstrap. No external CSS framework. No CDN. Pure custom CSS only.

---

## 16. Full HTML Structure (Annotated)

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

    <!-- HEADER -->
    <div class="header">
      <div class="logo-mark">
        <!-- SVG: hexagon + checkmark, 20x20, white strokes -->
      </div>
      <div class="header-text">
        <div class="header-title">PromptForge</div>
        <div class="header-sub">UI prompt generator</div>
      </div>
      <div class="status-dot">Ready</div>
    </div>

    <!-- TAB BAR -->
    <div class="tab-bar">
      <button class="tab-btn active" id="tab-text"><!-- icon --> Describe it</button>
      <button class="tab-btn" id="tab-image"><!-- icon --> Upload image</button>
      <button class="tab-btn" id="tab-url"><!-- icon --> URL / Link</button>
    </div>

    <!-- CONTENT AREA -->
    <div class="content">

      <!-- PANE: Text -->
      <div id="pane-text">
        <div class="input-wrap">
          <textarea id="desc-txt" maxlength="800" placeholder="..."></textarea>
          <span class="char-badge" id="char-count">0/800</span>
        </div>
      </div>

      <!-- PANE: Image (display:none by default) -->
      <div id="pane-image" style="display:none">
        <div class="drop-zone" id="drop-zone">
          <div class="drop-icon-wrap"><!-- SVG --></div>
          <div class="drop-title">Drop screenshot or mockup</div>
          <div class="drop-sub">PNG, JPG, WEBP · max 4 MB</div>
        </div>
        <input type="file" id="file-inp" accept="image/*" style="display:none">
        <div class="img-preview-area" id="img-prev-area" style="display:none">
          <img id="img-prev" src="" alt="">
          <button class="img-remove" id="img-remove-btn">✕</button>
        </div>
      </div>

      <!-- PANE: URL (display:none by default) -->
      <div id="pane-url" style="display:none">
        <input class="extra-input url-input" id="url-inp" type="url" placeholder="https://...">
        <div class="url-info-box">
          Paste a public design URL (Dribbble, Behance, a live site)...
        </div>
      </div>

      <!-- OPTIONS: Framework pills -->
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

      <!-- OPTIONS: Style pills -->
      <div class="options-block">
        <span class="opt-label">Style direction</span>
        <div class="pill-group" id="st-group">
          <button class="pill on">Pixel-perfect</button>
          <button class="pill">Minimal clean</button>
          <button class="pill">Dark mode</button>
          <button class="pill">Glassmorphism</button>
          <button class="pill">Neumorphism</button>
        </div>
      </div>

      <!-- OPTIONS: Extra inputs -->
      <div class="extra-inputs">
        <input class="extra-input" id="clr-inp" type="text" placeholder="🎨 Colors (e.g. #6355E0)">
        <input class="extra-input" id="fnt-inp" type="text" placeholder="Aa Font (e.g. Outfit)">
      </div>

      <!-- GENERATE BUTTON -->
      <button class="gen-btn" id="gen-btn">
        <div class="spinner" id="spinner"></div>
        <svg id="btn-icon" ...><!-- star SVG --></svg>
        <span id="btn-txt">Generate optimized prompt</span>
      </button>

      <!-- ERROR BANNER -->
      <div class="err-banner" id="err-banner"></div>

      <!-- OUTPUT SECTION (hidden until generated) -->
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
          <button class="act-btn" id="copy-btn"><!-- copy icon --> Copy prompt</button>
          <button class="act-btn" id="regen-btn"><!-- refresh icon --> Regenerate</button>
          <button class="act-btn" id="refine-btn"><!-- arrow icon --> Refine ↗</button>
        </div>
      </div>

    </div><!-- /content -->

    <!-- SETTINGS PANEL (hidden by default) -->
    <div class="settings-panel" id="settings-panel">
      <div class="settings-row">
        <div class="settings-field">
          <span class="settings-lbl">Anthropic API key</span>
          <input class="settings-input" type="password" id="api-key-inp" placeholder="sk-ant-api03-...">
        </div>
        <div class="settings-field">
          <span class="settings-lbl">Mode</span>
          <div style="display:flex;gap:6px;">
            <button class="mode-toggle direct" id="mode-direct">● Direct API</button>
            <button class="mode-toggle" id="mode-proxy">◌ Java proxy</button>
          </div>
        </div>
        <div class="settings-field" id="proxy-field" style="display:none">
          <span class="settings-lbl">Proxy URL</span>
          <input class="settings-input" id="proxy-url-inp" type="text" value="http://localhost:8080">
        </div>
        <button class="save-btn" id="save-btn">Save settings</button>
      </div>
    </div>

    <!-- BOTTOM BAR -->
    <div class="bottom-bar">
      <button class="settings-toggle" id="settings-toggle-btn">
        <!-- gear SVG --> Settings
      </button>
      <button class="mode-toggle direct" id="mode-badge">Direct API</button>
      <div class="model-label">
        <!-- info SVG --> claude-sonnet-4
      </div>
    </div>

  </div><!-- /ext-shell -->

  <script src="popup.js"></script>
</body>
</html>
```

---

## 17. Full CSS (popup.css)

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

/* [All other rules follow from sections 4-12 above — see complete CSS in AGENT_PROMPT.md] */
```

---

*For the complete single-shot agent build prompt, see `AGENT_PROMPT_PREMIUM.md`*
