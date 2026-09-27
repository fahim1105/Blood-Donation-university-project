/**
 * toast.js — Global toast notification system
 * Usage: window.toast('Message', 'success' | 'error' | 'info' | 'warning')
 */
(function () {
  // Inject toast container once
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText = `
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
    font-family: 'Space Grotesk', sans-serif;
  `;
  document.body.appendChild(container);

  const icons = {
    success: '✅',
    error:   '❌',
    warning: '⚠️',
    info:    'ℹ️'
  };

  const colors = {
    success: { bg: 'rgba(20,20,20,0.97)', border: 'rgba(34,197,94,0.4)',  icon: '#86efac' },
    error:   { bg: 'rgba(20,20,20,0.97)', border: 'rgba(220,38,38,0.4)',  icon: '#fca5a5' },
    warning: { bg: 'rgba(20,20,20,0.97)', border: 'rgba(245,158,11,0.4)', icon: '#fbbf24' },
    info:    { bg: 'rgba(20,20,20,0.97)', border: 'rgba(99,102,241,0.4)', icon: '#a5b4fc' }
  };

  window.toast = function (message, type = 'info', duration = 3000) {
    const c = colors[type] || colors.info;
    const el = document.createElement('div');
    el.style.cssText = `
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: ${c.bg};
      border: 1px solid ${c.border};
      border-radius: 10px;
      padding: 12px 18px;
      min-width: 260px;
      max-width: 420px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      pointer-events: auto;
      opacity: 0;
      transform: translateY(12px);
      transition: opacity 250ms ease, transform 250ms ease;
      cursor: pointer;
    `;

    el.innerHTML = `
      <span style="font-size:1rem;flex-shrink:0;">${icons[type] || '•'}</span>
      <div style="font-size:0.85rem;font-weight:500;color:#fff;flex:1;line-height:1.5;">${message}</div>
      <span style="font-size:0.9rem;color:rgba(255,255,255,0.25);flex-shrink:0;">✕</span>
    `;

    el.addEventListener('click', () => dismiss(el));
    container.appendChild(el);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    });

    // Auto dismiss
    const timer = setTimeout(() => dismiss(el), duration);
    el._timer = timer;

    function dismiss(node) {
      clearTimeout(node._timer);
      node.style.opacity = '0';
      node.style.transform = 'translateY(8px)';
      setTimeout(() => node.remove(), 260);
    }

    return el;
  };
})();
