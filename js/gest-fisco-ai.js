/* ═══ TASSE E FISCO — TAPPA 4: «CHIEDI ALL'AI» ════════════════════════════
   27 settembre 2026.

   A CHE SERVE
   Le domande che uno si vergogna di fare al commercialista, con risposte
   semplici che usano i SUOI numeri (profilo fiscale, incassato, stima,
   fatture aperte). E la foto di una lettera del Fisco / INPS / Riscossione
   spiegata in parole semplici: chi la manda, quanto, entro quando, cosa fare.

   DOVE STA L'AI
   Edge Function Supabase «ai-cantiere» (supabase/functions/ai-cantiere),
   feature `domanda_fisco` e `spiega_lettera`: stesse regole 2026 verificate
   (costante REGOLE), 1 credito AI a domanda, stessi crediti del resto.
   Da qui si chiama con window.AI.cantiere (js/ai-integrazione.js).

   ⛔ L'AI NON VEDE IL DATABASE: il contesto lo costruisce fiContesto() con
      i conti gia' fatti da gest-fisco-tasse.js / gest-fisco-vivere.js e lo
      manda dentro il testo. Niente nomi di clienti, niente email.
   ⛔ Come la Chat con AI (decisione di Alessio del 29 agosto): niente
      benvenuto, niente domande di esempio, niente spiegazioni addosso.
      La conversazione e la casella per scrivere.
   ⛔ La conversazione vive solo in memoria (fiStoria): chiudendo la pagina
      si perde. Alle AI arrivano le ultime 3 domande e risposte.

   Vive nello spazio della pagina (niente IIFE, al primo livello solo
   dichiarazioni). La chiama renderFisco(): fiscoAI(box, mio).
   ═════════════════════════════════════════════════════════════════════════ */

  let fiStoria = [];          /* [{chi:"io"|"ai", testo, lettera?}] */
  let fiCtx = "";             /* il contesto dei numeri, rifatto a ogni apertura */
  let fiOccupato = false;

  async function fiContesto() {
    try {
      const d = await fvCarica();
      const p = d.profiloVero || ftIndovina(d.az);
      const Y = ftAnno();
      let inc = 0;
      d.fatture.forEach(f => { if (f.stato === "pagata" && String(f.data_pagata || "").slice(0, 4) === String(Y)) inc += +(d.tot[f.id] || {}).imponibile || 0; });
      const aperte = d.fatture.filter(f => f.stato === "emessa");
      const daIncassare = aperte.reduce((s, f) => s + (+(d.tot[f.id] || {}).totale || 0), 0);
      const sp = fvSpese(d);
      const righe = [];
      if (p) {
        righe.push("Attività: " + ftEtich(FT_FORME, p.forma).split(" (")[0] + "; regime " + p.regime
          + (p.regime === "forfettario" ? " (coefficiente " + (p.coeff || "?") + "%, imposta " + (p.aliquota_5 ? 5 : 15) + "%" + (p.riduzione35 ? ", con riduzione INPS 35%" : "") + ")" : "")
          + "; contributi: " + ftEtich(FT_CASSE, p.cassa) + (p.anno_inizio ? "; partita IVA dal " + p.anno_inizio : "")
          + (d.profiloVero ? "" : " (profilo indovinato, non confermato)"));
        if (p.perc_commercialista) righe.push("Il commercialista gli ha detto di mettere da parte il " + p.perc_commercialista + "%.");
        const inps = p.cassa === "artigiani" || p.cassa === "commercianti";
        if (p.regime === "forfettario") {
          righe.push("È in regime forfettario: NON versa IVA (le sue fatture sono senza IVA), NON paga IRPEF né addizionali: paga l'imposta sostitutiva e i contributi.");
          if (inps) righe.push("Riduzione INPS del 35%: " + (p.riduzione35 ? "ATTIVA (i numeri qui sotto sono già ridotti)." : "NON attiva (non l'ha chiesta: i numeri qui sotto sono pieni)."));
        }
        const pr = ftProiezione(inc);
        const st = ftStima(p, pr.val);
        if (st.totale != null && st.calcolabile) {
          righe.push((pr.doy >= 60 ? "Incassato previsto a fine " + Y + " (se continua così): " + eur(pr.val) + ". " : "")
            + "Stima tasse e contributi dell'anno intero: " + eur(st.totale) + " (contributi " + eur(st.contrib.tot) + ", di cui fissi " + eur(st.contrib.fissi || 0) + "; " + st.cosa + " " + eur(st.imposta) + ").");
          if (pr.val > 0) righe.push("Il gestionale gli consiglia di mettere da parte " + Math.ceil(st.totale / pr.val * 100) + " € ogni 100 € incassati.");
          const sc = ftScadenze(p, st, { ivaQ3: null, ivaMese: null });
          if (sc.length) righe.push("Prossime scadenze calcolate dal gestionale (usa QUESTE date e cifre):\n" + sc.map(s => "- " + s.d.split("-").reverse().join("/") + ": " + s.cosa + (s.imp > 0 ? ", circa " + eur(s.imp) : "")).join("\n"));
        }
        if (st.calcolabile && p.regime === "forfettario" && !p.riduzione35 && inps)
          righe.push("Con la riduzione INPS del 35% i contributi dell'anno sarebbero circa " + eur(st.contrib.tot * 0.65) + " (risparmio circa " + eur(st.contrib.tot * 0.35) + ").");
      } else {
        righe.push("Profilo fiscale: non compilato (non sappiamo il regime).");
      }
      righe.push("Incassato nel " + Y + " finora (fatture pagate, senza IVA): " + eur(inc) + ".");
      righe.push("Spese segnate nel gestionale nel " + Y + ": " + eur(sp.tot) + ".");
      righe.push("Fatture emesse non ancora pagate: " + aperte.length + " per " + eur(daIncassare) + ".");
      /* il dettaglio di chi deve pagare, con i passi GIA' fatti: senza,
         l'AI consigliava di mandare la PEC a chi l'aveva gia' ricevuta */
      if (typeof fpCaricaAperte === "function") {
        const L = await fpCaricaAperte();
        const NOMI = ["", "promemoria gentile", "sollecito deciso", "lettera formale PEC (messa in mora)", "giudice"];
        const sc = (L.lista || []).slice().sort((a, b) => b.ritardo - a.ritardo);
        if (sc.length) righe.push("Dettaglio delle fatture da incassare (usa QUESTI dati, sono gia' calcolati):\n" + sc.map(f => {
          const fatti = f.sol.map(s => NOMI[+s.passo] + " il " + fdate(String(s.inviato_il).slice(0, 10)));
          return "- " + (f.cli_nome || (f.cli && f.cli.nome) || "cliente") + " (" + (f.b2b ? "azienda" : "privato") + "), fattura " + fpNumFatt(f) + " di " + eur(f.importo)
            + (f.ritardo > 0 ? ", scaduta da " + f.ritardo + " giorni" : ", scade il " + fdate(f.scadenza))
            + ". Gia' fatto: " + (fatti.length ? fatti.join(", ") : "niente")
            + (f.ritardo > 0 ? ". Interessi maturati: " + eur(f.interessi) + (f.b2b ? " (mora fra aziende) piu' " + eur(FP_SPESE_FISSE) + " di indennizzo fisso" : " (interesse legale)") : "")
            + (f.passo >= 3 ? (() => { const cu = fpContributo(f.importo);
                return ". Decreto ingiuntivo: " + (f.importo <= FP_GDP_MAX ? "giudice di pace" : "tribunale")
                  + (cu != null ? ", tasse per il giudice " + eur(cu + FP_MARCA) + " (contributo unificato " + eur(cu) + " + marca " + eur(FP_MARCA) + ")" : "")
                  + (f.importo > 1100 ? ", serve l'avvocato (sopra 1.100 euro)" : ", si puo' fare da soli"); })() : "")
            + ". Prossimo passo consigliato dal gestionale: " + f.cons.testo;
        }).join("\n"));
      }
      if (+d.az.tariffa_oraria) righe.push("Tariffa oraria: " + eur(+d.az.tariffa_oraria) + ".");
      return righe.join("\n");
    } catch (e) { return "Numeri dell'utente: non disponibili."; }
  }

  // ---------------------------------------------------------------------
  // LA SEZIONE
  // ---------------------------------------------------------------------
  async function fiscoAI(box, mio) {
    const vecchio = () => mio != null && typeof fpGiro !== "undefined" && mio !== fpGiro;
    box.innerHTML = `<div class="fi-chat">
        <div class="fi-msgs" id="fi-msgs"></div>
        <div class="fi-barra">
          <textarea id="fi-in" rows="2" placeholder="Scrivi la tua domanda su tasse, contributi, fatture…"></textarea>
          <div class="fi-tasti">
            <button class="btn fi-svuota" data-action="fi-svuota" id="fi-svuota" title="Cancella la conversazione" hidden>🗑 Cancella</button>
            <button class="btn" data-action="fi-lettera" title="Fotografa una lettera del Fisco, dell'INPS o della Riscossione">📷 Lettera</button>
            <button class="btn aic-mic" id="fi-mic" hidden></button>
            <button class="btn-primary" data-action="fi-manda">Chiedi</button>
          </div>
          <input type="file" id="fi-file" accept="image/*,application/pdf" hidden>
          <div class="aic-st" id="fi-st"></div>
        </div>
        <p class="fp-stima">Risposte generali con le regole 2026. Prima di decidere, senti il commercialista. 1 credito AI a domanda.</p>
      </div>`;
    fiDisegna();
    if (typeof aiMicrofono === "function") { try { aiMicrofono($("#fi-mic"), $("#fi-in"), $("#fi-st")); } catch (e) {} }
    if (!sb || !sbUid) return;
    const c = await fiContesto();
    if (vecchio()) return;
    fiCtx = c;
  }

  function fiDisegna() {
    const m = $("#fi-msgs"); if (!m) return;
    m.innerHTML = fiStoria.map(x => {
      if (x.lettera) return `<div class="fi-msg ai">${fiLetteraHtml(x.lettera)}</div>`;
      return `<div class="fi-msg ${x.chi}">${esc(x.testo).replace(/\n/g, "<br>")}</div>`;
    }).join("") + (fiOccupato ? `<div class="fi-msg ai fi-pensa">Sto pensando…</div>` : "");
    m.scrollTop = m.scrollHeight;
    const c = $("#fi-svuota"); if (c) c.hidden = !fiStoria.length || fiOccupato;
  }

  function fiGiro() {
    if (!window.TI_GIRO) return false;
    const st = $("#fi-st");
    if (st) { st.className = "aic-st aic-st--err"; st.textContent = "Nel giro di prova l'AI non risponde. Per provarla col tuo lavoro, provalo gratis 30 giorni."; }
    return true;
  }

  async function fiManda() {
    const ta = $("#fi-in"); if (!ta || fiOccupato) return;
    const q = ta.value.trim();
    if (q.length < 3) { ta.focus(); return; }
    if (fiGiro()) return;
    if (!window.AI || typeof window.AI.cantiere !== "function") { toast("L'assistente non si è caricato: ricarica la pagina (F5)"); return; }
    fiStoria.push({ chi: "io", testo: q }); ta.value = "";
    fiOccupato = true; fiDisegna();
    const prima = fiStoria.slice(0, -1).filter(x => !x.lettera).slice(-6)
      .map(x => (x.chi === "io" ? "Domanda: " : "Risposta: ") + x.testo).join("\n");
    const lettera = fiStoria.slice().reverse().find(x => x.lettera);
    /* la domanda non si taglia MAI: se il testo e' troppo lungo si accorcia
       la conversazione di prima, poi i numeri */
    let coda = "\nLA MIA DOMANDA:\n" + q.slice(0, 1500);
    let testo = "";
    if (lettera) testo += "\nLETTERA CHE HO FOTOGRAFATO: " + [lettera.lettera.chi, lettera.lettera.cosa, lettera.lettera.in_breve,
      lettera.lettera.importo != null ? "importo " + lettera.lettera.importo + " euro" : "", lettera.lettera.scadenza ? "scadenza " + lettera.lettera.scadenza : ""].filter(Boolean).join(" · ") + "\n";
    if (prima) testo += "\nCONVERSAZIONE DI PRIMA:\n" + prima.slice(-2500) + "\n";
    const numeri = "I MIEI NUMERI (dal gestionale):\n" + (fiCtx || "non disponibili") + "\n";
    testo = numeri.slice(0, Math.max(500, 7900 - testo.length - coda.length)) + testo + coda;
    let r = null;
    try { r = await window.AI.cantiere("domanda_fisco", testo.slice(-7950), null, false); }
    catch (e) { fiStoria.push({ chi: "ai", testo: (e && e.message) || "Non ci sono riuscito. Riprova fra un attimo." }); }
    fiOccupato = false;
    if (r) fiStoria.push({ chi: "ai", testo: r });
    else if (r === null) fiStoria.pop();   /* crediti finiti: la finestra l'ha mostrata l'AI, la domanda torna nella casella */
    if (r === null && ta) ta.value = q;
    fiDisegna();
  }

  // ---------------------------------------------------------------------
  // LA LETTERA
  // ---------------------------------------------------------------------
  async function fiLettera(file) {
    const st = $("#fi-st");
    const scrivi = (t, tipo) => { if (st) { st.className = "aic-st" + (tipo ? " aic-st--" + tipo : ""); st.textContent = t || ""; } };
    if (!file) return;
    if (fiGiro()) return;
    if (!window.AI || typeof window.AI.cantiere !== "function" || typeof _aicBase64 !== "function") { toast("L'assistente non si è caricato: ricarica la pagina (F5)"); return; }
    let blob = file, tipo = file.type || "";
    if (tipo !== "application/pdf") {
      const p = typeof preparaFileUpload === "function" ? await preparaFileUpload(file, { lato: 1800, qualita: 0.85 }) : { file: file };
      if (p.errore) { scrivi(p.errore, "err"); return; }
      blob = p.file;
      tipo = (p.compressa || !file.type) ? "image/jpeg" : file.type;
      if (["image/jpeg", "image/png", "image/webp"].indexOf(tipo) < 0) {
        if (/heic|heif/i.test(file.type || file.name || "")) { scrivi("Questa foto è in un formato che non riesco a leggere (HEIC). Fai una foto nuova dal pulsante, o uno screenshot.", "err"); return; }
        tipo = "image/jpeg";
      }
    }
    if (blob.size > 5 * 1024 * 1024) { scrivi("Il file è troppo grande: massimo 5 MB. Fotografa solo la prima pagina.", "err"); return; }
    fiOccupato = true; fiStoria.push({ chi: "io", testo: "📷 Ti mando la foto di una lettera" }); fiDisegna(); scrivi("");
    let d = null;
    try {
      const dati = await _aicBase64(blob);
      d = await window.AI.cantiere("spiega_lettera", "Spiegami questa lettera in parole semplici.", { tipo: tipo, dati: dati }, true);
    } catch (e) { fiStoria.push({ chi: "ai", testo: (e && e.message) || "Non ci sono riuscito. Riprova fra un attimo." }); }
    fiOccupato = false;
    if (d && d.leggibile === false) fiStoria.push({ chi: "ai", testo: "Non riesco a leggerla: la foto è sfocata o non è una lettera. Rifalla dritta, con più luce, e che si veda tutta la prima pagina." });
    else if (d) fiStoria.push({ chi: "ai", lettera: d });
    else if (d === null) fiStoria.pop();
    fiDisegna();
  }

  function fiLetteraHtml(d) {
    const urg = d.urgenza === "alta" ? ["rosso", "Urgente"] : d.urgenza === "bassa" ? ["verde", "Non urgente"] : ["giallo", "Da sistemare"];
    let sc = "";
    if (d.scadenza && /^\d{4}-\d{2}-\d{2}$/.test(d.scadenza)) {
      const g = _giorniA(d.scadenza);
      sc = `<div class="fi-l-riga"><span>Entro</span><b>${fdate(d.scadenza)} ${g != null ? (g < 0 ? "· già passata da " + (-g) + " giorni" : g === 0 ? "· oggi" : "· fra " + g + " giorni") : ""}</b></div>`;
    }
    const fare = Array.isArray(d.cosa_fare) ? d.cosa_fare.filter(Boolean).slice(0, 6) : [];
    return `<div class="fi-lettera"><div class="fi-l-testa"><div><b>${esc(d.cosa || "Lettera")}</b><span>${esc(d.chi || "")}</span></div><span class="fi-urg ${urg[0]}">${urg[1]}</span></div>
      ${d.in_breve ? `<p>${esc(d.in_breve)}</p>` : ""}
      ${d.importo != null && isFinite(+d.importo) ? `<div class="fi-l-riga"><span>Importo</span><b>${eur(+d.importo)}</b></div>` : ""}
      ${sc}
      ${fare.length ? `<div class="fi-l-tit">Cosa fare</div><ol>${fare.map(x => `<li>${esc(x)}</li>`).join("")}</ol>` : ""}
      ${d.rate ? `<div class="fp-cons verde"><div>💳</div><div><b>Si può pagare a rate</b>${esc(d.rate)}</div></div>` : ""}
      ${d.attenzione ? `<div class="fp-cons rosso"><div>⚠️</div><div><b>Attenzione</b>${esc(d.attenzione)}</div></div>` : ""}
      <div class="fp-btns">${d.scadenza && /^\d{4}-\d{2}-\d{2}$/.test(d.scadenza) && d.scadenza >= todayStr() ? `<button class="btn" data-action="ft-ricorda" data-d="${esc(d.scadenza)}" data-t="${esc((d.cosa || "Lettera") + (d.chi ? " — " + d.chi : ""))}" data-i="${d.importo != null && isFinite(+d.importo) ? +d.importo : ""}">🔔 Ricordamelo</button>` : ""}</div>
      <p class="fp-stima">Letta dall'AI: controlla importo e date sulla lettera. Se ti sembra sbagliata, portala subito al commercialista.</p></div>`;
  }

  document.addEventListener("click", function (e) {
    const t = e.target && e.target.closest ? e.target.closest("[data-action]") : null;
    if (!t) return;
    const a = t.dataset.action;
    if (a === "fi-manda")   { fiManda(); return; }
    if (a === "fi-svuota")  { if (fiOccupato) return; fiStoria = []; fiDisegna(); const t = $("#fi-in"); if (t) t.focus(); return; }
    if (a === "fi-lettera") { if (fiGiro()) return; const f = $("#fi-file"); if (f) { f.value = ""; f.click(); } return; }
  });
  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "fi-file" && e.target.files && e.target.files[0]) fiLettera(e.target.files[0]);
  });
  document.addEventListener("keydown", function (e) {
    if (e.target && e.target.id === "fi-in" && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); fiManda(); }
  });
