/* =====================================================================
   TrovaImpresa — IL COMANDO A VOCE — 29 ottobre 2026

   Il pulsante «Parla» in basso a destra, su OGNI sezione del gestionale
   (impresa, artigiano, studio tecnico: e' lo stesso gestionale-app.html).
   Premi, dici cosa vuoi fare, e il gestionale apre il modulo giusto gia'
   pieno:
     «segnami un lavoro giovedi' da Rossi, taglio siepe, 350 euro»  -> Lavoro
     «nuovo cliente Mario Bianchi via Roma 3, 333 1234567»           -> Cliente
     «preventivo bagno: massetto 20 metri quadri a 18 euro»          -> Preventivo
     «ricordami di pagare l'F24 il 16 alle 9»                         -> Promemoria
     «revisione del furgone il 12 dicembre»                           -> Scadenza
     «aggiungi intonaco 40 metri quadri a 22 euro» (computo aperto)   -> Lavorazione
     «apri le fatture»                                                -> va li', GRATIS

   - Capire la frase costa 1 CREDITO AI (funzione «comando_voce» in
     supabase/functions/ai-cantiere). Aprire una sezione invece si capisce
     qui, senza AI e senza crediti.
   - ⛔ NON SALVA NIENTE. Apre il modulo pieno: a premere Salva sei tu,
     come in tutto il gestionale. Un errore detto a voce non deve finire
     nei conti senza che tu lo veda.
   - Usa le porte che la Chat con AI usa gia' (AI.compilaLavoroDaChat &c.
     in js/ai-integrazione.js): il modo di riempire un modulo sta in un
     posto solo.
   - Dove il browser non sa ascoltare (Firefox) il pulsante non compare.
   - Si nasconde quando c'e' una finestra aperta e dentro la Chat con AI
     (li' c'e' gia' il suo microfono), come fa il pulsante «✨ AI».

   ⚠️ File chiuso in se' (IIFE). Le funzioni della pagina (promForm,
   compVoceForm, cliCache...) si leggono sempre con typeof davanti.

   29 ottobre 2026 (sera) — LO STESSO FILE IN TRE GESTIONALI (PAG):
   - 'app' gestionale-app.html: quello qui sopra.
   - 'nol' gestionale-noleggio.html: noleggio, cliente, fornitore, prodotto,
     promemoria. Il noleggio non carica ai-integrazione.js: la funzione
     ai-cantiere si chiama qui col gettone della sessione.
   - 'op'  gestionale-operatore.html (app operaio): niente AI in piu'. Quello
     che dici va dritto in «Segna la giornata → Racconta la giornata», che
     c'era gia' e sa fare il rapportino. «Apri le foto» e simili: gratis.
   ===================================================================== */
(function () {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  var PAG = document.getElementById('op-tabs') ? 'op'
          : (/noleggio/.test(location.pathname) ? 'nol'
          : (document.querySelector('nav.tabs') ? 'app' : ''));
  if (!PAG) return;   /* solo nei gestionali */
  var CANTIERE_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co/functions/v1/ai-cantiere';

  var MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/></svg>';
  var STOP = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';

  var css = ''
    + '#gv-btn{position:fixed;right:22px;bottom:22px;z-index:800;display:flex;align-items:center;gap:10px;'
    +   'background:var(--blu,#0066FF);color:#fff;border:0;border-radius:40px;padding:16px 24px;'
    +   'font-size:21px;font-weight:700;font-family:"IBM Plex Sans",Inter,system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.35);cursor:pointer}'
    + '#gv-btn svg{width:26px;height:26px;flex:none}'
    + '#gv-btn.gv-on{background:var(--err,#DC2626)}'
    + '#gv-btn.gv-on svg{animation:gvPulsa 1s ease-in-out infinite}'
    + '#gv-btn:disabled{opacity:.75;cursor:wait}'
    + '@keyframes gvPulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}'
    + '#gv-bolla{position:fixed;right:22px;z-index:801;width:min(440px,calc(100vw - 44px));background:var(--card,#fff);'
    +   'color:var(--testo,#0F172A);border:1.5px solid var(--bordo,#E2E8F0);border-radius:18px;padding:18px 18px 16px;'
    +   'box-shadow:0 10px 36px rgba(0,0,0,.30);font-family:"IBM Plex Sans",Inter,system-ui,sans-serif}'
    + '#gv-bolla[hidden]{display:none}'
    + '.gv-tit{font-size:17px;font-weight:700;color:var(--testo-2,#475569);margin:0 0 8px}'
    + '.gv-detto{font-size:20px;line-height:1.45;min-height:30px;white-space:pre-wrap;word-wrap:break-word}'
    + '.gv-detto--vuoto{color:var(--testo-2,#475569)}'
    + '.gv-msg{font-size:18px;line-height:1.45;margin-top:8px}'
    + '.gv-msg--err{color:var(--err,#DC2626)}'
    + '.gv-az{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;align-items:center}'
    + '.gv-az button{font:inherit;font-size:18px;font-weight:700;border-radius:12px;padding:12px 18px;cursor:pointer;min-height:48px}'
    + '.gv-si{background:var(--blu,#0066FF);color:#fff;border:0}'
    + '.gv-no{background:var(--card,#fff);color:var(--testo,#0F172A);border:1.5px solid var(--bordo,#E2E8F0)}'
    + '.gv-costo{margin-left:auto;font-size:15px;color:var(--testo-2,#475569)}'
    + '.gv-gira{display:inline-block;width:20px;height:20px;border:3px solid var(--bordo,#E2E8F0);border-top-color:var(--blu,#0066FF);'
    +   'border-radius:50%;animation:gvGira .8s linear infinite;vertical-align:-4px;margin-right:8px}'
    + '@keyframes gvGira{to{transform:rotate(360deg)}}'
    + '@media(max-width:600px){#gv-btn{padding:14px 20px;font-size:19px}#gv-bolla{right:12px;width:calc(100vw - 24px)}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var btn = document.createElement('button');
  btn.type = 'button'; btn.id = 'gv-btn';
  btn.setAttribute('aria-label', 'Comando a voce');
  btn.innerHTML = MIC + '<span>Parla</span>';
  var bolla = document.createElement('div');
  bolla.id = 'gv-bolla'; bolla.hidden = true;
  bolla.setAttribute('role', 'dialog'); bolla.setAttribute('aria-live', 'polite');
  document.body.appendChild(bolla); document.body.appendChild(btn);

  /* ---------------- utilita' ---------------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function vis(el) { if (!el) return false; var c = getComputedStyle(el); return c.display !== 'none' && c.visibility !== 'hidden'; }
  function el(id) { return document.getElementById(id); }
  function aspetta(id, ms) {
    return new Promise(function (ok) {
      var fine = Date.now() + (ms || 3000);
      (function prova() { var e = el(id); if (e) return ok(e); if (Date.now() > fine) return ok(null); setTimeout(prova, 120); })();
    });
  }
  function metti(id, v) {
    var e = el(id); if (!e || v == null || String(v).trim() === '') return false;
    e.value = String(v).trim(); e.dispatchEvent(new Event('input', { bubbles: true }));
    e.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  function tendina(sel, nome, ms) {
    if (!sel || !nome) return;
    var cerca = norm(nome), fine = Date.now() + (ms || 3000);
    (function prova() {
      for (var i = 0; i < sel.options.length; i++) {
        if (norm(sel.options[i].textContent) === cerca) { sel.value = sel.options[i].value; sel.dispatchEvent(new Event('change', { bubbles: true })); return; }
      }
      if (Date.now() < fine) setTimeout(prova, 200);
    })();
  }
  function virgola(n) {   /* 18.5 -> «18,50» per le caselle dei soldi */
    var x = Number(n); if (!isFinite(x)) return '';
    return x.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 4, useGrouping: true });
  }
  function avvisa(t) { if (typeof toast === 'function') { try { toast(t); return; } catch (e) {} } }

  /* ---------------- dove sono ---------------- */
  /* il nome scritto sul pulsante, senza il numerino del contatore */
  function nomeBottone(b) {
    var s = b.querySelector('.cta-txt b') || b.querySelector('span:not(.tab-cnt):not([id^="op-n-"])');
    if (s) return s.textContent.trim();
    var c = b.cloneNode(true);
    c.querySelectorAll('.tab-cnt,[id^="op-n-"],svg').forEach(function (x) { x.remove(); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  function sezioni() {
    var out = [];
    if (PAG === 'op') {
      /* le viste in alto (Agenda, Clienti...) e le schede dentro l'Agenda */
      document.querySelectorAll('#app-nav .nav-btn').forEach(function (b) {
        if (b.classList.contains('hidden')) return;
        var lab = nomeBottone(b); if (lab) out.push({ k: b.id, lab: lab, b: b });
      });
      var ag = el('nav-agenda');
      document.querySelectorAll('#op-tabs [data-s]').forEach(function (b) {
        if (b.classList.contains('hidden') || b.style.display === 'none') return;
        var lab = nomeBottone(b);
        if (lab) out.push({ k: 'op-' + b.getAttribute('data-s'), lab: lab, b: b, prima: ag });
      });
      return out;
    }
    document.querySelectorAll('nav.tabs button[data-tab]').forEach(function (b) {
      if (b.style.display === 'none') return;
      var lab = nomeBottone(b);
      if (lab) out.push({ k: b.getAttribute('data-tab'), lab: lab, b: b });
    });
    return out;
  }
  function vaiA(s) {
    chiudiBolla();
    if (s.prima && !s.prima.classList.contains('hidden') && !vis(el('view-agenda'))) s.prima.click();
    setTimeout(function () { s.b.click(); window.scrollTo(0, 0); }, s.prima ? 150 : 0);
  }
  function sezioneAperta() {
    if (PAG === 'op') {
      var v = document.querySelector('#app-nav .nav-btn.active');
      return { k: v ? v.id : '', lab: v ? nomeBottone(v) : '' };
    }
    var b = document.querySelector('nav.tabs button[data-tab].active');
    if (!b) return { k: '', lab: '' };
    return { k: b.getAttribute('data-tab'), lab: nomeBottone(b) };
  }
  function computoAperto() {
    try { return sezioneAperta().k === 'computi' && typeof compVociCompId !== 'undefined' && !!compVociCompId; }
    catch (e) { return false; }
  }

  /* ---------------- quando si vede ---------------- */
  function posiziona() {
    var av = el(PAG === 'op' ? 'app' : 'appview');
    var nascosto = !vis(av)
      || (PAG === 'op' && (vis(el('rv-ov')) || vis(el('view-lavoro')) || vis(el('gate'))))
      || !!document.querySelector('#overlay.open')
      || !!document.querySelector('.ai-ov')
      || !!document.querySelector('#chat.active')
      || (el('rie-fab-menu') && el('rie-fab-menu').style.display === 'block');
    if (nascosto && !ascolta && !lavora) { btn.style.display = 'none'; chiudiBolla(); return; }
    btn.style.display = 'flex';
    var basso = 22;
    var barra = el('barra-basso');
    if (barra && vis(barra)) basso = Math.max(basso, barra.offsetHeight + 12);
    var fabBox = el('rie-fab-box'), fab = el('rie-fab');
    if (fab && fabBox && fabBox.style.display !== 'none') basso = Math.max(basso, 22 + fab.offsetHeight + 12);
    btn.style.bottom = basso + 'px';
    bolla.style.bottom = (basso + btn.offsetHeight + 12) + 'px';
  }

  /* ---------------- la bolla ---------------- */
  var ascolta = false, lavora = false, rec = null, detto = '', annullato = false;

  function chiudiBolla() { bolla.hidden = true; bolla.innerHTML = ''; }
  function disegnaAscolto(provv) {
    var t = (detto + (provv ? ' ' + provv : '')).trim();
    bolla.hidden = false;
    bolla.innerHTML = '<div class="gv-tit">Ti ascolto…</div>'
      + '<div class="gv-detto' + (t ? '' : ' gv-detto--vuoto') + '">' + (t ? esc(t) : 'Di\' cosa vuoi fare') + '</div>'
      + '<div class="gv-az"><button type="button" class="gv-si" data-gv="fatto">Fatto</button>'
      + '<button type="button" class="gv-no" data-gv="annulla">Annulla</button></div>';
    posiziona();
  }
  function disegnaPenso() {
    bolla.hidden = false;
    bolla.innerHTML = '<div class="gv-detto">' + esc(detto) + '</div>'
      + '<div class="gv-msg"><span class="gv-gira"></span>Ci penso io…</div>';
    posiziona();
  }
  function disegnaMsg(testo, errore) {
    bolla.hidden = false;
    bolla.innerHTML = (detto ? '<div class="gv-detto">' + esc(detto) + '</div>' : '')
      + '<div class="gv-msg' + (errore ? ' gv-msg--err' : '') + '">' + esc(testo) + '</div>'
      + '<div class="gv-az"><button type="button" class="gv-si" data-gv="ancora">Riprova</button>'
      + '<button type="button" class="gv-no" data-gv="chiudi">Chiudi</button></div>';
    posiziona();
  }
  bolla.addEventListener('click', function (e) {
    var b = e.target.closest('[data-gv]'); if (!b) return;
    var a = b.getAttribute('data-gv');
    if (a === 'fatto') ferma(false);
    else if (a === 'annulla') ferma(true);
    else if (a === 'chiudi') chiudiBolla();
    else if (a === 'ancora') parti();
  });

  function etichetta() {
    btn.classList.toggle('gv-on', ascolta);
    btn.disabled = lavora;
    btn.innerHTML = ascolta ? (STOP + '<span>Fatto</span>') : (MIC + '<span>Parla</span>');
    btn.setAttribute('aria-pressed', ascolta ? 'true' : 'false');
  }

  /* ---------------- ascoltare ---------------- */
  function parti() {
    if (lavora) return;
    try { rec = new SR(); } catch (e) { disegnaMsg('Il microfono non parte su questo browser.', true); return; }
    rec.lang = 'it-IT'; rec.continuous = true; rec.interimResults = true;
    detto = ''; annullato = false;
    rec.onresult = function (ev) {
      var provv = '';
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        var r = ev.results[i];
        if (r.isFinal) detto = (detto + ' ' + r[0].transcript).trim();
        else provv += r[0].transcript;
      }
      disegnaAscolto(provv.trim());
    };
    rec.onerror = function (ev) {
      var m = {
        'not-allowed': 'Il browser non ha il permesso del microfono. Premi il lucchetto accanto all\'indirizzo e consenti il microfono.',
        'service-not-allowed': 'Il browser non ha il permesso del microfono.',
        'no-speech': 'Non ho sentito niente. Riprova parlando più vicino.',
        'audio-capture': 'Non trovo il microfono su questo dispositivo.',
        'network': 'Per capire la voce serve internet.'
      };
      if (ev.error === 'aborted') return;
      annullato = true;
      disegnaMsg(m[ev.error] || 'Il microfono si è fermato. Riprova.', true);
    };
    rec.onend = function () {
      ascolta = false; rec = null; etichetta();
      if (annullato) return;
      if (detto.trim().length < 3) { disegnaMsg('Non ho sentito niente. Riprova.', true); return; }
      esegui(detto.trim());
    };
    try { rec.start(); } catch (e) { disegnaMsg('Il microfono non parte. Riprova fra un attimo.', true); return; }
    ascolta = true; etichetta(); disegnaAscolto('');
  }
  function ferma(annulla) {
    annullato = !!annulla;
    if (rec) { try { rec.stop(); } catch (e) {} }
    if (annulla) chiudiBolla();
  }
  btn.addEventListener('click', function () { if (ascolta) ferma(false); else parti(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && ascolta) ferma(true); });

  /* ---------------- capire ---------------- */
  /* «apri le fatture», «vai al calendario»: si capisce qui, gratis */
  function navigazioneLocale(t) {
    var p = norm(t).split(' ');
    if (!/^(apri|aprimi|vai|portami|mostrami|fammi)$/.test(p[0] || '')) return null;
    var vuote = /^(vedere|a|al|alla|allo|ai|agli|alle|in|nel|nella|nello|nei|negli|nelle|sul|sulla|su|il|lo|la|l|i|gli|le|sezione|mi)$/;
    var k = 1; while (k < p.length && vuote.test(p[k])) k++;
    var cosa = p.slice(k).join(' ');
    if (!cosa) return null;
    var s = sezioni(), i;
    for (i = 0; i < s.length; i++) if (norm(s[i].lab) === cosa) return s[i];
    for (i = 0; i < s.length; i++) { var l = norm(s[i].lab); if (l.indexOf(cosa) === 0 || cosa.indexOf(l) === 0) return s[i]; }
    return null;
  }

  function giornoOggi() {
    try { return new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Rome' }); }
    catch (e) { return new Date().toDateString(); }
  }
  function contesto(t) {
    var ap = sezioneAperta();
    var cli = [];
    try { if (typeof cliCache !== 'undefined' && Array.isArray(cliCache)) cliCache.slice(0, 120).forEach(function (c) { if (c && c.nome) cli.push(String(c.nome)); }); } catch (e) {}
    var sez = sezioni().map(function (s) { return s.k + ' = ' + s.lab; }).join('; ');
    var azioni = PAG === 'nol'
      ? 'noleggio, cliente, fornitore, prodotto, promemoria, vai, non_capito'
      : 'lavoro, cliente, preventivo, scadenza, fornitore, promemoria, voce_computo, vai, non_capito';
    return 'GIORNO DI OGGI: ' + giornoOggi() + '\n'
      + 'GESTIONALE: ' + (PAG === 'nol' ? 'noleggio di mezzi e attrezzature' : 'imprese e artigiani') + '\n'
      + 'AZIONI POSSIBILI: ' + azioni + '\n'
      + 'SEZIONE APERTA: ' + (ap.lab || 'Riepilogo') + '\n'
      + 'COMPUTO APERTO: ' + (computoAperto() ? 'si' : 'no') + '\n'
      + 'CLIENTI DEL REPARTO: ' + (cli.length ? cli.join('; ') : 'nessuno') + '\n'
      + 'SEZIONI DEL MENU (chiave = nome): ' + sez + '\n\n'
      + 'HA DETTO: «' + t.slice(0, 1500) + '»';
  }

  /* il noleggio non ha js/ai-integrazione.js: la funzione si chiama qui */
  async function chiamaNoleggio(testo) {
    var tok = null;
    try { tok = (await sb.auth.getSession()).data.session.access_token; } catch (e) {}
    if (!tok) throw new Error('Sessione scaduta: esci e rientra.');
    var res;
    try {
      res = await fetch(CANTIERE_URL, { method: 'POST',
        headers: { 'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature: 'comando_voce', input: testo, file: null }) });
    } catch (e) { throw new Error('Non riesco a raggiungere l\'assistente: controlla la connessione.'); }
    var body = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(body.error || 'L\'assistente non ha risposto. Riprova fra un attimo.');
    try { return JSON.parse(body.result); } catch (e) { throw new Error('Non ho capito. Riprova.'); }
  }

  /* app operaio: quello che dici va in «Racconta la giornata», che c'era gia' */
  function raccontaGiornata(t) {
    if (typeof rvApri !== 'function' || typeof RV === 'undefined') { disegnaMsg('Ricarica la pagina e riprova.', true); return; }
    if (typeof puo === 'function' && !puo('rapportini')) { disegnaMsg('Il capo non ti ha dato il permesso dei rapportini. A voce puoi dire «apri le foto», «apri la chat»…', true); return; }
    chiudiBolla();
    rvApri();
    RV.tipo = 'voce'; RV.detto = t;
    var solo = typeof rvUnicoDiOggi === 'function' ? rvUnicoDiOggi() : null;
    if (solo) { RV.lavoro = solo; RV.passo = 3; RV.autoLavoro = true; }
    else { RV.lavoro = null; RV.passo = 2; RV.autoLavoro = false; }
    rvDisegna();
  }

  async function esegui(t) {
    var dove = navigazioneLocale(t);
    if (dove) { vaiA(dove); return; }
    if (PAG === 'op') { raccontaGiornata(t); return; }

    if (PAG === 'app' && (!window.AI || typeof window.AI.cantiere !== 'function')) {
      disegnaMsg('L\'assistente non si è caricato. Ricarica la pagina e riprova.', true); return;
    }
    lavora = true; etichetta(); disegnaPenso();
    var r = null;
    try {
      r = PAG === 'nol' ? await chiamaNoleggio(contesto(t))
                        : await window.AI.cantiere('comando_voce', contesto(t), null, true);
    }
    catch (e) { lavora = false; etichetta(); disegnaMsg((e && e.message) || 'Non ho capito. Riprova.', true); return; }
    lavora = false; etichetta();
    if (r === null) { chiudiBolla(); return; }   /* crediti finiti: la finestra l'ha gia' aperta l'AI */
    try { await (PAG === 'nol' ? apriNoleggio(r || {}) : apri(r || {})); }
    catch (e) { disegnaMsg('Ho capito, ma il modulo non si è aperto. Riprova.', true); }
  }

  /* ---------------- fare ---------------- */
  var DATA = /^\d{4}-\d{2}-\d{2}$/;
  function pulisci(c) {
    var o = {}; c = c || {};
    Object.keys(c).forEach(function (k) {
      var v = c[k];
      if (v === null || v === undefined || Array.isArray(v) || typeof v === 'object') return;
      v = String(v).trim().slice(0, 300); if (!v) return;
      if (k === 'data' && !DATA.test(v)) return;
      o[k] = v;
    });
    return o;
  }
  var PORTE = { lavoro: 'compilaLavoroDaChat', cliente: 'compilaClienteDaChat', scadenza: 'compilaScadenzaDaChat', fornitore: 'compilaFornitoreDaChat' };

  async function apri(r) {
    var az = String(r.azione || ''), c = r.campi || {};
    if (az === 'vai') {
      var s = sezioni().filter(function (x) { return x.k === r.sezione; })[0];
      if (!s) return disegnaMsg('Questa sezione non la trovo nel tuo menu.', true);
      vaiA(s); return;
    }
    if (PORTE[az]) {
      var p = pulisci(c);
      if (!window.AI[PORTE[az]] || !window.AI[PORTE[az]](p)) return disegnaMsg('Il modulo non riesco ad aprirlo. Ricarica la pagina e riprova.', true);
      chiudiBolla(); return;
    }
    if (az === 'preventivo') {
      var voci = (Array.isArray(c.voci) ? c.voci : []).slice(0, 30).map(function (v) {
        if (!v || !String(v.descrizione || '').trim()) return null;
        var o = { descrizione: String(v.descrizione).trim().slice(0, 200) };
        if (v.unita) o.unita = String(v.unita).trim().slice(0, 12);
        var q = Number(v.quantita); if (isFinite(q) && q > 0) o.quantita = q;
        if (v.prezzo_unitario !== null && v.prezzo_unitario !== undefined && v.prezzo_unitario !== '') {
          var pz = Number(v.prezzo_unitario); if (isFinite(pz) && pz >= 0) o.prezzo_unitario = pz;
        }
        return o;
      }).filter(Boolean);
      var tit = String(c.titolo || '').trim() || 'Preventivo';
      if (typeof window.AI.compilaPreventivoDaChat !== 'function' || !window.AI.compilaPreventivoDaChat({ titolo: tit, voci: voci }))
        return disegnaMsg('Il preventivo non riesco ad aprirlo. Ricarica la pagina e riprova.', true);
      chiudiBolla();
      if (c.cliente) { var s1 = await aspetta('pv-cli', 3000); if (s1 && s1.tagName === 'SELECT') tendina(s1, c.cliente, 3000); }
      return;
    }
    if (az === 'promemoria') {
      if (typeof promForm !== 'function') return disegnaMsg('I promemoria non si sono caricati. Ricarica la pagina.', true);
      var pm = pulisci(c);
      promForm(null); chiudiBolla();
      await aspetta('p-testo', 2000);
      metti('p-testo', pm.testo); metti('p-data', pm.data); metti('p-note', pm.note);
      if (pm.ora && /^\d{1,2}:\d{2}$/.test(pm.ora)) metti('p-ora', pm.ora.length === 4 ? '0' + pm.ora : pm.ora);
      avvisa('Controlla e premi Salva');
      return;
    }
    if (az === 'voce_computo') {
      if (!computoAperto() || typeof compVoceForm !== 'function') return disegnaMsg('Prima apri il computo, poi dimmi la lavorazione.', true);
      chiudiBolla();
      await compVoceForm(null);
      await aspetta('cv-desc', 3000);
      metti('cv-desc', c.descrizione);
      var u = el('cv-uni');
      if (u && c.unita) { for (var i = 0; i < u.options.length; i++) if (u.options[i].value === String(c.unita).trim()) { u.value = u.options[i].value; u.dispatchEvent(new Event('change', { bubbles: true })); break; } }
      if (c.prezzo_unitario !== null && c.prezzo_unitario !== undefined && c.prezzo_unitario !== '' && isFinite(Number(c.prezzo_unitario)))
        metti('cv-prezzo', virgola(c.prezzo_unitario));
      var q2 = Number(c.quantita);
      if (isFinite(q2) && q2 > 0) {
        var corpo = document.querySelector('#cv-conta button[data-v="corpo"]');
        if (corpo && !corpo.classList.contains('on')) corpo.click();
        await aspetta('cv-qta', 1000);
        metti('cv-qta', q2.toLocaleString('it-IT', { maximumFractionDigits: 3, useGrouping: false }));
      }
      avvisa('Controlla e premi Salva');
      return;
    }
    disegnaMsg(String(r.messaggio || '').trim() || 'Questo non lo so fare a voce. Posso aprirti un lavoro, un cliente, un preventivo, un promemoria o una scadenza.', false);
  }

  /* ---------------- noleggio ---------------- */
  /* la tendina del mezzo: «la miniescavatore» deve trovare «Miniescavatore 1,5 t (ME01)» */
  function tendinaLarga(sel, nome, ms) {
    if (!sel || !nome) return;
    var cerca = norm(nome), fine = Date.now() + (ms || 3000);
    (function prova() {
      var trovata = null, i, t;
      for (i = 0; i < sel.options.length; i++) { if (sel.options[i].value && norm(sel.options[i].textContent) === cerca) { trovata = sel.options[i]; break; } }
      if (!trovata) for (i = 0; i < sel.options.length; i++) {
        t = norm(sel.options[i].textContent);
        if (sel.options[i].value && t && (t.indexOf(cerca) >= 0 || cerca.indexOf(t) >= 0)) { trovata = sel.options[i]; break; }
      }
      if (trovata) { sel.value = trovata.value; sel.dispatchEvent(new Event('change', { bubbles: true })); return; }
      if (Date.now() < fine) setTimeout(prova, 200);
    })();
  }
  async function apriNoleggio(r) {
    var az = String(r.azione || ''), c = r.campi || {}, p = pulisci(c);
    var giorno = function (x) { return DATA.test(String(x || '')) ? String(x) : ''; };
    if (az === 'vai') {
      var s = sezioni().filter(function (x) { return x.k === r.sezione; })[0];
      if (!s) return disegnaMsg('Questa sezione non la trovo nel tuo menu.', true);
      vaiA(s); return;
    }
    var FORM = { noleggio: 'schedaNoleggio', cliente: 'schedaClienteNol', fornitore: 'schedaFornitore', prodotto: 'schedaProdotto', promemoria: 'promForm' };
    var nomeF = FORM[az];
    if (!nomeF) return disegnaMsg(String(r.messaggio || '').trim() || 'Questo non lo so fare a voce. Posso aprirti un noleggio, un cliente, un fornitore, un prodotto o un promemoria.', false);
    var f = null;
    try { f = { schedaNoleggio: typeof schedaNoleggio === 'function' ? schedaNoleggio : null,
                schedaClienteNol: typeof schedaClienteNol === 'function' ? schedaClienteNol : null,
                schedaFornitore: typeof schedaFornitore === 'function' ? schedaFornitore : null,
                schedaProdotto: typeof schedaProdotto === 'function' ? schedaProdotto : null,
                promForm: typeof promForm === 'function' ? promForm : null }[nomeF]; } catch (e) {}
    if (!f) return disegnaMsg('Il modulo non riesco ad aprirlo. Ricarica la pagina e riprova.', true);
    chiudiBolla();
    await f(null);
    if (az === 'noleggio') {
      await aspetta('nn-mezzo', 3000);
      tendinaLarga(el('nn-mezzo'), p.mezzo, 3000);
      tendinaLarga(el('nn-cliente'), p.cliente, 3000);
      metti('nn-luogo', p.luogo); metti('nn-note', p.note);
      metti('nn-uscita', giorno(p.uscita)); metti('nn-prevista', giorno(p.rientro));
      if (p.ora && /^\d{1,2}:\d{2}$/.test(p.ora)) metti('nn-ora-uscita', p.ora.length === 4 ? '0' + p.ora : p.ora);
    } else if (az === 'cliente') {
      await aspetta('ncl-nome', 2000);
      metti('ncl-nome', p.nome); metti('ncl-indirizzo', p.indirizzo); metti('ncl-telefono', p.telefono);
      metti('ncl-email', p.email); metti('ncl-piva', p.piva);
    } else if (az === 'fornitore') {
      await aspetta('nf-nome', 2000);
      metti('nf-nome', p.nome); metti('nf-indirizzo', p.indirizzo); metti('nf-telefono', p.telefono);
      metti('nf-email', p.email); metti('nf-piva', p.piva);
    } else if (az === 'prodotto') {
      await aspetta('np-nome', 2000);
      metti('np-nome', p.nome); metti('np-categoria', p.categoria); metti('np-unita', p.unita);
      if (p.prezzo && isFinite(Number(p.prezzo))) metti('np-prezzo', virgola(p.prezzo));
      if (p.quantita && isFinite(Number(p.quantita))) metti('np-quantita', Number(p.quantita).toLocaleString('it-IT', { maximumFractionDigits: 3, useGrouping: false }));
    } else if (az === 'promemoria') {
      await aspetta('p-testo', 2000);
      metti('p-testo', p.testo); metti('p-data', p.data); metti('p-note', p.note);
      if (p.ora && /^\d{1,2}:\d{2}$/.test(p.ora)) metti('p-ora', p.ora.length === 4 ? '0' + p.ora : p.ora);
    }
    avvisa('Controlla e premi Salva');
  }

  /* ---------------- partenza ---------------- */
  etichetta();
  posiziona();
  setInterval(posiziona, 700);
  window.addEventListener('resize', posiziona);
})();
