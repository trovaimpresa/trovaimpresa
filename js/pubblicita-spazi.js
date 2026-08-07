// js/pubblicita-spazi.js
// Popola gli spazi pubblicitari della home con annunci pagati per la città attiva.
//
// La città si ricava SOLO da ?citta=X nell'URL.
// Home nazionale (senza ?citta=) = nessuna pubblicità, spazi liberi.
// Niente rilevamento da IP e niente rotazione: la pubblicità è venduta per
// città, un annuncio comprato a Roma si vede SOLO su ?citta=roma.

(function () {
  'use strict';

  var SUPABASE_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY3Zyc2dreWZhdnlreGp4c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTczNTYsImV4cCI6MjA4OTE3MzM1Nn0.o5S0HeDtG-hlCo1zfk4ILqtog7MT8_2B0EyjdiVzBic';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  async function init() {
    // Lista degli spazi presenti in homepage. Gli altri spazi del listino
    // stanno sulle pagine ricerca/profilo/pannelli, gestiti da js/spazi-laterali.js
    var TUTTI_SPAZI = ['hero-sx', 'hero-dx'];

    // 1. Città: solo da ?citta= nell'URL
    var params = new URLSearchParams(window.location.search);
    var citta = (params.get('citta') || '').trim();

    aggiornaTestoCitta(citta);

    // 2. Home nazionale: nessuna pubblicità, spazi liberi e stop.
    if (!citta) {
      aggiornaHrefVuoti(TUTTI_SPAZI, new Set(), '');
      console.log('[pub-spazi] Home nazionale: nessuna pubblicità.');
      return;
    }

    // 3. Client Supabase
    var client = window.sb || window.supabaseClient;
    if (!client) {
      if (!window.supabase || !window.supabase.createClient) {
        console.error('[pub-spazi] Libreria Supabase non caricata.');
        aggiornaHrefVuoti(TUTTI_SPAZI, new Set(), citta);
        return;
      }
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    var oggi = new Date().toISOString().slice(0, 10);
    var venduti = new Set();

    // 4. Annunci pagati e attivi SOLO per la città in URL.
    //    Nessun fallback a rotazione: se per questa città non c'è nessun
    //    annuncio pagato, gli spazi restano liberi.
    var annunci = await queryAnnunci(client, oggi, citta);
    popolaSpazi(annunci, venduti);

    // 5. Spazi rimasti liberi -> href pre-compilato per il form acquisto
    aggiornaHrefVuoti(TUTTI_SPAZI, venduti, citta);

    console.log('[pub-spazi] Città "' + citta + '": '
      + venduti.size + '/' + TUTTI_SPAZI.length + ' spazi pieni.');
  }

  // ---------------------------------------------------------------- dati e DOM

  async function queryAnnunci(client, oggi, citta) {
    try {
      var q = client
        .from('annunci_pubblicitari')
        .select('spazio_id, logo_url, link_url')
        .eq('stato', 'pagato')
        .gte('data_fine', oggi);

      // Sempre filtrato per città: senza città non si mostra nulla.
      if (!citta) return [];
      q = q.ilike('citta', citta);

      var res = await q;
      if (res.error) {
        console.error('[pub-spazi] Errore query:', res.error.message);
        return [];
      }
      return res.data || [];
    } catch (e) {
      console.error('[pub-spazi] Eccezione:', e);
      return [];
    }
  }

  function popolaSpazi(annunci, venduti) {
    for (var i = 0; i < annunci.length; i++) {
      var ann = annunci[i];
      if (venduti.has(ann.spazio_id)) continue;
      var a = document.querySelector('a.pub-link[data-spazio-id="' + ann.spazio_id + '"]');
      if (!a) {
        console.warn('[pub-spazi] Spazio non trovato in DOM:', ann.spazio_id);
        continue;
      }
      venduti.add(ann.spazio_id);
      a.href = ann.link_url || '#';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.setProperty('display', 'flex', 'important');
      a.style.border = 'none';
      a.style.padding = '0';
      var _im = document.createElement('img');
      _im.src = ann.logo_url || '';         /* niente HTML costruito a mano */
      _im.alt = 'Pubblicità';
      _im.loading = 'lazy';
      _im.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;';
      a.innerHTML = ''; a.appendChild(_im);
    }
  }

  // Personalizza il sottotitolo degli spazi liberi con la città attiva.
  function aggiornaTestoCitta(citta) {
    var testo = citta
      ? 'Visibile a chi cerca a ' + citta.charAt(0).toUpperCase() + citta.slice(1)
      : 'Visibile a chi cerca nella tua zona';
    document.querySelectorAll('.rs-c').forEach(function (el) { el.textContent = testo; });
  }

  function aggiornaHrefVuoti(tutti, venduti, citta) {
    var q = citta ? '?citta=' + encodeURIComponent(citta) : '';
    for (var i = 0; i < tutti.length; i++) {
      var sp = tutti[i];
      if (venduti.has(sp)) continue;
      var slot = document.querySelector('a.pub-link[data-spazio-id="' + sp + '"]');
      if (!slot) continue;
      var sid = slot.getAttribute('data-spazio-id');

      if (sid === 'hero-sx' || sid === 'hero-dx') {
        slot.style.setProperty('padding', '0', 'important');
        slot.style.setProperty('border', 'none', 'important');
        slot.style.setProperty('overflow', 'hidden', 'important');
        slot.innerHTML = '<img src="/img/' + sid + '.svg" alt="Spazio pubblicitario disponibile" style="width:100%;height:100%;object-fit:fill;display:block;border-radius:inherit;">';
        slot.removeAttribute('href');
        slot.style.cursor = 'default';
        continue;
      }

      // Slot "extra": restano nascosti finché non vengono venduti.
      if (slot.hasAttribute('data-pub-extra')) {
        slot.style.setProperty('display', 'none', 'important');
        continue;
      }

      // Slot in vetrina: restano visibili come "Il tuo annuncio qui",
      // con il link al form già precompilato sulla città attiva.
      slot.href = '/pubblicita' + q;
    }
  }
})();
