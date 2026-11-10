/* =====================================================================
   PARLA — UN AIUTANTE PER TUTTO — 3 novembre 2026

   Chiesto da Alessio: «Giornate di cantiere» (detto come viene, scritto
   giusto) non solo per capo e operaio, ma un aiuto per piu' cose, per
   chi usa il gestionale. Deciso con lui: si unisce al pulsante «Parla»
   che c'era gia' (gest-voce.js).

   Come va:
   - premi Parla e racconti tutto insieme («oggi Wahid e Luis a
     Campoloniano, spesi 45 euro di sabbia, domani chiamare il
     commercialista»);
   - ai-correggi (modo «assistente», GRATIS) lo divide in schede:
     giornata, spesa, promemoria, nota sul cantiere, altro;
   - si apre una finestra a tutta pagina con le schede: Cambia, Togli,
     e «Salva tutto» le scrive in un colpo;
   - quello che non e' una di queste (un preventivo, un cliente nuovo...)
     resta in una scheda «Da aprire» che usa il «Parla» di prima
     (comando_voce, 1 credito). Se TUTTO e' «altro», si va dritti li'.

   ⛔ Le giornate si scrivono con giorScrivi() di gest-giornate.js: le
      8 ore divise, il cantiere trovato o creato, il rapportino e le ore
      stanno in UN posto solo. Questo file non le rifa'.
   ⛔ L'AI non scrive niente: prepara le schede, salva chi preme.
   File chiuso in se' (IIFE). Fuori esce solo window.gestParla(t, vecchio).
   ===================================================================== */
(function () {
  var URL_AI = 'https://nacvrsgkyfavykxjxszu.supabase.co/functions/v1/ai-correggi';
  var MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
  var GG = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
  var DATA = /^\d{4}-\d{2}-\d{2}$/;

  var css = ''
    + '#gp-ov{position:fixed;top:0;right:0;bottom:0;left:0;z-index:850;background:#F1F5F9;overflow-y:auto;'
    +   'font-family:"IBM Plex Sans",Inter,system-ui,sans-serif;color:#0F172A}'
    + '#gp-ov[hidden]{display:none}'
    + '.gp-in{max-width:1150px;margin:0 auto;padding:28px 24px 140px}'
    + '.gp-top{display:flex;align-items:flex-start;gap:16px;margin-bottom:8px}'
    + '.gp-top h2{flex:1;margin:0;font-size:32px;line-height:1.2}'
    + '.gp-x{background:#fff;border:1.5px solid #CBD5E1;border-radius:12px;font:inherit;font-size:18px;font-weight:700;padding:10px 18px;cursor:pointer;min-height:48px}'
    + '.gp-detto{font-size:18px;line-height:1.5;color:#475569;margin:0 0 20px;padding:12px 16px;background:#fff;border-radius:12px;border:1px solid #E2E8F0}'
    + '.gp-detto b{color:#0F172A}'
    + '.gp-foto{display:block;max-width:100%;max-height:260px;border-radius:12px;border:1px solid #E2E8F0;margin:0 0 20px;background:#fff}'
    + '.gp-io{background:#FFF7ED;border:1.5px solid #FDBA74;border-radius:14px;padding:16px;margin-bottom:18px;font-size:19px}'
    + '.gp-io select{font:inherit;font-size:19px;padding:10px;border-radius:10px;border:1.5px solid #CBD5E1;margin-top:8px;min-width:260px;max-width:100%}'
    + '.gp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}'
    + '.gp-c{background:#fff;border:1.5px solid #E2E8F0;border-left:6px solid var(--c,#0066FF);border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:10px}'
    + '.gp-tipo{font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--c,#0066FF)}'
    + '.gp-tit{font-size:24px;font-weight:700;line-height:1.3;overflow-wrap:anywhere}'
    + '.gp-r{font-size:20px;line-height:1.45;overflow-wrap:anywhere}'
    + '.gp-r span{display:block;font-size:16px;color:#64748B;font-weight:600}'
    + '.gp-az{display:flex;gap:10px;flex-wrap:wrap;margin-top:auto;padding-top:6px}'
    + '.gp-az button,.gp-pie button{font:inherit;font-size:18px;font-weight:700;border-radius:12px;padding:11px 18px;cursor:pointer;min-height:48px}'
    + '.gp-b{background:#fff;color:#0F172A;border:1.5px solid #CBD5E1}'
    + '.gp-b--rosso{color:#DC2626}'
    + '.gp-b--blu{background:#0066FF;color:#fff;border:0}'
    + '.gp-b:disabled{opacity:.5;cursor:not-allowed}'
    + '.gp-c label{display:block;font-size:16px;font-weight:600;color:#475569}'
    + '.gp-c input,.gp-c textarea{display:block;width:100%;box-sizing:border-box;font:inherit;font-size:19px;padding:10px 12px;border:1.5px solid #CBD5E1;border-radius:10px;margin-top:4px}'
    + '.gp-c textarea{min-height:90px;resize:vertical}'
    + '.gp-due{display:grid;grid-template-columns:1fr 1fr;gap:10px}'
    + '.gp-nota{font-size:16px;color:#64748B}'
    + '.gp-msg{font-size:19px;line-height:1.45;padding:14px 16px;border-radius:12px;margin-bottom:18px}'
    + '.gp-msg--ok{background:#DCFCE7;color:#166534}'
    + '.gp-msg--err{background:#FEE2E2;color:#991B1B}'
    + '.gp-pie{position:fixed;bottom:0;right:0;z-index:851;background:#fff;font-family:"IBM Plex Sans",Inter,system-ui,sans-serif;border-top:1.5px solid #E2E8F0;padding:14px 24px;'
    +   'display:flex;gap:12px;justify-content:center;flex-wrap:wrap}'
    + '.gp-pie[hidden]{display:none}'
    + '.gp-pie .gp-b--blu{font-size:21px;padding:14px 28px}'
    + '@media(max-width:880px){.gp-grid{grid-template-columns:1fr}.gp-in{padding:18px 14px 150px}.gp-top h2{font-size:26px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var COLORI = { giornata: '#16A34A', spesa: '#DC2626', promemoria: '#D97706', nota: '#7C3AED', altro: '#0066FF' };
  var NOMI = { giornata: 'Giornata di lavoro', spesa: 'Spesa', promemoria: 'Promemoria', nota: 'Nota sul cantiere', altro: 'Da aprire nel gestionale' };

  var P = null;   /* { detto, cose:[], vecchio, msg } */
  var ov = null, pie = null;

  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function oggi() { return typeof _gOggi === 'function' ? _gOggi() : new Date().toISOString().slice(0, 10); }
  function giorno(iso) {
    if (!DATA.test(iso || '')) return '';
    if (iso === oggi()) return 'oggi';
    var d = new Date(iso + 'T12:00'), dom = new Date(oggi() + 'T12:00'); dom.setDate(dom.getDate() + 1);
    var t = GG[d.getDay()] + ' ' + d.getDate() + ' ' + MESI[d.getMonth()];
    return (d.toDateString() === dom.toDateString() ? 'domani, ' : '') + t;
  }
  function euro(n) { return (+n || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true }) + ' €'; }
  function numero(s) { var n = parseFloat(String(s == null ? '' : s).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); return isFinite(n) ? n : NaN; }
  function maiu(s) { s = String(s || '').trim(); return s.charAt(0).toUpperCase() + s.slice(1); }
  function cantiere(s) { s = String(s || '').trim().slice(0, 120); return s === s.toLowerCase() ? s.replace(/(^|\s)(\S)/g, function (m, a, b) { return a + b.toUpperCase(); }) : s; }
  function ops() { return typeof giorOps !== 'undefined' ? giorOps : []; }
  function lavori() { return typeof giorLav !== 'undefined' ? giorLav : []; }
  function nomeLav(l) { return typeof _gNomeLav === 'function' ? _gNomeLav(l) : ((l && (l.descrizione || l.dove)) || 'Cantiere'); }
  function io() { return typeof _gIo === 'function' ? _gIo() : ''; }

  async function token() {
    try { var r = await sb.auth.getSession(); return r && r.data && r.data.session && r.data.session.access_token; } catch (x) { return null; }
  }

  /* ---------------- capire ---------------- */
  async function capisci(t) {
    var tk = await token(); if (!tk) return null;
    try { if (typeof giorAssicura === 'function') await giorAssicura(); } catch (x) {}
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 25000) : null;
    try {
      var r = await fetch(URL_AI, {
        method: 'POST', signal: ctrl ? ctrl.signal : undefined,
        headers: { Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' },
        body: JSON.stringify({ modo: 'assistente', testo: t.slice(0, 3000), oggi: oggi() + ' ' + GG[new Date().getDay()],
          squadra: ops().map(function (o) { return o.nome; }),
          cantieri: lavori().map(nomeLav).filter(function (v, i, a) { return a.indexOf(v) === i; }).slice(0, 80) })
      });
      var b = await r.json().catch(function () { return {}; });
      return r.ok && b.result && Array.isArray(b.result.cose) ? b.result.cose : null;
    } catch (x) { return null; }
    finally { if (timer) clearTimeout(timer); }
  }

  function nomeVero(n) {
    n = String(n || '').trim(); if (!n) return null;
    if (/^io$/i.test(n)) return 'IO';
    var x = typeof giorDaNome === 'function' ? giorDaNome(n) : null;
    return x || maiu(n);
  }

  function pulisci(c) {
    var t = String(c && c.tipo || '');
    if (t === 'giornata') {
      var chi = []; (Array.isArray(c.chi) ? c.chi : []).forEach(function (n) { var x = nomeVero(n); if (x && chi.indexOf(x) < 0) chi.push(x); });
      return { tipo: t, data: DATA.test(c.data || '') ? c.data : oggi(), chi: chi, dove: cantiere(c.dove), cosa: maiu(String(c.cosa || '').slice(0, 2000)) };
    }
    if (t === 'spesa') {
      var imp = typeof c.importo === 'number' ? c.importo : numero(c.importo);
      return { tipo: t, data: DATA.test(c.data || '') ? c.data : oggi(), descrizione: maiu(String(c.descrizione || '').slice(0, 300)), importo: isFinite(imp) && imp > 0 ? Math.round(imp * 100) / 100 : null, dove: cantiere(c.dove) };
    }
    if (t === 'promemoria') {
      return { tipo: t, data: DATA.test(c.data || '') ? c.data : oggi(), ora: /^\d{1,2}:\d{2}$/.test(c.ora || '') ? c.ora : '', testo: maiu(String(c.testo || '').slice(0, 500)) };
    }
    if (t === 'nota') return { tipo: t, dove: cantiere(c.dove), testo: maiu(String(c.testo || '').slice(0, 2000)) };
    return { tipo: 'altro', testo: maiu(String(c && (c.testo || c.cosa) || '').slice(0, 1000)) };
  }

  /* ---------------- disegnare ---------------- */
  function nomeChi(n) {
    if (n !== 'IO') return n;
    var i = io();
    if (i === '-') return null;
    var o = ops().find(function (x) { return String(x.id) === String(i); });
    return o ? o.nome + ' (tu)' : 'Tu';
  }
  function serveIo() { return !io() && P.cose.some(function (c) { return c.tipo === 'giornata' && c.chi.indexOf('IO') >= 0; }); }

  function campo(lab, f, v, tipo) {
    var extra = tipo === 'dove' ? ' list="gp-cantieri"' : (tipo === 'soldi' ? ' inputmode="decimal"' : '');
    var ty = tipo === 'date' ? 'date' : (tipo === 'time' ? 'time' : 'text');
    return '<label>' + lab + '<input type="' + ty + '" data-f="' + f + '" value="' + e(v) + '"' + extra + '></label>';
  }
  function scheda(c, i) {
    var bolla = c.tipo === 'spesa' && c.importo == null && c.merce && c.merce.length;
    var h = '<div class="gp-c" style="--c:' + (bolla ? '#0066FF' : COLORI[c.tipo]) + '" data-i="' + i + '"><div class="gp-tipo">' + (bolla ? 'Bolla del fornitore' : NOMI[c.tipo]) + '</div>';
    if (c.mod) {
      if (c.tipo === 'giornata') h += '<div class="gp-due">' + campo('Giorno', 'data', c.data, 'date') + campo('Cantiere', 'dove', c.dove, 'dove') + '</div>'
        + campo('Chi c\'era (separati da virgola)', 'chi', c.chi.map(function (n) { return n === 'IO' ? 'io' : n; }).join(', '))
        + '<label>Cosa avete fatto<textarea data-f="cosa">' + e(c.cosa) + '</textarea></label>';
      if (c.tipo === 'spesa') h += '<div class="gp-due">' + campo('Giorno', 'data', c.data, 'date') + campo('Quanto (€)', 'importo', c.importo == null ? '' : String(c.importo).replace('.', ','), 'soldi') + '</div>'
        + campo('Cosa hai comprato', 'descrizione', c.descrizione) + campo('Per quale cantiere', 'dove', c.dove, 'dove');
      if (c.tipo === 'promemoria') h += '<div class="gp-due">' + campo('Giorno', 'data', c.data, 'date') + campo('Ora (se serve)', 'ora', c.ora, 'time') + '</div>'
        + '<label>Cosa ricordare<textarea data-f="testo">' + e(c.testo) + '</textarea></label>';
      if (c.tipo === 'nota') h += campo('Cantiere', 'dove', c.dove, 'dove') + '<label>La nota<textarea data-f="testo">' + e(c.testo) + '</textarea></label>';
      if (c.tipo === 'altro') h += '<label>Cosa vuoi fare<textarea data-f="testo">' + e(c.testo) + '</textarea></label>';
      return h + '<div class="gp-az"><button type="button" class="gp-b gp-b--blu" data-gp="ok">Fatto</button></div></div>';
    }
    if (c.tipo === 'giornata') {
      var chi = c.chi.map(nomeChi).filter(Boolean);
      h += '<div class="gp-tit">' + e(maiu(giorno(c.data))) + ' · ' + e(c.dove || 'cantiere da scegliere') + '</div>'
        + '<div class="gp-r"><span>Chi c\'era</span>' + (chi.length ? e(chi.join(', ')) : '<i>nessuno</i>') + '</div>'
        + (c.cosa ? '<div class="gp-r"><span>Cosa avete fatto</span>' + e(c.cosa) + '</div>' : '');
      var nuovi = c.chi.filter(function (n) { return n !== 'IO' && !ops().some(function (o) { return o.nome === n; }); });
      if (nuovi.length) h += '<div class="gp-nota">' + e(nuovi.join(', ')) + (nuovi.length === 1 ? ' non è' : ' non sono') + ' ancora in Squadra: lo aggiungo io.</div>';
    }
    if (c.tipo === 'spesa') h += '<div class="gp-tit">' + (c.importo == null ? (c.merce && c.merce.length ? e(c.fornitore || 'Bolla') : 'Quanto?') : e(euro(c.importo)) + ' · ' + e(c.descrizione || 'spesa')) + '</div>'
      + '<div class="gp-r"><span>Cantiere</span>' + (c.dove ? e(c.dove) : '<b style="color:#DC2626">da scegliere: premi «Cambia»</b>') + '</div><div class="gp-r"><span>Giorno</span>' + e(maiu(giorno(c.data))) + '</div>'
      + (c.fornitore && !(c.importo == null && c.fornitoreId) ? '<div class="gp-r"><span>Fornitore</span>' + e(c.fornitore) + (c.fornitoreId ? '' : ' <i>(nuovo: lo aggiungo ai tuoi fornitori)</i>') + '</div>' : '')
      + (c.merce && c.merce.length ? '<div class="gp-r"><span>Merce (' + c.merce.length + ')</span>' + c.merce.slice(0, 6).map(function (m) { return e(m.nome) + (m.quantita != null ? ' · ' + e(String(m.quantita).replace('.', ',')) + (m.unita ? ' ' + e(m.unita) : '') : ''); }).join('<br>') + (c.merce.length > 6 ? '<br><i>e altre ' + (c.merce.length - 6) + '</i>' : '') + '</div>'
        + '<div class="gp-nota">' + (c.importo == null ? 'È una bolla senza prezzo: la merce va negli Acquisti del mese, per il confronto con la fattura.' : 'La merce va anche negli Acquisti del mese.') + '</div>' : '')
      + (c.foto ? '<div class="gp-nota">La foto resta fra i documenti del cantiere.</div>' : '');
    if (c.tipo === 'promemoria') h += '<div class="gp-tit">' + e(c.testo) + '</div><div class="gp-r"><span>Quando</span>' + e(maiu(giorno(c.data))) + (c.ora ? ' alle ' + e(c.ora) : '') + '</div>';
    if (c.tipo === 'nota') h += '<div class="gp-tit">' + e(c.dove || 'cantiere da scegliere') + '</div><div class="gp-r">' + e(c.testo) + '</div>';
    if (c.tipo === 'altro') {
      var blocco = P.cose.some(function (x) { return x.tipo !== 'altro'; });
      h += '<div class="gp-tit">' + e(c.testo) + '</div>'
        + '<div class="gp-nota">' + (blocco ? 'Prima premi «Salva tutto», poi lo apro.' : 'Apro il modulo già compilato. Costa 1 credito.') + '</div>'
        + '<div class="gp-az"><button type="button" class="gp-b gp-b--blu" data-gp="apri"' + (blocco ? ' disabled' : '') + '>Apri</button>'
        + '<button type="button" class="gp-b" data-gp="cambia">Cambia</button><button type="button" class="gp-b gp-b--rosso" data-gp="togli">Togli</button></div></div>';
      return h;
    }
    return h + '<div class="gp-az"><button type="button" class="gp-b" data-gp="cambia">Cambia</button><button type="button" class="gp-b gp-b--rosso" data-gp="togli">Togli</button></div></div>';
  }

  function disegna() {
    var da = P.cose.filter(function (c) { return c.tipo !== 'altro'; }).length;
    var h = '<div class="gp-in"><div class="gp-top"><h2>' + (P.leggendo ? 'Sto leggendo la bolla…' : P.cose.length ? 'Ecco cosa ho capito' : 'Fatto') + '</h2><button type="button" class="gp-x" data-gp="chiudi">Chiudi</button></div>'
      + (P.anteprima ? '<img class="gp-foto" src="' + P.anteprima + '" alt="La foto">' : '<p class="gp-detto"><b>Hai detto:</b> ' + e(P.detto) + '</p>');
    if (P.msg) h += '<div class="gp-msg gp-msg--' + P.msg.k + '">' + e(P.msg.t) + '</div>';
    if (serveIo()) {
      h += '<div class="gp-io">Hai detto «io»: chi sei tu nella squadra?<br><select data-gp-io><option value="">Scegli…</option>'
        + ops().map(function (o) { return '<option value="' + e(o.id) + '">' + e(o.nome) + '</option>'; }).join('')
        + '<option value="-">Non lavoro in cantiere</option></select></div>';
    }
    h += '<div class="gp-grid">' + P.cose.map(scheda).join('') + '</div>'
      + '<datalist id="gp-cantieri">' + lavori().map(function (l) { return '<option value="' + e(nomeLav(l)) + '">'; }).join('') + '</datalist></div>';
    ov.innerHTML = h;
    pie.hidden = !da || !!P.leggendo;
    pie.innerHTML = '<button type="button" class="gp-b gp-b--blu" data-gp="salva">Salva tutto (' + da + ')</button><button type="button" class="gp-b" data-gp="chiudi">Annulla</button>';
    posiziona();
  }

  function posiziona() {
    var side = document.querySelector('#appview .side');
    var l = (window.innerWidth > 880 && side && side.offsetWidth) ? Math.max(0, Math.round(side.getBoundingClientRect().right)) : 0;
    ov.style.left = l + 'px'; pie.style.left = l + 'px';
  }

  function apriFinestra() {
    if (!ov) {
      ov = document.createElement('div'); ov.id = 'gp-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
      pie = document.createElement('div'); pie.className = 'gp-pie';
      document.body.appendChild(ov); document.body.appendChild(pie);
      ov.addEventListener('click', clic); pie.addEventListener('click', clic);
      ov.addEventListener('change', function (ev) {
        if (ev.target.matches('[data-gp-io]') && ev.target.value) { if (typeof _gSetIo === 'function') _gSetIo(ev.target.value); P.msg = null; disegna(); }
      });
      window.addEventListener('resize', function () { if (ov && !ov.hidden) posiziona(); });
      document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && ov && !ov.hidden) chiudi(); });
    }
    ov.hidden = false; disegna(); ov.scrollTop = 0;
  }
  function chiudi() { if (ov) { ov.hidden = true; pie.hidden = true; ov.innerHTML = ''; } try { if (P && P.anteprima) URL.revokeObjectURL(P.anteprima); } catch (x) {} P = null; }

  function leggi(i) {
    var c = P.cose[i], box = ov.querySelector('.gp-c[data-i="' + i + '"]'); if (!box) return;
    var v = function (f) { var x = box.querySelector('[data-f="' + f + '"]'); return x ? x.value : ''; };
    if (c.tipo === 'giornata') {
      c.data = DATA.test(v('data')) ? v('data') : c.data; c.dove = cantiere(v('dove')); c.cosa = maiu(v('cosa'));
      var chi = []; v('chi').split(/[,;]| e /).forEach(function (n) { var x = nomeVero(n); if (x && chi.indexOf(x) < 0) chi.push(x); }); c.chi = chi;
    }
    if (c.tipo === 'spesa') { c.data = DATA.test(v('data')) ? v('data') : c.data; c.descrizione = maiu(v('descrizione')); c.dove = cantiere(v('dove')); var n = numero(v('importo')); c.importo = isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null; }
    if (c.tipo === 'promemoria') { c.data = DATA.test(v('data')) ? v('data') : c.data; c.ora = v('ora'); c.testo = maiu(v('testo')); }
    if (c.tipo === 'nota') { c.dove = cantiere(v('dove')); c.testo = maiu(v('testo')); }
    if (c.tipo === 'altro') c.testo = maiu(v('testo'));
    c.mod = false;
  }

  async function clic(ev) {
    var b = ev.target.closest('[data-gp]'); if (!b || b.disabled) return;
    var a = b.getAttribute('data-gp'), box = b.closest('.gp-c'), i = box ? +box.getAttribute('data-i') : -1;
    if (a === 'chiudi') { chiudi(); return; }
    if (a === 'cambia') { P.cose.forEach(function (c, k) { if (c.mod) leggi(k); }); P.cose[i].mod = true; disegna(); var f = ov.querySelector('.gp-c[data-i="' + i + '"] input,.gp-c[data-i="' + i + '"] textarea'); if (f) f.focus(); return; }
    if (a === 'ok') { leggi(i); disegna(); return; }
    if (a === 'togli') { P.cose.splice(i, 1); P.msg = null; if (!P.cose.length) { chiudi(); return; } disegna(); return; }
    if (a === 'apri') { var t = P.cose[i].testo, vec = P.vecchio; chiudi(); if (vec) vec(t); return; }
    if (a === 'salva') { b.disabled = true; await salva(); }
  }

  /* ---------------- salvare ---------------- */
  function controlla() {
    if (serveIo()) return 'Dimmi chi sei tu nella squadra (il riquadro arancione in alto).';
    for (var k = 0; k < P.cose.length; k++) {
      var c = P.cose[k];
      if (c.tipo === 'giornata') {
        if (!c.chi.map(nomeChi).filter(Boolean).length) return 'In una giornata non c\'è nessuno: premi «Cambia» e scrivi chi c\'era.';
        if (!c.dove) return 'In una giornata manca il cantiere: premi «Cambia».';
      }
      if (c.tipo === 'spesa') {
        if (c.importo == null && !(c.merce && c.merce.length)) return 'In una spesa manca quanto hai speso: premi «Cambia».';
        if (!c.descrizione) return 'In una spesa manca cosa hai comprato: premi «Cambia».';
        if (!c.dove) return 'Una spesa va su un cantiere: premi «Cambia» e scegli quale.';
      }
      if (c.tipo === 'promemoria' && !c.testo) return 'Un promemoria è vuoto: premi «Cambia» o «Togli».';
      if (c.tipo === 'nota' && (!c.dove || !c.testo)) return 'In una nota manca il cantiere o il testo: premi «Cambia».';
    }
    return '';
  }

  async function salva() {
    P.cose.forEach(function (c, k) { if (c.mod) leggi(k); });
    var err = controlla();
    if (err) { P.msg = { t: err, k: 'err' }; disegna(); return; }
    var serveGior = P.cose.some(function (c) { return c.tipo === 'giornata' || c.tipo === 'spesa' || c.tipo === 'nota'; });
    if (serveGior && typeof giorScrivi !== 'function') { P.msg = { t: 'Ricarica la pagina e riprova.', k: 'err' }; disegna(); return; }
    var conto = { giornata: 0, spesa: 0, promemoria: 0, nota: 0 };
    var togli = function (c) { var k = P.cose.indexOf(c); if (k >= 0) P.cose.splice(k, 1); };
    try {
      if (serveGior) await giorAssicura();
      /* 1. le giornate, tutte insieme: le 8 ore si dividono fra i cantieri dello stesso giorno */
      var gg = P.cose.filter(function (c) { return c.tipo === 'giornata'; });
      if (gg.length) {
        var schede = gg.map(function (c) {
          var nomi = c.chi.map(function (n) { if (n !== 'IO') return n; var o = ops().find(function (x) { return String(x.id) === String(io()); }); return o ? o.nome : null; }).filter(Boolean);
          return { data: c.data, nomi: nomi.filter(function (v, k, a) { return a.indexOf(v) === k; }), dove: c.dove, cosa: c.cosa || '' };
        });
        await giorScrivi(schede);
        gg.forEach(togli); conto.giornata = gg.length;
      }
      /* 2. il resto, una scheda alla volta: se una non va, le altre restano salvate e tolte */
      var resto = P.cose.filter(function (c) { return c.tipo === 'spesa' || c.tipo === 'promemoria' || c.tipo === 'nota'; });
      for (var k = 0; k < resto.length; k++) {
        var c = resto[k], r;
        if (c.tipo === 'spesa') {
          var lav = await giorTrovaLavoro(c.dove, c.data);
          if (c.importo != null) {
            r = await sb.from('gest_spese').insert({ user_id: sbUid, lavoro_id: lav.id, descrizione: c.descrizione, importo: c.importo, data: c.data }).select('id');
          } else r = { data: [{ id: 'bolla' }] };   /* bolla senza prezzo: solo merce e foto */
          if (r && !r.error && r.data && r.data.length) {
            if (c.merce && c.merce.length) { conto.merce = (conto.merce || 0) + await salvaMerce(c, lav.id); c.merce = []; }
            if (c.foto) await salvaFoto(c, lav.id);
          }
        }
        if (c.tipo === 'promemoria') {
          r = await sb.from('promemoria').insert({ user_id: sbUid, testo: c.testo, data: c.data, ora: c.ora || null, avvisa_giorni: 0, stato: 'aperto', inviato: false }).select('id');
        }
        if (c.tipo === 'nota') {
          var l = await giorTrovaLavoro(c.dove, oggi());
          var g = await sb.from('gest_lavori').select('note').eq('id', l.id).eq('user_id', sbUid).maybeSingle();
          if (g.error) throw new Error('Nota non salvata: ' + g.error.message);
          var d = oggi().split('-'), riga = d[2] + '/' + d[1] + ': ' + c.testo;
          var prima = (g.data && g.data.note) ? String(g.data.note).trim() : '';
          r = await sb.from('gest_lavori').update({ note: prima ? prima + '\n' + riga : riga }).eq('id', l.id).eq('user_id', sbUid).select('id');
        }
        if (!r || r.error || !r.data || !r.data.length) throw new Error(NOMI[c.tipo] + ' non salvata: ' + ((r && r.error && r.error.message) || 'nessuna riga scritta') + '.');
        togli(c);
        if (c.tipo === 'spesa' && c.importo == null) conto.bolla = (conto.bolla || 0) + 1; else conto[c.tipo]++;
      }
    } catch (x) {
      P.msg = { t: ((x && x.message) || 'Non salvato. Riprova.') + (fatto(conto) ? ' Il resto è salvato: ' + fatto(conto) + '.' : ''), k: 'err' };
      disegna(); rinfrescaTutto(); return;
    }
    rinfrescaTutto();
    if (!P.cose.length) { chiudi(); if (typeof toast === 'function') toast('Salvato ✔ ' + fatto(conto)); return; }
    P.msg = { t: 'Salvato ✔ ' + fatto(conto) + '. Resta da aprire:', k: 'ok' };
    disegna();
  }
  function fatto(c) {
    var p = [];
    if (c.giornata) p.push(c.giornata + (c.giornata === 1 ? ' giornata' : ' giornate'));
    if (c.spesa) p.push(c.spesa + (c.spesa === 1 ? ' spesa' : ' spese'));
    if (c.promemoria) p.push(c.promemoria + ' promemoria');
    if (c.nota) p.push(c.nota + (c.nota === 1 ? ' nota' : ' note'));
    if (c.bolla) p.push(c.bolla + (c.bolla === 1 ? ' bolla' : ' bolle'));
    if (c.merce) p.push(c.merce + (c.merce === 1 ? ' riga di merce' : ' righe di merce'));
    return p.join(', ');
  }
  function rinfrescaTutto() {
    try { if (typeof rinfresca === 'function') rinfresca('giornate', 'promemoria', 'lavori', 'riepilogo', 'calendario'); } catch (x) {}
    /* Noleggio: ridisegna la sezione aperta se ha una sua funzione */
    try { if (typeof rinfresca !== 'function' && typeof renderAll === 'function') renderAll(); } catch (x) {}
  }

  /* ---------------- la foto della bolla ----------------
     3 nov 2026: fotografi la bolla (o la fattura, o lo scontrino) e diventa
     una spesa sul cantiere. Legge con la stessa lettura dei Fornitori
     (ai-cantiere, «dati_fattura_fornitore», 1 credito AI). La foto resta
     fra i documenti del lavoro (gest_foto tipo «documento»). */
  var fotoNascosto = null;
  async function salvaFoto(c, lavId) {
    try {
      var nome = 'bolla-' + (c.fornitore || 'fornitore').replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 30) + '-' + (c.data || oggi()) + '.jpg';
      var path = sbUid + '/' + lavId + '/doc/' + Date.now() + '_' + nome;
      var up = await sb.storage.from('gestionale-foto').upload(path, c.foto, { contentType: c.fotoTipo || 'image/jpeg' });
      if (up.error) return;
      var ins = await sb.from('gest_foto').insert({ user_id: sbUid, lavoro_id: lavId, tipo: 'documento', operatore: 'Capo', storage_path: path, nome_file: nome });
      if (ins.error && typeof _fileOrfano === 'function') await _fileOrfano('gestionale-foto', path);
    } catch (x) {}
  }
  /* i fornitori della rubrica (Fornitori del gestionale) */
  async function fornitoriMiei() {
    if (typeof fornCache !== 'undefined' && fornCache && fornCache.length) return fornCache;
    try { var r = await sb.from('gest_fornitori').select('id,nome,piva').eq('user_id', sbUid).order('nome'); return (r && r.data) || []; } catch (x) { return []; }
  }
  function normF(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\b(srl|s r l|spa|s p a|snc|sas|srls)\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function trovaFornitore(lista, nome, piva) {
    var p = String(piva || '').replace(/\D/g, '');
    if (p.length >= 11) { var x = lista.find(function (f) { return String(f.piva || '').replace(/\D/g, '') === p; }); if (x) return x; }
    var n = normF(nome); if (!n) return null;
    return lista.find(function (f) { return normF(f.nome) === n; })
      || lista.find(function (f) { var m = normF(f.nome); return m.length > 3 && (n.indexOf(m) >= 0 || m.indexOf(n) >= 0); }) || null;
  }
  /* la merce della bolla negli Acquisti del mese (gest_acquisti, riga di bolla:
     fattura_id vuoto). Se il fornitore non c'e' in rubrica lo si aggiunge: e'
     scritto sulla scheda prima di «Salva tutto». */
  async function salvaMerce(c, lavId) {
    if (!c.merce || !c.merce.length) return 0;
    var fid = c.fornitoreId;
    if (!fid && c.fornitore) {
      var nf = await sb.from('gest_fornitori').insert({ user_id: sbUid, mestiere_id: typeof curMestiere === 'function' ? curMestiere() : null, nome: maiu(c.fornitore).slice(0, 120), piva: c.piva || null }).select('id,nome,piva');
      if (nf && !nf.error && nf.data && nf.data.length) { fid = nf.data[0].id; try { if (typeof fornCache !== 'undefined') fornCache.push(nf.data[0]); } catch (x) {} }
    }
    var righe = c.merce.map(function (r) {
      return { user_id: sbUid, mestiere_id: typeof curMestiere === 'function' ? curMestiere() : null, fattura_id: null, fornitore_id: fid || null, lavoro_id: lavId || null,
               data: c.data, descrizione: r.nome, quantita: r.quantita, unita: r.unita || null, prezzo_unitario: r.prezzo_unitario, importo: r.importo };
    });
    var ins = await sb.from('gest_acquisti').insert(righe).select('id');
    if (!ins || ins.error || !ins.data || ins.data.length !== righe.length) throw new Error('Merce non salvata: ' + ((ins && ins.error && ins.error.message) || 'nessuna riga') + '.');
    return righe.length;
  }
  function b64(blob) {
    return new Promise(function (ok, ko) { var r = new FileReader(); r.onload = function () { ok(String(r.result).split(',')[1]); }; r.onerror = ko; r.readAsDataURL(blob); });
  }
  window.gestParlaFoto = async function (file) {
    if (!file) return;
    if (!/^image\//.test(file.type || '') && !/\.(jpe?g|png|webp|heic)$/i.test(file.name || '')) { if (typeof toast === 'function') toast('Serve una foto.'); return; }
    if (!window.AI || typeof window.AI.cantiere !== 'function') { if (typeof toast === 'function') toast("L'assistente non si è caricato. Ricarica la pagina."); return; }
    try { if (typeof giorAssicura === 'function') await giorAssicura(); } catch (x) {}
    var url = ''; try { url = URL.createObjectURL(file); } catch (x) {}
    P = { detto: '', cose: [], vecchio: null, msg: null, leggendo: true, anteprima: url };
    apriFinestra();
    var blob = file, tipo = 'image/jpeg';
    try {
      var pr = typeof preparaFileUpload === 'function' ? await preparaFileUpload(file, { lato: 1600, qualita: 0.82 }) : { file: file };
      if (pr.errore) throw new Error(pr.errore);
      blob = pr.file;
      if (!pr.compressa && /heic|heif/i.test(file.type || file.name || '')) throw new Error('Questa foto è in un formato che non riesco a leggere (HEIC). Scattala dal pulsante «Foto».');
      if (!pr.compressa && ['image/jpeg', 'image/png', 'image/webp'].indexOf(file.type) >= 0) tipo = file.type;
      if (blob.size > 5 * 1024 * 1024) throw new Error('La foto è troppo grande.');
      /* 10 nov 2026: «ai-fattura» legge anche la MERCE riga per riga; se non
         risponde si legge come prima (un errore rimborsa il credito) */
      var forn = await fornitoriMiei();
      var testoAI = "Leggi questa bolla (o fattura, o scontrino) di un fornitore di materiale." + (forn.length ? "\nFornitori gia' in rubrica (se e' uno di questi, scrivi il nome IDENTICO): " + forn.map(function (f) { return f.nome; }).slice(0, 60).join(" | ") : "");
      var dati64 = await b64(blob), d;
      try { d = await window.AI.cantiere('dati_fattura_fornitore', testoAI, { tipo: tipo, dati: dati64 }, true, 'ai-fattura'); }
      catch (x1) { d = await window.AI.cantiere('dati_fattura_fornitore', testoAI, { tipo: tipo, dati: dati64 }, true); }
      if (!P) return;
      P.leggendo = false;
      if (!d) { chiudi(); return; }   /* crediti finiti: la finestra l'ha gia' aperta l'AI */
      if (d.leggibile === false) { P.msg = { t: 'Non riesco a leggerla: la foto è sfocata o non è una bolla. Rifalla dritta, con più luce.', k: 'err' }; disegna(); return; }
      var tot = typeof d.totale === 'number' ? d.totale : numero(d.totale);
      var cant = lavori().filter(function (l) { return l.stato !== 'fatto'; });
      P.cose = [{
        tipo: 'spesa', data: DATA.test(d.data || '') && d.data <= oggi() ? d.data : oggi(),
        descrizione: maiu(((d.cosa || 'Materiale') + (d.fornitore ? ' — ' + d.fornitore : '')).slice(0, 300)),
        importo: isFinite(tot) && tot > 0 ? Math.round(tot * 100) / 100 : null,
        dove: cant.length === 1 ? nomeLav(cant[0]) : '', fornitore: d.fornitore || '', foto: blob, fotoTipo: tipo,
        merce: typeof acqPulisci === 'function' ? acqPulisci(d.righe) : [],
        fornitoreId: (trovaFornitore(forn, d.fornitore, d.partita_iva) || {}).id || null, piva: String(d.partita_iva || '').replace(/\D/g, '')
      }];
      /* una bolla senza prezzo con la merce letta va bene cosi': la merce va negli Acquisti del mese */
      if (P.cose[0].importo == null && !P.cose[0].merce.length) P.msg = { t: 'Sulla bolla non c\'è il prezzo: premi «Cambia» e scrivi quanto hai speso.', k: 'err' };
      disegna();
    } catch (x) {
      if (!P) return;
      P.leggendo = false; P.msg = { t: (x && x.message) || 'Non ci sono riuscito. Riprova.', k: 'err' }; disegna();
    }
  };

  /* ---------------- la porta ----------------
     torna 'aperta' se ha aperto la finestra, 'vecchio' se tocca al Parla di prima */
  window.gestParla = async function (t, vecchio) {
    if (typeof sb === 'undefined' || !sb) return 'vecchio';
    var cose = await capisci(t);
    if (!cose || !cose.length) return 'vecchio';
    cose = cose.slice(0, 20).map(pulisci);
    /* 10 nov 2026 — da soli: «io» si capisce senza chiederlo (gest-giornate.js) */
    if (typeof window.giorIoAuto === 'function' && cose.some(function (c) { return c.tipo === 'giornata' && c.chi.indexOf('IO') >= 0; })) {
      try { await window.giorIoAuto(true); } catch (x) {}
    }
    /* nel Noleggio non ci sono Giornate ne' cantieri: giornate, spese e note
       passano al Parla del Noleggio (scheda «Da aprire»). Restano i promemoria. */
    if (typeof giorScrivi !== 'function') cose = cose.map(function (c) {
      if (c.tipo === 'giornata' || c.tipo === 'spesa' || c.tipo === 'nota') return { tipo: 'altro', testo: c.tipo === 'spesa' ? (c.descrizione + (c.importo != null ? ' ' + euro(c.importo) : '') + (c.dove ? ' ' + c.dove : '')) : ((c.dove ? c.dove + ': ' : '') + (c.cosa || c.testo || '')) };
      return c;
    });
    if (!cose.some(function (c) { return c.tipo !== 'altro'; })) return 'vecchio';
    P = { detto: t, cose: cose, vecchio: vecchio, msg: null };
    apriFinestra();
    return 'aperta';
  };
})();
