/* ============================================================
   TrovaImpresa · Recensioni del sito (widget auto-iniettante)
   Si aggancia da solo alla pagina: crea stile + blocco + logica.
   Rileva la città dalla URL (es. imprese-milano.html -> "milano").
   ============================================================ */
(function () {
  "use strict";

  // ---- Config ----
  var SUPABASE_URL  = "https://nacvrsgkyfavykxjxszu.supabase.co";
  var SUPABASE_ANON = "sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R";

  // Evita doppia inizializzazione se lo script finisce due volte in pagina
  if (window.__tiRecensioniLoaded) return;
  window.__tiRecensioniLoaded = true;

  // ---- Rileva il nome pagina dalla URL ----
  function rilevaPagina() {
    var p = (location.pathname || "").toLowerCase();
    var file = p.substring(p.lastIndexOf("/") + 1).replace(".html", "");
    if (!file || file === "index") return "home";
    var m = file.match(/^imprese-(.+)$/);
    if (m) return m[1];
    return file;
  }
  var PAGE = rilevaPagina();

  // ---- CSS ----
  var css = ''
    + '#ti-recensioni{--tir-accent:#e67e22;--tir-star:#f5a623;--tir-bg:#fafafa;--tir-card:#fff;--tir-border:#e6e6e6;--tir-text:#2b2b2b;--tir-muted:#777;'
    + 'background:var(--tir-bg);border-top:1px solid var(--tir-border);padding:40px 16px;color:var(--tir-text);'
    + 'font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}'
    + '#ti-recensioni *{box-sizing:border-box}'
    + '#ti-recensioni .tir-wrap{max-width:960px;margin:0 auto}'
    + '#ti-recensioni .tir-head{display:flex;gap:24px;align-items:center;flex-wrap:wrap;margin-bottom:24px}'
    + '#ti-recensioni .tir-score{text-align:center;min-width:120px}'
    + '#ti-recensioni .tir-avg{font-size:44px;font-weight:800;line-height:1;display:block}'
    + '#ti-recensioni .tir-stars{color:var(--tir-star);letter-spacing:2px;font-size:18px}'
    + '#ti-recensioni .tir-count{display:block;color:var(--tir-muted);font-size:13px;margin-top:4px}'
    + '#ti-recensioni .tir-title h2{margin:0 0 4px;font-size:22px}'
    + '#ti-recensioni .tir-title p{margin:0;color:var(--tir-muted);font-size:15px}'
    + '#ti-recensioni .tir-form{background:var(--tir-card);border:1px solid var(--tir-border);border-radius:12px;padding:20px;margin-bottom:28px}'
    + '#ti-recensioni .tir-rate{display:flex;gap:4px;margin-bottom:14px}'
    + '#ti-recensioni .tir-star{background:none;border:none;cursor:pointer;font-size:32px;line-height:1;color:#d9d9d9;padding:0;transition:color .1s}'
    + '#ti-recensioni .tir-star.on,#ti-recensioni .tir-star.hover{color:var(--tir-star)}'
    + '#ti-recensioni .tir-input{width:100%;border:1px solid var(--tir-border);border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:15px;font-family:inherit}'
    + '#ti-recensioni .tir-input:focus{outline:none;border-color:var(--tir-accent)}'
    + '#ti-recensioni .tir-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}'
    + '#ti-recensioni .tir-actions{display:flex;align-items:center;gap:14px;flex-wrap:wrap}'
    + '#ti-recensioni .tir-submit{background:var(--tir-accent);color:#fff;border:none;border-radius:8px;padding:11px 22px;font-size:15px;font-weight:600;cursor:pointer}'
    + '#ti-recensioni .tir-submit:hover{filter:brightness(.95)}'
    + '#ti-recensioni .tir-submit:disabled{opacity:.6;cursor:default}'
    + '#ti-recensioni .tir-msg{font-size:14px}'
    + '#ti-recensioni .tir-msg.ok{color:#2e537d}#ti-recensioni .tir-msg.err{color:#c0392b}'
    + '#ti-recensioni .tir-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}'
    + '#ti-recensioni .tir-review{background:var(--tir-card);border:1px solid var(--tir-border);border-radius:12px;padding:16px}'
    + '#ti-recensioni .tir-review-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}'
    + '#ti-recensioni .tir-review-stars{color:var(--tir-star);font-size:15px;letter-spacing:1px}'
    + '#ti-recensioni .tir-review-date{color:var(--tir-muted);font-size:12px}'
    + '#ti-recensioni .tir-review-name{font-weight:600;font-size:14px;margin-bottom:4px}'
    + '#ti-recensioni .tir-review-text{font-size:14px;line-height:1.45;color:#444;margin:0;white-space:pre-wrap;word-break:break-word}'
    + '@media(max-width:520px){#ti-recensioni .tir-head{justify-content:center;text-align:center}}';

  // ---- HTML del blocco ----
  var html = ''
    + '<div class="tir-wrap">'
    +   '<div class="tir-head">'
    +     '<div class="tir-score">'
    +       '<span class="tir-avg" id="tir-avg">–</span>'
    +       '<div class="tir-stars" id="tir-avg-stars">★★★★★</div>'
    +       '<span class="tir-count" id="tir-count">Caricamento…</span>'
    +     '</div>'
    +     '<div class="tir-title">'
    +       '<h2>Ti piace TrovaImpresa?</h2>'
    +       '<p>Lascia la tua valutazione: ci aiuti a migliorare il servizio.</p>'
    +     '</div>'
    +   '</div>'
    +   '<form class="tir-form" id="tir-form" novalidate>'
    +     '<div class="tir-rate" id="tir-rate" role="radiogroup" aria-label="Voto da 1 a 5 stelle">'
    +       '<button type="button" class="tir-star" data-v="1" aria-label="1 stella">★</button>'
    +       '<button type="button" class="tir-star" data-v="2" aria-label="2 stelle">★</button>'
    +       '<button type="button" class="tir-star" data-v="3" aria-label="3 stelle">★</button>'
    +       '<button type="button" class="tir-star" data-v="4" aria-label="4 stelle">★</button>'
    +       '<button type="button" class="tir-star" data-v="5" aria-label="5 stelle">★</button>'
    +     '</div>'
    +     '<input class="tir-input" id="tir-name" type="text" maxlength="60" placeholder="Il tuo nome (facoltativo)" autocomplete="name">'
    +     '<textarea class="tir-input" id="tir-comment" maxlength="600" rows="3" placeholder="Scrivi un commento (facoltativo)"></textarea>'
    +     '<input type="text" id="tir-website" class="tir-hp" tabindex="-1" autocomplete="off" aria-hidden="true">'
    +     '<div class="tir-actions">'
    +       '<button type="submit" class="tir-submit" id="tir-submit">Invia valutazione</button>'
    +       '<span class="tir-msg" id="tir-msg" role="status"></span>'
    +     '</div>'
    +   '</form>'
    +   '<div class="tir-list" id="tir-list"></div>'
    + '</div>';

  // ---- Inserisce stile + blocco nella pagina ----
  function inserisci() {
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    var sec = document.createElement("section");
    sec.id = "ti-recensioni";
    sec.setAttribute("aria-label", "Recensioni del sito");
    sec.innerHTML = html;

    var footer = document.querySelector("footer");
    if (footer && footer.parentNode) footer.parentNode.insertBefore(sec, footer);
    else document.body.appendChild(sec);

    avvia(sec);
  }

  // ---- Carica supabase-js se non c'è, poi avvia ----
  function assicuraSupabase(cb) {
    if (window.supabase && window.supabase.createClient) return cb();
    var s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    s.onload = cb;
    document.head.appendChild(s);
  }

  // ---- Logica del widget ----
  function avvia() {
    assicuraSupabase(function () {
      var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
      var $ = function (id) { return document.getElementById(id); };
      var stars = function (n) { return "★★★★★☆☆☆☆☆".slice(5 - n, 10 - n); };
      var esc = function (s) {
        return (s || "").replace(/[&<>"']/g, function (m) {
          return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m];
        });
      };
      var fmtDate = function (d) {
        return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
      };

      // Il codice AggregateRating per Google e' stato tolto apposta:
      // Google non accetta le recensioni che un sito raccoglie su se stesso
      // per mostrare le stelline nei risultati, e in certi casi penalizza.
      // Il riquadro delle valutazioni resta e funziona come prima.
      function injettaSchemaGoogle() { /* volutamente vuota */ }

      var selected = 0;
      var rate = $("tir-rate");
      var starBtns = [].slice.call(rate.querySelectorAll(".tir-star"));
      var paint = function (n) {
        starBtns.forEach(function (b) { b.classList.toggle("on", +b.dataset.v <= n); });
      };
      starBtns.forEach(function (b) {
        b.addEventListener("mouseenter", function () {
          starBtns.forEach(function (x) { x.classList.toggle("hover", +x.dataset.v <= +b.dataset.v); });
        });
        b.addEventListener("mouseleave", function () {
          starBtns.forEach(function (x) { x.classList.remove("hover"); });
        });
        b.addEventListener("click", function () { selected = +b.dataset.v; paint(selected); });
      });

      function load() {
        sb.from("site_reviews")
          .select("rating, comment, author_name, created_at")
          .order("created_at", { ascending: false })
          .limit(30)
          .then(function (res) {
            if (res.error) { $("tir-count").textContent = "Recensioni non disponibili."; return; }
            var list = res.data || [];
            if (list.length) {
              var avg = list.reduce(function (s, r) { return s + r.rating; }, 0) / list.length;
              $("tir-avg").textContent = avg.toFixed(1).replace(".", ",");
              $("tir-avg-stars").textContent = stars(Math.round(avg));
              $("tir-count").textContent = list.length + (list.length === 1 ? " recensione" : " recensioni");
              injettaSchemaGoogle(avg, list.length);
            } else {
              $("tir-avg").textContent = "–";
              $("tir-count").textContent = "Nessuna recensione, sii il primo!";
            }
            $("tir-list").innerHTML = list.filter(function (r) {
              return (r.comment || "").trim();
            }).map(function (r) {
              return '<div class="tir-review">'
                + '<div class="tir-review-top"><span class="tir-review-stars">' + stars(r.rating) + '</span>'
                + '<span class="tir-review-date">' + fmtDate(r.created_at) + '</span></div>'
                + '<div class="tir-review-name">' + (esc(r.author_name) || "Anonimo") + '</div>'
                + '<p class="tir-review-text">' + esc(r.comment) + '</p></div>';
            }).join("");
          });
      }

      $("tir-form").addEventListener("submit", function (e) {
        e.preventDefault();
        var msg = $("tir-msg");
        msg.className = "tir-msg";
        if ($("tir-website").value) return;
        if (!selected) { msg.textContent = "Seleziona un voto con le stelle."; msg.classList.add("err"); return; }
        var last = +localStorage.getItem("tir_last") || 0;
        if (Date.now() - last < 60000) {
          msg.textContent = "Hai già inviato una valutazione da poco. Grazie!";
          msg.classList.add("err"); return;
        }
        var btn = $("tir-submit");
        btn.disabled = true; btn.textContent = "Invio…";
        sb.from("site_reviews").insert({
          rating: selected,
          comment: $("tir-comment").value.trim() || null,
          author_name: $("tir-name").value.trim() || null,
          page: PAGE
        }).then(function (res) {
          btn.disabled = false; btn.textContent = "Invia valutazione";
          if (res.error) { msg.textContent = "Ops, qualcosa è andato storto. Riprova."; msg.classList.add("err"); return; }
          localStorage.setItem("tir_last", Date.now());
          msg.textContent = "Grazie per la tua valutazione! ★";
          msg.classList.add("ok");
          $("tir-form").reset(); selected = 0; paint(0);
          load();
        });
      });

      load();
    });
  }

  // ---- Avvio quando la pagina è pronta ----
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inserisci);
  } else {
    inserisci();
  }
})();
