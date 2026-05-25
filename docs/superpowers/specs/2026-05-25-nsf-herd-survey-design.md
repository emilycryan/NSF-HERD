# NSF-HERD Survey Prototype — Design Specification

**Date:** 2026-05-25
**Status:** Draft, pending user review
**Owner:** Emily Ryan (emily.ryan@icfnext.com)

## Purpose

Build a static HTML/CSS/JS prototype of the NSF HERD survey that simulates the full user experience end-to-end. The deliverable is **clean front-end code** for a developer team to use as the visual and structural reference when rebuilding the survey in their own back-end environment.

The prototype itself is not the production app. It will not submit data to a real database. Its job is to demonstrate the flow, look, and feel so the dev team can lift patterns from it.

## Goals

- Demonstrate the full survey flow with realistic question content, branching, and persistence
- Provide CSS that maps cleanly to design-system concepts a dev team will recognize and rebuild
- Make the survey schema legible as data (JSON), not buried in markup
- Stay framework-free so any dev team can read it without needing prior knowledge of React, Vue, etc.

## Non-goals

- Real data submission, server-side validation, or back-end integration
- Authentication, accounts, or multi-user support
- File upload handling (not in scope for this survey)
- Build tooling, bundlers, or transpilation
- Pixel-perfect production polish — clarity of structure matters more than visual finish

## Constraints

- Static HTML, CSS, vanilla JavaScript only. No framework, no build step.
- Must run from a local web server (Live Server, `python3 -m http.server`, `npx serve`)
- Answers persist across steps in `localStorage` only; cleared via a reset button
- Visual style: matches a reference (TBD — user will provide)

## Architecture

### High-level approach

A single `index.html` provides the wizard shell (header, footer, progress bar, navigation buttons). All survey content lives in `data/survey.json`. JavaScript reads the JSON, renders one step at a time into the shell, evaluates branching rules to decide which questions to show, and saves answers to `localStorage` as the user progresses.

### Why data-driven (JSON config)

With 15+ steps, 100+ questions, and heavy branching, the survey is too large to live as hand-written HTML. Putting it in JSON has three benefits:

1. **Legibility for the dev team** — the entire survey shape can be read in one file
2. **Branching as data** — `showIf` rules are explicit and testable, not scattered through JS
3. **Easy iteration** — adjusting question text, order, or rules doesn't require touching HTML

### Folder structure

```
NSF-HERD/
├── index.html              # shell only: header, wizard frame, footer
├── README.md               # handoff notes for dev team
├── .gitignore
├── css/
│   ├── tokens.css          # design tokens: colors, spacing, type scale
│   ├── base.css            # reset, typography, page layout
│   ├── components.css      # buttons, inputs, cards, progress bar
│   └── wizard.css          # step layout, navigation, transitions
├── js/
│   ├── app.js              # entry: loads JSON, wires modules together
│   ├── state.js            # answer storage (read/write localStorage)
│   ├── render.js           # renders a step's questions from JSON
│   ├── navigation.js       # next/back/jump-to-step logic
│   └── branching.js        # evaluates showIf rules
├── data/
│   └── survey.json         # full survey: steps, questions, branching rules
├── assets/
│   ├── fonts/
│   └── images/
└── docs/
    └── superpowers/
        └── specs/          # design documents (this file)
```

### Module responsibilities

- **`app.js`** — entry point. Fetches `survey.json`, initializes state, hands control to `navigation.js` to render the first step.
- **`state.js`** — single source of truth for user answers. Reads/writes `localStorage` under one key (e.g., `nsf-herd-answers`). Exposes `get(questionId)`, `set(questionId, value)`, `getAll()`, `reset()`.
- **`render.js`** — takes a step object from JSON and renders its visible questions into the DOM. Knows how to render each question type (text, radio, checkbox, dropdown, date, number).
- **`navigation.js`** — handles next/back buttons, current step index, and the progress bar. Calls `branching.js` to decide which step to go to next.
- **`branching.js`** — pure logic: given the current step + all answers, returns the next step index. Also decides whether individual questions within a step are visible based on `showIf` rules.

### Data flow

```
survey.json ──fetch──▶ app.js
                          │
                          ▼
                     navigation.js ──asks──▶ branching.js (which step next?)
                          │
                          ▼
                     render.js ──renders──▶ DOM
                          │
                          ▼
                  user enters answer ──saves──▶ state.js ──writes──▶ localStorage
```

### Survey JSON schema

A draft schema (final shape TBD during implementation):

```json
{
  "title": "NSF HERD Survey",
  "steps": [
    {
      "id": "institution-info",
      "title": "Institution Information",
      "questions": [
        {
          "id": "institution-name",
          "type": "text",
          "label": "Institution name",
          "required": true
        },
        {
          "id": "has-medical-school",
          "type": "radio",
          "label": "Does your institution have a medical school?",
          "options": [
            { "value": "yes", "label": "Yes" },
            { "value": "no", "label": "No" }
          ]
        },
        {
          "id": "medical-school-name",
          "type": "text",
          "label": "Medical school name",
          "showIf": { "questionId": "has-medical-school", "equals": "yes" }
        }
      ]
    }
  ]
}
```

### Question types

- **`text`** — short text input (`<input type="text">`)
- **`textarea`** — long text input
- **`radio`** — single choice from a list
- **`checkbox`** — multi-choice from a list
- **`select`** — dropdown for long option lists
- **`date`** — date picker (`<input type="date">`)
- **`number`** — numeric input (`<input type="number">`)

### Branching rules

Two kinds:

1. **Question-level `showIf`** — hide individual questions within a step based on prior answers
2. **Step-level skip** — skip whole steps based on prior answers (the `branching.js` module evaluates after each "next" click)

Initial rule format is a simple `{ questionId, equals }` shape. If more complex rules emerge (AND/OR, multiple conditions), the schema can be extended during implementation.

## CSS organization

Four files, each one job:

- **`tokens.css`** — only custom properties (`:root { --color-primary: ... }`). One source of truth the dev team can map to their own design tokens.
- **`base.css`** — minimal reset, body typography, page-level layout
- **`components.css`** — reusable building blocks: buttons, inputs, labels, cards, progress bar. Class names use BEM-style or simple `.c-button`-style prefixes for clarity.
- **`wizard.css`** — wizard-specific layout: step container, nav buttons, transitions

This split is deliberate: the dev team can pick up tokens and components as direct analogs to their own component library.

## Error handling

Pure prototype scope, so error handling is minimal:

- If `survey.json` fails to load: show a clear error message in the shell ("Survey could not be loaded.")
- Required-question validation: prevent moving to next step until required questions in the current step are answered; show inline error states on offending fields
- `localStorage` quota errors are extremely unlikely at this data size and out of scope

## Testing

Manual testing only for this prototype. The dev team will write automated tests in their own environment.

Manual test checklist (to be expanded during implementation):

- Walk through the full survey end-to-end
- Verify answers persist on refresh
- Verify branching: trigger every `showIf` and step-skip rule
- Verify required-field validation
- Verify reset clears all answers
- Verify "submit" simulation shows a success state

## Open questions

- **Visual reference** — user will provide URL, screenshot, or description. Will be folded into the CSS work.
- **Final survey content** — the actual NSF HERD questions and branching rules. Can start with a representative subset and grow.
- **Accessibility level** — federal context implies Section 508 / WCAG 2.1 AA. Confirm before finalizing component patterns.

## Success criteria

The prototype is done when:

1. A reviewer can walk through the entire survey from intro to "submit" without errors
2. Every branching rule has been exercised at least once
3. The dev team can read `survey.json` and understand the survey shape without reading any JS
4. The CSS in `tokens.css` and `components.css` reads as a small design system, not as page-specific styles
