(function () {
  'use strict';

  var STORAGE_KEY = 'cookie_consent';
  var STORAGE_DATE_KEY = 'cookie_consent_date';
  var EXPIRY_DAYS = 365;

  // Definita subito, prima di ogni uscita anticipata: serve proprio a chi ha
  // gia' dato il consenso, che altrimenti non avrebbe modo di tornare indietro.
  // La revoca dev'essere facile quanto il consenso.
  window.riapriBannerCookie = function () {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_DATE_KEY);
    } catch (e) {}
    location.reload();
  };

  // Evento "Lead" per Meta e Google. Va chiamato quando l'utente completa
  // davvero una richiesta di preventivo o un contatto:
  //   tiLead({ tipo: 'Richiesta preventivo', categoria: 'idraulica' })
  // Definito qui in alto perche' serve anche a chi ha gia' dato il consenso
  // e quindi non arriva in fondo a questo file.
  window.tiLead = function (dati) {
    dati = dati || {};
    var payload = {
      content_name: dati.tipo || 'Richiesta preventivo',
      content_category: dati.categoria || 'generico',
      value: dati.valore || 1,
      currency: 'EUR'
    };
    if (typeof window.fbq === 'function') window.fbq('track', 'Lead', payload);
    if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', payload);
  };

  // Se l'utente ha già espresso una scelta, controlla se è scaduta
  try {
    var savedConsent = localStorage.getItem(STORAGE_KEY);
    if (savedConsent) {
      var savedDate = parseInt(localStorage.getItem(STORAGE_DATE_KEY) || '0', 10);
      var daysSince = (Date.now() - savedDate) / (1000 * 60 * 60 * 24);
      if (daysSince < EXPIRY_DAYS) {
        if (savedConsent === 'all') caricaPixel();
        return;
      }
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_DATE_KEY);
    }
  } catch (e) { /* localStorage non disponibile — mostra il banner comunque */ }

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
    '#cookie-banner a { color: #2e78cc; text-decoration: underline; }',
    '#cookie-banner .cb-buttons { display: flex; gap: 10px; flex-wrap: wrap; }',
    '#cookie-banner button {',
    '  cursor: pointer; border: none; border-radius: 6px;',
    '  padding: 14px 28px; font-size: 15px; font-weight: 600; white-space: nowrap;',
    '  transition: opacity .2s;',
    '}',
    '#cookie-banner button:hover { opacity: .85; }',
    '#cb-accept-all { background: #2e78cc; color: #fff; }',
    '#cb-accept-essential { background: transparent; color: #f0f0f0; border: 1px solid #555 !important; }',
    '@media (max-width: 600px) {',
    /* Su telefono il banner deve restare una fascia bassa. Chi arriva dalle
       inserzioni Meta vede prima il pannello "scegli la citta'", non il banner:
       meta' di chi cliccava se ne andava senza mai vedere il sito. */
    '  #cookie-banner { flex-direction: row; flex-wrap: wrap; align-items: center;',
    '    padding: 10px 12px calc(10px + env(safe-area-inset-bottom));',
    '    gap: 8px; font-size: 13px; line-height: 1.35; }',
    '  #cookie-banner p { flex: 1 1 100%; }',
    '  #cookie-banner .cb-buttons { width: 100%; gap: 8px; }',
    '  #cookie-banner button { flex: 1; padding: 11px 8px; font-size: 14px; }',
    '}',
    /* Le barre fisse in basso del sito (preventivo sul profilo, "mostra i risultati"
       nei filtri) stanno anche loro attaccate al fondo: finche' c'e' il banner si
       spostano sopra di lui, invece di finirci sotto e diventare non cliccabili. */
    'body.cb-aperto .cta-bar-mobile, body.cb-aperto .filtri-azioni {',
    '  bottom: var(--cb-altezza, 0px) !important;',
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
      'Usiamo <strong>cookie tecnici</strong> e, solo con il tuo consenso, cookie ' +
      '<strong>statistici</strong> (Google Analytics) e di <strong>profilazione</strong> (Meta). ' +
      'Puoi cambiare idea dal link in fondo alla pagina. ' +
      '<a href="/cookie-policy.html">Cookie Policy</a>.' +
    '</p>' +
    '<div class="cb-buttons">' +
      '<button id="cb-accept-all" aria-label="Accetta tutti i cookie">Accetta tutti</button>' +
      '<button id="cb-accept-essential" aria-label="Accetta solo i cookie tecnici">Solo tecnici</button>' +
    '</div>';

  document.body.appendChild(banner);

  /* segna al resto del sito che il banner c'e' e quanto e' alto */
  function segnaAltezza() {
    try {
      document.body.classList.add('cb-aperto');
      document.documentElement.style.setProperty('--cb-altezza', banner.offsetHeight + 'px');
    } catch (e) {}
  }
  segnaAltezza();
  window.addEventListener('resize', segnaAltezza);

  function saveConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
      localStorage.setItem(STORAGE_DATE_KEY, String(Date.now()));
    } catch (e) {}
    banner.style.transition = 'opacity .3s';
    banner.style.opacity = '0';
    setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
      try {
        document.body.classList.remove('cb-aperto');
        document.documentElement.style.removeProperty('--cb-altezza');
      } catch (e) {}
    }, 320);
  }

  document.getElementById('cb-accept-all').addEventListener('click', function () {
    saveConsent('all');
    sbloccaAnalytics();
    caricaPixel();
  });

  document.getElementById('cb-accept-essential').addEventListener('click', function () {
    saveConsent('essential');
  });

  // Comunica a Google Consent Mode che il consenso e' arrivato. Senza questo
  // Analytics resterebbe bloccato dal blocco 'default: denied' nella pagina.
  function sbloccaAnalytics() {
    if (typeof window.gtag !== 'function') return;
    window.gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted'
    });
  }

  function caricaPixel() {
    if (window.fbq) return;
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '4290849067798148');
    fbq('track', 'PageView');
  }
})();
