/* =====================================================================
   TrovaImpresa — LA GIORNATA SCRITTA GIUSTA — 3 novembre 2026

   Chiesto da Alessio: «quando detto o scrivo mi dovrebbe correggere
   quello che dico e non riportare esattamente quello che dico».

   Nelle caselle della giornata di cantiere (rapportino: «Cosa avete
   usato», «Com'è andata»; «Cosa hai fatto / note»; la «Nota» e il
   «Materiale» di Segna la giornata) il testo si corregge DA SOLO:
     - quando esci dalla casella;
     - quando spegni il microfono del dettato;
     - quando premi Salva: se c'era da correggere si corregge, ti fermi
       a guardarlo e premi Salva un'altra volta. Se era già giusto, salva
       subito come prima.
   Sotto la casella compare «Corretto · Torna com'era».

   ⛔ E' GRATIS: passa da supabase/functions/ai-correggi, che non scala
      crediti (ha un tetto al giorno per persona).
   ⛔ Se la rete non c'è o la correzione non risponde, il testo resta come
      l'hai scritto e il Salva funziona lo stesso: in cantiere la linea
      non c'è sempre, e una correzione non deve mai bloccare un rapportino.
   ⛔ Non salva niente: mette il testo nella casella, il Salva resta tuo.
   File chiuso in se' (IIFE). Usa `sb` della pagina (op-base.js) solo
   dentro le funzioni, per prendere la sessione.
   ===================================================================== */
(function () {
  var URL_AI = 'https://nacvrsgkyfavykxjxszu.supabase.co/functions/v1/ai-correggi';

  /* le caselle da correggere, e quale Salva le salva */
  var CAMPI = ['rap-materiali', 'rap-note', 'lv-note', 'rv-testo'];
  var SALVA = {
    'btn-rap-salva': ['rap-materiali', 'rap-note'],
    'btn-salva': ['lv-note'],
    'btn-fatto': ['lv-note'],
    'rv-ok': ['rv-testo']
  };

  var css = ''
    + '.cg-riga{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:14px;line-height:1.4;'
    +   'color:var(--muted,#64748B);margin-top:6px}'
    + '.cg-riga b{color:var(--green,#16A34A);font-weight:600}'
    + '.cg-torna{background:none;border:0;padding:4px 0;font:inherit;font-size:14px;color:var(--blu,#0066FF);'
    +   'text-decoration:underline;cursor:pointer}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var stato = {};   /* id -> {fatto: testo gia' controllato, prima: testo di prima, corso: Promise} */

  function s(id) { return stato[id] || (stato[id] = { fatto: null, prima: null, corso: null }); }
  function casella(id) { var t = document.getElementById(id); return t && t.tagName === 'TEXTAREA' ? t : null; }
  function daFare(ta) {
    var v = ta.value.trim();
    return v.length >= 6 && s(ta.id).fatto !== ta.value;
  }
  function micAcceso(ta) {
    var box = ta.closest('.dt-box');
    return !!(box && box.querySelector('.dt-mic--on'));
  }

  function riga(ta, html) {
    var dopo = ta.closest('.dt-box') || ta;
    var r = dopo.parentNode && dopo.parentNode.querySelector('.cg-riga[data-per="' + ta.id + '"]');
    if (!html) { if (r) r.remove(); return; }
    if (!r) {
      r = document.createElement('div'); r.className = 'cg-riga'; r.setAttribute('data-per', ta.id);
      dopo.parentNode.insertBefore(r, dopo.nextSibling);
    }
    r.innerHTML = html;
  }

  async function token() {
    try {
      if (typeof sb === 'undefined' || !sb) return null;
      var r = await sb.auth.getSession();
      return r && r.data && r.data.session && r.data.session.access_token;
    } catch (e) { return null; }
  }

  /* torna true se ha CAMBIATO il testo */
  function correggi(ta) {
    var x = s(ta.id);
    if (x.corso) return x.corso;
    if (!daFare(ta)) return Promise.resolve(false);
    var mandato = ta.value;
    x.corso = (async function () {
      riga(ta, 'Correggo…');
      try {
        var tk = await token();
        if (!tk) { riga(ta, ''); return false; }
        var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 12000) : null;
        var res = await fetch(URL_AI, {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + tk, 'Content-Type': 'application/json' },
          body: JSON.stringify({ testo: mandato.trim() }),
          signal: ctrl ? ctrl.signal : undefined
        });
        if (timer) clearTimeout(timer);
        var b = await res.json().catch(function () { return {}; });
        /* nel frattempo ha scritto ancora: non si tocca niente */
        if (ta.value !== mandato) { riga(ta, ''); return false; }
        if (!res.ok || !b.result) { x.fatto = mandato; riga(ta, ''); return false; }
        var nuovo = String(b.result).trim();
        if (nuovo === mandato.trim()) { x.fatto = mandato; riga(ta, ''); return false; }
        x.prima = mandato;
        ta.value = nuovo; x.fatto = nuovo;
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        riga(ta, '<b>✓ Corretto</b><button type="button" class="cg-torna" data-cg-torna="' + ta.id + '">Torna com’era</button>');
        return true;
      } catch (e) {
        if (ta.value === mandato) x.fatto = mandato;   /* senza rete: si tiene com'e' */
        riga(ta, '');
        return false;
      } finally { x.corso = null; }
    })();
    return x.corso;
  }

  /* 1. uscendo dalla casella. Si aspetta un attimo: se hai appena premuto il
        microfono, la correzione la fa quando lo spegni, non adesso. */
  document.addEventListener('focusout', function (e) {
    var ta = e.target;
    if (!ta || CAMPI.indexOf(ta.id) < 0) return;
    setTimeout(function () {
      if (document.activeElement === ta || micAcceso(ta)) return;
      correggi(ta);
    }, 500);
  }, true);

  /* 2. spegnendo il microfono del dettato (gest-dettato.js toglie la classe) */
  try {
    new MutationObserver(function (lista) {
      lista.forEach(function (m) {
        var b = m.target;
        if (!b.classList || !b.classList.contains('dt-mic')) return;
        if (m.oldValue && m.oldValue.indexOf('dt-mic--on') >= 0 && !b.classList.contains('dt-mic--on')) {
          var ta = b.parentNode && b.parentNode.querySelector('textarea');
          if (ta && CAMPI.indexOf(ta.id) >= 0) setTimeout(function () { correggi(ta); }, 300);
        }
      });
    }).observe(document.body, { attributes: true, attributeFilter: ['class'], attributeOldValue: true, subtree: true });
  } catch (e) {}

  /* 3. premendo Salva: prima si corregge, poi si salva */
  var lascia = false;
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-cg-torna]');
    if (t) {
      var ta0 = casella(t.getAttribute('data-cg-torna')), x0 = ta0 && s(ta0.id);
      if (ta0 && x0.prima !== null) {
        ta0.value = x0.prima; x0.fatto = x0.prima; x0.prima = null;
        ta0.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (ta0) riga(ta0, '');
      return;
    }
    if (lascia) return;
    var btn = e.target.closest && e.target.closest('button[id]');
    if (!btn || !SALVA[btn.id]) return;
    var tas = SALVA[btn.id].map(casella).filter(function (ta) { return ta && (daFare(ta) || s(ta.id).corso); });
    if (!tas.length) return;                     /* niente da correggere: salva come prima */
    e.preventDefault(); e.stopImmediatePropagation();
    Promise.all(tas.map(correggi)).then(function (cambiati) {
      if (cambiati.some(Boolean)) return;         /* cambiato: guardalo e ripremi Salva */
      lascia = true;
      try { btn.click(); } finally { lascia = false; }
    });
  }, true);
})();
