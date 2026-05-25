# NSF-HERD Survey Prototype — Design Specification

**Date:** 2026-05-25
**Status:** Draft, pending user review (revised after reading FY2024 PDF + styles doc)
**Owner:** Emily Ryan (emily.ryan@icfnext.com)

## Purpose

Build a static HTML/CSS/JS prototype of the NSF HERD (Higher Education Research and Development) survey that simulates the full user experience end-to-end. The deliverable is **clean front-end code** for a developer team to use as the visual and structural reference when rebuilding the survey in their own back-end environment.

The prototype itself is not the production app. It does not submit data to a real database. Its job is to demonstrate the flow, look, and feel — and to surface the front-end patterns the dev team will need to support (matrix data entry, auto-totals, cross-question validation references, conditional sections).

## What the survey actually is

The FY 2024 HERD survey collects R&D expenditure data from higher-education institutions. It has **17 numbered questions** organized as sections. Most questions are **data tables, not single inputs** — for example:

- **Q1, Q2, Q3, Q12** — currency tables, ~5–10 rows of `$_____ (thousands)` inputs with row/column totals
- **Q9, Q11, Q14** — large matrices: **40 R&D fields × 7 federal agencies** (Q9) or × 5 nonfederal source types (Q11) or × 3 federal/nonfederal/total columns (Q14). These produce ~200–280 currency cells per question.
- **Q15, Q16** — personnel counts by function × demographics (sex, citizenship, education)
- **Q4, Q5** — Yes/No gates that conditionally reveal a sub-question
- **Q10** — text + currency: lists up to 10 federal agencies with associated dollar amounts; skipped if Q9 totals = $0
- **Q17** — single field (fiscal year end month)
- **Contact info** — text fields for primary contact + up to 3 other contacts

**Auto-calculation is pervasive:** almost every table has row totals, column totals, or both, generated automatically. Several questions cross-reference each other (e.g., "Should match Question 1, row g").

## Goals

- Demonstrate the full survey flow with realistic structure and live calculations
- Build a small, reusable set of front-end components the dev team can lift directly: currency input, currency matrix, conditional reveal, auto-total field, side-nav with status
- Make the survey schema legible as data (JSON) rather than buried in markup
- Stay framework-free so any dev team can read the code without prior knowledge of React, Vue, etc.
- **Support incremental build-out** — the framework should work with placeholder questions and accept new question definitions as the user provides them

## Non-goals

- Real data submission, server-side validation, or back-end integration
- Authentication, accounts, or multi-user support
- File upload handling (not in the survey)
- Build tooling, bundlers, or transpilation
- Pixel-perfect production polish — clarity of structure matters more than visual finish
- Cross-question validation enforcement beyond a visible "should match" hint (full reconciliation logic is for the dev team)

## Constraints

- Static HTML, CSS, vanilla JavaScript only. No framework, no build step.
- Must run from a local web server (Live Server, `python3 -m http.server`, `npx serve`). When hosted on Vercel, no server needed.
- Answers persist across sessions in `localStorage` only; cleared via a reset button.
- Visual style follows the styles doc at `reference/HERD Survey Styles copy.docx` (see Visual reference section).

## Architecture

### High-level approach

A single `index.html` provides the app shell: a **persistent side navigation** listing all 17 sections with completion status, a **top status pane** showing overall progress, and a **main content area** that displays one expandable section at a time. All survey content lives in `data/survey.json`. JavaScript reads the JSON, renders the current section into the main area, evaluates conditional rules, computes auto-totals as the user types, and saves answers to `localStorage`.

Sections use an **accordion / drawer** pattern: only one is expanded by default, but the user can jump between sections via the side nav. This matches how real HERD respondents work — they fill in sections as financial data becomes available, not strictly in order.

### Why data-driven (JSON config)

With 17 sections (and matrices that contain hundreds of cells), the survey is too large to live as hand-written HTML. Putting it in JSON has three benefits:

1. **Legibility for the dev team** — the entire survey shape, including the 40-field R&D taxonomy, can be read in one file
2. **Rules as data** — conditional sections (`showIf`) and auto-total formulas (`computeAs`) are explicit and testable, not scattered through JS
3. **Incremental build-out** — new questions can be added by appending to the JSON without touching the rendering or calc code

### Folder structure

```
NSF-HERD/
├── index.html              # shell: header, side nav, status pane, section container, footer
├── README.md
├── .gitignore
├── css/
│   ├── tokens.css          # design tokens from styles doc (colors, spacing, type)
│   ├── base.css            # reset, typography, page layout
│   ├── components.css      # buttons, inputs, currency input, accordions, side nav item
│   └── layout.css          # app shell: side nav, status pane, section container, drawer transitions
├── js/
│   ├── app.js              # entry: loads JSON, initializes state, mounts the shell
│   ├── state.js            # answer storage (read/write localStorage)
│   ├── sections.js         # which section is active, jump-to-section, side nav rendering
│   ├── render.js           # renders a section's questions from JSON
│   ├── matrix.js           # renders matrix-currency tables (Q9, Q11, Q14)
│   ├── calc.js             # auto-totals (row, column) and cross-question "should match" hints
│   └── branching.js        # evaluates showIf rules
├── data/
│   └── survey.json         # full survey: sections, questions, rules, totals
├── assets/
│   ├── fonts/
│   └── images/
├── reference/              # gitignored; FY2024 PDF + styles doc live here
└── docs/
    └── superpowers/
        └── specs/          # this file
```

### Module responsibilities

- **`app.js`** — entry point. Fetches `survey.json`, initializes state, mounts side nav + status pane, opens the first incomplete section.
- **`state.js`** — single source of truth for user answers. Reads/writes `localStorage` under one key (`nsf-herd-answers`). Exposes `get(fieldId)`, `set(fieldId, value)`, `getAll()`, `reset()`. Emits a change event on every write so calc and status displays can update.
- **`sections.js`** — manages section navigation. Tracks active section, renders the side nav with per-section status (Not started / In progress / Complete), handles jump-to-section clicks.
- **`render.js`** — given a section JSON definition, renders its questions into the main content area. Delegates matrix questions to `matrix.js`. Handles simple inputs (text, currency, yes/no, checkbox, select) directly.
- **`matrix.js`** — renders a currency matrix: rows × columns of currency inputs with row totals, column totals, and a grand total. Used for Q9, Q11, Q14.
- **`calc.js`** — pure calculation logic. Given a question definition + current answers, returns computed values for total cells. Also evaluates "should match" cross-question references and surfaces a non-blocking warning when sums diverge.
- **`branching.js`** — evaluates `showIf` rules to decide whether a question or section is visible. Re-runs on every state change.

### Data flow

```
survey.json ──fetch──▶ app.js
                          │
                          ▼
                     sections.js ──renders──▶ side nav (status per section)
                          │                   status pane (overall %)
                          ▼
                     render.js ──delegates matrices──▶ matrix.js
                          │
                          ▼
                     DOM ◀─── currency, text, yes/no, select inputs

  user types ──▶ state.js ──writes localStorage──▶ emits "change" event
                                                     │
                                                     ├─▶ calc.js (recompute totals + match hints)
                                                     ├─▶ sections.js (update side nav status)
                                                     └─▶ branching.js (show/hide conditional questions)
```

### Survey JSON schema

Sketch of the schema. Final shape will be refined as questions are added.

```json
{
  "title": "NSF HERD Survey — FY 2024",
  "sections": [
    {
      "id": "q1",
      "number": "1",
      "title": "R&D expenditures by source of funds",
      "questions": [
        {
          "id": "q1-table",
          "type": "currency-table",
          "rows": [
            { "id": "q1-a", "label": "U.S. federal government" },
            { "id": "q1-b", "label": "State and local government" },
            { "id": "q1-c", "label": "Business" },
            { "id": "q1-d", "label": "Nonprofit organizations" },
            { "id": "q1-e1", "label": "Institutionally financed research", "confidential": true },
            { "id": "q1-e2", "label": "Cost sharing", "confidential": true },
            { "id": "q1-e3", "label": "Unrecovered indirect costs", "confidential": true },
            { "id": "q1-e4", "label": "Total institutional funds", "computeAs": "sum(q1-e1, q1-e2, q1-e3)" },
            { "id": "q1-f",  "label": "All other sources" },
            { "id": "q1-g",  "label": "Total", "computeAs": "sum(q1-a, q1-b, q1-c, q1-d, q1-e4, q1-f)" }
          ]
        }
      ]
    },
    {
      "id": "q4",
      "number": "4",
      "title": "Medical school R&D",
      "questions": [
        {
          "id": "q4-a",
          "type": "yes-no",
          "label": "Did your institution have a medical school in FY 2024?"
        },
        {
          "id": "q4-b",
          "type": "currency",
          "label": "Total R&D expenditures in the university's medical school",
          "showIf": { "fieldId": "q4-a", "equals": "yes" }
        }
      ]
    },
    {
      "id": "q9",
      "number": "9",
      "title": "Federal R&D by field of study",
      "questions": [
        {
          "id": "q9-matrix",
          "type": "currency-matrix",
          "columns": [
            { "id": "usda",   "label": "USDA" },
            { "id": "dod",    "label": "DoD" },
            { "id": "energy", "label": "Energy" },
            { "id": "hhs",    "label": "HHS (incl. NIH)" },
            { "id": "nasa",   "label": "NASA" },
            { "id": "nsf",    "label": "NSF" },
            { "id": "other",  "label": "Other" },
            { "id": "total",  "label": "Total", "computeAs": "rowSum" }
          ],
          "rowGroups": [
            {
              "label": "A. Computer and Information Sciences",
              "rows": [{ "id": "q9-cs", "label": "Computer and Information Sciences" }]
            },
            {
              "label": "B. Engineering",
              "rows": [
                { "id": "q9-eng-aero",  "label": "Aerospace, Aeronautical, and Astronautical" },
                { "id": "q9-eng-bio",   "label": "Bioengineering and Biomedical" }
                // ... 7 more
              ],
              "subtotalRow": { "id": "q9-eng-total", "label": "Engineering total", "computeAs": "colSum" }
            }
            // ... groups C through K
          ],
          "totalRow": { "id": "q9-total", "label": "Total for All Fields of R&D", "computeAs": "colSum" }
        }
      ]
    }
  ]
}
```

### Question types

Inventory of types based on the actual survey:

- **`currency`** — single dollar amount input (in thousands). Format `$25,342` displayed; raw `25342` stored.
- **`currency-table`** — flat list of currency rows with auto-totaled rows (e.g., Q1, Q2, Q3, Q12). Some rows are computed (e.g., `q1-e4 = sum(q1-e1..e3)`).
- **`currency-matrix`** — rows × columns of currency cells with row totals and column totals (Q9, Q11, Q14, parts of Q15).
- **`yes-no`** — two-option radio (Q4A, Q5A). Triggers `showIf` on follow-up.
- **`checkbox-included`** — array of yes/no "Included" checkboxes (Q1.1).
- **`text`** — single-line text (contact info, Q10 agency names).
- **`select`** — single choice from a list (Q17 month-of-year).
- **`email`** — text input with email format hint (contact info).
- **`headcount-matrix`** — Q15: integer headcount × demographic categories with row totals. Similar to currency-matrix but integer values, not formatted as dollars.

The dev team will receive these as a clean component vocabulary they can map to their own framework.

### Branching rules

Three places in the survey, all simple:

1. **Q4** — if `q4-a == "no"`, hide `q4-b`
2. **Q5** — if `q5-a == "no"`, hide `q5-b`
3. **Q10** — if `q9-total-other == 0`, hide the entire Q10 section

Schema uses `showIf: { fieldId, equals }`. If a more complex rule emerges, the schema can be extended.

### Auto-totals and "should match" hints

The survey is dense with computed values. Two patterns:

1. **Internal totals** — row/column/grand totals within a single question, computed live as the user types. Stored as read-only fields.
2. **Cross-question matches** — many questions reference each other (e.g., "Q1 row g should match Q9 row K column h"). The prototype shows a non-blocking hint when sums diverge. It does not prevent submission — that's for the dev team to decide.

`calc.js` is the only module that touches these. It re-runs on every state change for questions visible on screen.

## Visual reference

From `reference/HERD Survey Styles copy.docx`. Hex values map to the **Tailwind CSS default palette**, which is a strong signal the dev team uses or expects Tailwind. The prototype mirrors these as CSS custom properties in `tokens.css` for a one-to-one mapping.

### Status / role colors

| Role | Hex | Tailwind equivalent |
|---|---|---|
| Success / positive | `#10B981` | `emerald-500` |
| Error / negative | `#EF4444` | `red-500` |
| Warning | `#F59E0B` | `amber-500` |
| Info / primary | `#3B82F6` | `blue-500` |

### Surfaces and backgrounds

| Role | Hex |
|---|---|
| Main content background | `#FFFFFF` |
| Nav bar background | `#F9FAFB` |
| Light blue accent background | `#EFF6FF` |
| Pale green (success state) | `#F0FDF4` |
| Pale pink/red (error state) | `#FEF2F2` |
| Light yellow (warning state) | `#FEF9C3` |
| Section header (accordion) | `#F3F3F3` |
| Parent section header (accordion) | `#333333` |

### Strokes and dividers

| Role | Hex |
|---|---|
| Dark blue side stroke | `#3B82F6` |
| Mid-blue bullets | `#60A5FA` |
| Text entry box border | `#D4D4D4` |

### Text

| Role | Hex |
|---|---|
| Standard body text | `#000000`, `#333333` |
| Text on blue background | `#333333` |
| Form field placeholder text | `#ADAEBC` |
| Disabled button text | `#9CA5B8` |

### States

| Role | Hex |
|---|---|
| Disabled button background | `#D1D9E2` |
| Disabled form field background | `#F9FAFB` |

### What this implies for components

- **Accordion / drawer** is a core pattern. Section header `#F3F3F3` (collapsed), parent section header `#333333` (the dark band the user sees when nested deeply). Side stroke `#3B82F6` for active section indication.
- **Status banners** (success/error/warning/info) use the pale variants as backgrounds with the corresponding 500-level color for icons and accents.
- **Form inputs** use a 1px `#D4D4D4` border, placeholder text `#ADAEBC`, disabled state with `#F9FAFB` background.
- **Buttons** have a clear disabled state (`#D1D9E2` bg, `#9CA5B8` text) that's used liberally in this survey (e.g., totals are read-only computed fields).

## CSS organization

Four files, each one job:

- **`tokens.css`** — only custom properties (`:root { --color-success: #10B981; ... }`). One source of truth the dev team can map directly to Tailwind class names if they use Tailwind, or to their own design tokens otherwise.
- **`base.css`** — minimal reset, body typography, page-level layout
- **`components.css`** — reusable building blocks: buttons, currency input (with `$` prefix and thousands formatting), text input, select, checkbox, accordion, status banner
- **`layout.css`** — app shell: side nav, top status pane, main section container, drawer transitions

## Error handling

Pure prototype scope, so error handling is minimal:

- If `survey.json` fails to load: show a clear error message in the shell
- Required-question validation: highlight unfilled required fields when leaving a section; mark the section as "In progress" in the side nav (does not block navigation)
- "Should match" mismatches: show a yellow warning banner near the affected total; non-blocking
- `localStorage` quota errors are extremely unlikely at this data size and out of scope

## Testing

Manual testing only. The dev team will write automated tests in their own environment.

Manual test checklist:

- Walk through every section
- Verify auto-totals update live as the user types
- Verify branching: trigger Q4, Q5, and Q10 reveal/hide
- Verify side nav status updates (Not started → In progress → Complete) as fields are filled
- Verify answers persist on refresh
- Verify reset clears all answers and side nav status
- Verify "should match" hints appear when cross-question totals diverge

## Incremental build approach

The user will provide question structure for each section as we go. The implementation plan reflects this:

1. Build the **shell** first (side nav, top status pane, section container, accordion behavior) with placeholder content
2. Build the **component library** (currency input, currency table, currency matrix, yes/no, text, select)
3. Build the **state + calc + branching** modules
4. Add **one section at a time** to `survey.json`, starting with simple shapes (Q1, Q4) and graduating to the big matrices (Q9, Q11, Q14)

The plan does not assume all 17 sections will be implemented in the prototype phase. The framework is the deliverable; question content is incremental.

## Open questions

- **Final survey content for each section** — user will provide as we build
- **Exact accordion behavior** — single-open vs multi-open; collapse state persistence across sessions? Default: single-open, collapse state ephemeral
- **Section completion criteria** — what makes a section "Complete"? Proposed: all required fields filled. To be confirmed per section.
- **Accessibility level** — federal context implies Section 508 / WCAG 2.1 AA. Confirm before finalizing component patterns.
- **Behavior on Vercel** — since the Vercel deployment serves over HTTP, fetching `data/survey.json` works without a local server. Tested by visiting `nsf-herd.vercel.app` after the next push.

## Success criteria

The prototype is done when:

1. A reviewer can navigate the app via side nav + accordion, see live totals, and trigger every conditional reveal
2. Every question type (`currency`, `currency-table`, `currency-matrix`, `yes-no`, `checkbox-included`, `text`, `select`, `email`, `headcount-matrix`) has at least one working example
3. The dev team can read `survey.json` and understand the survey shape without reading any JS
4. The CSS in `tokens.css` and `components.css` reads as a small design system, not as page-specific styles
5. The visual reference (colors, accordion treatment, form input styling) matches what's documented in `reference/HERD Survey Styles copy.docx`
