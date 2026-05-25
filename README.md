# NSF-HERD Survey Prototype

A front-end prototype of the NSF HERD (Higher Education Research and Development) survey. Built as static HTML/CSS/JS for handoff to a developer team who will rebuild it in their own back-end environment.

## Purpose

This prototype simulates the full survey experience end-to-end:

- 17 sections presented as a sectioned form with a persistent side nav and accordion drawers
- Top status pane showing overall progress; side nav shows per-section completion
- Light conditional branching (Q4 medical school, Q5 clinical trials, Q10 agency listing)
- Dominant pattern: currency inputs in tables and large matrices (R&D fields × federal agencies) with live auto-totals
- Cross-question "should match" hints when sums diverge
- Answers persist via `localStorage` (simulated; real persistence is for the dev team)
- "Submit" simulates success without sending data anywhere

The goal is **clean, well-organized front-end code** that a dev team can lift patterns from.

## Tech stack

Plain HTML, CSS, and JavaScript. No build step, no dependencies, no framework.

## Running locally

The app loads `data/survey.json` via `fetch()`, which browsers block on the `file://` protocol. You need a local web server. Pick one:

| Option | Command | Notes |
|---|---|---|
| VS Code Live Server | Right-click `index.html` → "Open with Live Server" | Auto-reloads on save. Recommended. |
| Python (built into macOS) | `python3 -m http.server 8000` | Open http://localhost:8000 |
| Node serve | `npx serve` | Requires Node. |

## Folder structure

```
NSF-HERD/
├── index.html              # shell: header, side nav, status pane, section container
├── README.md               # this file
├── css/
│   ├── tokens.css          # design tokens from styles doc (colors, spacing, type)
│   ├── base.css            # reset, typography, page layout
│   ├── components.css      # buttons, currency input, text input, accordion, status banner
│   └── layout.css          # app shell: side nav, status pane, drawer transitions
├── js/
│   ├── app.js              # entry: loads JSON, initializes shell
│   ├── state.js            # answer storage (localStorage)
│   ├── sections.js         # active section, side nav, status updates
│   ├── render.js           # renders a section's questions from JSON
│   ├── matrix.js           # currency matrix renderer (Q9, Q11, Q14)
│   ├── calc.js             # row/column totals + cross-question match hints
│   └── branching.js        # showIf rule evaluation
├── data/
│   └── survey.json         # full survey: sections, questions, rules, totals
├── assets/
│   ├── fonts/
│   └── images/
├── reference/              # local-only (gitignored); FY2024 PDF + styles doc
└── docs/
    └── superpowers/
        └── specs/          # design documents
```

## Design docs

See [docs/superpowers/specs/](docs/superpowers/specs/) for the design specification.
