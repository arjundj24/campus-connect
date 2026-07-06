function showToast(message, type = 'info') {
    let toastContainer = document.getElementById('toastContainer');
  
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toastContainer';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
  
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
  
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
  
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <p>${message}</p>
      <button type="button" class="toast-close" aria-label="Close notification">×</button>
    `;
  
    toastContainer.appendChild(toast);
  
    const closeButton = toast.querySelector('.toast-close');
  
    closeButton.addEventListener('click', function () {
      removeToast(toast);
    });
  
    setTimeout(function () {
      removeToast(toast);
    }, 4200);
  }
  
  function removeToast(toast) {
    if (!toast) {
      return;
    }
  
    toast.classList.add('toast-hide');
  
    setTimeout(function () {
      toast.remove();
    }, 250);
  }
  
  function setButtonLoading(button, isLoading, loadingText = 'Processing...') {
    if (!button) {
      return;
    }
  
    if (isLoading) {
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent;
      }
  
      button.textContent = loadingText;
      button.disabled = true;
      button.classList.add('btn-loading');
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.disabled = false;
      button.classList.remove('btn-loading');
      delete button.dataset.originalText;
    }
  }
  
  function showConfirmModal(options = {}) {
    return new Promise(function (resolve) {
      const title = options.title || 'Are you sure?';
      const message = options.message || 'Please confirm this action.';
      const confirmText = options.confirmText || 'Confirm';
      const cancelText = options.cancelText || 'Cancel';
      const type = options.type || 'warning';
  
      let confirmOverlay = document.getElementById('confirmModalOverlay');
  
      if (!confirmOverlay) {
        confirmOverlay = document.createElement('div');
        confirmOverlay.id = 'confirmModalOverlay';
        confirmOverlay.className = 'confirm-modal-overlay hidden';
  
        confirmOverlay.innerHTML = `
          <div class="confirm-modal-box">
            <div class="confirm-modal-icon" id="confirmModalIcon">⚠️</div>
            <h2 id="confirmModalTitle">Are you sure?</h2>
            <p id="confirmModalMessage">Please confirm this action.</p>
            <div class="confirm-modal-actions">
              <button type="button" class="confirm-cancel-btn" id="confirmCancelBtn">Cancel</button>
              <button type="button" class="confirm-ok-btn" id="confirmOkBtn">Confirm</button>
            </div>
          </div>
        `;
  
        document.body.appendChild(confirmOverlay);
      }
  
      const iconElement = document.getElementById('confirmModalIcon');
      const titleElement = document.getElementById('confirmModalTitle');
      const messageElement = document.getElementById('confirmModalMessage');
      const cancelButton = document.getElementById('confirmCancelBtn');
      const confirmButton = document.getElementById('confirmOkBtn');
  
      const icons = {
        warning: '⚠️',
        danger: '🗑️',
        info: 'ℹ️',
        success: '✅'
      };
  
      iconElement.textContent = icons[type] || icons.warning;
      titleElement.textContent = title;
      messageElement.textContent = message;
      cancelButton.textContent = cancelText;
      confirmButton.textContent = confirmText;
  
      confirmButton.className = `confirm-ok-btn confirm-${type}`;
  
      confirmOverlay.classList.remove('hidden');
  
      function cleanup(result) {
        confirmOverlay.classList.add('hidden');
        confirmButton.removeEventListener('click', onConfirm);
        cancelButton.removeEventListener('click', onCancel);
        confirmOverlay.removeEventListener('click', onOverlayClick);
        document.removeEventListener('keydown', onKeyDown);
        resolve(result);
      }
  
      function onConfirm() {
        cleanup(true);
      }
  
      function onCancel() {
        cleanup(false);
      }
  
      function onOverlayClick(event) {
        if (event.target === confirmOverlay) {
          cleanup(false);
        }
      }
  
      function onKeyDown(event) {
        if (event.key === 'Escape') {
          cleanup(false);
        }
      }
  
      confirmButton.addEventListener('click', onConfirm);
      cancelButton.addEventListener('click', onCancel);
      confirmOverlay.addEventListener('click', onOverlayClick);
      document.addEventListener('keydown', onKeyDown);
    });
  }
  