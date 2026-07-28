// js/pubblicita-spazi.js
// Popola gli spazi pubblicitari della home con annunci pagati per la città attiva.
//
// Come si ricava la città, in ordine:
//   1. ?citta=X nell'URL (l'utente l'ha scritta o ha usato la geolocalizzazione)
//   2. IP del visitatore, via Edge Function Netlify /api/geo (silenzioso, senza permessi)
//   3. Se non si ricava nulla: gli spazi mostrano comunque gli annunci pagati
//      a rotazione, così chi ha comprato uno spazio non resta mai con zero impression.

(function () {
  'use strict';

  var SUPABASE_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY3Zyc2dreWZhdnlreGp4c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTczNTYsImV4cCI6MjA4OTE3MzM1Nn0.o5S0HeDtG-hlCo1zfk4ILqtog7MT8_2B0EyjdiVzBic';

  // Netlify restituisce alcuni nomi di città in inglese: qui li riporto
  // alla forma italiana usata nel DB e nelle pagine /imprese-<citta>.
  // Se in futuro ne trovi altri, aggiungili qui sotto.
  var NOMI_IT = {
    'rome': 'Roma', 'milan': 'Milano', 'turin': 'Torino', 'naples': 'Napoli',
    'florence': 'Firenze', 'venice': 'Venezia', 'genoa': 'Genova',
    'padua': 'Padova', 'syracuse': 'Siracusa', 'mantua': 'Mantova',
    'leghorn': 'Livorno', 'bozen': 'Bolzano', 'bolzano-bozen': 'Bolzano',
    'l\'aquila': "L'Aquila", 'reggio calabria': 'Reggio Calabria',
    'reggio emilia': 'Reggio Emilia', 'forli': 'Forlì'
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  async function init() {
    // Lista degli spazi presenti in homepage. Gli altri spazi del listino
    // stanno sulle pagine ricerca/profilo/pannelli, gestiti da js/spazi-laterali.js
    var TUTTI_SPAZI = ['hero-sx', 'hero-dx'];

    // 1. Città dall'URL, altrimenti 2. dall'IP del visitatore
    var params = new URLSearchParams(window.location.search);
    var citta = (params.get('citta') || '').trim();
    var daIP = false;

    if (!citta) {
      citta = await rilevaCittaDaIP();
      daIP = !!citta;
      if (daIP) console.log('[pub-spazi] Città rilevata da IP:', citta);
    }

    aggiornaTestoCitta(citta);

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

    // 4. Annunci pagati e attivi per la città rilevata
    if (citta) {
      var annunci = await queryAnnunci(client, oggi, citta);
      popolaSpazi(annunci, venduti);
    }

    // 5. Fallback: spazi ancora vuoti -> annunci pagati di altre città a rotazione.
    //    Serve a non lasciare mai un inserzionista senza impression quando
    //    non riusciamo a capire da dove arriva il visitatore.
    var vuoti = TUTTI_SPAZI.filter(function (s) { return !venduti.has(s); });
    if (vuoti.length) {
      var tutti = await queryAnnunci(client, oggi, null);
      popolaSpazi(scegliARotazione(tutti, vuoti), venduti);
    }

    // 6. Spazi rimasti liberi -> href pre-compilato per il form acquisto
    aggiornaHrefVuoti(TUTTI_SPAZI, venduti, citta);

    console.log('[pub-spazi] Città "' + (citta || '-') + '"' +
      (daIP ? ' (da IP)' : '') + ': ' + venduti.size + '/' + TUTTI_SPAZI.length + ' spazi pieni.');
  }

  // ---------------------------------------------------------------- città da IP

  async function rilevaCittaDaIP() {
    // Una sola chiamata per sessione: il risultato viene riusato.
    try {
      var cache = sessionStorage.getItem('ti_citta_ip');
      if (cache !== null) return cache;
    } catch (e) { /* sessionStorage non disponibile: pazienza */ }

    var citta = '';
    try {
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, 2500);
      var r = await fetch('/api/geo', { signal: ctrl.signal });
      clearTimeout(timer);
      if (r.ok) {
        var d = await r.json();
        // Solo visitatori italiani: per gli altri la città non ci serve.
        if (!d.paese || d.paese === 'IT') citta = normalizzaCitta(d.city || '');
      }
    } catch (e) {
      console.log('[pub-spazi] Rilevamento IP non riuscito, proseguo senza città.');
    }

    try { sessionStorage.setItem('ti_citta_ip', citta); } catch (e) { /* ok */ }
    return citta;
  }

  function normalizzaCitta(nome) {
    var n = (nome || '').trim();
    if (!n) return '';
    var k = n.toLowerCase();
    if (NOMI_IT[k]) return NOMI_IT[k];
    return n.charAt(0).toUpperCase() + n.slice(1);
  }

  // ---------------------------------------------------------------- dati e DOM

  async function queryAnnunci(client, oggi, citta) {
    try {
      var q = client
        .from('annunci_pubblicitari')
        .select('spazio_id, logo_url, link_url')
        .eq('stato', 'pagato')
        .gte('data_fine', oggi);

      if (citta) q = q.ilike('citta', citta);
      else q = q.limit(60);

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

  // Assegna a ogni spazio ancora vuoto un annuncio pescato a caso fra quelli
  // pagati, evitando di ripetere lo stesso annuncio su due spazi vicini.
  function scegliARotazione(annunci, spaziVuoti) {
    if (!annunci.length) return [];
    var pool = annunci.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    return spaziVuoti.map(function (spazio, idx) {
      var a = pool[idx % pool.length];
      return { spazio_id: spazio, logo_url: a.logo_url, link_url: a.link_url };
    });
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
      a.innerHTML = '<img src="' + ann.logo_url + '" alt="Pubblicità" style="width:100%;height:100%;object-fit:contain;display:block;">';
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
