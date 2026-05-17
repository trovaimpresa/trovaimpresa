(function () {
  'use strict';

  var STYLE_ID = 'mfsc-injected-styles';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.modal.is-fullscreen {',
      '  width: 100vw !important;',
      '  height: 100vh !important;',
      '  max-width: none !important;',
      '  max-height: none !important;',
      '  border-radius: 0 !important;',
      '  inset: 0 !important;',
      '  position: fixed !important;',
      '}',
      '.mfsc-btn {',
      '  position: absolute;',
      '  top: 12px;',
      '  right: 48px;',
      '  z-index: 9999;',
      '  background: rgba(0,0,0,0.35);',
      '  color: #fff;',
      '  border: none;',
      '  border-radius: 6px;',
      '  width: 28px;',
      '  height: 28px;',
      '  font-size: 1rem;',
      '  line-height: 1;',
      '  cursor: pointer;',
      '  opacity: 0.85;',
      '  transition: opacity 0.15s;',
      '  display: inline-flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  padding: 0;',
      '}',
      '.mfsc-btn:hover { opacity: 1; }'
    ].join('\n');
    document.head.appendChild(s);
  }

  function addButton(modal) {
    if (modal.querySelector('.mfsc-btn')) return;

    var cs = getComputedStyle(modal);
    if (cs.position === 'static') {
      modal.style.position = 'relative';
    }

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mfsc-btn';
    btn.title = 'Schermo intero';
    btn.textContent = '⛶';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var on = modal.classList.toggle('is-fullscreen');
      btn.textContent = on ? '⊟' : '⛶';
      btn.title = on ? 'Esci da schermo intero' : 'Schermo intero';
    });
    modal.appendChild(btn);
  }

  function init() {
    injectStyles();
    document.querySelectorAll('.modal').forEach(addButton);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
