/* =====================================================================
   I TUOI ANNUNCI DI SUBAPPALTO — nei pannelli (24 ottobre 2026)

   Prima un'impresa iscritta che pubblicava un subappalto non lo ritrovava
   piu' da nessuna parte: il link per gestirlo stava solo sullo schermo.
   Qui l'impresa vede TUTTI i suoi annunci (pubblicati da collegata, oppure
   con la stessa email dell'account) e da «Gestisci» li modifica, chiude,
   riapre o rinnova.

   Lo carica UGUALE in tre pannelli (impresa, artigiano, professionisti).
   Aggiunge da solo la sezione e la carta accanto a quella dei subappalti,
   e avvolge `showSection` senza cambiare quello che faceva.
   I dati arrivano da /.netlify/functions/subappalto-gestione (azione «miei»):
   il link di gestione contiene il token, che dal browser non si legge.
   ===================================================================== */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(id) { return document.getElementById(id); }
  function numVisite(n) { n = Number(n) || 0; return n === 0 ? 'Ancora nessuna visita' : n === 1 ? '1 persona l\u2019ha aperto' : n + ' persone l\u2019hanno aperto'; }
  function numContatti(n) { n = Number(n) || 0; return n === 0 ? 'Ancora nessun contatto' : n === 1 ? '1 ti ha contattato' : n + ' ti hanno contattato'; }
  function dataIt(d) { return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }); }

  var CSS = '' +
    '#sec-miei-subappalti .ti-back{display:inline-flex;align-items:center;gap:9px;height:46px;padding:0 18px 0 14px;background:#fff;' +
      'border:1.5px solid #c9d4e3;border-radius:12px;color:#0a2a4d;font-family:inherit;font-size:16px;font-weight:700;line-height:1;cursor:pointer}' +
    '#sec-miei-subappalti .ti-back:hover{background:#eaf2ff;border-color:#0066ff;color:#0047b3}' +
    '#sec-miei-subappalti .ti-back svg{width:22px;height:22px;flex:0 0 auto}' +
    '#sec-miei-subappalti .ti-back-riga{margin:0 0 18px}' +
    '#sec-miei-subappalti .ms-intro{font-size:17px;line-height:1.6;color:#334155;margin:0 0 18px;max-width:760px}' +
    '#sec-miei-subappalti .ms-vuoto{font-size:17px;color:#64748b;padding:18px 0;line-height:1.6}' +
    '#sec-miei-subappalti .ms-riga{display:flex;gap:16px;align-items:center;padding:18px 0;border-top:1px solid #e2e8f0}' +
    '#sec-miei-subappalti .ms-riga:first-child{border-top:none}' +
    '#sec-miei-subappalti .ms-testo{flex:1;min-width:0}' +
    '#sec-miei-subappalti .ms-tipo{font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#0052cc}' +
    '#sec-miei-subappalti .ms-tit{font-size:18px;font-weight:800;color:#0f172a;line-height:1.35;margin-top:2px}' +
    '#sec-miei-subappalti .ms-stato{font-size:15.5px;color:#475569;margin-top:4px;display:flex;align-items:center;gap:8px}' +
    '#sec-miei-subappalti .ms-pallino{width:11px;height:11px;border-radius:50%;background:#16a34a;flex:none}' +
    '#sec-miei-subappalti .ms-pallino.chiuso{background:#9ca3af}' +
    '#sec-miei-subappalti .ms-numeri{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;font-size:16px;font-weight:700;color:#0f172a}' +
    '#sec-miei-subappalti .ms-numeri span{background:#f1f5f9;border-radius:8px;padding:6px 11px}' +
    '#sec-miei-subappalti .ms-gestisci{background:#0066ff;color:#fff;border-radius:10px;padding:12px 20px;font-size:16px;font-weight:800;text-decoration:none;white-space:nowrap}' +
    '#sec-miei-subappalti .ms-gestisci:hover{background:#0052cc}' +
    '#sec-miei-subappalti .ms-nuovi{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px}' +
    '#sec-miei-subappalti .ms-nuovi a{border:1.5px solid #0066ff;color:#0052cc;border-radius:10px;padding:11px 16px;font-size:16px;font-weight:800;text-decoration:none}' +
    '@media(max-width:760px){#sec-miei-subappalti .ms-riga{flex-direction:column;align-items:stretch}' +
      '#sec-miei-subappalti .ms-gestisci{text-align:center}}';

  var ICONA = '<svg class="ti-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect x="2" y="6" width="20" height="14" rx="2"/></svg>';

  var HTML = '' +
    '<div class="ti-back-riga"><button type="button" class="ti-back" id="ms-indietro" title="Torna indietro" aria-label="Torna indietro">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg><span>Indietro</span></button></div>' +
    '<div class="topbar"><div class="topbar-title">' + ICONA + ' I tuoi annunci di subappalto</div></div>' +
    '<p class="ms-intro">Qui ritrovi i subappalti che hai pubblicato. Da «Gestisci» li modifichi, li chiudi, li riapri o li rinnovi. ' +
      'Ogni annuncio resta online 30 giorni: prima che scada ti scriviamo per rinnovarlo.</p>' +
    '<div class="profilo-card"><div id="ms-lista"><div class="ms-vuoto">Caricamento…</div></div></div>';

  var CARTA = '' +
    '<div class="dash-quick-icon">' + ICONA.replace('class="ti-ic"', 'class="ti-ic ti-ic-solo"') + '</div>' +
    '<div class="dash-quick-label">I tuoi subappalti</div>' +
    '<div class="dash-quick-sub">Modifica, chiudi o rinnova</div>';

  async function carica(riprova) {
    var box = $('ms-lista'); if (!box) return;
    box.innerHTML = '<div class="ms-vuoto">Caricamento…</div>';
    try {
      var s = (typeof sb !== 'undefined' && sb && sb.auth) ? (await sb.auth.getSession()).data.session : null;
      if (!s) { box.innerHTML = '<div class="ms-vuoto">La sessione è scaduta: esci e rientra.</div>'; return; }
      var res = await fetch('/.netlify/functions/subappalto-gestione', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.access_token },
        body: JSON.stringify({ azione: 'miei' })
      });
      var json = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(json.error || 'errore');
      var lista = json.annunci || [];
      if (!lista.length) {
        box.innerHTML = '<div class="ms-vuoto">Non hai ancora annunci di subappalto con questa email.</div>' +
          '<div class="ms-nuovi"><a href="/subappalto-cerca.html">Cerco subappaltatori</a><a href="/subappalto-offre.html">Offro disponibilità</a></div>';
        return;
      }
      box.innerHTML = lista.map(function (a) {
        var cerca = a.tipo === 'cerca';
        var testo = String((cerca ? a.descrizione : a.lavoro) || '').split('\n')[0] || (cerca ? 'Cerco subappaltatori' : 'Offro disponibilità');
        var aperto = a.attivo !== false;
        return '<div class="ms-riga"><div class="ms-testo">' +
          '<div class="ms-tipo">' + (cerca ? 'Cerco subappaltatori' : 'Offro disponibilità') + '</div>' +
          '<div class="ms-tit">' + esc(testo) + (a.citta ? ' — ' + esc(a.citta) : '') + '</div>' +
          '<div class="ms-stato"><span class="ms-pallino' + (aperto ? '' : ' chiuso') + '"></span>' +
            (aperto ? 'Online' + (a.scade_il ? ' fino al ' + esc(dataIt(a.scade_il)) : '') : 'Chiuso') + '</div>' +
          /* 19 nov 2026: quante persone l'hanno aperto e quante hanno contattato (js/conta-subappalto.js) */
          '<div class="ms-numeri"><span>👁 ' + numVisite(a.visite) + '</span><span>📞 ' + numContatti(a.contatti) + '</span></div>' +
          '</div><a class="ms-gestisci" href="' + esc(a.gestisci) + '" target="_blank" rel="noopener">Gestisci</a></div>';
      }).join('');
    } catch (e) {
      /* la prima chiamata dopo un po' di riposo a volte cade (funzione «fredda»): si riprova una volta da soli */
      if (!riprova) { setTimeout(function () { carica(true); }, 1500); return; }
      box.innerHTML = '<div class="ms-vuoto">Non riesco a leggere i tuoi annunci in questo momento. Riprova fra un attimo.</div>';
    }
  }

  function monta() {
    var main = document.querySelector('.main') || document.querySelector('main');
    if (!main || $('sec-miei-subappalti')) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

    var sec = document.createElement('div');
    sec.className = 'section'; sec.id = 'sec-miei-subappalti'; sec.innerHTML = HTML;
    main.appendChild(sec);

    /* la carta: subito dopo quella dei subappalti */
    var cartaSub = document.querySelector('.dash-quick-card[data-card-id="subappalto"]');
    if (cartaSub) {
      var c = document.createElement('div');
      c.className = 'dash-quick-card'; c.setAttribute('data-card-id', 'miei-subappalti');
      c.style.cursor = 'pointer';
      c.innerHTML = CARTA;
      c.addEventListener('click', function () { window.showSection('miei-subappalti', c); });
      cartaSub.parentNode.insertBefore(c, cartaSub.nextSibling);
    }
    $('ms-indietro').addEventListener('click', function () { window.showSection('dashboard'); });

    if (typeof window.showSection === 'function' && !window.showSection.__mieiSub) {
      var prima = window.showSection;
      var nuova = function (id) {
        var r = prima.apply(this, arguments);
        if (id === 'miei-subappalti') carica();
        return r;
      };
      nuova.__mieiSub = true;
      for (var k in prima) { if (Object.prototype.hasOwnProperty.call(prima, k)) nuova[k] = prima[k]; }
      window.showSection = nuova;
    }
    if (location.hash === '#miei-subappalti') setTimeout(function () { window.showSection('miei-subappalti', null, true); }, 400);
  }

  /* =====================================================================
     SUBAPPALTI NELLA TUA ZONA — in Dashboard (19 nov 2026, richiesta di Alex)
     Sotto le carte rapide: gli ultimi 3 annunci degli ALTRI nella regione
     dell'impresa. Se nella regione non c'è niente, gli ultimi in Italia.
     Si legge con la chiave pubblica: gli annunci sono già pubblici.
     ===================================================================== */
  var REGIONI_SZ = {
    'Lombardia': ['lombardia','milano','bergamo','brescia','como','cremona','lecco','lodi','mantova','monza','brianza','pavia','sondrio','varese'],
    'Lazio': ['lazio','roma','rieti','latina','frosinone','viterbo'],
    'Emilia-Romagna': ['emilia','romagna','bologna','modena','parma','ferrara','ravenna','rimini','forl','piacenza'],
    'Piemonte': ['piemonte','torino','alessandria','asti','biella','cuneo','novara','verbania','vercelli'],
    'Campania': ['campania','napoli','salerno','caserta','avellino','benevento'],
    'Toscana': ['toscana','firenze','pisa','livorno','arezzo','siena','lucca','prato','pistoia','grosseto','carrara'],
    'Sicilia': ['sicilia','palermo','catania','messina','siracusa','ragusa','trapani','agrigento','caltanissetta'],
    'Veneto': ['veneto','venezia','verona','padova','vicenza','treviso','rovigo','belluno'],
    'Puglia': ['puglia','bari','lecce','brindisi','taranto','foggia','barletta','andria'],
    'Sardegna': ['sardegna','cagliari','sassari','nuoro','oristano','olbia'],
    'Liguria': ['liguria','genova','savona','imperia','spezia'],
    'Umbria': ['umbria','perugia','terni'],
    'Calabria': ['calabria','cosenza','catanzaro','crotone'],
    'Abruzzo': ['abruzzo','pescara','chieti','teramo','aquila'],
    'Friuli-Venezia Giulia': ['friuli','trieste','udine','pordenone','gorizia'],
    'Trentino-Alto Adige': ['trentino','alto adige','trento','bolzano'],
    'Marche': ['marche','ancona','pesaro','macerata','ascoli'],
    'Basilicata': ['basilicata','potenza','matera'],
    'Molise': ['molise','campobasso','isernia']
  };
  function slugRegione(r) { return String(r || '').toLowerCase().replace(/\s+/g, '-'); }
  var CSS_SZ = '' +
    '#sub-zona{background:#fff;border-radius:20px;padding:24px;margin-bottom:20px;box-shadow:0 4px 16px rgba(0,0,0,0.08)}' +
    '#sub-zona .sz-testa{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}' +
    '#sub-zona .sz-tit{font-family:\'Playfair Display\',serif;font-size:1.35rem;color:#0a2a4d;font-weight:700}' +
    '#sub-zona .sz-tutti{font-size:16px;font-weight:800;color:#0066ff;text-decoration:none;white-space:nowrap}' +
    '#sub-zona .sz-lista{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}' +
    '#sub-zona .sz-ann{display:block;border:1.5px solid #e2e8f0;border-radius:14px;padding:16px 18px;text-decoration:none;color:inherit;transition:border-color .15s,box-shadow .15s}' +
    '#sub-zona .sz-ann:hover{border-color:#0066ff;box-shadow:0 6px 18px rgba(0,102,255,.10)}' +
    '#sub-zona .sz-tipo{font-size:13.5px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#0052cc}' +
    '#sub-zona .sz-tipo.cerca{color:#c2410c}' +
    '#sub-zona .sz-titolo{font-size:17.5px;font-weight:800;color:#0f172a;line-height:1.35;margin:4px 0 6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
    '#sub-zona .sz-chi{font-size:15.5px;color:#475569;line-height:1.5}' +
    '#sub-zona .sz-vedi{display:inline-block;margin-top:10px;font-size:15.5px;font-weight:800;color:#0066ff}' +
    '#sub-zona .sz-piede{margin-top:14px;font-size:16px;color:#475569}' +
    '#sub-zona .sz-piede a{color:#0066ff;font-weight:700}' +
    '@media(max-width:900px){#sub-zona .sz-lista{grid-template-columns:1fr}}';

  function disegnaZona(box, lista, regione, inRegione) {
    var tit = inRegione ? 'Subappalti nella tua zona — ' + regione : 'Ultimi subappalti in Italia';
    var tutti = inRegione ? '/subappalti-' + slugRegione(regione) : '/subappalto';
    box.innerHTML = '<div class="sz-testa"><div class="sz-tit">🤝 ' + esc(tit) + '</div>' +
      '<a class="sz-tutti" href="' + tutti + '" target="_blank" rel="noopener">Vedi tutti →</a></div>' +
      '<div class="sz-lista">' + lista.map(function (a) {
        var cerca = a.tipo === 'cerca';
        var titolo = String((cerca ? (a.descrizione || a.lavoro) : (a.lavoro || a.descrizione)) || '').split('\n')[0] || 'Lavori edili';
        return '<a class="sz-ann" href="/subappalto-annuncio?id=' + encodeURIComponent(a.id) + '" target="_blank" rel="noopener">' +
          '<div class="sz-tipo' + (cerca ? ' cerca' : '') + '">' + (cerca ? 'Cerca subappaltatori' : 'Squadra disponibile') + '</div>' +
          '<div class="sz-titolo">' + esc(titolo) + '</div>' +
          '<div class="sz-chi"><b>' + esc(a.nome_impresa || '') + '</b>' + (a.citta ? '<br>📍 ' + esc(a.citta) : '') + '</div>' +
          '<span class="sz-vedi">Vedi l’annuncio e i contatti →</span></a>';
      }).join('') + '</div>' +
      '<div class="sz-piede">Hai un lavoro da dare o una squadra libera? <a href="/subappalto-cerca.html">Cerco subappaltatori</a> · <a href="/subappalto-offre.html">Offro disponibilità</a></div>';
  }

  var tentativiZona = 0;
  async function montaZona() {
    if ($('sub-zona')) return;
    /* chi apre il pannello senza essere ancora entrato: si riprova ogni 3 secondi per 2 minuti */
    var riprova = function () { if (++tentativiZona < 40) setTimeout(montaZona, 3000); };
    var cartaSub = document.querySelector('.dash-quick-card[data-card-id="subappalto"]');
    var griglia = cartaSub && cartaSub.parentNode;
    if (!griglia || typeof sb === 'undefined' || !sb || !sb.auth) return;
    try {
      var s = (await sb.auth.getSession()).data.session;
      if (!s) { riprova(); return; }
      var mia = await sb.from('imprese').select('regione,email').eq('user_id', s.user.id).limit(1);
      var regione = mia.data && mia.data[0] && mia.data[0].regione || '';
      var miaEmail = String(mia.data && mia.data[0] && mia.data[0].email || s.user.email || '').toLowerCase();
      var base = function () {
        return sb.from('subappalti').select('id,tipo,nome_impresa,descrizione,lavoro,citta,user_id,email,created_at')
          .eq('attivo', true).order('created_at', { ascending: false }).limit(12);
      };
      var chiavi = REGIONI_SZ[regione];
      var r = chiavi ? await base().or(chiavi.map(function (k) { return 'citta.ilike.%' + k + '%'; }).concat(['regione.ilike.' + slugRegione(regione)]).join(',')) : { data: [] };
      var degliAltri = function (l) {
        return (l || []).filter(function (a) { return a.user_id !== s.user.id && String(a.email || '').toLowerCase() !== miaEmail; }).slice(0, 3);
      };
      var lista = degliAltri(r.data), inRegione = lista.length > 0;
      if (!inRegione) { var t = await base(); lista = degliAltri(t.data); }
      if (!lista.length) return;
      if (!document.getElementById('sz-stile')) { var st = document.createElement('style'); st.id = 'sz-stile'; st.textContent = CSS_SZ; document.head.appendChild(st); }
      var box = document.createElement('div'); box.id = 'sub-zona';
      disegnaZona(box, lista, regione, inRegione);
      griglia.parentNode.insertBefore(box, griglia.nextSibling);
    } catch (e) { /* in dashboard non si mostra niente se qualcosa va storto */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monta);
  else monta();
  /* la zona: dopo che il pannello ha fatto entrare l'utente */
  setTimeout(montaZona, 1500);
})();
