/* 26 set 2026 — pagine di ricerca: le icone disegnate al posto delle
   faccine nelle schede dei risultati, e la riga azzurra sotto la fascia
   che sale dentro la fascia. Solo aspetto: non tocca la ricerca.
   Va con css/cerca-volume.css. */
(function(){
  var S = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var IC = {
    pin:   '<svg '+S+'><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    stella:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/></svg>',
    diam:  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 3h12l4 6-10 12L2 9z"/></svg>',
    casa:  '<svg '+S+'><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1z"/><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M4 15v-3a6 6 0 0 1 6-6"/><path d="M14 6a6 6 0 0 1 6 6v3"/></svg>',
    attr:  '<svg '+S+'><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    pers:  '<svg '+S+'><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
    doc:   '<svg '+S+'><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
    palazzo:'<svg '+S+'><path d="M3 21h18M5 21V10M19 21V10M9 21v-7M15 21v-7M2 10l10-6 10 6"/></svg>',
    cerca: '<svg '+S+'><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    scudo: '<svg '+S+'><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    foglia:'<svg '+S+'><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/></svg>',
    cartella:'<svg '+S+'><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/></svg>'
  };
  // faccina -> disegno. Quelle che non sono in elenco si tolgono e basta.
  var MAPPA = { '👔':'pers','🦺':'scudo','🌿':'foglia','📁':'cartella','🔍':'cerca','📍':'pin','🔨':'attr','🔧':'attr','🏗':'casa','🏛':'palazzo','📋':'doc','⭐':'stella','💎':'diam' };
  function iconaDi(e){ var k = MAPPA[e.replace(/\uFE0F/g,'')]; return k ? IC[k] : ''; }
  // cambia le faccine dentro i testi di un pezzo di pagina, senza toccare
  // i pulsanti e i loro clic: si lavora solo sui nodi di testo.
  function faccineInIcone(root){
    if (!root) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), testi = [], n;
    while ((n = w.nextNode())) if (HA_EMOJI.test(n.nodeValue)) testi.push(n);
    testi.forEach(function(t){
      var p = t.parentNode; if (!p || /^(SCRIPT|STYLE|OPTION|TEXTAREA|INPUT|SELECT)$/.test(p.nodeName)) return;
      if (/^[\s\u2605\u2606]+$/.test(t.nodeValue)) return;   // le stelline ★ dei filtri restano
      var pezzi = t.nodeValue.split(/([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B55}]\uFE0F?)/u), frag = document.createDocumentFragment();
      pezzi.forEach(function(x, i){
        if (i % 2 === 0){ if (x) frag.appendChild(document.createTextNode(i === 2 && pezzi[0].trim()==='' ? x.replace(/^\s+/, ' ') : x)); return; }
        var svg = iconaDi(x); if (!svg) return;
        var s = document.createElement('span'); s.className = 'cv-ic'; s.innerHTML = svg; frag.appendChild(s);
      });
      p.replaceChild(frag, t);
    });
  }
  var PAG = location.pathname;
  var ICONA_TIPO = /professionist/.test(PAG) ? IC.pers : (/artigian/.test(PAG) ? IC.attr : IC.casa);
  var EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B55}]️?/gu;
  var HA_EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B55}]/u;

  function via(t){ return t.replace(EMOJI,'').replace(/^\s+/,''); }
  function testoSolo(el, re){ // toglie le faccine SOLO dai testi diretti
    for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3) n.nodeValue = n.nodeValue.replace(re || EMOJI, '');
  }

  function sistemaCarta(c){
    if (c.dataset.cv) return; c.dataset.cv = '1';
    var logo = c.querySelector('.card-logo');
    if (logo && !logo.querySelector('img')) logo.innerHTML = ICONA_TIPO;
    var b = c.querySelector('.badge-premium'); if (b) b.innerHTML = IC.diam + 'Premium';
    c.querySelectorAll('.card-mestiere, .card-tipo').forEach(function(m){
      var t = via(m.textContent).trim();
      if (!t) { m.remove(); return; }
      m.innerHTML = ICONA_TIPO; m.appendChild(document.createTextNode(t));
    });
    var al = c.querySelector('.albo-tag'); if (al){ var ta = via(al.textContent).trim(); al.innerHTML = IC.doc; al.appendChild(document.createTextNode(ta)); }
    var ci = c.querySelector('.card-citta');
    if (ci){
      // la citta' (testo diretto) con la sua puntina
      var nome = ''; for (var n = ci.firstChild; n; n = n.nextSibling) if (n.nodeType === 3){ nome += n.nodeValue; n.nodeValue = ''; }
      nome = via(nome).trim();
      if (nome){ var s = document.createElement('span'); s.className = 'cv-pin'; s.innerHTML = IC.pin; s.appendChild(document.createTextNode(nome)); ci.insertBefore(s, ci.firstChild); }
      ci.querySelectorAll('span').forEach(function(sp){
        if (sp.classList.contains('cv-pin')) return;
        var t = sp.textContent;
        if (/📍/.test(t)){ sp.innerHTML = IC.pin; sp.appendChild(document.createTextNode(via(t).trim())); }
        else if (/⭐/.test(t)){ sp.innerHTML = IC.stella; sp.appendChild(document.createTextNode(via(t).trim())); sp.style.color = '#b45309'; sp.style.background = '#fff7e6'; }
      });
    }
  }

  function sistemaAltro(root){
    // «Nessun risultato», «Ricerca in corso»…: via le faccine dai titoli e dai testi
    root.querySelectorAll('.no-results h3, .no-results p, .loading').forEach(function(el){ testoSolo(el); });
  }

  function giro(){
    var r = document.getElementById('risultati'); if (!r) return;
    r.querySelectorAll('.card').forEach(sistemaCarta);
    sistemaAltro(r);
    faccineInIcone(document.querySelector('.results-header'));
    document.querySelectorAll('.filter-chip, #filtri-attivi, .filtri-attivi').forEach(faccineInIcone);
  }

  function avvio(){
    // la riga azzurra sotto la fascia sale dentro la fascia, sotto il titolo
    var bar = document.querySelector('.top-bar'), h1 = bar && bar.querySelector('h1');
    var h2 = bar && bar.nextElementSibling;
    if (h1 && h2 && h2.tagName === 'H2' && !document.querySelector('.cv-sotto')){
      var box = document.createElement('div');
      bar.insertBefore(box, h1); box.appendChild(h1);
      var p = document.createElement('p'); p.className = 'cv-sotto'; p.textContent = h2.textContent; box.appendChild(p);
      h2.classList.add('cv-h2-vecchio');
    }
    // le faccine rimaste nel titolo, nei filtri e sopra i risultati
    var h = document.querySelector('.top-bar h1');
    if (h && !h.querySelector('svg')){
      var m = h.firstChild && h.firstChild.nodeType === 3 && h.firstChild.nodeValue.match(/^\s*([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\uFE0F?)\s*/u);
      if (m){ var svg = iconaDi(m[1]) || ICONA_TIPO; h.firstChild.nodeValue = h.firstChild.nodeValue.slice(m[0].length); h.insertAdjacentHTML('afterbegin', svg.replace('<svg ','<svg class="ti-ic" ')); }
    }
    faccineInIcone(document.querySelector('.sidebar'));
    faccineInIcone(document.querySelector('.results-header'));
    // «Mostra i imprese»
    document.querySelectorAll('.filtri-azioni button').forEach(function(b){ if (/Mostra i imprese/.test(b.textContent)) b.textContent = 'Mostra le imprese'; });
    var r = document.getElementById('risultati');
    if (r && 'MutationObserver' in window){
      var mo = new MutationObserver(function(){ mo.disconnect(); giro(); attacca(); });
      var attacca = function(){ mo.observe(document.querySelector('.results-col') || r, { childList:true, subtree:true }); };
      attacca();
      var sb = document.querySelector('.sidebar');
      if (sb){ var ms = new MutationObserver(function(){ ms.disconnect(); faccineInIcone(sb); ms.observe(sb,{childList:true,subtree:true}); }); ms.observe(sb,{childList:true,subtree:true}); }
    }
    giro();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvio); else avvio();
})();
