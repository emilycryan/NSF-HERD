# Q15 — Headcount by R&D function (headcount-matrix)

**Date:** 2026-06-03
**Status:** Built and verified in the local preview
**Scope:** `data/survey.json` (Q15 content), `js/app.js` (new `headcount-matrix`
renderer + a `symbol:false` option on `renderCurrencyInput`),
`css/components.css` (headcount-matrix + plain count-input styles).

## Purpose

Populate Q15's drawer. Q15 is the most complex grid in the survey: a sectioned
headcount table with confidential demographic breakdowns and a researchers-only
education section. The money-oriented `currency-matrix` (flat rows, "$") doesn't
fit, so this introduces `headcount-matrix`.

Paper structure:

- **Question 15.** + five instruction bullets (bullet 5 references "See page 30
  for a description of each R&D function" — rendered as plain text; no page-30
  content yet).
- Columns: (a) Researchers, (b) R&D technicians, (c) R&D support staff,
  (d) Total².
- **A. Total R&D personnel** — one emphasized row, a/b/c entered, d = a+b+c.
- **B. Sex (Confidential¹)** — rows Female / Male / Sex unknown, each a/b/c + d.
- **C. Citizenship (Confidential¹)** — three rows, each a/b/c + d.
- **D. Highest level of education completed (Confidential¹)** — researchers
  only: a "Researchers only" sub-head over column a, five education rows with
  only column a, and a note ("Do not include … for R&D technicians or R&D
  support staff.") spanning the other columns.
- Footnotes: ¹ confidential statement, ² auto-totals.

## New `headcount-matrix` block

`{ columns: [...], sections: [...] }`, rendered as an HTML `<table>` (chosen over
a CSS grid because section headers and the section-D note need native
colspan/rowspan).

- `columns[]`: `{ prefix, label, footnoteRef? }` → stacked column headers.
- `sections[]`:
  - optional `heading` (+ `confidential: true` → "(Confidential¹)").
  - `rows[]`: `{ prefix, label, emphasis?, ids: { a, b, c, d } }`. A normal row
    renders a/b/c as entered count inputs and d as the auto total; the renderer
    derives `sumOf: [a, b, c]` so `recomputeTotals()` drives column d.
  - `researchersOnly: true` (+ `subHead`, `note`): renders only column a per row,
    a sub-header over column a, and the note spanning the remaining columns via
    `rowspan` (sub-head row + all data rows).

Count cells call `renderCurrencyInput(id, { symbol: false })` — the same
validation + auto-total machinery as currency, minus the "$" adornment
(`.currency-input--plain`, `inputmode="numeric"`).

## Verification (local preview, port 8766, 1280px)

- Renders a `<table>` with the four column headers, three confidential section
  headers, the "Researchers only" sub-head, and the note (colspan 3, rowspan 6).
- Count inputs render without "$"; row totals compute (A: 10+5+3 → 18;
  B1: 4+2+1 → 7). Section D rows expose only column a.

## Follow-up

- Bullet 5's "See page 30 …" R&D-function descriptions link is plain text; wire
  as a Q6-style modal when that content exists.
- Q16 (FTE by R&D function) likely reuses `headcount-matrix`.
