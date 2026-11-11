/* =====================================================================
   10 nov 2026 — L'APP DELL'OPERAIO CON LA SUA ICONA
   La pagina ha il suo foglietto (manifest-operaio.json) e la sua icona
   (img/app/operaio-*.png): blu scuro, per non confonderla col gestionale
   del capo, che e' bianca.
   Qui solo la scheda «Metti l'app sul telefono», in cima all'agenda:
   · Android/Chrome: un tasto, e il telefono chiede «Installa»;
   · iPhone: tre passi disegnati (Condividi → Aggiungi alla schermata Home);
   · si vede SOLO dal telefono e SOLO se l'app non e' gia' aperta dall'icona;
   · «Dopo» la nasconde per 7 giorni (niente si cancella).
   ===================================================================== */
(function(){
  var CHIAVE = "ti_op_installa_dopo";
  var richiesta = null;            /* il «vuoi installare?» di Chrome */

  function giaApp(){
    try{
      return (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
    }catch(_){ return false; }
  }
  function eTelefono(){
    try{ return matchMedia("(pointer:coarse)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent); }
    catch(_){ return false; }
  }
  function eIphone(){
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
           (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }
  function rimandato(){
    try{ var t = +localStorage.getItem(CHIAVE) || 0; return t && (Date.now() - t) < 7*864e5; }catch(_){ return false; }
  }

  var IC = {
    tel:  '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
    cond: '<path d="M12 3v12"/><path d="m7.5 7.5 4.5-4.5 4.5 4.5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
    piu:  '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8"/><path d="M8 12h8"/>',
    tre:  '<circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/>'
  };
  function ic(n){ return '<svg class="opi-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+IC[n]+'</svg>'; }

  var stile = document.createElement("style");
  stile.textContent =
    ".opi{background:#fff;border:2px solid #2456a6;border-radius:16px;padding:16px;margin-bottom:14px;box-shadow:0 2px 10px rgba(0,0,0,.06)}" +
    ".opi-top{display:flex;align-items:center;gap:14px}" +
    ".opi-logo{width:60px;height:60px;border-radius:14px;flex:0 0 auto;box-shadow:0 2px 8px rgba(0,0,0,.18)}" +
    ".opi-t{font-size:20px;font-weight:800;color:#0b1220;line-height:1.2}" +
    ".opi-s{font-size:16px;color:#1f2937;margin-top:3px;line-height:1.4}" +
    ".opi-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:58px;margin-top:14px;border:none;border-radius:14px;background:#1a3f7d;color:#fff;font:inherit;font-size:19px;font-weight:800;cursor:pointer}" +
    ".opi-dopo{display:block;width:100%;min-height:48px;margin-top:8px;border:none;background:none;color:#1f2937;font:inherit;font-size:17px;font-weight:600;text-decoration:underline;cursor:pointer}" +
    ".opi-passi{list-style:none;margin:14px 0 0;padding:0}" +
    ".opi-passi li{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid #e5e9ee;font-size:17px;color:#0b1220;line-height:1.35}" +
    ".opi-n{width:34px;height:34px;border-radius:50%;background:#e8effa;color:#1a3f7d;font-weight:800;font-size:17px;display:flex;align-items:center;justify-content:center;flex:0 0 auto}" +
    ".opi-ic{width:26px;height:26px;flex:0 0 auto;color:#1a3f7d}" +
    ".opi-btn .opi-ic{color:#fff}";
  document.head.appendChild(stile);

  function chiudi(box){
    try{ localStorage.setItem(CHIAVE, String(Date.now())); }catch(_){}
    box.remove();
  }

  function disegna(){
    if(document.getElementById("opi-box")) return;
    if(giaApp() || !eTelefono() || rimandato()) return;
    var dove = document.getElementById("view-agenda");
    if(!dove) return;
    var box = document.createElement("div");
    box.className = "opi"; box.id = "opi-box";
    var testa =
      '<div class="opi-top"><img class="opi-logo" src="/img/app/operaio-192.png" alt="">' +
      '<div><div class="opi-t">Metti l\'app sul telefono</div>' +
      '<div class="opi-s">Un\'icona sulla schermata, come WhatsApp. La apri con un tocco.</div></div></div>';
    if(eIphone()){
      box.innerHTML = testa +
        '<ol class="opi-passi">' +
        '<li><span class="opi-n">1</span>' + ic("cond") + '<span>Tocca <b>Condividi</b>, in basso in Safari</span></li>' +
        '<li><span class="opi-n">2</span>' + ic("piu") + '<span>Tocca <b>Aggiungi alla schermata Home</b></span></li>' +
        '<li><span class="opi-n">3</span>' + ic("tel") + '<span>Tocca <b>Aggiungi</b>. Poi apri l\'app dall\'icona e rientra con email e password</span></li>' +
        '</ol><button type="button" class="opi-dopo">Dopo</button>';
    }else if(richiesta){
      box.innerHTML = testa +
        '<button type="button" class="opi-btn">' + ic("tel") + 'Metti l\'icona</button>' +
        '<button type="button" class="opi-dopo">Dopo</button>';
    }else{
      box.innerHTML = testa +
        '<ol class="opi-passi">' +
        '<li><span class="opi-n">1</span>' + ic("tre") + '<span>Tocca i <b>tre puntini</b>, in alto a destra</span></li>' +
        '<li><span class="opi-n">2</span>' + ic("tel") + '<span>Tocca <b>Aggiungi a schermata Home</b> (o <b>Installa app</b>)</span></li>' +
        '</ol><button type="button" class="opi-dopo">Dopo</button>';
    }
    /* 11 nov 2026 — collaudo 3.9: il riquadro stava SOPRA la timbratura e
       spingeva «Entrata» sotto lo schermo, ogni volta finche' non si premeva
       «Dopo». Adesso sta sotto i tre pulsanti grandi (timbratura, giornata,
       scrivi al capo), prima delle schede. */
    var tabs = dove.querySelector(".op-tabs");
    var tmb = document.getElementById("tmb-card");
    if(tabs && tabs.parentNode === dove) dove.insertBefore(box, tabs);
    else if(tmb && tmb.parentNode === dove) dove.insertBefore(box, tmb.nextSibling);
    else dove.insertBefore(box, dove.firstChild);
    var b = box.querySelector(".opi-btn");
    if(b) b.onclick = async function(){
      if(!richiesta) return;
      richiesta.prompt();
      try{ var r = await richiesta.userChoice; if(r && r.outcome === "accepted") box.remove(); }catch(_){}
      richiesta = null;
    };
    box.querySelector(".opi-dopo").onclick = function(){ chiudi(box); };
  }

  window.addEventListener("beforeinstallprompt", function(e){
    e.preventDefault(); richiesta = e;
    var vecchia = document.getElementById("opi-box");
    if(vecchia) vecchia.remove();
    disegna();
  });
  window.addEventListener("appinstalled", function(){
    var b = document.getElementById("opi-box"); if(b) b.remove();
  });
  window.opInstallaDisegna = disegna;
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", disegna); else disegna();
})();
