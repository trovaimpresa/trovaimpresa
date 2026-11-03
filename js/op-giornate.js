/* =====================================================================
   App operaio — LE MIE GIORNATE — 3 novembre 2026

   L'operaio vede quanti giorni ha lavorato nel mese e dove: le stesse
   righe che il capo vede nella sezione «Giornate» del gestionale
   (gest_ore + gest_rapportini). Per segnare la giornata usa il pulsante
   che c'era gia', «Segna la giornata» (rvApri): niente strada nuova.

   ⛔ Vede SOLO le sue ore: le legge da gest_mie_giornate() (sql/
      gest-mie-giornate.sql), che restituisce solo le righe dell'operaio
      collegato. 3 nov 2026, deciso con Alessio: basta il permesso «Lavori»;
      «Rapportini» serve solo per il pulsante «Segna la giornata».
   ⛔ La nota del capo la vede solo se il rapportino l'ha scritto lui
      (regola gest_rapportini_team_read): se no si vede solo il cantiere.
   ===================================================================== */
(function () {
  var MESI = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
  var GG = ["dom","lun","mar","mer","gio","ven","sab"];
  var mese = null, gira = false;
  var racconta = null;   /* {data, dove, cosa, msg} il modulo «Racconta la tua giornata» aperto */

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
    + "#mie-giornate .mg-vuoto{color:var(--muted);font-size:16px;padding:6px 0}"
    + "#mie-giornate .mg-att{display:inline-block;font-size:14px;font-weight:bold;border-radius:6px;padding:2px 8px;margin-left:6px;background:#FEF3C7;color:#92400E}"
    + "#mie-giornate .mg-att.no{background:#FEE2E2;color:#991B1B}"
    + "#mie-giornate .mg-form{display:flex;flex-direction:column;gap:12px;background:#F8FAFC;border:1.5px solid var(--line);border-radius:14px;padding:16px;margin-top:12px}"
    + "#mie-giornate .mg-form label{font-size:15px;font-weight:bold;color:var(--muted)}"
    + "#mie-giornate .mg-form input,#mie-giornate .mg-form textarea{display:block;width:100%;box-sizing:border-box;font:inherit;font-size:17px;padding:12px;border:1.5px solid var(--line);border-radius:10px;margin-top:4px;background:#fff}"
    + "#mie-giornate .mg-form textarea{min-height:100px;resize:vertical}"
    + "#mie-giornate .mg-msg{font-size:16px}#mie-giornate .mg-msg.err{color:#DC2626}#mie-giornate .mg-msg.ok{color:#16A34A}"
    + "#mie-giornate .mg-due{display:flex;gap:10px;flex-wrap:wrap}";
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
      if (b.dataset.mg === "racconta") { apriRacconto(""); }
      if (b.dataset.mg === "annulla") { racconta = null; disegna(); }
      if (b.dataset.mg === "manda") { b.disabled = true; manda(); }
    });
    return p;
  }

  async function disegna(){
    var p = pannello(); if (!p) return;
    if (racconta && document.getElementById("mg-data")) leggiModulo();
    var pronto = (typeof sb !== "undefined") && sb && typeof MIO !== "undefined" && MIO.impresaId && MIO.operatoreId;
    var puoi = pronto && typeof puo === "function" && (puo("lavori") || puo("rapportini"));
    var scrive = puoi && puo("rapportini");
    p.classList.toggle("hidden", !puoi);
    if (!puoi || gira) return;
    gira = true;
    try {
      if (!mese) mese = ym(new Date());
      var a = mese + "-01", b = sposta(mese, 1) + "-01";
      var r = await sb.rpc("gest_mie_giornate", { p_impresa: MIO.impresaId, p_da: a, p_a: b });
      if (r.error) { p.innerHTML = '<div class="label">Le mie giornate</div><div class="mg-vuoto">Non riesco a leggerle adesso. Riprova fra un attimo.</div>'; return; }
      var ore = r.data || [];
      /* le giornate che ha mandato lui e che il capo non ha ancora approvato */
      var mie = [];
      if (!scrive && MIO.uid) {
        var rp = await sb.from("gest_giornate_proposte").select("id,data,dove,cosa,stato")
          .eq("user_id", MIO.impresaId).eq("membro_id", MIO.uid)
          .in("stato", ["da_vedere", "scartata"]).gte("data", a).lt("data", b).order("data", { ascending: false });
        if (!rp.error) mie = rp.data || [];
      }
      var ids = ore.map(function (o) { return o.rapportino_id; }).filter(Boolean);
      var note = {};
      if (ids.length && scrive) {
        var rr = await sb.from("gest_rapportini").select("id,note").in("id", ids);
        (rr.data || []).forEach(function (x) { note[x.id] = x.note || ""; });
      }
      var giorni = {};
      ore.forEach(function (o) { giorni[o.data] = 1; });
      var n = Object.keys(giorni).length;
      var attesa = mie.map(function (m) {
        return '<div class="mg-r"><small>' + e(giorno(m.data)) + (m.stato === "scartata" ? '<span class="mg-att no">il capo l\'ha scartata</span>' : '<span class="mg-att">aspetta il capo</span>') + '</small><div>' + e(m.dove) + (m.cosa ? " — " + e(m.cosa) : "") + '</div></div>';
      }).join("");
      var righe = ore.map(function (o) {
        var t = note[o.rapportino_id] || "";
        var mezza = (+o.ore || 0) < 8 ? " (" + String(+o.ore).replace(".", ",") + " ore)" : "";
        return '<div class="mg-r"><small>' + e(giorno(o.data)) + '</small><div>' + e(o.cantiere || "Cantiere") + (t ? " — " + e(t) : "") + e(mezza) + '</div></div>';
      }).join("");
      p.innerHTML = '<div class="label">Le mie giornate</div>'
        + '<div class="mg-mese"><button type="button" data-mg="prev" aria-label="Mese prima">‹</button><b>' + e(nomeMese(mese)) + '</b><button type="button" data-mg="next" aria-label="Mese dopo">›</button></div>'
        + '<div class="mg-tot"><span>Hai lavorato</span><b>' + n + (n === 1 ? " giorno" : " giorni") + '</b><span>' + (mese === ym(new Date()) ? "questo mese" : "in " + e(nomeMese(mese).toLowerCase())) + '</span></div>'
        + attesa + (righe || (attesa ? '' : '<div class="mg-vuoto">Nessuna giornata segnata in questo mese.</div>'))
        + (scrive ? '<button type="button" class="btn-fill" data-mg="segna" style="margin-top:12px">Segna la giornata di oggi</button>'
                  : (racconta ? modulo() : '<button type="button" class="btn-fill" data-mg="racconta" style="margin-top:12px">Racconta la tua giornata</button>'));
    } catch (err) {
      p.innerHTML = '<div class="label">Le mie giornate</div><div class="mg-vuoto">Non riesco a leggerle adesso.</div>';
    } finally { gira = false; }
  }

  /* ---- 3 nov 2026: l'operaio senza «Rapportini» racconta la SUA giornata.
     Va in gest_giornate_proposte, «aspetta il capo»: il capo la approva in
     Giornate e solo allora diventa una giornata con le ore. ---- */
  function oggi() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function cantieri() {
    var l = (typeof LAVORI !== "undefined" ? LAVORI : []).map(function (x) { return x.descrizione || x.dove; }).filter(Boolean);
    return l.filter(function (v, i) { return l.indexOf(v) === i; });
  }
  function modulo() {
    var c = cantieri();
    return '<div class="mg-form"><div class="mg-due"><label style="flex:1;min-width:140px">Giorno<input type="date" id="mg-data" max="' + oggi() + '" value="' + e(racconta.data) + '"></label>'
      + '<label style="flex:2;min-width:180px">Cantiere<input type="text" id="mg-dove" list="mg-cantieri" value="' + e(racconta.dove) + '" placeholder="Dove hai lavorato"></label></div>'
      + '<datalist id="mg-cantieri">' + c.map(function (x) { return '<option value="' + e(x) + '">'; }).join("") + '</datalist>'
      + '<label>Cosa hai fatto<textarea id="mg-cosa" placeholder="Puoi anche dettarlo col microfono">' + e(racconta.cosa) + '</textarea></label>'
      + '<div class="mg-msg ' + e(racconta.k || "") + '">' + e(racconta.msg || "") + '</div>'
      + '<div class="mg-due"><button type="button" class="btn-fill" id="mg-manda" data-mg="manda">Manda al capo</button>'
      + '<button type="button" class="btn-line" data-mg="annulla" style="flex:0 0 auto">Annulla</button></div></div>';
  }
  function leggiModulo() {
    if (!racconta) return;
    var v = function (id) { var x = document.getElementById(id); return x ? x.value : ""; };
    racconta.data = v("mg-data") || racconta.data; racconta.dove = v("mg-dove").trim(); racconta.cosa = v("mg-cosa").trim();
  }
  function apriRacconto(t) {
    var c = cantieri();
    racconta = { data: oggi(), dove: c.length === 1 ? c[0] : "", cosa: t || "", msg: "", k: "" };
    var p = pannello(); if (p) { p.classList.remove("hidden"); }
    mese = mese || oggi().slice(0, 7);
    disegna().then(function () { var p2 = document.getElementById("mie-giornate"); if (p2) p2.scrollIntoView({ behavior: "smooth", block: "start" }); var f = document.getElementById(c.length === 1 ? "mg-cosa" : "mg-dove"); if (f && !t) f.focus(); });
  }
  window.mgRacconta = apriRacconto;
  async function manda() {
    leggiModulo();
    var err = !/^\d{4}-\d{2}-\d{2}$/.test(racconta.data) ? "Scegli il giorno."
      : racconta.data > oggi() ? "Il giorno non può essere nel futuro."
      : !racconta.dove ? "Scrivi in quale cantiere hai lavorato." : "";
    if (err) { racconta.msg = err; racconta.k = "err"; disegna(); return; }
    var r = await sb.from("gest_giornate_proposte").insert({
      user_id: MIO.impresaId, operatore_id: MIO.operatoreId,
      data: racconta.data, dove: racconta.dove.slice(0, 120), cosa: (racconta.cosa || "").slice(0, 2000) || null
    }).select("id");
    if (r.error || !r.data || !r.data.length) {
      racconta.msg = "Non mandata: " + ((r.error && r.error.message) || "nessuna riga") + ". Riprova."; racconta.k = "err"; disegna(); return;
    }
    mese = racconta.data.slice(0, 7);
    racconta = null;
    await disegna();
    if (typeof toast === "function") { try { toast("Mandata al capo ✔"); } catch (x) {} }
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
