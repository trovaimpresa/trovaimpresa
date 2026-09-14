/* TrovaImpresa — barra di lettura per le guide prezzi
   Si aggiunge da sola. Non tocca niente della pagina.
   Computer: barra verticale a sinistra con pallino e percentuale.
   Telefono: riga sottile in alto. */
(function () {
  if (document.getElementById('ti-barra-lettura')) return;

  var css = document.createElement('style');
  css.textContent = [
    '#ti-barra-lettura{position:fixed;left:14px;top:90px;bottom:90px;width:4px;background:#e3e3e3;border-radius:3px;z-index:900;pointer-events:none}',
    '#ti-barra-lettura .ti-pieno{position:absolute;top:0;left:0;width:4px;height:0;background:#0066ff;border-radius:3px}',
    '#ti-barra-lettura .ti-pallino{position:absolute;left:-5px;top:0;width:14px;height:14px;border-radius:50%;background:#0066ff;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)}',
    '#ti-barra-lettura .ti-perc{position:absolute;left:16px;top:0;transform:translateY(-4px);background:#0066ff;color:#fff;font-size:12px;font-weight:bold;font-family:Arial,sans-serif;padding:3px 7px;border-radius:5px;white-space:nowrap}',
    '#ti-barra-lettura .ti-fine{position:absolute;bottom:-9px;left:-5px;width:14px;height:14px;border-radius:50%;background:#e3e3e3}',
    '#ti-barra-top{position:fixed;top:0;left:0;height:4px;width:0;background:#0066ff;z-index:901;display:none;pointer-events:none}',
    '@media(max-width:1100px){#ti-barra-lettura{display:none}#ti-barra-top{display:block}}'
  ].join('');
  document.head.appendChild(css);

  var barra = document.createElement('div');
  barra.id = 'ti-barra-lettura';
  barra.setAttribute('aria-hidden', 'true');
  barra.innerHTML = '<div class="ti-pieno"></div><div class="ti-pallino"></div><div class="ti-perc">0%</div><div class="ti-fine"></div>';

  var top = document.createElement('div');
  top.id = 'ti-barra-top';
  top.setAttribute('aria-hidden', 'true');

  document.body.appendChild(barra);
  document.body.appendChild(top);

  var pieno = barra.querySelector('.ti-pieno');
  var pallino = barra.querySelector('.ti-pallino');
  var perc = barra.querySelector('.ti-perc');
  var inCorso = false;

  function aggiorna() {
    inCorso = false;
    var doc = document.documentElement;
    var totale = (doc.scrollHeight || document.body.scrollHeight) - window.innerHeight;
    var fatto = totale > 0 ? (window.pageYOffset || doc.scrollTop) / totale : 0;
    if (fatto < 0) fatto = 0;
    if (fatto > 1) fatto = 1;
    var p = Math.round(fatto * 100);
    pieno.style.height = p + '%';
    pallino.style.top = p + '%';
    perc.style.top = p + '%';
    perc.textContent = p + '%';
    top.style.width = p + '%';
  }

  function chiedi() {
    if (inCorso) return;
    inCorso = true;
    window.requestAnimationFrame(aggiorna);
  }

  window.addEventListener('scroll', chiedi, { passive: true });
  window.addEventListener('resize', chiedi, { passive: true });
  aggiorna();
})();
