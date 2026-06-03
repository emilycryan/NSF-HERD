# Q5 — Clinical trial R&D (drawer contents)

**Date:** 2026-06-03
**Status:** Built and verified in the local preview
**Scope:** `data/survey.json` (Q5 content), `js/app.js` (2 new block renderers + a
shared disableIf helper + a totals refresh), `css/components.css` (currency-matrix
styles + generalized disabled-greyout).

## Purpose

Populate Q5's drawer to match the paper instrument. Q5 reuses the Q4 Yes/No
branch but adds two shapes Q4 didn't have: a reference/definition block under A,
and a multi-column currency table in B.

Paper structure:

- **Question 5.** (number only)
- **A.** "Did your institution conduct any clinical trials in FY 2025?" — Yes/No.
  Below A: a definition of clinical trials plus NIH phase guidance — *include*
  Phase I–III, *exclude* Phase IV.
- **B.** "Of the total R&D expenditures reported in Question 1, row g, how much
  was expended for Phase I, Phase II, and Phase III clinical trials with human
  patients?" — a 3-column table: (1) Federal, (2) Nonfederal, (3) Total (auto).

## Branch behavior (per design review)

Same toggle/skip logic as Q4 (`disableIf`, op `eq`, clear-on-disable), with one
difference confirmed in review: **choosing "No" greys the entire region below the
A radios** — the clinical-trials definition, the Phase bullets, AND B — not just
B's inputs. The A radios themselves stay enabled so the respondent can switch
back.

To express "grey everything below A", the definition blocks and B are wrapped in
one `group` container that carries the `disableIf`. The radios sit outside it.

- **Default / Yes:** region active.
- **No:** region greys; B's three inputs disable and clear; the row Total
  recomputes to blank. Values are not restored on switching back to Yes.

## New block types

### `group`

`{ type, id, disableIf?, content: [...] }`. An unlabeled wrapper that applies one
`disableIf` rule to a span of child blocks. Renders `<div class="content-group">`
with the `data-disableif-*` attributes. Used here so the definition and B grey as
a unit.

### `currency-matrix`

`{ type, caption?, captionSub?, columns: [...], rows: [...] }`. A multi-column
currency table on a single CSS grid: `minmax(0,1.4fr) repeat(N, minmax(88px,1fr))`
(set inline from the column count). A centered caption spans the input columns; a
column-header row carries the `(1) Federal` / `(2) Nonfederal` / `(3) Total¹`
labels; each data row is a label cell plus one input cell per column.

- `columns[]`: `{ prefix?, label, footnoteRef? }`.
- `rows[]`: `{ label, description?, cells: [...] }` where `cells` aligns 1:1 with
  columns; each cell is `{ id, total?, sumOf? }`.
- Cells reuse `renderCurrencyInput`, so a `total` cell with `sumOf` is driven by
  the existing `recomputeTotals()` exactly like the single-column totals in
  Q1–Q3. Q5's Total cell sums `["q5-b-federal","q5-b-nonfederal"]` (a horizontal
  sum — `recomputeTotals` is direction-agnostic).

## Engine / shared changes (`app.js`)

- `disableIfAttrs(cond)` extracted and shared by `renderSubquestion` and
  `renderGroup`.
- `refreshConditionals` now calls `recomputeTotals()` after the disableIf pass
  when it cleared a field, so a cleared matrix input blanks its dependent Total
  immediately (radio changes don't otherwise trigger a recompute).

## Styling (`css/components.css`)

- `.currency-matrix` grid + caption / column-header / row-label styles.
- The disabled-greyout selectors were generalized from `.subquestion.is-disabled`
  to `.is-disabled` so they apply under any wrapper (`subquestion` or
  `content-group`), and extended to cover `.currency-matrix__*`,
  `.content-paragraph`, and `.content-bullets`. Muting still uses real tokens
  (`--color-text-subtle`, `--color-disabled-field-bg`), never opacity.

## Verification (local preview, port 8766)

- Q5 renders intro → A (Yes/No) → group(definition + B matrix) → comments →
  action-bar; 3 include bullets, 1 exclude bullet.
- Matrix auto-total: Federal 320 + Nonfederal 85 → Total 405 (readonly).
- Select **No** → group `is-disabled`, all three inputs disabled and cleared,
  Total blank, definition text muted (#5e6573), radios still enabled, computed
  `opacity` stays `1`. Select **Yes** → re-enabled (fields empty).
