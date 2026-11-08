/* =====================================================================
   8 novembre 2026 — «GLI AVVISI SUL TELEFONO» (Dati azienda)
   Lo stesso telefono della domanda della sera (sw-gestionale.js +
   netlify/functions/avviso-sera.js) riceve anche:
     · richieste = appena arriva una richiesta dal sito
     · mattina   = gli stessi avvisi dell'email del mattino
     · sera      = «Hai segnato la giornata?» (l'ora si sceglie in Giornate)
   Ogni casella vale per QUESTO telefono: il capo puo' averli sul telefono e
   non sul computer dell'ufficio.
   Gratis e senza il tetto delle 100 email al giorno di Resend.
   ===================================================================== */
(function () {
  var URL_AV = '/.netlify/functions/avviso-sera';
  var stato = null;   // {puo, negato, acceso, sera, mattina, richieste}
  var VOCI = [
    ['richieste', 'Appena arriva una richiesta dal sito'],
    ['mattina', 'La mattina: gli stessi avvisi dell’email'],
    ['sera', 'La sera: «Hai segnato la giornata?»']
  ];

  function puo() { return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; }
  function iphone() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }
  function box() { return document.getElementById('a-tel-box'); }
  function msg(t, k) { var m = document.getElementById('a-tel-msg'); if (m) { m.textContent = t || ''; m.style.color = k === 'err' ? 'var(--err,#c62828)' : (k === 'ok' ? '#2e7d32' : ''); } }
  function b64(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); var b = atob(s + '==='.slice((s.length + 3) % 4)); return Uint8Array.from(b, function (c) { return c.charCodeAt(0); }); }

  async function token() {
    try { var r = await sb.auth.getSession(); return r && r.data && r.data.session && r.data.session.access_token; } catch (e) { return null; }
  }
  async function iscrizione() {
    try { var r = await navigator.serviceWorker.getRegistration('/'); return r ? await r.pushManager.getSubscription() : null; } catch (e) { return null; }
  }
  async function chiama(corpo) {
    var tk = await token(); if (!tk) return { error: 'Sessione scaduta: esci e rientra.' };
    var s = await iscrizione(); if (s && !corpo.endpoint && !corpo.sub) corpo.endpoint = s.endpoint;
    try {
      var r = await fetch(URL_AV, { method: 'POST', headers: { Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
      var b = await r.json().catch(function () { return {}; });
      return r.ok ? Object.assign({ ok: true }, b) : { error: b.error || 'Il servizio non ha risposto.' };
    } catch (e) { return { error: 'Niente rete. Riprova.' }; }
  }

  async function leggi() {
    if (!puo()) return { puo: false };
    if (Notification.permission === 'denied') return { puo: true, negato: true };
    var s = await iscrizione();
    if (!s) return { puo: true, acceso: false };
    var r = await chiama({ azione: 'stato', endpoint: s.endpoint });
    if (!r.ok || !r.acceso) return { puo: true, acceso: false };
    return { puo: true, acceso: true, sera: r.sera !== false, mattina: !!r.mattina, richieste: !!r.richieste };
  }

  function caselle(on) {
    return VOCI.map(function (v) {
      var c = on ? !!stato[v[0]] : v[0] !== 'sera';
      return '<label style="display:flex;gap:12px;align-items:center;font-size:17px;line-height:1.5;cursor:pointer;padding:7px 0">' +
        '<input type="checkbox" data-avt-voce="' + v[0] + '"' + (c ? ' checked' : '') + ' style="width:24px;height:24px;margin:0;flex:0 0 auto;cursor:pointer">' +
        '<span>' + v[1] + '</span></label>';
    }).join('');
  }

  function disegna() {
    var b = box(); if (!b) return;
    var h = '<div class="sh-tit">Gli avvisi sul telefono</div>' +
      '<div class="sh-nota" style="margin-bottom:10px">Arrivano sul telefono come un messaggio, anche col gestionale chiuso. Gratis.</div>';
    if (!stato) h += '<div class="sh-nota">Controllo questo telefono…</div>';
    else if (!stato.puo) h += iphone()
      ? '<div class="sh-nota">Su iPhone arrivano solo se il gestionale è sulla schermata Home: in Safari tocca il tasto Condividi, poi «Aggiungi alla schermata Home», e aprilo da lì.</div>'
      : '<div class="sh-nota">Su questo browser non si possono accendere. Prova da Chrome sul telefono.</div>';
    else if (stato.negato) h += '<div class="sh-nota">Su questo telefono le notifiche di trovaimpresa.com sono bloccate. Sbloccale dalle impostazioni del browser (il lucchetto accanto all’indirizzo) e torna qui.</div>';
    else if (stato.acceso) h += '<div style="font-size:17px;font-weight:800;margin:6px 0 8px">Su questo telefono: <span style="color:#2e7d32">acceso ✔</span></div>' + caselle(true) +
      '<div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">' +
      '<button type="button" class="btn" data-avt="prova" style="min-height:44px;font-size:16px">Fallo suonare adesso</button>' +
      '<button type="button" class="btn" data-avt="spegni" style="min-height:44px;font-size:16px">Spegni su questo telefono</button></div>';
    else h += caselle(false) +
      '<button type="button" class="btn-primary" data-avt="accendi" style="min-height:50px;font-size:17px;margin-top:10px;width:100%">Accendi su questo telefono</button>';
    h += '<div id="a-tel-msg" style="font-size:16px;margin-top:8px"></div>';
    b.innerHTML = h;
  }

  async function accendi() {
    if (!puo()) return;
    var scelte = {};
    document.querySelectorAll('#a-tel-box [data-avt-voce]').forEach(function (c) { scelte[c.getAttribute('data-avt-voce')] = !!c.checked; });
    if (!scelte.sera && !scelte.mattina && !scelte.richieste) { msg('Scegli almeno un avviso.', 'err'); return; }
    msg('Accendo…');
    try {
      var perm = await Notification.requestPermission();
      if (perm !== 'granted') { stato = { puo: true, negato: true }; disegna(); return; }
      var reg = await navigator.serviceWorker.register('/sw-gestionale.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      var kr = await fetch(URL_AV); var kb = await kr.json();
      if (!kb.chiave) throw new Error('chiave');
      var sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(kb.chiave) });
      var r = await chiama(Object.assign({ azione: 'iscrivi', sub: sub.toJSON() }, scelte));
      if (!r.ok) { msg(r.error, 'err'); return; }
      stato = Object.assign({ puo: true, acceso: true }, scelte);
      disegna(); msg('Acceso ✔ Prova «Fallo suonare adesso».', 'ok');
    } catch (e) { msg('Non riesco ad accenderli su questo telefono. Riprova.', 'err'); }
  }

  document.addEventListener('click', async function (e) {
    var b = e.target.closest && e.target.closest('#a-tel-box [data-avt]'); if (!b) return;
    var a = b.getAttribute('data-avt');
    if (a === 'accendi') return accendi();
    if (a === 'prova') {
      b.disabled = true;
      var r = await chiama({ azione: 'prova', tipo: 'avvisi' });
      b.disabled = false;
      msg(r.ok ? 'Mandato: fra qualche secondo il telefono suona.' : r.error, r.ok ? 'ok' : 'err');
      return;
    }
    if (a === 'spegni') {
      b.disabled = true;
      await chiama({ azione: 'spegni' });
      try { var reg = await navigator.serviceWorker.getRegistration('/'); var x = reg && await reg.pushManager.getSubscription(); if (x) await x.unsubscribe(); } catch (_) {}
      stato = { puo: true, acceso: false }; disegna(); msg('Spenti su questo telefono.', 'ok');
    }
  });

  document.addEventListener('change', async function (e) {
    var c = e.target.closest && e.target.closest('#a-tel-box [data-avt-voce]'); if (!c || !stato || !stato.acceso) return;
    var k = c.getAttribute('data-avt-voce'), v = !!c.checked, corpo = { azione: 'scegli' };
    corpo[k] = v;
    var r = await chiama(corpo);
    if (r.ok) { stato[k] = v; msg('Salvato ✔', 'ok'); }
    else { c.checked = !v; msg(r.error, 'err'); }
  });

  window.avvTelHtml = function () { return '<div class="sh-b" id="a-tel-box"></div>'; };
  window.avvTelDisegna = async function () { stato = null; disegna(); stato = await leggi(); disegna(); };
})();
