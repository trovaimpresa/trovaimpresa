/* ============================================================
   banda-gratis.js — 10 ottobre 2026

   La banda grande «Tutto GRATIS» per artigiani, imprese e professionisti,
   da mettere in fondo alle pagine che la gente trova da Google.
   Stessa grafica della pagina /iscriviti: blu #0a2a4d a quadretti (come il
   gestionale), GRATIS arancione, bottone grande.

   COME SI USA
   Una riga prima di </body>:
     <script src="/js/banda-gratis.js?v=1" defer></script>
   Si mette da sola subito prima del <footer> (o in fondo alla pagina se il
   footer non c'e'). Se c'e' gia', non si raddoppia.

   PER CAMBIARLA
   Si cambia QUI: vale per tutte le pagine dove e' inserita.
   NON DEVE MAI ROMPERE LA PAGINA: tutto dentro try/catch.
   ============================================================ */
(function () {
  'use strict';
  try {
    if (document.getElementById('banda-gratis')) return;

    var css =
      '#banda-gratis{box-sizing:border-box;margin:56px auto;padding:0 20px;max-width:1220px;' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}' +
      '#banda-gratis *{box-sizing:border-box}' +
      '#banda-gratis .bg-box{border-radius:28px;padding:84px 56px;text-align:center;color:#fff;' +
      'border:2px solid rgba(255,255,255,.5);background-color:#0a2a4d;' +
      'background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),' +
      'linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);background-size:40px 40px}' +
      '#banda-gratis .bg-su{font-size:1.5rem;font-weight:800;color:#ffb27a;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px}' +
      '#banda-gratis h2{font-size:4.2rem;line-height:1.1;font-weight:900;letter-spacing:-.5px;margin:0 0 16px;color:#fff}' +
      '#banda-gratis h2 span{display:inline-block;background:#ff8800;color:#fff;border-radius:14px;padding:0 18px}' +
      '#banda-gratis .bg-p{font-size:1.65rem;line-height:1.4;max-width:900px;margin:0 auto 34px;color:#fff;opacity:.95}' +
      '#banda-gratis .bg-pas{display:flex;gap:20px;justify-content:center;flex-wrap:wrap;margin:0 0 34px}' +
      '#banda-gratis .bg-pas b{background:#fff;color:#0a2a4d;border-radius:16px;padding:18px 30px;font-size:1.6rem;font-weight:800}' +
      '#banda-gratis .bg-pas i{font-style:normal;display:inline-block;background:#ff8800;color:#fff;border-radius:8px;padding:1px 9px;margin-left:8px}' +
      '#banda-gratis a.bg-bt{display:inline-block;background:#ff8800;color:#fff;text-decoration:none;font-weight:900;font-size:2rem;padding:26px 64px;border-radius:14px}' +
      '#banda-gratis a.bg-bt:hover{background:#e87a00}' +
      '#banda-gratis .bg-s{display:block;margin-top:20px;opacity:.9;font-size:1.3rem;color:#fff}' +
      '@media(max-width:700px){#banda-gratis{margin:36px auto;padding:0 12px}#banda-gratis .bg-box{padding:40px 18px}' +
      '#banda-gratis h2{font-size:2.2rem}#banda-gratis .bg-p{font-size:1.2rem}#banda-gratis .bg-su{font-size:1rem}' +
      '#banda-gratis .bg-pas b{font-size:1.15rem;padding:12px 18px}#banda-gratis a.bg-bt{font-size:1.35rem;padding:18px 30px}' +
      '#banda-gratis .bg-s{font-size:1.05rem}}';

    var html =
      '<div class="bg-box">' +
      '<p class="bg-su">Per artigiani, imprese e professionisti</p>' +
      '<h2>Fatti trovare dai clienti.<br>Tutto <span>GRATIS</span></h2>' +
      '<p class="bg-p">Iscrizione, preventivi che ricevi e gestionale base: non paghi niente e non serve la carta di credito.</p>' +
      '<div class="bg-pas"><b>Il sito<i>GRATIS</i></b><b>Il gestionale<i>GRATIS</i></b><b>Il forum<i>GRATIS</i></b></div>' +
      '<a class="bg-bt" href="/iscriviti?da=banda">Iscriviti gratis &rsaquo;</a>' +
      '<span class="bg-s">Due minuti. Nessuna carta di credito.</span>' +
      '</div>';

    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    var sec = document.createElement('section');
    sec.id = 'banda-gratis';
    sec.setAttribute('aria-label', 'Iscrizione gratuita per artigiani e imprese');
    sec.innerHTML = html;

    var qui = document.getElementById('banda-gratis-qui');
    var foot = document.querySelector('footer');
    if (qui && qui.parentNode) qui.parentNode.insertBefore(sec, qui);
    else if (foot && foot.parentNode) foot.parentNode.insertBefore(sec, foot);
    else document.body.appendChild(sec);

    /* 10 ott 2026 — conta i clic sul pulsante della banda, per sapere da quale
       pagina arrivano gli iscritti. Scrive in `visite_clienti` con tipo
       'clic_banda' (stessa tabella dei clic delle guide, righe separate).
       Niente cookie, niente IP. Non deve mai rompere ne' rallentare il clic. */
    try {
      var ua = (navigator && navigator.userAgent) || '';
      if (!/bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|gtmetrix|semrush|ahrefs/i.test(ua) && !navigator.webdriver) {
        sec.addEventListener('click', function (ev) {
          try {
            var a = ev.target && ev.target.closest ? ev.target.closest('a.bg-bt') : null;
            if (!a) return;
            var ses = null;
            try { ses = sessionStorage.getItem('ti_visita'); } catch (e) {}
            fetch('https://nacvrsgkyfavykxjxszu.supabase.co/rest/v1/visite_clienti', {
              method: 'POST',
              keepalive: true,
              headers: {
                'apikey': 'sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R',
                'Authorization': 'Bearer sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R',
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                tipo: 'clic_banda',
                cosa: 'banda',
                dove: 'registra',
                pagina: String(location.pathname || '/').slice(0, 200),
                sessione: ses ? String(ses).slice(0, 60) : null,
                telefono: (window.innerWidth || 1024) < 768
              })
            })['catch'](function () {});
          } catch (e) {}
        }, true);
      }
    } catch (e) {}
  } catch (e) { /* mai rompere la pagina */ }
})();
