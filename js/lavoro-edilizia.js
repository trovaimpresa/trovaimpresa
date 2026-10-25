/* TrovaImpresa Lavoro Edilizia — 24 ottobre 2026.
   Una pagina sola (lavoro-edilizia.html) con dentro, insieme:
     · le offerte di lavoro   (tabella offerte_lavoro, attiva = true e non scadute)
     · i subappalti           (tabella subappalti, attivo = true): «cerco» e «offro»
   Stessa forma del Forum Edilizia (classi f-* di css/forum.css).
   Si legge e basta: per pubblicare si va sui moduli che ci sono gia'
   (offerte-registrazione.html, subappalto.html), che mandano il link per gestire.
   Gli id sono UUID: negli attributi data-* vanno bene, mai dentro onclick. */
(function () {
  'use strict';

  var SB_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co';
  var SB_KEY = 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R';
  var sb = window.supabase.createClient(SB_URL, SB_KEY);

  var MESTIERI = ['Muratore', 'Elettricista', 'Idraulico', 'Carpentiere', 'Imbianchino', 'Piastrellista',
    'Operaio generico', 'Gruista', 'Saldatore', 'Cartongessista', 'Geometra', 'Altro'];
  /* le parole da cercare nei testi per ogni mestiere (le offerte e i subappalti li scrivono in modi diversi) */
  var PAROLE = {
    'Muratore': ['murator', 'muratura'], 'Elettricista': ['elettric'], 'Idraulico': ['idraul', 'termoidraul'],
    'Carpentiere': ['carpent'], 'Imbianchino': ['imbianc', 'pittor', 'tinteggi'], 'Piastrellista': ['piastrell', 'pavimentist'],
    'Operaio generico': ['operai', 'manoval'], 'Gruista': ['gruist', 'gru '], 'Saldatore': ['saldat'],
    'Cartongessista': ['cartongess'], 'Geometra': ['geometr'], 'Altro': []
  };
  /* 25 ott 2026: si sceglie la REGIONE, non la citta' — le imprese scrivono la zona a mano («Lombardia», «nord italia»,
     «Lecce e provincia»), quindi una regione prende: il suo nome, i suoi capoluoghi, la sua parte d'Italia e chi lavora ovunque */
  var REGIONI = {
    'Abruzzo': { p: ['abruzz'], c: ["L'Aquila", 'Chieti', 'Pescara', 'Teramo'], z: 'sud' },
    'Basilicata': { p: ['basilicat', 'lucania'], c: ['Matera', 'Potenza'], z: 'sud' },
    'Calabria': { p: ['calabri'], c: ['Catanzaro', 'Cosenza', 'Crotone', 'Reggio Calabria', 'Vibo Valentia'], z: 'sud' },
    'Campania': { p: ['campani'], c: ['Napoli', 'Avellino', 'Benevento', 'Caserta', 'Salerno'], z: 'sud' },
    'Emilia-Romagna': { p: ['emilia', 'romagna'], c: ['Bologna', 'Parma', 'Modena', 'Reggio Emilia', 'Ferrara', 'Forlì', 'Piacenza', 'Ravenna', 'Rimini'], z: 'nord' },
    'Friuli-Venezia Giulia': { p: ['friuli', 'venezia giulia'], c: ['Trieste', 'Gorizia', 'Pordenone', 'Udine'], z: 'nord' },
    'Lazio': { p: ['lazio'], c: ['Roma', 'Rieti', 'Frosinone', 'Latina', 'Viterbo'], z: 'centro' },
    'Liguria': { p: ['liguri'], c: ['Genova', 'Imperia', 'La Spezia', 'Savona'], z: 'nord' },
    'Lombardia': { p: ['lombard'], c: ['Milano', 'Brescia', 'Bergamo', 'Como', 'Cremona', 'Lecco', 'Lodi', 'Mantova', 'Monza', 'Pavia', 'Sondrio', 'Varese'], z: 'nord' },
    'Marche': { p: ['marche'], c: ['Ancona', 'Ascoli Piceno', 'Fermo', 'Macerata', 'Pesaro'], z: 'centro' },
    'Molise': { p: ['molise'], c: ['Campobasso', 'Isernia'], z: 'sud' },
    'Piemonte': { p: ['piemont'], c: ['Torino', 'Alessandria', 'Asti', 'Biella', 'Cuneo', 'Novara', 'Verbania', 'Vercelli'], z: 'nord' },
    'Puglia': { p: ['pugli', 'salento'], c: ['Bari', 'Barletta', 'Brindisi', 'Foggia', 'Lecce', 'Taranto'], z: 'sud' },
    'Sardegna': { p: ['sardegn'], c: ['Cagliari', 'Nuoro', 'Oristano', 'Sassari'], z: 'sud' },
    'Sicilia': { p: ['sicili'], c: ['Palermo', 'Catania', 'Messina', 'Agrigento', 'Caltanissetta', 'Enna', 'Ragusa', 'Siracusa', 'Trapani'], z: 'sud' },
    'Toscana': { p: ['toscan'], c: ['Firenze', 'Arezzo', 'Grosseto', 'Livorno', 'Lucca', 'Massa', 'Pisa', 'Pistoia', 'Prato', 'Siena'], z: 'centro' },
    'Trentino-Alto Adige': { p: ['trentino', 'alto adige', 'sudtirol'], c: ['Bolzano', 'Trento'], z: 'nord' },
    'Umbria': { p: ['umbri'], c: ['Perugia', 'Terni'], z: 'centro' },
    "Valle d'Aosta": { p: ['valle d', 'aosta'], c: ['Aosta'], z: 'nord' },
    'Veneto': { p: ['veneto'], c: ['Verona', 'Venezia', 'Padova', 'Belluno', 'Rovigo', 'Treviso', 'Vicenza'], z: 'nord' }
  };
  function senzaAccenti(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  /* «tutta italia», «italia», «territorio nazionale»: vale per ogni regione */
  function nazionale(z) { return /tutt[ao] (l')?italia|territorio nazionale|^\s*italia\s*$|in tutta italia|^\s*nazionale/.test(z); }
  function inRegione(x, nomeReg) {
    var R = REGIONI[nomeReg]; if (!R) return true;
    var z = senzaAccenti(x.citta + ' ' + (x.regione || ''));
    if (nazionale(z)) return true;
    if (R.p.some(function (p) { return z.indexOf(p) > -1; })) return true;
    if (new RegExp('\\b' + R.z + '(?:\\s|-|$)').test(z) && /ital/.test(z)) return true; /* «nord italia», «centro-sud italia» */
    return R.c.some(function (c) { return new RegExp('(^|[^a-z])' + senzaAccenti(c).replace(/[.*+?^${}()|[\]\\']/g, '.') + '([^a-z]|$)').test(z); });
  }

  var COL_OFF = 'id,titolo,nome_azienda,tipo_offerta,tipo_contratto,descrizione,citta,provincia,stipendio,orario,mestiere,data_pubblicazione,data_scadenza_annuncio';
  var COL_SUB = 'id,tipo,nome_impresa,descrizione,lavoro,citta,regione,mestiere,categoria,created_at';
  var PER_PAGINA = 15;

  var stato = { tipo: '', mestiere: '', q: '', regione: '', tutti: [], mostrati: 0 };

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function nl2br(s) { return esc(s).replace(/\n/g, '<br>'); }
  function corto(s, n) { s = String(s || '').trim(); return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s; }
  function fa(iso) {
    var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 90) return 'adesso';
    if (s < 3600) return Math.round(s / 60) + ' min fa';
    if (s < 86400) { var o = Math.round(s / 3600); return o + (o === 1 ? ' ora fa' : ' ore fa'); }
    if (s < 172800) return 'ieri';
    if (s < 2592000) return Math.round(s / 86400) + ' giorni fa';
    return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function iniziale(n) { return esc(String(n || '?').trim().charAt(0).toUpperCase() || '?'); }
  function pulisci(t) { return String(t || '').replace(/[,()*%\\"'.:;<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60); }
  function oggi() { return new Date().toISOString().slice(0, 10); }

  /* ---------- un annuncio, qualunque sia ---------- */
  function normaOfferta(o) {
    return {
      genere: 'offerta', id: o.id, quando: o.data_pubblicazione,
      nome: o.nome_azienda || 'Impresa', titolo: o.titolo || 'Offerta di lavoro',
      testo: o.descrizione || '', citta: o.citta || o.provincia || '', regione: o.provincia || '',
      etichetta: 'Offerta di lavoro', chip: o.tipo_offerta || o.mestiere || '',
      dettagli: [o.tipo_contratto, o.orario, o.stipendio].filter(Boolean),
      url: '/offerta-lavoro.html?id=' + encodeURIComponent(o.id),
      cerca: [o.titolo, o.descrizione, o.tipo_offerta, o.mestiere, o.citta, o.provincia, o.nome_azienda].join(' ').toLowerCase()
    };
  }
  function normaSub(a) {
    var cerca = a.tipo === 'cerca';
    var testo = (cerca ? a.descrizione : a.lavoro) || a.descrizione || a.lavoro || '';
    var primaRiga = String(testo).split('\n')[0];
    return {
      genere: cerca ? 'cerca' : 'offre', id: a.id, quando: a.created_at,
      nome: a.nome_impresa || 'Impresa', titolo: corto(primaRiga, 90) || (cerca ? 'Cerco subappaltatori' : 'Offro disponibilità'),
      testo: testo, citta: a.citta || a.regione || '', regione: a.regione || '',
      etichetta: cerca ? 'Cerco subappaltatori' : 'Offro disponibilità', chip: a.mestiere || a.categoria || '',
      dettagli: [],
      url: '/subappalto-annuncio.html?id=' + encodeURIComponent(a.id),
      cerca: [testo, a.mestiere, a.categoria, a.citta, a.regione, a.nome_impresa].join(' ').toLowerCase()
    };
  }

  /* il testo sotto il titolo, senza ripetere il titolo (nei subappalti il titolo e' la prima riga del testo) */
  function resto(x) {
    var t = String(x.testo || '').trim();
    var prima = t.split('\n')[0].trim();
    if (prima && x.titolo.replace(/…$/, '') && prima.indexOf(x.titolo.replace(/…$/, '')) === 0) t = t.slice(t.indexOf('\n') + 1 || t.length).trim();
    return t === x.titolo ? '' : t;
  }

  /* 25 ott 2026: nome e zone scritti dalle imprese «come viene» — si puliscono solo a schermo, nel database restano come sono */
  function nomePulito(n) { return String(n || '').replace(/^[\s,.;:\-–]+|[\s,.;:\-–]+$/g, '').replace(/\s+/g, ' ') || 'Impresa'; }
  function zonaPulita(z) {
    var parti = String(z || '').split(/\s*[,;\/]\s*|\s+-\s+|-(?=[A-Za-z])/).map(function (p) { return p.trim(); }).filter(Boolean);
    return parti.map(function (p) {
      return p.toLowerCase().replace(/(^|\s|')([a-zà-ù])/g, function (m, a, b) { return a + b.toUpperCase(); })
        .replace(/\b(E|Di|Del|Della|In)\b/g, function (w) { return w.toLowerCase(); });
    }).join(', ');
  }
  var ICO_ZONA = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';

  function htmlAnnuncio(x) {
    var classe = x.genere === 'offerta' ? 'le-off' : (x.genere === 'cerca' ? 'le-cerca' : 'le-offre');
    var nome = nomePulito(x.nome), zona = zonaPulita(x.citta);
    /* l'etichetta grigia «subappalto» si toglie: lo dice gia' l'etichetta colorata */
    var chip = x.chip && x.chip.toLowerCase() !== 'subappalto' ? x.chip : '';
    return '<article class="f-post le-post ' + classe + '">' +
      '<div class="f-ph le-ph"><div class="f-av le-av">' + iniziale(nome) + '</div>' +
      '<div class="le-chi"><b>' + esc(nome) + '</b><span class="le-quando">' + esc(fa(x.quando)) +
      (zona ? ' · <span class="le-zona">' + ICO_ZONA + esc(zona) + '</span>' : '') + '</span></div>' +
      '<span class="le-tipo">' + esc(x.etichetta) + '</span>' +
      (chip ? ' <span class="f-chip">' + esc(chip) + '</span>' : '') + '</div>' +
      '<h2><a href="' + x.url + '">' + esc(x.titolo) + '</a></h2>' +
      (resto(x) ? '<div class="f-tx">' + nl2br(corto(resto(x), 280)) + '</div>' : '') +
      (x.dettagli.length ? '<div class="le-det">' + x.dettagli.map(function (d) { return '<span>' + esc(d) + '</span>'; }).join('') + '</div>' : '') +
      '<div class="f-az"><a class="f-b le-apri" href="' + x.url + '">' + (x.genere === 'offerta' ? 'Vedi l\'offerta e candidati' : 'Vedi l\'annuncio e i contatti') + ' →</a></div>' +
      '</article>';
  }

  /* ---------- il filtro (tutto qui, gli annunci sono pochi centinaia) ---------- */
  function filtrati() {
    var parole = stato.mestiere ? (PAROLE[stato.mestiere] || []).concat([stato.mestiere.toLowerCase()]) : null;
    var q = stato.q.toLowerCase().split(' ').filter(Boolean);
    return stato.tutti.filter(function (x) {
      if (stato.tipo && x.genere !== stato.tipo) return false;
      if (stato.regione && !inRegione(x, stato.regione)) return false;
      if (parole && stato.mestiere !== 'Altro' && !parole.some(function (p) { return x.cerca.indexOf(p) > -1; })) return false;
      if (q.length && !q.every(function (p) { return x.cerca.indexOf(p) > -1; })) return false;
      return true;
    });
  }

  function disegna(aggiungi) {
    var box = $('#le-elenco'), altro = $('#le-carica');
    var lista = filtrati();
    if (!aggiungi) stato.mostrati = 0;
    var da = stato.mostrati, a = Math.min(lista.length, da + PER_PAGINA);
    if (!lista.length) {
      box.innerHTML = '<div class="f-vuoto"><b>' + (stato.q || stato.mestiere || stato.tipo || stato.regione ? 'Nessun annuncio trovato con questi filtri.' : 'Ancora nessun annuncio.') + '</b><br>' +
        'Pubblica tu il primo: è gratis e non serve registrarsi.<br><br>' +
        '<a href="/offerte-registrazione.html" style="color:#0066ff;font-weight:800">Pubblica un\'offerta di lavoro</a> · ' +
        '<a href="/subappalto.html" style="color:#0066ff;font-weight:800">Pubblica un subappalto</a></div>';
      altro.style.display = 'none';
      return;
    }
    var html = lista.slice(da, a).map(htmlAnnuncio).join('');
    if (aggiungi) box.insertAdjacentHTML('beforeend', html); else box.innerHTML = html;
    stato.mostrati = a;
    altro.style.display = a < lista.length ? '' : 'none';
  }

  function carica() {
    var box = $('#le-elenco');
    box.innerHTML = '<div class="f-vuoto">Carico gli annunci…</div>';
    var q1 = sb.from('offerte_lavoro').select(COL_OFF).eq('attiva', true)
      .or('data_scadenza_annuncio.is.null,data_scadenza_annuncio.gte.' + oggi())
      .order('data_pubblicazione', { ascending: false }).limit(300);
    var q2 = sb.from('subappalti').select(COL_SUB).eq('attivo', true)
      .order('created_at', { ascending: false }).limit(300);
    return Promise.all([q1, q2]).then(function (r) {
      if (r[0].error && r[1].error) throw r[0].error;
      var off = (r[0].data || []).map(normaOfferta);
      var sub = (r[1].data || []).map(normaSub);
      /* lo stesso annuncio pubblicato piu' volte (succede: doppio clic, pagina ricaricata) si vede una volta sola */
      var visti = {};
      stato.tutti = off.concat(sub).sort(function (a, b) { return new Date(b.quando) - new Date(a.quando); })
        .filter(function (x) {
          var k = x.genere + '|' + x.nome.toLowerCase().trim() + '|' + String(x.testo).toLowerCase().replace(/\s+/g, ' ').trim();
          if (visti[k]) return false; visti[k] = 1; return true;
        });
      contaTipi();
      disegna(false);
    }).catch(function () {
      box.innerHTML = '<div class="f-vuoto">Non riesco a caricare gli annunci adesso. Riprova fra poco.</div>';
    });
  }

  /* quanti per ogni tipo, scritto sui pulsanti */
  function contaTipi() {
    var n = { '': stato.tutti.length, offerta: 0, cerca: 0, offre: 0 };
    var base = stato.regione ? stato.tutti.filter(function (x) { return inRegione(x, stato.regione); }) : stato.tutti;
    n[''] = base.length;
    base.forEach(function (x) { n[x.genere]++; });
    document.querySelectorAll('#le-tipi button').forEach(function (b) {
      var t = b.getAttribute('data-tipo') || '';
      if (!b.getAttribute('data-nome')) b.setAttribute('data-nome', b.textContent);
      b.textContent = b.getAttribute('data-nome') + ' (' + n[t] + ')';
      /* 25 ott 2026: una scheda a zero fa sembrare la pagina vuota — si nasconde (resta se e' quella scelta) */
      b.hidden = t !== '' && n[t] === 0 && stato.tipo !== t;
    });
  }

  function avvia() {
    var qs = new URLSearchParams(location.search);
    var mm = qs.get('m'); if (mm && MESTIERI.indexOf(mm) > -1) stato.mestiere = mm;
    var rr = qs.get('r'); if (rr && REGIONI[rr]) stato.regione = rr;
    var tt = qs.get('t'); if (['offerta', 'cerca', 'offre'].indexOf(tt) > -1) stato.tipo = tt;
    stato.q = pulisci(qs.get('q'));
    var campoQ = $('.fs-cerca input'); if (campoQ && stato.q) campoQ.value = stato.q;
    document.querySelectorAll('.fs-sub a').forEach(function (a) {
      a.classList.toggle('on', (a.getAttribute('data-m') || '') === stato.mestiere);
    });
    var tipi = $('#le-tipi');
    tipi.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', (b.getAttribute('data-tipo') || '') === stato.tipo); });
    tipi.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-tipo]'); if (!b) return;
      tipi.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on');
      stato.tipo = b.getAttribute('data-tipo') || '';
      disegna(false);
    });
    $('#le-carica').addEventListener('click', function () { disegna(true); });
    /* la tendina delle regioni: si sceglie e l'elenco cambia subito, l'indirizzo si aggiorna (si puo' condividere) */
    var sel = $('#le-regione');
    if (sel) {
      sel.innerHTML = '<option value="">Tutta Italia</option>' + Object.keys(REGIONI).map(function (r) { return '<option>' + esc(r) + '</option>'; }).join('');
      sel.value = stato.regione;
      sel.addEventListener('change', function () {
        stato.regione = sel.value;
        var u = new URL(location.href);
        if (stato.regione) u.searchParams.set('r', stato.regione); else u.searchParams.delete('r');
        history.replaceState(null, '', u.pathname + u.search);
        contaTipi();
        disegna(false);
      });
    }
    carica();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia); else avvia();
})();
