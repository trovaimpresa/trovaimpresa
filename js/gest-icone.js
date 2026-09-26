/* ═══ 26 settembre 2026 — LE FACCINE DEL GESTIONALE DIVENTANO ICONE ═══════
   Alessio non vuole emoji a schermo: su Windows escono disegnate in modo
   diverso da ogni computer, a colori, e fanno sembrare il gestionale un
   giocattolo. Nel codice ce ne sono centinaia (nelle schede, nei pulsanti,
   nei messaggi): riscriverle tutte una per una vorrebbe dire toccare mezzo
   gestionale. Questo file le cambia A SCHERMO, dopo che le sezioni sono
   state disegnate, con le icone a linea che il sito usa gia' (.ti-ic).

   DOVE LAVORA: solo dentro le sezioni (section), le finestre (.sheet),
   i messaggi (.toast) e il riquadro «Da sistemare oggi». Non tocca le
   caselle dove si scrive (input, textarea, select), ne' il selettore delle
   icone dei reparti (.no-ico), ne' i PDF (che non passano da qui).

   Cambia SOLO le faccine che ha nell'elenco MAPPA: una faccina che non
   conosce resta com'e' (meglio una faccina che un buco).

   Va caricato in fondo alla pagina. Non dichiara niente di globale se non
   window.gestIcone (per provarlo a mano). */
(function () {
  var S = '<svg class="ti-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var IC = {
    ok:       '<path d="M20 6 9 17l-5-5"/>',
    avviso:   '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    stop:     '<circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/>',
    cestino:  '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
    matita:   '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    foto:     '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    attrezzo: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
    doc:      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    euro:     '<path d="M18 7a7 7 0 1 0 0 10"/><path d="M4 10h9M4 14h9"/>',
    data:     '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    persona:  '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    pin:      '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    palazzo:  '<path d="M3 21h18M5 21V10M19 21V10M9 21v-7M15 21v-7M2 10l10-7 10 7z"/>',
    mappa:    '<path d="m1 6 7-3 8 3 7-3v15l-7 3-8-3-7 3z"/><path d="M8 3v15M16 6v15"/>',
    camion:   '<path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.3a4 4 0 0 0-1.2-2.9L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    etichetta:'<path d="M20.6 13.4 12 22l-9-9V3h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    orologio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    telefono: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    invia:    '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
    graffetta:'<path d="m21.4 11-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
    link:     '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.7"/>',
    messaggio:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    lucchetto:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    cerca:    '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    carburante:'<path d="M3 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M2 22h14M3 11h12"/><path d="M15 13h2a2 2 0 0 1 2 2v3a2 2 0 0 0 4 0V9l-3-3"/>',
    negozio:  '<path d="M3 9 5 3h14l2 6"/><path d="M4 9v12h16V9M3 9h18M9 21v-6h6v6"/>',
    cassetta: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20"/>',
    muro:     '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M3 14h18M9 4v5M15 9v5M9 14v6"/>',
    calcolo:  '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h4"/>',
    righello: '<path d="M21.3 15.3 8.7 2.7a1 1 0 0 0-1.4 0L2.7 7.3a1 1 0 0 0 0 1.4l12.6 12.6a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4z"/><path d="m7.5 10.5 2-2M10.5 13.5l2-2M13.5 16.5l2-2"/>',
    pennello: '<path d="M18.4 2.6a2 2 0 0 1 2.9 2.9L11 15.8 8.2 13z"/><path d="M8 14c-2 0-4 1.5-4 4 0 1.5-1 2.5-2 3 4 0 7-1.5 7-5z"/>',
    contatti: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 17a4 4 0 0 1 7 0M15 9h3M15 13h3"/>',
    casa:     '<path d="M3 11 12 3l9 8"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    lampo:    '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    idea:     '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
    grafico:  '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
    busta:    '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
    scarica:  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    campana:  '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    tocco:    '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    video:    '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4z"/>',
    stella:   '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>'
  };
  var MAPPA = {
    '✔':'ok','✓':'ok','✅':'ok','☑':'ok','⚠':'avviso','⛔':'stop','🚫':'stop','❌':'stop','🗑':'cestino',
    '✏':'matita','📝':'matita','🖊':'matita','📷':'foto','📸':'foto',
    '🛠':'attrezzo','🔧':'attrezzo','🔨':'attrezzo','⚒':'attrezzo','🪛':'attrezzo',
    '📄':'doc','🧾':'doc','📋':'doc','📑':'doc','📃':'doc','🗂':'doc','📁':'doc',
    '💶':'euro','💰':'euro','💳':'euro','📅':'data','🗓':'data','📆':'data',
    '👷':'persona','👤':'persona','👥':'persona','📌':'pin','📍':'pin','🏛':'palazzo','🏢':'palazzo',
    '🗺':'mappa','🚚':'camion','🚛':'camion','🚐':'camion','🏷':'etichetta','🔖':'etichetta',
    '⏱':'orologio','⏳':'orologio','⌛':'orologio','⏰':'orologio','🕒':'orologio',
    '📞':'telefono','📱':'telefono','📤':'invia','📎':'graffetta','🔗':'link','💬':'messaggio',
    '🔒':'lucchetto','🔐':'lucchetto','🔎':'cerca','🔍':'cerca','⛽':'carburante','🏪':'negozio',
    '🧰':'cassetta','🧱':'muro','🧮':'calcolo','📐':'righello','📏':'righello','🎨':'pennello',
    '📇':'contatti','🏠':'casa','🏡':'casa','⚡':'lampo','✨':'lampo','💡':'idea','📊':'grafico','📈':'grafico',
    '📧':'busta','✉':'busta','📥':'scarica','⬇':'scarica','⭐':'stella','🔔':'campana','🎓':'tocco','🎥':'video','📹':'video','🎬':'video'
  };
  var TROVA = /(⬇|✉|⭐|[☀-➿⌚-⏿]|[\uD83C-\uD83E][\uDC00-\uDFFF])️?/g;
  var SALTA = 'input,textarea,select,option,script,style,svg,.no-ico,[contenteditable="true"]';
  var DOVE = 'section, .sheet, .toast, #rie-alert';

  function cambia(root) {
    if (!root || !root.nodeType) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, lista = [];
    while ((n = w.nextNode())) {
      if (!n.nodeValue || !TROVA.test(n.nodeValue)) continue;
      TROVA.lastIndex = 0;
      var p = n.parentElement;
      if (!p || p.closest(SALTA) || !p.closest(DOVE)) continue;
      lista.push(n);
    }
    lista.forEach(function (t) {
      var testo = t.nodeValue, pezzi = [], ultimo = 0, m, cambiato = false;
      TROVA.lastIndex = 0;
      while ((m = TROVA.exec(testo))) {
        var k = MAPPA[m[1]];
        if (!k) continue;
        pezzi.push(document.createTextNode(testo.slice(ultimo, m.index)));
        var span = document.createElement('span');
        span.className = 'gi-ic';
        span.innerHTML = S + IC[k] + '</svg>';
        pezzi.push(span);
        ultimo = m.index + m[0].length;
        cambiato = true;
      }
      if (!cambiato || !t.parentNode) return;
      pezzi.push(document.createTextNode(testo.slice(ultimo)));
      var f = document.createDocumentFragment();
      pezzi.forEach(function (x) { if (x.nodeType !== 3 || x.nodeValue) f.appendChild(x); });
      t.parentNode.replaceChild(f, t);
    });
  }

  /* le sezioni si ridisegnano di continuo: si ripassa dopo ogni cambio,
     raggruppando i cambi dello stesso momento in un passaggio solo */
  var inAttesa = false;
  function presto() {
    if (inAttesa) return;
    inAttesa = true;
    (window.requestAnimationFrame || setTimeout)(function () {
      inAttesa = false;
      oss.disconnect();
      try { cambia(document.body); } catch (e) {}
      oss.observe(document.body, { childList: true, subtree: true, characterData: true });
    });
  }
  var oss = new MutationObserver(presto);
  function avvio() {
    var st = document.createElement('style');
    st.textContent = '.gi-ic{display:inline-flex;vertical-align:-.15em;margin:0 .12em}.gi-ic .ti-ic{width:1.05em;height:1.05em}';
    document.head.appendChild(st);
    presto();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvio); else avvio();
  window.gestIcone = cambia;
})();
