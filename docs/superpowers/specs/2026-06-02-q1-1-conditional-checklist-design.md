# Question 1.1 conditional checklist

**Date:** 2026-06-02
**Status:** Approved (design); pending implementation plan
**Scope:** One new data block, one new render path, a small conditional-reveal mechanism, and supporting CSS.

## Purpose

The HERD survey follows Question 1, row e1 ("Institutionally financed research") with a short follow-up, Question 1.1, that asks which types of internal funding the respondent included in that row. The follow-up is only relevant when the respondent actually reported institutionally financed research, so it should appear only after row e1 holds a positive amount.

This is the first conditional ("branching") content in the prototype. The README lists three more branches on the roadmap (Q4 medical school, Q5 clinical trials, Q10 agency listing), so the mechanism built here is designed to be reused by those, not special-cased to Q1.

## Behavior (decided)

- **Placement:** inside the Q1 accordion, between row e1 and row e2, within the "e. Institutional funds" group.
- **Trigger:** row e1 (`q1-e1`) holds a valid amount greater than zero. Blank, zero, and invalid entries keep 1.1 hidden.
- **Timing:** the show/hide is re-evaluated on blur, the same moment existing validation and auto-totals run. No mid-typing flicker.
- **Revert:** when the trigger becomes false, 1.1 hides and its checkbox answers clear. If row e1 funding returns, 1.1 reappears unchecked.

## Out of scope

Listed explicitly so we do not drift:

- **Persistence.** No answer in the prototype persists today (`app.js` writes nothing to `localStorage`, the README's aspiration notwithstanding). Question 1.1 matches that: its checkbox state lives in the DOM only and is lost on reload. Persistence is a whole-app concern for the dev team, not this change.
- **Operators beyond `gt`.** The condition schema is general, but only the `gt` operator is implemented now. Currency-threshold branches (e.g. Q5/Q10 amount triggers) reuse `gt`/`gte` directly. A yes/no branch (e.g. Q4) needs more than a new operator case: `evaluateShowIf` currently runs `parseAmount(src.value)` unconditionally, which is currency-specific, so a checkbox/radio trigger (`value === "on"`) also requires the value-reading step to branch by input type. Adding `eq` plus that read branch is the work for yes/no triggers.
- **The Q4/Q5/Q10 branches themselves.** This change builds the mechanism and the single Q1.1 conditional. The other branches reuse the mechanism later.
- **Non-currency triggers.** The reveal is refreshed from the currency blur cycle, so triggers that are currency fields work with no extra wiring. A future yes/no trigger (e.g. Q4) will need a listener on that control; noted as a follow-up, not built here.

## Files touched

- `data/survey.json` — add one `checkbox-question` block to the `children` of the `q1-e` currency group, between the `q1-e1` and `q1-e2` entries.
- `js/app.js` — add a `checkbox-question` render case; make `renderCurrencyGroup` dispatch its children through the general block renderer; add `evaluateShowIf` and `refreshConditionals`; call the refresh from the currency blur handler and once on load.
- `css/components.css` — add `.checkbox-question*` rules. No new tokens.

## Design — data

### The `showIf` schema

A content block may carry an optional `showIf` object. When present, the block renders hidden and a runtime evaluator decides when to reveal it.

```json
"showIf": { "field": "q1-e1", "op": "gt", "value": 0 }
```

| Key | Meaning |
|---|---|
| `field` | the `data-field-id` of the control whose value drives the condition |
| `op` | comparison operator; `gt` implemented now, schema allows future `eq`/`gte`/etc. |
| `value` | the comparison operand (number for `gt`) |

The schema is intentionally flat and single-condition. Compound AND/OR rules are not needed for any branch on the roadmap and are not built (YAGNI).

### The `checkbox-question` block

Added to `q1-e.children`, positioned immediately after the `q1-e1` row and before `q1-e2`:

```json
{
  "type": "checkbox-question",
  "number": "Question 1.1.",
  "text": "Did you include the following types of funding in your responses to Question 1, row e1?",
  "columns": { "left": "Type of funding", "right": "Included" },
  "showIf": { "field": "q1-e1", "op": "gt", "value": 0 },
  "items": [
    { "prefix": "a.", "label": "Competitively awarded internal grants for research",
      "description": "Expenditures for organized research projects, involving a proposal or statement of work with expected research outcomes.",
      "id": "q1-1-a" },
    { "prefix": "b.", "label": "Startup packages/bridge funding/seed funding",
      "description": "Expenditures from funds provided to faculty members to begin or continue their research while seeking external sponsors.",
      "id": "q1-1-b" },
    { "prefix": "c.", "label": "Other departmental funds designated for research",
      "description": "Expenditures for research from other departmental or central accounts which do not match the descriptions provided in rows a or b.",
      "id": "q1-1-c" },
    { "prefix": "d.", "label": "Tuition assistance for student research personnel",
      "description": "University tuition assistance, waivers, or remission provided to students working on organized research. Please check \"Included\" even if these funds are reported as part of the expenditures included under rows a, b, or c.",
      "id": "q1-1-d" }
  ]
}
```

The four items and their descriptions are transcribed from the FY 2025 questionnaire.

## Design — rendering

### `renderCurrencyGroup` change

`renderCurrencyGroup` currently maps every child through `renderCurrencyRow`:

```js
const children = (block.children || []).map(renderCurrencyRow).join('');
```

It is changed to dispatch each child through the general block renderer so a group can hold mixed child types:

```js
const children = (block.children || []).map(renderContentBlock).join('');
```

This is behavior-preserving for the existing groups: every current child is a `currency-row`, and `renderContentBlock`'s `currency-row` case calls `renderCurrencyRow`. It additionally lets a `checkbox-question` (or any block) live inside a group, which is what Q1.1 needs.

### `renderCheckboxQuestion(block)`

A new case in the `renderContentBlock` switch. It emits a wrapper that carries the condition as data-attributes and is `hidden` by default (initial state, before any e1 entry):

```
<section class="checkbox-question"
         data-showif-field="q1-e1" data-showif-op="gt" data-showif-value="0"
         role="group" aria-labelledby="<heading-id>" aria-live="polite" hidden>
  <header class="checkbox-question__header" id="<heading-id>">
    <span class="checkbox-question__number">Question 1.1.</span>
    <p class="checkbox-question__text">Did you include ... row e1?</p>
  </header>
  <div class="checkbox-question__columns">
    <span>Type of funding</span>
    <span>Included</span>
  </div>
  <!-- one row per item -->
  <label class="checkbox-question__row" for="<id>">
    <div class="checkbox-question__text-cell">
      <p class="checkbox-question__label"><prefix> <label></p>
      <p class="checkbox-question__description"><description></p>
    </div>
    <div class="checkbox-question__check">
      <input type="checkbox" id="<id>" data-field-id="<id>"
             aria-label="Included — <label>" />
    </div>
  </label>
</section>
```

Wrapping each row in a `<label>` makes the whole text block a click target for its checkbox and gives the checkbox an accessible name; the explicit `aria-label` keeps that name unambiguous for assistive tech. The heading id is derived from the first item id or the block's position so `aria-labelledby` resolves.

## Design — conditional mechanism

Two functions are added to `app.js`.

### `evaluateShowIf(cond)`

Returns a boolean. Reads the live value of the trigger control by `data-field-id`, parses it with the existing `parseAmount`, and applies the operator:

- `gt`: `true` only when the parsed value is non-empty, valid, and strictly greater than `cond.value`. Empty, invalid, or blank all yield `false`.
- unknown operator: `false`, with a `console.warn` (fail loud, do not silently reveal).

Reading currency fields reuses `parseAmount`, so 1.1's trigger interprets "0", "0.0", commas, and invalid text exactly as the totals do.

### `refreshConditionals()`

Sweeps every `[data-showif-field]` element, rebuilds its condition from the data-attributes, evaluates it, and:

- reveals the block (removes `hidden`) when true;
- hides the block (adds `hidden`) and **unchecks every checkbox inside it** when false.

Unchecking on hide is idempotent, so "hide and clear" needs no previous-state tracking; the function is safe to call on every blur and on load.

## Design — reactivity

The existing blur handler in `wireCurrencyCalc` already runs `recomputeTotals()` when any non-total currency field loses focus. `refreshConditionals()` is called immediately after it in that same handler, and once at the end of `start()` for the initial hidden state.

Because `refreshConditionals()` sweeps all conditionals on every currency blur, additional currency-triggered branches need no new wiring. A future non-currency trigger would add its own listener that also calls `refreshConditionals()`.

## Design — CSS

New `.checkbox-question*` rules in `components.css`, reusing the two-column rhythm of `.currency-row` so the checkbox lands in the same right-hand column as the currency inputs above it.

| Class | Role |
|---|---|
| `.checkbox-question` | container; top divider and spacing to set 1.1 apart as a sub-question nested under e1 |
| `.checkbox-question__header` | the "Question 1.1." number plus the prompt text |
| `.checkbox-question__columns` | the "Type of funding" / "Included" column header row |
| `.checkbox-question__row` | grid: text cell left, checkbox cell right; full hover/click target |
| `.checkbox-question__label` | bold funding-type label |
| `.checkbox-question__description` | muted supporting text |
| `.checkbox-question__check` | right cell holding the checkbox |

The checkbox is a native `<input type="checkbox">` styled to the square, navy-bordered box shown in the questionnaire. No new design tokens; existing color and spacing tokens are reused.

## Accessibility

- The reveal uses the `hidden` attribute, the same pattern accordions already use; hidden content is removed from the accessibility tree and tab order.
- The region is a `role="group"` labelled by the 1.1 heading via `aria-labelledby`.
- `aria-live="polite"` on the wrapper announces the section when it appears after the user enters an e1 amount.
- Each checkbox has an accessible name (`aria-label="Included — <funding type>"`) and the wrapping `<label>` enlarges its hit area.
- Color pairs for the new text reuse existing tokens already verified against WCAG AA elsewhere in the prototype; the implementation samples the final rendered label and description to confirm at least 4.5:1.

## Verification plan

After implementation, on `http://localhost:8766`:

1. Load the page and open the Q1 accordion. Confirm 1.1 is not visible while row e1 is empty.
2. Enter a positive amount in row e1 and blur. Confirm 1.1 appears between e1 and e2, with the four labelled checkboxes and the "Type of funding" / "Included" headers.
3. Confirm rows e2, e3, and the e4 subtotal still sit below 1.1 and the e4 subtotal still sums e1+e2+e3 correctly.
4. Check two boxes. Set row e1 to 0 and blur. Confirm 1.1 hides and, on re-entering a positive e1 value, returns with both boxes cleared.
5. Enter a literal `0` (not blank) in e1 and blur. Confirm 1.1 stays hidden (trigger is strictly greater than zero).
6. Enter invalid text in e1 and blur. Confirm the existing validation error shows and 1.1 stays hidden.
7. Keyboard: tab into row e1, type a value, tab out, and confirm focus order then flows through the four checkboxes; toggle each with Space.
8. Screen reader (or accessibility inspector): confirm the region is announced on reveal and each checkbox reads its funding-type name.
9. Sample the rendered label and description text and confirm at least 4.5:1 contrast against their background.

## Follow-ups (not part of this change)

- Q4/Q5/Q10 branches: build using this `showIf` mechanism. Currency-threshold triggers work as-is. Q4-style yes/no triggers add `eq` to `evaluateShowIf`, branch its value-reading by input type (since `parseAmount` is currency-specific), and add a listener on the trigger control.
- Persistence: a whole-app concern for the dev team; when added, checkbox state for 1.1 should save and restore like any other field, and the "hide and clear" rule will need a decision about whether cleared answers are also cleared from storage.
