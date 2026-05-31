// js/pubblicita-spazi.js
// Popola gli spazi pubblicitari della home con annunci pagati per la città attiva.
// Esegue solo se l'URL contiene ?citta=X (home nazionale = nessuna pubblicità).

(function () {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  async function init() {
    // 1. Lettura città dall'URL
    const params = new URLSearchParams(window.location.search);
    const cittaRaw = params.get('citta');
    if (!cittaRaw) {
      console.log('[pub-spazi] Nessuna città in URL, skip (home nazionale).');
      return;
    }
    const citta = cittaRaw.trim();

    // 2. Lista completa dei 18 spazi (per pre-compilazione link al form)
    const TUTTI_SPAZI = [
      'hero-sx', 'hero-dx',
      'imprese-sx', 'imprese-dx',
      'pannello-sx', 'pannello-dx',
      'piano-sx', 'piano-dx',
      'inserzioni-sx', 'inserzioni-dx',
      'subappalto-sx-1', 'subappalto-sx-2', 'subappalto-dx-1', 'subappalto-dx-2',
      'profilo-sx-1', 'profilo-sx-2', 'profilo-dx-1', 'profilo-dx-2'
    ];

    // 3. Recupero/creazione client Supabase
    const SUPABASE_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY3Zyc2dreWZhdnlreGp4c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTczNTYsImV4cCI6MjA4OTE3MzM1Nn0.o5S0HeDtG-hlCo1zfk4ILqtog7MT8_2B0EyjdiVzBic';

    let client = window.sb || window.supabaseClient;
    if (!client) {
      if (!window.supabase || !window.supabase.createClient) {
        console.error('[pub-spazi] Libreria Supabase non caricata.');
        aggiornaHrefVuoti(TUTTI_SPAZI, new Set(), citta);
        return;
      }
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    // 4. Query annunci pagati attivi per la città
    const oggi = new Date().toISOString().slice(0, 10);
    let annunci = [];
    try {
      const { data, error } = await client
        .from('annunci_pubblicitari')
        .select('spazio_id, logo_url, link_url')
        .ilike('citta', citta)
        .eq('stato', 'pagato')
        .gte('data_fine', oggi);

      if (error) {
        console.error('[pub-spazi] Errore query:', error.message);
      } else {
        annunci = data || [];
      }
    } catch (e) {
      console.error('[pub-spazi] Eccezione:', e);
    }

    // 5. Popolamento spazi venduti
    const venduti = new Set();
    for (const ann of annunci) {
      const a = document.querySelector(`a.pub-link[data-spazio-id="${ann.spazio_id}"]`);
      if (!a) {
        console.warn('[pub-spazi] Spazio non trovato in DOM:', ann.spazio_id);
        continue;
      }
      venduti.add(ann.spazio_id);
      a.href = ann.link_url || '#';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.border = 'none';
      a.style.padding = '0';
      a.innerHTML = `<img src="${ann.logo_url}" alt="Pubblicità" style="width:100%;height:100%;object-fit:contain;display:block;">`;
    }

    // 6. Spazi NON venduti → href pre-compilato per il form acquisto
    aggiornaHrefVuoti(TUTTI_SPAZI, venduti, citta);

    console.log(`[pub-spazi] Città "${citta}": ${venduti.size}/18 spazi venduti.`);
  }

  function aggiornaHrefVuoti(tutti, venduti, citta) {
    for (const sp of tutti) {
      if (venduti.has(sp)) continue;
      const slot = document.querySelector(`a.pub-link[data-spazio-id="${sp}"]`);
      if (slot) {
        slot.style.setProperty('display', 'none', 'important');
      }
    }
  }
})();
