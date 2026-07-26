(function () {
  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderStatus(target, options) {
    const container = typeof target === "string" ? document.querySelector(target) : target;
    if (!container) return null;
    const config = {
      type: "info",
      title: "Notice",
      message: "",
      detail: "",
      icon: "fa-circle-info",
      actionLabel: "",
      actionHref: "",
      ...options
    };

    const typeStyles = {
      success: { icon: config.icon || "fa-circle-check", accent: "#37b878" },
      error: { icon: config.icon || "fa-triangle-exclamation", accent: "#f97316" },
      info: { icon: config.icon || "fa-circle-info", accent: "#BA8B02" },
      warning: { icon: config.icon || "fa-bell", accent: "#f59e0b" }
    };
    const style = typeStyles[config.type] || typeStyles.info;

    container.innerHTML = `
      <div class="experience-status-card" style="background: rgba(255,255,255,0.96); border: 1px solid ${style.accent}22; border-left: 5px solid ${style.accent}; border-radius: 16px; padding: 18px; box-shadow: 0 14px 30px rgba(15,23,42,0.08);">
        <div style="display:flex; align-items:flex-start; gap:12px;">
          <div style="width: 42px; height: 42px; border-radius: 50%; display:flex; align-items:center; justify-content:center; background: ${style.accent}16; color:${style.accent}; font-size: 1.1rem; flex-shrink:0;">
            <i class="fas ${style.icon}"></i>
          </div>
          <div style="flex:1; min-width:0;">
            <h4 style="margin:0 0 6px 0; color:#0f172a; font-size:1rem;">${escapeHtml(config.title)}</h4>
            <p style="margin:0 0 6px 0; color:#334155; line-height:1.6;">${escapeHtml(config.message)}</p>
            ${config.detail ? `<p style="margin:0; color:#64748b; font-size:0.9rem; line-height:1.6;">${escapeHtml(config.detail)}</p>` : ""}
            ${config.actionLabel && config.actionHref ? `<a href="${escapeHtml(config.actionHref)}" style="display:inline-flex; align-items:center; gap:6px; margin-top:12px; color:${style.accent}; font-weight:700; text-decoration:none;">${escapeHtml(config.actionLabel)} <i class="fas fa-arrow-right"></i></a>` : ""}
          </div>
        </div>
      </div>
    `;
    return container.firstElementChild;
  }

  function clearStatus(target) {
    const container = typeof target === "string" ? document.querySelector(target) : target;
    if (container) container.innerHTML = "";
  }

  window.BlackcessUI = { renderStatus, clearStatus };
})();
