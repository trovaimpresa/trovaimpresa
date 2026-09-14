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
    const dt = new Date(y, m - 1 + (+mesi || 0), d);
    return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0")
           + "-" + String(dt.getDate()).padStart(2, "0");
  }

  // ---------------------------------------------------------------------
  // L'ELENCO
  // ---------------------------------------------------------------------
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
    if (error) { toast("Promemoria non letti: " + error.message); return; }
    promCache = data || [];

    const oggi = todayStr();
    const filtra = (A, v) => v === "aperti" ? A.filter(p => p.stato !== "fatto")
                           : v === "fatti"  ? A.filter(p => p.stato === "fatto")
                           : A.slice();
    const conta = {};
    PROM_VISTE.forEach(v => { conta[v.k] = filtra(promCache, v.k).length; });
    const L = filtra(promCache, promVista);

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
      })
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
        <div class="sh-nota">L'email ti arriva la mattina alle <b>7:30</b> del giorno dell'avviso, e dentro c'&egrave; scritta l'ora che hai messo. Quando lo segni <b>fatto</b>, se si ripete torna da solo alla data dopo.</div>
      </div>

      </div></div>`,
      `<button class="btn b-cancel" data-action="close">Annulla</button>
       <button class="btn-primary b-save" data-action="save-prom" data-id="${esc(String(p.id || ""))}">Salva</button>`);
  }

  async function salvaPromemoria(id) {
    if (!sbUid) { toast("Devi essere loggato"); return; }
    const v = s => { const e = $(s); return e ? String(e.value || "").trim() : ""; };

    const testo = v("#p-testo");
    if (!testo) { toast("Scrivi cosa ti devo ricordare"); return; }
    const data = v("#p-data");
    if (!data) { toast("Metti il giorno"); return; }

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
    renderPromemoria();
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
    renderPromemoria();
  }

  /* Butta = scrivi la data in eliminato_il. La riga resta e si recupera dal
     Cestino, come tutto il resto del gestionale. */
  async function promButta(id) {
    const q = await sb.from("promemoria")
      .update({ eliminato_il: new Date().toISOString() })
      .eq("id", id).eq("user_id", sbUid).select("id");
    if (q.error || !q.data || !q.data.length) {
      toast("Non buttato: " + ((q.error && q.error.message) || "nessuna riga scritta"));
      return;
    }
    toast("Buttato nel cestino");
    renderPromemoria();
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
    if (a === "del-prom")   { promButta(id); return; }
    if (a === "prom-vista") { promVista = t.dataset.v; renderPromemoria(); return; }
  });
