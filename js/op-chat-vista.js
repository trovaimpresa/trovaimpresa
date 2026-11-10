/* =====================================================================
   10 nov 2026 — LA CHAT COL CAPO, BENE IN VISTA
   Prima stava solo nella quarta linguetta («Chat»), piccola. Adesso:
   · un tasto grande «Scrivi al capo» subito sotto «Segna la giornata»;
   · se il capo ha scritto, il tasto diventa ROSSO e dice quanti messaggi;
   · il numero si ricontrolla da solo ogni minuto (solo a schermo acceso).
   Il motore resta js/chat-squadra.js + js/op-chat.js: qui solo la vista.
   ===================================================================== */
(function(){
  var stile = document.createElement("style");
  stile.textContent =
    ".opc-btn{display:flex;align-items:center;gap:14px;width:100%;min-height:68px;margin:0 0 14px;padding:12px 16px;" +
    "border:2px solid #1a3f7d;border-radius:16px;background:#fff;color:#0b1220;font:inherit;font-size:20px;font-weight:800;text-align:left;cursor:pointer}" +
    ".opc-btn svg{width:30px;height:30px;flex:0 0 auto;color:#1a3f7d}" +
    ".opc-btn .opc-sub{display:block;font-size:16px;font-weight:600;color:#1f2937;margin-top:2px}" +
    ".opc-btn .opc-n{margin-left:auto;min-width:36px;height:36px;padding:0 10px;border-radius:18px;background:#c62828;color:#fff;" +
    "font-size:18px;font-weight:800;display:none;align-items:center;justify-content:center}" +
    ".opc-btn.nuovi{background:#fdeaea;border-color:#c62828}" +
    ".opc-btn.nuovi svg{color:#c62828}" +
    ".opc-btn.nuovi .opc-n{display:flex}";
  document.head.appendChild(stile);

  var ICONA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

  function tasto(){
    var b = document.getElementById("opc-btn");
    if(b) return b;
    var rapido = document.getElementById("btn-rapido");
    if(!rapido || !rapido.parentNode) return null;
    b = document.createElement("button");
    b.type = "button"; b.id = "opc-btn"; b.className = "opc-btn";
    b.innerHTML = ICONA + '<span><span class="opc-t">Scrivi al capo</span><span class="opc-sub">Messaggi, foto e domande</span></span><span class="opc-n" id="opc-n"></span>';
    rapido.parentNode.insertBefore(b, rapido.nextSibling);
    b.onclick = function(){
      if(typeof opVaiScheda === "function") opVaiScheda("chat");
      var p = document.getElementById("op-p-chat");
      if(p) setTimeout(function(){ p.scrollIntoView({behavior:"smooth", block:"start"}); }, 80);
    };
    return b;
  }

  function mostra(n){
    var b = tasto(); if(!b) return;
    /* senza la scheda della persona la chat generale non c'e': il tasto non serve */
    var ok = !!(window.MIO ? MIO.operatoreId : (typeof MIO !== "undefined" && MIO.operatoreId));
    b.style.display = ok ? "" : "none";
    b.classList.toggle("nuovi", n > 0);
    var e = document.getElementById("opc-n"); if(e) e.textContent = n > 0 ? String(n) : "";
    var t = b.querySelector(".opc-t");
    if(t) t.textContent = n > 0 ? (n === 1 ? "Il capo ti ha scritto" : "Il capo ti ha scritto " + n + " messaggi") : "Scrivi al capo";
    var s = b.querySelector(".opc-sub");
    if(s) s.textContent = n > 0 ? "Tocca per leggere" : "Messaggi, foto e domande";
  }

  async function conta(){
    try{
      if(typeof sb === "undefined" || !sb || typeof MIO === "undefined" || !MIO.impresaId || !MIO.operatoreId){ mostra(0); return; }
      var lato = (MIO.uid && MIO.uid === MIO.impresaId) ? "titolare" : "operaio";
      var r = await sb.from("gest_messaggi").select("id", {count:"exact", head:true})
        .eq("user_id", MIO.impresaId).is("lavoro_id", null).eq("operatore_id", MIO.operatoreId)
        .is("letto_il", null).neq("autore", lato);
      mostra((r && !r.error && r.count) || 0);
    }catch(_){}
  }

  /* si aggancia al conto che c'e' gia' (op-chat.js): ogni volta che la
     linguetta si aggiorna, si aggiorna anche il tasto grande */
  var vecchio = window.opChatBadge;
  window.opChatBadge = async function(){
    var r;
    try{ if(typeof vecchio === "function") r = await vecchio.apply(this, arguments); }catch(_){}
    await conta();
    return r;
  };
  try{ opChatBadge = window.opChatBadge; }catch(_){}

  setInterval(function(){ if(!document.hidden) conta(); }, 60000);
  document.addEventListener("visibilitychange", function(){ if(!document.hidden) conta(); });
  window.opChatVistaConta = conta;
})();
