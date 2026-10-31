/* ============================================================
   INVITO A RECENSIRE IL GESTIONALE SU G2  (31 ott 2026)
   Compare UNA volta, a chi il gestionale l'ha gia' usato un po'
   (almeno 5 righe salvate fra preventivi, fatture, lavori o
   noleggi). «Non ora» lo rimanda di 30 giorni; «Recensisci»
   lo spegne per sempre. Nessun premio in cambio: G2 non lo
   permette, e chiede di invitare tutti, non solo i contenti.
   Lo accende la pagina con:
     invitoG2Avvia(sb, ()=>sbUid, ["gest_preventivi", ...])
   Anteprima: aggiungere ?g2=prova all'indirizzo.
   ============================================================ */
(function () {
  var LINK = "https://www.g2.com/products/trovaimpresa-gestionale/review_modalities/new";
  var MINIMO = 5;                       // righe salvate prima di chiedere
  var RIMANDO = 30 * 24 * 3600 * 1000;  // «Non ora» = fra 30 giorni
  var ATTESA = 20000;                   // non disturbare appena si entra
  var prova = /[?&]g2=prova\b/.test(location.search);

  function leggi(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (_) { return null; } }
  function scrivi(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }

  var css =
    "#ti-g2{position:fixed;inset:0;z-index:99990;background:rgba(10,42,77,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}" +
    "#ti-g2 *{font-family:inherit}" +
    "#ti-g2 .g2-box{background:#fff;border-radius:18px;max-width:560px;width:100%;padding:34px 32px 28px;box-shadow:0 20px 60px rgba(0,0,0,.3);position:relative;box-sizing:border-box;max-height:calc(100vh - 32px);overflow:auto}" +
    "#ti-g2 .g2-x{position:absolute;top:10px;right:12px;width:48px;height:48px;border:0;background:none;font-size:30px;line-height:1;color:#64748b;cursor:pointer;border-radius:10px}" +
    "#ti-g2 .g2-x:hover{background:#f1f5f9}" +
    "#ti-g2 .g2-stelle{color:#ff8800;font-size:30px;letter-spacing:4px;margin:0 0 10px}" +
    "#ti-g2 h2{margin:0 0 14px;font-size:26px;line-height:1.25;color:#0a2a4d;padding-right:40px}" +
    "#ti-g2 p{margin:0 0 14px;font-size:18px;line-height:1.55;color:#1e293b}" +
    "#ti-g2 .g2-sotto{font-size:19px;color:#475569;margin-top:-6px}" +
    "#ti-g2 .g2-nota{font-size:16px;color:#475569}" +
    "#ti-g2 .g2-bott{display:flex;gap:12px;margin-top:22px;flex-wrap:wrap}" +
    "#ti-g2 .g2-si{flex:1 1 260px;display:flex;align-items:center;justify-content:center;min-height:60px;padding:0 22px;background:#ff8800;color:#fff;font-size:19px;font-weight:700;text-decoration:none;border-radius:12px;box-sizing:border-box}" +
    "#ti-g2 .g2-si:hover{background:#e67700}" +
    "#ti-g2 .g2-no{flex:0 1 160px;min-height:60px;padding:0 22px;background:#fff;color:#0a2a4d;border:2px solid #cbd5e1;font-size:18px;font-weight:600;border-radius:12px;cursor:pointer}" +
    "#ti-g2 .g2-no:hover{border-color:#0a2a4d}" +
    "@media (max-width:520px){#ti-g2 .g2-box{padding:28px 20px 22px}#ti-g2 h2{font-size:23px}#ti-g2 .g2-si,#ti-g2 .g2-no{flex:1 1 100%}}";

  function mostra(chiave) {
    if (document.getElementById("ti-g2")) return;
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    var d = document.createElement("div");
    d.id = "ti-g2";
    d.setAttribute("role", "dialog");
    d.setAttribute("aria-modal", "true");
    d.setAttribute("aria-labelledby", "g2-tit");
    d.innerHTML =
      '<div class="g2-box">' +
        '<button type="button" class="g2-x" aria-label="Chiudi">&times;</button>' +
        '<div class="g2-stelle" aria-hidden="true">★★★★★</div>' +
        '<h2 id="g2-tit">La tua recensione per noi è molto importante</h2>' +
        '<p class="g2-sotto">Bastano pochi clic.</p>' +
        '<p>Racconta com\'è il gestionale su G2, il sito dove le imprese confrontano i programmi gestionali.</p>' +
        '<p>La tua recensione lo fa conoscere ad altre imprese. Più TrovaImpresa cresce, più clienti trovano le imprese iscritte e mandano loro richieste di preventivo.</p>' +
        '<p class="g2-nota">Scrivi quello che pensi davvero, anche cosa manca.</p>' +
        '<div class="g2-bott">' +
          '<a class="g2-si" href="' + LINK + '" target="_blank" rel="noopener">Recensisci su G2</a>' +
          '<button type="button" class="g2-no">Non ora</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(d);

    function chiudi(stato) {
      if (!prova) scrivi(chiave, { stato: stato, quando: Date.now() });
      document.removeEventListener("keydown", tasto);
      d.remove();
    }
    function tasto(e) { if (e.key === "Escape") chiudi("dopo"); }
    d.querySelector(".g2-si").addEventListener("click", function () { chiudi("fatto"); });
    d.querySelector(".g2-no").addEventListener("click", function () { chiudi("dopo"); });
    d.querySelector(".g2-x").addEventListener("click", function () { chiudi("dopo"); });
    d.addEventListener("click", function (e) { if (e.target === d) chiudi("dopo"); });
    document.addEventListener("keydown", tasto);
    d.querySelector(".g2-si").focus();
  }

  function conta(sb, uid, tabelle) {
    return Promise.all(tabelle.map(function (t) {
      return sb.from(t).select("id", { count: "exact", head: true }).eq("user_id", uid)
        .then(function (r) { return (r && !r.error && r.count) || 0; }, function () { return 0; });
    })).then(function (n) { return n.reduce(function (a, b) { return a + b; }, 0); });
  }

  window.invitoG2Avvia = function (sb, getUid, tabelle) {
    if (prova) { setTimeout(function () { mostra("ti_g2_prova"); }, 1500); return; }
    if (window.TI_GIRO || !sb || !tabelle || !tabelle.length) return;
    var giri = 0;
    (function aspetta() {
      var uid = getUid && getUid();
      if (!uid) { if (++giri < 60) setTimeout(aspetta, 1000); return; }
      var chiave = "ti_g2_invito_" + uid;
      var s = leggi(chiave);
      if (s && s.stato === "fatto") return;
      if (s && s.stato === "dopo" && Date.now() - s.quando < RIMANDO) return;
      setTimeout(function () {
        conta(sb, uid, tabelle).then(function (n) {
          if (n >= MINIMO) mostra(chiave);
        });
      }, ATTESA);
    })();
  };
})();
