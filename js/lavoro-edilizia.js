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
  var COL_OFF = 'id,titolo,nome_azienda,tipo_offerta,tipo_contratto,descrizione,citta,provincia,stipendio,orario,mestiere,data_pubblicazione,data_scadenza_annuncio';
  var COL_SUB = 'id,tipo,nome_impresa,descrizione,lavoro,citta,regione,mestiere,categoria,created_at';
  var PER_PAGINA = 15;

  var stato = { tipo: '', mestiere: '', q: '', tutti: [], mostrati: 0 };

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
      testo: o.descrizione || '', citta: o.citta || o.provincia || '',
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
      testo: testo, citta: a.citta || a.regione || '',
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

  function htmlAnnuncio(x) {
    var classe = x.genere === 'offerta' ? 'le-off' : (x.genere === 'cerca' ? 'le-cerca' : 'le-offre');
    return '<article class="f-post le-post ' + classe + '">' +
      '<div class="f-ph"><div class="f-av">' + iniziale(x.nome) + '</div><b>' + esc(x.nome) + '</b> · ' + esc(fa(x.quando)) +
      (x.citta ? ' · ' + esc(x.citta) : '') +
      ' <span class="le-tipo">' + esc(x.etichetta) + '</span>' +
      (x.chip ? ' <span class="f-chip">' + esc(x.chip) + '</span>' : '') + '</div>' +
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
      box.innerHTML = '<div class="f-vuoto"><b>' + (stato.q || stato.mestiere || stato.tipo ? 'Nessun annuncio trovato con questi filtri.' : 'Ancora nessun annuncio.') + '</b><br>' +
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
    stato.tutti.forEach(function (x) { n[x.genere]++; });
    document.querySelectorAll('#le-tipi button').forEach(function (b) {
      var t = b.getAttribute('data-tipo') || '';
      if (!b.getAttribute('data-nome')) b.setAttribute('data-nome', b.textContent);
      b.textContent = b.getAttribute('data-nome') + ' (' + n[t] + ')';
    });
  }

  function avvia() {
    var qs = new URLSearchParams(location.search);
    var mm = qs.get('m'); if (mm && MESTIERI.indexOf(mm) > -1) stato.mestiere = mm;
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
    carica();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia); else avvia();
})();
