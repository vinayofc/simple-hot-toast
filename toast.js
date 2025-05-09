(function (global) {
  const containerPositions = {};
  const defaultIcons = {
    success: 'https://minio.host.sdk.li/public/uploads/icons8-check-mark.svg',
    error: 'https://minio.host.sdk.li/public/uploads/icons8-cancel.svg',
  };

  const createContainer = (position) => {
    if (containerPositions[position]) return containerPositions[position];

    const container = document.createElement('div');
    container.className = `toast-container ${position}`;
    container.style.position = 'fixed';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';
    container.style.pointerEvents = 'none';
    container.style.padding = '1rem';

    const [vertical, horizontal] = position.split('-');
    container.style[vertical] = '20px';

    if (horizontal === 'center') {
      container.style.left = '50%';
      container.style.transform = 'translateX(-50%)';
      container.style.alignItems = 'center';
    } else {
      container.style[horizontal] = '20px';
      container.style.transform = 'none';
      container.style.alignItems = horizontal === 'right' ? 'flex-end' : 'flex-start';
    }

    document.body.appendChild(container);
    containerPositions[position] = container;
    return container;
  };

  const buildToast = ({ message, type, icon, duration, html, position, autoCompleteAfter }) => {
    const container = createContainer(position);

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      display: flex;
      align-items: center;
      background: #fff;
      color: #333;
      border-radius: 10px;
      padding: 10px 16px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.08);
      min-width: 240px;
      max-width: 360px;
      font-size: 15px;
      transform: translateY(-12px) scale(0.95);
      opacity: 0;
      transition: all 350ms cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: auto;
      cursor: pointer;
      transform-origin: top right;
    `;

    // Animate in
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0) scale(1)';
    }, 10);

    if (html) {
      toast.innerHTML = html;
    } else if (type === 'loading') {
      toast.innerHTML = `
        <div class="spinner" style="
          width:18px;height:18px;
          border:2px solid #ccc;
          border-top:2px solid #555;
          border-radius:50%;
          margin-right:10px;
          animation: spin 0.8s linear infinite;
        "></div>
        <span>${message}</span>`;
    } else {
      toast.innerHTML = `
        <img src="${icon || defaultIcons[type]}" alt="${type}" style="width:20px;height:20px;margin-right:10px;" />
        <span>${message}</span>`;
    }

    container.appendChild(toast);

    // Click to dismiss
    toast.addEventListener('click', () => removeToast(toast));

    // Auto remove (except loading)
    if (type !== 'loading' && duration !== 0) {
      setTimeout(() => removeToast(toast), duration);
    }

    // Loading timeout override
    if (type === 'loading' && autoCompleteAfter) {
      setTimeout(() => {
        removeToast(toast);
        buildToast({ message: 'Done!', type: 'success', duration: 3000, position });
      }, autoCompleteAfter);
    }

    return toast;
  };

  const removeToast = (toast) => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-12px) scale(0.95)';
    setTimeout(() => toast.remove(), 350);
  };

  const toast = {
    success(msg, opts = {}) {
      return buildToast({ message: msg, type: 'success', duration: 3000, position: 'top-center', ...opts });
    },
    error(msg, opts = {}) {
      return buildToast({ message: msg, type: 'error', duration: 3000, position: 'top-center', ...opts });
    },
    loading(msg, opts = {}) {
      return buildToast({ message: msg, type: 'loading', duration: 0, position: 'top-center', ...opts });
    },
    custom(html, opts = {}) {
      return buildToast({ html, type: 'custom', duration: 3000, position: 'top-center', ...opts });
    },
    promise(promise, { loading, success, error }, opts = {}) {
      const loadingToast = toast.loading(loading, opts);
      promise
        .then((res) => {
          removeToast(loadingToast);
          toast.success(typeof success === 'function' ? success(res) : success, opts);
        })
        .catch((err) => {
          removeToast(loadingToast);
          toast.error(typeof error === 'function' ? error(err) : error, opts);
        });
    }
  };

  // Spinner animation
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  global.toast = toast;
})(window);
