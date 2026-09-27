/* ═══ TASSE E FISCO — TAPPA 3: «SOPRAVVIVERE» ════════════════════════════
   27 settembre 2026.

   A CHE SERVE
   Detto da Alessio: «salvarli da tasse e clienti e sopravvivere».
   Quattro cose, tutte con i numeri che il gestionale ha gia':
     1. QUANTO TI RESTA IN TASCA quest'anno: incassato − spese segnate −
        tasse e contributi stimati. E «su 100 € incassati te ne restano X».
     2. I PROSSIMI 3 MESI: soldi che devono entrare (fatture non pagate) e
        soldi che devono uscire (fornitori + tasse), mese per mese. Se un
        mese va sotto, lo dice PRIMA.
     3. IL PREZZO GIUSTO: quanto vuoi in tasca al mese + spese fisse →
        quanto devi chiedere al giorno e all'ora per starci dentro. Con
        «usala come mia tariffa» (gest_azienda.tariffa_oraria, la stessa
        che usa la parcella a ore).
     4. LA CARTELLA PER IL COMMERCIALISTA: un PDF con l'anno in un foglio.

   ⛔ LE SPESE SONO LE STESSE CHE CONTA IL RIEPILOGO (js/gest-riepilogo.js):
      spese dei lavori, spese con le carte, pieni pagati in contanti (quelli
      con la carta sono gia' nei movimenti), fatture dei fornitori. Qui pero'
      di TUTTI i reparti e dell'anno intero. Se il Riepilogo un giorno conta
      una fonte in piu', va aggiunta anche qui (fvSpese).
   ⛔ I conti di tasse e scadenze NON sono rifatti: si usano ftStima,
      ftScadenze e ftIndovina di js/gest-fisco-tasse.js (stesso spazio).

   Vive nello spazio della pagina (niente IIFE, al primo livello solo
   dichiarazioni). La chiama renderFisco(): fiscoVivere(box, mio).
   ═════════════════════════════════════════════════════════════════════════ */

  let fvDati = null;
  const FV_MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

  function fvIsoPiu(giorni) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + giorni);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  /* le spese dell'anno, le stesse fonti del Riepilogo, di tutti i reparti */
  function fvSpese(d) {
    const Y = String(ftAnno());
    const nel = x => String(x || "").slice(0, 4) === Y;
    const lav = (d.spese || []).filter(x => nel(x.data)).reduce((s, x) => s + (+x.importo || 0), 0);
    const carte = (d.carte || []).filter(m => m.tipo === "spesa" && nel(m.data || String(m.created_at || "").slice(0, 10))).reduce((s, m) => s + (+m.importo || 0), 0);
    const rif = (d.rif || []).filter(r => !r.movimento_id && nel(r.data)).reduce((s, r) => s + (+r.importo || 0), 0);
    const forn = (d.fornF || []).filter(f => nel(f.data)).reduce((s, f) => s + (+f.importo || 0), 0);
    return { lav, carte, rif, forn, tot: lav + carte + rif + forn };
  }

  async function fvCarica() {
    const Y = ftAnno();
    const da = Y + "-01-01";
    const [rP, rA, rF, rS, rC, rR, rFF] = await Promise.all([
      sb.from("gest_fisco_profilo").select("*").eq("user_id", sbUid).maybeSingle(),
      sb.from("gest_azienda").select("*").eq("user_id", sbUid).maybeSingle(),
      sb.from("gest_fatture").select("id,numero,anno,data,stato,data_pagata,cli_nome").eq("user_id", sbUid)
        .in("stato", ["emessa", "pagata"]).is("eliminato_il", null).gte("data", (Y - 1) + "-01-01"),
      sb.from("gest_spese").select("importo,data").eq("user_id", sbUid).gte("data", da),
      sb.from("gest_carte_movimenti").select("tipo,importo,data,created_at").eq("user_id", sbUid).gte("created_at", da),
      sb.from("gest_rifornimenti").select("importo,data,movimento_id").eq("user_id", sbUid).gte("data", da),
      sb.from("gest_fatture_fornitori").select("importo,data,scadenza,stato,numero").eq("user_id", sbUid).gte("data", (Y - 1) + "-01-01")
    ]);
    const ff = rF.data || [];
    const ids = ff.map(f => f.id);
    const rT = ids.length ? await sb.from("gest_fatture_totali").select("fattura_id,imponibile,iva,totale,segno").in("fattura_id", ids) : { data: [] };
    const tot = {}; (rT.data || []).forEach(t => { tot[t.fattura_id] = t; });
    const errore = [rF, rS, rC, rR, rFF, rT].some(r => r && r.error);
    return {
      profiloVero: rP.data || null, az: rA.data || {}, fatture: ff, tot,
      spese: rS.data || [], carte: rC.data || [], rif: rR.data || [], fornF: rFF.data || [], errore
    };
  }

  // ---------------------------------------------------------------------
  // LA SEZIONE
  // ---------------------------------------------------------------------
  async function fiscoVivere(box, mio) {
    const vecchio = () => mio != null && typeof fpGiro !== "undefined" && mio !== fpGiro;
    if (!sb || !sbUid) { box.innerHTML = tabVuoto("Sopravvivere", "Accedi per vedere i tuoi conti."); return; }
    box.innerHTML = '<div class="fp-carica">Sto facendo i conti…</div>';
    const d = await fvCarica();
    if (vecchio()) return;
    fvDati = d;
    const p = d.profiloVero || ftIndovina(d.az);
    d.p = p;
    const Y = ftAnno(), oggi = todayStr();
    const gg = (+d.az.giorni_pagamento) || 30;

    /* incassato quest'anno */
    let incassi = 0;
    const perMese = Array(12).fill(0);
    d.fatture.forEach(f => {
      if (f.stato === "pagata" && String(f.data_pagata || "").slice(0, 4) === String(Y)) {
        const v = +(d.tot[f.id] || {}).imponibile || 0;
        incassi += v; perMese[+f.data_pagata.slice(5, 7) - 1] += v;
      }
    });
    d.incassi = incassi; d.perMese = perMese;
    const sp = fvSpese(d); d.sp = sp;
    const st = p ? ftStima(p, incassi) : null; d.st = st;
    const inizio = new Date(Y, 0, 1), oggiD = new Date(); oggiD.setHours(0, 0, 0, 0);
    const mesi = Math.max(1, (Math.round((oggiD - inizio) / 86400000) + 1) / 30.42);

    let h = "";
    if (d.errore) h += `<div class="fp-cons giallo"><div>⚠️</div><div><b>Alcuni dati non si sono letti</b>I numeri qui sotto potrebbero essere incompleti. Ricarica la pagina.</div></div>`;

    /* 1. QUANTO TI RESTA */
    const tasse = st && st.totale != null ? st.totale : null;
    const resta = tasse != null ? incassi - sp.tot - tasse : null;
    h += `<h3 class="fp-h3">Quanto ti resta in tasca nel ${Y}</h3><div class="fv-conto">
      <div class="fv-riga"><span>Hai incassato</span><b>${eur(incassi)}</b></div>
      <div class="fv-riga meno"><span>Spese segnate nel gestionale</span><b>− ${eur(sp.tot)}</b></div>
      <div class="fv-riga meno"><span>Tasse e contributi (stima)</span><b>${tasse != null ? "− " + eur(tasse) : "chiedi al commercialista"}</b></div>
      <div class="fv-riga tot"><span>Ti resta</span><b class="${resta != null && resta < 0 ? "fp-rosso" : "fp-verde"}">${resta != null ? eur(resta) : "—"}</b></div>
      ${resta != null ? `<div class="fv-sotto">Cioè circa <b>${eur(resta / mesi)}</b> al mese${incassi > 0 ? ` · su ogni 100 € incassati te ne restano <b>${Math.round(resta / incassi * 100)} €</b>` : ""}.</div>` : ""}
    </div>`;
    if (!p) {
      h += `<div class="fp-cons giallo"><div>✏️</div><div><b>Manca il tuo profilo fiscale</b>Senza non posso stimare le tasse. <button class="fp-link" data-action="ft-profilo">Compilalo adesso</button> (6 domande).</div></div>`;
    }
    if (sp.tot === 0 && incassi > 0) {
      h += `<div class="fp-cons giallo"><div>🧾</div><div><b>Non hai segnato nessuna spesa quest'anno</b>Materiali, gasolio, fatture dei fornitori: se non li segni nel gestionale, qui sembra che ti resti più di quello che hai davvero.</div></div>`;
    }
    if (resta != null && resta < 0) {
      h += `<div class="fp-cons rosso"><div>🆘</div><div><b>Quest'anno stai lavorando in perdita</b>Spese e tasse superano quello che incassi. Guarda qui sotto «Il prezzo giusto»: probabilmente chiedi troppo poco.</div></div>`;
    }

    /* 2. I PROSSIMI 3 MESI */
    h += fvProssimi(d, p, gg);

    /* 3. IL PREZZO GIUSTO */
    h += `<h3 class="fp-h3">Il prezzo giusto</h3>
      <div class="fp-card fv-pg"><p class="fp-sotto" style="margin-top:0">Dimmi quanto vuoi portare a casa: ti dico quanto devi chiedere al giorno e all'ora per starci dentro, tasse comprese.</p>
      <div class="fv-pg-campi">
        <div class="field"><label>Quanto vuoi in tasca al mese</label><input id="fv-netto" type="number" min="0" step="50" value="${esc(String((p && p.pg_netto_mese) || ""))}" placeholder="Es. 2000"></div>
        <div class="field"><label>Spese fisse al mese (furgone, assicurazione, telefono, commercialista…)</label><input id="fv-fisse" type="number" min="0" step="50" value="${esc(String((p && p.pg_spese_mese) || ""))}" placeholder="Es. 700"></div>
        <div class="field"><label>Mesi di lavoro in un anno</label><input id="fv-mesi" type="number" min="1" max="12" step="0.5" value="${esc(String((p && p.pg_mesi) || 11))}"></div>
        <div class="field"><label>Giorni di lavoro al mese</label><input id="fv-giorni" type="number" min="1" max="31" value="${esc(String((p && p.pg_giorni) || 20))}"></div>
        <div class="field"><label>Ore al giorno</label><input id="fv-ore" type="number" min="1" max="24" step="0.5" value="${esc(String((p && p.pg_ore) || 8))}"></div>
        <div class="field"><label>Ore che nessuno ti paga (preventivi, viaggi, materiali) %</label><input id="fv-nf" type="number" min="0" max="90" value="${esc(String((p && p.pg_non_fatt != null) ? p.pg_non_fatt : 20))}"></div>
      </div>
      <div id="fv-pg-out"></div></div>`;

    /* 4. LA CARTELLA */
    h += `<h3 class="fp-h3">Per il commercialista</h3>
      <div class="ft-strum"><button class="ft-str" data-action="fv-pdf"><span>📁</span><b>La cartella dell'anno</b><small>Un PDF con incassi, spese, fatture aperte e stima</small></button></div>
      <p class="fp-stima">⚖️ Sono stime fatte con i dati che hai segnato nel gestionale. Il conto vero lo fa il tuo commercialista.</p>`;

    box.innerHTML = h;
    fvPrezzo();
  }

  /* I PROSSIMI 3 MESI: entrate attese (fatture emesse non pagate, alla loro
     scadenza) e uscite (fornitori da pagare + scadenze fiscali stimate) */
  function fvProssimi(d, p, gg) {
    const oggi = todayStr(), fine = fvIsoPiu(92);
    const Y0 = +oggi.slice(0, 4), M0 = +oggi.slice(5, 7);
    const chiavi = [0, 1, 2].map(i => { const m = M0 - 1 + i; return (Y0 + Math.floor(m / 12)) + "-" + String(m % 12 + 1).padStart(2, "0"); });
    const riga = {}; chiavi.forEach(k => { riga[k] = { in: 0, out: 0, fisco: 0, voci: [] }; });
    let ritardo = 0;
    d.fatture.forEach(f => {
      if (f.stato !== "emessa") return;
      const t = d.tot[f.id] || {}; if ((+t.segno || 1) < 0) return;
      const v = +t.totale || 0; if (!(v > 0)) return;
      const sc = _giorniDopo(f.data, gg);
      if (sc < oggi) { ritardo += v; return; }
      const k = sc.slice(0, 7); if (riga[k]) riga[k].in += v;
    });
    d.fornF.forEach(f => {
      if (f.stato === "pagata" || !(+f.importo > 0)) return;
      const sc = f.scadenza || f.data; if (!sc) return;
      const k = (sc < oggi ? oggi : sc).slice(0, 7); if (riga[k]) riga[k].out += +f.importo;
    });
    if (p && d.st) {
      const stAnno = ftStima(p, d.incassi * 365 / Math.max(60, (new Date() - new Date(Y0, 0, 1)) / 86400000));
      ftScadenze(p, stAnno, { ivaQ3: null, ivaMese: null }).forEach(s => {
        if (s.d > fine || !(s.imp > 0)) return;
        const k = s.d.slice(0, 7); if (riga[k]) { riga[k].fisco += s.imp; riga[k].voci.push(s.cosa); }
      });
    }
    let h = `<h3 class="fp-h3">I prossimi 3 mesi</h3><div class="fv-mesi">`;
    let peggio = null;
    chiavi.forEach(k => {
      const r = riga[k], diff = r.in - r.out - r.fisco;
      if (diff < 0 && (!peggio || diff < peggio.diff)) peggio = { k, diff };
      h += `<div class="fv-mese${diff < 0 ? " sotto" : ""}"><div class="fv-mese-n">${FV_MESI[+k.slice(5, 7) - 1]}</div>
        <div class="fv-riga"><span>Entrano</span><b class="fp-verde">+ ${eur(r.in)}</b></div>
        <div class="fv-riga"><span>Fornitori</span><b>− ${eur(r.out)}</b></div>
        <div class="fv-riga"><span>Tasse</span><b>− ${eur(r.fisco)}</b></div>
        <div class="fv-riga tot"><span>Saldo</span><b class="${diff < 0 ? "fp-rosso" : "fp-verde"}">${diff < 0 ? "− " : "+ "}${eur(Math.abs(diff))}</b></div></div>`;
    });
    h += `</div>`;
    if (ritardo > 0) {
      h += `<div class="fp-cons giallo"><div>💶</div><div><b>In più ti devono ${eur(ritardo)} di fatture già scadute</b>Non li ho messi nei mesi perché non si sa quando arrivano. <button class="fp-link" data-action="fp-sez" data-v="pagare">Vai a «Farsi pagare»</button></div></div>`;
    }
    if (peggio) {
      h += `<div class="fp-cons rosso"><div>⚠️</div><div><b>A ${FV_MESI[+peggio.k.slice(5, 7) - 1]} escono più soldi di quanti ne entrano: ${eur(-peggio.diff)}</b>Muoviti adesso, non quel mese: sollecita chi ti deve dei soldi, chiedi un acconto sui lavori nuovi, oppure chiedi al fornitore di spostare una scadenza. Per le tasse si può chiedere di pagare a rate.</div></div>`;
    } else {
      h += `<p class="fp-stima">Contano le fatture che hai segnato: quelle ai clienti alla loro scadenza, quelle dei fornitori non ancora pagate e le tasse stimate.</p>`;
    }
    return h;
  }

  // ---------------------------------------------------------------------
  // IL PREZZO GIUSTO
  // ---------------------------------------------------------------------
  /* quanto bisogna incassare in un anno perche', tolte spese fisse e tasse,
     restino `nettoAnno` euro. Si cerca a meta' (bisezione): le tasse non
     crescono in modo semplice (minimi INPS, scaglioni). */
  function fvLordoServe(p, nettoAnno, speseAnno) {
    const pp = Object.assign({}, p);
    if (pp.regime === "ordinario") pp.spese_anno = speseAnno;
    const tasse = G => {
      const s = ftStima(pp, G);
      if (s.totale != null) return s.totale;
      return G * ((+p.perc_commercialista || 0) / 100);
    };
    const resta = G => G - speseAnno - tasse(G);
    let lo = 0, hi = Math.max(1000, (nettoAnno + speseAnno) * 4);
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (resta(m) < nettoAnno) lo = m; else hi = m; }
    return hi;
  }

  function fvPrezzo() {
    const out = $("#fv-pg-out"); if (!out || !fvDati) return;
    const n = id => { const x = parseFloat(($(id) || {}).value); return isFinite(x) ? x : 0; };
    const netto = n("#fv-netto"), fisse = n("#fv-fisse"), mesi = n("#fv-mesi"), giorni = n("#fv-giorni"), ore = n("#fv-ore"), nf = n("#fv-nf");
    const p = fvDati.p;
    if (!(netto > 0)) { out.innerHTML = ""; return; }
    if (!p) { out.innerHTML = `<div class="fp-cons giallo"><div>✏️</div><div><b>Prima il profilo fiscale</b>Mi serve per sapere quante tasse paghi. <button class="fp-link" data-action="ft-profilo">Compilalo</button></div></div>`; return; }
    const societa = p.forma === "societa_persone" || p.forma === "srl";
    if (societa && !p.perc_commercialista) { out.innerHTML = `<div class="fp-cons giallo"><div>🏢</div><div><b>Mi serve la % del commercialista</b>Per una società scrivila nel profilo fiscale. <button class="fp-link" data-action="ft-profilo">Apri il profilo</button></div></div>`; return; }
    if (!(mesi > 0 && giorni > 0 && ore > 0) || nf >= 90) { out.innerHTML = ""; return; }
    const G = fvLordoServe(p, netto * 12, fisse * 12);
    const giornate = mesi * giorni, oreVere = giornate * ore * (1 - nf / 100);
    const alGiorno = G / giornate, allOra = G / oreVere;
    const tariffa = +fvDati.az.tariffa_oraria || 0;
    const oraTonda = Math.ceil(allOra);
    let cfr = "";
    if (tariffa > 0) {
      cfr = tariffa + 0.001 >= allOra
        ? `<div class="fp-cons verde"><div>👍</div><div><b>La tua tariffa di ${eur(tariffa)} l'ora ci sta</b>Con questi numeri il minimo è ${eur(allOra)}.</div></div>`
        : `<div class="fp-cons rosso"><div>⚠️</div><div><b>La tua tariffa di ${eur(tariffa)} l'ora è troppo bassa</b>Per portare a casa ${eur(netto)} al mese ti servono almeno ${eur(allOra)}: ti mancano ${eur(allOra - tariffa)} per ogni ora.</div></div>`;
    }
    out.innerHTML = `<div class="fv-pg-ris">
        <div><small>Devi incassare in un anno</small><b>${eur(G)}</b></div>
        <div><small>Al giorno, almeno</small><b>${eur(alGiorno)}</b></div>
        <div><small>All'ora, almeno</small><b class="fp-verde">${eur(allOra)}</b></div>
      </div>
      <p class="ft-grigio">Materiali esclusi: quelli li fai pagare a parte. Su ${giornate.toLocaleString("it-IT")} giornate l'anno, di cui ${Math.round(nf)}% di ore che nessuno ti paga.</p>
      ${cfr}
      <div class="fp-btns"><button class="btn-primary" data-action="fv-tariffa" data-v="${oraTonda}">Usa ${eur(oraTonda)} come mia tariffa oraria</button>
      ${fvDati.profiloVero ? `<button class="btn" data-action="fv-pg-salva">💾 Ricorda questi numeri</button>` : ""}</div>`;
  }
  document.addEventListener("input", function (e) {
    if (e.target && ["fv-netto", "fv-fisse", "fv-mesi", "fv-giorni", "fv-ore", "fv-nf"].indexOf(e.target.id) >= 0) fvPrezzo();
  });

  async function fvSalvaTariffa(v) {
    v = +v; if (!(v > 0)) return;
    if (!sbUid) { toast("Devi essere loggato"); return; }
    const q = await sb.from("gest_azienda").update({ tariffa_oraria: v }).eq("user_id", sbUid).select("user_id");
    if (q.error || !q.data || !q.data.length) {
      const m = (q.error && q.error.message) || "prima compila i Dati azienda";
      toast("Non salvata: " + (typeof traduciErrore === "function" ? traduciErrore(m) : m)); return;
    }
    if (fvDati) fvDati.az.tariffa_oraria = v;
    toast("Tariffa oraria " + eur(v) + " ✔ La trovi nei Dati azienda e nella parcella a ore");
    fvPrezzo();
  }

  async function fvSalvaNumeri() {
    const n = id => { const x = parseFloat(($(id) || {}).value); return isFinite(x) ? x : null; };
    const q = await sb.from("gest_fisco_profilo").update({
      pg_netto_mese: n("#fv-netto"), pg_spese_mese: n("#fv-fisse"), pg_mesi: n("#fv-mesi"),
      pg_giorni: n("#fv-giorni"), pg_ore: n("#fv-ore"), pg_non_fatt: n("#fv-nf")
    }).eq("user_id", sbUid).select("user_id");
    if (q.error || !q.data || !q.data.length) {
      const m = (q.error && q.error.message) || "nessuna riga scritta";
      toast("Non salvato: " + (typeof traduciErrore === "function" ? traduciErrore(m) : m)); return;
    }
    toast("Numeri salvati ✔");
  }

  // ---------------------------------------------------------------------
  // LA CARTELLA PER IL COMMERCIALISTA (PDF)
  // ---------------------------------------------------------------------
  async function fvPdf() {
    const d = fvDati; if (!d) return;
    if (typeof caricaJsPDF === "function" && !(await caricaJsPDF())) { toast("Il PDF non si è caricato: controlla la connessione"); return; }
    const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: "mm", format: "a4" });
    const M = 18, R = 210 - M, Y = ftAnno();
    const eP = v => new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true }).format(+v || 0) + " EUR";
    let y = 20;
    const nuova = () => { if (y > 275) { doc.addPage(); y = 20; } };
    const titolo = t => { nuova(); y += 4; doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text(t, M, y); y += 2; doc.setDrawColor(200); doc.line(M, y, R, y); y += 6; doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); };
    const riga = (a, b, gr) => { nuova(); if (gr) doc.setFont("helvetica", "bold"); doc.text(String(a), M, y); doc.text(String(b), R, y, { align: "right" }); if (gr) doc.setFont("helvetica", "normal"); y += 5.6; };

    if (typeof gestLogoPdf === "function") { try { y = await gestLogoPdf(doc, M, y); } catch (e) {} }
    doc.setFont("helvetica", "bold"); doc.setFontSize(16);
    doc.text("La cartella dell'anno " + Y, M, y); y += 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10.5);
    const a = d.az || {};
    [a.nome, a.piva ? "P.IVA " + a.piva : "", a.cod_fiscale ? "C.F. " + a.cod_fiscale : ""].filter(Boolean).forEach(t => { doc.text(t, M, y); y += 5; });
    doc.setTextColor(110); doc.text("Preparata dal gestionale TrovaImpresa il " + fdate(todayStr()) + ". Le tasse sono una stima: il conto vero lo fa il commercialista.", M, y); doc.setTextColor(0); y += 4;

    const p = d.p;
    if (p) {
      titolo("Profilo");
      riga("Attività", ftEtich(FT_FORME, p.forma).split(" (")[0]);
      riga("Regime", p.regime + (p.regime === "forfettario" ? " (coeff. " + (p.coeff || "") + "%, imposta " + (p.aliquota_5 ? 5 : 15) + "%)" : ""));
      riga("Contributi", ftEtich(FT_CASSE, p.cassa) + (p.riduzione35 ? " — riduzione 35%" : ""));
      if (p.anno_inizio) riga("Partita IVA dal", p.anno_inizio);
    }

    titolo("Incassato nel " + Y + " (fatture pagate, imponibile)");
    d.perMese.forEach((v, i) => { if (v) riga(FV_MESI[i], eP(v)); });
    riga("Totale incassato", eP(d.incassi), true);

    titolo("Spese segnate nel gestionale");
    riga("Spese dei lavori", eP(d.sp.lav));
    riga("Spese con le carte", eP(d.sp.carte));
    riga("Carburante pagato in contanti", eP(d.sp.rif));
    riga("Fatture dei fornitori", eP(d.sp.forn));
    riga("Totale spese", eP(d.sp.tot), true);

    const aperte = d.fatture.filter(f => f.stato === "emessa" && (+(d.tot[f.id] || {}).totale || 0) > 0);
    if (aperte.length) {
      titolo("Fatture emesse e non ancora pagate");
      aperte.forEach(f => riga("n. " + f.numero + "/" + (f.anno || String(f.data).slice(0, 4)) + " del " + fdate(f.data) + " — " + String(f.cli_nome || "").slice(0, 45), eP((d.tot[f.id] || {}).totale)));
      riga("Totale da incassare", eP(aperte.reduce((s, f) => s + (+(d.tot[f.id] || {}).totale || 0), 0)), true);
    }
    const fornAperte = d.fornF.filter(f => f.stato !== "pagata" && +f.importo > 0);
    if (fornAperte.length) {
      titolo("Fatture dei fornitori da pagare");
      fornAperte.forEach(f => riga((f.numero ? "n. " + f.numero + " " : "") + (f.scadenza ? "scade il " + fdate(f.scadenza) : ""), eP(f.importo)));
    }
    if (d.st && d.st.calcolabile) {
      titolo("Stima di tasse e contributi sull'incassato " + Y);
      riga("Contributi", eP(d.st.contrib.tot));
      riga("Tasse (" + d.st.cosa + ")", eP(d.st.imposta));
      riga("Totale stimato", eP(d.st.totale), true);
    }
    titolo("Da chiedere al commercialista");
    ["Le tasse stimate qui tornano con i suoi conti?", "Quanto devo mettere da parte ogni mese?", "Ci sono spese che non ho segnato e che posso scaricare?", p && p.regime === "forfettario" && !p.riduzione35 && (p.cassa === "artigiani" || p.cassa === "commercianti") ? "Mi conviene chiedere la riduzione del 35% dei contributi INPS?" : ""]
      .filter(Boolean).forEach(t => { nuova(); doc.text("•  " + t, M, y); y += 5.6; });
    doc.save("cartella-" + Y + "-" + String(a.nome || "attivita").replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40) + ".pdf");
  }

  document.addEventListener("click", function (e) {
    const t = e.target && e.target.closest ? e.target.closest("[data-action]") : null;
    if (!t) return;
    const a = t.dataset.action;
    if (a.indexOf("fv-") !== 0) return;
    if (a === "fv-tariffa")  { fvSalvaTariffa(t.dataset.v); return; }
    if (a === "fv-pg-salva") { fvSalvaNumeri(); return; }
    if (a === "fv-pdf")      { fvPdf(); return; }
  });
