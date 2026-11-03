/* =====================================================================
   App operaio — LE MIE GIORNATE — 3 novembre 2026

   L'operaio vede quanti giorni ha lavorato nel mese e dove: le stesse
   righe che il capo vede nella sezione «Giornate» del gestionale
   (gest_ore + gest_rapportini). Per segnare la giornata usa il pulsante
   che c'era gia', «Segna la giornata» (rvApri): niente strada nuova.

   ⛔ Vede SOLO le sue ore: lo dice la regola gest_ore_team_read del
      database, non questo file.
   ⛔ La nota del capo la vede solo se il rapportino l'ha scritto lui
      (regola gest_rapportini_team_read): se no si vede solo il cantiere.
   ===================================================================== */
(function () {
  var MESI = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
  var GG = ["dom","lun","mar","mer","gio","ven","sab"];
  var mese = null, gira = false;

  function ym(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"); }
  function sposta(m,n){ var p=m.split("-").map(Number); var y=p[0], mm=p[1]+n; if(mm<1){mm=12;y--;} if(mm>12){mm=1;y++;} return y+"-"+String(mm).padStart(2,"0"); }
  function nomeMese(m){ var p=m.split("-"); var t=MESI[+p[1]-1]; return t.charAt(0).toUpperCase()+t.slice(1)+" "+p[0]; }
  function giorno(iso){ var d=new Date(iso+"T12:00"); var t=GG[d.getDay()]+" "+d.getDate()+" "+MESI[d.getMonth()]; return t.charAt(0).toUpperCase()+t.slice(1); }
  function e(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }

  var css = ""
    + "#mie-giornate .mg-mese{display:flex;align-items:center;gap:10px;margin:6px 0 12px}"
    + "#mie-giornate .mg-mese b{flex:1;font-size:22px}"
    + "#mie-giornate .mg-mese button{width:44px;height:44px;border-radius:10px;border:1px solid var(--line);background:#fff;font-size:22px;cursor:pointer}"
    + "#mie-giornate .mg-tot{background:var(--green-l);border-radius:14px;padding:16px;margin-bottom:12px}"
    + "#mie-giornate .mg-tot span{display:block;font-size:16px;color:var(--muted)}"
    + "#mie-giornate .mg-tot b{display:block;font-size:40px;line-height:1.1}"
    + "#mie-giornate .mg-r{border-top:1px solid var(--line);padding:10px 0}"
    + "#mie-giornate .mg-r small{display:block;font-size:15px;color:var(--muted);font-weight:bold}"
    + "#mie-giornate .mg-r div{font-size:17px;overflow-wrap:anywhere}"
    + "#mie-giornate .mg-vuoto{color:var(--muted);font-size:16px;padding:6px 0}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  function pannello(){
    var p = document.getElementById("mie-giornate");
    if (p) return p;
    var dopo = document.getElementById("btn-rapido");
    if (!dopo || !dopo.parentNode) return null;
    p = document.createElement("div");
    p.className = "panel hidden"; p.id = "mie-giornate";
    dopo.parentNode.insertBefore(p, dopo.nextSibling);
    p.addEventListener("click", function (ev) {
      var b = ev.target.closest("button"); if (!b) return;
      if (b.dataset.mg === "prev" || b.dataset.mg === "next") { mese = sposta(mese, b.dataset.mg === "next" ? 1 : -1); disegna(); }
      if (b.dataset.mg === "segna" && typeof rvApri === "function") rvApri();
    });
    return p;
  }

  async function disegna(){
    var p = pannello(); if (!p) return;
    var pronto = (typeof sb !== "undefined") && sb && typeof MIO !== "undefined" && MIO.impresaId && MIO.operatoreId;
    var puoi = pronto && typeof puo === "function" && puo("rapportini");
    p.classList.toggle("hidden", !puoi);
    if (!puoi || gira) return;
    gira = true;
    try {
      if (!mese) mese = ym(new Date());
      var a = mese + "-01", b = sposta(mese, 1) + "-01";
      var r = await sb.from("gest_ore").select("data,ore,lavoro_id,rapportino_id")
        .eq("user_id", MIO.impresaId).eq("operatore_id", MIO.operatoreId)
        .is("eliminato_il", null).gte("data", a).lt("data", b).order("data", { ascending: false });
      if (r.error) { p.innerHTML = '<div class="label">Le mie giornate</div><div class="mg-vuoto">Non riesco a leggerle adesso. Riprova fra un attimo.</div>'; return; }
      var ore = r.data || [];
      var ids = ore.map(function (o) { return o.rapportino_id; }).filter(Boolean);
      var note = {}, buttati = {};
      if (ids.length) {
        var rr = await sb.from("gest_rapportini").select("id,note,eliminato_il").in("id", ids);
        (rr.data || []).forEach(function (x) { if (x.eliminato_il) buttati[x.id] = 1; else note[x.id] = x.note || ""; });
      }
      ore = ore.filter(function (o) { return !(o.rapportino_id && buttati[o.rapportino_id]); });
      var giorni = {};
      ore.forEach(function (o) { giorni[o.data] = 1; });
      var n = Object.keys(giorni).length;
      var nomeLav = function (id) {
        var l = (typeof LAVORI !== "undefined" ? LAVORI : []).find(function (x) { return String(x.id) === String(id); });
        return l ? (l.descrizione || l.dove || "Cantiere") : "Cantiere";
      };
      var righe = ore.map(function (o) {
        var t = note[o.rapportino_id] || "";
        var mezza = (+o.ore || 0) < 8 ? " (" + String(+o.ore).replace(".", ",") + " ore)" : "";
        return '<div class="mg-r"><small>' + e(giorno(o.data)) + '</small><div>' + e(nomeLav(o.lavoro_id)) + (t ? " — " + e(t) : "") + e(mezza) + '</div></div>';
      }).join("");
      p.innerHTML = '<div class="label">Le mie giornate</div>'
        + '<div class="mg-mese"><button type="button" data-mg="prev" aria-label="Mese prima">‹</button><b>' + e(nomeMese(mese)) + '</b><button type="button" data-mg="next" aria-label="Mese dopo">›</button></div>'
        + '<div class="mg-tot"><span>Hai lavorato</span><b>' + n + (n === 1 ? " giorno" : " giorni") + '</b><span>' + (mese === ym(new Date()) ? "questo mese" : "in " + e(nomeMese(mese).toLowerCase())) + '</span></div>'
        + (righe || '<div class="mg-vuoto">Nessuna giornata segnata in questo mese.</div>')
        + '<button type="button" class="btn-fill" data-mg="segna" style="margin-top:12px">Segna la giornata di oggi</button>';
    } catch (err) {
      p.innerHTML = '<div class="label">Le mie giornate</div><div class="mg-vuoto">Non riesco a leggerle adesso.</div>';
    } finally { gira = false; }
  }

  /* parte quando l'app sa chi sei, e si ridisegna quando chiudi
     «Segna la giornata» (la finestra #rv-ov torna nascosta) */
  var tent = 0;
  var t = setInterval(function () {
    tent++;
    if ((typeof MIO !== "undefined" && MIO.operatoreId) || tent > 120) { clearInterval(t); disegna(); setTimeout(disegna, 3000); }
  }, 500);
  try {
    var ov = document.getElementById("rv-ov");
    if (ov) new MutationObserver(function () { if (ov.classList.contains("hidden")) setTimeout(disegna, 800); })
      .observe(ov, { attributes: true, attributeFilter: ["class"] });
  } catch (x) {}
  document.addEventListener("visibilitychange", function () { if (!document.hidden) disegna(); });
})();
