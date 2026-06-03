# Q4 — R&D at medical schools (drawer contents)

**Date:** 2026-06-03
**Status:** Built and verified in the local preview
**Scope:** `data/survey.json` (Q4 content), `js/app.js` (2 new block renderers + conditional-engine extension), `css/components.css` (2 new component blocks).

## Purpose

Q4 was a sidebar stub with no `content`. This populates its drawer to match the
paper instrument. Q4 is the survey's first multi-part question and its first
Yes/No branch, so it introduces two reusable block types and extends the
existing conditional engine.

Paper structure:

- **Question 4.** (number only)
- **A.** "Did your institution have a medical school (that is, a school that
  awards the MD or DO degree) in FY 2025?" — Yes/No.
- **B.** "Of the total R&D expenditures reported in Question 1, row g, how much
  was expended for R&D projects in your medical school?" — a description plus a
  single currency input ("Total R&D expenditures in the university's medical
  school").

## Branch behavior (per design review)

The paper routes "Yes → 4B" and "No → Question 5". On the web, A and B share one
drawer, so the routing is expressed in place:

- **Default (nothing selected):** B is **active**.
- **Yes:** no change — B stays active.
- **No:** B greys out, its input is **disabled** (not hidden), and any value
  already typed in B is **cleared**.

Clearing on "No" avoids an ambiguous state where a disabled field still holds a
value that may or may not be submitted. This matches the intent of Q1.1's
hide-and-clear; the field starts empty again if the respondent switches to Yes.

## Block types

Two new types, both dispatched through the existing `renderContentBlock` switch.

### `yesno-question` (part A)

`{ type, prefix, text, id, options? }`. Renders the prefix + question text on the
left and a radio pair on the right, in the same `1fr 180px` two-column rhythm as
`.currency-row` / `.checkbox-question`. Both radios share `name` and
`data-field-id` = the block `id`, so the group reads as one field. `options`
defaults to `[{label:"Yes",value:"yes"},{label:"No",value:"no"}]`. Wrapped in
`role="radiogroup"` with `aria-labelledby` pointing at the question text.

### `subquestion` (part B wrapper)

`{ type, prefix, text, description?, id, disableIf?, content: [...] }`. Renders a
lettered header + optional description, then dispatches its `content` children
through the normal renderer (here: a `currency-header` + one `currency-row`).
An optional `disableIf` rule greys the surface and disables its inputs when met.

## Conditional-engine extension (`app.js`)

- `evaluateShowIf` gains an **`eq`** operator: it reads the *checked* radio's
  value for the named field and compares it as a string. Nothing checked → unmet.
  This makes the existing evaluator usable for both `showIf` and `disableIf`.
- `refreshConditionals` gains a second pass over `[data-disableif-field]`
  elements: when the rule is met it toggles `is-disabled` on the wrapper and sets
  `disabled` on every descendant `input`/`textarea`/`select` (kept visible). The
  entered value is preserved.
- `wireConditionalTriggers()` adds `change` listeners to
  `input[type="radio"][data-field-id]` so branch answers re-evaluate immediately
  (currency fields already re-evaluate on blur). Called from `start()`.
- `renderQuestionIntro` makes `text` optional, so Q4's intro shows just
  "Question 4." with the prose living in the lettered sub-parts.

## Styling (`css/components.css`)

`.yesno-question` (two-column grid; radios use the existing
`accent-color: var(--color-info)` like the checkboxes) and `.subquestion`
(lettered header + description + children).

Disabled treatment uses **directly authored tokens, never opacity** (per the
project's no-opacity-fades rule):

- muted text → `--color-text-subtle` (#5e6573, ≈5.6:1 on white, AA-safe)
- disabled input fill → `--color-disabled-field-bg`, text →
  `--color-text-disabled`, `$` adornment → `--color-text-disabled`

## Verification (local preview, port 8766)

Confirmed via DOM/geometry checks (the prototype hard-caches assets; verified by
loading fresh sources directly):

- Q4 renders intro → yesno-question → subquestion → comments → action-bar.
- Radiogroup semantics correct; text-left / options-right layout.
- Default: B active. Select **No** → `is-disabled` + input disabled and
  **cleared**, computed `opacity` stays `1` on both wrapper and input. Select
  **Yes** → re-enabled (field empty).

## Out of scope / follow-ups

- The "Save"/"Cancel" action bar is presentational, as on Q1–Q3.
- Other likely Yes/No or multi-part questions (Q5, Q13, Q17) can reuse
  `yesno-question` / `subquestion` and the `eq` + `disableIf` mechanism.
