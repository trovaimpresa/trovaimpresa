/* 8 nov 2026 — UNA RICHIESTA, UNO STATO SOLO (pannello <-> gestionale)
   Le richieste di preventivo dal sito si vedono in due posti: nel pannello
   (card «Richiesta di preventivo») e nel gestionale («Richieste dal sito»).
   Prima ognuno aveva il suo stato: chiusa nel gestionale = ancora «Nuovo» nel
   pannello. Adesso tutti e due leggono e scrivono lo stesso stato, nella
   tabella `gest_dalsito` (una riga per utente e richiesta):
     nuova · vista · preventivo (preventivo fatto) · chiusa
   e la risposta mandata dal pannello (`preventivi.risposta`) vale per tutti e due.

   Qui, nei pannelli impresa e artigiano: avvolge caricaPreventivi() e
   apriModal() della pagina, senza cambiarle. Dopo che la lista e' disegnata:
   - il bollino della card dice lo stato vero;
   - c'e' il tasto «Segna chiusa» / «Riapri»;
   - il numerino delle richieste da guardare non conta chiuse e preventivi fatti.
   Aprire una richiesta = averla vista (come nel gestionale). */
(function () {
  var STATI = {
    nuova:      { lab: "🆕 Nuovo",            cls: "badge-nuovo" },
    vista:      { lab: "👁 Vista",            cls: "badge-inviato" },   /* non «nuovo»: se no avviso-richieste.js ci rimette «Ho visto» */
    preventivo: { lab: "🧾 Preventivo fatto", cls: "badge-inviato" },
    chiusa:     { lab: "✔ Chiusa",            cls: "badge-inviato" },
    risposto:   { lab: "✅ Risposto",          cls: "badge-inviato" }
  };
  var mappa = {};   /* id richiesta -> stato in gest_dalsito */
  var visti = {};   /* id richiesta -> true se gia' letta («Ho visto», preventivi.visto_il) */

  /* `sb` e `impresaCorrente` sono const/let della pagina: non stanno su window,
     ma da un altro script classico si vedono per nome (stesso spazio globale) */
  function client() { try { return (typeof sb !== "undefined" && sb) || null; } catch (e) { return null; } }
  function utente() { try { return (typeof impresaCorrente !== "undefined" && impresaCorrente && impresaCorrente.user_id) || null; } catch (e) { return null; } }
  function idDaCard(card) {
    var m = String(card.getAttribute("onclick") || "").match(/apriModal\((\d+)\)/);
    return m ? m[1] : null;
  }

  async function leggiStati(ids) {
    var sb = client(), uid = utente();
    if (!sb || !uid || !ids.length) return {};
    try {
      var r = await sb.from("gest_dalsito").select("preventivo_id,stato").eq("user_id", uid).in("preventivo_id", ids.map(Number));
      var m = {};
      ((r && r.data) || []).forEach(function (x) { m[String(x.preventivo_id)] = x.stato; });
      var v = await sb.from("preventivi_safe").select("id,visto_il").in("id", ids.map(Number));
      visti = {};
      ((v && v.data) || []).forEach(function (x) { if (x.visto_il) visti[String(x.id)] = true; });
      return m;
    } catch (e) { return {}; }
  }

  async function segna(id, stato) {
    var sb = client(), uid = utente();
    if (!sb || !uid) return false;
    try {
      var r = await sb.from("gest_dalsito")
        .upsert({ user_id: uid, preventivo_id: Number(id), stato: stato, letta_il: new Date().toISOString() }, { onConflict: "user_id,preventivo_id" })
        .select("id");
      if (r.error || !r.data || !r.data.length) { alert("Non sono riuscito a salvare. Riprova."); return false; }
      mappa[String(id)] = stato;
      /* qualunque stato vuol dire anche «letta»: si spegne l'avviso rosso */
      if (!visti[String(id)]) {
        try { await sb.rpc("segna_preventivo_visto", { p_id: Number(id) }); visti[String(id)] = true; } catch (e) {}
        try { if (window.avvisoRichiesteRicontrolla) window.avvisoRichiesteRicontrolla(); } catch (e) {}
      }
      return true;
    } catch (e) { alert("Non sono riuscito a salvare. Riprova."); return false; }
  }

  /* lo stato da mostrare: la risposta mandata vince su «nuova/vista» */
  function statoDi(card) {
    var id = idDaCard(card), st = mappa[String(id)] || (visti[String(id)] ? "vista" : "nuova");
    if ((st === "nuova" || st === "vista") && card.getAttribute("data-risposto") === "1") return "risposto";
    return st;
  }

  function sistemaCard(card) {
    var id = idDaCard(card); if (!id) return;
    var badge = card.querySelector(".prev-badge"); if (!badge) return;
    /* la pagina scrive «Risposto» quando c'e' la risposta: lo ricordiamo */
    if (!card.hasAttribute("data-risposto")) card.setAttribute("data-risposto", /Risposto/.test(badge.textContent) ? "1" : "0");
    var st = statoDi(card), d = STATI[st] || STATI.nuova;
    badge.textContent = d.lab;
    badge.classList.remove("badge-nuovo", "badge-inviato"); badge.classList.add(d.cls);
    var t = card.querySelector(".rs-tasto");
    if (!t) {
      t = document.createElement("button");
      t.type = "button"; t.className = "rs-tasto";
      t.style.cssText = "margin-left:8px;background:#fff;color:#0a2a4d;border:2px solid #0a2a4d;border-radius:10px;padding:8px 14px;font:inherit;font-size:15px;font-weight:700;cursor:pointer";
      var piede = card.querySelector(".prev-footer") || card;
      piede.appendChild(t);
      t.addEventListener("click", async function (e) {
        e.stopPropagation();
        var ora = statoDi(card);
        var nuovo = (ora === "chiusa") ? "vista" : "chiusa";
        if (await segna(id, nuovo)) { sistemaCard(card); contaDaGuardare(); }
      });
    }
    t.textContent = st === "chiusa" ? "↩ Riapri" : "✔ Segna chiusa";
    /* «Ho visto» serve solo sulle nuove */
    var hv = card.querySelector(".av-visto"); if (hv && st !== "nuova") hv.remove();
    var pf = card.querySelector(".prev-footer"); if (pf) { pf.style.flexWrap = "wrap"; pf.style.gap = "8px"; }
  }

  /* il numerino arancione sulla card del riepilogo: solo quelle ancora da guardare */
  function contaDaGuardare() {
    var b = document.getElementById("badge-prev-card"); if (!b) return;
    var n = 0;
    document.querySelectorAll("#lista-preventivi .prev-card").forEach(function (c) {
      var st = statoDi(c); if (st === "nuova" || st === "vista") n++;
    });
    b.textContent = n; b.style.display = n > 0 ? "inline-block" : "none";
  }

  async function dopoLista() {
    var cards = Array.prototype.slice.call(document.querySelectorAll("#lista-preventivi .prev-card"));
    var ids = cards.map(idDaCard).filter(Boolean);
    mappa = await leggiStati(ids);
    cards.forEach(sistemaCard);
    contaDaGuardare();
  }

  function avvolgi() {
    if (typeof window.caricaPreventivi === "function" && !window.caricaPreventivi._rs) {
      var orig = window.caricaPreventivi;
      window.caricaPreventivi = async function () {
        var r = await orig.apply(this, arguments);
        try { await dopoLista(); } catch (e) {}
        return r;
      };
      window.caricaPreventivi._rs = true;
    }
    if (typeof window.apriModal === "function" && !window.apriModal._rs) {
      var origM = window.apriModal;
      window.apriModal = async function (pid) {
        var r = await origM.apply(this, arguments);
        try {
          /* aprirla = averla vista (solo se e' davvero sua e ancora «nuova») */
          if (window._isMiaRichiesta !== false && !mappa[String(pid)]) {
            if (await segna(pid, "vista")) {
              var c = Array.prototype.slice.call(document.querySelectorAll("#lista-preventivi .prev-card")).filter(function (x) { return idDaCard(x) === String(pid); })[0];
              if (c) { sistemaCard(c); contaDaGuardare(); }
            }
          }
        } catch (e) {}
        return r;
      };
      window.apriModal._rs = true;
    }
  }
  avvolgi();
  /* «✓ Ho visto» di avviso-richieste.js: vale anche per il gestionale */
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".av-visto"); if (!b) return;
    var card = b.closest(".prev-card"), id = card && idDaCard(card); if (!id) return;
    setTimeout(async function () {
      visti[String(id)] = true;
      if (!mappa[String(id)]) await segna(id, "vista");
      sistemaCard(card); contaDaGuardare();
    }, 400);
  }, true);
  /* se la lista e' gia' stata disegnata prima di noi, la sistemiamo subito */
  var tent = 0, t = setInterval(function () {
    tent++;
    if (document.querySelector("#lista-preventivi .prev-card") && utente()) { clearInterval(t); dopoLista(); }
    else if (tent > 40) clearInterval(t);
  }, 500);
})();
