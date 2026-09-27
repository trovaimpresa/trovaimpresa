/* ═══ IL REPARTO «TASSE E FISCO» — TAPPA 1: FARSI PAGARE ═══════════════════
   27 settembre 2026.

   A CHE SERVE
   Detto da Alessio: «il mio problema era farsi pagare, non ci riuscivo mai,
   non sapevo scrivere una PEC, non avevo chi mi aiutasse, ero solo».
   Qui il gestionale prende le fatture EMESSE e NON PAGATE di tutti i reparti
   e per ognuna dice: quanto ti devono, da quanti giorni, quanti interessi ti
   spettano, e qual e' il PROSSIMO PASSO. I passi sono quattro, sempre gli
   stessi, dal piu' gentile al piu' duro:
     1 promemoria gentile (WhatsApp / email)
     2 sollecito deciso, con una data
     3 lettera formale via PEC (diffida e messa in mora), gia' scritta, in PDF
     4 giudice (decreto ingiuntivo): cosa costa, dove, se serve l'avvocato
   Ogni passo mandato si segna in `gest_solleciti`, cosi' il consiglio sa a
   che punto sei e quanti giorni sono passati.

   ⛔ PER ORA E' NASCOSTO.
   La voce #tab-fisco nasce con display:none e la accende SOLO fiscoAccendi():
   nel giro di prova (?giro=1) e per le email in FISCO_ANTEPRIMA. Per tutti gli
   altri non esiste. Quando Alessio dice «ok», si toglie il controllo e basta.

   ⛔ I NUMERI DI LEGGE STANNO TUTTI QUI SOTTO, IN FP_MORA / FP_LEGALE /
      FP_CONTRIBUTO. Verificati il 27/09/2026 (vedi CLAUDE.md). Cambiano ogni
      semestre (mora) e ogni anno (legale): quando cambiano si aggiunge una
      riga, NON si corregge quella vecchia — le fatture vecchie usano ancora
      il tasso del loro periodo.

   ⚠️ E' UNA STIMA. Ogni schermata lo dice: prima di un'azione legale si
      sente un avvocato. Noi non siamo avvocati e non firmiamo per nessuno.

   ⛔ LE DUE REGOLE DEI FILE js/ DEL GESTIONALE (vedi js/gest-azienda.js)
   1. Niente IIFE: vive nello spazio della pagina (sb, sbUid, esc, toast,
      closeSheet, $, openSheetGrande, eur, fdate, todayStr, _giorniA,
      _giorniDopo, tabVuoto, _SVGV, caricaJsPDF).
   2. Al primo livello non si USA niente della pagina: solo dichiarazioni.

   I QUATTRO PUNTI TOCCATI IN gestionale-app.html
   1. la voce `#tab-fisco` nella colonna di sinistra, sotto Promemoria
   2. la `<section id="fisco">` vuota
   3. la riga fisco:_rt("renderFisco") in RENDER_TAB
   4. lo <script> di questo file
   ═════════════════════════════════════════════════════════════════════════ */

  const FISCO_ANTEPRIMA = ["pintoalessio@icloud.com"];

  /* Interessi di mora, D.Lgs. 231/2002: tasso BCE + 8 punti, fisso per
     semestre. Solo fra aziende (B2B). Riga = dal giorno, tasso annuo %. */
  const FP_MORA = [
    ["2025-01-01", 11.15],
    ["2025-07-01", 10.15],
    ["2026-01-01", 10.15],
    ["2026-07-01", 10.40]
  ];
  /* Interesse legale (art. 1284 c.c.): per i privati. */
  const FP_LEGALE = [
    ["2025-01-01", 2.00],
    ["2026-01-01", 1.60]
  ];
  /* Costi fissi di recupero, art. 6 D.Lgs. 231/2002: solo B2B. */
  const FP_SPESE_FISSE = 40;
  /* Contributo unificato del decreto ingiuntivo (gia' dimezzato) + marca. */
  const FP_CONTRIBUTO = [[1100, 21.50], [5200, 49], [26000, 118.50], [52000, 259]];
  const FP_MARCA = 27;
  const FP_GDP_MAX = 10000;   /* giudice di pace fino a 10.000 € (i 30.000 slittati al 31/10/2027) */
  const FP_DASOLO_MAX = 1100; /* davanti al giudice di pace, senza avvocato fino a 1.100 € */

  const FP_PASSI = [
    null,
    { n: 1, lab: "Promemoria gentile", attesa: 7 },
    { n: 2, lab: "Sollecito deciso",   attesa: 10 },
    { n: 3, lab: "Lettera formale (PEC)", attesa: 15 },
    { n: 4, lab: "Giudice",            attesa: 0 }
  ];

  let fpCache = [];       /* le fatture non pagate, gia' arricchite */
  let fpAzienda = null;
  let fpSolleciti = [];
  let fpSezione = "pagare";
  /* ⛔ il numero del giro di disegno. Si cambia sezione mentre l'altra sta
     ancora leggendo dal database: senza questo numero la risposta vecchia
     arrivava dopo e scriveva «Farsi pagare» sotto il bottone «Le tue tasse». */
  let fpGiro = 0;

  // ---------------------------------------------------------------------
  // ACCENDERE LA VOCE (solo giro e anteprima)
  // ---------------------------------------------------------------------
  function fiscoAccendi() {
    const b = document.querySelector("#tab-fisco");
    if (!b) return;
    if (window.TI_GIRO) { b.style.display = ""; return; }
    let giri = 0;
    const prova = function () {
      if (typeof sb === "undefined" || !sb || !sb.auth) {
        if (++giri < 40) setTimeout(prova, 250);
        return;
      }
      sb.auth.getSession().then(function (r) {
        const em = String((r && r.data && r.data.session && r.data.session.user && r.data.session.user.email) || "").toLowerCase();
        if (FISCO_ANTEPRIMA.indexOf(em) >= 0) b.style.display = "";
      }).catch(function () {});
    };
    prova();
  }
  document.addEventListener("DOMContentLoaded", fiscoAccendi);

  // ---------------------------------------------------------------------
  // I CONTI
  // ---------------------------------------------------------------------
  function fpTasso(tabella, giorno) {
    let t = tabella[0][1];
    for (let i = 0; i < tabella.length; i++) if (tabella[i][0] <= giorno) t = tabella[i][1];
    return t;
  }
  function fpIso(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  /* interessi giorno per giorno dal giorno dopo la scadenza a oggi:
     cosi' un ritardo a cavallo di due semestri prende i due tassi giusti */
  function fpInteressi(importo, scadenza, b2b) {
    if (!scadenza || !(importo > 0)) return 0;
    const [y, m, d] = scadenza.split("-").map(Number);
    const g = new Date(y, m - 1, d + 1);
    const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
    const tab = b2b ? FP_MORA : FP_LEGALE;
    let tot = 0, giri = 0;
    while (g <= oggi && giri < 4000) {
      tot += importo * fpTasso(tab, fpIso(g)) / 100 / 365;
      g.setDate(g.getDate() + 1); giri++;
    }
    return Math.round(tot * 100) / 100;
  }
  function fpContributo(importo) {
    for (let i = 0; i < FP_CONTRIBUTO.length; i++) if (importo <= FP_CONTRIBUTO[i][0]) return FP_CONTRIBUTO[i][1];
    return null; /* oltre 52.000 €: si chiede all'avvocato */
  }
  /* «il 12/09» ma «l'11/09», «l'1/09», «l'8/09» */
  function fpIl(d) { const g = +String(d || "").slice(8, 10); return ([1, 8, 11].indexOf(g) >= 0 ? "l'" : "il ") + fdate(d); }
  function fpNumFatt(f) { return f.numero + "/" + (f.anno || String(f.data || "").slice(0, 4)); }

  function fpTel(t) {
    let s = String(t || "").replace(/[^\d+]/g, "");
    if (!s) return "";
    if (s.startsWith("+")) s = s.slice(1);
    else if (s.startsWith("00")) s = s.slice(2);
    else if (/^3\d{8,9}$/.test(s) || /^0\d{5,10}$/.test(s)) s = "39" + s;
    return s;
  }

  // ---------------------------------------------------------------------
  // IL CONSIGLIO — regole semplici, sempre le stesse
  // ---------------------------------------------------------------------
  function fpConsiglio(f) {
    const p = f.passo, gg = f.ritardo, dal = f.giorniDalPasso;
    if (gg <= 0) {
      return { tono: "neutro", prossimo: 1,
        testo: gg >= -3
          ? "Scade fra pochi giorni. Un messaggio gentile adesso, prima della scadenza, fa pagare prima: non è scortesia, è organizzazione."
          : "Non è ancora scaduta. Te la ricordo io quando manca poco." };
    }
    if (p === 0) {
      return { tono: gg > 30 ? "rosso" : "giallo", prossimo: gg > 30 ? 2 : 1,
        testo: gg > 30
          ? "È scaduta da " + gg + " giorni e non gli hai ancora scritto. Salta il messaggio gentile: mandagli subito un sollecito deciso, con una data precisa."
          : "Un piccolo ritardo è normale. Parti gentile: un messaggio su WhatsApp risolve la metà dei casi, e il cliente non si offende." };
    }
    if (p >= 4) {
      return { tono: "rosso", prossimo: 4,
        testo: "Sei alla strada del giudice. Senti un avvocato: con la PEC già mandata e la fattura in mano il decreto ingiuntivo è una pratica veloce." };
    }
    const att = FP_PASSI[p].attesa;
    if (dal < att) {
      const manca = att - dal;
      return { tono: "neutro", prossimo: p,
        testo: "Hai mandato il passo " + p + " " + (dal === 0 ? "oggi" : (dal === 1 ? "ieri" : dal + " giorni fa")) + ". Dagli tempo: se entro " + manca + (manca === 1 ? " giorno" : " giorni") + " non paga, ti dico io cosa fare." };
    }
    if (p === 1) return { tono: "giallo", prossimo: 2,
      testo: "Sono passati " + dal + " giorni dal messaggio gentile e non ha pagato. Ora un sollecito deciso: con una data precisa entro cui pagare." };
    if (p === 2) return { tono: "rosso", prossimo: 3,
      testo: "Non ha risposto al sollecito. È il momento della lettera formale via PEC: mette in mora il cliente, fa correre gli interessi e ferma la prescrizione. L'ho già scritta io con i tuoi dati." };
    return { tono: "rosso", prossimo: 4,
      testo: "Sono passati i 15 giorni della lettera formale. Adesso puoi chiedere al giudice un decreto ingiuntivo: ti spiego quanto costa e dove si fa." };
  }

  // ---------------------------------------------------------------------
  // LA SEZIONE
  // ---------------------------------------------------------------------
  async function renderFisco() {
    const box = $("#fisco-corpo"); if (!box) return;
    const mio = ++fpGiro;
    fpDisegnaNav();
    if (fpSezione === "tasse" && typeof fiscoTasse === "function") { fiscoTasse(box, mio); return; }
    if (fpSezione !== "pagare") { box.innerHTML = fpPresto(fpSezione); return; }
    if (!sb || !sbUid) {
      box.innerHTML = tabVuoto("Farsi pagare", "Accedi per vedere chi ti deve dei soldi.");
      return;
    }
    box.innerHTML = '<div class="fp-carica">Sto guardando le tue fatture…</div>';

    /* ⛔ NON si filtra per reparto: i soldi che ti devono sono tuoi, da
       qualunque reparto arrivino (stessa regola dei Promemoria). */
    const [rF, rA, rS] = await Promise.all([
      sb.from("gest_fatture")
        .select("id,numero,anno,data,stato,cliente_id,cli_nome,cli_piva,cli_cod_fiscale,cli_indirizzo,cli_cap,cli_citta,cli_prov,cli_pec")
        .eq("user_id", sbUid).eq("stato", "emessa").is("eliminato_il", null).not("numero", "is", null),
      sb.from("gest_azienda").select("*").eq("user_id", sbUid).maybeSingle(),
      sb.from("gest_solleciti").select("*").eq("user_id", sbUid).is("eliminato_il", null).order("inviato_il", { ascending: true })
    ]);
    if (mio !== fpGiro) return;
    if (rF.error) { box.innerHTML = tabVuoto("Farsi pagare", "Non riesco a leggere le fatture: " + esc(rF.error.message)); return; }
    fpAzienda = rA.data || {};
    fpSolleciti = rS.error ? [] : (rS.data || []);
    const ff = rF.data || [];
    const ids = ff.map(f => f.id);
    const cliIds = [...new Set(ff.map(f => f.cliente_id).filter(Boolean))];

    const [rT, rC] = await Promise.all([
      ids.length ? sb.from("gest_fatture_totali").select("fattura_id,totale,segno").in("fattura_id", ids) : Promise.resolve({ data: [] }),
      cliIds.length ? sb.from("gest_clienti").select("id,nome,referente,telefono,email,tipo,piva,sdi_pec").in("id", cliIds) : Promise.resolve({ data: [] })
    ]);
    if (mio !== fpGiro) return;
    const tot = {}; (rT.data || []).forEach(t => { tot[t.fattura_id] = t; });
    const cli = {}; (rC.data || []).forEach(c => { cli[c.id] = c; });
    const gg = (+fpAzienda.giorni_pagamento) || 30;

    fpCache = ff.map(f => {
      const t = tot[f.id] || {};
      const importo = (+t.segno || 1) > 0 ? (+t.totale || 0) : 0;
      const c = cli[f.cliente_id] || {};
      const b2b = c.tipo ? c.tipo === "azienda" : !!String(f.cli_piva || c.piva || "").trim();
      const scadenza = _giorniDopo(f.data, gg);
      const ritardo = -(_giorniA(scadenza) || 0);
      const sol = fpSolleciti.filter(s => s.fattura_id === f.id);
      const ultimo = sol.length ? sol[sol.length - 1] : null;
      const passo = sol.reduce((m, s) => Math.max(m, +s.passo || 0), 0);
      const giorniDalPasso = ultimo ? -(_giorniA(String(ultimo.inviato_il).slice(0, 10)) || 0) : null;
      const interessi = ritardo > 0 ? fpInteressi(importo, scadenza, b2b) : 0;
      const o = { ...f, cli: c, importo, b2b, scadenza, ritardo, sol, passo, giorniDalPasso, interessi };
      o.cons = fpConsiglio(o);
      return o;
    }).filter(f => f.importo > 0);

    const scadute = fpCache.filter(f => f.ritardo > 0).sort((a, b) => b.ritardo - a.ritardo);
    const arrivo = fpCache.filter(f => f.ritardo <= 0).sort((a, b) => a.ritardo - b.ritardo);
    const devono = scadute.reduce((s, f) => s + f.importo, 0);
    const extra = scadute.reduce((s, f) => s + f.interessi + (f.b2b ? FP_SPESE_FISSE : 0), 0);
    if (typeof setCnt === "function") setCnt("#cnt-fisco", scadute.length, "err");

    let h = `<div class="fp-tot">
      <div><small>Ti devono (scadute)</small><b>${eur(devono)}</b></div>
      <div><small>Clienti in ritardo</small><b>${new Set(scadute.map(f => f.cliente_id || f.cli_nome)).size}</b></div>
      <div><small>Interessi e spese che ti spettano</small><b class="fp-verde">+ ${eur(extra)}</b></div>
    </div>`;

    if (!fpCache.length) {
      h += tabVuoto("Nessuno ti deve niente",
        "Tutte le fatture emesse sono pagate. Quando una scade senza pagamento, la trovi qui con il messaggio già scritto.",
        _SVGV + '<path d="M20 6 9 17l-5-5"/></svg>');
    }
    if (scadute.length) {
      h += `<h3 class="fp-h3">Scadute, da farsi pagare</h3>` + scadute.map(fpScheda).join("");
    } else if (fpCache.length) {
      h += `<div class="fp-cons verde"><div>👍</div><div><b>Nessuna fattura scaduta</b>Quelle qui sotto non sono ancora scadute.</div></div>`;
    }
    if (arrivo.length) {
      h += `<h3 class="fp-h3">Non ancora scadute</h3>` + arrivo.map(fpRigaArrivo).join("");
    }
    h += `<p class="fp-stima">⚖️ Interessi e costi sono una <b>stima</b> calcolata sulle regole in vigore. Prima di andare dal giudice senti un avvocato; per le tasse, il tuo commercialista.</p>`;
    box.innerHTML = h;
  }

  function fpDisegnaNav() {
    const n = $("#fisco-nav"); if (!n) return;
    const V = [["pagare", "💶 Farsi pagare"], ["tasse", "🧾 Le tue tasse"], ["vivere", "🛟 Sopravvivere"], ["ai", "🤖 Chiedi all'AI"]];
    n.innerHTML = V.map(v => `<button class="fp-chip${fpSezione === v[0] ? " on" : ""}" data-action="fp-sez" data-v="${v[0]}">${v[1]}</button>`).join("");
  }
  function fpPresto(k) {
    const T = {
      tasse: ["Le tue tasse", "Il tuo profilo (forfettario, ordinario, SNC, SRL, professionista), le scadenze con gli importi, il salvadanaio per non farti trovare scoperto e le lettere dell'Agenzia spiegate semplici."],
      vivere: ["Sopravvivere", "Quanto ti resta davvero in tasca, il prezzo giusto per non lavorare in perdita e la cartella pronta per il commercialista."],
      ai: ["Chiedi all'AI", "Le domande che ti vergogni di fare al commercialista: risposte semplici, con i tuoi numeri."]
    }[k] || ["", ""];
    return tabVuoto(T[0], T[1] + "<br><b>Arriva nella prossima tappa.</b>");
  }

  function fpScheda(f) {
    const c = f.cons;
    const pill = [1, 2, 3, 4].map(n => {
      const cls = n <= f.passo ? "ok" : (n === c.prossimo ? "ora" : "");
      return `<button class="fp-passo ${cls}" data-action="fp-apri" data-id="${f.id}" data-v="${n}">${n <= f.passo ? "✓ " : ""}${n} · ${FP_PASSI[n].lab}</button>`;
    }).join("");
    const storia = f.sol.map(s => `${fdate(String(s.inviato_il).slice(0, 10))}: passo ${s.passo} (${esc(s.canale)})`).join(" · ");
    const extra = f.interessi + (f.b2b ? FP_SPESE_FISSE : 0);
    const btnNext = c.prossimo === 4
      ? `<button class="btn-primary" data-action="fp-apri" data-id="${f.id}" data-v="4">⚖️ Cosa fare col giudice</button>`
      : c.prossimo === 3
        ? `<button class="btn-primary" data-action="fp-apri" data-id="${f.id}" data-v="3">📨 Prepara la lettera PEC</button>`
        : `<button class="btn-primary" data-action="fp-apri" data-id="${f.id}" data-v="${c.prossimo}">💬 Scrivi il ${c.prossimo === 1 ? "promemoria" : "sollecito"}</button>`;
    return `<div class="fp-card">
      <div class="fp-cli"><div><div class="fp-n">${esc(f.cli.nome || f.cli_nome || "Cliente")}</div>
        <div class="fp-sotto">Fattura ${esc(fpNumFatt(f))} del ${fdate(f.data)} · <b class="fp-rosso">scaduta da ${f.ritardo} ${f.ritardo === 1 ? "giorno" : "giorni"}</b></div></div>
        <div class="fp-e">${eur(f.importo)}${extra > 0 ? `<small>+ ${eur(extra)} ${f.b2b ? "interessi e spese" : "interessi"}</small>` : ""}</div></div>
      <div class="fp-passi">${pill}</div>
      <div class="fp-cons ${c.tono}"><div>🤖</div><div><b>Il mio consiglio</b>${esc(c.testo)}</div></div>
      ${storia ? `<div class="fp-storia">🗂️ ${storia}${f.sol.length ? ` · <button class="fp-link" data-action="fp-togli" data-id="${f.id}">↩ togli l'ultimo</button>` : ""}</div>` : ""}
      <div class="fp-btns">${btnNext}
        <button class="btn" data-action="fp-pagato" data-id="${f.id}">✓ Ha pagato</button></div>
    </div>`;
  }

  function fpRigaArrivo(f) {
    const g = -f.ritardo;
    return `<div class="fp-riga">
      <div><b>${esc(f.cli.nome || f.cli_nome || "Cliente")}</b><span>Fattura ${esc(fpNumFatt(f))} · ${g === 0 ? "scade oggi" : "scade fra " + g + (g === 1 ? " giorno" : " giorni")} (${fdate(f.scadenza)})</span></div>
      <div class="fp-riga-d"><b>${eur(f.importo)}</b>
        <button class="btn" data-action="fp-apri" data-id="${f.id}" data-v="1">💬 Ricordaglielo</button>
        <button class="btn" data-action="fp-pagato" data-id="${f.id}">✓ Pagata</button></div>
    </div>`;
  }

  // ---------------------------------------------------------------------
  // I TESTI — scritti con i dati veri, sempre modificabili prima di mandarli
  // ---------------------------------------------------------------------
  function fpIban() { return String((fpAzienda && fpAzienda.iban) || "").replace(/\s+/g, " ").trim(); }
  function fpFirma() { return (fpAzienda && fpAzienda.nome) || ""; }
  function fpSaluto(f) {
    const r = String(f.cli.referente || "").trim();
    return r ? "Buongiorno " + r : "Buongiorno";
  }

  function fpTesto(f, n) {
    const iban = fpIban(), firma = fpFirma();
    const imp = eur(f.importo), num = fpNumFatt(f);
    if (n === 1) {
      return fpSaluto(f) + ",\n"
        + "le scrivo per ricordarle la fattura n. " + num + " del " + fdate(f.data) + ", di " + imp
        + (f.ritardo > 0 ? ", scaduta " + fpIl(f.scadenza) : ", che scade " + fpIl(f.scadenza)) + ".\n"
        + (f.ritardo > 0 ? "Forse le è solo sfuggita: " : "")
        + "può saldarla con un bonifico" + (iban ? " sull'IBAN " + iban : "") + ".\n"
        + "Se l'ha già pagata, mi scusi e mi mandi pure la ricevuta.\n"
        + "Grazie e buona giornata" + (firma ? ",\n" + firma : ".");
    }
    if (n === 2) {
      const p1 = f.sol.find(s => +s.passo === 1);
      const entro = _giorniDopo(todayStr(), 7);
      return fpSaluto(f) + ",\n"
        + "la fattura n. " + num + " del " + fdate(f.data) + ", di " + imp + ", è scaduta da " + f.ritardo + " giorni"
        + (p1 ? " e, nonostante il mio messaggio del " + fdate(String(p1.inviato_il).slice(0, 10)) + ", non ho ancora ricevuto il pagamento." : " e non ho ancora ricevuto il pagamento.") + "\n"
        + "Le chiedo di saldarla entro " + fpIl(entro) + (iban ? " con bonifico sull'IBAN " + iban : "") + ".\n"
        + "Dopo questa data sarò costretto a mandarle una richiesta formale, con gli interessi di ritardo previsti dalla legge.\n"
        + "Se ha una difficoltà, mi chiami: possiamo anche concordare un pagamento a rate.\n"
        + (firma || "");
    }
    /* n === 3: la diffida */
    const a = fpAzienda || {};
    const luogo = String(a.citta || "").trim();
    const indAz = [a.indirizzo, [a.cap, a.citta, a.prov ? "(" + a.prov + ")" : ""].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    const indCli = [f.cli_indirizzo, [f.cli_cap, f.cli_citta, f.cli_prov ? "(" + f.cli_prov + ")" : ""].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    const pecCli = f.cli_pec || f.cli.sdi_pec || "";
    const tot = f.importo + f.interessi + (f.b2b ? FP_SPESE_FISSE : 0);
    let t = "";
    t += (a.nome || "") + "\n" + (indAz ? indAz + "\n" : "") + (a.piva ? "P.IVA " + a.piva + "\n" : "") + (a.sdi_pec ? "PEC " + a.sdi_pec + "\n" : "");
    t += "\nSpett.le " + (f.cli.nome || f.cli_nome || "") + "\n" + (indCli ? indCli + "\n" : "") + (pecCli ? "PEC " + pecCli + "\n" : "");
    t += "\n" + (luogo ? luogo + ", " : "") + fdate(todayStr()) + "\n\n";
    t += "Oggetto: diffida ad adempiere e costituzione in mora — fattura n. " + num + " del " + fdate(f.data) + "\n\n";
    t += "La scrivente " + (a.nome || "") + " ricorda che la fattura n. " + num + " del " + fdate(f.data) + ", di " + imp
      + ", è scaduta " + fpIl(f.scadenza) + " e ad oggi non risulta pagata, nonostante i solleciti inviati.\n\n";
    t += "Con la presente Vi invita e diffida formalmente a pagare, entro 15 giorni dal ricevimento di questa lettera, la somma di " + imp + ", oltre a:\n";
    if (f.b2b) {
      t += "- interessi di mora ai sensi del D.Lgs. 231/2002, pari a " + eur(f.interessi) + " alla data odierna, che continuano a maturare fino al saldo;\n";
      t += "- " + eur(FP_SPESE_FISSE) + " per i costi di recupero, ai sensi dell'art. 6 del D.Lgs. 231/2002.\n";
    } else {
      t += "- interessi legali ai sensi dell'art. 1284 c.c., pari a " + eur(f.interessi) + " alla data odierna, che continuano a maturare fino al saldo.\n";
    }
    t += "\nTotale dovuto ad oggi: " + eur(tot) + ".\n\n";
    if (iban) t += "Il pagamento può essere fatto con bonifico sull'IBAN " + iban + ", intestato a " + (a.nome || "") + ".\n\n";
    t += "La presente vale come costituzione in mora ai sensi dell'art. 1219 del Codice Civile e come atto che interrompe la prescrizione ai sensi dell'art. 2943 c.c.\n\n";
    t += "In mancanza del pagamento entro il termine indicato, saremo costretti a procedere per vie legali per il recupero del credito, anche con ricorso per decreto ingiuntivo, con ogni ulteriore spesa a Vostro carico.\n\n";
    t += "Distinti saluti\n" + (a.nome || "");
    return t;
  }

  // ---------------------------------------------------------------------
  // LE FINESTRE
  // ---------------------------------------------------------------------
  function fpApri(id, n) {
    const f = fpCache.find(x => String(x.id) === String(id)); if (!f) return;
    n = +n || 1;
    if (n === 4) return fpGiudice(f);
    const testo = fpTesto(f, n);
    const tel = fpTel(f.cli.telefono), mail = String(f.cli.email || "").trim();
    const pecCli = f.cli_pec || f.cli.sdi_pec || "";
    const titolo = n === 3 ? "Lettera formale via PEC" : (n === 2 ? "Sollecito deciso" : "Promemoria gentile");
    const manca = [];
    if (!fpFirma()) manca.push("il nome della tua attività");
    if (!fpIban()) manca.push("il tuo IBAN");
    if (n === 3 && !String((fpAzienda || {}).piva || "").trim()) manca.push("la tua partita IVA");

    let corpo = `<div class="sh-b">
      <div class="sh-tit">${esc(f.cli.nome || f.cli_nome || "Cliente")} · ${eur(f.importo)} · fattura ${esc(fpNumFatt(f))}</div>
      ${manca.length ? `<div class="fp-cons giallo"><div>✏️</div><div><b>Manca qualcosa nei Dati azienda</b>Per una lettera completa aggiungi ${manca.join(", ")}. Intanto puoi scriverlo qui a mano.</div></div>` : ""}
      <div class="field"><label>Il testo (puoi cambiarlo come vuoi)</label>
        <textarea id="fp-testo" rows="${n === 3 ? 22 : 10}" style="font-size:14px;line-height:1.45">${esc(testo)}</textarea></div>`;
    if (n === 3) {
      corpo += `<div class="sh-nota">📌 <b>PEC del cliente:</b> ${pecCli ? esc(pecCli) : "non la conosco."}
        ${f.b2b ? ` Se è un'azienda o un professionista <b>ce l'ha per legge</b>: la trovi gratis su <a href="https://www.inipec.gov.it/cerca-pec" target="_blank" rel="noopener">INI-PEC</a>.` : " Se è un privato spesso non ce l'ha: in quel caso stampa la lettera e mandala con <b>raccomandata A/R</b>."}</div>
        <div class="sh-nota">Come si manda una PEC? <button class="fp-link" data-action="fp-come-pec">Te lo spiego in 6 passi</button></div>`;
    } else {
      corpo += `<div class="sh-nota">Premi WhatsApp o Email: si apre con il testo già scritto. Io segno la data, così fra ${FP_PASSI[n].attesa} giorni ti dico se è ora del passo dopo.</div>`;
    }
    corpo += `</div>`;

    let az = `<button class="btn b-cancel" data-action="close">Chiudi</button>
      <button class="btn" data-action="fp-copia">📋 Copia</button>`;
    if (n === 3) {
      az += `<button class="btn" data-action="fp-pdf" data-id="${f.id}">📄 Scarica PDF</button>
        <button class="btn-primary" data-action="fp-segna" data-id="${f.id}" data-v="3" data-c="pec">✓ L'ho mandata</button>`;
    } else {
      if (tel) az += `<button class="btn-primary" data-action="fp-manda" data-id="${f.id}" data-v="${n}" data-c="whatsapp">💬 WhatsApp</button>`;
      if (mail) az += `<button class="${tel ? "btn" : "btn-primary"}" data-action="fp-manda" data-id="${f.id}" data-v="${n}" data-c="email">✉️ Email</button>`;
      az += `<button class="btn" data-action="fp-segna" data-id="${f.id}" data-v="${n}" data-c="${tel || mail ? "altro" : "telefono"}">✓ ${tel || mail ? "Mandato in altro modo" : "Fatto (a voce / altro)"}</button>`;
    }
    openSheetGrande(titolo, corpo, az);
  }

  function fpComePec() {
    openSheetGrande("Come si manda una PEC", `<div class="sh-b"><ol class="fp-ol">
      <li><b>Ti serve la tua casella PEC.</b> Chi ha partita IVA ce l'ha per legge: la trovi nella visura camerale o la chiedi al commercialista. Se non ce l'hai, costa pochi euro l'anno (Aruba, Legalmail, Poste…).</li>
      <li><b>Trova la PEC del cliente.</b> Aziende e professionisti ce l'hanno per legge: la cerchi gratis su <a href="https://www.inipec.gov.it/cerca-pec" target="_blank" rel="noopener">INI-PEC</a> scrivendo la partita IVA o il codice fiscale.</li>
      <li><b>Scarica la lettera in PDF</b> con il pulsante «Scarica PDF».</li>
      <li><b>Entra nella tua PEC</b> (dal sito del gestore), scrivi un nuovo messaggio: destinatario la PEC del cliente, oggetto «Diffida ad adempiere – fattura n. …», allega il PDF e invia.</li>
      <li><b>Ti arrivano due ricevute</b>: «accettazione» e «consegna». Salvale: la ricevuta di consegna vale come una raccomandata con ricevuta di ritorno.</li>
      <li><b>Torna qui e premi «L'ho mandata»</b>: segno la data e fra 15 giorni ti dico cosa fare.</li>
      </ol><div class="sh-nota">Il cliente è un privato senza PEC? Stampa la lettera e mandala con <b>raccomandata A/R</b> dalla Posta: vale lo stesso.</div></div>`,
      `<button class="btn-primary" data-action="close">Ho capito</button>`);
  }

  function fpGiudice(f) {
    const tot = f.importo + f.interessi + (f.b2b ? FP_SPESE_FISSE : 0);
    const cu = fpContributo(f.importo);
    const gdp = f.importo <= FP_GDP_MAX;
    const solo = f.importo <= FP_DASOLO_MAX;
    const anni = f.data ? Math.floor(-(_giorniA(f.data) || 0) / 365) : 0;
    const corpo = `<div class="sh-b">
      <div class="sh-tit">${esc(f.cli.nome || f.cli_nome || "Cliente")} · ti deve ${eur(tot)}</div>
      ${f.passo < 3 ? `<div class="fp-cons giallo"><div>☝️</div><div><b>Prima la lettera formale</b>Non è obbligatoria, ma il giudice vede che hai provato con le buone e spesso basta la PEC per farsi pagare. <button class="fp-link" data-action="fp-apri" data-id="${f.id}" data-v="3">Preparala adesso</button></div></div>` : ""}
      <p><b>Cos'è il decreto ingiuntivo.</b> È un ordine del giudice che dice al cliente: «paga entro 40 giorni». Si chiede con la fattura in mano, <b>senza udienza</b> e senza che il cliente venga sentito. Se non paga e non si oppone, puoi pignorare (conto, stipendio, beni).</p>
      <table class="fp-tab">
        <tr><td>Chi lo decide</td><td><b>${gdp ? "Giudice di pace" : "Tribunale"}</b> ${gdp ? "(fino a " + eur(FP_GDP_MAX) + ")" : "(sopra " + eur(FP_GDP_MAX) + ")"}</td></tr>
        <tr><td>Serve l'avvocato?</td><td>${solo ? "<b>No, puoi farlo da solo</b> (fino a " + eur(FP_DASOLO_MAX) + " davanti al giudice di pace). Un avvocato però ti evita errori." : "<b>Sì</b>, sopra " + eur(FP_DASOLO_MAX) + " serve un avvocato."}</td></tr>
        <tr><td>Tasse per il giudice</td><td>${cu != null ? "<b>" + eur(cu + FP_MARCA) + "</b> (contributo unificato " + eur(cu) + " + marca " + eur(FP_MARCA) + ")" : "sopra 52.000 € chiedi all'avvocato"}</td></tr>
        <tr><td>Chi paga le spese</td><td>Se vinci, il giudice le mette <b>a carico del cliente</b> (anche l'avvocato), ma intanto le anticipi tu.</td></tr>
        <tr><td>Tempi</td><td>Di solito da qualche settimana a qualche mese, dipende dall'ufficio.</td></tr>
      </table>
      <div class="sh-nota">⏳ <b>Non aspettare troppo.</b> Un credito si prescrive in 10 anni, ma per i professionisti in 3 anni (prescrizione «presuntiva»). La PEC formale ferma l'orologio.${anni >= 2 ? " <b>Questa fattura ha già " + anni + " anni: muoviti.</b>" : ""}</div>
      <div class="sh-nota">⚠️ L'IVA di una fattura non pagata l'hai già versata. Si recupera solo dopo una procedura (fallimento, pignoramento andato a vuoto): chiedi al commercialista quando è il momento.</div>
      <p class="fp-stima">Sono informazioni generali, non un parere legale. Per decidere senti un avvocato: porta la fattura, la PEC e le ricevute.</p>
    </div>`;
    openSheetGrande("La strada del giudice", corpo,
      `<button class="btn b-cancel" data-action="close">Chiudi</button>
       <button class="btn-primary" data-action="fp-segna" data-id="${f.id}" data-v="4" data-c="giudice">✓ Ho avviato la pratica</button>`);
  }

  function fpPagatoForm(id) {
    const f = fpCache.find(x => String(x.id) === String(id)); if (!f) return;
    openSheetGrande("Ha pagato", `<div class="sh-b">
      <div class="sh-tit">${esc(f.cli.nome || f.cli_nome || "Cliente")} · fattura ${esc(fpNumFatt(f))} · ${eur(f.importo)}</div>
      <div class="field"><label>Quando hai ricevuto i soldi</label><input id="fp-data-pag" type="date" value="${todayStr()}" max="${todayStr()}"></div>
      <div class="sh-nota">La fattura diventa <b>pagata</b> anche nella sezione Fatture e nei lavori collegati.</div></div>`,
      `<button class="btn b-cancel" data-action="close">Annulla</button>
       <button class="btn-primary" data-action="fp-pagato-ok" data-id="${f.id}">✓ Segna pagata</button>`);
  }

  // ---------------------------------------------------------------------
  // LE SCRITTURE — ognuna si verifica con .select("id") (regola 5)
  // ---------------------------------------------------------------------
  function fpErrore(q, cosa) {
    const m = (q && q.error && q.error.message) || "nessuna riga scritta";
    toast(cosa + ": " + (typeof traduciErrore === "function" ? traduciErrore(m) : m));
  }

  async function fpSegna(id, passo, canale, testo) {
    if (!sbUid) { toast("Devi essere loggato"); return false; }
    const q = await sb.from("gest_solleciti").insert({
      user_id: sbUid, fattura_id: id, passo: +passo, canale: canale,
      testo: testo != null ? String(testo).slice(0, 20000) : null
    }).select("id");
    if (q.error || !q.data || !q.data.length) { fpErrore(q, "Non segnato"); return false; }
    return true;
  }

  async function fpManda(id, passo, canale) {
    const f = fpCache.find(x => String(x.id) === String(id)); if (!f) return;
    const el = $("#fp-testo"); const testo = el ? el.value : fpTesto(f, +passo);
    /* il link si apre SUBITO, dentro il clic: se aspettassi il database il
       telefono bloccherebbe la finestra nuova come pubblicita' */
    if (canale === "whatsapp") {
      window.open("https://wa.me/" + fpTel(f.cli.telefono) + "?text=" + encodeURIComponent(testo), "_blank", "noopener");
    } else {
      const ogg = (+passo === 2 ? "Sollecito di pagamento" : "Promemoria") + " fattura n. " + fpNumFatt(f);
      location.href = "mailto:" + encodeURIComponent(String(f.cli.email || "").trim()) + "?subject=" + encodeURIComponent(ogg) + "&body=" + encodeURIComponent(testo);
    }
    if (await fpSegna(id, passo, canale, testo)) {
      closeSheet(); toast("Segnato ✔ Ti dico io quando è ora del passo dopo"); renderFisco();
    }
  }

  async function fpTogliUltimo(id) {
    const f = fpCache.find(x => String(x.id) === String(id)); if (!f || !f.sol.length) return;
    const u = f.sol[f.sol.length - 1];
    const q = await sb.from("gest_solleciti").update({ eliminato_il: new Date().toISOString() })
      .eq("id", u.id).eq("user_id", sbUid).select("id");
    if (q.error || !q.data || !q.data.length) { fpErrore(q, "Non tolto"); return; }
    toast("Tolto l'ultimo passo"); renderFisco();
  }

  async function fpPagato(id) {
    const d = ($("#fp-data-pag") || {}).value || todayStr();
    if (d > todayStr()) { toast("La data non può essere nel futuro"); return; }
    const q = await sb.from("gest_fatture").update({ stato: "pagata", data_pagata: d })
      .eq("id", id).eq("user_id", sbUid).select("id");
    if (q.error || !q.data || !q.data.length) { fpErrore(q, "Non salvata"); return; }
    /* come fattCambiaStato: anche i lavori dentro la fattura diventano pagati */
    try {
      const { data: fl } = await sb.from("gest_fattura_lavori").select("lavoro_id").eq("user_id", sbUid).eq("fattura_id", id);
      const ids = (fl || []).map(x => x.lavoro_id);
      if (ids.length) {
        const r = await sb.from("gest_lavori").update({ fatt_stato: "pagata" }).in("id", ids).eq("user_id", sbUid).select("id");
        if (r.error) toast("Attenzione: i lavori collegati alla fattura non si sono aggiornati");
      }
    } catch (e) { toast("Attenzione: i lavori collegati alla fattura non si sono aggiornati"); }
    closeSheet();
    toast("Pagata ✔ Bravo, uno in meno!");
    if (typeof rinfresca === "function") rinfresca("fatture", "riepilogo", "lavori");
    renderFisco();
  }

  async function fpPdf(id) {
    const f = fpCache.find(x => String(x.id) === String(id)); if (!f) return;
    const el = $("#fp-testo"); const testo = el ? el.value : fpTesto(f, 3);
    if (typeof caricaJsPDF === "function" && !(await caricaJsPDF())) { toast("Il PDF non si è caricato: controlla la connessione"); return; }
    const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: "mm", format: "a4" });
    const M = 22, W = 210 - 2 * M;
    let y = 24;
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    String(testo).split("\n").forEach(riga => {
      const pezzi = riga.trim() === "" ? [""] : doc.splitTextToSize(riga, W);
      pezzi.forEach(p => {
        if (y > 297 - 20) { doc.addPage(); y = 24; }
        const ogg = /^Oggetto:/.test(p);
        if (ogg) doc.setFont("helvetica", "bold");
        doc.text(p, M, y);
        if (ogg) doc.setFont("helvetica", "normal");
        y += p === "" ? 3.5 : 5.4;
      });
    });
    doc.save("diffida-fattura-" + String(fpNumFatt(f)).replace(/\//g, "-") + "-" + String(f.cli.nome || f.cli_nome || "cliente").replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40) + ".pdf");
  }

  // ---------------------------------------------------------------------
  // I CLIC — ascoltatore suo, come gest-promemoria.js
  // ---------------------------------------------------------------------
  document.addEventListener("click", function (e) {
    const t = e.target && e.target.closest ? e.target.closest("[data-action]") : null;
    if (!t) return;
    const a = t.dataset.action, id = t.dataset.id;
    if (a.indexOf("fp-") !== 0) return;
    if (a === "fp-sez")       { fpSezione = t.dataset.v; renderFisco(); return; }
    if (a === "fp-apri")      { fpApri(id, t.dataset.v); return; }
    if (a === "fp-come-pec")  { fpComePec(); return; }
    if (a === "fp-manda")     { fpManda(id, t.dataset.v, t.dataset.c); return; }
    if (a === "fp-segna")     {
      const el = $("#fp-testo");
      fpSegna(id, t.dataset.v, t.dataset.c, el ? el.value : null).then(ok => {
        if (ok) { closeSheet(); toast("Segnato ✔"); renderFisco(); }
      });
      return;
    }
    if (a === "fp-copia")     {
      const el = $("#fp-testo"); if (!el) return;
      (navigator.clipboard ? navigator.clipboard.writeText(el.value) : Promise.reject())
        .then(() => toast("Copiato ✔ Ora incollalo dove vuoi"))
        .catch(() => { el.select(); try { document.execCommand("copy"); toast("Copiato ✔"); } catch (_) { toast("Selezionalo e copialo a mano"); } });
      return;
    }
    if (a === "fp-pdf")       { fpPdf(id); return; }
    if (a === "fp-togli")     { fpTogliUltimo(id); return; }
    if (a === "fp-pagato")    { fpPagatoForm(id); return; }
    if (a === "fp-pagato-ok") { fpPagato(id); return; }
  });
