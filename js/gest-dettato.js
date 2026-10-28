/* =====================================================================
   TrovaImpresa — IL DETTATO — 28 ottobre 2026

   Un piccolo microfono nell'angolo di OGNI casella di testo lunga del
   gestionale (descrizioni, note, voci del computo, verbali...). Premi,
   parli, scrive lui. Ripremi e si ferma.

   - E' GRATIS: usa il riconoscimento vocale del browser (Chrome, Edge,
     Safari su iPhone, Chrome su Android). Niente AI, niente crediti,
     niente passa dai nostri server.
   - Dove il browser non lo sa fare (Firefox) il microfono NON compare:
     resta quello della tastiera del telefono.
   - Il testo detto si AGGIUNGE a quello gia' scritto, non lo cancella.
   - Non salva niente: il Salva lo premi tu, come sempre.

   ⚠️ Le caselle che hanno GIA' il loro pulsante «Parla» (Chat con AI,
   «Riempi le caselle», Tasse e fisco, Chiedi una funzione...) si saltano:
   due microfoni sulla stessa casella confondono.
   ⚠️ File chiuso in se' (IIFE) e senza bisogno di niente della pagina:
   cosi' lo stesso file va in gestionale-app, noleggio e operatore.
   Per spegnerlo su una casella: data-no-dettato sulla textarea.
   ===================================================================== */
(function () {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;

  var MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/></svg>';
  var STOP = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';

  /* lo stile sta qui, cosi' il file basta da solo in tutti i gestionali */
  var css = ''
    + '.dt-box{position:relative;display:block;width:100%}'
    + '.dt-box>textarea{padding-right:52px!important}'
    + '.dt-mic{position:absolute;right:8px;bottom:8px;width:38px;height:38px;border-radius:50%;'
    +   'border:1.5px solid var(--bordo-forte,#CBD5E1);background:var(--card,#fff);color:var(--testo-2,#475569);'
    +   'display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;z-index:2}'
    + '.dt-mic svg{width:18px;height:18px}'
    + '.dt-mic:hover{border-color:var(--blu,#0066FF);color:var(--blu,#0066FF);background:var(--blu-tenue,#E6F0FF)}'
    + '.dt-mic--on{background:var(--err,#DC2626)!important;border-color:var(--err,#DC2626)!important;color:#fff!important}'
    + '.dt-mic--on svg{animation:dtPulsa 1s ease-in-out infinite}'
    + '@keyframes dtPulsa{50%{opacity:.4}}'
    + '.dt-avviso{font-size:14px;line-height:1.4;color:var(--err,#DC2626);margin-top:6px}'
    + '@media (max-width:880px){.dt-mic{width:44px;height:44px}.dt-box>textarea{padding-right:58px!important}}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var SALTA = ['chat-domanda', 'rq-testo', 'asst-testo', 'rc-testo', 'rc-agg', 'ai-riga-in', 'fi-in',
               'ai-in', 'ai-comp-in', 'ai-help-in', 'cp-ai-in'];

  function haGiaParla(ta) {
    if (SALTA.indexOf(ta.id) >= 0) return true;
    var box = ta.closest('.aic-box, .sh-b, .field');
    return !!(box && box.querySelector('.aic-mic'));
  }

  var attivo = null;   /* {rec, btn} — un microfono acceso alla volta */

  function ferma() { if (attivo) { try { attivo.rec.stop(); } catch (e) {} } }

  function avviso(ta, testo) {
    var box = ta.parentNode, a = box.nextElementSibling;
    if (!a || !a.classList.contains('dt-avviso')) {
      a = document.createElement('div'); a.className = 'dt-avviso';
      box.parentNode.insertBefore(a, box.nextSibling);
    }
    a.textContent = testo;
    if (!testo) a.remove();
  }

  function accendi(ta, btn) {
    if (attivo && attivo.btn === btn) { ferma(); return; }
    ferma();
    var rec;
    try { rec = new SR(); } catch (e) { avviso(ta, 'Il microfono non parte su questo browser.'); return; }
    rec.lang = 'it-IT'; rec.continuous = true; rec.interimResults = true;
    var base = ta.value.replace(/\s+$/, ''), finale = '';
    rec.onresult = function (ev) {
      var provv = '';
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        var r = ev.results[i];
        if (r.isFinal) finale += (finale ? ' ' : '') + r[0].transcript.trim();
        else provv += r[0].transcript;
      }
      var detto = [finale, provv.trim()].filter(Boolean).join(' ');
      if (detto && !base) detto = detto.charAt(0).toUpperCase() + detto.slice(1);
      ta.value = [base, detto].filter(Boolean).join(base && /[.!?]$/.test(base) ? ' ' : (base ? ' ' : ''));
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    };
    rec.onerror = function (ev) {
      var m = {
        'not-allowed': 'Il browser non ha il permesso del microfono: premi il lucchetto accanto all\'indirizzo e consenti il microfono.',
        'service-not-allowed': 'Il browser non ha il permesso del microfono.',
        'no-speech': 'Non ho sentito niente. Riprova parlando più vicino.',
        'audio-capture': 'Non trovo il microfono su questo dispositivo.',
        'network': 'Per capire la voce serve internet.'
      };
      avviso(ta, m[ev.error] || 'Il microfono si è fermato. Riprova.');
    };
    rec.onend = function () {
      btn.classList.remove('dt-mic--on'); btn.innerHTML = MIC;
      btn.setAttribute('aria-pressed', 'false'); btn.title = 'Detta a voce';
      if (attivo && attivo.btn === btn) attivo = null;
    };
    try { rec.start(); } catch (e) { avviso(ta, 'Il microfono non parte. Riprova fra un attimo.'); return; }
    avviso(ta, '');
    attivo = { rec: rec, btn: btn };
    btn.classList.add('dt-mic--on'); btn.innerHTML = STOP;
    btn.setAttribute('aria-pressed', 'true'); btn.title = 'Ho finito';
  }

  function arma(ta) {
    if (ta.dataset.dettato || ta.hasAttribute('data-no-dettato') || ta.readOnly || ta.disabled) return;
    ta.dataset.dettato = '1';
    if (haGiaParla(ta)) return;
    var box = document.createElement('span');
    box.className = 'dt-box';
    ta.parentNode.insertBefore(box, ta);
    box.appendChild(ta);
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'dt-mic'; btn.innerHTML = MIC;
    btn.title = 'Detta a voce'; btn.setAttribute('aria-label', 'Detta a voce');
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', function (e) { e.preventDefault(); accendi(ta, btn); });
    box.appendChild(btn);
  }

  function giro(radice) {
    var l = (radice || document).querySelectorAll('textarea:not([data-dettato])');
    for (var i = 0; i < l.length; i++) arma(l[i]);
  }

  /* le finestre del gestionale nascono dopo: si guarda quando arrivano */
  var tic = null;
  function presto() { if (tic) return; tic = setTimeout(function () { tic = null; giro(); }, 60); }
  function parti() {
    giro();
    try { new MutationObserver(presto).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', parti);
  else parti();

  /* se chiudi la finestra mentre parli, il microfono si spegne */
  document.addEventListener('visibilitychange', function () { if (document.hidden) ferma(); });
})();
