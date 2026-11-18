/* ═══ LA SEZIONE «PROMEMORIA» ════════════════════════════════════════════
   14 settembre 2026.

   A CHE SERVE
   Uno spazio dove uno si scrive le SUE scadenze — quelle che non sono un
   lavoro, non sono una fattura e non sono una pratica: pagare l'F24,
   chiamare il commercialista, ordinare il materiale prima del cantiere.
   Quello che si scrive qui finisce nell'email del mattino
   (netlify/functions/promemoria-mattina.js).

   LA TABELLA ESISTEVA GIA' E NON L'AVEVA MAI USATA NESSUNO
   `promemoria` (id, user_id, testo, data, inviato) c'era dal primo giorno, con
   0 righe e 0 persone: era stata costruita e non aveva mai avuto una
   schermata. Qui le si da' la schermata; le colonne nuove (ora, note,
   avvisa_giorni, ripeti_mesi, stato, eliminato_il) le aggiunge
   sql/promemoria-sezione.sql.

   ⛔ I PROMEMORIA NON SONO DEL REPARTO, SONO SUOI.
   Tutto il resto del gestionale e' diviso per reparto. Questo no: «chiamare il
   commercialista» non e' ne' giardiniere ne' ferramenta. Si vedono tutti da
   qualunque reparto si entri — stessa ragione per cui il Noleggio e' uscito
   dai reparti il 24 agosto. Percio' qui NON si filtra per mestiere_id e la
   tabella non ha nemmeno quella colonna.

   ⚠️ L'ORA NON DECIDE QUANDO PARTE L'EMAIL.
   L'email del mattino parte una volta al giorno. L'ora che uno scrive finisce
   DENTRO il testo dell'avviso («oggi alle 15:00»), non fa partire niente alle
   15:00. Farlo davvero vorrebbe dire far girare il motore ogni ora.

   ⛔ LE DUE REGOLE DEI FILE js/ DEL GESTIONALE (vedi js/gest-azienda.js)
   1. Niente IIFE: questo file vive nello stesso spazio della pagina e vede
      sb, sbUid, esc, toast, closeSheet, $, openSheetGrande, renderTabella,
      quando, todayStr, tabVuoto, _SVGV senza che nessuno glieli passi. Un
      nome dichiarato anche nella pagina spegnerebbe tutto il gestionale.
   2. Al primo livello qui non si puo' USARE niente della pagina: questo file
      parte PRIMA. Solo dichiarazioni.

   I QUATTRO PUNTI TOCCATI IN gestionale-app.html
   1. la voce `#tab-promemoria` nella colonna di sinistra, sotto Computo metrico
   2. la `<section id="promemoria">` vuota
   3. la riga in RENDER_TAB e "promemoria" nell'elenco dei deep link
   4. lo <script> qui sotto
   ═════════════════════════════════════════════════════════════════════════ */

  let promCache = [];
  let promVista = "aperti";

  const PROM_VISTE = [
    { k: "aperti", lab: "Da fare" },
    { k: "fatti",  lab: "Fatti" },
    { k: "tutti",  lab: "Tutti" }
  ];

  /* Quanto prima avvisare. 0 = il giorno stesso. Sono le stesse tappe dello
     scadenzario (30/7/1) piu' qualche via di mezzo che serve davvero: un F24
     lo vuoi sapere con 7 giorni, un materiale da ordinare con 3. */
  const PROM_AVVISI = [
    [0,  "Il giorno stesso"],
    [1,  "1 giorno prima"],
    [3,  "3 giorni prima"],
    [7,  "7 giorni prima"],
    [15, "15 giorni prima"],
    [30, "30 giorni prima"]
  ];

  const PROM_RIPETI = [
    ["",   "Mai"],
    ["1",  "Ogni mese"],
    ["3",  "Ogni 3 mesi"],
    ["6",  "Ogni 6 mesi"],
    ["12", "Ogni anno"]
  ];

  function promEtichetta(elenco, v) {
    const r = elenco.find(x => String(x[0]) === String(v == null ? "" : v));
    return r ? r[1] : "";
  }

  /* l'ora senza i secondi: dal database arriva "09:00:00" */
  function promOra(o) { return o ? String(o).slice(0, 5) : ""; }

  /* la data del prossimo giro, quando un promemoria che si ripete viene
     segnato fatto. Si parte dalla SUA data, non da oggi: se uno lo spunta in
     ritardo, il giro dopo non slitta. */
  function promProssima(dataISO, mesi) {
    const [y, m, d] = String(dataISO).split("-").map(Number);
    /* 18 nov 2026 — il 31 gennaio «ogni mese» saltava febbraio e finiva al
       3 marzo (il 31 febbraio non esiste, e JavaScript va avanti di tre
       giorni). Adesso si ferma all'ultimo giorno del mese: 28 febbraio. */
    const primo = new Date(y, m - 1 + (+mesi || 0), 1);
    const ultimo = new Date(primo.getFullYear(), primo.getMonth() + 1, 0).getDate();
    const dt = new Date(primo.getFullYear(), primo.getMonth(), Math.min(d, ultimo));
    return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0")
           + "-" + String(dt.getDate()).padStart(2, "0");
  }

  /* 18 nov 2026 — dopo ogni scrittura si ridisegna con rinfresca(): cosi' si
     aggiornano anche il pallino nel menu, la riga «promemoria passati»
     dell'Assistente e il Calendario. Prima si ridisegnava solo l'elenco e il
     pallino restava fermo fino a quando non si ricaricava la pagina. */
  function promRidisegna() {
    if (typeof rinfresca === "function") rinfresca("promemoria", "calendario", "riepilogo");
    else renderPromemoria();
  }

  // ---------------------------------------------------------------------
  // L'ELENCO
  // ---------------------------------------------------------------------
  /* ============================================================
     18 nov 2026 — SCADENZE E PROMEMORIA: UNA VOCE SOLA, DUE LINGUETTE
     (deciso da Alex, foto approvata). Come «Mezzi e attrezzature»
     (js/gest-mezzi.js, mzUnisci): non si cancella niente. Le due sezioni
     #scadenzario e #promemoria restano, e resta il pulsante «promemoria» del
     menu, solo che non si vede (classe .sp-dentro): cosi' Calendario, Chat
     ([vai:promemoria]), Assistente e #promemoria funzionano come prima.
     ⛔ Da tenere: i promemoria sono dell'ACCOUNT (tutti i reparti), le
        scadenze del REPARTO. Lo dice la riga sotto le linguette.
     I numeri delle linguette (le cose da fare) li scrivono renderScadenze e
     renderPromemoria in window._spN; quello che manca si legge qui sotto.
     La chiamano le due render e le tre adattaMenu… (js/gest-reparti.js). */
  function spUnito() {
    try {
      return !!document.querySelector('nav.tabs button[data-tab="promemoria"]')
        && !(typeof tabNascosto === "function" && tabNascosto("scadenzario"));
    } catch (e) { return true; }
  }
  function spUnisci() {
    const uni = spUnito(), tutto = "Scadenze e promemoria";
    const bS = document.querySelector('nav.tabs button[data-tab="scadenzario"]'),
          bP = document.querySelector('nav.tabs button[data-tab="promemoria"]');
    if (bP) bP.classList.toggle("sp-dentro", uni);
    if (bS) { const s = bS.querySelector("span"); const t = uni ? tutto : "Scadenzario"; if (s && s.textContent !== t) s.textContent = t; }
    const N = window._spN || {};
    let mid = null; try { mid = typeof curMestiere === "function" ? curMestiere() : null; } catch (e) {}
    const nS = (N.scad != null && N.scadMid === mid) ? N.scad : null, nP = N.prom != null ? N.prom : null;
    const lab = (t, n) => t + (n != null ? " (" + n + ")" : "");
    [["scadenzario", "Scadenzario"], ["promemoria", "Promemoria"]].forEach(function (x) {
      const sec = document.getElementById(x[0]); if (!sec) return;
      const h = sec.querySelector(".sec-head h2"), t = uni ? tutto : x[1];
      if (h && h.textContent !== t) h.textContent = t;
      let g = sec.querySelector(".sp-ling"), nota = sec.querySelector(".sp-nota");
      if (!uni) { if (g) g.remove(); if (nota) nota.remove(); return; }
      if (!g) { g = document.createElement("div"); g.className = "segm mz-ling sp-ling"; const sh = sec.querySelector(".sec-head"); if (!sh) return; sh.after(g); }
      const html = '<button type="button" data-sp="scadenzario"' + (x[0] === "scadenzario" ? ' class="on"' : '') + '>' + lab("Scadenze", nS) + '</button>'
        + '<button type="button" data-sp="promemoria"' + (x[0] === "promemoria" ? ' class="on"' : '') + '>' + lab("Promemoria", nP) + '</button>';
      if (g.innerHTML !== html) g.innerHTML = html;
      if (x[0] === "promemoria" && !nota) {
        nota = document.createElement("p"); nota.className = "sp-nota";
        nota.textContent = "I promemoria si vedono in tutti i reparti.";
        g.after(nota);
      }
    });
    /* il numero che manca: si legge l'altra sezione (nascosta) una volta */
    if (!uni) return;
    if (nP == null && !window._spCaricoP && typeof renderPromemoria === "function" && sb && sbUid) {
      window._spCaricoP = 1; Promise.resolve(renderPromemoria()).catch(function () {}).then(function () { window._spCaricoP = 0; });
    } else if (nS == null && !window._spCaricoS && typeof renderScadenze === "function" && typeof cur !== "undefined" && cur) {
      window._spCaricoS = 1; Promise.resolve(renderScadenze()).catch(function () {}).then(function () { window._spCaricoS = 0; });
    }
  }
  if (!window.__spAscolto) {
    window.__spAscolto = 1;
    document.addEventListener("click", function (e) {
      const b = e.target.closest && e.target.closest("[data-sp]"); if (!b || b.classList.contains("on")) return;
      const v = document.querySelector('nav.tabs button[data-tab="' + b.getAttribute("data-sp") + '"]');
      if (v) v.click();
    });
  }

  async function renderPromemoria() {
    const box = $("#prom-list"); if (!box) return;
    if (!sb || !sbUid) {
      box.innerHTML = tabVuoto("Promemoria",
        "Accedi per scrivere i tuoi promemoria.", _SVGV + '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>');
      return;
    }

    /* ⛔ il cestino si toglie QUI, non nel disegno: se no il contatore delle
       viste conta anche la roba buttata e dice un numero che sullo schermo
       non c'e'. E' la stessa regola della chat del 29 agosto. */
    const { data, error } = await sb.from("promemoria")
      .select("*").eq("user_id", sbUid)
      .is("eliminato_il", null)
      .order("data", { ascending: true });
    if (error) { listaNonLetta(box, "i promemoria", "promemoria"); return; }   /* 12 nov 2026 — regola 20 */
    promCache = data || [];

    const oggi = todayStr();
    const filtra = (A, v) => v === "aperti" ? A.filter(p => p.stato !== "fatto")
                           : v === "fatti"  ? A.filter(p => p.stato === "fatto")
                           : A.slice();
    const conta = {};
    PROM_VISTE.forEach(v => { conta[v.k] = filtra(promCache, v.k).length; });
    /* 18 nov 2026 — il numero della linguetta «Promemoria» (quelli da fare) */
    window._spN = window._spN || {}; window._spN.prom = conta.aperti || 0;
    try { spUnisci(); } catch (e) {}
    const L = filtra(promCache, promVista);
    /* 18 nov 2026 — nei «Fatti» in cima sta l'ultimo, non il piu' vecchio */
    if (promVista === "fatti") L.reverse();

    renderTabella({
      id: "prom", box: "#prom-list",
      viste: "#prom-viste", visteDef: PROM_VISTE, vista: promVista,
      conta: conta, azioneVista: "prom-vista",
      vuoto: tabVuoto("Le cose che non devi dimenticare",
        "Pagare l’F24, chiamare il commercialista, ordinare il materiale prima del cantiere. Le scrivi qui e te le ritrovi nell’email del mattino.",
        _SVGV + '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
        { t: "+ Scrivi il primo promemoria", a: "new-prom" }),
      colonne: [{ lab: "Promemoria", w: "36%" }, { lab: "Quando", w: "20%" },
                { lab: "Avviso", w: "20%", cls: "c-chi" }, { lab: "Ripeti", w: "24%" }],
      righe: L.map(p => {
        const fatto = p.stato === "fatto";
        const q = quando(p.data, { neutro: fatto });
        const ora = promOra(p.ora);
        return {
          id: p.id,
          click: { action: "edit-prom", data: { id: p.id } },
          celle: [
            `<span class="lav-bar ${fatto ? "fatto" : (p.data && p.data < oggi ? "ritardo" : "in_corso")}" title="${fatto ? "Fatto" : (p.data && p.data < oggi ? "Passato" : "Da fare")}"></span><span class="c-nome">${esc(p.testo || "Promemoria")}</span>`,
            { h: q.testo + (ora ? ' &middot; ' + ora : ''), cls: q.classe },
            esc(promEtichetta(PROM_AVVISI, p.avvisa_giorni || 0)),
            p.ripeti_mesi ? esc(promEtichetta(PROM_RIPETI, p.ripeti_mesi))
                          : `<span class="cli-nome vuoto">—</span>`
          ],
          menu: [
            fatto ? { lab: "↩ Riapri",      action: "prom-stato", data: { id: p.id, v: "aperto" } }
                  : { lab: "✔ Segna fatto", action: "prom-stato", data: { id: p.id, v: "fatto" } },
            { sep: true },
            { lab: "✏ Modifica", action: "edit-prom", data: { id: p.id } },
            { lab: "🗑 Butta",    action: "del-prom",  data: { id: p.id } }
          ]
        };
      }),
      /* 27 set 2026 — le schede come Scadenzario e Lavori: prima qui usciva
         l'unica tabella piatta del gestionale */
      cards: () => L.map(p => promCard(p, oggi)).join("")
    });
  }

  function promCard(p, oggi) {
    const fatto = p.stato === "fatto";
    const passato = !fatto && p.data && p.data < oggi;
    let bg = "var(--sfondo)", fg = "var(--testo-2)", lab = "Da fare", tono = "t-neutro";
    if (fatto)        { bg = "var(--ok-bg)";  fg = "var(--ok)";  lab = "Fatto";   tono = "t-ok"; }
    else if (passato) { bg = "var(--err-bg)"; fg = "var(--err)"; lab = "Passato"; tono = "t-err"; }
    const q = quando(p.data, { neutro: fatto });
    const ora = promOra(p.ora);
    return schedaJob({
      tono, titolo: esc(p.testo || "Promemoria"),
      destra: `<span class="stato" style="background:${bg};color:${fg}">${lab}</span>`,
      meta: [
        "📅 " + q.testo + (ora ? " &middot; " + ora : ""),
        "🔔 " + esc(promEtichetta(PROM_AVVISI, p.avvisa_giorni || 0)),
        p.ripeti_mesi ? "🔁 " + esc(promEtichetta(PROM_RIPETI, p.ripeti_mesi)) : ""
      ],
      nota: p.note ? "📝 " + esc(p.note) : "",
      azioni: [
        fatto ? { lab: "↩ Riapri",      action: "prom-stato", data: { id: p.id, v: "aperto" } }
              : { lab: "✔ Segna fatto", action: "prom-stato", data: { id: p.id, v: "fatto" } },
        { lab: "✏ Modifica", action: "edit-prom", data: { id: p.id } },
        { lab: "🗑 Butta",    action: "del-prom",  data: { id: p.id }, del: true }
      ]
    });
  }

  // ---------------------------------------------------------------------
  // IL MODULO
  // ---------------------------------------------------------------------
  function promForm(p) {
    const isNew = !p; p = p || {};
    const opz = (elenco, sel) => elenco.map(x =>
      `<option value="${x[0]}"${String(x[0]) === String(sel == null ? "" : sel) ? " selected" : ""}>${x[1]}</option>`).join("");

    openSheetGrande(isNew ? "Nuovo promemoria" : "Modifica promemoria",
      `<div class="sh-cols"><div class="sh-col">

      <div class="sh-b">
        <div class="sh-tit">Cosa ti devo ricordare</div>
        <div class="field"><label>Promemoria</label>
          <input id="p-testo" value="${esc(p.testo || "")}" placeholder="Es. Pagare F24 secondo acconto"></div>
        <div class="field"><label>Note</label>
          <textarea id="p-note" placeholder="Quello che ti serve avere sotto mano quando lo leggi">${esc(p.note || "")}</textarea></div>
      </div>

      </div><div class="sh-col">

      <div class="sh-b">
        <div class="sh-tit">Quando</div>
        <div class="row2">
          <div class="field"><label>Giorno</label>
            <input id="p-data" type="date" value="${esc(p.data || todayStr())}"></div>
          <div class="field"><label>Ora</label>
            <input id="p-ora" type="time" value="${esc(promOra(p.ora))}"></div>
        </div>
        <div class="field"><label>Avvisami</label>
          <select id="p-avvisa">${opz(PROM_AVVISI, p.avvisa_giorni || 0)}</select></div>
        <div class="field"><label>Si ripete</label>
          <select id="p-ripeti">${opz(PROM_RIPETI, p.ripeti_mesi || "")}</select></div>
        <div class="sh-nota">L'email ti arriva <b>la mattina presto</b> del giorno dell'avviso, e dentro c'&egrave; scritta l'ora che hai messo. Quando lo segni <b>fatto</b>, se si ripete torna da solo alla data dopo.</div>
      </div>

      </div></div>`,
      `<button class="btn b-cancel" data-action="close">Annulla</button>
       <button class="btn-primary b-save" data-action="save-prom" data-id="${esc(String(p.id || ""))}">Salva</button>`);
    /* 1 nov 2026: caselle rosse e verdi (js/gest-ai-moduli.js) */
    try{ if(typeof ctrAscolta==="function") ctrAscolta("promemoria"); }catch(e){}
    /* 18 nov 2026 (ok di Alex, foto prima) — «Rimanda»: solo su un promemoria
       che c'e' gia' e non e' fatto. Sta in alto, dopo «Segna fatto». */
    if (!isNew && p.id != null && p.stato !== "fatto") promRimandaMetti(p.id);
  }

  /* I tre salti di «Rimanda». Si conta da OGGI, non dalla data vecchia: uno
     che rimanda una cosa di tre giorni fa la vuole domani, non l'altro ieri. */
  const PROM_RIMANDA = [[1, "A domani"], [3, "Fra 3 giorni"], [7, "Fra una settimana"]];

  function promRimandaMetti(id) {
    const testa = document.querySelector("#sheet .sh-head"); if (!testa) return;
    let az = testa.querySelector(".sh-head-az");
    if (!az) { az = document.createElement("div"); az.className = "sh-head-az"; testa.appendChild(az); }
    const d = document.createElement("details");
    d.className = "sh-altro prom-rimanda";
    d.innerHTML = '<summary class="btn btn-sm">Rimanda ▾</summary><div class="sh-altro-pop">'
      + PROM_RIMANDA.map(x => '<button class="btn btn-sm" data-chiudi="1" data-action="prom-rimanda" data-id="'
          + esc(String(id)) + '" data-g="' + x[0] + '">' + x[1] + '</button>').join("") + '</div>';
    const primo = az.querySelector(".az-prima");
    if (primo) primo.after(d); else az.prepend(d);
  }

  function promFraGiorni(n) {
    const [y, m, d] = todayStr().split("-").map(Number);
    const dt = new Date(y, m - 1, d + (+n || 0));
    return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0")
           + "-" + String(dt.getDate()).padStart(2, "0");
  }

  async function promRimanda(id, giorni) {
    const g = +giorni || 1;
    const data = promFraGiorni(g);
    /* la data cambia: l'avviso deve poter ripartire (come in salvaPromemoria) */
    const q = await sb.from("promemoria").update({ data: data, inviato: false })
      .eq("id", id).eq("user_id", sbUid).select("id");
    if (q.error || !q.data || !q.data.length) {
      toast("Non rimandato: " + ((q.error && q.error.message) || "nessuna riga scritta"));
      return;
    }
    toast("Rimandato " + (g === 1 ? "a domani" : "al " + data.split("-").reverse().join("/")) + " ✔");
    promRidisegna();
  }

  /* 18 nov 2026 — due tocchi veloci su «Salva» facevano nascere due promemoria
     uguali. Finche' il primo salvataggio non ha risposto, il secondo aspetta. */
  let _promSalvo = false;
  async function salvaPromemoria(id) {
    if (_promSalvo) return;
    _promSalvo = true;
    try { await _salvaPromemoria(id); } finally { _promSalvo = false; }
  }
  async function _salvaPromemoria(id) {
    if (!sbUid) { toast("Devi essere loggato"); return; }
    const v = s => { const e = $(s); return e ? String(e.value || "").trim() : ""; };

    const testo = v("#p-testo");
    if (!testo) { campoManca("#p-testo", "Manca cosa ti devo ricordare: scrivilo qui."); return; }   /* 12 nov 2026 — regola 21 */
    const data = v("#p-data");
    if (!data) { campoManca("#p-data", "Manca il giorno: sceglilo qui."); return; }

    const row = {
      user_id: sbUid,
      testo: testo,
      note: v("#p-note") || null,
      data: data,
      ora: v("#p-ora") || null,
      avvisa_giorni: parseInt(v("#p-avvisa"), 10) || 0,
      ripeti_mesi: parseInt(v("#p-ripeti"), 10) || null
    };

    /* ⛔ QUANDO SI CAMBIA LA DATA, L'AVVISO RIPARTE.
       `inviato` e' il segno che l'email di questo promemoria e' gia' partita.
       Se uno sposta il giorno e non lo si azzerasse, l'avviso nuovo non
       partirebbe mai — e uno resterebbe convinto di essere avvisato. */
    if (!id || String(promCache.find(x => String(x.id) === String(id))?.data || "") !== data) {
      row.inviato = false;
    }

    /* ⚠️ ogni scrittura si verifica con .select("id"): Supabase NON lancia su
       errore, e zero righe toccate non e' un errore. Senza questo controllo si
       direbbe «salvato» a chi non ha salvato niente. E' la regola 5 del
       gestionale. */
    const q = id
      ? await sb.from("promemoria").update(row).eq("id", id).eq("user_id", sbUid).select("id")
      : await sb.from("promemoria").insert(row).select("id");

    if (q.error || !q.data || !q.data.length) {
      toast("Non salvato: " + ((q.error && q.error.message) || "nessuna riga scritta"));
      return;
    }
    closeSheet();
    toast(id ? "Promemoria aggiornato ✔" : "Promemoria creato ✔");
    promRidisegna();
  }

  /* Segna fatto / riapri. Se si ripete, segnarlo fatto NON lo chiude: lo
     sposta alla data dopo e lo lascia aperto. Un F24 lo scrivi una volta
     sola, non due volte l'anno per sempre. */
  async function promStato(id, stato) {
    const p = promCache.find(x => String(x.id) === String(id));
    if (!p) return;

    let row;
    if (stato === "fatto" && p.ripeti_mesi) {
      row = { data: promProssima(p.data, p.ripeti_mesi), stato: "aperto", inviato: false };
    } else {
      row = { stato: stato };
      /* riaprendone uno passato, l'avviso deve poter ripartire */
      if (stato === "aperto") row.inviato = false;
    }

    const q = await sb.from("promemoria").update(row).eq("id", id).eq("user_id", sbUid).select("id");
    if (q.error || !q.data || !q.data.length) {
      toast("Non salvato: " + ((q.error && q.error.message) || "nessuna riga scritta"));
      return;
    }
    if (stato === "fatto" && p.ripeti_mesi) {
      toast("Fatto ✔ Torna il " + row.data.split("-").reverse().join("/"));
    } else {
      toast(stato === "fatto" ? "Segnato fatto ✔" : "Riaperto");
    }
    promRidisegna();
  }

  /* Butta = scrivi la data in eliminato_il. La riga resta e si recupera dal
     Cestino, come tutto il resto del gestionale. */
  async function promButta(id) {
    /* 18 nov 2026 — «Butta» partiva al primo tocco, senza chiedere niente
       (regola 22: la domanda dice QUALE cosa). Stessa domanda dello Scadenzario. */
    const _p = promCache.find(x => String(x.id) === String(id));
    const _nm = _p && _p.testo ? "«" + String(_p.testo).slice(0, 80) + "»" : "questo promemoria";
    const _ok = (typeof window.tiChiedi === "function")
      ? await window.tiChiedi("Lo riprendi dal Cestino quando vuoi.", { titolo: "Mettere nel cestino " + _nm + "?", si: "Sì, nel cestino", no: "No", rosso: true })
      : confirm("Mettere nel cestino " + _nm + "?");
    if (!_ok) return;
    const q = await sb.from("promemoria")
      .update({ eliminato_il: new Date().toISOString() })
      .eq("id", id).eq("user_id", sbUid).select("id");
    if (q.error || !q.data || !q.data.length) {
      toast("Non buttato: " + ((q.error && q.error.message) || "nessuna riga scritta"));
      return;
    }
    toast("Buttato nel cestino");
    promRidisegna();
  }

  // ---------------------------------------------------------------------
  // I CLIC
  // ⚠️ Un ascoltatore SUO, non una riga dentro quello della pagina. Gli
  //    ascoltatori della pagina sono catene di `if(a==="...")return ...`: le
  //    azioni che non conoscono le lasciano passare senza fare niente, quindi
  //    due ascoltatori convivono senza pestarsi i piedi.
  // ---------------------------------------------------------------------
  document.addEventListener("click", function (e) {
    const t = e.target && e.target.closest ? e.target.closest("[data-action]") : null;
    if (!t) return;
    const a = t.dataset.action, id = t.dataset.id;
    if (a === "new-prom")   { promForm(null); return; }
    if (a === "edit-prom")  { promForm(promCache.find(x => String(x.id) === String(id))); return; }
    if (a === "save-prom")  { salvaPromemoria(id || null); return; }
    if (a === "prom-stato") { promStato(id, t.dataset.v); return; }
    if (a === "prom-rimanda") { promRimanda(id, t.dataset.g); return; }
    if (a === "del-prom")   { promButta(id); return; }
    if (a === "prom-vista") { promVista = t.dataset.v; renderPromemoria(); return; }
  });
