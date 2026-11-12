/* =====================================================================
   L'ASSISTENTE — 6 novembre 2026 (approvato da Alex con le foto)

   Prima per chiedere aiuto c'erano sette porte: Chat con AI, Parla,
   «Chiedi all'AI cosa fare oggi», Aiuto, Assistenza diretta, Chiedi una
   funzione, i pulsanti AI dei moduli. Chi entra non sapeva quale usare.
   Adesso la porta e' UNA, in cima alla pagina di partenza:

     «Cosa facciamo?»  [scrivi o parla]  [Parla]  [Manda]
       + 4 scorciatoie (Fai un preventivo, Racconta la giornata,
         Fattura da un preventivo, Quanto devo incassare?)

   - «Manda» porta la domanda alla Chat con AI (js/gest-chat.js), che da
     oggi conosce anche il MANUALE del gestionale e, se non sa, prepara la
     domanda per l'assistenza (netlify/functions/chat-gestionale.mjs).
   - «Parla» preme il «Parla» di sempre (js/gest-voce.js): racconto della
     giornata → schede, «fammi un preventivo» → modulo. Il pulsante tondo
     in basso a destra NON si vede piu' sulla pagina di partenza (c'e' la
     casella) ne' sul telefono (c'e' il microfono grande nella barra in
     basso): resta solo mentre ascolta, per poterlo fermare.
   - «Aiuto» in alto apre la Chat, non piu' la vecchia guida «Come si fa».
   - Sul telefono la barra in basso: Oggi · Lavori · [microfono] ·
     Preventivi · Fatture. E sulla schermata dei reparti non si vede piu'
     (prima c'era anche fuori dai reparti, e non portava da nessuna parte).

   ⛔ Non legge e non scrive dati suoi: preme i pulsanti che ci sono gia'.
      L'unica lettura e' il nome per il saluto («Buonasera, Alessio»).
   ⛔ Il «Riepilogo» resta la stessa sezione (data-tab="riepilogo"): cambia
      solo la scritta nel menu, «Assistente». Il resto del gestionale la
      trova come prima.
   File chiuso in se' (IIFE). Fuori non esce niente.
   ===================================================================== */
(function () {
  if (!document.querySelector('nav.tabs')) return;

  var MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/></svg>';
  var STELLA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z"/></svg>';

  var css = ''
    /* la casella dell'assistente */
    + '#ass-box{background:#fff;border:2px solid #0a2a4d;border-radius:18px;padding:22px 24px;margin:0 0 18px;box-shadow:0 6px 24px rgba(10,42,77,.10)}'
    + '#ass-box .ass-ciao{font-size:32px;font-weight:700;color:#0a2a4d;margin:0;line-height:1.2}'
    + '#ass-box .ass-data{font-size:18px;color:#475569;margin:2px 0 18px}'
    + '#ass-box .ass-mese{display:flex;flex-wrap:wrap;align-items:center;gap:10px 12px;margin:-6px 0 20px}'
    + '#ass-box .ass-mese-t{font-size:18px;font-weight:700;color:#fff;margin-right:2px}'
    + '#ass-box .ass-mese button{display:inline-flex;align-items:baseline;gap:7px;background:#eef3fa;border:0;border-radius:12px;padding:9px 14px;font:inherit;font-size:18px;color:#0f172a;cursor:pointer}'
    + '#ass-box .ass-mese button:hover{background:#e1eaf6}'
    + '#ass-box .ass-mese b{font-size:20px;font-weight:800;color:#0a2a4d}'
    + '@media(max-width:700px){#ass-box .ass-mese{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}'
    +   '#ass-box .ass-mese-t{grid-column:1/-1}'
    +   '#ass-box .ass-mese button{flex-direction:column;align-items:center;gap:2px;padding:10px 6px;font-size:15px;text-align:center;line-height:1.2}'
    +   '#ass-box .ass-mese b{font-size:19px}}'
    + '#ass-box .ass-tit{display:flex;align-items:center;gap:12px;font-size:24px;font-weight:700;color:#0a2a4d;margin:0 0 12px}'
    + '#ass-box .ass-av{width:44px;height:44px;border-radius:50%;background:#0a2a4d;display:grid;place-items:center;flex:0 0 44px}'
    + '#ass-box .ass-av svg{width:24px;height:24px;color:#ff8800}'
    + '#ass-box .ass-riga{display:flex;gap:12px;align-items:stretch}'
    + '#ass-box textarea{flex:1;min-height:64px;border:2px solid #cbd5e1;border-radius:14px;padding:16px 18px;font:inherit;font-size:20px;resize:vertical;color:#0f172a;box-sizing:border-box}'
    + '#ass-box textarea:focus{outline:none;border-color:#0a2a4d}'
    + '#ass-box .ass-b{border:0;border-radius:14px;font:inherit;font-size:20px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;min-height:64px;padding:0 22px}'
    + '#ass-box .ass-b svg{width:26px;height:26px}'
    + '#ass-box .ass-parla{background:#ff8800;color:#fff;min-width:150px}'
    + '#ass-box .ass-manda{background:#0a2a4d;color:#fff;min-width:120px}'
    + '#ass-box .ass-chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}'
    + '#ass-box .ass-chip{border:2px solid #0a2a4d;color:#0a2a4d;background:#fff;border-radius:30px;padding:10px 18px;font:inherit;font-size:18px;font-weight:600;cursor:pointer}'
    + '#ass-box .ass-chip:hover{background:#eef3fa}'
    + '#ass-box .ass-nota{font-size:16px;color:#475569;margin-top:14px}'
    /* la vecchia testata «Riepilogo — reparto» non serve piu': il saluto sta nella casella */
    + '#riepilogo .rie-intro{display:none}'
    /* «Chiedi all'AI cosa fare oggi»: c'e' gia' la casella (stessa domanda) */
    + '#riepilogo #rie-chiedi-ai{display:none}'
    /* il «Parla» tondo: sulla pagina di partenza e sul telefono no, salvo mentre ascolta */
    + 'body.ass-rie:not(.ass-ascolta) #gv-btn{display:none!important}'
    + '@media(max-width:880px){'
    /* 6 nov 2026 (sera, collaudo da telefono): il «Parla» tondo sul telefono
       non si vede MAI, nemmeno mentre ascolta o quando dice un errore: c'e'
       il microfono grande nella barra (che diventa rosso mentre ascolta e
       si preme di nuovo per fermare). Prima ricompariva sopra la bolla. */
    +   '#gv-btn{display:none!important}'
    /* la casella della Chat finiva sotto la barra in basso */
    +   '#chat.active{padding-bottom:120px}'
    +   '#ass-box{padding:16px;border-radius:16px}'
    +   '#ass-box .ass-ciao{font-size:28px}'
    +   '#ass-box .ass-tit{font-size:21px}'
    +   '#ass-box .ass-riga{flex-direction:column}'
    +   '#ass-box .ass-b{width:100%;min-height:58px}'
    /* sul telefono il microfono grande sta gia' nella barra in basso */
    +   '#ass-box .ass-parla{display:none}'
    +   '#ass-box textarea{min-height:96px;font-size:19px}'
    +   '#ass-box .ass-chip{font-size:17px;padding:9px 14px}'
    /* la barra in basso: 5 posti, il microfono grande al centro */
    +   '#barra-basso{grid-template-columns:repeat(5,1fr)!important;padding-right:6px!important;align-items:end}'
    +   '#barra-basso .bb-mic{display:flex;align-items:center;justify-content:center;width:64px;height:64px;min-height:64px;margin:-26px auto 0;padding:0;border-radius:50%;'
    +     'background:#ff8800!important;color:#fff!important;box-shadow:0 4px 14px rgba(255,136,0,.45)}'
    +   '#barra-basso .bb-mic svg{width:30px;height:30px;color:#fff}'
    +   '#barra-basso .bb-mic.on{background:#dc2626!important}'
    +   'body.ass-fuori #barra-basso{display:none!important}'
    + '}'
    /* la Chat: le scritte delle chat di prima erano a 13 px */
    + '.chat-elenco .cn{font-size:16px!important}.chat-elenco .cq{font-size:15px!important}';
  var st = document.createElement('style'); st.id = 'ass-stile'; st.textContent = css;
  document.head.appendChild(st);

  function $(id) { return document.getElementById(id); }
  function vai(tab) {
    var b = document.querySelector('nav.tabs button[data-tab="' + tab + '"]');
    if (b) { b.click(); window.scrollTo(0, 0); return true; }
    return false;
  }

  /* ---------------- la domanda va alla Chat con AI ---------------- */
  function allaChat(testo) {
    testo = String(testo || '').trim();
    if (!testo) { var t = $('ass-testo'); if (t) t.focus(); return; }
    if (!vai('chat')) { tiAvviso('La chat non è disponibile: ricarica la pagina.'); return; }
    var fine = Date.now() + 5000;
    (function prova() {
      var c = $('chat-domanda'), m = $('chat-manda');
      if (c && m) {
        /* una domanda nuova dalla casella = una chat nuova, cosi' non si
           mischia con quella di ieri */
        var n = $('chat-nuova'); if (n) n.click();
        c.value = testo; m.click();
        var t = $('ass-testo'); if (t) t.value = '';
        return;
      }
      if (Date.now() < fine) setTimeout(prova, 150);
    })();
  }

  /* ---------------- «Parla»: il pulsante di sempre ---------------- */
  function parla() {
    var g = $('gv-btn');
    if (g) { g.click(); return; }
    /* niente microfono su questo browser: si scrive */
    var t = $('ass-testo'); if (t) { t.placeholder = 'Su questo browser il microfono non c\'è: scrivi qui'; t.focus(); }
  }

  /* ---------------- il saluto ---------------- */
  var nome = '', nomeChiesto = false;
  function saluto() {
    var h = new Date().getHours();
    var s = h < 13 ? 'Buongiorno' : (h < 18 ? 'Buon pomeriggio' : 'Buonasera');
    return s + (nome ? ', ' + nome : '');
  }
  function oggi() {
    try {
      var d = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
      return d.charAt(0).toUpperCase() + d.slice(1);
    } catch (e) { return ''; }
  }
  async function leggiNome() {
    try {
      if (!window._gc || nomeChiesto) return;
      nomeChiesto = true;   /* ⚠️ si chiede UNA volta, ma solo quando _gc c'e': al primo giro spesso non c'e' ancora */
      var s = await window._gc.auth.getSession();
      var uid = s && s.data && s.data.session && s.data.session.user && s.data.session.user.id;
      if (!uid) return;
      var r = await window._gc.from('imprese').select('nome').eq('user_id', uid).maybeSingle();
      var n = r && r.data && r.data.nome ? String(r.data.nome).trim().split(/\s+/)[0] : '';
      if (n && n.length <= 20) {
        nome = n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
        var c = document.querySelector('#ass-box .ass-ciao'); if (c) c.textContent = saluto();
      }
    } catch (e) { /* il saluto senza nome va bene lo stesso */ }
  }

  /* ---------------- la casella ---------------- */
  var SCORCIATOIE = [
    { t: 'Fai un preventivo', fa: function () {
        if (typeof window.gestApriModuloAI === 'function') { vai('preventivi'); window.gestApriModuloAI('preventivo'); }
        else vai('preventivi');
      } },
    { t: 'Racconta la giornata', fa: parla, no: 'studio' },
    /* 6 nov 2026 (sera) — lo studio tecnico non ha giornate di cantiere:
       al loro posto le pratiche e le scadenze che arrivano */
    { t: 'Cosa scade questo mese?', fa: function () { allaChat('Quali scadenze e pratiche ho nei prossimi 30 giorni?'); }, solo: 'studio' },
    { t: 'Fattura da un preventivo', fa: function () { allaChat('Voglio fare la fattura partendo da un preventivo: quali preventivi ho che posso fatturare? Dimmi come si fa.'); } },
    { t: 'Quanto devo incassare?', fa: function () { allaChat('Quanto devo ancora incassare e da chi?'); } },
    /* 7 nov 2026 — collaudo della semplicita' (ok di Alex): «Fotografa» era
       un pulsante da solo in mezzo alla pagina. Sta qui con le altre cose da
       fare; apre la stessa scelta di prima (rieFotoScegli, gest-riepilogo.js). */
    { t: '📷 Fotografa un foglio', fa: function () {
        if (typeof rieFotoScegli === 'function') rieFotoScegli();
        else { var b = document.getElementById('rie-foto'); if (b) b.click(); }
      } }
  ];

  function chiSono() {
    try { return (typeof ruoloUtente !== 'undefined' && ruoloUtente === 'professionista') ? 'studio' : 'impresa'; }
    catch (e) { return 'impresa'; }
  }
  var montatoPer = '';
  /* 11 nov 2026 — IL TUO MESE, in una riga. I numeri li calcola il
     Riepilogo (gest-riepilogo.js, window._tiMese) con le sue regole: qui si
     scrivono e basta. Tutti a zero = la riga non c'e'. Ogni numero porta
     alla sua sezione. */
  var MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  window.assMese = function () {
    var el = $('ass-mese'), d = window._tiMese;
    if (!el) return;
    if (!d || (!(d.inc > 0) && !(d.acc > 0) && !(d.gg > 0))) { el.hidden = true; el.innerHTML = ''; return; }
    var euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true }).format(+d.inc || 0);
    var pz = [];
    pz.push('<button type="button" data-ass-vai="fatture" title="Incassato questo mese, senza IVA: lo stesso numero del Report"><b>' + euro + '</b> incassati</button>');
    if (d.gg != null) pz.push('<button type="button" data-ass-vai="giornate"><b>' + d.gg + '</b> ' + (d.gg === 1 ? 'giornata' : 'giornate') + '</button>');
    pz.push('<button type="button" data-ass-vai="preventivi"><b>' + d.acc + '</b> ' + (d.acc === 1 ? 'preventivo accettato' : 'preventivi accettati') + '</button>');
    el.innerHTML = '<span class="ass-mese-t">' + MESI[new Date().getMonth()] + ':</span>' + pz.join('');
    el.hidden = false;
  };
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-ass-vai]') : null;
    if (b) vai(b.getAttribute('data-ass-vai'));
  });

  function monta() {
    var sez = $('riepilogo'); if (!sez || $('ass-box')) return;
    montatoPer = chiSono();
    var SC = SCORCIATOIE.map(function (x, i) { return { x: x, i: i }; })
      .filter(function (v) { return v.x.no !== montatoPer && (!v.x.solo || v.x.solo === montatoPer); });
    var box = document.createElement('div');   /* ⚠️ NON <section>: nel gestionale ogni section e' una sezione, nascosta se non e' «active» */
    box.id = 'ass-box';
    var conMic = !!$('gv-btn') || !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    box.innerHTML =
        '<h2 class="ass-ciao">' + saluto() + '</h2>'
      + '<div class="ass-data">' + oggi() + '</div>'
      + '<div class="ass-mese" id="ass-mese" hidden></div>'
      + '<div class="ass-tit"><span class="ass-av">' + STELLA + '</span>Cosa facciamo?</div>'
      + '<div class="ass-riga">'
      +   '<textarea id="ass-testo" data-no-dettato rows="1" placeholder="Scrivi o parla come ti viene…" aria-label="Cosa facciamo?"></textarea>'
      +   (conMic ? '<button type="button" class="ass-b ass-parla" id="ass-parla">' + MIC + 'Parla</button>' : '')
      +   '<button type="button" class="ass-b ass-manda" id="ass-manda">Manda</button>'
      + '</div>'
      + '<div class="ass-chips">' + SC.map(function (v) {
          return '<button type="button" class="ass-chip" data-ass="' + v.i + '">' + v.x.t + '</button>';
        }).join('') + '</div>'
      + '<div class="ass-nota">Se l\'assistente non sa rispondere, ti prepara la domanda per l\'assistenza.</div>';
    var intro = sez.querySelector('.rie-intro');
    if (intro) intro.after(box); else sez.insertBefore(box, sez.firstChild);
    window.assMese();

    $('ass-manda').addEventListener('click', function () { allaChat($('ass-testo').value); });
    $('ass-testo').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); allaChat(this.value); }
    });
    var p = $('ass-parla'); if (p) p.addEventListener('click', parla);
    box.querySelector('.ass-chips').addEventListener('click', function (e) {
      var c = e.target.closest('[data-ass]'); if (!c) return;
      SCORCIATOIE[+c.getAttribute('data-ass')].fa();
    });
    leggiNome();
  }

  /* ---------------- «Aiuto» in alto → la Chat ---------------- */
  function aiutoAllaChat() {
    Array.prototype.forEach.call(document.querySelectorAll('[onclick*="apriAiuto"]'), function (b) {
      if (b._assOk) return; b._assOk = true;
      b.onclick = function (e) { e.preventDefault(); vai('chat'); setTimeout(function () { var c = $('chat-domanda'); if (c) c.focus(); }, 400); };
      if (b.hasAttribute('data-aiuto')) b.setAttribute('data-aiuto', 'Fai una domanda all\'assistente: sa come si usa il gestionale e guarda i tuoi dati.');
    });
  }

  /* ---------------- il menu: «Riepilogo» si chiama «Assistente» ---------------- */
  function rinomina(b, da, a) {
    if (!b) return;
    var w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) if (n.nodeValue.trim() === da) { n.nodeValue = n.nodeValue.replace(da, a); return; }
  }

  /* ---------------- la barra in basso del telefono ---------------- */
  function barra() {
    var bb = $('barra-basso'); if (!bb || bb.querySelector('.bb-mic')) return;
    rinomina(bb.querySelector('[data-vai="riepilogo"]'), 'Riepilogo', 'Assistente');   /* 12 nov 2026 — un pulsante, un nome (regola 10): era «Oggi» */
    if (!($('gv-btn') || window.SpeechRecognition || window.webkitSpeechRecognition)) return;
    var m = document.createElement('button');
    m.type = 'button'; m.className = 'bb-mic'; m.setAttribute('aria-label', 'Parla');
    m.innerHTML = MIC;
    m.addEventListener('click', parla);
    var lav = bb.querySelector('[data-vai="lavori"]');
    if (lav) lav.after(m); else bb.appendChild(m);
  }

  /* ---------------- chi e' dove: classi sul body ---------------- */
  function stato() {
    var av = $('appview');
    var dentro = av && av.style.display !== 'none' && getComputedStyle(av).display !== 'none';
    document.body.classList.toggle('ass-fuori', !dentro);
    var rie = $('riepilogo');
    document.body.classList.toggle('ass-rie', !!(dentro && rie && rie.classList.contains('active')));
    var bolla = $('gv-bolla');
    var ascolta = !!(bolla && !bolla.hidden);
    document.body.classList.toggle('ass-ascolta', ascolta);
    var mic = document.querySelector('#barra-basso .bb-mic');
    if (mic) mic.classList.toggle('on', ascolta);
    /* il ruolo si sa dopo qualche istante: se e' cambiato, si rifanno le scorciatoie
       (la casella si rimonta solo se e' vuota, per non buttare quello che sta scrivendo) */
    var bx = $('ass-box'), tt = $('ass-testo');
    if (bx && montatoPer !== chiSono() && !(tt && tt.value)) { bx.remove(); }
    if (!$('ass-box')) monta();
    if (!nome && !nomeChiesto && window._gc) leggiNome();
    aiutoAllaChat();
    barra();
    rinomina(document.querySelector('nav.tabs button[data-tab="riepilogo"]'), 'Riepilogo', 'Assistente');
  }

  /* 7 nov 2026: sul telefono la scritta grigia lunga della ricerca veniva tagliata */
  function ricercaCorta() {
    try {
      var q = document.getElementById('ct-q');
      if (q && window.matchMedia('(max-width:760px)').matches) q.placeholder = 'Cerca un nome';
    } catch (e) {}
  }
  function parti() { ricercaCorta(); stato(); setInterval(stato, 500); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', parti);
  else parti();
})();
