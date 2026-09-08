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
  var SUPABASE_ANON_KEY = 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';

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

    // 8 set 2026 — UN PADRONE SOLO. Nella pagina citta' gli spazi li riempie
    // js/spazi-citta.js: qui ci si ferma dopo aver scritto la citta'. Prima
    // erano in due a mettere e togliere immagini negli stessi riquadri, e
    // vinceva chi arrivava per ultimo: cosi' le locandine in alto finivano
    // sostituite dal vecchio cartello "spazio disponibile".
    // Non ci si puo' fidare solo della bandiera: questo file parte PRIMA di
    // js/spazi-citta.js (l'ordine dei <script> in fondo a index.html), quindi
    // in questo momento la bandiera potrebbe non essere ancora stata messa.
    // Si guarda anche se la pagina carica quel file: quello e' li' dall'inizio.
    var comandaAltro = window.SPAZI_CITTA_COMANDA
      || !!document.querySelector('script[src*="spazi-citta.js"]');
    if (comandaAltro) {
      console.log('[pub-spazi] Pagina citta: comanda js/spazi-citta.js, qui non tocco niente.');
      return;
    }

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
        .select('spazio_id, logo_url, link_url, impresa_id')
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
      a.href = ann.link_url || (ann.impresa_id ? '/profilo-impresa.html?id=' + ann.impresa_id : '#');
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
        // ⛔ 8 set 2026 — segnalato da Alex: nella pagina citta' le due
        // locandine in alto erano quelle sbagliate. Qui sotto veniva rimesso
        // il vecchio cartello "SPAZIO PUBBLICITARIO" SOPRA la locandina che
        // js/spazi-citta.js aveva gia' messo (questo file gira dopo, perche'
        // aspetta la risposta del database). Due file che decidevano la
        // stessa cosa senza parlarsi: lo stesso difetto del 7 settembre.
        // Adesso: se lo spazio ha gia' una locandina, non si tocca.
        if (slot.getAttribute('data-locandina')) continue;
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
