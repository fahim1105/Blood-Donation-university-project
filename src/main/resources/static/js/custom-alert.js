/**
 * custom-alert.js — Custom confirmation dialog matching website theme
 * Usage: await window.customConfirm(title, message, confirmText, cancelText)
 */
(function () {
  // Create modal container
  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'custom-confirm-overlay';
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 100000;
    opacity: 0;
    transition: opacity 250ms ease;
    font-family: 'Space Grotesk', sans-serif;
  `;
  document.body.appendChild(modalOverlay);

  window.customConfirm = function (title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
      // Create modal content
      const modal = document.createElement('div');
      modal.style.cssText = `
        background: #141414;
        border: 1px solid #2a2a2a;
        border-radius: 16px;
        padding: 0;
        max-width: 440px;
        width: 90%;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
        transform: scale(0.9) translateY(20px);
        opacity: 0;
        transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
      `;

      modal.innerHTML = `
        <div style="padding: 24px 24px 20px 24px; border-bottom: 1px solid #2a2a2a;">
          <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #fff; line-height: 1.3;">
            ${title}
          </h3>
        </div>
        <div style="padding: 20px 24px 24px 24px;">
          <p style="margin: 0 0 24px 0; font-size: 0.95rem; font-weight: 400; color: rgba(255, 255, 255, 0.7); line-height: 1.6;">
            ${message}
          </p>
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button id="custom-confirm-cancel" style="
              background: transparent;
              color: rgba(255, 255, 255, 0.5);
              border: 1px solid #2a2a2a;
              padding: 11px 24px;
              border-radius: 10px;
              font-size: 0.9rem;
              font-weight: 600;
              cursor: pointer;
              font-family: 'Space Grotesk', sans-serif;
              transition: all 200ms ease;
            " onmouseover="this.style.color='#fff'; this.style.borderColor='#3a3a3a';" 
               onmouseout="this.style.color='rgba(255, 255, 255, 0.5)'; this.style.borderColor='#2a2a2a';">
              ${cancelText}
            </button>
            <button id="custom-confirm-ok" style="
              background: #DC2626;
              color: #fff;
              border: none;
              padding: 12px 28px;
              border-radius: 10px;
              font-size: 0.9rem;
              font-weight: 600;
              cursor: pointer;
              font-family: 'Space Grotesk', sans-serif;
              transition: all 200ms ease;
              box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3);
            " onmouseover="this.style.background='#b91c1c'; this.style.boxShadow='0 6px 20px rgba(220, 38, 38, 0.4)';" 
               onmouseout="this.style.background='#DC2626'; this.style.boxShadow='0 4px 14px rgba(220, 38, 38, 0.3)';">
              ${confirmText}
            </button>
          </div>
        </div>
      `;

      modalOverlay.appendChild(modal);
      modalOverlay.style.display = 'flex';

      // Animate in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          modalOverlay.style.opacity = '1';
          modal.style.transform = 'scale(1) translateY(0)';
          modal.style.opacity = '1';
        });
      });

      // Handle confirm
      const confirmBtn = modal.querySelector('#custom-confirm-ok');
      const cancelBtn = modal.querySelector('#custom-confirm-cancel');

      const closeModal = (result) => {
        modalOverlay.style.opacity = '0';
        modal.style.transform = 'scale(0.95) translateY(10px)';
        modal.style.opacity = '0';
        
        setTimeout(() => {
          modalOverlay.style.display = 'none';
          modal.remove();
          resolve(result);
        }, 260);
      };

      confirmBtn.addEventListener('click', () => closeModal(true));
      cancelBtn.addEventListener('click', () => closeModal(false));
      
      // Close on overlay click
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          closeModal(false);
        }
      });

      // Close on ESC key
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          closeModal(false);
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);

      // Focus confirm button
      setTimeout(() => confirmBtn.focus(), 100);
    });
  };

  // Custom alert (info/warning/error)
  window.customAlert = function (title, message, type = 'info', buttonText = 'OK') {
    return new Promise((resolve) => {
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };

      const colors = {
        success: { border: 'rgba(34, 197, 94, 0.3)', icon: '#86efac', bg: 'rgba(34, 197, 94, 0.1)' },
        error: { border: 'rgba(220, 38, 38, 0.3)', icon: '#fca5a5', bg: 'rgba(220, 38, 38, 0.1)' },
        warning: { border: 'rgba(245, 158, 11, 0.3)', icon: '#fbbf24', bg: 'rgba(245, 158, 11, 0.1)' },
        info: { border: 'rgba(99, 102, 241, 0.3)', icon: '#a5b4fc', bg: 'rgba(99, 102, 241, 0.1)' }
      };

      const c = colors[type] || colors.info;
      const icon = icons[type] || icons.info;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background: #141414;
        border: 1px solid #2a2a2a;
        border-radius: 16px;
        padding: 0;
        max-width: 440px;
        width: 90%;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
        transform: scale(0.9) translateY(20px);
        opacity: 0;
        transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
      `;

      modal.innerHTML = `
        <div style="padding: 24px 24px 20px 24px; border-bottom: 1px solid #2a2a2a; display: flex; align-items: center; gap: 12px;">
          <div style="
            width: 42px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${c.bg};
            border: 1px solid ${c.border};
            border-radius: 10px;
            font-size: 1.3rem;
            flex-shrink: 0;
          ">
            ${icon}
          </div>
          <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #fff; line-height: 1.3; flex: 1;">
            ${title}
          </h3>
        </div>
        <div style="padding: 20px 24px 24px 24px;">
          <p style="margin: 0 0 24px 0; font-size: 0.95rem; font-weight: 400; color: rgba(255, 255, 255, 0.7); line-height: 1.6;">
            ${message}
          </p>
          <div style="display: flex; justify-content: flex-end;">
            <button id="custom-alert-ok" style="
              background: #DC2626;
              color: #fff;
              border: none;
              padding: 12px 32px;
              border-radius: 10px;
              font-size: 0.9rem;
              font-weight: 600;
              cursor: pointer;
              font-family: 'Space Grotesk', sans-serif;
              transition: all 200ms ease;
              box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3);
            " onmouseover="this.style.background='#b91c1c'; this.style.boxShadow='0 6px 20px rgba(220, 38, 38, 0.4)';" 
               onmouseout="this.style.background='#DC2626'; this.style.boxShadow='0 4px 14px rgba(220, 38, 38, 0.3)';">
              ${buttonText}
            </button>
          </div>
        </div>
      `;

      modalOverlay.appendChild(modal);
      modalOverlay.style.display = 'flex';

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          modalOverlay.style.opacity = '1';
          modal.style.transform = 'scale(1) translateY(0)';
          modal.style.opacity = '1';
        });
      });

      const okBtn = modal.querySelector('#custom-alert-ok');

      const closeModal = () => {
        modalOverlay.style.opacity = '0';
        modal.style.transform = 'scale(0.95) translateY(10px)';
        modal.style.opacity = '0';
        
        setTimeout(() => {
          modalOverlay.style.display = 'none';
          modal.remove();
          resolve();
        }, 260);
      };

      okBtn.addEventListener('click', closeModal);
      
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          closeModal();
        }
      });

      const escHandler = (e) => {
        if (e.key === 'Escape') {
          closeModal();
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);

      setTimeout(() => okBtn.focus(), 100);
    });
  };
})();
