// Landing-page renderer.
// Fetches data/survey.json and renders the sidebar, dashboard, and grouped
// accordions. No state/calc/branching yet — that comes in later phases.

const STATUS_LABELS = {
  'not-started': 'Not started',
  'completed': 'Completed',
  'warning': 'Warning',
  'review': 'Review'
};

async function loadSurvey() {
  const res = await fetch('data/survey.json');
  if (!res.ok) {
    throw new Error(`Failed to load survey.json: HTTP ${res.status}`);
  }
  return res.json();
}

function statusBadge(status) {
  const cls = `status-badge status-badge--${status}`;
  const label = STATUS_LABELS[status] || 'Unknown';
  return `<span class="${cls}" role="img" aria-label="${label}"></span>`;
}

function flattenSidebarSections(groups) {
  const out = [];
  for (const group of groups) {
    for (const section of group.sections) {
      if (section.showInSidebar) out.push(section);
    }
  }
  return out;
}

function renderPageHeader(data) {
  document.getElementById('page-title').innerHTML = `
    ${data.fullTitle}
    <span class="page-title__divider">|</span>
    <span class="page-title__year">${data.year}</span>
  `;
  document.getElementById('dashboard-title').textContent = data.title;
  document.getElementById('due-date').textContent = data.dueDate;
  document.getElementById('survey-status').textContent = data.surveyStatus;
  document.getElementById('progress-text').innerHTML =
    `<strong>${data.completedCount} of ${data.totalSidebarSections}</strong> completed`;
}

function renderSidebar(data) {
  const list = document.getElementById('sidebar-list');
  list.innerHTML = '';

  const items = flattenSidebarSections(data.groups);
  for (const section of items) {
    const li = document.createElement('li');
    const numberText = section.number ? String(section.number) + '.' : '';
    // The sidebar shows a uniform neutral indicator by design; per-section
    // status colors live only in the legend at the top of the dashboard.
    li.innerHTML = `
      <button class="sidebar-item" type="button" data-section-id="${section.id}">
        <span class="sidebar-item__number">${numberText}</span>
        <span class="sidebar-item__label">${section.title}</span>
        <span class="sidebar-item__status"><span class="status-badge status-badge--not-started" aria-hidden="true"></span></span>
      </button>
    `;
    list.appendChild(li);
  }
}

function renderIssues(data) {
  const list = document.getElementById('issues-list');
  list.innerHTML = '';
  for (const issue of data.issues) {
    const li = document.createElement('li');
    li.className = 'dashboard-item';
    li.innerHTML = `
      <span class="dashboard-item__icon">${statusBadge(issue.severity)}</span>
      <div>
        <p class="dashboard-item__label">${issue.title}</p>
        <p class="dashboard-item__value">${issue.detail}</p>
      </div>
    `;
    list.appendChild(li);
  }
}

function renderChangesCard(data) {
  document.getElementById('changes-body').textContent = data.changesNote;
}

function renderGroups(data) {
  const container = document.getElementById('groups-container');
  container.innerHTML = '';

  for (const group of data.groups) {
    const header = document.createElement('div');
    header.className = 'group-header';
    header.textContent = group.title;
    container.appendChild(header);

    for (const section of group.sections) {
      container.appendChild(renderAccordion(section));
    }
  }
}

function renderContentBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return `<p class="content-placeholder">Content for this section will be added as the survey is built out.</p>`;
  }
  return blocks.map(renderContentBlock).join('');
}

function renderContentBlock(block) {
  switch (block.type) {
    case 'callout':
      return `<div class="content-callout">${block.html || block.text || ''}</div>`;
    case 'heading':
      return `<h4 class="content-heading">${block.text || ''}</h4>`;
    case 'subheader':
      return `<h5 class="content-subheader">${block.text || ''}</h5>`;
    case 'paragraph':
      return `<p class="content-paragraph">${block.html || block.text || ''}</p>`;
    case 'definition-list': {
      const items = (block.items || []).map((item) => `
        <div class="content-definition">
          <p class="content-definition__term">${item.term || ''}</p>
          <p class="content-definition__text">${item.text || ''}</p>
        </div>
      `).join('');
      return `<div class="content-definitions">${items}</div>`;
    }
    case 'bullet-list': {
      const items = (block.items || []).map((html) => `<li>${html}</li>`).join('');
      return `<ul class="content-bullets">${items}</ul>`;
    }
    case 'field':
      return renderField(block);
    case 'field-row':
      return renderFieldRow(block);
    case 'textarea':
      return renderTextarea(block);
    case 'contact-card':
      return renderContactCard(block);
    case 'question-intro':
      return renderQuestionIntro(block);
    case 'currency-header':
      return renderCurrencyHeader(block);
    case 'currency-row':
      return renderCurrencyRow(block);
    case 'currency-group':
      return renderCurrencyGroup(block);
    case 'checkbox-question':
      return renderCheckboxQuestion(block);
    case 'yesno-question':
      return renderYesNoQuestion(block);
    case 'subquestion':
      return renderSubquestion(block);
    case 'group':
      return renderGroup(block);
    case 'currency-matrix':
      return renderCurrencyMatrix(block);
    case 'entry-list':
      return renderEntryList(block);
    case 'headcount-matrix':
      return renderHeadcountMatrix(block);
    case 'table':
      return renderTable(block);
    case 'examples-grid':
      return renderExamplesGrid(block);
    case 'modal':
      return renderModal(block);
    case 'divider':
      return `<hr class="q-divider" />`;
    case 'footnote':
      return `<p class="content-footnote"><sup>${block.marker || '1'}</sup> ${block.text || ''}</p>`;
    case 'comments':
      return renderComments(block);
    case 'action-bar':
      return `
        <div class="action-bar">
          <button type="button" class="action-bar__cancel">Cancel</button>
          <button type="button" class="action-bar__save">Save</button>
        </div>
      `;
    // Helper text + bulk-fill buttons that sit above the data grid on the
    // matrix questions (Q9, Q11, Q14). Content is identical across them, so
    // the block is zero-config like action-bar.
    case 'prefill-actions':
      return `
        <div class="prefill-actions">
          <div class="prefill-actions__notes">
            <p class="prefill-actions__note">Enter 0 for no expenditures and "U" for Unavailable.</p>
            <p class="prefill-actions__note">If you have no expenditures to report for this section, "0" will be entered in all blank fields.</p>
            <p class="prefill-actions__note">If you cannot provide this information at this time, "Unavailable" will be entered in all blank fields.</p>
          </div>
          <div class="prefill-actions__buttons">
            <button type="button" class="prefill-actions__button">Enter Zeros in Blank Fields</button>
            <button type="button" class="prefill-actions__button">Enter Unavailable in Blank Fields</button>
          </div>
        </div>
      `;
    default:
      console.warn('[render] Unknown content block type:', block.type);
      return '';
  }
}

function renderInput(input) {
  const type = input.type || 'text';
  const fieldId = input.id || '';
  const prefill = input.prefill;
  const sizeClass = input.size ? ` form-input--${input.size}` : '';
  const prefilledClass = prefill ? ' is-prefilled' : '';
  const value = prefill !== undefined ? ` value="${escapeAttr(prefill)}"` : '';
  return `<input class="form-input${sizeClass}${prefilledClass}" type="${type}" data-field-id="${fieldId}"${value} />`;
}

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderField(block) {
  const inputs = (block.inputs || []).map(renderInput).join('');
  const inline = block.inputs && block.inputs.length > 1 ? ' content-field--inline' : '';
  // A label-less field (e.g. Q17's month input, where the question itself is
  // the label) skips the <label> rather than rendering an empty one.
  const labelHtml = block.label ? `<label class="content-field__label">${block.label}</label>` : '';
  return `
    <div class="content-field${inline}">
      ${labelHtml}
      <div class="content-field__inputs">${inputs}</div>
    </div>
  `;
}

function renderFieldRow(block) {
  const groups = (block.fields || []).map((f) => {
    const inputs = (f.inputs || []).map(renderInput).join('');
    const extPart = f.ext
      ? `<div class="content-field__ext">
           <label class="content-field__ext-label">ext.</label>
           <input class="form-input form-input--small" type="text" data-field-id="${f.ext.id}" />
         </div>`
      : '';
    return `
      <div class="content-field">
        <label class="content-field__label">${f.label || ''}</label>
        <div class="content-field__inputs-with-ext">
          <div class="content-field__inputs">${inputs}</div>
          ${extPart}
        </div>
      </div>
    `;
  }).join('');
  return `<div class="content-field-row">${groups}</div>`;
}

function renderTextarea(block) {
  const id = block.id || '';
  const max = block.maxLength || 500;
  return `
    <div class="content-textarea">
      <textarea class="form-textarea" data-field-id="${id}" maxlength="${max}"></textarea>
      <p class="content-textarea__hint">(<span class="content-textarea__remaining" data-counter-for="${id}">${max}</span> characters remaining)</p>
    </div>
  `;
}

// ====== Question content blocks ======

function renderQuestionIntro(block) {
  const number = block.number || '';
  const text = block.text || '';
  const def = block.definition;
  const defHtml = def
    ? `<p class="question-intro__definition">
         <a href="${def.href || '#'}">${def.label || ''}</a>
         <span class="question-intro__definition-tag">(${def.tag || 'PDF'})</span>
       </p>`
    : '';
  // Text is optional: a multi-part question (e.g. Q4) uses the intro for just
  // the "Question N." number, with the prose living in its lettered sub-parts.
  const textHtml = text ? `<p class="question-intro__text">${text}</p>` : '';
  return `
    <header class="question-intro">
      <span class="question-intro__number">${number}</span>
      ${textHtml}
      ${defHtml}
    </header>
  `;
}

function renderCurrencyHeader(block) {
  const subtitle = block.subtitle ? `<p class="currency-header__subtitle">${block.subtitle}</p>` : '';
  const hint = block.hint ? `<p class="currency-header__hint">${block.hint}</p>` : '';
  if (block.lead) {
    return `
      <div class="currency-header currency-header--split">
        <p class="currency-header__lead">${block.lead}</p>
        <div class="currency-header__main">
          <p class="currency-header__title">${block.title || ''}</p>
          ${subtitle}
          ${hint}
        </div>
      </div>
    `;
  }
  return `
    <div class="currency-header">
      <p class="currency-header__title">${block.title || ''}</p>
      ${subtitle}
      ${hint}
    </div>
  `;
}

function renderCurrencyInput(id, opts = {}) {
  const fieldId = id || '';
  const isTotal = !!opts.total;
  // A "count" input (headcount, e.g. Q15) reuses the validation + auto-total
  // machinery but drops the "$" adornment and uses a numeric input mode.
  const plain = opts.symbol === false;
  const sumOf = Array.isArray(opts.sumOf) ? opts.sumOf.join(',') : '';
  const totalClass = isTotal ? ' is-total' : '';
  const wrapClass = plain ? ' currency-input--plain' : '';
  const sumAttr = sumOf ? ` data-sum-of="${escapeAttr(sumOf)}"` : '';
  // Totals are computed from other fields: lock them and skip the tab order.
  const lockAttrs = isTotal ? ' readonly aria-readonly="true" tabindex="-1"' : '';
  const inputmode = opts.inputmode || (plain ? 'numeric' : 'decimal');
  const ariaLabel = opts.ariaLabel || (plain ? 'Value' : 'Amount in thousands of dollars');
  return `
    <div class="currency-input${wrapClass}">
      <input type="text" inputmode="${inputmode}" class="currency-input__field${totalClass}" data-field-id="${fieldId}"${sumAttr}${lockAttrs} aria-label="${ariaLabel}" />
    </div>
    <p class="currency-input__error" data-error-for="${fieldId}" hidden>Enter a number using digits and an optional decimal point.</p>
  `;
}

function renderCurrencyRow(block) {
  const prefix = block.prefix ? `${block.prefix} ` : '';
  // An optional footnote reference decorates the (Confidential) note on
  // confidential rows, otherwise it sits after the row label. The matching
  // footnote text is rendered by `footnote` blocks at the foot of the question.
  const ref = block.footnoteRef
    ? `<sup class="footnote-ref">${block.footnoteRef}</sup>`
    : '';
  const labelRef = block.confidential ? '' : ref;
  const descriptions = (block.description || [])
    .map((para) => `<p class="currency-row__description">${para}</p>`)
    .join('');
  const bullets = (block.bullets && block.bullets.length)
    ? `<ul class="currency-row__bullets">${block.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>`
    : '';
  const confidential = block.confidential
    ? `<p class="currency-row__confidential">(Confidential${ref})</p>`
    : '';
  return `
    <div class="currency-row" data-row-id="${block.id || ''}">
      <div class="currency-row__text">
        <p class="currency-row__label">${prefix}${block.label || ''}${labelRef}</p>
        ${descriptions}
        ${bullets}
      </div>
      <div class="currency-row__input">
        ${renderCurrencyInput(block.id, { total: block.total, sumOf: block.sumOf })}
        ${confidential}
      </div>
    </div>
  `;
}

function renderCurrencyGroup(block) {
  const prefix = block.prefix ? `${block.prefix} ` : '';
  // Optional description paragraphs sit between the group label and its children
  // (e.g. Q12 "b. Software purchases" describes the category before rows 1–2).
  const descriptions = (block.description || [])
    .map((para) => `<p class="currency-group__description">${para}</p>`)
    .join('');
  // Children are dispatched through the general block renderer so a group can
  // hold a non-currency-row child (e.g. the Q1.1 checkbox question under e1).
  const children = (block.children || []).map(renderContentBlock).join('');
  return `
    <div class="currency-group" data-group-id="${block.id || ''}">
      <p class="currency-group__label">${prefix}${block.label || ''}</p>
      ${descriptions}
      <div class="currency-group__children">${children}</div>
    </div>
  `;
}

function renderCheckboxQuestion(block) {
  const items = block.items || [];
  const cols = block.columns || {};
  const headingId = `cq-${items[0] ? items[0].id : 'q'}-heading`;

  const rows = items.map((item) => {
    const prefix = item.prefix ? `${item.prefix} ` : '';
    const labelId = `${item.id}-label`;
    const descId = `${item.id}-desc`;
    const desc = item.description
      ? `<p class="checkbox-question__description" id="${descId}">${item.description}</p>`
      : '';
    const describedBy = item.description ? ` aria-describedby="${descId}"` : '';
    return `
      <label class="checkbox-question__row" for="${item.id}">
        <div class="checkbox-question__text-cell">
          <p class="checkbox-question__label" id="${labelId}">${prefix}${item.label || ''}</p>
          ${desc}
        </div>
        <div class="checkbox-question__check">
          <input type="checkbox" id="${item.id}" data-field-id="${item.id}"
                 aria-labelledby="${labelId}"${describedBy} />
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

// Yes/No branch question (e.g. Q4 part A). The selected radio value can gate a
// following block via a disableIf/showIf rule (op "eq"). Both radios share the
// block id as their `name` and `data-field-id` so the group reads as one field.
function renderYesNoQuestion(block) {
  const prefix = block.prefix ? `${block.prefix} ` : '';
  const id = block.id || '';
  const labelId = `${id}-label`;
  const options = block.options || [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' }
  ];
  const opts = options.map((opt) => `
    <label class="yesno-question__option">
      <input type="radio" name="${id}" value="${escapeAttr(opt.value)}" data-field-id="${id}" />
      <span>${opt.label || ''}</span>
    </label>
  `).join('');
  return `
    <section class="yesno-question" role="radiogroup" aria-labelledby="${labelId}">
      <p class="yesno-question__text" id="${labelId}">${prefix}${block.text || ''}</p>
      <div class="yesno-question__options">${opts}</div>
    </section>
  `;
}

// Serialize a disableIf rule into the data-* attributes refreshConditionals()
// reads. Any wrapper element (subquestion, group) can carry it.
function disableIfAttrs(cond) {
  return cond && cond.field
    ? ` data-disableif-field="${escapeAttr(cond.field)}"`
      + ` data-disableif-op="${escapeAttr(cond.op || 'eq')}"`
      + ` data-disableif-value="${escapeAttr(String(cond.value))}"`
    : '';
}

// A lettered sub-part (e.g. Q4 part B) that wraps its own child blocks. An
// optional disableIf rule greys the surface and disables its inputs when met —
// unlike showIf, the block stays visible. refreshConditionals() applies it.
function renderSubquestion(block) {
  const prefix = block.prefix ? `${block.prefix} ` : '';
  const description = block.description
    ? `<p class="subquestion__description">${block.description}</p>`
    : '';
  const children = (block.content || []).map(renderContentBlock).join('');
  return `
    <section class="subquestion" data-subquestion-id="${block.id || ''}"${disableIfAttrs(block.disableIf)}>
      <p class="subquestion__label">${prefix}${block.text || ''}</p>
      ${description}
      <div class="subquestion__content">${children}</div>
    </section>
  `;
}

// An unlabeled wrapper that groups arbitrary child blocks under one disableIf
// rule (e.g. Q5 greys its clinical-trials definition AND part B together when
// "No" is chosen). The radios that drive the rule stay outside the group.
function renderGroup(block) {
  const children = (block.content || []).map(renderContentBlock).join('');
  return `<div class="content-group" data-group-id="${block.id || ''}"${disableIfAttrs(block.disableIf)}>${children}</div>`;
}

// Multi-column currency table (e.g. Q5 part B: Federal / Nonfederal / Total).
// One CSS grid holds a centered caption spanning the input columns, a
// column-header row, then one data row per item. Total columns reuse
// renderCurrencyInput's is-total + data-sum-of, so recomputeTotals() drives
// them exactly like the single-column totals in Q1–Q3.
function renderCurrencyMatrix(block) {
  const columns = block.columns || [];
  const rows = block.rows || [];
  const n = columns.length;
  // "Banded" field matrices (Q9/Q11/Q14) use explicit grid placement with section
  // bands + bottom-aligned headers + a floored, wider label column. Auto-enabled for
  // many-column matrices (n >= 6); a matrix with fewer columns opts in via
  // `banded: true` (e.g. Q14's 3-column Federal/Nonfederal/Total grid).
  const wide = block.banded === true || n >= 6;
  const gridCols = wide
    ? `minmax(150px, 1.5fr) repeat(${n}, minmax(58px, 1fr))`
    : `minmax(0, 1.4fr) repeat(${n}, minmax(88px, 1fr))`;

  const captionTitle = block.caption ? `<span class="currency-matrix__caption-title">${block.caption}</span>` : '';
  const captionSub = block.captionSub ? `<span class="currency-matrix__caption-sub">${block.captionSub}</span>` : '';
  const hasCaption = !!(block.caption || block.captionSub);

  const colheadHtml = (c) => {
    const ref = c.footnoteRef ? `<sup class="footnote-ref">${c.footnoteRef}</sup>` : '';
    const num = c.prefix ? `<span class="currency-matrix__colhead-num">${c.prefix}</span>` : '';
    return `${num}<span class="currency-matrix__colhead-label">${c.label || ''}${ref}</span>`;
  };
  const labelClasses = (r) =>
    `currency-matrix__rowlabel${r.indent ? ' currency-matrix__rowlabel--indent' : ''}${r.regular ? ' currency-matrix__rowlabel--regular' : ''}`;
  const rowLabelHtml = (r) => {
    const desc = r.description ? `<p class="currency-matrix__row-desc">${r.description}</p>` : '';
    return `<p class="currency-matrix__row-title">${r.label || ''}</p>${desc}`;
  };

  // `plain` matrices hold counts/FTEs, not dollars: drop the "$" and use a
  // decimal input mode (e.g. Q16 FTEs, "round to 1 decimal place").
  const cellExtra = block.plain ? { symbol: false, inputmode: 'decimal' } : {};

  // Wide field matrices (Q9/Q11/Q14) use explicit grid placement so each data row
  // can carry a full-width zebra "band" behind its label and inputs — auto-flow
  // can't place a spanning background on the same track as the row's cells.
  if (wide) {
    const parts = [];
    let gr = 1;
    if (hasCaption) {
      parts.push(`<div class="currency-matrix__caption" style="grid-row:${gr}; grid-column:2 / -1;">${captionTitle}${captionSub}</div>`);
      gr++;
    }
    // The header row (R&D Fields + column headers) sits on a light section band.
    parts.push(`<div class="currency-matrix__band" style="grid-row:${gr}; grid-column:1 / -1;"></div>`);
    parts.push(block.lead
      ? `<div class="currency-matrix__lead" style="grid-row:${gr}; grid-column:1;">${block.lead}</div>`
      : `<div class="currency-matrix__spacer" style="grid-row:${gr}; grid-column:1;"></div>`);
    columns.forEach((c, i) => {
      parts.push(`<div class="currency-matrix__colhead" style="grid-row:${gr}; grid-column:${i + 2};">${colheadHtml(c)}</div>`);
    });
    gr++;
    rows.forEach((r) => {
      if (r.kind === 'group') {
        // A section-group row (e.g. "B. Engineering") also sits on a section band.
        parts.push(`<div class="currency-matrix__band" style="grid-row:${gr}; grid-column:1 / -1;"></div>`);
        parts.push(`<div class="currency-matrix__group" style="grid-row:${gr}; grid-column:1 / -1;">${r.label || ''}</div>`);
        gr++;
        return;
      }
      // Data rows are unshaded; only the header and section-group rows get a band.
      parts.push(`<div class="${labelClasses(r)}" style="grid-row:${gr}; grid-column:1;">${rowLabelHtml(r)}</div>`);
      (r.cells || []).forEach((cell, i) => {
        parts.push(`<div class="currency-matrix__cell" style="grid-row:${gr}; grid-column:${i + 2};">${renderCurrencyInput(cell.id, Object.assign({ total: cell.total, sumOf: cell.sumOf }, cellExtra))}</div>`);
      });
      gr++;
    });
    return `<div class="currency-matrix currency-matrix--banded" style="grid-template-columns: ${gridCols};">${parts.join('')}</div>`;
  }

  // Narrow matrices: original auto-flow layout.
  const captionRow = hasCaption
    ? `<div class="currency-matrix__spacer"></div>`
      + `<div class="currency-matrix__caption" style="grid-column: span ${n};">${captionTitle}${captionSub}</div>`
    : '';
  // The col-1 header cell carries an optional "lead" label (e.g. "Type of
  // research"); otherwise it is an empty spacer aligning the column headers.
  const leadCell = block.lead
    ? `<div class="currency-matrix__lead">${block.lead}</div>`
    : `<div class="currency-matrix__spacer"></div>`;
  const headRow = leadCell + columns.map((c) => `<div class="currency-matrix__colhead">${colheadHtml(c)}</div>`).join('');
  const dataRows = rows.map((r) => {
    // A "group" row (e.g. "B. Engineering") is a full-width section heading with
    // no inputs; it spans every column so the rows below stay column-aligned.
    if (r.kind === 'group') {
      return `<div class="currency-matrix__group">${r.label || ''}</div>`;
    }
    // A totals row (e.g. row d) sets separatorBefore to draw a full-width rule.
    const sep = r.separatorBefore ? `<div class="currency-matrix__divider"></div>` : '';
    const cells = (r.cells || []).map((cell) =>
      `<div class="currency-matrix__cell">${renderCurrencyInput(cell.id, Object.assign({ total: cell.total, sumOf: cell.sumOf }, cellExtra))}</div>`
    ).join('');
    return `${sep}<div class="${labelClasses(r)}">${rowLabelHtml(r)}</div>${cells}`;
  }).join('');

  return `
    <div class="currency-matrix" style="grid-template-columns: ${gridCols};">
      ${captionRow}
      ${headRow}
      ${dataRows}
    </div>
  `;
}

// Write-in list (e.g. Q10: "list up to 10 agencies" + an amount each). A 3-column
// grid: letter prefix, a write-in name field OR a fixed label, and a currency
// amount. Rows with `nameId` render a text input; rows with `label` render
// static text (+ optional description). Amount cells reuse renderCurrencyInput,
// so a `total` row (sumOf the amount ids) is driven by recomputeTotals().
function renderEntryList(block) {
  const rows = block.rows || [];
  const lead = `<div class="entry-list__lead">${block.lead || ''}</div>`;
  const captionTitle = block.caption ? `<span class="entry-list__caption-title">${block.caption}</span>` : '';
  const captionSub = block.captionSub ? `<span class="entry-list__caption-sub">${block.captionSub}</span>` : '';
  const caption = `<div class="entry-list__caption">${captionTitle}${captionSub}</div>`;

  const rowsHtml = rows.map((r) => {
    const prefix = `<span class="entry-list__prefix">${r.prefix || ''}</span>`;
    let nameCell;
    if (r.nameId) {
      nameCell = `<div class="entry-list__name">${renderInput({ id: r.nameId })}</div>`;
    } else {
      const ref = r.footnoteRef ? `<sup class="footnote-ref">${r.footnoteRef}</sup>` : '';
      const desc = r.description ? `<p class="entry-list__desc">${r.description}</p>` : '';
      const labelCls = r.total ? 'entry-list__label entry-list__label--total' : 'entry-list__label';
      nameCell = `<div class="entry-list__name"><p class="${labelCls}">${r.label || ''}${ref}</p>${desc}</div>`;
    }
    const amountCell = `<div class="entry-list__amount">${renderCurrencyInput(r.amountId, { total: r.total, sumOf: r.sumOf })}</div>`;
    return `${prefix}${nameCell}${amountCell}`;
  }).join('');

  return `
    <div class="entry-list">
      ${lead}
      ${caption}
      ${rowsHtml}
    </div>
  `;
}

// Headcount matrix (Q15): a sectioned table of integer counts. Sections A–D
// each render a heading (optionally "(Confidential)") then rows; most rows have
// columns a/b/c (entered) + d (auto total a+b+c). A "researchersOnly" section
// (D) shows only column a plus a note spanning the other columns. Count cells
// reuse renderCurrencyInput({symbol:false}) so validation + recomputeTotals
// apply without the "$". Built as a <table> so section headers and the note
// use native colspan/rowspan.
function renderHeadcountMatrix(block) {
  const columns = block.columns || [];
  const sections = block.sections || [];
  const colCount = columns.length;          // data columns (a,b,c,d)
  const span = colCount + 1;                // + the row-label column

  const headCells = columns.map((c) => {
    const ref = c.footnoteRef ? `<sup class="footnote-ref">${c.footnoteRef}</sup>` : '';
    return `<th scope="col"><span class="headcount-matrix__colnum">${c.prefix || ''}</span>${c.label || ''}${ref}</th>`;
  }).join('');
  const thead = `<thead><tr><td class="headcount-matrix__corner"></td>${headCells}</tr></thead>`;

  const countCell = (id, opts) => `<td class="headcount-matrix__cell">${renderCurrencyInput(id, Object.assign({ symbol: false, ariaLabel: 'Headcount' }, opts))}</td>`;

  const body = sections.map((sec) => {
    let html = '';
    if (sec.heading) {
      const conf = sec.confidential
        ? ` <span class="headcount-matrix__confidential">(Confidential<sup class="footnote-ref">1</sup>)</span>`
        : '';
      html += `<tr class="headcount-matrix__section"><th colspan="${span}" scope="colgroup">${sec.heading}${conf}</th></tr>`;
    }

    const rows = sec.rows || [];
    if (sec.researchersOnly) {
      // Sub-header over column a + a note spanning the remaining columns and all
      // rows below it (rowspan = subhead row + data rows).
      const note = sec.note
        ? `<td class="headcount-matrix__note" colspan="${colCount - 1}" rowspan="${rows.length + 1}">${sec.note}</td>`
        : '';
      html += `<tr class="headcount-matrix__subhead"><td class="headcount-matrix__corner"></td><th scope="col">${sec.subHead || ''}</th>${note}</tr>`;
      html += rows.map((r) =>
        `<tr><th scope="row" class="headcount-matrix__rowlabel">${r.prefix || ''} ${r.label || ''}</th>${countCell(r.ids.a)}</tr>`
      ).join('');
    } else {
      html += rows.map((r) => {
        const labelCls = r.emphasis
          ? 'headcount-matrix__rowlabel headcount-matrix__rowlabel--bold'
          : 'headcount-matrix__rowlabel';
        const cells = countCell(r.ids.a) + countCell(r.ids.b) + countCell(r.ids.c)
          + countCell(r.ids.d, { total: true, sumOf: [r.ids.a, r.ids.b, r.ids.c] });
        return `<tr><th scope="row" class="${labelCls}">${r.prefix || ''} ${r.label || ''}</th>${cells}</tr>`;
      }).join('');
    }
    return html;
  }).join('');

  return `<table class="headcount-matrix">${thead}<tbody>${body}</tbody></table>`;
}

// Generic bordered data table (e.g. the Q6 "Examples" grid shown in a modal).
// `caption` renders as a full-width title row; `columns` are header cells;
// `rows` is an array of cell-arrays. All cell text is author-controlled HTML.
function renderTable(block) {
  const columns = block.columns || [];
  const rows = block.rows || [];
  const colspan = columns.length || 1;
  const titleRow = block.caption
    ? `<tr class="data-table__title"><th colspan="${colspan}" scope="colgroup">${block.caption}</th></tr>`
    : '';
  const headRow = columns.length
    ? `<tr>${columns.map((c) => `<th scope="col">${c}</th>`).join('')}</tr>`
    : '';
  // A row is either an array of cells, or a full-width object:
  //   { full, heading: true } → a spanning header row (same style as the title)
  //   { full }               → a spanning body paragraph (e.g. the Q15
  //                            "Researcher versus R&D technician" comparison).
  const body = rows.map((r) => {
    if (Array.isArray(r)) {
      return `<tr>${r.map((cell) => `<td>${cell}</td>`).join('')}</tr>`;
    }
    if (r.heading) {
      return `<tr class="data-table__title"><th colspan="${colspan}" scope="colgroup">${r.full || ''}</th></tr>`;
    }
    return `<tr><td colspan="${colspan}" class="data-table__full">${r.full || ''}</td></tr>`;
  }).join('');
  return `
    <table class="data-table">
      <thead>${titleRow}${headRow}</thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

// Reusable modal: a native <dialog> opened by any element with
// data-modal-target="<id>". showModal() supplies the dimmed backdrop, focus
// trap, and Esc-to-close; wireModals() adds the X button and click-outside.
// The close affordance (X) sits top-left per the survey design. Drop a
// `modal` block + a matching trigger anywhere to reuse it.
function renderModal(block) {
  const id = block.id || '';
  const label = block.label || block.title || 'Dialog';
  // An optional visible title bar (e.g. Q16 "Examples of FTE Calculations",
  // whose body is prose rather than a table that carries its own caption).
  const labelId = `modal-${id}-title`;
  const titleBar = block.title ? `<h2 class="modal__title" id="${labelId}">${block.title}</h2>` : '';
  const nameAttr = block.title ? ` aria-labelledby="${labelId}"` : ` aria-label="${escapeAttr(label)}"`;
  const children = (block.content || []).map(renderContentBlock).join('');
  return `
    <dialog class="modal" id="modal-${id}"${nameAttr}>
      <div class="modal__panel">
        <button type="button" class="modal__close" data-modal-close aria-label="Close ${escapeAttr(label)}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
        ${titleBar}
        <div class="modal__body">${children}</div>
      </div>
    </dialog>
  `;
}

// "Examples of Disciplines" reference grid shown inside an examples modal (the
// "Examples: Set N" lead links). Each group is a field heading followed by either
// a flat discipline list (e.g. section A) or a set of numbered sub-field blocks
// (e.g. B's nine engineering fields). Lists flow into CSS columns to mirror the
// printed questionnaire's multi-column layout.
function renderExamplesGrid(block) {
  // Optional `note` (e.g. Chemistry's "except Biochemistry…", "I. Other Sciences"
  // guidance) and `noteAfter` (a trailing note below a sub-field's disciplines).
  const note = (text) => text ? `<p class="examples-grid__note">${text}</p>` : '';
  const listOf = (items, extra = '') => (items && items.length)
    ? `<ul class="examples-grid__list${extra}">${items.map((i) => `<li>${i}</li>`).join('')}</ul>` : '';
  const subgroup = (sg) => `
    <div class="examples-grid__subgroup">
      <p class="examples-grid__subheading">${sg.heading || ''}</p>
      ${note(sg.note)}${listOf(sg.items)}${note(sg.noteAfter)}
    </div>`;
  return (block.groups || []).map((g) => {
    const heading = `<h3 class="examples-grid__heading">${g.heading || ''}</h3>`;
    if (Array.isArray(g.subgroups)) {
      return `<section class="examples-grid__group">${heading}${note(g.note)}<div class="examples-grid__flow">${g.subgroups.map(subgroup).join('')}</div></section>`;
    }
    return `<section class="examples-grid__group">${heading}${note(g.note)}${listOf(g.items, ' examples-grid__flow')}</section>`;
  }).join('');
}

function renderComments(block) {
  const id = block.id || '';
  const max = block.maxLength || 1000;
  return `
    <div class="comments-block">
      <label class="comments-block__label" for="${id}">${block.label || 'Comments:'}</label>
      <textarea id="${id}" class="form-textarea" data-field-id="${id}" maxlength="${max}"></textarea>
      <p class="content-textarea__hint">(<span class="content-textarea__remaining" data-counter-for="${id}">${max}</span> characters remaining)</p>
    </div>
  `;
}

function renderContactCard(block) {
  const p = block.prefix || 'contact';
  return `
    <div class="content-contact-card">
      ${renderField({
        label: 'First name, last name',
        inputs: [{ id: `${p}-first-name` }, { id: `${p}-last-name` }]
      })}
      ${renderField({
        label: 'Job title:',
        inputs: [{ id: `${p}-job-title` }]
      })}
      ${renderFieldRow({
        fields: [
          { label: 'Email address:', inputs: [{ id: `${p}-email`, type: 'email' }] },
          { label: 'Phone number:', inputs: [{ id: `${p}-phone` }], ext: { id: `${p}-phone-ext` } }
        ]
      })}
      <div class="content-checkbox-row">
        <label class="content-checkbox">
          <input type="checkbox" data-field-id="${p}-all-email" />
          <span>All email</span>
        </label>
        <label class="content-checkbox">
          <input type="checkbox" data-field-id="${p}-can-log-in" />
          <span>Can log in</span>
        </label>
      </div>
    </div>
  `;
}

function renderAccordion(section) {
  const wrapper = document.createElement('div');
  wrapper.className = 'usa-accordion';

  const headingId = `acc-h-${section.id}`;
  const contentId = `acc-c-${section.id}`;

  const numberCol = section.number ? `${section.number}.` : '';

  wrapper.innerHTML = `
    <h3 class="usa-accordion__heading" id="${headingId}">
      <button class="usa-accordion__button" type="button" aria-expanded="false" aria-controls="${contentId}">
        <span class="accordion-number">${numberCol}</span>
        <span>${section.title}</span>
        <svg class="accordion-chevron" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd"/>
        </svg>
      </button>
    </h3>
    <div id="${contentId}" class="usa-accordion__content" hidden>
      ${renderContentBlocks(section.content)}
    </div>
  `;
  return wrapper;
}

function wireAccordions() {
  document.querySelectorAll('.usa-accordion__button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      const contentId = btn.getAttribute('aria-controls');
      const content = document.getElementById(contentId);
      if (content) {
        if (expanded) {
          content.setAttribute('hidden', '');
        } else {
          content.removeAttribute('hidden');
        }
      }
    });
  });
}

// Prefilled inputs render with a lighter text color. On the user's first edit,
// switch them to the standard dark color to mark the value as user-confirmed.
function wirePrefilledInputs() {
  document.querySelectorAll('.form-input.is-prefilled, .form-textarea.is-prefilled').forEach((el) => {
    const drop = () => el.classList.remove('is-prefilled');
    el.addEventListener('input', drop, { once: true });
  });
}

// Live "N characters remaining" counters for textareas with maxlength.
function wireCharCounters() {
  document.querySelectorAll('.form-textarea[maxlength]').forEach((textarea) => {
    const id = textarea.dataset.fieldId;
    const counter = document.querySelector(`[data-counter-for="${id}"]`);
    if (!counter) return;
    const max = parseInt(textarea.getAttribute('maxlength'), 10);
    const update = () => {
      counter.textContent = String(max - textarea.value.length);
    };
    textarea.addEventListener('input', update);
    update();
  });
}

// ====== Numeric validation + auto-totaling for currency questions ======

// Parse a currency field's raw string into a number.
// Empty counts as "no entry" (valid). Commas are accepted as separators.
// Whole numbers and decimals are valid; anything else is rejected.
function parseAmount(raw) {
  const cleaned = String(raw == null ? '' : raw).replace(/,/g, '').trim();
  if (cleaned === '') return { empty: true, valid: true, value: 0 };
  const looksNumeric = /^(\d+(\.\d*)?|\.\d+)$/.test(cleaned);
  const value = Number(cleaned);
  if (!looksNumeric || !Number.isFinite(value)) {
    return { empty: false, valid: false, value: NaN };
  }
  return { empty: false, valid: true, value };
}

// Format a numeric total for display: thousands separators, up to 2 decimals.
function formatAmount(n) {
  if (!Number.isFinite(n)) return '';
  const rounded = Math.round(n * 100) / 100;
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

// Recompute every read-only total from its data-sum-of source list.
// Totals are walked in document order so a nested subtotal (e.g. Q1 row e.4,
// "Total institutional funds") is resolved before a grand total that sums it.
// A total stays blank until at least one of its sources holds a valid value.
function recomputeTotals() {
  document.querySelectorAll('.currency-input__field.is-total[data-sum-of]').forEach((totalEl) => {
    const ids = totalEl.dataset.sumOf.split(',').map((s) => s.trim()).filter(Boolean);
    let sum = 0;
    let hasEntry = false;
    for (const id of ids) {
      const src = document.querySelector(`.currency-input__field[data-field-id="${id}"]`);
      if (!src) continue;
      const parsed = parseAmount(src.value);
      if (!parsed.empty && parsed.valid) {
        sum += parsed.value;
        hasEntry = true;
      }
    }
    totalEl.value = hasEntry ? formatAmount(sum) : '';
  });
}

// Evaluate one showIf condition. Reads the trigger field's live value (parsed
// the same way currency inputs are) and compares it per the operator. Returns
// true when the dependent block should be visible. Unknown operators fail
// closed (block stays hidden) and warn, rather than silently revealing.
// `field` is an author-controlled id (alphanumerics/hyphens only) interpolated
// directly into a querySelector selector.
function evaluateShowIf(field, op, value) {
  // Radio groups (op "eq"): compare the currently-checked option's value.
  // Nothing checked yet → the rule is unmet.
  if (op === 'eq') {
    const checked = document.querySelector(`[data-field-id="${field}"]:checked`);
    return !!checked && checked.value === String(value);
  }
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

  // disableIf blocks stay visible but grey out and disable their inputs when
  // the rule is met (e.g. Q4 part B when "No medical school" is selected). A
  // gated field is cleared as it disables, so a hidden value can't be
  // ambiguously submitted (same intent as showIf's hide-and-clear).
  let clearedAny = false;
  document.querySelectorAll('[data-disableif-field]').forEach((el) => {
    const disable = evaluateShowIf(
      el.dataset.disableifField,
      el.dataset.disableifOp,
      el.dataset.disableifValue
    );
    el.classList.toggle('is-disabled', disable);
    el.querySelectorAll('input, textarea, select').forEach((field) => {
      field.disabled = disable;
      if (disable && field.value !== '') {
        field.value = '';
        field.classList.remove('is-invalid');
        field.removeAttribute('aria-invalid');
        const errEl = document.querySelector(`.currency-input__error[data-error-for="${field.dataset.fieldId}"]`);
        if (errEl) errEl.hidden = true;
        clearedAny = true;
      }
    });
  });
  // A cleared field may feed a computed total (e.g. Q5 part B's row total),
  // so refresh totals once after the pass.
  if (clearedAny) recomputeTotals();
}

// Validate currency inputs on blur and keep each question's total fields in
// sync. Read-only total fields are skipped — they are driven by recomputeTotals.
function wireCurrencyCalc() {
  document.querySelectorAll('.currency-input__field:not(.is-total)').forEach((el) => {
    const errorEl = document.querySelector(`.currency-input__error[data-error-for="${el.dataset.fieldId}"]`);
    // Clear a prior error the moment the user starts correcting the value.
    el.addEventListener('input', () => {
      if (!el.classList.contains('is-invalid')) return;
      el.classList.remove('is-invalid');
      el.removeAttribute('aria-invalid');
      if (errorEl) errorEl.hidden = true;
    });
    // Validate and re-total once focus leaves the field.
    el.addEventListener('blur', () => {
      const invalid = !parseAmount(el.value).valid;
      el.classList.toggle('is-invalid', invalid);
      if (invalid) {
        el.setAttribute('aria-invalid', 'true');
      } else {
        el.removeAttribute('aria-invalid');
      }
      if (errorEl) errorEl.hidden = !invalid;
      recomputeTotals();
      refreshConditionals();
    });
  });
  // Seed totals from any values already present on load.
  recomputeTotals();
}

// Branch triggers (Yes/No radios) re-evaluate conditionals on change. Currency
// fields already re-evaluate on blur via wireCurrencyCalc, so this covers the
// non-currency trigger inputs that gate a showIf/disableIf block.
function wireConditionalTriggers() {
  document.querySelectorAll('input[type="radio"][data-field-id]').forEach((radio) => {
    radio.addEventListener('change', refreshConditionals);
  });
}

// Wire the reusable modal pattern. Modals are relocated to <body> so a
// collapsed accordion (display:none ancestor) can't suppress the dialog's top
// layer. Triggers open by id; the X button and a click on the dimmed backdrop
// close. Esc is handled natively by <dialog>.
function wireModals() {
  document.querySelectorAll('.modal').forEach((dlg) => {
    if (dlg.parentElement !== document.body) document.body.appendChild(dlg);
    dlg.querySelectorAll('[data-modal-close]').forEach((btn) => {
      btn.addEventListener('click', () => dlg.close());
    });
    // The dialog fills the viewport; a click landing on the dialog itself
    // (not its inner panel) is on the backdrop, so dismiss.
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.close();
    });
  });
  document.querySelectorAll('[data-modal-target]').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      // Triggers may be <a href="#"> (the matrix lead links); stop the jump.
      e.preventDefault();
      const dlg = document.getElementById(`modal-${trigger.getAttribute('data-modal-target')}`);
      if (dlg && typeof dlg.showModal === 'function') dlg.showModal();
    });
  });
}

function showError(message) {
  const main = document.querySelector('.app-main');
  if (main) {
    main.innerHTML = `<div role="alert" style="padding:1rem;background:#FEF2F2;border:1px solid #EF4444;border-radius:0.375rem;color:#7f1d1d;">${message}</div>`;
  }
}

async function start() {
  try {
    const data = await loadSurvey();
    renderPageHeader(data);
    renderSidebar(data);
    renderIssues(data);
    renderChangesCard(data);
    renderGroups(data);
    wireAccordions();
    wirePrefilledInputs();
    wireCharCounters();
    wireCurrencyCalc();
    wireConditionalTriggers();
    wireModals();
    refreshConditionals(); // Seed conditional visibility from initial field values.
  } catch (err) {
    console.error(err);
    showError('Survey could not be loaded. Please refresh the page.');
  }
}

start();
