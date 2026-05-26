/**
 * pubblicita-spazi.js
 * Mostra gli spazi pubblicitari acquistati su una pagina città.
 *
 * Legge la città dalla pagina, interroga `annunci_pubblicitari`
 * (stato = 'pagato') per quella città e riempie i container
 * #pub-sinistra e #pub-destra con 8 righe ciascuno:
 *   - slot venduto  -> logo cliccabile che porta a link_url
 *   - slot vuoto     -> "Spazio disponibile" che porta a /pubblicita
 *
 * I valori di `lato` sono quelli scritti da pubblicita.html: 'sinistra' / 'destra'.
 * Se i container non esistono, lo script esce senza fare nulla.
 */
(function () {
  'use strict';

  var RIGHE = 8;

  // Credenziali pubbliche (anon) usate come ultima risorsa se nella pagina
  // non è già presente un client Supabase. Sono le stesse esposte in pubblicita.html.
  var FALLBACK_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co';
  var FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY3Zyc2dreWZhdnlreGp4c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTczNTYsImV4cCI6MjA4OTE3MzM1Nn0.o5S0HeDtG-hlCo1zfk4ILqtog7MT8_2B0EyjdiVzBic';

  // Trova il client Supabase già presente nella pagina; se assente, ne crea uno.
  function getClient() {
    var candidati = [window.supabaseClient, window.sb, window._supabase];
    for (var i = 0; i < candidati.length; i++) {
      if (candidati[i] && typeof candidati[i].from === 'function') return candidati[i];
    }
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      var url = (typeof SUPABASE_URL !== 'undefined') ? SUPABASE_URL : FALLBACK_URL;
      var key = (typeof SUPABASE_KEY !== 'undefined') ? SUPABASE_KEY : FALLBACK_KEY;
      return window.supabase.createClient(url, key);
    }
    return null;
  }

  // Legge la città: prima da data-citta sui container, poi dal link ?citta=...
  function leggiCitta() {
    var dc = document.getElementById('pub-sinistra') || document.getElementById('pub-destra');
    if (dc && dc.dataset && dc.dataset.citta) return dc.dataset.citta.trim();
    var link = document.querySelector('a[href*="citta="]');
    if (link) {
      try {
        var c = new URL(link.href, location.origin).searchParams.get('citta');
        if (c) return c.trim();
      } catch (e) { /* ignora href non parsabili */ }
    }
    return null;
  }

  // Costruisce un singolo slot (venduto o vuoto) come nodo DOM.
  function creaSlot(annuncio) {
    if (annuncio && annuncio.logo_url) {
      var a = document.createElement('a');
      a.className = 'pub-slot pub-slot-venduto';
      a.href = annuncio.link_url || '#';
      if (annuncio.link_url) { a.target = '_blank'; a.rel = 'noopener'; }
      a.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:60px;padding:8px;border:1px solid rgba(0,0,0,0.08);border-radius:10px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.05);text-decoration:none;';

      var img = document.createElement('img');
      img.src = annuncio.logo_url;
      img.alt = 'Pubblicità';
      img.loading = 'lazy';
      img.style.cssText = 'max-width:100%;max-height:48px;object-fit:contain;';
      a.appendChild(img);
      return a;
    }

    var vuoto = document.createElement('a');
    vuoto.className = 'pub-slot pub-slot-vuoto';
    vuoto.href = '/pubblicita';
    vuoto.textContent = 'Spazio disponibile';
    vuoto.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:60px;padding:8px;border:2px dashed #d6d6d6;border-radius:10px;background:#fafafa;color:#999;font-size:12px;font-weight:600;text-align:center;text-decoration:none;';
    return vuoto;
  }

  function renderLato(container, lato, perRiga) {
    container.innerHTML = '';
    for (var r = 1; r <= RIGHE; r++) {
      container.appendChild(creaSlot(perRiga[r] || null));
    }
  }

  async function init() {
    var sinistra = document.getElementById('pub-sinistra');
    var destra = document.getElementById('pub-destra');
    if (!sinistra && !destra) return; // container assenti: esci senza errori

    var client = getClient();
    if (!client) return;

    var citta = leggiCitta();
    if (!citta) return;

    try {
      var res = await client
        .from('annunci_pubblicitari')
        .select('citta,lato,riga,logo_url,link_url')
        .eq('stato', 'pagato')
        .ilike('citta', citta);
      if (res.error) return;

      // Indicizza per lato + riga (primo annuncio vince in caso di duplicati).
      var perLato = { sinistra: {}, destra: {} };
      (res.data || []).forEach(function (ann) {
        var slot = perLato[ann.lato];
        if (slot && !slot[ann.riga]) slot[ann.riga] = ann;
      });

      if (sinistra) renderLato(sinistra, 'sinistra', perLato.sinistra);
      if (destra) renderLato(destra, 'destra', perLato.destra);
    } catch (e) {
      // fallisce in silenzio: gli spazi semplicemente non vengono popolati
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
