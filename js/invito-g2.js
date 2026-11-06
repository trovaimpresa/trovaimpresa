/* ============================================================
   «COME TI TROVI COL GESTIONALE?» — le stelle (1 nov 2026)
   Prima qui c'era una finestra in mezzo allo schermo che mandava a
   recensire su G2. Alex l'ha provata: «troppo difficile, nessuno lo
   farà mai» — G2 obbliga a registrarsi e il modulo è lungo.
   Adesso, come la domanda che fa Claude («come sta andando?»):
   - una STRISCIA PICCOLA in basso, che non copre il lavoro;
   - 5 stelle, un tocco, nessuna registrazione: il voto finisce nella
     tabella gest_voti, e lo legge Alex;
   - da 1 a 3 stelle: una casella «Cosa manca o cosa non va?»;
   - 4 o 5 stelle: «Ci aiuti anche su Trustpilot?» (un tocco con Google),
     e sotto, piccolo, anche G2;
   - la × la chiude: torna dopo 30 giorni. Chi ha votato non la rivede.
   Compare solo a chi il gestionale l'ha già usato (almeno 5 righe
   salvate). Nessun premio in cambio: Trustpilot e G2 non lo permettono.
   Lo accende la pagina con (nome rimasto quello vecchio apposta, cosi'
   le due pagine che lo chiamano non si toccano):
     invitoG2Avvia(sb, ()=>sbUid, ["gest_preventivi", ...])
   Anteprima: aggiungere ?g2=prova all'indirizzo (non scrive niente).
   ============================================================ */
(function () {
  var G2 = "https://www.g2.com/products/trovaimpresa-gestionale/review_modalities/new";
  var TRUSTPILOT = "https://www.trustpilot.com/evaluate/trovaimpresa.com";
  var MINIMO = 5;                       // righe salvate prima di chiedere
  var RIMANDO = 30 * 24 * 3600 * 1000;  // × = fra 30 giorni
  var ATTESA = 20000;                   // non disturbare appena si entra
  var prova = /[?&]g2=prova\b/.test(location.search);

  function leggi(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (_) { return null; } }
  function scrivi(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }

  var css =
    "#ti-voto{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:9990;width:min(760px,calc(100% - 24px));box-sizing:border-box;background:#0a2a4d;color:#fff;border-radius:16px;padding:16px 20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;box-shadow:0 10px 30px rgba(0,0,0,.25);font-family:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}" +
    "#ti-voto *{font-family:inherit;box-sizing:border-box}" +
    "#ti-voto .v-tit{font-size:20px;font-weight:700;flex:1 1 220px;margin:0}" +
    "#ti-voto .v-st{display:flex;gap:4px}" +
    "#ti-voto .v-st button{background:none;border:0;padding:2px 3px;font-size:38px;line-height:1;color:#ff8800;cursor:pointer}" +
    "#ti-voto .v-st button.spenta{color:rgba(255,255,255,.35)}" +
    "#ti-voto .v-x{background:none;border:0;color:#fff;font-size:30px;line-height:1;cursor:pointer;padding:4px 8px;border-radius:8px}" +
    "#ti-voto .v-x:hover{background:rgba(255,255,255,.12)}" +
    "#ti-voto .v-giu{flex:1 1 100%;font-size:18px;color:#dbe6f3;line-height:1.4}" +
    "#ti-voto .v-giu textarea{display:block;width:100%;min-height:90px;margin:10px 0;border-radius:10px;border:2px solid #fff;padding:10px 12px;font-size:17px;color:#0a2a4d;resize:vertical}" +
    "#ti-voto .v-btn{display:inline-block;margin-top:10px;background:#ff8800;color:#0a2a4d;font-weight:800;font-size:19px;padding:12px 20px;border-radius:10px;text-decoration:none;border:0;cursor:pointer}" +
    "#ti-voto .v-alt{display:block;margin-top:8px;font-size:15px}" +
    "#ti-voto .v-alt a{color:#fff;font-weight:600}" +
    "@media (max-width:600px){#ti-voto{bottom:76px;padding:14px 16px}#ti-voto .v-tit{font-size:18px}#ti-voto .v-st button{font-size:40px}#ti-voto .v-btn{display:block;text-align:center}}";

  function mostra(chiave, sb, uid, pagina) {
    if (document.getElementById("ti-voto")) return;
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    var d = document.createElement("div");
    d.id = "ti-voto";
    d.setAttribute("role", "region");
    d.setAttribute("aria-label", "Come ti trovi col gestionale?");
    var stelle = "";
    for (var i = 1; i <= 5; i++) stelle += '<button type="button" data-v="' + i + '" aria-label="' + i + (i === 1 ? " stella" : " stelle") + '">★</button>';
    d.innerHTML = '<p class="v-tit">Come ti trovi col gestionale?</p>'
      + '<div class="v-st">' + stelle + '</div>'
      + '<button type="button" class="v-x" aria-label="Chiudi">&times;</button>';
    document.body.appendChild(d);

    /* 6 nov 2026 — LA STRISCIA NON COPRE IL LAVORO. Prima usciva sopra i
       moduli aperti e copriva «Annulla». Adesso si vede solo quando non c'e'
       nessuna finestra aperta e, nel gestionale principale, solo nel
       Riepilogo. Quando si apre un modulo si nasconde, e torna dopo. */
    function puoStare() {
      if (document.querySelector("#overlay.open,.ai-ov,#gp-ov:not([hidden]),.side.open")) return false;
      var rie = document.getElementById("riepilogo");
      if (rie && !rie.classList.contains("active")) return false;
      return true;
    }
    var guardia = setInterval(function () {
      if (!document.body.contains(d)) { clearInterval(guardia); return; }
      d.style.display = puoStare() ? "" : "none";
    }, 500);
    d.style.display = puoStare() ? "" : "none";

    var idVoto = null;
    function segna(stato) { if (!prova) scrivi(chiave, { stato: stato, quando: Date.now() }); }
    function chiudi() { d.remove(); }
    d.querySelector(".v-x").addEventListener("click", function () {
      if (!idVoto) segna("dopo");   /* chi ha gia' votato non la rivede comunque */
      chiudi();
    });
    /* le stelle si accendono fino a quella sotto il dito */
    var bott = d.querySelectorAll(".v-st button");
    Array.prototype.forEach.call(bott, function (b) {
      b.addEventListener("mouseenter", function () { var n = +b.dataset.v; Array.prototype.forEach.call(bott, function (x) { x.classList.toggle("spenta", +x.dataset.v > n); }); });
      b.addEventListener("click", function () { vota(+b.dataset.v); });
    });
    d.querySelector(".v-st").addEventListener("mouseleave", function () { Array.prototype.forEach.call(bott, function (x) { x.classList.remove("spenta"); }); });

    function vota(n) {
      segna("fatto");
      d.querySelector(".v-st").remove();
      d.querySelector(".v-tit").textContent = n >= 4 ? "Grazie! " + n + " stelle" : "Grazie del voto";
      var giu = document.createElement("div"); giu.className = "v-giu";
      if (n >= 4) {
        giu.innerHTML = 'Ci aiuti anche su Trustpilot? Basta un tocco con Google.'
          + '<br><a class="v-btn" href="' + TRUSTPILOT + '" target="_blank" rel="noopener">Lascia la recensione su Trustpilot</a>'
          + '<span class="v-alt">Oppure <a href="' + G2 + '" target="_blank" rel="noopener">scrivila su G2</a></span>';
        giu.querySelector(".v-btn").addEventListener("click", function () { setTimeout(chiudi, 300); });
      } else {
        giu.innerHTML = 'Cosa manca o cosa non va? Lo leggiamo e lo sistemiamo.'
          + '<textarea maxlength="2000" placeholder="Scrivi qui, anche due parole"></textarea>'
          + '<button type="button" class="v-btn">Manda</button>';
        giu.querySelector(".v-btn").addEventListener("click", function () {
          var t = String(giu.querySelector("textarea").value || "").trim();
          if (t && idVoto && sb && !prova) {
            sb.from("gest_voti").update({ testo: t }).eq("id", idVoto).select("id").then(function () {}, function () {});
          }
          giu.innerHTML = "Grazie: lo leggiamo noi, di persona.";
          setTimeout(chiudi, 2500);
        });
      }
      d.appendChild(giu);
      if (prova || !sb || !uid) return;
      /* ⚠️ se il voto non si salva non si dice niente: e' un di piu', e
         il pulsante per scrivere cosa manca funziona lo stesso */
      try {
        sb.from("gest_voti").insert({ user_id: uid, stelle: n, pagina: pagina }).select("id").single()
          .then(function (r) { if (r && !r.error && r.data) idVoto = r.data.id; }, function () {});
      } catch (_) {}
    }
  }

  function conta(sb, uid, tabelle) {
    return Promise.all(tabelle.map(function (t) {
      return sb.from(t).select("id", { count: "exact", head: true }).eq("user_id", uid)
        .then(function (r) { return (r && !r.error && r.count) || 0; }, function () { return 0; });
    })).then(function (n) { return n.reduce(function (a, b) { return a + b; }, 0); });
  }

  window.invitoG2Avvia = function (sb, getUid, tabelle) {
    var pagina = (location.pathname.split("/").pop() || "").replace(/\.html$/, "").slice(0, 60);
    if (prova) { setTimeout(function () { mostra("ti_voto_prova", sb, null, pagina); }, 1500); return; }
    if (window.TI_GIRO || !sb || !tabelle || !tabelle.length) return;
    var giri = 0;
    (function aspetta() {
      var uid = getUid && getUid();
      if (!uid) { if (++giri < 60) setTimeout(aspetta, 1000); return; }
      var chiave = "ti_voto_" + uid;
      var s = leggi(chiave);
      if (s && s.stato === "fatto") return;
      if (s && s.stato === "dopo" && Date.now() - s.quando < RIMANDO) return;
      /* chi aveva gia' cliccato «Recensisci su G2» nella finestra vecchia non si ridisturba */
      var vecchia = leggi("ti_g2_invito_" + uid);
      if (vecchia && vecchia.stato === "fatto") return;
      setTimeout(function () {
        conta(sb, uid, tabelle).then(function (n) {
          if (n < MINIMO) return;
          /* chi ha gia' votato da un altro telefono o computer non si richiede */
          sb.from("gest_voti").select("id", { count: "exact", head: true }).eq("user_id", uid)
            .then(function (r) { if (!(r && !r.error && r.count)) mostra(chiave, sb, uid, pagina); },
                  function () { mostra(chiave, sb, uid, pagina); });
        });
      }, ATTESA);
    })();
  };
})();
