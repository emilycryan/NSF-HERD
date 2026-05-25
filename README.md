# NSF-HERD Survey Prototype

A front-end prototype of the NSF HERD (Higher Education Research and Development) survey. Built as static HTML/CSS/JS for handoff to a developer team who will rebuild it in their own back-end environment.

## Purpose

This prototype simulates the full survey experience end-to-end:

- Multi-step wizard with 15+ sections and 100+ questions
- Heavy conditional branching (sections shown/hidden based on prior answers)
- Question types: short/long text, radio, checkbox, dropdown, date, number
- Answers persist across steps via `localStorage` (simulated; real persistence is for the dev team)
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
├── index.html              # shell only: header, wizard frame, footer
├── README.md               # this file
├── css/
│   ├── tokens.css          # colors, spacing, type scale
│   ├── base.css            # reset, typography, page layout
│   ├── components.css      # buttons, inputs, cards, progress bar
│   └── wizard.css          # step layout, navigation, transitions
├── js/
│   ├── app.js              # entry: wires everything up
│   ├── state.js            # answer storage (localStorage)
│   ├── render.js           # renders a step from JSON
│   ├── navigation.js       # next/back/jump logic
│   └── branching.js        # showIf rule evaluation
├── data/
│   └── survey.json         # the whole survey: steps, questions, branching rules
├── assets/
│   ├── fonts/
│   └── images/
└── docs/
    └── superpowers/
        └── specs/          # design documents
```

## Design docs

See [docs/superpowers/specs/](docs/superpowers/specs/) for the design specification.
