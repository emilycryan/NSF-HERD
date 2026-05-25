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
    default:
      console.warn('[render] Unknown content block type:', block.type);
      return '';
  }
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
  } catch (err) {
    console.error(err);
    showError('Survey could not be loaded. Please refresh the page.');
  }
}

start();
