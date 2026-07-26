// Blackcess shared error/notice UI — replaces raw alert()/confirm() popups
// with styled, dismissible toasts and a reusable confirm dialog.
//
// Usage (after including this script):
//   BlackcessUI.toast('Could not load bookings.', 'error');
//   BlackcessUI.toast('Booking updated.', 'success');
//   const ok = await BlackcessUI.confirm('Delete this flight?', 'This cannot be undone.');

(function () {
  const STYLE_ID = 'blackcess-ui-styles';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #bc-toast-stack {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 360px;
      }
      .bc-toast {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 14px 16px;
        border-radius: 10px;
        font-size: 0.88rem;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        box-shadow: 0 10px 28px rgba(15, 23, 42, 0.16);
        background: #1e293b;
        color: #fff;
        border-left: 4px solid #64748b;
        animation: bc-toast-in 0.25s ease;
      }
      .bc-toast.error { border-left-color: #ef4444; }
      .bc-toast.success { border-left-color: #22c55e; }
      .bc-toast.info { border-left-color: #3b82f6; }
      .bc-toast i { margin-top: 2px; }
      .bc-toast .bc-toast-close {
        margin-left: auto;
        cursor: pointer;
        opacity: 0.6;
        background: none;
        border: none;
        color: inherit;
        font-size: 1rem;
        line-height: 1;
      }
      .bc-toast .bc-toast-close:hover { opacity: 1; }
      @keyframes bc-toast-in {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes bc-toast-out {
        from { opacity: 1; }
        to { opacity: 0; transform: translateX(20px); }
      }

      #bc-confirm-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }
      #bc-confirm-card {
        background: #fff;
        border-radius: 12px;
        max-width: 380px;
        width: 90%;
        padding: 26px;
        box-shadow: 0 20px 48px rgba(0,0,0,0.25);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      #bc-confirm-card h3 { margin-bottom: 8px; color: #0f172a; font-size: 1.05rem; }
      #bc-confirm-card p { color: #64748b; font-size: 0.9rem; margin-bottom: 20px; line-height: 1.5; }
      #bc-confirm-actions { display: flex; gap: 10px; justify-content: flex-end; }
      #bc-confirm-actions button {
        padding: 9px 18px;
        border-radius: 8px;
        font-size: 0.88rem;
        font-weight: 600;
        cursor: pointer;
        border: none;
      }
      #bc-confirm-cancel { background: #f1f5f9; color: #334155; }
      #bc-confirm-ok { background: #ef4444; color: #fff; }
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
