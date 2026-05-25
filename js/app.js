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
    `You've completed <strong>${data.completedCount} out of ${data.totalSidebarSections}</strong> questions.`;
}

function renderSidebar(data) {
  const list = document.getElementById('sidebar-list');
  list.innerHTML = '';

  const items = flattenSidebarSections(data.groups);
  for (const section of items) {
    const li = document.createElement('li');
    const numberText = section.number ? String(section.number) + '.' : '';
    const status = section.demoStatus || 'not-started';
    li.innerHTML = `
      <button class="sidebar-item" type="button" data-section-id="${section.id}">
        <span class="sidebar-item__number">${numberText}</span>
        <span class="sidebar-item__label">${section.title}</span>
        <span class="sidebar-item__status">${statusBadge(status)}</span>
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
  return `
    <div class="content-field${inline}">
      <label class="content-field__label">${block.label || ''}</label>
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
  } catch (err) {
    console.error(err);
    showError('Survey could not be loaded. Please refresh the page.');
  }
}

start();
