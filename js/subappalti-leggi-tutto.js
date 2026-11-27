/* 27 nov 2026 — Subappalti: schede corte con «Leggi tutto».
   Il titolo si ferma a 2 righe, la descrizione a 3. Se il testo è più lungo
   compare «Leggi tutto ▾», che apre la scheda intera (e «Chiudi ▴»).
   Vale per tutte le pagine dei subappalti: guarda da solo le schede che arrivano. */
(function () {
  if (document.getElementById('lt-stile')) return;
  var st = document.createElement('style');
  st.id = 'lt-stile';
  st.textContent =
    '.annuncio-card .lt-corto{display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;-webkit-line-clamp:3}' +
    '.annuncio-card .lt-corto.lt-tit{-webkit-line-clamp:2}' +
    '.annuncio-card.lt-aperta .lt-corto{display:block;-webkit-line-clamp:unset;overflow:visible}' +
    '.lt-btn{display:inline-flex;align-items:center;min-height:44px;padding:0 4px;margin:-4px 0 4px;background:none;border:0;color:#0066ff;font:inherit;font-size:16px;font-weight:700;cursor:pointer}' +
    '.lt-btn:hover{text-decoration:underline}';
  document.head.appendChild(st);

  function prepara(card) {
    if (card.dataset.lt) return;
    card.dataset.lt = '1';
    var descs = card.querySelectorAll('.annuncio-spec, .annuncio-desc');
    if (!descs.length) return;
    descs.forEach(function (d, i) {
      d.classList.add('lt-corto');
      if (d.classList.contains('annuncio-spec') || (i === 0 && d.querySelector('.annuncio-titolo'))) d.classList.add('lt-tit');
    });
    var lungo = false;
    descs.forEach(function (d) { if (d.scrollHeight > d.clientHeight + 2) lungo = true; });
    if (!lungo) { descs.forEach(function (d) { d.classList.remove('lt-corto', 'lt-tit'); }); return; }
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'lt-btn';
    b.textContent = 'Leggi tutto ▾';
    b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', function () {
      var aperta = card.classList.toggle('lt-aperta');
      b.textContent = aperta ? 'Chiudi ▴' : 'Leggi tutto ▾';
      b.setAttribute('aria-expanded', aperta ? 'true' : 'false');
    });
    descs[descs.length - 1].after(b);
  }
  function giro() { document.querySelectorAll('.annuncio-card').forEach(prepara); }
  var t;
  new MutationObserver(function () { clearTimeout(t); t = setTimeout(giro, 60); })
    .observe(document.body, { childList: true, subtree: true });
  if (document.readyState !== 'loading') giro(); else document.addEventListener('DOMContentLoaded', giro);
})();
