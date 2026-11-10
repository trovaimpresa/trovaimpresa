/* 10 nov 2026 — «⚑ SEGNALA QUESTA CONVERSAZIONE» (anti-truffa)
   Un tasto sotto la chat. Chi lo tocca sceglie cosa e' successo, puo' scrivere
   due righe, e la segnalazione arriva ad Alessio (admin → Segnalazioni + email).

   Due posti, un file solo:
   - profilo-impresa.html (il CLIENTE, senza account): la pagina chiama
     tiSegnala.monta(contenitore, {chi:'cliente', invia}) e passa la sua invia;
   - i 3 pannelli (l'IMPRESA): si monta da solo dentro #chat-aperta, se c'e'.
     Va caricato DOPO js/pannelli-messaggi.js (avvolge apriConversazione).

   ⛔ Chi segnala manda solo il codice della conversazione e il motivo:
   impresa, cliente e ultimi messaggi li legge il database (rpc segnala_chat,
   sql/segnala-chat.sql). L'email la manda netlify/functions/segnala-avviso.js
   rileggendo la segnalazione dal database. */
(function () {
  var SCELTE = {
    cliente: ["Mi chiede soldi in anticipo", "Mi manda su un altro sito o WhatsApp", "Mi chiede password o codici", "Altro"],
    impresa: ["Mi chiede soldi o dati", "Mi manda link o file strani", "Sembra un finto cliente", "Altro"]
  };

  function stile() {
    if (document.getElementById("seg-stile")) return;
    var s = document.createElement("style");
    s.id = "seg-stile";
    s.textContent =
      ".seg-link{background:none;border:none;color:#5b6574;font-size:15px;font-weight:600;cursor:pointer;padding:8px 0;margin-top:6px;display:inline-flex;gap:6px;align-items:center;font-family:inherit}" +
      ".seg-link:hover{color:#c0392b}" +
      ".seg-link[hidden],.seg-box[hidden],.seg-msg[hidden]{display:none}" +
      ".seg-box{margin-top:10px;border:1px solid #f1b8b0;background:#fff6f5;border-radius:10px;padding:14px 16px}" +
      ".seg-tit{font-size:16px;font-weight:700;color:#8a2a1f;margin:0 0 10px}" +
      ".seg-scelte{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}" +
      ".seg-scelta{border:1px solid #e3c4bf;background:#fff;border-radius:20px;padding:9px 14px;font-size:15px;cursor:pointer;color:#333;font-family:inherit}" +
      ".seg-scelta.on{background:#c0392b;border-color:#c0392b;color:#fff}" +
      ".seg-box textarea{width:100%;box-sizing:border-box;border:1px solid #ddd;border-radius:8px;padding:12px;font-size:15px;min-height:70px;font-family:inherit;resize:vertical}" +
      ".seg-azioni{display:flex;gap:10px;margin-top:10px;flex-wrap:wrap}" +
      ".seg-invia{background:#c0392b;color:#fff;border:none;border-radius:8px;padding:12px 18px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit}" +
      ".seg-invia:disabled{opacity:.6;cursor:default}" +
      ".seg-annulla{background:#fff;border:1px solid #ccc;border-radius:8px;padding:12px 18px;font-size:15px;cursor:pointer;font-family:inherit}" +
      ".seg-msg{margin-top:10px;padding:12px 14px;border-radius:8px;font-size:15px;line-height:1.5}" +
      ".seg-msg.ok{background:#e9f7ef;color:#1e6b3a;border:1px solid #b9e2c7}" +
      ".seg-msg.err{background:#fdecea;color:#a61b1b;border:1px solid #f1b8b0}";
    document.head.appendChild(s);
  }

  function monta(cont, opz) {
    if (!cont) return null;
    stile();
    var chi = opz.chi === "impresa" ? "impresa" : "cliente";
    cont.innerHTML =
      '<button type="button" class="seg-link">⚑ Segnala questa conversazione</button>' +
      '<div class="seg-box" hidden><p class="seg-tit">Cosa è successo?</p>' +
      '<div class="seg-scelte">' + SCELTE[chi].map(function (t) { return '<button type="button" class="seg-scelta">' + t + "</button>"; }).join("") + "</div>" +
      '<textarea maxlength="500" placeholder="Racconta in due righe (se vuoi)"></textarea>' +
      '<div class="seg-azioni"><button type="button" class="seg-invia">Invia la segnalazione</button><button type="button" class="seg-annulla">Annulla</button></div></div>' +
      '<div class="seg-msg" hidden></div>';
    var link = cont.querySelector(".seg-link"), box = cont.querySelector(".seg-box"),
        msg = cont.querySelector(".seg-msg"), ta = cont.querySelector("textarea"),
        btn = cont.querySelector(".seg-invia"), scelta = "";

    function dici(testo, cls) { msg.textContent = testo; msg.className = "seg-msg " + cls; msg.hidden = false; }
    function chiudi() { box.hidden = true; link.hidden = false; }
    function azzera() {
      scelta = ""; ta.value = ""; msg.hidden = true; btn.disabled = false; chiudi();
      cont.querySelectorAll(".seg-scelta").forEach(function (b) { b.classList.remove("on"); });
    }

    link.addEventListener("click", function () { box.hidden = false; link.hidden = true; msg.hidden = true; });
    cont.querySelector(".seg-annulla").addEventListener("click", azzera);
    cont.querySelectorAll(".seg-scelta").forEach(function (b) {
      b.addEventListener("click", function () {
        cont.querySelectorAll(".seg-scelta").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on"); scelta = b.textContent;
      });
    });
    btn.addEventListener("click", async function () {
      var altro = ta.value.trim();
      if (!scelta && !altro) { dici("Scegli cosa è successo, oppure scrivilo in due righe.", "err"); return; }
      btn.disabled = true;
      var motivo = (scelta || "Altro") + (altro ? " — " + altro : "");
      var r = null;
      try { r = await opz.invia(motivo); } catch (e) { r = null; }
      var esito = r && r.esito;
      if (esito === "ok") {
        chiudi(); link.hidden = true;
        dici("Grazie. La segnalazione è arrivata a TrovaImpresa: la controlliamo noi.", "ok");
        try {
          fetch("/.netlify/functions/segnala-avviso", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id }) }).catch(function () {});
        } catch (e) {}
      } else if (esito === "gia") {
        chiudi(); link.hidden = true;
        dici("Hai già segnalato questa conversazione oggi: la stiamo controllando.", "ok");
      } else if (esito === "troppe") {
        btn.disabled = false;
        dici("In questo momento arrivano troppe segnalazioni. Riprova fra un'ora, oppure scrivi a info@trovaimpresa.com.", "err");
      } else {
        btn.disabled = false;
        dici("Non sono riuscito a mandare la segnalazione. Riprova, oppure scrivi a info@trovaimpresa.com.", "err");
      }
    });
    return { azzera: azzera };
  }

  window.tiSegnala = { monta: monta };

  /* ---- i pannelli: si monta da solo dentro #chat-aperta ---- */
  function montaPannello() {
    var aperta = document.getElementById("chat-aperta");
    if (!aperta || document.getElementById("chat-segnala-imp")) return;
    var cont = document.createElement("div");
    cont.id = "chat-segnala-imp";
    aperta.appendChild(cont);
    var m = monta(cont, {
      chi: "impresa",
      invia: async function (motivo) {
        var client = null, conv = null;
        try { client = (typeof sb !== "undefined" && sb) || null; } catch (e) {}
        try { conv = (typeof msgConversazioneAperta !== "undefined" && msgConversazioneAperta && msgConversazioneAperta.convId) || null; } catch (e) {}
        if (!client || !conv) return null;
        var r = await client.rpc("segnala_chat", { p_conv: conv, p_motivo: motivo });
        if (r.error) { console.error("segnala_chat:", r.error.message); return null; }
        return r.data;
      }
    });
    /* aprendo un'altra conversazione, il riquadro torna chiuso e pulito */
    if (typeof window.apriConversazione === "function" && !window.apriConversazione._seg) {
      var prima = window.apriConversazione;
      window.apriConversazione = function () { var x = prima.apply(this, arguments); try { m.azzera(); } catch (e) {} return x; };
      window.apriConversazione._seg = true;
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montaPannello);
  else montaPannello();
})();
