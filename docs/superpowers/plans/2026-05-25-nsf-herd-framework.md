# NSF-HERD Survey Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the static HTML/CSS/JS framework for the NSF HERD survey prototype — app shell, component library, state/calc/branching modules — plus two working demo sections (Q1 currency-table, Q4 yes/no branching) and a stub of the currency-matrix renderer. Question content for sections beyond Q1 and Q4 is added incrementally by the user later.

**Architecture:** Single `index.html` shell with persistent left side nav, top status pane, and a main content area showing one accordion-expanded section at a time. Survey content lives in `data/survey.json`. Vanilla JS modules: state (localStorage), sections (nav + active section), render (questions from JSON), matrix (currency matrices), calc (auto-totals), branching (showIf). No build step.

**Tech Stack:** HTML5, CSS3 with custom properties (CSS variables), vanilla ES modules (`<script type="module">`). No framework, no bundler, no test framework — manual verification in browser per the design spec.

**Spec reference:** [`docs/superpowers/specs/2026-05-25-nsf-herd-survey-design.md`](../specs/2026-05-25-nsf-herd-survey-design.md)

---

## Testing approach

Per the spec, this prototype uses **manual verification in a browser**, not automated tests. Each task ends with a verification step describing exactly what to check. Before starting, the executor should have a local web server running:

```bash
cd /Users/63172/Sites/NSF-HERD
python3 -m http.server 8000
# Open http://localhost:8000 in a browser; keep DevTools console open
```

Or use VS Code Live Server (right-click `index.html` → Open with Live Server).

---

## File structure (final state)

```
NSF-HERD/
├── index.html              # app shell
├── css/
│   ├── tokens.css          # design tokens (colors, spacing, type)
│   ├── base.css            # reset, typography, page baseline
│   ├── components.css      # button, input, currency input, accordion, side-nav-item, status-pane
│   └── layout.css          # app shell grid: header / side-nav / main / status
├── js/
│   ├── app.js              # entry point
│   ├── state.js            # localStorage answer storage
│   ├── sections.js         # active section, side nav rendering
│   ├── render.js           # render a section's questions
│   ├── matrix.js           # currency-matrix renderer
│   ├── calc.js             # row/column totals, "should match" hints
│   └── branching.js        # showIf evaluator
└── data/
    └── survey.json         # sections, questions, rules, formulas
```

The `.gitkeep` files in `css/`, `js/`, and `data/` are deleted as real files replace them.

---

## Task 1: Design tokens + CSS reset

**Files:**
- Create: `css/tokens.css`
- Create: `css/base.css`
- Create: `index.html` (minimal shell that loads them)
- Delete: `css/.gitkeep`

- [ ] **Step 1: Create the tokens file with all colors from the styles doc**

Create `css/tokens.css`:

```css
:root {
  /* Status / role colors (Tailwind 500-level) */
  --color-success: #10B981;
  --color-error: #EF4444;
  --color-warning: #F59E0B;
  --color-info: #3B82F6;

  /* Pale variants for banner backgrounds */
  --color-success-bg: #F0FDF4;
  --color-error-bg: #FEF2F2;
  --color-warning-bg: #FEF9C3;
  --color-info-bg: #EFF6FF;

  /* Surfaces */
  --color-surface: #FFFFFF;
  --color-nav-bg: #F9FAFB;
  --color-section-header: #F3F3F3;
  --color-section-header-parent: #333333;

  /* Strokes */
  --color-stroke-active: #3B82F6;
  --color-bullet: #60A5FA;
  --color-input-border: #D4D4D4;

  /* Text */
  --color-text: #000000;
  --color-text-muted: #333333;
  --color-placeholder: #ADAEBC;
  --color-text-disabled: #9CA5B8;

  /* Disabled states */
  --color-disabled-bg: #D1D9E2;
  --color-disabled-field-bg: #F9FAFB;

  /* Spacing scale (4px base) */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-12: 3rem;     /* 48px */

  /* Type scale */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;

  /* Radii */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);

  /* Layout dimensions */
  --side-nav-width: 280px;
  --status-pane-height: 64px;
  --header-height: 56px;
}
```

- [ ] **Step 2: Create the base CSS file**

Create `css/base.css`:

```css
*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-text);
  background-color: var(--color-surface);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5, h6 {
  margin: 0 0 var(--space-3) 0;
  font-weight: 600;
  line-height: 1.25;
  color: var(--color-text);
}

h1 { font-size: var(--text-2xl); }
h2 { font-size: var(--text-xl); }
h3 { font-size: var(--text-lg); }

p {
  margin: 0 0 var(--space-3) 0;
}

button {
  font-family: inherit;
  font-size: inherit;
}

input, select, textarea {
  font-family: inherit;
  font-size: inherit;
}
```

- [ ] **Step 3: Create a minimal `index.html` that loads the CSS**

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NSF HERD Survey — FY 2024</title>
  <link rel="stylesheet" href="css/tokens.css" />
  <link rel="stylesheet" href="css/base.css" />
</head>
<body>
  <h1>NSF HERD Survey</h1>
  <p>Framework setup in progress.</p>
</body>
</html>
```

- [ ] **Step 4: Delete the `.gitkeep` placeholder**

Run:

```bash
rm css/.gitkeep
```

- [ ] **Step 5: Verify in browser**

Open `http://localhost:8000` (or use Live Server). Expected:
- Page loads with "NSF HERD Survey" heading and paragraph
- System sans-serif font rendering
- No console errors
- DevTools → Elements → `:root` shows all custom properties from `tokens.css`

- [ ] **Step 6: Commit**

```bash
git add index.html css/tokens.css css/base.css css/.gitkeep
git commit -m "Add CSS tokens and base styles"
```

---

## Task 2: App shell HTML structure + layout CSS

**Files:**
- Modify: `index.html` (replace placeholder body with shell)
- Create: `css/layout.css`

- [ ] **Step 1: Replace `index.html` body with the app shell**

Replace the full contents of `index.html` with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NSF HERD Survey — FY 2024</title>
  <link rel="stylesheet" href="css/tokens.css" />
  <link rel="stylesheet" href="css/base.css" />
  <link rel="stylesheet" href="css/layout.css" />
</head>
<body>
  <div class="app">
    <header class="app-header">
      <h1 class="app-title">NSF HERD Survey — FY 2024</h1>
    </header>

    <nav class="app-side-nav" aria-label="Survey sections">
      <ol class="side-nav-list" id="side-nav-list">
        <!-- Side nav items rendered by sections.js -->
      </ol>
    </nav>

    <main class="app-main" id="app-main">
      <!-- Section content rendered by render.js -->
      <p>Loading…</p>
    </main>

    <div class="app-status" id="app-status">
      <!-- Status pane rendered by sections.js -->
    </div>
  </div>
</body>
</html>
```

- [ ] **Step 2: Create the layout CSS**

Create `css/layout.css`:

```css
.app {
  display: grid;
  grid-template-columns: var(--side-nav-width) 1fr;
  grid-template-rows: var(--header-height) 1fr var(--status-pane-height);
  grid-template-areas:
    "header header"
    "side-nav main"
    "status status";
  min-height: 100vh;
}

.app-header {
  grid-area: header;
  background-color: var(--color-section-header-parent);
  color: var(--color-surface);
  display: flex;
  align-items: center;
  padding: 0 var(--space-6);
}

.app-title {
  margin: 0;
  font-size: var(--text-lg);
  color: var(--color-surface);
  font-weight: 600;
}

.app-side-nav {
  grid-area: side-nav;
  background-color: var(--color-nav-bg);
  border-right: 1px solid var(--color-input-border);
  overflow-y: auto;
  padding: var(--space-4) 0;
}

.side-nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.app-main {
  grid-area: main;
  padding: var(--space-6);
  overflow-y: auto;
  background-color: var(--color-surface);
}

.app-status {
  grid-area: status;
  background-color: var(--color-section-header);
  border-top: 1px solid var(--color-input-border);
  padding: 0 var(--space-6);
  display: flex;
  align-items: center;
}
```

- [ ] **Step 3: Verify in browser**

Reload `http://localhost:8000`. Expected:
- Dark header bar at top spanning full width, white "NSF HERD Survey — FY 2024" text
- Left side nav area (light gray `#F9FAFB`) — empty list, but the column is visible
- Main area showing "Loading…"
- Light gray status bar at the bottom
- Layout fills the viewport with no horizontal scrollbar

- [ ] **Step 4: Commit**

```bash
git add index.html css/layout.css
git commit -m "Add app shell HTML and layout CSS"
```

---

## Task 3: Button and basic input components

**Files:**
- Create: `css/components.css`
- Modify: `index.html` (load components.css, add temporary demo block)

- [ ] **Step 1: Create components.css with button and text input styles**

Create `css/components.css`:

```css
/* === Buttons === */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.btn:focus-visible {
  outline: 2px solid var(--color-stroke-active);
  outline-offset: 2px;
}

.btn-primary {
  background-color: var(--color-info);
  color: var(--color-surface);
  border-color: var(--color-info);
}

.btn-primary:hover {
  background-color: #2563EB; /* darker blue on hover */
  border-color: #2563EB;
}

.btn-secondary {
  background-color: var(--color-surface);
  color: var(--color-text-muted);
  border-color: var(--color-input-border);
}

.btn-secondary:hover {
  background-color: var(--color-section-header);
}

.btn[disabled] {
  background-color: var(--color-disabled-bg);
  color: var(--color-text-disabled);
  border-color: var(--color-disabled-bg);
  cursor: not-allowed;
}

/* === Inputs === */

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.field-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
}

.input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: var(--text-base);
  line-height: 1.25;
}

.input::placeholder {
  color: var(--color-placeholder);
}

.input:focus {
  outline: none;
  border-color: var(--color-stroke-active);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.input[disabled],
.input[readonly] {
  background-color: var(--color-disabled-field-bg);
  color: var(--color-text-muted);
  cursor: not-allowed;
}
```

- [ ] **Step 2: Load components.css and add a temporary demo block to verify**

Modify `index.html`. Add the components.css link in the `<head>`:

```html
  <link rel="stylesheet" href="css/components.css" />
```

Replace the `<main class="app-main" id="app-main">` block with this temporary verification content:

```html
    <main class="app-main" id="app-main">
      <h2>Component demo (temporary)</h2>

      <div class="field">
        <label class="field-label" for="demo-text">Sample text input</label>
        <input class="input" type="text" id="demo-text" placeholder="Enter institution name" />
      </div>

      <div class="field">
        <label class="field-label" for="demo-text-readonly">Read-only input</label>
        <input class="input" type="text" id="demo-text-readonly" value="Auto-computed" readonly />
      </div>

      <button class="btn btn-primary">Save and continue</button>
      <button class="btn btn-secondary">Back</button>
      <button class="btn btn-primary" disabled>Disabled</button>
    </main>
```

- [ ] **Step 3: Verify in browser**

Reload `http://localhost:8000`. Expected:
- Text input with light gray border `#D4D4D4`, placeholder text in `#ADAEBC`
- Click into the input — border turns blue `#3B82F6`, subtle blue focus ring
- Read-only input has the disabled-field background `#F9FAFB`
- Primary button is blue with white text
- Secondary button is white with gray border
- Disabled button is gray on gray
- No console errors

- [ ] **Step 4: Commit**

```bash
git add index.html css/components.css
git commit -m "Add button and text input components"
```

---

## Task 4: Currency input component

**Files:**
- Modify: `css/components.css` (add currency input styles)
- Modify: `index.html` (add currency demo)

The currency input has a `$` prefix, displays formatted thousands on blur (`25342` → `$25,342`), and stores the raw numeric value as a data attribute for state.

- [ ] **Step 1: Add currency input styles to components.css**

Append to `css/components.css`:

```css
/* === Currency input === */

.currency-field {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.currency-field::before {
  content: "$";
  position: absolute;
  left: var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--text-base);
  pointer-events: none;
}

.currency-input {
  padding-left: calc(var(--space-3) + 0.75rem);
  text-align: right;
  width: 8rem;
  padding-top: var(--space-2);
  padding-bottom: var(--space-2);
  padding-right: var(--space-3);
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: var(--text-base);
  font-variant-numeric: tabular-nums;
}

.currency-input:focus {
  outline: none;
  border-color: var(--color-stroke-active);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.currency-input[readonly] {
  background-color: var(--color-disabled-field-bg);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.currency-input-hint {
  margin-left: var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
```

- [ ] **Step 2: Add currency demo to index.html**

Inside the `<main class="app-main" id="app-main">` block, add **before** the existing buttons:

```html
      <div class="field">
        <label class="field-label" for="demo-currency">Currency input (in thousands)</label>
        <div>
          <span class="currency-field">
            <input class="currency-input" type="text" id="demo-currency" inputmode="numeric" />
          </span>
          <span class="currency-input-hint">Dollars in thousands</span>
        </div>
      </div>

      <div class="field">
        <label class="field-label" for="demo-currency-readonly">Currency total (auto-computed)</label>
        <div>
          <span class="currency-field">
            <input class="currency-input" type="text" id="demo-currency-readonly" value="125,000" readonly />
          </span>
        </div>
      </div>
```

- [ ] **Step 3: Verify in browser**

Reload. Expected:
- Currency input shows a `$` prefix and right-aligned numeric area
- Tabular-nums alignment (digits align vertically)
- Read-only currency field has the disabled-field background
- "Dollars in thousands" hint is small and gray
- Typing in the input works (formatting will come from JS in a later task; for now raw digits OK)

- [ ] **Step 4: Commit**

```bash
git add css/components.css index.html
git commit -m "Add currency input component styling"
```

---

## Task 5: Accordion (drawer) component

**Files:**
- Modify: `css/components.css` (add accordion styles)
- Modify: `index.html` (add accordion demo)

- [ ] **Step 1: Add accordion styles to components.css**

Append to `css/components.css`:

```css
/* === Accordion / section drawer === */

.accordion {
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  overflow: hidden;
  background-color: var(--color-surface);
}

.accordion[data-state="open"] {
  border-left: 4px solid var(--color-stroke-active);
}

.accordion-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4) var(--space-5);
  background-color: var(--color-section-header);
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
}

.accordion-header:hover {
  background-color: #E8E8E8;
}

.accordion-header:focus-visible {
  outline: 2px solid var(--color-stroke-active);
  outline-offset: -2px;
}

.accordion-number {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-weight: 500;
  min-width: 4rem;
}

.accordion-chevron {
  margin-left: auto;
  transition: transform 0.15s ease;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.accordion[data-state="open"] .accordion-chevron {
  transform: rotate(90deg);
}

.accordion-body {
  display: none;
  padding: var(--space-5);
  border-top: 1px solid var(--color-input-border);
}

.accordion[data-state="open"] .accordion-body {
  display: block;
}
```

- [ ] **Step 2: Add accordion demo to index.html**

Replace the temporary component demo `<main>` content with a single accordion to verify behavior. Replace the entire `<main class="app-main" id="app-main">` block with:

```html
    <main class="app-main" id="app-main">
      <section class="accordion" data-state="open" id="demo-accordion">
        <button class="accordion-header" type="button" aria-expanded="true" aria-controls="demo-body">
          <span class="accordion-number">Question 1</span>
          <span>R&amp;D expenditures by source of funds</span>
          <span class="accordion-chevron" aria-hidden="true">▶</span>
        </button>
        <div class="accordion-body" id="demo-body">
          <p>Body content for the open section.</p>
          <button class="btn btn-primary">Save</button>
        </div>
      </section>

      <section class="accordion" data-state="closed" id="demo-accordion-2">
        <button class="accordion-header" type="button" aria-expanded="false" aria-controls="demo-body-2">
          <span class="accordion-number">Question 2</span>
          <span>Foreign R&amp;D sources</span>
          <span class="accordion-chevron" aria-hidden="true">▶</span>
        </button>
        <div class="accordion-body" id="demo-body-2">
          <p>Body content for the second section.</p>
        </div>
      </section>
    </main>
```

- [ ] **Step 3: Add a tiny inline script in index.html for accordion toggle (temporary; replaced by sections.js later)**

Add this `<script>` block just before the closing `</body>` tag in `index.html`:

```html
  <script>
    // Temporary accordion toggle - replaced by sections.js in a later task
    document.querySelectorAll('.accordion-header').forEach((header) => {
      header.addEventListener('click', () => {
        const accordion = header.closest('.accordion');
        const isOpen = accordion.dataset.state === 'open';
        accordion.dataset.state = isOpen ? 'closed' : 'open';
        header.setAttribute('aria-expanded', String(!isOpen));
      });
    });
  </script>
```

- [ ] **Step 4: Verify in browser**

Reload. Expected:
- Two accordion sections visible
- First one is open (blue left stroke, chevron rotated 90deg, body visible)
- Second is closed (no left stroke, chevron pointing right, body hidden)
- Click the closed header → opens; chevron rotates; left stroke appears
- Click the open header → closes
- Hover over a header → slightly darker background

- [ ] **Step 5: Commit**

```bash
git add css/components.css index.html
git commit -m "Add accordion component"
```

---

## Task 6: Side nav item with status indicator

**Files:**
- Modify: `css/components.css` (add side nav item styles)
- Modify: `index.html` (add side nav demo)

- [ ] **Step 1: Add side nav item styles**

Append to `css/components.css`:

```css
/* === Side nav items === */

.side-nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  border-left: 4px solid transparent;
  background: none;
  border-top: none;
  border-right: none;
  border-bottom: none;
  width: 100%;
  text-align: left;
}

.side-nav-item:hover {
  background-color: var(--color-section-header);
}

.side-nav-item[aria-current="true"] {
  background-color: var(--color-info-bg);
  border-left-color: var(--color-stroke-active);
  color: var(--color-text);
  font-weight: 500;
}

.side-nav-status {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: var(--text-xs);
  font-weight: 700;
  line-height: 1;
}

.side-nav-status[data-status="not-started"] {
  background-color: transparent;
  border: 1.5px solid var(--color-input-border);
  color: transparent;
}

.side-nav-status[data-status="in-progress"] {
  background-color: var(--color-warning);
  color: var(--color-surface);
}

.side-nav-status[data-status="in-progress"]::before {
  content: "…";
}

.side-nav-status[data-status="complete"] {
  background-color: var(--color-success);
  color: var(--color-surface);
}

.side-nav-status[data-status="complete"]::before {
  content: "✓";
}

.side-nav-number {
  color: var(--color-text-muted);
  font-weight: 500;
  min-width: 3rem;
}

.side-nav-label {
  flex: 1;
}
```

- [ ] **Step 2: Add side nav demo items to index.html**

Replace the empty `<ol class="side-nav-list" id="side-nav-list"></ol>` with:

```html
      <ol class="side-nav-list" id="side-nav-list">
        <li>
          <button class="side-nav-item" type="button" aria-current="true">
            <span class="side-nav-status" data-status="in-progress" aria-label="In progress"></span>
            <span class="side-nav-number">Q1</span>
            <span class="side-nav-label">R&amp;D expenditures</span>
          </button>
        </li>
        <li>
          <button class="side-nav-item" type="button">
            <span class="side-nav-status" data-status="complete" aria-label="Complete"></span>
            <span class="side-nav-number">Q2</span>
            <span class="side-nav-label">Foreign sources</span>
          </button>
        </li>
        <li>
          <button class="side-nav-item" type="button">
            <span class="side-nav-status" data-status="not-started" aria-label="Not started"></span>
            <span class="side-nav-number">Q3</span>
            <span class="side-nav-label">Contracts vs grants</span>
          </button>
        </li>
      </ol>
```

- [ ] **Step 3: Verify in browser**

Reload. Expected in the left side nav:
- Three items visible
- Q1 row: warning-orange dot with "…", blue left stroke, light blue background (it's the active item)
- Q2 row: green dot with "✓", no active styling
- Q3 row: empty circle outline, no active styling
- Hover any item → light gray background

- [ ] **Step 4: Commit**

```bash
git add css/components.css index.html
git commit -m "Add side nav item with status indicators"
```

---

## Task 7: Top status pane

**Files:**
- Modify: `css/components.css` (status pane styles)
- Modify: `index.html` (status pane demo)

- [ ] **Step 1: Add status pane styles to components.css**

Append to `css/components.css`:

```css
/* === Status pane === */

.status-pane {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
}

.status-pane-label {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-weight: 500;
}

.status-pane-bar {
  flex: 1;
  height: 8px;
  background-color: var(--color-disabled-bg);
  border-radius: 999px;
  overflow: hidden;
}

.status-pane-fill {
  height: 100%;
  background-color: var(--color-success);
  transition: width 0.2s ease;
}

.status-pane-count {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  min-width: 6rem;
  text-align: right;
}
```

- [ ] **Step 2: Add status pane content to index.html**

Replace the empty `<div class="app-status" id="app-status"></div>` with:

```html
    <div class="app-status" id="app-status">
      <div class="status-pane">
        <span class="status-pane-label">Overall progress</span>
        <div class="status-pane-bar" role="progressbar" aria-valuemin="0" aria-valuemax="17" aria-valuenow="3">
          <div class="status-pane-fill" style="width: 17.6%;"></div>
        </div>
        <span class="status-pane-count">3 of 17 complete</span>
      </div>
    </div>
```

- [ ] **Step 3: Verify in browser**

Reload. Expected:
- Bottom bar shows "Overall progress" label on the left
- A horizontal progress bar fills about 18% of the available width with green
- "3 of 17 complete" text on the right
- All text properly aligned vertically

- [ ] **Step 4: Commit**

```bash
git add css/components.css index.html
git commit -m "Add top status pane component"
```

---

## Task 8: State module

**Files:**
- Create: `js/state.js`
- Delete: `js/.gitkeep`

The state module is the single source of truth for user answers. It reads/writes to `localStorage` under one key, exposes a small API, and emits change events.

- [ ] **Step 1: Create js/state.js**

Create `js/state.js`:

```javascript
const STORAGE_KEY = 'nsf-herd-answers';

let answers = loadFromStorage();
const listeners = new Set();

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('[state] Could not parse stored answers; starting fresh.', err);
    return {};
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch (err) {
    console.error('[state] Could not save to localStorage.', err);
  }
}

function notify(fieldId) {
  listeners.forEach((fn) => fn({ fieldId, value: answers[fieldId] }));
}

export function get(fieldId) {
  return answers[fieldId];
}

export function set(fieldId, value) {
  answers[fieldId] = value;
  saveToStorage();
  notify(fieldId);
}

export function getAll() {
  return { ...answers };
}

export function reset() {
  answers = {};
  saveToStorage();
  listeners.forEach((fn) => fn({ fieldId: null, value: null }));
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
```

- [ ] **Step 2: Delete the js/.gitkeep placeholder**

Run:

```bash
rm js/.gitkeep
```

- [ ] **Step 3: Verify in browser console**

Open `http://localhost:8000`. In DevTools console:

```javascript
const state = await import('./js/state.js');
state.set('test-field', 42);
state.get('test-field');         // → 42
state.getAll();                  // → { 'test-field': 42 }
localStorage.getItem('nsf-herd-answers'); // → '{"test-field":42}'
state.reset();
state.getAll();                  // → {}
```

Then refresh the page and run `localStorage.getItem('nsf-herd-answers')` — should be `'{}'` or `null`.

- [ ] **Step 4: Commit**

```bash
git add js/state.js js/.gitkeep
git commit -m "Add state module with localStorage persistence"
```

---

## Task 9: Survey JSON schema with Q1

**Files:**
- Create: `data/survey.json`
- Delete: `data/.gitkeep`

- [ ] **Step 1: Create the initial survey data with Q1**

Create `data/survey.json`:

```json
{
  "title": "NSF HERD Survey — FY 2024",
  "sections": [
    {
      "id": "q1",
      "number": "Q1",
      "title": "R&D expenditures by source of funds",
      "intro": "How much of your total expenditures for research and development (R&D) came from the following sources in FY 2024? Report dollars in thousands.",
      "questions": [
        {
          "id": "q1-table",
          "type": "currency-table",
          "rows": [
            { "id": "q1-a", "label": "U.S. federal government" },
            { "id": "q1-b", "label": "State and local government" },
            { "id": "q1-c", "label": "Business" },
            { "id": "q1-d", "label": "Nonprofit organizations" },
            { "id": "q1-e1", "label": "Institutionally financed research", "confidential": true, "indent": 1 },
            { "id": "q1-e2", "label": "Cost sharing", "confidential": true, "indent": 1 },
            { "id": "q1-e3", "label": "Unrecovered indirect costs", "confidential": true, "indent": 1 },
            { "id": "q1-e4", "label": "Total institutional funds", "indent": 1, "computeAs": { "op": "sum", "fields": ["q1-e1", "q1-e2", "q1-e3"] } },
            { "id": "q1-f",  "label": "All other sources" },
            { "id": "q1-g",  "label": "Total", "computeAs": { "op": "sum", "fields": ["q1-a", "q1-b", "q1-c", "q1-d", "q1-e4", "q1-f"] } }
          ]
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Delete the data/.gitkeep placeholder**

Run:

```bash
rm data/.gitkeep
```

- [ ] **Step 3: Verify JSON parses correctly**

Run:

```bash
python3 -c "import json; print(json.load(open('data/survey.json'))['sections'][0]['title'])"
```

Expected output:

```
R&D expenditures by source of funds
```

- [ ] **Step 4: Commit**

```bash
git add data/survey.json data/.gitkeep
git commit -m "Add survey.json with Q1 structure"
```

---

## Task 10: Calc module (auto-totals)

**Files:**
- Create: `js/calc.js`

The calc module evaluates `computeAs` formulas. Initially supports `sum` (add specified field IDs).

- [ ] **Step 1: Create js/calc.js**

Create `js/calc.js`:

```javascript
import { get } from './state.js';

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function compute(formula) {
  if (!formula) return null;

  switch (formula.op) {
    case 'sum':
      return formula.fields.reduce((acc, fieldId) => acc + toNumber(get(fieldId)), 0);
    default:
      console.warn('[calc] Unknown formula op:', formula.op);
      return 0;
  }
}

export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '';
  const n = toNumber(value);
  return n.toLocaleString('en-US');
}

export function parseCurrency(value) {
  if (value === null || value === undefined || value === '') return '';
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  if (cleaned === '' || cleaned === '-') return '';
  return cleaned;
}
```

- [ ] **Step 2: Verify in browser console**

Reload. In DevTools console:

```javascript
const state = await import('./js/state.js');
const calc = await import('./js/calc.js');

state.set('a', '100');
state.set('b', '250');
calc.compute({ op: 'sum', fields: ['a', 'b'] });  // → 350
calc.formatCurrency(25342);                        // → "25,342"
calc.parseCurrency('$25,342');                     // → "25342"
calc.parseCurrency('');                            // → ""
state.reset();
```

- [ ] **Step 3: Commit**

```bash
git add js/calc.js
git commit -m "Add calc module for auto-totals and currency formatting"
```

---

## Task 11: Branching module (showIf)

**Files:**
- Create: `js/branching.js`

- [ ] **Step 1: Create js/branching.js**

Create `js/branching.js`:

```javascript
import { get } from './state.js';

export function shouldShow(showIf) {
  if (!showIf) return true;

  const actual = get(showIf.fieldId);

  if ('equals' in showIf) {
    return actual === showIf.equals;
  }

  if ('notEquals' in showIf) {
    return actual !== showIf.notEquals;
  }

  console.warn('[branching] Unsupported showIf condition:', showIf);
  return true;
}
```

- [ ] **Step 2: Verify in browser console**

Reload. In DevTools console:

```javascript
const state = await import('./js/state.js');
const branching = await import('./js/branching.js');

branching.shouldShow(null);                                         // → true (no condition)
branching.shouldShow({ fieldId: 'x', equals: 'yes' });              // → false (x is undefined)
state.set('x', 'yes');
branching.shouldShow({ fieldId: 'x', equals: 'yes' });              // → true
branching.shouldShow({ fieldId: 'x', notEquals: 'no' });            // → true
state.reset();
```

- [ ] **Step 3: Commit**

```bash
git add js/branching.js
git commit -m "Add branching module for showIf rules"
```

---

## Task 12: Render module — currency-table

**Files:**
- Create: `js/render.js`

The render module turns a section's question definitions into DOM. Initially handles `currency-table` only (Q1 shape). Other types added in later tasks.

- [ ] **Step 1: Create js/render.js**

Create `js/render.js`:

```javascript
import { get, set, onChange } from './state.js';
import { compute, formatCurrency, parseCurrency } from './calc.js';

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      node.setAttribute(key, value);
    }
  }
  for (const child of [].concat(children)) {
    if (child == null) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function renderCurrencyTable(question) {
  const table = el('table', { className: 'currency-table' });
  const tbody = el('tbody');

  for (const row of question.rows) {
    const tr = el('tr', { dataset: { fieldId: row.id } });
    if (row.indent) tr.classList.add('indent-' + row.indent);

    const labelCell = el('td', { className: 'currency-table-label' }, [
      row.label,
      row.confidential ? el('sup', { className: 'confidential-marker', title: 'Confidential' }, '★') : null
    ]);

    const inputCell = el('td', { className: 'currency-table-input' });

    if (row.computeAs) {
      const input = el('input', {
        type: 'text',
        className: 'currency-input',
        readonly: 'readonly',
        'data-field-id': row.id,
        value: formatCurrency(compute(row.computeAs))
      });
      inputCell.appendChild(el('span', { className: 'currency-field' }, [input]));
    } else {
      const stored = get(row.id);
      const input = el('input', {
        type: 'text',
        className: 'currency-input',
        inputmode: 'numeric',
        'data-field-id': row.id,
        value: stored !== undefined ? formatCurrency(stored) : ''
      });
      input.addEventListener('input', (e) => {
        const raw = parseCurrency(e.target.value);
        set(row.id, raw);
      });
      input.addEventListener('blur', (e) => {
        const raw = parseCurrency(e.target.value);
        e.target.value = formatCurrency(raw);
      });
      inputCell.appendChild(el('span', { className: 'currency-field' }, [input]));
    }

    tr.appendChild(labelCell);
    tr.appendChild(inputCell);
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  return table;
}

const RENDERERS = {
  'currency-table': renderCurrencyTable
};

export function renderSection(section, mountEl) {
  mountEl.innerHTML = '';

  const header = el('header', { className: 'section-header' }, [
    el('p', { className: 'section-number' }, section.number),
    el('h2', { className: 'section-title' }, section.title),
    section.intro ? el('p', { className: 'section-intro' }, section.intro) : null
  ]);
  mountEl.appendChild(header);

  for (const question of section.questions) {
    const renderer = RENDERERS[question.type];
    if (!renderer) {
      console.warn('[render] No renderer for type:', question.type);
      continue;
    }
    mountEl.appendChild(renderer(question));
  }
}

onChange(() => {
  document.querySelectorAll('[data-field-id]').forEach((input) => {
    if (!input.hasAttribute('readonly')) return;
    const fieldId = input.dataset.fieldId;
    const row = document.querySelector(`tr[data-field-id="${fieldId}"]`);
    if (!row) return;
    const formula = row._formula;
    if (formula) {
      input.value = formatCurrency(compute(formula));
    }
  });
});
```

Wait — the listener above can't access the formula because it's not stored. Replace the file's last block (the `onChange` listener and below) with a corrected version that stores formulas on the row element. Replace the entire body of `renderCurrencyTable` with this version that stores formulas, then update the listener:

Replace `renderCurrencyTable` with:

```javascript
function renderCurrencyTable(question) {
  const table = el('table', { className: 'currency-table' });
  const tbody = el('tbody');

  for (const row of question.rows) {
    const tr = el('tr', { dataset: { fieldId: row.id } });
    if (row.indent) tr.classList.add('indent-' + row.indent);
    if (row.computeAs) tr._formula = row.computeAs;

    const labelCell = el('td', { className: 'currency-table-label' }, [
      row.label,
      row.confidential ? el('sup', { className: 'confidential-marker', title: 'Confidential' }, '★') : null
    ]);

    const inputCell = el('td', { className: 'currency-table-input' });

    if (row.computeAs) {
      const input = el('input', {
        type: 'text',
        className: 'currency-input',
        readonly: 'readonly',
        'data-field-id': row.id,
        value: formatCurrency(compute(row.computeAs))
      });
      inputCell.appendChild(el('span', { className: 'currency-field' }, [input]));
    } else {
      const stored = get(row.id);
      const input = el('input', {
        type: 'text',
        className: 'currency-input',
        inputmode: 'numeric',
        'data-field-id': row.id,
        value: stored !== undefined && stored !== '' ? formatCurrency(stored) : ''
      });
      input.addEventListener('input', (e) => {
        const raw = parseCurrency(e.target.value);
        set(row.id, raw);
      });
      input.addEventListener('blur', (e) => {
        const raw = parseCurrency(e.target.value);
        e.target.value = formatCurrency(raw);
      });
      inputCell.appendChild(el('span', { className: 'currency-field' }, [input]));
    }

    tr.appendChild(labelCell);
    tr.appendChild(inputCell);
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  return table;
}
```

- [ ] **Step 2: Add CSS for the currency table**

Append to `css/components.css`:

```css
/* === Currency table === */

.section-header {
  margin-bottom: var(--space-5);
}

.section-number {
  margin: 0 0 var(--space-1) 0;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-info);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.section-title {
  margin: 0 0 var(--space-2) 0;
}

.section-intro {
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}

.currency-table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--color-surface);
}

.currency-table td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-input-border);
  vertical-align: middle;
}

.currency-table tr.indent-1 td:first-child {
  padding-left: var(--space-8);
}

.currency-table-label {
  color: var(--color-text);
}

.currency-table-input {
  text-align: right;
  width: 12rem;
}

.confidential-marker {
  margin-left: var(--space-1);
  color: var(--color-warning);
  font-size: var(--text-xs);
}
```

- [ ] **Step 3: Commit**

```bash
git add js/render.js css/components.css
git commit -m "Add render module with currency-table renderer"
```

(Verification happens in Task 13 when `app.js` ties it all together.)

---

## Task 13: Sections module + side nav rendering

**Files:**
- Create: `js/sections.js`

The sections module manages active-section state, renders the side nav from JSON, and handles jump-to-section clicks.

- [ ] **Step 1: Create js/sections.js**

Create `js/sections.js`:

```javascript
import { getAll, onChange } from './state.js';

let surveyData = null;
let activeSectionId = null;
const listeners = new Set();

export function init(data) {
  surveyData = data;
  if (!activeSectionId && data.sections.length > 0) {
    activeSectionId = data.sections[0].id;
  }
}

export function getActiveSection() {
  if (!surveyData) return null;
  return surveyData.sections.find((s) => s.id === activeSectionId) || null;
}

export function setActiveSection(sectionId) {
  if (!surveyData) return;
  const found = surveyData.sections.find((s) => s.id === sectionId);
  if (!found) return;
  activeSectionId = sectionId;
  listeners.forEach((fn) => fn(found));
}

export function onActiveSectionChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSectionStatus(section) {
  const answers = getAll();
  const fieldIds = collectFieldIds(section);
  if (fieldIds.length === 0) return 'not-started';

  const filled = fieldIds.filter((id) => {
    const v = answers[id];
    return v !== undefined && v !== '' && v !== null;
  }).length;

  if (filled === 0) return 'not-started';
  if (filled === fieldIds.length) return 'complete';
  return 'in-progress';
}

function collectFieldIds(section) {
  const ids = [];
  for (const question of section.questions) {
    if (question.type === 'currency-table') {
      for (const row of question.rows) {
        if (!row.computeAs) ids.push(row.id);
      }
    }
    // Other question types added in later tasks
  }
  return ids;
}

export function renderSideNav(listEl) {
  if (!surveyData) return;
  listEl.innerHTML = '';

  for (const section of surveyData.sections) {
    const status = getSectionStatus(section);
    const isActive = section.id === activeSectionId;

    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'side-nav-item';
    if (isActive) button.setAttribute('aria-current', 'true');
    button.dataset.sectionId = section.id;
    button.innerHTML = `
      <span class="side-nav-status" data-status="${status}" aria-label="${status}"></span>
      <span class="side-nav-number">${section.number}</span>
      <span class="side-nav-label">${section.title}</span>
    `;
    button.addEventListener('click', () => setActiveSection(section.id));
    li.appendChild(button);
    listEl.appendChild(li);
  }
}

export function renderStatusPane(statusEl) {
  if (!surveyData) return;
  const total = surveyData.sections.length;
  const complete = surveyData.sections.filter((s) => getSectionStatus(s) === 'complete').length;
  const pct = total > 0 ? (complete / total) * 100 : 0;

  statusEl.innerHTML = `
    <div class="status-pane">
      <span class="status-pane-label">Overall progress</span>
      <div class="status-pane-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${complete}">
        <div class="status-pane-fill" style="width: ${pct}%;"></div>
      </div>
      <span class="status-pane-count">${complete} of ${total} complete</span>
    </div>
  `;
}

// Re-render side nav and status pane on any state change
onChange(() => {
  const navEl = document.getElementById('side-nav-list');
  const statusEl = document.getElementById('app-status');
  if (navEl) renderSideNav(navEl);
  if (statusEl) renderStatusPane(statusEl);
});
```

- [ ] **Step 2: Commit**

```bash
git add js/sections.js
git commit -m "Add sections module with side nav and status pane rendering"
```

(Verification in Task 14.)

---

## Task 14: App entry point + remove demo content

**Files:**
- Create: `js/app.js`
- Modify: `index.html` (remove demo content, load app.js, remove temporary script)

- [ ] **Step 1: Create js/app.js**

Create `js/app.js`:

```javascript
import * as sections from './sections.js';
import { renderSection } from './render.js';

async function loadSurvey() {
  const res = await fetch('data/survey.json');
  if (!res.ok) {
    throw new Error(`Failed to load survey.json: HTTP ${res.status}`);
  }
  return res.json();
}

function showError(message) {
  const main = document.getElementById('app-main');
  if (main) {
    main.innerHTML = `<p class="error-message">${message}</p>`;
  }
}

function mount() {
  const navEl = document.getElementById('side-nav-list');
  const mainEl = document.getElementById('app-main');
  const statusEl = document.getElementById('app-status');

  sections.renderSideNav(navEl);
  sections.renderStatusPane(statusEl);

  const renderActive = () => {
    const active = sections.getActiveSection();
    if (active) renderSection(active, mainEl);
  };

  sections.onActiveSectionChange(renderActive);
  renderActive();
}

async function start() {
  try {
    const data = await loadSurvey();
    sections.init(data);
    mount();
  } catch (err) {
    console.error(err);
    showError('Survey could not be loaded. Please refresh the page.');
  }
}

start();
```

- [ ] **Step 2: Replace `index.html` body with the production shell + app.js script**

Replace the full contents of `index.html` with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NSF HERD Survey — FY 2024</title>
  <link rel="stylesheet" href="css/tokens.css" />
  <link rel="stylesheet" href="css/base.css" />
  <link rel="stylesheet" href="css/layout.css" />
  <link rel="stylesheet" href="css/components.css" />
</head>
<body>
  <div class="app">
    <header class="app-header">
      <h1 class="app-title">NSF HERD Survey — FY 2024</h1>
    </header>

    <nav class="app-side-nav" aria-label="Survey sections">
      <ol class="side-nav-list" id="side-nav-list"></ol>
    </nav>

    <main class="app-main" id="app-main">
      <p>Loading…</p>
    </main>

    <div class="app-status" id="app-status"></div>
  </div>

  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 3: Add the error-message style to components.css**

Append to `css/components.css`:

```css
.error-message {
  padding: var(--space-4);
  background-color: var(--color-error-bg);
  color: var(--color-error);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
}
```

- [ ] **Step 4: Verify in browser**

Reload `http://localhost:8000`. Expected:
- Side nav shows one item: empty-circle status + "Q1" + "R&D expenditures by source of funds"
- Main area shows the Q1 section header, intro paragraph, and a currency-input table with 10 rows
- Rows e1, e2, e3, e4 are indented; rows e1, e2, e3 have a small star (confidential marker)
- Rows e4 ("Total institutional funds") and g ("Total") are read-only (gray background)
- Type `100` into "U.S. federal government" row → tab away → input shows `100`; the "Total" row at the bottom updates to `100`
- Type `250` into "State and local government" row → Total updates to `350`
- Type `1000` into row e1 → Total institutional funds (e4) becomes `1,000`, Total (g) becomes `1,350`
- Side nav Q1 status badge changes from gray empty to amber "…" (in-progress)
- Status pane shows the progress bar (likely still 0/1 complete unless every field is filled)
- Refresh the page → values persist

- [ ] **Step 5: Commit**

```bash
git add js/app.js index.html css/components.css
git commit -m "Wire up app entry, side nav, and Q1 rendering"
```

---

## Task 15: Yes/No question type + Q4 with branching

**Files:**
- Modify: `js/render.js` (add yes-no and currency single-field renderers)
- Modify: `js/sections.js` (collect field IDs for yes-no and currency types)
- Modify: `data/survey.json` (add Q4)
- Modify: `css/components.css` (add radio + currency-single styles)

- [ ] **Step 1: Add radio styles to components.css**

Append to `css/components.css`:

```css
/* === Radio group === */

.radio-group {
  display: flex;
  gap: var(--space-4);
  margin: var(--space-2) 0 var(--space-4) 0;
}

.radio-option {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: var(--text-base);
}

.radio-option input[type="radio"] {
  margin: 0;
}

/* === Standalone currency field === */

.currency-standalone {
  margin: var(--space-2) 0 var(--space-4) 0;
}
```

- [ ] **Step 2: Update js/render.js to handle yes-no and standalone currency**

Add these renderers above the `RENDERERS` const in `js/render.js`:

```javascript
import { shouldShow } from './branching.js';

function renderYesNo(question) {
  const wrapper = el('div', { className: 'field', dataset: { fieldId: question.id } });
  const label = el('p', { className: 'field-label' }, question.label);
  const group = el('div', { className: 'radio-group' });

  for (const opt of [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]) {
    const id = `${question.id}-${opt.value}`;
    const input = el('input', {
      type: 'radio',
      name: question.id,
      value: opt.value,
      id
    });
    if (get(question.id) === opt.value) input.setAttribute('checked', 'checked');
    input.addEventListener('change', () => set(question.id, opt.value));

    const optLabel = el('label', { className: 'radio-option', for: id }, [input, opt.label]);
    group.appendChild(optLabel);
  }

  wrapper.appendChild(label);
  wrapper.appendChild(group);
  return wrapper;
}

function renderCurrencySingle(question) {
  const wrapper = el('div', {
    className: 'field currency-standalone',
    dataset: { fieldId: question.id }
  });
  wrapper.appendChild(el('label', { className: 'field-label', for: question.id }, question.label));

  const stored = get(question.id);
  const input = el('input', {
    type: 'text',
    id: question.id,
    className: 'currency-input',
    inputmode: 'numeric',
    'data-field-id': question.id,
    value: stored !== undefined && stored !== '' ? formatCurrency(stored) : ''
  });
  input.addEventListener('input', (e) => set(question.id, parseCurrency(e.target.value)));
  input.addEventListener('blur', (e) => {
    e.target.value = formatCurrency(parseCurrency(e.target.value));
  });

  wrapper.appendChild(el('span', { className: 'currency-field' }, [input]));
  return wrapper;
}
```

Update the `RENDERERS` object:

```javascript
const RENDERERS = {
  'currency-table': renderCurrencyTable,
  'yes-no': renderYesNo,
  'currency': renderCurrencySingle
};
```

Update `renderSection` to skip questions whose `showIf` is false. Replace the existing `renderSection` function with:

```javascript
export function renderSection(section, mountEl) {
  mountEl.innerHTML = '';

  const header = el('header', { className: 'section-header' }, [
    el('p', { className: 'section-number' }, section.number),
    el('h2', { className: 'section-title' }, section.title),
    section.intro ? el('p', { className: 'section-intro' }, section.intro) : null
  ]);
  mountEl.appendChild(header);

  for (const question of section.questions) {
    if (!shouldShow(question.showIf)) continue;
    const renderer = RENDERERS[question.type];
    if (!renderer) {
      console.warn('[render] No renderer for type:', question.type);
      continue;
    }
    mountEl.appendChild(renderer(question));
  }
}
```

Add a re-render on state change so branching reveals/hides questions live. Append to the bottom of `js/render.js`:

```javascript
let lastSection = null;
let lastMount = null;

const _originalRenderSection = renderSection;
export function renderSectionMemoed(section, mountEl) {
  lastSection = section;
  lastMount = mountEl;
  _originalRenderSection(section, mountEl);
}

// Note: state.onChange already updates read-only totals via direct DOM updates;
// for branching we need a full re-render of the section.
onChange(({ fieldId }) => {
  if (!lastSection || !lastMount) return;
  // Re-render if the changed field is referenced by any showIf in this section
  const anyShowIfReferences = lastSection.questions.some(
    (q) => q.showIf && q.showIf.fieldId === fieldId
  );
  if (anyShowIfReferences) {
    _originalRenderSection(lastSection, lastMount);
  }
});
```

Wait — exporting both `renderSection` and `renderSectionMemoed` is messy. Simplify by replacing the bottom of the file. Replace the section starting at `let lastSection = null;` to the end of file with this cleaner version:

Delete everything from `let lastSection = null;` down. Then replace the export of `renderSection` with this version that handles memoization internally:

```javascript
let lastSection = null;
let lastMount = null;

export function renderSection(section, mountEl) {
  lastSection = section;
  lastMount = mountEl;
  doRender(section, mountEl);
}

function doRender(section, mountEl) {
  mountEl.innerHTML = '';

  const header = el('header', { className: 'section-header' }, [
    el('p', { className: 'section-number' }, section.number),
    el('h2', { className: 'section-title' }, section.title),
    section.intro ? el('p', { className: 'section-intro' }, section.intro) : null
  ]);
  mountEl.appendChild(header);

  for (const question of section.questions) {
    if (!shouldShow(question.showIf)) continue;
    const renderer = RENDERERS[question.type];
    if (!renderer) {
      console.warn('[render] No renderer for type:', question.type);
      continue;
    }
    mountEl.appendChild(renderer(question));
  }
}

onChange(({ fieldId }) => {
  // Update read-only computed cells in the current section
  document.querySelectorAll('tr[data-field-id]').forEach((tr) => {
    const formula = tr._formula;
    if (!formula) return;
    const input = tr.querySelector('input[readonly]');
    if (input) input.value = formatCurrency(compute(formula));
  });

  // Re-render section if any showIf references the changed field
  if (!lastSection || !lastMount) return;
  const anyShowIfReferences = lastSection.questions.some(
    (q) => q.showIf && q.showIf.fieldId === fieldId
  );
  if (anyShowIfReferences) {
    doRender(lastSection, lastMount);
  }
});
```

Also: the prior version of `renderSection` had a separate `onChange` block. Delete it — the one above replaces it. The final structure of `js/render.js` should be: imports → `el()` → `renderCurrencyTable` → `renderYesNo` → `renderCurrencySingle` → `RENDERERS` → `renderSection` (exported) → `doRender` → `onChange` listener.

- [ ] **Step 3: Update js/sections.js `collectFieldIds` to count yes-no and currency**

Replace the `collectFieldIds` function in `js/sections.js` with:

```javascript
function collectFieldIds(section) {
  const ids = [];
  for (const question of section.questions) {
    if (question.type === 'currency-table') {
      for (const row of question.rows) {
        if (!row.computeAs) ids.push(row.id);
      }
    } else if (question.type === 'yes-no' || question.type === 'currency') {
      ids.push(question.id);
    }
  }
  return ids;
}
```

- [ ] **Step 4: Add Q4 to data/survey.json**

Replace `data/survey.json` with this version that adds Q4 after Q1:

```json
{
  "title": "NSF HERD Survey — FY 2024",
  "sections": [
    {
      "id": "q1",
      "number": "Q1",
      "title": "R&D expenditures by source of funds",
      "intro": "How much of your total expenditures for research and development (R&D) came from the following sources in FY 2024? Report dollars in thousands.",
      "questions": [
        {
          "id": "q1-table",
          "type": "currency-table",
          "rows": [
            { "id": "q1-a", "label": "U.S. federal government" },
            { "id": "q1-b", "label": "State and local government" },
            { "id": "q1-c", "label": "Business" },
            { "id": "q1-d", "label": "Nonprofit organizations" },
            { "id": "q1-e1", "label": "Institutionally financed research", "confidential": true, "indent": 1 },
            { "id": "q1-e2", "label": "Cost sharing", "confidential": true, "indent": 1 },
            { "id": "q1-e3", "label": "Unrecovered indirect costs", "confidential": true, "indent": 1 },
            { "id": "q1-e4", "label": "Total institutional funds", "indent": 1, "computeAs": { "op": "sum", "fields": ["q1-e1", "q1-e2", "q1-e3"] } },
            { "id": "q1-f",  "label": "All other sources" },
            { "id": "q1-g",  "label": "Total", "computeAs": { "op": "sum", "fields": ["q1-a", "q1-b", "q1-c", "q1-d", "q1-e4", "q1-f"] } }
          ]
        }
      ]
    },
    {
      "id": "q4",
      "number": "Q4",
      "title": "Medical school R&D",
      "intro": "Did your institution have a medical school in FY 2024?",
      "questions": [
        {
          "id": "q4-a",
          "type": "yes-no",
          "label": "Did your institution have a medical school (one awarding the MD or DO degree) in FY 2024?"
        },
        {
          "id": "q4-b",
          "type": "currency",
          "label": "Total R&D expenditures in the university's medical school (dollars in thousands)",
          "showIf": { "fieldId": "q4-a", "equals": "yes" }
        }
      ]
    }
  ]
}
```

- [ ] **Step 5: Verify in browser**

Reload. Expected:
- Side nav now shows two items: Q1 and Q4
- Click Q4 → main area shows "Q4 Medical school R&D" with the Yes/No radio
- Q4 has no currency input visible yet
- Click "Yes" → currency input appears below
- Click "No" → currency input disappears
- Type a value into the currency input, click "Yes" again → value persists (since state is keyed by field ID)
- Side nav Q4 status: changes to in-progress after selecting Yes/No
- Refresh → Q4 state persists

- [ ] **Step 6: Commit**

```bash
git add js/render.js js/sections.js data/survey.json css/components.css
git commit -m "Add yes-no and currency renderers; add Q4 branching demo"
```

---

## Task 16: Currency-matrix renderer (stub)

**Files:**
- Create: `js/matrix.js`
- Modify: `js/render.js` (delegate to matrix.js)
- Modify: `js/sections.js` (count matrix field IDs)
- Modify: `data/survey.json` (add a small demo matrix section)
- Modify: `css/components.css` (matrix styles)

This task introduces the matrix renderer with a tiny 2-row × 3-column demo. The full Q9 / Q11 / Q14 matrices (40 R&D fields × 7 agencies) are added later when the user provides them.

- [ ] **Step 1: Add matrix styles to components.css**

Append to `css/components.css`:

```css
/* === Currency matrix === */

.matrix-wrapper {
  overflow-x: auto;
  margin-bottom: var(--space-4);
}

.currency-matrix {
  border-collapse: collapse;
  background-color: var(--color-surface);
  font-size: var(--text-sm);
}

.currency-matrix th,
.currency-matrix td {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-input-border);
  text-align: right;
  vertical-align: middle;
}

.currency-matrix th {
  background-color: var(--color-section-header);
  font-weight: 600;
  text-align: center;
  font-size: var(--text-xs);
}

.currency-matrix td.matrix-row-label {
  text-align: left;
  white-space: nowrap;
  background-color: var(--color-nav-bg);
  font-weight: 500;
}

.currency-matrix .currency-input {
  width: 6rem;
  font-size: var(--text-sm);
}

.currency-matrix tr.matrix-subtotal td {
  background-color: var(--color-info-bg);
  font-weight: 600;
}

.currency-matrix tr.matrix-grand-total td {
  background-color: var(--color-section-header-parent);
  color: var(--color-surface);
  font-weight: 600;
}

.currency-matrix tr.matrix-grand-total .currency-input {
  background-color: var(--color-section-header-parent);
  color: var(--color-surface);
  border-color: var(--color-section-header-parent);
}
```

- [ ] **Step 2: Create js/matrix.js**

Create `js/matrix.js`:

```javascript
import { get, set } from './state.js';
import { compute, formatCurrency, parseCurrency } from './calc.js';

function cellId(rowId, colId) {
  return `${rowId}__${colId}`;
}

function makeInput(fieldId, readonly) {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'currency-input';
  input.dataset.fieldId = fieldId;
  if (readonly) {
    input.setAttribute('readonly', 'readonly');
  } else {
    input.setAttribute('inputmode', 'numeric');
    input.addEventListener('input', (e) => set(fieldId, parseCurrency(e.target.value)));
    input.addEventListener('blur', (e) => {
      e.target.value = formatCurrency(parseCurrency(e.target.value));
    });
  }
  const stored = get(fieldId);
  input.value = stored !== undefined && stored !== '' ? formatCurrency(stored) : '';
  return input;
}

function renderHeaderRow(columns) {
  const tr = document.createElement('tr');
  tr.appendChild(document.createElement('th'));
  for (const col of columns) {
    const th = document.createElement('th');
    th.textContent = col.label;
    tr.appendChild(th);
  }
  return tr;
}

function renderDataRow(row, columns) {
  const tr = document.createElement('tr');
  tr.dataset.rowId = row.id;

  const labelTd = document.createElement('td');
  labelTd.className = 'matrix-row-label';
  labelTd.textContent = row.label;
  tr.appendChild(labelTd);

  for (const col of columns) {
    const td = document.createElement('td');
    const isComputed = col.computeAs === 'rowSum';
    if (isComputed) {
      const cellFieldId = cellId(row.id, col.id);
      const input = makeInput(cellFieldId, true);
      // Store the formula on the cell so the global onChange can recompute
      td._rowSumOf = columns.filter((c) => c.computeAs !== 'rowSum').map((c) => cellId(row.id, c.id));
      td._fieldId = cellFieldId;
      input.value = formatCurrency(td._rowSumOf.reduce((acc, fid) => acc + Number(get(fid) || 0), 0));
      td.appendChild(input);
    } else {
      td.appendChild(makeInput(cellId(row.id, col.id), false));
    }
    tr.appendChild(td);
  }

  return tr;
}

function renderSubtotalRow(rows, columns, subtotalRow) {
  const tr = document.createElement('tr');
  tr.className = 'matrix-subtotal';
  tr.dataset.subtotal = 'true';

  const labelTd = document.createElement('td');
  labelTd.className = 'matrix-row-label';
  labelTd.textContent = subtotalRow.label;
  tr.appendChild(labelTd);

  for (const col of columns) {
    const td = document.createElement('td');
    const cellFieldId = cellId(subtotalRow.id, col.id);
    const input = makeInput(cellFieldId, true);

    const isGrandRowSum = col.computeAs === 'rowSum';
    if (isGrandRowSum) {
      td._formula = {
        op: 'sumOfCells',
        cells: rows.flatMap((r) =>
          columns.filter((c) => c.computeAs !== 'rowSum').map((c) => cellId(r.id, c.id))
        )
      };
    } else {
      td._formula = { op: 'sumOfCells', cells: rows.map((r) => cellId(r.id, col.id)) };
    }

    td._fieldId = cellFieldId;
    input.value = formatCurrency(td._formula.cells.reduce((acc, fid) => acc + Number(get(fid) || 0), 0));
    td.appendChild(input);
    tr.appendChild(td);
  }

  return tr;
}

export function renderMatrix(question) {
  const wrapper = document.createElement('div');
  wrapper.className = 'matrix-wrapper';

  const table = document.createElement('table');
  table.className = 'currency-matrix';

  const thead = document.createElement('thead');
  thead.appendChild(renderHeaderRow(question.columns));
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  const allRows = [];

  for (const group of question.rowGroups || []) {
    for (const row of group.rows) {
      tbody.appendChild(renderDataRow(row, question.columns));
      allRows.push(row);
    }
    if (group.subtotalRow) {
      tbody.appendChild(renderSubtotalRow(group.rows, question.columns, group.subtotalRow));
    }
  }

  if (question.totalRow) {
    tbody.appendChild(renderSubtotalRow(allRows, question.columns, question.totalRow));
    tbody.lastElementChild.classList.remove('matrix-subtotal');
    tbody.lastElementChild.classList.add('matrix-grand-total');
  }

  table.appendChild(tbody);
  wrapper.appendChild(table);
  return wrapper;
}

export function recomputeAllMatrixCells() {
  document.querySelectorAll('.currency-matrix td').forEach((td) => {
    const formula = td._formula;
    const rowSumOf = td._rowSumOf;
    const input = td.querySelector('input[readonly]');
    if (!input) return;

    if (formula && formula.op === 'sumOfCells') {
      const sum = formula.cells.reduce((acc, fid) => acc + Number(get(fid) || 0), 0);
      input.value = formatCurrency(sum);
    } else if (rowSumOf) {
      const sum = rowSumOf.reduce((acc, fid) => acc + Number(get(fid) || 0), 0);
      input.value = formatCurrency(sum);
    }
  });
}
```

- [ ] **Step 3: Update render.js to delegate currency-matrix to matrix.js**

In `js/render.js`, add this import at the top with the other imports:

```javascript
import { renderMatrix, recomputeAllMatrixCells } from './matrix.js';
```

Add to the `RENDERERS` object:

```javascript
const RENDERERS = {
  'currency-table': renderCurrencyTable,
  'yes-no': renderYesNo,
  'currency': renderCurrencySingle,
  'currency-matrix': renderMatrix
};
```

Update the `onChange` listener at the bottom of `js/render.js` to also call `recomputeAllMatrixCells()`. Replace the existing `onChange` listener with:

```javascript
onChange(({ fieldId }) => {
  // Update read-only computed cells in currency-tables
  document.querySelectorAll('tr[data-field-id]').forEach((tr) => {
    const formula = tr._formula;
    if (!formula) return;
    const input = tr.querySelector('input[readonly]');
    if (input) input.value = formatCurrency(compute(formula));
  });

  // Update read-only computed cells in matrices
  recomputeAllMatrixCells();

  // Re-render section if any showIf references the changed field
  if (!lastSection || !lastMount) return;
  const anyShowIfReferences = lastSection.questions.some(
    (q) => q.showIf && q.showIf.fieldId === fieldId
  );
  if (anyShowIfReferences) {
    doRender(lastSection, lastMount);
  }
});
```

- [ ] **Step 4: Update sections.js to count matrix fields toward completion**

Replace `collectFieldIds` in `js/sections.js` with:

```javascript
function collectFieldIds(section) {
  const ids = [];
  for (const question of section.questions) {
    if (question.type === 'currency-table') {
      for (const row of question.rows) {
        if (!row.computeAs) ids.push(row.id);
      }
    } else if (question.type === 'yes-no' || question.type === 'currency') {
      ids.push(question.id);
    } else if (question.type === 'currency-matrix') {
      const dataCols = (question.columns || []).filter((c) => c.computeAs !== 'rowSum');
      const dataRows = (question.rowGroups || []).flatMap((g) => g.rows);
      for (const row of dataRows) {
        for (const col of dataCols) {
          ids.push(`${row.id}__${col.id}`);
        }
      }
    }
  }
  return ids;
}
```

- [ ] **Step 5: Add a small demo matrix section to data/survey.json**

Replace the `sections` array contents to append a third section. The full file becomes:

```json
{
  "title": "NSF HERD Survey — FY 2024",
  "sections": [
    {
      "id": "q1",
      "number": "Q1",
      "title": "R&D expenditures by source of funds",
      "intro": "How much of your total expenditures for research and development (R&D) came from the following sources in FY 2024? Report dollars in thousands.",
      "questions": [
        {
          "id": "q1-table",
          "type": "currency-table",
          "rows": [
            { "id": "q1-a", "label": "U.S. federal government" },
            { "id": "q1-b", "label": "State and local government" },
            { "id": "q1-c", "label": "Business" },
            { "id": "q1-d", "label": "Nonprofit organizations" },
            { "id": "q1-e1", "label": "Institutionally financed research", "confidential": true, "indent": 1 },
            { "id": "q1-e2", "label": "Cost sharing", "confidential": true, "indent": 1 },
            { "id": "q1-e3", "label": "Unrecovered indirect costs", "confidential": true, "indent": 1 },
            { "id": "q1-e4", "label": "Total institutional funds", "indent": 1, "computeAs": { "op": "sum", "fields": ["q1-e1", "q1-e2", "q1-e3"] } },
            { "id": "q1-f",  "label": "All other sources" },
            { "id": "q1-g",  "label": "Total", "computeAs": { "op": "sum", "fields": ["q1-a", "q1-b", "q1-c", "q1-d", "q1-e4", "q1-f"] } }
          ]
        }
      ]
    },
    {
      "id": "q4",
      "number": "Q4",
      "title": "Medical school R&D",
      "intro": "Did your institution have a medical school in FY 2024?",
      "questions": [
        {
          "id": "q4-a",
          "type": "yes-no",
          "label": "Did your institution have a medical school (one awarding the MD or DO degree) in FY 2024?"
        },
        {
          "id": "q4-b",
          "type": "currency",
          "label": "Total R&D expenditures in the university's medical school (dollars in thousands)",
          "showIf": { "fieldId": "q4-a", "equals": "yes" }
        }
      ]
    },
    {
      "id": "q9-demo",
      "number": "Q9 (demo)",
      "title": "Federal R&D by field — Computer Sciences (demo subset)",
      "intro": "This is a small demonstration of the matrix renderer. The real Q9 covers 40 R&D fields × 7 federal agencies and is added incrementally.",
      "questions": [
        {
          "id": "q9-demo-matrix",
          "type": "currency-matrix",
          "columns": [
            { "id": "usda",  "label": "USDA" },
            { "id": "dod",   "label": "DoD" },
            { "id": "nsf",   "label": "NSF" },
            { "id": "total", "label": "Total", "computeAs": "rowSum" }
          ],
          "rowGroups": [
            {
              "label": "A. Computer and Information Sciences",
              "rows": [
                { "id": "q9d-cs", "label": "Computer and Information Sciences" }
              ]
            },
            {
              "label": "B. Engineering",
              "rows": [
                { "id": "q9d-aero", "label": "Aerospace, Aeronautical, and Astronautical" },
                { "id": "q9d-bio",  "label": "Bioengineering and Biomedical" }
              ],
              "subtotalRow": { "id": "q9d-eng-total", "label": "Engineering total" }
            }
          ],
          "totalRow": { "id": "q9d-grand-total", "label": "Total for all demo fields" }
        }
      ]
    }
  ]
}
```

- [ ] **Step 6: Verify in browser**

Reload. Expected:
- Side nav now has three items: Q1, Q4, "Q9 (demo)"
- Click "Q9 (demo)" → main area shows a 4-column matrix (USDA, DoD, NSF, Total) with:
  - Row 1: Computer and Information Sciences (1 row in group A)
  - Row 2: Aerospace
  - Row 3: Bioengineering
  - Row 4: Engineering total (subtotal — light blue background)
  - Row 5: Total for all demo fields (grand total — dark background, white text)
- Type `100` in the USDA cell of the Aerospace row → its row Total cell updates to `100`
- The Engineering total cell for the USDA column also updates to `100`
- The grand total updates as well
- Refresh → values persist

- [ ] **Step 7: Commit**

```bash
git add js/matrix.js js/render.js js/sections.js data/survey.json css/components.css
git commit -m "Add currency-matrix renderer with row/column subtotals and demo section"
```

---

## Task 17: Reset button + section navigation polish

**Files:**
- Modify: `index.html` (add reset button)
- Modify: `css/layout.css` (header right-aligned button slot)
- Modify: `js/app.js` (wire reset)

- [ ] **Step 1: Add reset button to the header in index.html**

Replace the `<header class="app-header">` block with:

```html
    <header class="app-header">
      <h1 class="app-title">NSF HERD Survey — FY 2024</h1>
      <div class="app-header-actions">
        <button class="btn btn-secondary" id="reset-btn" type="button">Reset answers</button>
      </div>
    </header>
```

- [ ] **Step 2: Adjust app-header layout in layout.css**

Replace the `.app-header` and `.app-title` rules in `css/layout.css` with:

```css
.app-header {
  grid-area: header;
  background-color: var(--color-section-header-parent);
  color: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
}

.app-title {
  margin: 0;
  font-size: var(--text-lg);
  color: var(--color-surface);
  font-weight: 600;
}

.app-header-actions {
  display: flex;
  gap: var(--space-2);
}
```

- [ ] **Step 3: Wire reset in app.js**

Add this inside the `mount()` function in `js/app.js`, just before the closing brace (after `renderActive();`):

```javascript
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Clear all answers? This cannot be undone.')) {
        import('./state.js').then((state) => {
          state.reset();
          renderActive();
        });
      }
    });
  }
```

- [ ] **Step 4: Verify in browser**

Reload. Expected:
- Reset button in the top-right of the dark header
- Fill in some Q1 values, click Reset, confirm dialog
- All values clear; side nav statuses reset to gray (not started)
- Progress bar at bottom returns to 0
- Refresh → still empty

- [ ] **Step 5: Commit**

```bash
git add index.html css/layout.css js/app.js
git commit -m "Add reset button to header"
```

---

## Task 18: Final verification + deploy

**Files:** none modified; verification and push only.

- [ ] **Step 1: Walk through the full prototype locally**

Run through every flow on `http://localhost:8000`:

- Q1: fill in `q1-a` through `q1-f`, verify Total (q1-g) sums correctly
- Q1: fill in `q1-e1`, `q1-e2`, `q1-e3` and verify q1-e4 (Total institutional funds) updates, which in turn updates q1-g
- Q4: select Yes → currency input reveals → fill in a value → select No → input disappears (value preserved if Yes selected again)
- Q9 (demo): fill cells; verify row totals, the Engineering subtotal, and the grand total all update live
- Side nav: status indicators update from gray → amber → green as fields are filled
- Top status pane: count updates as sections become complete
- Refresh page: all values persist
- Reset: clears everything

- [ ] **Step 2: Check for console errors**

In DevTools console, verify no red errors. Warnings are OK.

- [ ] **Step 3: Push to GitHub for Vercel deploy**

Run:

```bash
git push origin main
```

- [ ] **Step 4: Verify Vercel deploy**

Visit `https://nsf-herd.vercel.app/` (wait ~30 seconds for Vercel to redeploy after the push). Expected:
- The full app loads with the same behavior as local
- Side nav, main area, status pane all visible
- No console errors

If Vercel returns 404, check the Vercel dashboard for build status. For a static site, no build is needed but Vercel may need 30–60 seconds to detect new files.

- [ ] **Step 5: Final summary commit (optional, for completion marker)**

If desired, add a `CHANGELOG.md` or simply leave the history as-is. No commit required for this step.

---

## What this plan does NOT cover

The user will provide question content for these as the framework matures. The framework is ready to accept them without changes (though additional question type renderers may be needed):

- **Q2, Q3** — additional currency-tables (already supported by the renderer)
- **Q5** — another yes-no + conditional currency-matrix (yes-no already supported; nothing new)
- **Q6, Q7, Q8** — small currency matrices (already supported)
- **Full Q9, Q11, Q14** — large matrices with 40 fields × 7/5/3 columns (already supported; just larger JSON)
- **Q10** — text inputs + currency rows (`text` type renderer not yet implemented)
- **Q12** — currency-table with mixed indents (already supported)
- **Q13** — two standalone currency inputs (already supported)
- **Q15** — headcount-matrix (similar to currency-matrix but integer values; minor variant)
- **Q16** — small headcount table
- **Q17** — select / month picker (new renderer needed)
- **Primary + Other Contacts** — text/email inputs (new `text` and `email` renderers needed)
- **"Should match" cross-question hints** — not yet wired up; calc.js can be extended

Add these one renderer/section at a time as needed.

---

## Self-review checklist (executed before plan was saved)

- ✓ Every task ends with a verification step and a commit
- ✓ All file paths are exact; no "appropriate" or "similar to" vagueness
- ✓ Complete code in every step that changes code (no `// ...` ellipses inside CSS or JS bodies)
- ✓ Types/names are consistent across tasks: `state.set()`, `state.get()`, `state.onChange()`, `calc.compute()`, `branching.shouldShow()`, `sections.renderSideNav()` — all match between Task 8 (definition) and Tasks 13-17 (usage)
- ✓ Schema in Task 9 (`computeAs: { op: "sum", fields: [...] }`) matches what `calc.compute()` expects in Task 10
- ✓ Matrix `computeAs: "rowSum"` shorthand is documented in Task 16
- ✓ Spec coverage: side nav with status (Task 6, 13), top status pane (Task 7, 13), accordion behavior (Task 5, used implicitly through section-by-section nav), currency-table (Task 12), currency-matrix (Task 16), yes-no branching (Task 15), localStorage persistence (Task 8), token-based CSS (Task 1)
- ✓ Visual reference colors from styles doc applied in Task 1 tokens
- ✓ Plan stops at the framework; remaining survey questions are explicitly out of scope and listed
