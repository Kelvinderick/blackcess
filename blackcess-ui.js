// Blackcess shared error/notice UI — 
(function () {
  const STYLE_ID = 'blackcess-ui-styles';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #bc-toast-stack {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 380px;
        width: calc(100% - 48px);
        pointer-events: none;
      }

      .bc-toast {
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 0.9rem;
        font-weight: 500;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
        background: #ffffff;
        color: #0f172a;
        border: 1px solid #e2e8f0;
        animation: bc-toast-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      /* Icons & Status Colors */
      .bc-toast i {
        font-size: 1.1rem;
        flex-shrink: 0;
      }
      .bc-toast.error i { color: #f43f5e; }
      .bc-toast.success i { color: #10b981; }
      .bc-toast.info i { color: #0284c7; }

      .bc-toast span {
        flex-grow: 1;
        line-height: 1.4;
      }

      .bc-toast .bc-toast-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 6px;
        margin-left: 4px;
        cursor: pointer;
        color: #94a3b8;
        background: transparent;
        border: none;
        font-size: 1.1rem;
        transition: all 0.15s ease;
      }
      .bc-toast .bc-toast-close:hover {
        background: #f1f5f9;
        color: #475569;
      }

      @keyframes bc-toast-in {
        from { opacity: 0; transform: translateY(-8px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes bc-toast-out {
        from { opacity: 1; transform: translateY(0) scale(1); }
        to { opacity: 0; transform: translateY(-8px) scale(0.96); }
      }

      /* Confirm Modal */
      #bc-confirm-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.35);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: bc-fade-in 0.2s ease;
      }

      #bc-confirm-card {
        background: #ffffff;
        border-radius: 16px;
        max-width: 400px;
        width: 90%;
        padding: 24px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
        border: 1px solid #f1f5f9;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        animation: bc-toast-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }

      #bc-confirm-card h3 {
        margin: 0 0 8px 0;
        color: #0f172a;
        font-size: 1.125rem;
        font-weight: 600;
        letter-spacing: -0.01em;
      }

      #bc-confirm-card p {
        color: #64748b;
        font-size: 0.925rem;
        margin: 0 0 24px 0;
        line-height: 1.5;
      }

      #bc-confirm-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }

      #bc-confirm-actions button {
        padding: 10px 18px;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: all 0.15s ease;
      }

      #bc-confirm-cancel {
        background: #f8fafc;
        color: #475569;
        border: 1px solid #e2e8f0 !important;
      }
      #bc-confirm-cancel:hover {
        background: #f1f5f9;
        color: #0f172a;
      }

      #bc-confirm-ok {
        background: #0f172a;
        color: #ffffff;
      }
      #bc-confirm-ok:hover {
        background: #1e293b;
        transform: translateY(-1px);
      }

      @keyframes bc-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  function getStack() {
    let stack = document.getElementById('bc-toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'bc-toast-stack';
      document.body.appendChild(stack);
    }
    return stack;
  }

  const ICONS = {
    error: 'fa-circle-exclamation',
    success: 'fa-circle-check',
    info: 'fa-circle-info'
  };

  function toast(message, type = 'info', duration = 5000) {
    injectStyles();
    const stack = getStack();

    const el = document.createElement('div');
    el.className = `bc-toast ${type}`;
    el.innerHTML = `
      <i class="fas ${ICONS[type] || ICONS.info}"></i>
      <span>${message}</span>
      <button class="bc-toast-close" aria-label="Dismiss">&times;</button>
    `;

    function remove() {
      el.style.animation = 'bc-toast-out 0.2s ease forwards';
      setTimeout(() => el.remove(), 200);
    }

    el.querySelector('.bc-toast-close').addEventListener('click', remove);
    stack.appendChild(el);

    if (duration > 0) setTimeout(remove, duration);
    return el;
  }

  function confirmDialog(title, body = '') {
    injectStyles();
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.id = 'bc-confirm-overlay';
      overlay.innerHTML = `
        <div id="bc-confirm-card">
          <h3>${title}</h3>
          ${body ? `<p>${body}</p>` : ''}
          <div id="bc-confirm-actions">
            <button id="bc-confirm-cancel">Cancel</button>
            <button id="bc-confirm-ok">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const cleanup = (result) => {
        overlay.remove();
        resolve(result);
      };

      overlay.querySelector('#bc-confirm-cancel').addEventListener('click', () => cleanup(false));
      overlay.querySelector('#bc-confirm-ok').addEventListener('click', () => cleanup(true));
      overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(false); });
    });
  }

  window.BlackcessUI = { toast, confirm: confirmDialog };
})();