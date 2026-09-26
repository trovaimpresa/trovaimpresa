/* 26 set 2026 — pagine delle citta' e pagine mestiere + citta': le faccine
   delle carte delle guide prezzi diventano icone disegnate, come nel resto
   del sito. Solo aspetto. Va con css/pagine-citta.css. */
(function () {
  var S = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var IC = {
    casa: '<path d="M3 11 12 3l9 8"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    bagno: '<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M6 12V6a2 2 0 0 1 4 0"/><path d="M7 19l-1 2M17 19l1 2"/>',
    elettrico: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    idraulico: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',
    tetto: '<path d="M2 14 12 5l10 9"/><path d="M5 12v2M19 12v2"/><path d="M6 17h12M8 20h8"/>',
    cappotto: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M3 14h18M9 4v5M15 9v5M9 14v6"/>',
    infissi: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v18M4 12h16"/>',
    pittura: '<path d="M4 4h13v5H4z"/><path d="M17 6.5h3v5h-8v3"/><path d="M11 14.5h2V21h-2z"/>',
    cucina: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M8 13h.01M12 13h.01M16 13h.01"/>',
    pavimento: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    caldaia: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="11" r="3"/><path d="M9 18h6"/>',
    muro: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M3 14h18M9 4v5M15 9v5M9 14v6"/>',
    guida: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>'
  };
  var PAROLE = [
    [/bagno|vasca|doccia/, 'bagno'], [/elettric|fotovolta/, 'elettrico'], [/idraul/, 'idraulico'],
    [/tetto/, 'tetto'], [/cappotto|facciata/, 'cappotto'], [/infissi/, 'infissi'], [/imbiancare|pittur/, 'pittura'],
    [/cucina/, 'cucina'], [/pavimento/, 'pavimento'], [/caldaia|condizionatore/, 'caldaia'], [/muro|muratore|cartongesso/, 'muro'],
    [/ristruttur/, 'casa']
  ];
  var FACCINA = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  function avvio() {
    var carte = document.querySelectorAll('.cat-card');
    for (var i = 0; i < carte.length; i++) {
      var ic = carte[i].querySelector('.cat-icon');
      if (!ic || ic.querySelector('svg') || !FACCINA.test(ic.textContent)) continue;
      var h = (carte[i].getAttribute('href') || '') + ' ' + carte[i].textContent.toLowerCase(), k = 'guida';
      for (var j = 0; j < PAROLE.length; j++) if (PAROLE[j][0].test(h)) { k = PAROLE[j][1]; break; }
      ic.innerHTML = S + IC[k] + '</svg>';
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvio); else avvio();
})();
