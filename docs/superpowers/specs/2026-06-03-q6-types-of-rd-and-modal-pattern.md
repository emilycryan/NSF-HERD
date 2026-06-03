# Q6 — Types of R&D + reusable modal pattern

**Date:** 2026-06-03
**Status:** Built and verified in the local preview
**Scope:** `data/survey.json` (Q6 content), `js/app.js` (currency-matrix
extensions + new `table` and `modal` renderers + `wireModals`),
`css/components.css` (matrix tweaks + modal / modal-link / data-table styles).

## Purpose

Populate Q6's drawer to match the paper instrument, and introduce a **reusable
modal pattern** for linked reference content (flagged for reuse on later
questions).

Paper structure:

- **Question 6.** "What amounts of your FY 2025 R&D expenditures were for basic
  research, applied research, and experimental development?"
- Two instruction bullets. The second ("See the table below this question for
  examples") becomes a link reading **"Click for examples"** that opens a modal.
- A full currency table: lead column "Type of research"; columns (1) Federal,
  (2) Nonfederal, (3) Total¹; rows a Basic / b Applied / c Experimental + a
  **Total row d**. Row totals (col 3) and column totals (row d) auto-compute.
- The examples table (3 categories × 3 examples) is the modal's content.

## Reusable modal pattern

The piece to reuse on later questions.

- **`modal` block** — `{ id, label, content: [...] }`. Renders a native
  `<dialog id="modal-<id>">`. `wireModals()` relocates every modal to `<body>`
  (so a collapsed accordion's `display:none` can't suppress the dialog's top
  layer) and wires close handlers.
- **Trigger** — any element with `data-modal-target="<id>"`. Q6's second bullet
  is a `<button class="modal-link" data-modal-target="q6-examples">`. Drop the
  same trigger + a `modal` block on any future question.
- **Open** = `dialog.showModal()` → dimmed `::backdrop`, focus trap, and
  Esc-to-close come free from `<dialog>`. **Close** = the top-left **X**
  (`data-modal-close`), a click on the dimmed backdrop, or Esc. (Close
  affordances confirmed in review: X + Esc + click-outside.)
- The **X is top-left** per the survey design (not the conventional top-right).
- Accessible name from `label` via `aria-label`; the close button is labelled
  "Close <label>".

## New `table` block

`{ caption?, columns: [string], rows: [[cell,...]] }`. A generic bordered table:
`caption` renders as a full-width title row (the "Examples" bar), `columns` are
`<th scope="col">`, `rows` are arrays of cell HTML. Reusable for any tabular
reference content.

## currency-matrix extensions (from Q5)

- `lead` — a left-column header label aligned with the column heads ("Type of
  research").
- `row.separatorBefore` — draws a full-width rule before a row (used before the
  Total row d).
- Row totals AND column totals: cells just carry `total` + `sumOf`. Because
  `recomputeTotals()` walks total fields in document order, the grand total
  `q6-d-total` (summing the two column totals, which appear earlier in the DOM)
  resolves in the same pass. Row totals sum a row's Federal+Nonfederal; column
  totals sum each column down a/b/c.
- Rows now top-align (`align-items: start`) so inputs sit beside the bold row
  title rather than floating against tall descriptions.

## Verification (local preview, port 8766, 1280px)

- Q6 renders intro → bullets (2nd is the trigger) → currency-matrix (lead +
  4 rows + divider before Total) → footnote → comments → action-bar → modal.
- Totals: a/b/c = 15/28/5; column totals Federal 33, Nonfederal 15; grand 48.
- "Click for examples" opens the modal; table shows 3 example rows under the
  "Examples" title; X is top-left (12px/12px); closes via X and via backdrop
  click; modal relocated to `<body>`.
- Note: the matrix needs desktop width to breathe; at ~500px the label column
  is cramped (acceptable for this desktop-focused review prototype).
