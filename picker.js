(function() {
  // Prevent duplicate picker injections
  if (window.__adBlockerPickerActive) return;
  window.__adBlockerPickerActive = true;

  // Insert styles for overlay/outline
  const style = document.createElement('style');
  style.id = 'ad-blocker-picker-style';
  style.textContent = `
    .ad-blocker-hover-outline {
      outline: 2px solid #ff453a !important;
      outline-offset: -2px !important;
      cursor: crosshair !important;
      background-color: rgba(255, 69, 58, 0.1) !important;
    }
  `;
  document.head.appendChild(style);

  let hoveredEl = null;

  function onMouseOver(e) {
    e.stopPropagation();
    if (hoveredEl) {
      hoveredEl.classList.remove('ad-blocker-hover-outline');
    }
    hoveredEl = e.target;
    // Don't outline picker elements or body/html
    if (hoveredEl && hoveredEl !== document.body && hoveredEl !== document.documentElement) {
      hoveredEl.classList.add('ad-blocker-hover-outline');
    }
  }

  function onMouseOut(e) {
    e.stopPropagation();
    if (hoveredEl) {
      hoveredEl.classList.remove('ad-blocker-hover-outline');
      hoveredEl = null;
    }
  }

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (hoveredEl) {
      const selector = getSelector(hoveredEl);
      if (selector) {
        // Save selector to storage
        chrome.storage.local.get(['customSelectors'], ({ customSelectors = [] }) => {
          if (!customSelectors.includes(selector)) {
            const updated = [...customSelectors, selector];
            chrome.storage.local.set({ customSelectors: updated }, () => {
              // Dynamically apply hidden style immediately
              let customStyle = document.getElementById('ad-blocker-custom-cosmetics');
              if (!customStyle) {
                customStyle = document.createElement('style');
                customStyle.id = 'ad-blocker-custom-cosmetics';
                document.head.appendChild(customStyle);
              }
              customStyle.textContent = `${updated.join(', ')} { position: absolute !important; left: -99999px !important; opacity: 0 !important; pointer-events: none !important; height: 1px !important; width: 1px !important; }`;
            });
          }
        });
      }
      hoveredEl.classList.remove('ad-blocker-hover-outline');
    }
    
    cleanup();
  }

  function onKeyDown(e) {
    // Escape key cancels the picker
    if (e.key === 'Escape') {
      cleanup();
    }
  }

  function cleanup() {
    window.__adBlockerPickerActive = false;
    document.removeEventListener('mouseover', onMouseOver, true);
    document.removeEventListener('mouseout', onMouseOut, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
    
    const pickerStyle = document.getElementById('ad-blocker-picker-style');
    if (pickerStyle) pickerStyle.remove();
    
    if (hoveredEl) {
      hoveredEl.classList.remove('ad-blocker-hover-outline');
    }
  }

  function getSelector(el) {
    if (el.id) {
      return '#' + el.id;
    }
    if (el.className) {
      const classes = Array.from(el.classList)
        .filter(c => c !== 'ad-blocker-hover-outline')
        .join('.');
      if (classes) {
        const sel = el.tagName.toLowerCase() + '.' + classes;
        try {
          if (document.querySelectorAll(sel).length === 1) return sel;
        } catch (err) {}
      }
    }
    
    let path = [];
    while (el.nodeType === Node.ELEMENT_NODE) {
      let selector = el.nodeName.toLowerCase();
      if (el.id) {
        selector += '#' + el.id;
        path.unshift(selector);
        break;
      } else {
        let sibling = el.previousElementSibling;
        let nth = 1;
        while (sibling) {
          if (sibling.nodeName === el.nodeName) nth++;
          sibling = sibling.previousElementSibling;
        }
        if (nth > 1 || el.nextElementSibling) {
          selector += `:nth-of-type(${nth})`;
        }
      }
      path.unshift(selector);
      el = el.parentNode;
    }
    return path.join(' > ');
  }

  // Bind event listeners with capture = true to intercept standard page actions
  document.addEventListener('mouseover', onMouseOver, true);
  document.addEventListener('mouseout', onMouseOut, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);
})();
