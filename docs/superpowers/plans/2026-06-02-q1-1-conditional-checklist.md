# Question 1.1 Conditional Checklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show NSF HERD Question 1.1 (an "Included" checklist of four internal-funding types) inside the Q1 accordion, between row e1 and row e2, only when row e1 holds an amount greater than zero.

**Architecture:** Add a declarative `showIf` condition to any `survey.json` content block plus a new `checkbox-question` block type. A small runtime sweep (`refreshConditionals`) reads the trigger field's live value and toggles the block's `hidden` attribute on the existing currency blur cycle, clearing checkboxes when it hides. The mechanism is generic so the roadmap branches (Q4/Q5/Q10) reuse it.

**Tech Stack:** Plain HTML/CSS/JS, no build step, no dependencies. Verification is by running the local static server and observing the page through the preview tools (no unit-test runner; matches the project's zero-dependency constraint and existing spec verification pattern).

**Reference spec:** `docs/superpowers/specs/2026-06-02-q1-1-conditional-checklist-design.md`

**Server:** profile `nsf-herd` serves `/Users/63172/Sites/NSF-HERD` on `http://localhost:8766` (already running; reuse it).

---

## File structure

| File | Responsibility | Change |
|---|---|---|
| `data/survey.json` | survey content/data | Add one `checkbox-question` block to `q1-e.children`, between `q1-e1` and `q1-e2`. |
| `js/app.js` | the whole renderer + wiring | Dispatch currency-group children through the general renderer; add `renderCheckboxQuestion`; add `evaluateShowIf` + `refreshConditionals`; call the refresh on currency blur and once on load. |
| `css/components.css` | component styles | Add `.checkbox-question*` rules. No new tokens. |

No new files. Each change is small and self-contained.

---

## Task 1: Dispatch currency-group children through the general renderer

This is a behavior-preserving refactor so a currency group can hold a non-currency-row child (Q1.1). Every current child is a `currency-row`, and the general renderer's `currency-row` case already calls `renderCurrencyRow`, so existing output is unchanged.

**Files:**
- Modify: `js/app.js` (function `renderCurrencyGroup`, ~lines 324-333)

- [ ] **Step 1: Change the child map from `renderCurrencyRow` to `renderContentBlock`**

Find:

```js
function renderCurrencyGroup(block) {
  const prefix = block.prefix ? `${block.prefix} ` : '';
  const children = (block.children || []).map(renderCurrencyRow).join('');
```

Replace with:

```js
function renderCurrencyGroup(block) {
  const prefix = block.prefix ? `${block.prefix} ` : '';
  // Children are dispatched through the general block renderer so a group can
  // hold a non-currency-row child (e.g. the Q1.1 checkbox question under e1).
  const children = (block.children || []).map(renderContentBlock).join('');
```

- [ ] **Step 2: Verify existing rendering is unchanged**

Ensure the server is running (`preview_start` profile `nsf-herd` if needed), reload `http://localhost:8766`, then:
- `preview_console_logs` shows no new errors or warnings.
- `preview_eval`: `document.querySelectorAll('[data-group-id="q1-e"] .currency-row').length` returns `4` (rows e1, e2, e3, e4).
- `preview_snapshot` of the Q1 accordion shows the "e. Institutional funds" group with all four rows and the e4 subtotal exactly as before.

- [ ] **Step 3: Commit**

```bash
cd /Users/63172/Sites/NSF-HERD
rm -f .git/index.lock && sleep 0.5 && git add js/app.js && \
  git commit -m "Dispatch currency-group children through general renderer"
```

---

## Task 2: Add the Question 1.1 data block and its renderer

**Files:**
- Modify: `data/survey.json` (the `q1-e` currency group's `children` array, between the `q1-e1` and `q1-e2` objects, ~line 250)
- Modify: `js/app.js` (`renderContentBlock` switch ~lines 149-153; new function near the other `render*` helpers)

- [ ] **Step 1: Insert the `checkbox-question` block into `q1-e.children`**

In `data/survey.json`, the `q1-e1` child object ends just before the `q1-e2` child object. Insert the following object between them (after the closing `}` of `q1-e1`, with a trailing comma, before the opening `{` of `q1-e2`):

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
},
```

- [ ] **Step 2: Verify the JSON still parses**

Run:

```bash
cd /Users/63172/Sites/NSF-HERD && python3 -c "import json; json.load(open('data/survey.json')); print('valid')"
```

Expected output: `valid`

- [ ] **Step 3: Add the `renderCheckboxQuestion` function to `js/app.js`**

Add this function next to the other question render helpers (for example just after `renderCurrencyGroup`):

```js
function renderCheckboxQuestion(block) {
  const items = block.items || [];
  const cols = block.columns || {};
  const headingId = `cq-${items[0] ? items[0].id : 'q'}-heading`;

  const rows = items.map((item) => {
    const prefix = item.prefix ? `${item.prefix} ` : '';
    const desc = item.description
      ? `<p class="checkbox-question__description">${item.description}</p>`
      : '';
    return `
      <label class="checkbox-question__row" for="${item.id}">
        <div class="checkbox-question__text-cell">
          <p class="checkbox-question__label">${prefix}${item.label || ''}</p>
          ${desc}
        </div>
        <div class="checkbox-question__check">
          <input type="checkbox" id="${item.id}" data-field-id="${item.id}"
                 aria-label="Included: ${escapeAttr(item.label || '')}" />
        </div>
      </label>
    `;
  }).join('');

  // A showIf condition renders the block hidden and carries the rule as
  // data-* attributes; refreshConditionals() reveals it when the rule is met.
  const cond = block.showIf;
  const condAttrs = cond && cond.field
    ? ` data-showif-field="${escapeAttr(cond.field)}"`
      + ` data-showif-op="${escapeAttr(cond.op || 'gt')}"`
      + ` data-showif-value="${escapeAttr(String(cond.value))}" hidden`
    : '';

  return `
    <section class="checkbox-question" role="group" aria-labelledby="${headingId}" aria-live="polite"${condAttrs}>
      <header class="checkbox-question__header" id="${headingId}">
        <span class="checkbox-question__number">${block.number || ''}</span>
        <p class="checkbox-question__text">${block.text || ''}</p>
      </header>
      <div class="checkbox-question__columns">
        <span>${cols.left || ''}</span>
        <span>${cols.right || ''}</span>
      </div>
      ${rows}
    </section>
  `;
}
```

- [ ] **Step 4: Register the block type in the `renderContentBlock` switch**

Find the `currency-group` case in `renderContentBlock`:

```js
    case 'currency-group':
      return renderCurrencyGroup(block);
```

Add the new case immediately after it:

```js
    case 'currency-group':
      return renderCurrencyGroup(block);
    case 'checkbox-question':
      return renderCheckboxQuestion(block);
```

- [ ] **Step 5: Verify the block renders into the DOM (hidden)**

Reload `http://localhost:8766` and open the Q1 accordion, then:
- `preview_console_logs`: no errors, and no "Unknown content block type" warning.
- `preview_eval`: `!!document.querySelector('.checkbox-question')` returns `true`.
- `preview_eval`: `document.querySelector('.checkbox-question').hasAttribute('hidden')` returns `true` (hidden on load, before any e1 entry).
- Temporarily reveal it to inspect structure (does not change source):
  `preview_eval`: `document.querySelector('.checkbox-question').removeAttribute('hidden'); document.querySelectorAll('.checkbox-question__row').length` returns `4`.
- `preview_snapshot`: confirm the header "Question 1.1." + prompt, the "Type of funding" / "Included" column row, and four labelled rows each with a checkbox are present (unstyled at this point).

- [ ] **Step 6: Commit**

```bash
cd /Users/63172/Sites/NSF-HERD
rm -f .git/index.lock && sleep 0.5 && git add data/survey.json js/app.js && \
  git commit -m "Add Question 1.1 checkbox-question block and renderer"
```

---

## Task 3: Style the checkbox question

Mirror `.currency-row`'s `1fr 180px` grid so the checkbox sits in the same right-hand column as the currency inputs above it. Reuse existing tokens and the established native-checkbox pattern.

**Files:**
- Modify: `css/components.css` (append after the currency-group rules, near line 996, within the "Question content blocks" section)

- [ ] **Step 1: Add the `.checkbox-question*` rules**

Append:

```css
/* ---- Checkbox question: conditional follow-up (e.g. Q1.1 under row e1) ----
 * A nested sub-question whose two-column layout mirrors .currency-row:
 * funding-type text on the left, an "Included" checkbox on the right.
 * Rendered hidden by default; shown or hidden at runtime by
 * refreshConditionals() in app.js. */

.checkbox-question {
  margin-top: var(--space-2);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-card-border);
}

.checkbox-question__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-bottom: var(--space-3);
}

.checkbox-question__number {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-primary-dark);
}

.checkbox-question__text {
  margin: 0;
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
}

.checkbox-question__columns {
  display: grid;
  grid-template-columns: 1fr 180px;
  gap: var(--space-6);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-card-border);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-text);
}

.checkbox-question__columns span:last-child {
  text-align: center;
}

.checkbox-question__row {
  display: grid;
  grid-template-columns: 1fr 180px;
  gap: var(--space-6);
  align-items: start;
  padding: var(--space-4) 0;
  border-top: 1px solid var(--color-card-border);
  cursor: pointer;
}

.checkbox-question__row:first-of-type {
  border-top: none;
}

.checkbox-question__label {
  font-size: var(--text-base);
  font-weight: 700;
  margin: 0 0 var(--space-2);
  color: var(--color-text);
  line-height: 1.3;
}

.checkbox-question__description {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.5;
}

.checkbox-question__check {
  display: flex;
  justify-content: center;
  padding-top: var(--space-1);
}

.checkbox-question__check input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  margin: 0;
  accent-color: var(--color-info);
  cursor: pointer;
}
```

- [ ] **Step 2: Verify the styled layout**

Reload `http://localhost:8766`, open Q1, then temporarily reveal 1.1 to inspect (source stays hidden-by-default):
- `preview_eval`: `document.querySelector('.checkbox-question').removeAttribute('hidden')`
- `preview_screenshot` of the Q1 accordion. Confirm against the questionnaire screenshot:
  - "Question 1.1." heading and prompt above the list.
  - A "Type of funding" / "Included" header row.
  - Four rows: bold label + description on the left, a checkbox centered under "Included" on the right.
  - The checkbox column lines up with the currency `$` inputs in the rows above.
  - The block is indented under "e. Institutional funds" and reads as a sub-question.
- `preview_inspect` the `.checkbox-question__description` text; confirm color `--color-text-muted` (#333333) on the white surface clears 4.5:1.

If spacing between e1 and 1.1 looks doubled (the flex `gap` on `.currency-group__children` plus the block's `margin-top`), reduce `.checkbox-question { margin-top }` toward `0`.

- [ ] **Step 3: Commit**

```bash
cd /Users/63172/Sites/NSF-HERD
rm -f .git/index.lock && sleep 0.5 && git add css/components.css && \
  git commit -m "Style the Question 1.1 checkbox question"
```

---

## Task 4: Add conditional evaluation and reactivity

**Files:**
- Modify: `js/app.js` (new functions near `recomputeTotals`; one line in the `wireCurrencyCalc` blur handler ~line 514; one line in `start` ~line 539)

- [ ] **Step 1: Add `evaluateShowIf` and `refreshConditionals`**

Add both functions to `js/app.js`, for example just below `recomputeTotals`:

```js
// Evaluate one showIf condition. Reads the trigger field's live value (parsed
// the same way currency inputs are) and compares it per the operator. Returns
// true when the dependent block should be visible. Unknown operators fail
// closed (block stays hidden) and warn, rather than silently revealing.
function evaluateShowIf(field, op, value) {
  const src = document.querySelector(`[data-field-id="${field}"]`);
  if (!src) return false;
  const parsed = parseAmount(src.value);
  switch (op) {
    case 'gt':
      return !parsed.empty && parsed.valid && parsed.value > Number(value);
    default:
      console.warn('[conditionals] Unknown showIf op:', op);
      return false;
  }
}

// Show or hide every conditional block from its data-showif-* attributes.
// When a block hides, its checkboxes are cleared so a later re-show starts
// fresh ("hide and clear"). Idempotent: safe to call on every blur and on load.
function refreshConditionals() {
  document.querySelectorAll('[data-showif-field]').forEach((el) => {
    const show = evaluateShowIf(
      el.dataset.showifField,
      el.dataset.showifOp,
      el.dataset.showifValue
    );
    if (show) {
      el.removeAttribute('hidden');
    } else {
      el.setAttribute('hidden', '');
      el.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
        cb.checked = false;
      });
    }
  });
}
```

- [ ] **Step 2: Refresh conditionals on currency blur**

In `wireCurrencyCalc`, find the blur handler's call to `recomputeTotals`:

```js
      if (errorEl) errorEl.hidden = !invalid;
      recomputeTotals();
    });
```

Add a refresh call right after the recompute:

```js
      if (errorEl) errorEl.hidden = !invalid;
      recomputeTotals();
      refreshConditionals();
    });
```

- [ ] **Step 3: Set the initial state on load**

In `start`, find:

```js
    wireCurrencyCalc();
  } catch (err) {
```

Insert the initial refresh after `wireCurrencyCalc()`:

```js
    wireCurrencyCalc();
    refreshConditionals();
  } catch (err) {
```

- [ ] **Step 4: Verify the full behavior**

Reload `http://localhost:8766` and open the Q1 accordion. Run these through the preview tools:

1. Hidden on load:
   `preview_eval`: `document.querySelector('.checkbox-question').hasAttribute('hidden')` returns `true`.
2. Reveals when e1 > 0:
   `preview_eval`:
   `const f=document.querySelector('[data-field-id="q1-e1"]'); f.value="5"; f.dispatchEvent(new Event('blur')); document.querySelector('.checkbox-question').hasAttribute('hidden')`
   returns `false`. `preview_screenshot` shows 1.1 between e1 and e2.
3. Hide-and-clear when e1 returns to 0:
   `preview_eval`:
   `document.querySelector('[data-field-id="q1-1-a"]').checked=true; const f=document.querySelector('[data-field-id="q1-e1"]'); f.value="0"; f.dispatchEvent(new Event('blur')); [document.querySelector('.checkbox-question').hasAttribute('hidden'), document.querySelector('[data-field-id="q1-1-a"]').checked]`
   returns `[true, false]` (hidden, and the box was cleared).
4. Stays hidden for a literal 0 (strictly greater than zero):
   already covered by step 3's `value="0"` result (`hidden === true`).
5. Stays hidden for invalid input, and the existing error still shows:
   `preview_eval`:
   `const f=document.querySelector('[data-field-id="q1-e1"]'); f.value="abc"; f.dispatchEvent(new Event('blur')); [document.querySelector('.checkbox-question').hasAttribute('hidden'), f.classList.contains('is-invalid')]`
   returns `[true, true]`.
6. `preview_console_logs`: no errors across the above.

- [ ] **Step 5: Commit**

```bash
cd /Users/63172/Sites/NSF-HERD
rm -f .git/index.lock && sleep 0.5 && git add js/app.js && \
  git commit -m "Reveal Question 1.1 when row e1 funding is entered"
```

---

## Task 5: Accessibility and final end-to-end verification

The accessibility attributes (`role="group"`, `aria-labelledby`, `aria-live="polite"`, per-checkbox `aria-label`, label hit area) were emitted in Task 2. This task confirms them against the spec's verification plan and fixes any gap found.

**Files:**
- Modify (only if a gap is found): `js/app.js` and/or `css/components.css`

- [ ] **Step 1: Keyboard path**

On `http://localhost:8766`, Q1 open, enter `5` in e1 and blur so 1.1 is visible. Using `preview_eval` to read `document.activeElement`, Tab from the e1 field and confirm focus reaches each of the four checkboxes in order (a, b, c, d). Toggle one with the keyboard (`preview_eval` dispatching a click on the focused checkbox) and confirm `checked` flips.

- [ ] **Step 2: Semantics**

`preview_eval`:
- `document.querySelector('.checkbox-question').getAttribute('role')` returns `"group"`.
- `document.querySelector('.checkbox-question').getAttribute('aria-live')` returns `"polite"`.
- `const id=document.querySelector('.checkbox-question').getAttribute('aria-labelledby'); !!document.getElementById(id)` returns `true` (the label target exists).
- `document.querySelector('[data-field-id="q1-1-b"]').getAttribute('aria-label')` returns `"Included: Startup packages/bridge funding/seed funding"`.

- [ ] **Step 3: Contrast**

`preview_inspect` the `.checkbox-question__label` and `.checkbox-question__description`; confirm both clear 4.5:1 against the white surface (label is near-black on white; description `#333333` on white is well above the floor).

- [ ] **Step 4: Final proof for the user**

With 1.1 revealed and two boxes checked, capture `preview_screenshot` of the Q1 accordion showing 1.1 in place between e1 and e2. This is the artifact to share.

- [ ] **Step 5: Commit any fixes**

If Steps 1-3 required changes:

```bash
cd /Users/63172/Sites/NSF-HERD
rm -f .git/index.lock && sleep 0.5 && git add -A && \
  git commit -m "Address Question 1.1 accessibility verification findings"
```

If no changes were needed, there is nothing to commit; note that verification passed.

---

## Self-review notes

- **Spec coverage:** placement between e1 and e2 (Tasks 1-2), `gt 0` trigger (Task 4 Step 1), blur timing (Task 4 Step 2), hide-and-clear (Task 4 Step 1 + verify Step 4.3), `showIf` schema + `checkbox-question` block (Task 2), reusable refresh (Task 4), CSS two-column mirror (Task 3), accessibility (Task 2 markup + Task 5), no persistence (nothing added). All covered.
- **Type/name consistency:** `evaluateShowIf(field, op, value)`, `refreshConditionals()`, `renderCheckboxQuestion(block)`, classes `.checkbox-question*`, field ids `q1-1-a..d`, condition keys `field`/`op`/`value`, data-attrs `data-showif-field`/`-op`/`-value` are used identically across tasks.
- **No placeholders:** every code and command step is complete and runnable.
