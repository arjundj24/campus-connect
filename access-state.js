function getAccessStateHTML(options = {}) {
    const title = options.title || 'Access Restricted';
    const message = options.message || 'You do not have permission to view this page.';
    const icon = options.icon || '🔒';
    const actions = options.actions || [];
  
    const actionHTML = actions.map(function (action) {
      return `<a class="${action.className || 'report-btn user-page-link'}" href="${action.href}">${action.label}</a>`;
    }).join('');
  
    return `
      <div class="access-state-card">
        <div class="access-state-icon">${icon}</div>
        <h2>${title}</h2>
        <p>${message}</p>
        ${actionHTML ? `<div class="access-state-actions">${actionHTML}</div>` : ''}
      </div>
    `;
  }
  
  function renderAccessState(container, options = {}) {
    if (!container) {
      return;
    }
  
    container.innerHTML = getAccessStateHTML(options);
  }
  