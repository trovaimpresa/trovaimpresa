(function () {
  'use strict';

  var STORAGE_KEY = 'cookie_consent';

  // Se l'utente ha già espresso una scelta, non mostrare il banner
  if (localStorage.getItem(STORAGE_KEY)) return;

  var style = document.createElement('style');
  style.textContent = [
    '#cookie-banner {',
    '  position: fixed; bottom: 0; left: 0; right: 0; z-index: 99999;',
    '  background: #1a1a2e; color: #f0f0f0;',
    '  padding: 24px 32px;',
    '  display: flex; flex-wrap: wrap; align-items: center; gap: 14px;',
    '  box-shadow: 0 -4px 20px rgba(0,0,0,0.3);',
    '  font-family: "Segoe UI", sans-serif; font-size: 16px; line-height: 1.5;',
    '}',
    '#cookie-banner p { flex: 1 1 300px; margin: 0; }',
    '#cookie-banner a { color: #2ecc71; text-decoration: underline; }',
    '#cookie-banner .cb-buttons { display: flex; gap: 10px; flex-wrap: wrap; }',
    '#cookie-banner button {',
    '  cursor: pointer; border: none; border-radius: 6px;',
    '  padding: 14px 28px; font-size: 15px; font-weight: 600; white-space: nowrap;',
    '  transition: opacity .2s;',
    '}',
    '#cookie-banner button:hover { opacity: .85; }',
    '#cb-accept-all { background: #2ecc71; color: #fff; }',
    '#cb-accept-essential { background: transparent; color: #f0f0f0; border: 1px solid #555 !important; }',
    '@media (max-width: 600px) {',
    '  #cookie-banner { flex-direction: column; align-items: flex-start; padding: 16px; }',
    '  #cookie-banner .cb-buttons { width: 100%; }',
    '  #cookie-banner button { flex: 1; }',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  var banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-live', 'polite');
  banner.setAttribute('aria-label', 'Consenso cookie');
  banner.innerHTML =
    '<p>' +
      'Utilizziamo <strong>cookie tecnici</strong> necessari al funzionamento del sito e, previo consenso, cookie analitici con IP anonimizzato. ' +
      'Per maggiori informazioni consulta la nostra <a href="/cookie-policy.html">Cookie Policy</a>.' +
    '</p>' +
    '<div class="cb-buttons">' +
      '<button id="cb-accept-all" aria-label="Accetta tutti i cookie">Accetta tutti</button>' +
      '<button id="cb-accept-essential" aria-label="Accetta solo i cookie tecnici">Solo tecnici</button>' +
    '</div>';

  document.body.appendChild(banner);

  function saveConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {}
    banner.style.transition = 'opacity .3s';
    banner.style.opacity = '0';
    setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 320);
  }

  document.getElementById('cb-accept-all').addEventListener('click', function () {
    saveConsent('all');
  });

  document.getElementById('cb-accept-essential').addEventListener('click', function () {
    saveConsent('essential');
  });
})();
