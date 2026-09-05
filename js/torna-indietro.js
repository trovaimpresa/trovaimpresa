/* torna-indietro.js — 5 settembre 2026
   La freccia «Indietro» delle guide, copiata dal gestionale: stessa forma,
   stessa icona, stessa parola (css/gestionale.css, .sh-back — 16 ago 2026,
   «si esce sempre allo stesso modo»). Qui i colori sono quelli della guida
   (--line, --text, --primary, --primary-soft, --primary-dark), non quelli
   del gestionale: la forma si copia, la tavolozza resta della pagina.
   Dove porta: indietro nella cronologia se il lettore arriva dal sito;
   se arriva da Google o apre il link diretto, alle guide (/blog.html),
   cosi' non lo si butta mai fuori dal sito. */
(function () {
  function pronto(f) {
    if (document.readyState !== 'loading') f();
    else document.addEventListener('DOMContentLoaded', f);
  }

  pronto(function () {
    var briciole = document.querySelector('.breadcrumb');
    if (!briciole || document.querySelector('.ti-back')) return;

    var stile = document.createElement('style');
    stile.textContent =
      '.ti-back-riga{padding:18px 0 0}' +
      '.ti-back{display:inline-flex;align-items:center;gap:9px;height:46px;padding:0 18px 0 14px;' +
      'background:#fff;border:1.5px solid var(--line);border-radius:12px;color:var(--text);' +
      'font-family:inherit;font-size:16px;font-weight:700;cursor:pointer;' +
      'transition:background .15s,border-color .15s,color .15s}' +
      '.ti-back:hover{background:var(--primary-soft);border-color:var(--primary);color:var(--primary-dark)}' +
      '.ti-back svg{width:22px;height:22px;flex:0 0 auto}' +
      '@media(max-width:900px){.ti-back{height:44px;padding:0 14px 0 11px;font-size:15px}}';
    document.head.appendChild(stile);

    var riga = document.createElement('div');
    riga.className = 'ti-back-riga';
    riga.innerHTML =
      '<button type="button" class="ti-back" title="Torna indietro" aria-label="Torna indietro">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg><span>Indietro</span></button>';
    briciole.parentNode.insertBefore(riga, briciole);

    riga.querySelector('.ti-back').addEventListener('click', function () {
      var daNoi = false;
      try { daNoi = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
      if (daNoi && history.length > 1) history.back();
      else location.href = '/blog.html';
    });
  });
})();
