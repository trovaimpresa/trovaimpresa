/* ═══ TASSE E FISCO — TAPPA 2: «LE TUE TASSE» ═════════════════════════════
   27 settembre 2026.

   A CHE SERVE
   Chi ha la partita IVA e non ha studiato fisco non sa QUANTO mettere da
   parte e QUANDO pagare. Qui, con il suo profilo (ditta / professionista /
   SNC-SAS / SRL, forfettario o ordinario, la cassa dei contributi) e con le
   fatture che ha gia' incassato, il gestionale gli dice:
     - quanto gli costeranno tasse e contributi quest'anno (STIMA)
     - il salvadanaio: «su ogni 100 € che incassi, metti da parte X €»
     - le prossime scadenze con l'importo circa, e «Ricordamelo» (finisce nei
       Promemoria e quindi nell'email del mattino)
     - i consigli per pagare meno (sconto 35% INPS, 5% dei primi anni, soglie)
     - il ravvedimento: «ho pagato in ritardo, quanto costa?»
     - «mi e' arrivata una lettera»: avviso bonario o cartella, cosa fare

   ⛔ E' UNA STIMA E LO DICE OVUNQUE. Niente detrazioni, niente addizionali
      regionali/comunali, contributi calcolati sull'anno in corso. Il numero
      vero lo fa il commercialista.
   ⛔ PER LE SOCIETA' (SNC/SAS/SRL) NON SI CALCOLANO LE IMPOSTE: IRES, IRAP e
      redditi dei soci dipendono da troppe cose. Si usa la % che ha dato il
      commercialista, se c'e'; se no si dice di chiederla.
   ⛔ I NUMERI DI LEGGE SONO TUTTI IN FT_* QUI SOTTO. Verificati il 27/09/2026
      (vedi CLAUDE.md). Le date del calendario 2027 sono quelle ordinarie:
      le proroghe del 2027 non sono ancora uscite.

   Vive nello spazio della pagina come gest-fisco.js (niente IIFE, al primo
   livello solo dichiarazioni). Lo chiama renderFisco() quando si sceglie
   «Le tue tasse»: fiscoTasse(box).
   Tabella: gest_fisco_profilo (una riga per utente).
   ═════════════════════════════════════════════════════════════════════════ */

  /* INPS artigiani/commercianti 2026 — circ. INPS 14/2026 */
  const FT_INPS = {
    artigiani:    { minimo: 4521.36, al1: 24,    al2: 25    },
    commercianti: { minimo: 4611.64, al1: 24.48, al2: 25.48 }
  };
  const FT_MINIMALE = 18808;
  const FT_SCAGLIONE_INPS = 56224;
  const FT_GS = 26.07;                              /* Gestione Separata */
  const FT_CIPAG = { perc: 20, minimo: 4240 };      /* geometri */
  const FT_INARCASSA = { perc: 14.5, minimo: 2785 };/* architetti e ingegneri */
  const FT_IRPEF = [[28000, 23], [50000, 33], [Infinity, 43]];
  const FT_SOGLIA_FORF = 85000, FT_USCITA_FORF = 100000;
  const FT_LEGALE = [["2025-01-01", 2.00], ["2026-01-01", 1.60]];
  /* 28/09/2026 — bollo sulle fatture elettroniche senza IVA sopra 77,47 €:
     si paga a trimestre. Se il 1° trimestre, o 1°+2°, restano sotto i
     5.000 € di bolli si paga piu' tardi (fonte: flextax.it, fiscoetasse.com) */
  const FT_BOLLO_SOGLIA = 5000;
  /* 28/09/2026 — ritenuta che la banca trattiene sui bonifici dei bonus casa:
     11% dal 1/3/2024, uguale nel 2026. La banca toglie SEMPRE il 22% di IVA
     prima di calcolarla, anche se in fattura c'e' il 10% o niente IVA. */
  const FT_RIT_BONUS = 11;

  const FT_FORME = [["ditta", "Ditta individuale (artigiano, impresa, negozio)"], ["professionista", "Professionista con partita IVA"],
                    ["societa_persone", "Società di persone (SNC, SAS)"], ["srl", "Società di capitali (SRL, SRLS)"]];
  const FT_CASSE = [["artigiani", "INPS Artigiani"], ["commercianti", "INPS Commercianti"], ["separata", "INPS Gestione Separata"],
                    ["cipag", "Cassa Geometri (CIPAG)"], ["inarcassa", "Inarcassa (architetti e ingegneri)"], ["altra", "Un'altra cassa / non lo so"]];
  const FT_COEFF = [["86", "Edilizia e costruzioni — 86%"], ["78", "Professioni tecniche — 78%"], ["40", "Commercio — 40%"]];

  let ftProfilo = null, ftPresunto = false, ftDati = null;
  let ftScTutte = false;   /* «Vedi tutte» le scadenze: resta aperto finche' non lo richiude */

  function ftEtich(el, v) { const r = el.find(x => x[0] === v); return r ? r[1] : ""; }
  function ftAnno() { return +todayStr().slice(0, 4); }

  /* l'incassato portato a fine anno. UNA formula sola: la usano Le tue
     tasse, Sopravvivere (i prossimi 3 mesi) e Chiedi all'AI. Prima erano
     due formule diverse e le scadenze di novembre non combaciavano. */
  function ftProiezione(incassi) {
    const inizio = new Date(ftAnno(), 0, 1), oggiD = new Date(); oggiD.setHours(0, 0, 0, 0);
    const doy = Math.round((oggiD - inizio) / 86400000) + 1;
    return { doy, val: doy >= 60 ? incassi * 365 / doy : incassi };
  }

  /* il profilo che si puo' indovinare quando non l'ha ancora scritto:
     dal regime scritto nei Dati azienda (RF19 = forfettario) e dal mestiere */
  function ftIndovina(az) {
    const pro = (typeof ruoloUtente !== "undefined" && ruoloUtente === "professionista");
    const rf = String((az && az.regime_fiscale) || "");
    if (!rf) return null;
    return {
      forma: pro ? "professionista" : "ditta",
      regime: rf === "RF19" ? "forfettario" : "ordinario",
      cassa: pro ? "separata" : "artigiani",
      coeff: pro ? 78 : 86, aliquota_5: false, riduzione35: false, iva: "trimestrale"
    };
  }

  // ---------------------------------------------------------------------
  // I CONTI
  // ---------------------------------------------------------------------
  function ftContributi(p, reddito) {
    const c = { fissi: 0, variabili: 0, nota: "" };
    if (p.cassa === "artigiani" || p.cassa === "commercianti") {
      const t = FT_INPS[p.cassa];
      c.fissi = t.minimo;
      const r1 = Math.max(0, Math.min(reddito, FT_SCAGLIONE_INPS) - FT_MINIMALE);
      const r2 = Math.max(0, reddito - FT_SCAGLIONE_INPS);
      c.variabili = r1 * t.al1 / 100 + r2 * t.al2 / 100;
      if (p.regime === "forfettario" && p.riduzione35) { c.fissi *= 0.65; c.variabili *= 0.65; }
    } else if (p.cassa === "separata") {
      c.variabili = reddito * FT_GS / 100;
    } else if (p.cassa === "cipag") {
      c.fissi = FT_CIPAG.minimo; c.variabili = Math.max(0, reddito * FT_CIPAG.perc / 100 - FT_CIPAG.minimo);
      c.nota = "Più il 5% integrativo, che metti in fattura al cliente.";
    } else if (p.cassa === "inarcassa") {
      c.fissi = FT_INARCASSA.minimo; c.variabili = Math.max(0, reddito * FT_INARCASSA.perc / 100 - FT_INARCASSA.minimo);
      c.nota = "Più il 4% integrativo, che metti in fattura al cliente.";
    } else {
      c.nota = "Non conosco la tua cassa: i contributi non sono nel conto.";
    }
    c.tot = c.fissi + c.variabili;
    return c;
  }

  function ftIrpef(base) {
    let tot = 0, da = 0;
    for (const [fino, al] of FT_IRPEF) {
      if (base > da) tot += (Math.min(base, fino) - da) * al / 100;
      da = fino;
    }
    return tot;
  }

  /* la stima dell'anno su un certo incassato */
  function ftStima(p, incassi) {
    const s = { incassi, reddito: 0, contrib: { tot: 0, fissi: 0, variabili: 0 }, imposta: 0, calcolabile: true, cosa: "" };
    const societa = p.forma === "societa_persone" || p.forma === "srl";
    if (societa) {
      s.calcolabile = false;
      if (p.perc_commercialista) s.totale = incassi * p.perc_commercialista / 100;
      return s;
    }
    if (p.regime === "forfettario") {
      const coeff = +p.coeff || (p.forma === "professionista" ? 78 : 86);
      s.reddito = incassi * coeff / 100;
      s.contrib = ftContributi(p, s.reddito);
      s.aliquota = p.aliquota_5 ? 5 : 15;
      s.imposta = Math.max(0, s.reddito - s.contrib.tot) * s.aliquota / 100;
      s.cosa = "imposta sostitutiva " + s.aliquota + "%";
    } else {
      s.reddito = Math.max(0, incassi - (+p.spese_anno || 0));
      s.contrib = ftContributi(p, s.reddito);
      s.imposta = ftIrpef(Math.max(0, s.reddito - s.contrib.tot));
      s.cosa = "IRPEF";
    }
    s.totale = s.contrib.tot + s.imposta;
    return s;
  }

  // ---------------------------------------------------------------------
  // LE SCADENZE — calendario 1/10/2026 – 31/12/2027 (regole-2026, voce 11)
  // ---------------------------------------------------------------------
  /* sabato e domenica la scadenza va al lunedi' */
  function ftFeriale(d) {
    const [y, m, g] = d.split("-").map(Number), x = new Date(y, m - 1, g);
    while (x.getDay() === 0 || x.getDay() === 6) x.setDate(x.getDate() + 1);
    return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
  }

  /* il bollo da 2 € delle fatture: le scadenze, con i bolli veri delle sue
     fatture. Solo se chi chiama ha passato dati.bollo (Le tue tasse). */
  function ftBollo(p, dati, add) {
    const B = dati && dati.bollo; if (!B) return;
    const Y = ftAnno(), oggi = todayStr();
    const q = (y, n) => B[y + "-" + n] || { eur: 0, n: 0 };
    const fine = (y, n) => y + "-" + ["03-31", "06-30", "09-30", "12-31"][n - 1];
    const usa = p.regime === "forfettario" || Object.keys(B).length > 0;
    if (!usa) return;
    for (let y = Y - 1; y <= Y + 1; y++) {
      const a1 = q(y, 1).eur, a2 = q(y, 2).eur;
      const gruppi = {};
      const metti = (d, n) => { d = ftFeriale(d); (gruppi[d] = gruppi[d] || []).push(n); };
      if (a1 + a2 < FT_BOLLO_SOGLIA) { metti(y + "-11-30", 1); metti(y + "-11-30", 2); }
      else { metti(a1 < FT_BOLLO_SOGLIA ? y + "-09-30" : y + "-05-31", 1); metti(y + "-09-30", 2); }
      metti(y + "-11-30", 3);
      metti((y + 1) + "-02-28", 4);
      Object.keys(gruppi).forEach(d => {
        if (d < oggi) return;
        const T = gruppi[d];
        const eurT = T.reduce((s, n) => s + q(y, n).eur, 0), nT = T.reduce((s, n) => s + q(y, n).n, 0);
        const aperto = T.some(n => fine(y, n) >= oggi);   /* un trimestre non ancora finito */
        if (!(eurT > 0) && !(aperto && p.regime === "forfettario")) return;
        if (!(eurT > 0) && y > Y) return;                 /* l'anno prossimo solo se ci sono gia' bolli */
        const nomi = T.length > 1 ? T.slice(0, -1).map(n => n + "°").join(", ") + " e " + T[T.length - 1] + "°" : T[0] + "°";
        const nota = (eurT > 0 ? nT + (nT === 1 ? " fattura" : " fatture") + " col bollo da 2 €" + (aperto ? ", per ora" : "") + ". " : "Ogni fattura senza IVA sopra 77,47 € ha il bollo da 2 €. ")
          + "L'F24 già pronto lo trovi sul sito dell'Agenzia, in «Fatture e corrispettivi».";
        add(d, "Bollo delle fatture (" + nomi + " trimestre " + y + ")", eurT > 0 ? eurT : null, nota, true);
      });
    }
  }

  function ftScadenze(p, st, dati, tutte) {
    const indiv = p.forma === "ditta" || p.forma === "professionista";
    const inps = p.cassa === "artigiani" || p.cassa === "commercianti";
    const ivaSi = p.regime === "ordinario";
    /* la rata fissa non dipende da quanto incassi: la conosco anche per le
       societa' (la paga ogni socio che lavora nell'azienda) */
    const rata = inps ? FT_INPS[p.cassa].minimo / 4 * (p.regime === "forfettario" && p.riduzione35 ? 0.65 : 1) : 0;
    const acconto = indiv && st.calcolabile ? (st.imposta * 0.5 + (inps ? st.contrib.variabili * 0.5 : 0) + (p.cassa === "separata" ? st.contrib.tot * 0.4 : 0)) : null;
    const L = [];
    const add = (d, cosa, imp, nota, chi) => { if (chi) L.push({ d, cosa, imp, nota }); };

    ["2026-11-16", "2027-02-16", "2027-05-17", "2027-08-20", "2027-11-16"].forEach((d, i) =>
      add(d, "INPS: rata fissa dei contributi" + (indiv ? "" : " (per ogni socio che lavora)"), rata, d > "2027-02-16" ? "Importo 2027 non ancora uscito: stima sul 2026." : "Il modello F24 lo scarichi dal Cassetto previdenziale INPS.", inps));
    add("2026-11-02", "Dichiarazione dei redditi: ultimo giorno per mandarla", null, "La manda il commercialista: chiedigli la ricevuta.", true);
    add("2026-11-30", "Secondo acconto delle tasse 2026", acconto, "Circa metà delle tasse dell'anno" + (inps ? ", più l'acconto INPS sulla parte oltre il minimo." : "."), indiv);
    add("2027-06-30", "Saldo 2026 e primo acconto 2027", acconto, p.regime === "forfettario" ? "Di solito per i forfettari arriva la proroga a luglio: per il 2027 non è ancora decisa." : "Si può pagare fino al 30 luglio con lo 0,40% in più.", indiv);
    add("2027-11-30", "Secondo acconto delle tasse 2027", acconto, "Circa metà delle tasse dell'anno.", indiv);
    add("2027-02-28", "Ultimo giorno per chiedere lo sconto del 35% INPS per il 2027", null, "Domanda online sul sito INPS (o te la fa il commercialista).", p.regime === "forfettario" && inps && !p.riduzione35);
    if (ivaSi && p.iva !== "mensile") {
      add("2026-11-16", "IVA del 3° trimestre (luglio–settembre)", dati.ivaQ3 != null ? dati.ivaQ3 * 1.01 : null, "L'IVA delle tue fatture del trimestre, meno quella delle tue spese, più l'1%.", true);
      add("2026-12-28", "Acconto IVA", null, "Di solito l'88% dell'IVA dell'ultimo trimestre: chiedi l'importo al commercialista.", true);
      add("2027-03-16", "Saldo IVA dell'anno 2026", null, "Si può rimandare fino al 30 giugno con lo 0,40% in più al mese.", true);
      add("2027-05-17", "IVA del 1° trimestre 2027", null, "", true);
      add("2027-08-20", "IVA del 2° trimestre 2027", null, "", true);
      add("2027-11-16", "IVA del 3° trimestre 2027", null, "", true);
    }
    if (ivaSi && p.iva === "mensile") {
      const oggi = todayStr(), [y, m] = oggi.split("-").map(Number);
      let d = oggi.slice(0, 8) + "16";
      if (d < oggi) d = (m === 12 ? (y + 1) + "-01" : y + "-" + String(m + 1).padStart(2, "0")) + "-16";
      add(d, "IVA del mese scorso", dati.ivaMese, "L'IVA delle tue fatture del mese, meno quella delle tue spese.", true);
      add("2026-12-28", "Acconto IVA", null, "Chiedi l'importo al commercialista.", true);
      add("2027-03-16", "Saldo IVA dell'anno 2026", null, "", true);
    }
    /* le casse dei tecnici (date verificate il 28/09/2026 su cassageometri.it
       e inarcassa.it). Le date 2027 non sono ancora uscite: le teniamo uguali. */
    if (p.cassa === "cipag") {
      add("2026-09-30", "Cassa Geometri: dichiarazione del reddito 2025 e contributi oltre il minimo", null, "Si possono pagare in 4 rate: 30 settembre, 27 ottobre, 27 novembre, 28 dicembre. L'importo te lo dà la Cassa dopo la dichiarazione.", true);
      ["2027-02-27", "2027-04-27", "2027-06-27", "2027-08-27"].forEach(d =>
        add(d, "Cassa Geometri: rata dei contributi minimi", FT_CIPAG.minimo / 4, "Date 2027 non ancora uscite: le metto uguali al 2026.", true));
      add("2027-09-30", "Cassa Geometri: contributi 2026 oltre il minimo", st.calcolabile && st.contrib.variabili > 0 ? st.contrib.variabili : null, "Stima sui tuoi incassi 2026, più il 5% integrativo che hai messo in fattura. Si può pagare in 4 rate fino a dicembre.", true);
    }
    if (p.cassa === "inarcassa") {
      add("2026-12-31", "Inarcassa: conguaglio dei contributi 2025", null, "L'importo te lo dà Inarcassa dopo la dichiarazione del reddito professionale.", true);
      add("2027-06-30", "Inarcassa: prima rata dei minimi", FT_INARCASSA.minimo / 2, "Date 2027 non ancora uscite: le metto uguali al 2026.", true);
      add("2027-09-30", "Inarcassa: seconda rata dei minimi", FT_INARCASSA.minimo / 2, "", true);
      add("2027-12-31", "Inarcassa: conguaglio dei contributi 2026", st.calcolabile && st.contrib.variabili > 0 ? st.contrib.variabili : null, "Stima sui tuoi incassi 2026, più il 4% integrativo che hai messo in fattura.", true);
    }

    ftBollo(p, dati, add);

    const oggi = todayStr();
    const F = L.filter(x => x.d >= oggi).sort((a, b) => a.d < b.d ? -1 : 1);
    return tutte ? F : F.slice(0, 7);
  }

  // ---------------------------------------------------------------------
  // I CONSIGLI — regole semplici
  // ---------------------------------------------------------------------
  function ftConsigli(p, st, proiezione) {
    const C = [];
    const inps = p.cassa === "artigiani" || p.cassa === "commercianti";
    if (p.regime === "forfettario" && inps && !p.riduzione35 && st.calcolabile) {
      C.push({ tono: "verde", t: "Puoi pagare il 35% in meno di contributi",
        s: "Da forfettario puoi chiedere all'INPS lo sconto del 35%: per te sono circa " + eur(st.contrib.tot * 0.35) + " l'anno in meno. La domanda si fa entro il 28 febbraio. Attenzione: meno contributi vuol dire anche una pensione un po' più bassa." });
    }
    if (p.regime === "forfettario" && !p.aliquota_5 && p.anno_inizio && ftAnno() - p.anno_inizio < 5) {
      C.push({ tono: "verde", t: "Forse puoi pagare il 5% invece del 15%",
        s: "Nei primi 5 anni, se nei 3 anni prima non avevi un'altra partita IVA e non fai lo stesso lavoro che facevi da dipendente, l'imposta è del 5%. Chiedi al commercialista se vale per te." });
    }
    if (p.regime === "forfettario" && proiezione > FT_USCITA_FORF) {
      C.push({ tono: "rosso", t: "Attenzione: stai per uscire dal forfettario",
        s: "Se quest'anno incassi più di " + eur(FT_USCITA_FORF) + " esci dal forfettario SUBITO, dallo stesso anno: dalla fattura che supera la soglia devi mettere l'IVA. Chiama il commercialista adesso." });
    } else if (p.regime === "forfettario" && proiezione > FT_SOGLIA_FORF) {
      C.push({ tono: "giallo", t: "Stai superando gli 85.000 €",
        s: "Se a fine anno incassi più di " + eur(FT_SOGLIA_FORF) + ", dall'anno prossimo passi all'ordinario: IVA in fattura e tasse diverse. Parlane col commercialista prima di dicembre." });
    } else if (p.regime === "forfettario" && proiezione > FT_SOGLIA_FORF * 0.85) {
      C.push({ tono: "giallo", t: "Ti stai avvicinando agli 85.000 €",
        s: "Se continui così arrivi vicino alla soglia del forfettario. Tieni d'occhio gli incassi degli ultimi mesi." });
    }
    if (inps && st.calcolabile && st.incassi > 0 && st.contrib.fissi > st.incassi * 0.25) {
      C.push({ tono: "giallo", t: "I contributi fissi pesano tanto",
        s: "L'INPS ti chiede almeno " + eur(st.contrib.fissi) + " l'anno anche se guadagni poco. Con questi incassi sono una fetta grossa: mettili da parte per primi, rata per rata." });
    }
    if (p.regime === "ordinario" && !(+p.spese_anno) && st.calcolabile) {
      C.push({ tono: "giallo", t: "Dimmi quanto spendi",
        s: "Non mi hai detto le spese dell'anno (materiali, furgone, attrezzi…): la stima delle tasse ora è più alta del vero. Scrivile nel profilo." });
    }
    C.push({ tono: "neutro", t: "Non riesci a pagare una scadenza?",
      s: "Non far finta di niente: se paghi anche solo pochi giorni dopo, con il ravvedimento la multa è piccolissima. Se aspetti la lettera dell'Agenzia costa molto di più." });
    return C;
  }

  // ---------------------------------------------------------------------
  // LA SEZIONE
  // ---------------------------------------------------------------------
  /* 28/09/2026 — la lettura dei dati sta in una funzione sua: la usano
     «Le tue tasse» e il riquadro «Da fare adesso» in cima al reparto.
     Non scrive nei globali: chi la chiama decide (per via del giro). */
  async function ftCarica() {
    const Y = ftAnno(), oggi = todayStr();
    const [rP, rA, rF] = await Promise.all([
      sb.from("gest_fisco_profilo").select("*").eq("user_id", sbUid).maybeSingle(),
      sb.from("gest_azienda").select("regime_fiscale").eq("user_id", sbUid).maybeSingle(),
      sb.from("gest_fatture").select("id,stato,data,data_pagata,bollo").eq("user_id", sbUid)
        .in("stato", ["emessa", "pagata"]).is("eliminato_il", null).gte("data", (Y - 1) + "-01-01")
    ]);
    let profilo = rP.data || null, presunto = false;
    if (!profilo) { profilo = ftIndovina(rA.data); presunto = !!profilo; }

    const ff = rF.data || [];
    const ids = ff.map(f => f.id);
    const rT = ids.length ? await sb.from("gest_fatture_totali").select("fattura_id,imponibile,iva").in("fattura_id", ids) : { data: [] };
    const tot = {}; (rT.data || []).forEach(t => { tot[t.fattura_id] = t; });

    /* incassato = fatture PAGATE quest'anno (conta il giorno in cui ti pagano) */
    let incassi = 0, ivaAnno = 0;
    ff.forEach(f => {
      if (f.stato === "pagata" && String(f.data_pagata || "").slice(0, 4) === String(Y)) {
        incassi += +(tot[f.id] || {}).imponibile || 0;
        ivaAnno += +(tot[f.id] || {}).iva || 0;
      }
    });
    /* IVA per trimestre / mese: conta la data della fattura, non il pagamento */
    const ivaTra = (da, a) => ff.filter(f => f.data >= da && f.data <= a).reduce((s, f) => s + (+(tot[f.id] || {}).iva || 0), 0);
    const [yy, mm] = oggi.split("-").map(Number);
    const mesePrec = mm === 1 ? [(yy - 1), 12] : [yy, mm - 1];
    const mp = mesePrec[0] + "-" + String(mesePrec[1]).padStart(2, "0");
    /* i bolli per trimestre: conta la data della fattura. Chiave «2026-3» */
    const bollo = {};
    ff.forEach(f => {
      const b = +f.bollo || 0; if (!(b > 0) || !f.data) return;
      const k = f.data.slice(0, 4) + "-" + Math.ceil(+f.data.slice(5, 7) / 3);
      if (!bollo[k]) bollo[k] = { eur: 0, n: 0 };
      bollo[k].eur += b; bollo[k].n++;
    });
    return { profilo, presunto, dati: {
      incassi, ivaAnno, bollo,
      ivaQ3: ivaTra("2026-07-01", "2026-09-30"),
      ivaMese: ivaTra(mp + "-01", mp + "-31")
    } };
  }

  async function fiscoTasse(box, mio) {
    const vecchio = () => mio != null && typeof fpGiro !== "undefined" && mio !== fpGiro;
    if (!sb || !sbUid) { box.innerHTML = tabVuoto("Le tue tasse", "Accedi per vedere le tue tasse."); return; }
    box.innerHTML = '<div class="fp-carica">Sto facendo i conti…</div>';
    const Y = ftAnno();
    const R = await ftCarica();
    if (vecchio()) return;
    ftProfilo = R.profilo; ftPresunto = R.presunto; ftDati = R.dati;
    const incassi = ftDati.incassi;

    const { doy, val: proiezione } = ftProiezione(incassi);

    let h = "";
    if (!ftProfilo) {
      h += `<div class="fp-card ft-profilo-vuoto">
        <div class="fp-n">Dimmi che partita IVA hai</div>
        <p class="fp-sotto">Sono 6 domande, ci metti un minuto. Con quelle ti dico quanto mettere da parte, quando pagare e come pagare meno.</p>
        <div class="fp-btns"><button class="btn-primary" data-action="ft-profilo">Rispondi adesso</button></div></div>`;
      h += ftStrumenti();
      box.innerHTML = h; return;
    }
    const p = ftProfilo;
    const st = ftStima(p, proiezione);

    h += `<div class="ft-chi"><div><small>${ftPresunto ? "Il tuo profilo (l'ho indovinato: controllalo)" : "Il tuo profilo"}</small>
      <b>${esc(ftEtich(FT_FORME, p.forma).split(" (")[0])} · ${p.regime === "forfettario" ? "forfettario" + (p.aliquota_5 ? " 5%" : "") : "ordinario"} · ${esc(ftEtich(FT_CASSE, p.cassa))}</b></div>
      <button class="btn" data-action="ft-profilo">${fpIc("matita")} ${ftPresunto ? "Controlla" : "Cambia"}</button></div>`;

    h += `<div class="fp-tot">
      <div class="k-verde">${fpIc("euro")}<div><small>Incassato nel ${Y} finora</small><b>${eur(incassi)}</b></div></div>
      <div class="k-blu">${fpIc("grafico")}<div><small>${doy >= 60 ? "Se continui così, a fine anno" : "A inizio anno conto l'incassato"}</small><b>${eur(proiezione)}</b></div></div>
      <div class="k-rosso">${fpIc("palazzo")}<div><small>Tasse e contributi dell'anno (stima)</small><b class="fp-rosso">${st.totale != null ? eur(st.totale) : "—"}</b></div></div>
    </div>`;

    /* IL SALVADANAIO */
    if (st.totale != null && proiezione > 0) {
      const su100 = Math.ceil(st.totale / proiezione * 100);
      if (su100 >= 100) {
        /* i contributi fissi da soli superano quello che entra: dire «metti da
           parte 100 € su 100» non aiuta nessuno, va detto com'e' */
        h += `<div class="ft-salva">${fpIc("salvadanaio", "ft-salva-ic")}<div class="ft-salva-n">Quest'anno tasse e contributi (<b>${eur(st.totale)}</b>)<br>sono <b class="fp-rosso">più di quello che incassi</b></div>
          <div class="ft-salva-d">Ti mancano circa <b>${eur(st.totale - proiezione)}</b>. Succede quando si incassa poco: i contributi fissi si pagano lo stesso. Metti da parte tutto quello che puoi, circa <b>${eur(st.totale / 12)}</b> al mese, e parlane col commercialista.</div>`;
      } else {
      h += `<div class="ft-salva">${fpIc("salvadanaio", "ft-salva-ic")}<div class="ft-salva-n">Su ogni <b>100 €</b> che incassi,<br>metti da parte <b class="ft-grande">${su100} €</b></div>
        <div class="ft-salva-d">Cioè circa <b>${eur(st.totale / 12)}</b> al mese. Apri un conto a parte, anche gratuito, e ogni volta che un cliente paga sposta lì la tua parte: a giugno e novembre i soldi ci sono già.</div>`;
      }
      if (st.calcolabile) {
        h += `<table class="fp-tab">
          <tr><td>Contributi (${esc(ftEtich(FT_CASSE, p.cassa))})</td><td><b>${eur(st.contrib.tot)}</b>${st.contrib.fissi ? ` <span class="ft-grigio">di cui fissi ${eur(st.contrib.fissi)}</span>` : ""}${st.contrib.nota ? `<br><span class="ft-grigio">${esc(st.contrib.nota)}</span>` : ""}</td></tr>
          <tr><td>Tasse (${esc(st.cosa)})</td><td><b>${eur(st.imposta)}</b>${p.regime === "ordinario" ? ` <span class="ft-grigio">senza detrazioni e addizionali</span>` : ""}</td></tr>
        </table>`;
      } else {
        h += `<p class="ft-grigio">Calcolato con il ${esc(String(p.perc_commercialista))}% che ti ha detto il commercialista.</p>`;
      }
      if (p.regime === "ordinario" && ftDati.ivaAnno > 0) {
        h += `<div class="fp-cons giallo"><div>${fpIc("avviso")}</div><div><b>E l'IVA non è tua</b>Quest'anno hai incassato <b>${eur(ftDati.ivaAnno)}</b> di IVA dai clienti: sono dello Stato. Mettili da parte a parte, fuori dal conto sopra.</div></div>`;
      }
      if (p.perc_commercialista && st.calcolabile) {
        h += `<p class="ft-grigio">Il tuo commercialista ti ha detto di mettere da parte il ${esc(String(p.perc_commercialista))}%: se è diverso da qui, fidati di lui.</p>`;
      }
      h += `</div>`;
    } else if (!st.calcolabile) {
      h += `<div class="fp-cons giallo"><div>${fpIc("palazzo")}</div><div><b>Per una società le tasse le calcola il commercialista</b>Chiedigli: «su 100 € che incasso, quanti ne devo mettere da parte?». Scrivi il numero nel profilo e ti faccio il salvadanaio.</div></div>`;
      if (ftDati.ivaAnno > 0) h += `<div class="fp-cons giallo"><div>${fpIc("avviso")}</div><div><b>L'IVA non è tua</b>Quest'anno la società ha incassato <b>${eur(ftDati.ivaAnno)}</b> di IVA: tienili da parte.</div></div>`;
    } else {
      h += `<div class="fp-cons neutro"><div>${fpIc("salvadanaio")}</div><div><b>Ancora nessun incasso quest'anno</b>Quando segni pagata la prima fattura, qui ti dico quanto mettere da parte.${(p.cassa === "artigiani" || p.cassa === "commercianti") ? " Intanto ricorda: i contributi fissi INPS (" + eur(st.contrib.fissi) + " l'anno) si pagano anche senza incassi." : ""}</div></div>`;
    }

    /* LE SCADENZE */
    const sc = ftScadenze(p, st, ftDati, true);
    if (sc.length) {
      h += `<div class="ft-sc-testa"><h3 class="fp-h3">Le prossime scadenze</h3>
        <button class="btn" data-action="ft-ics">${fpIc("data")} Mettile nel calendario del telefono</button></div><div class="ft-sc-lista${ftScTutte ? " tutte" : ""}">` + sc.map((x, i) => {
        const g = _giorniA(x.d);
        return `<div class="ft-sc${g <= 15 ? " vicina" : ""}${i >= 3 ? " ft-sc-altra" : ""}"${x.nota ? ' data-action="ft-sc-nota"' : ""}>
          <div class="ft-sc-d"><b>${x.d.slice(8, 10)}</b><span>${["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"][+x.d.slice(5, 7) - 1]} ${x.d.slice(2, 4)}</span></div>
          <div class="ft-sc-t"><b>${esc(x.cosa)}${x.nota ? fpIc("freccia", "ft-sc-apri") : ""}</b>${x.nota ? `<span class="ft-sc-nota">${esc(x.nota)}</span>` : ""}<span class="ft-fra">${g === 0 ? "oggi" : "fra " + g + (g === 1 ? " giorno" : " giorni")}</span></div>
          <div class="ft-sc-e">${x.imp != null && x.imp > 0 ? '<span class="ft-imp"><small>circa</small><b>' + eur(x.imp) + "</b></span>" : ""}
            <button class="btn" data-action="ft-ricorda" data-d="${x.d}" data-t="${esc(x.cosa)}" data-i="${x.imp != null ? Math.round(x.imp * 100) / 100 : ""}" title="Te lo ricordo 7 giorni prima">${fpIc("campana")}<span>Ricordamelo</span></button></div>
        </div>`;
      }).join("") + `</div>` + (sc.length > 3 ? `<button class="ft-sc-piu" data-action="ft-sc-tutte">${ftScTutte ? "Mostra meno" : "Vedi tutte (" + sc.length + ")"}</button>` : "");
    }

    /* I CONSIGLI */
    h += `<h3 class="fp-h3">I miei consigli</h3>` + ftConsigli(p, st, proiezione).map(c =>
      `<div class="fp-cons ${c.tono}"><div>${fpIc(c.tono === "verde" ? "euro" : c.tono === "neutro" ? "info" : "avviso")}</div><div><b>${esc(c.t)}</b>${esc(c.s)}${c.t.indexOf("Non riesci") === 0 ? ` <button class="fp-link" data-action="ft-ravv">Calcola quanto costa</button>` : ""}</div></div>`).join("");

    h += ftStrumenti();
    h += `<p class="fp-stima">${fpIc("bilancia")} È una <b>stima</b> fatta con le regole del 2026 sui tuoi incassi: niente detrazioni, niente addizionali, e le fatture che non segni pagate non ci sono. Il conto vero lo fa il tuo commercialista.</p>`;
    box.innerHTML = h;
  }

  function ftStrumenti() {
    return `<h3 class="fp-h3">Ti serve aiuto?</h3><div class="ft-strum">
      <button class="ft-str" data-action="ft-ravv"><span class="t-rosso">${fpIc("orologio")}</span><b>Ho pagato in ritardo</b><small>Quanto costa il ravvedimento</small></button>
      <button class="ft-str" data-action="ft-lettera"><span class="t-blu">${fpIc("busta")}</span><b>Mi è arrivata una lettera</b><small>Avviso bonario o cartella: cosa fare</small></button>
      <button class="ft-str" data-action="ft-iva"><span class="t-viola">${fpIc("calcolo")}</span><b>Quale IVA metto?</b><small>10%, 22%, 4% o reverse charge: 3 domande</small></button>
      <button class="ft-str" data-action="ft-bonus"><span class="t-verde">${fpIc("banca")}</span><b>Bonifico del bonus casa</b><small>Perché ti arriva meno di quanto hai fatturato</small></button>
    </div>`;
  }

  // ---------------------------------------------------------------------
  // IL PROFILO
  // ---------------------------------------------------------------------
  function ftProfiloForm() {
    const p = ftProfilo || {};
    const opz = (el, sel) => el.map(x => `<option value="${x[0]}"${String(x[0]) === String(sel == null ? "" : sel) ? " selected" : ""}>${x[1]}</option>`).join("");
    const coeffSel = FT_COEFF.some(x => +x[0] === +p.coeff) ? String(+p.coeff) : (p.coeff ? "altro" : (p.forma === "professionista" ? "78" : "86"));
    fpSheet("Il tuo profilo fiscale", `<div class="sh-cols"><div class="sh-col">
      <div class="sh-b"><div class="sh-tit">Chi sei</div>
        <div class="field"><label>1. Che attività hai?</label><select id="ft-forma">${opz(FT_FORME, p.forma || "ditta")}</select></div>
        <div class="field ft-solo-indiv"><label>2. Che regime hai?</label><select id="ft-regime">${opz([["forfettario", "Forfettario (niente IVA in fattura)"], ["ordinario", "Ordinario / semplificato (con IVA)"]], p.regime || "forfettario")}</select></div>
        <div class="field"><label>3. Dove paghi i contributi?</label><select id="ft-cassa">${opz(FT_CASSE, p.cassa || "artigiani")}</select></div>
        <div class="field"><label>4. In che anno hai aperto la partita IVA?</label><input id="ft-anno" type="number" inputmode="numeric" min="1950" max="${ftAnno()}" value="${esc(String(p.anno_inizio || ""))}" placeholder="Es. 2019"></div>
      </div></div><div class="sh-col">
      <div class="sh-b"><div class="sh-tit">I dettagli</div>
        <div class="ft-solo-forf">
          <div class="field"><label>5. Che lavoro fai? (il coefficiente)</label><select id="ft-coeff">${opz(FT_COEFF.concat([["altro", "Altro: lo scrivo io"]]), coeffSel)}</select></div>
          <div class="field" id="ft-coeff-altro-box"${coeffSel === "altro" ? "" : ' style="display:none"'}><label>Coefficiente %</label><input id="ft-coeff-altro" type="number" min="1" max="100" value="${esc(String(p.coeff || ""))}"></div>
          <label class="ft-check"><input type="checkbox" id="ft-5"${p.aliquota_5 ? " checked" : ""}> Pago il 5% (primi 5 anni)</label>
          <label class="ft-check ft-solo-inps"><input type="checkbox" id="ft-35"${p.riduzione35 ? " checked" : ""}> Ho già lo sconto del 35% sui contributi INPS</label>
        </div>
        <div class="ft-solo-ord">
          <div class="field"><label>5. Ogni quanto paghi l'IVA?</label><select id="ft-iva">${opz([["trimestrale", "Ogni 3 mesi"], ["mensile", "Ogni mese"]], p.iva || "trimestrale")}</select></div>
          <div class="field ft-solo-indiv"><label>6. Quanto spendi in un anno, circa? (materiali, furgone, attrezzi…)</label><input id="ft-spese" type="number" min="0" step="100" value="${esc(String(p.spese_anno || ""))}" placeholder="Es. 12000"></div>
        </div>
        <div class="field"><label>Il tuo commercialista ti ha detto una % da mettere da parte? (facoltativo)</label><input id="ft-perc" type="number" min="0" max="100" step="1" value="${esc(String(p.perc_commercialista || ""))}" placeholder="Es. 30"></div>
        <div class="sh-nota">Non sai una risposta? Lascia com'è e chiedi al commercialista: la puoi cambiare quando vuoi.</div>
      </div></div></div>`,
      `<button class="btn b-cancel" data-action="close">Annulla</button>
       <button class="btn-primary b-save" data-action="ft-salva">Salva</button>`);
    ftFormMostra();
  }

  /* mostra solo le domande che servono: una SRL non ha il forfettario */
  function ftFormMostra() {
    const f = ($("#ft-forma") || {}).value, soc = f === "societa_persone" || f === "srl";
    const reg = soc ? "ordinario" : ($("#ft-regime") || {}).value;
    const cassa = ($("#ft-cassa") || {}).value;
    const vedi = (sel, si) => document.querySelectorAll(sel).forEach(e => { e.style.display = si ? "" : "none"; });
    vedi("#sheet .ft-solo-indiv", !soc);
    vedi("#sheet .ft-solo-forf", reg === "forfettario");
    vedi("#sheet .ft-solo-ord", reg === "ordinario");
    vedi("#sheet .ft-solo-inps", cassa === "artigiani" || cassa === "commercianti");
    const ca = $("#ft-coeff-altro-box"); if (ca) ca.style.display = ($("#ft-coeff") || {}).value === "altro" ? "" : "none";
  }
  document.addEventListener("change", function (e) {
    if (e.target && ["ft-forma", "ft-regime", "ft-cassa", "ft-coeff"].indexOf(e.target.id) >= 0) ftFormMostra();
  });

  async function ftSalvaProfilo() {
    if (!sbUid) { toast("Devi essere loggato"); return; }
    const v = s => { const e = $(s); return e ? String(e.value || "").trim() : ""; };
    const num = s => { const x = parseFloat(v(s).replace(/\./g, "").replace(",", ".")); return isFinite(x) ? x : null; };
    const forma = v("#ft-forma"), soc = forma === "societa_persone" || forma === "srl";
    const regime = soc ? "ordinario" : v("#ft-regime");
    const anno = num("#ft-anno");
    if (anno != null && (anno < 1950 || anno > ftAnno())) { toast("L'anno non torna: controlla"); return; }
    let coeff = null;
    if (regime === "forfettario") {
      coeff = v("#ft-coeff") === "altro" ? num("#ft-coeff-altro") : +v("#ft-coeff");
      if (!coeff || coeff <= 0 || coeff > 100) { toast("Scrivi il coefficiente (un numero da 1 a 100)"); return; }
    }
    const perc = num("#ft-perc");
    if (perc != null && (perc < 0 || perc > 100)) { toast("La % del commercialista va da 0 a 100"); return; }
    const row = {
      user_id: sbUid, forma, regime, cassa: v("#ft-cassa"),
      anno_inizio: anno, coeff,
      aliquota_5: regime === "forfettario" && !!($("#ft-5") || {}).checked,
      riduzione35: regime === "forfettario" && !!($("#ft-35") || {}).checked,
      iva: regime === "ordinario" ? v("#ft-iva") : null,
      spese_anno: regime === "ordinario" && !soc ? num("#ft-spese") : null,
      perc_commercialista: perc,
      aggiornato_il: new Date().toISOString()
    };
    const q = await sb.from("gest_fisco_profilo").upsert(row, { onConflict: "user_id" }).select("user_id");
    if (q.error || !q.data || !q.data.length) {
      const m = (q.error && q.error.message) || "nessuna riga scritta";
      toast("Non salvato: " + (typeof traduciErrore === "function" ? traduciErrore(m) : m)); return;
    }
    closeSheet(); toast("Profilo salvato ✔"); renderFisco();
  }

  async function ftRicorda(d, testo, imp) {
    if (!sbUid) { toast("Devi essere loggato"); return; }
    const t = "Tasse: " + testo;
    const gia = await sb.from("promemoria").select("id").eq("user_id", sbUid).eq("data", d).eq("testo", t).is("eliminato_il", null);
    if (gia.data && gia.data.length) { toast("Ce l'hai già nei Promemoria ✔"); return; }
    const q = await sb.from("promemoria").insert({
      user_id: sbUid, testo: t, data: d, avvisa_giorni: 7,
      note: imp ? "Importo stimato: circa " + eur(+imp) + " (verifica col commercialista)" : null
    }).select("id");
    if (q.error || !q.data || !q.data.length) {
      const m = (q.error && q.error.message) || "nessuna riga scritta";
      toast("Non salvato: " + (typeof traduciErrore === "function" ? traduciErrore(m) : m)); return;
    }
    toast("Fatto ✔ Te lo ricordo 7 giorni prima, nell'email del mattino");
  }

  // ---------------------------------------------------------------------
  // IL RAVVEDIMENTO (D.Lgs. 87/2024, violazioni dal 1/9/2024)
  // ---------------------------------------------------------------------
  function ftSanzione(giorni) {
    if (giorni <= 0) return 0;
    if (giorni <= 14) return 0.0833 * giorni;
    if (giorni <= 30) return 1.25;
    if (giorni <= 90) return 1.39;
    if (giorni <= 365) return 3.125;
    if (giorni <= 730) return 3.57;
    return 4.17;
  }
  function ftInteresseLegale(imp, da, a) {
    const [y, m, d] = da.split("-").map(Number);
    const g = new Date(y, m - 1, d + 1);
    const [y2, m2, d2] = a.split("-").map(Number);
    const fine = new Date(y2, m2 - 1, d2);
    let tot = 0, giri = 0;
    while (g <= fine && giri < 5000) {
      const iso = g.getFullYear() + "-" + String(g.getMonth() + 1).padStart(2, "0") + "-" + String(g.getDate()).padStart(2, "0");
      let t = FT_LEGALE[0][1]; FT_LEGALE.forEach(r => { if (r[0] <= iso) t = r[1]; });
      tot += imp * t / 100 / 365; g.setDate(g.getDate() + 1); giri++;
    }
    return tot;
  }
  function ftRavvForm() {
    fpSheet("Ho pagato in ritardo: quanto costa?", `<div class="sh-b">
      <p>Se una tassa la paghi in ritardo <b>di tua iniziativa</b>, prima che arrivi la lettera, la multa è molto più bassa. Si chiama <b>ravvedimento operoso</b>.</p>
      <div class="row2"><div class="field"><label>Quanto dovevi pagare</label><input id="ft-r-imp" type="number" min="0" step="0.01" placeholder="Es. 1500"></div>
      <div class="field"><label>Entro quando</label><input id="ft-r-sc" type="date"></div></div>
      <div class="field"><label>Quando paghi</label><input id="ft-r-pag" type="date" value="${todayStr()}"></div>
      <div id="ft-r-out"></div>
      <div class="sh-nota">Il modello è l'F24. Codici per gli interessi: <b>1992</b> forfettario, <b>1989</b> IRPEF, <b>1991</b> IVA. La sanzione ha un suo codice (per l'IRPEF 8901, per l'IVA 8904): se non sei sicuro, fattelo compilare dal commercialista.</div>
      <p class="fp-stima">Vale per le scadenze dal 1° settembre 2024. Per i contributi INPS le regole sono diverse: chiedi al commercialista.</p>
    </div>`, `<button class="btn b-cancel" data-action="close">Chiudi</button>`);
  }
  function ftRavvCalcola() {
    const out = $("#ft-r-out"); if (!out) return;
    const imp = parseFloat(($("#ft-r-imp") || {}).value), sc = ($("#ft-r-sc") || {}).value, pag = ($("#ft-r-pag") || {}).value;
    if (!(imp > 0) || !sc || !pag) { out.innerHTML = ""; return; }
    const [a, b, c] = sc.split("-").map(Number), [d, e, f] = pag.split("-").map(Number);
    const gg = Math.round((new Date(d, e - 1, f) - new Date(a, b - 1, c)) / 86400000);
    if (gg <= 0) { out.innerHTML = `<div class="fp-cons verde"><div>${fpIc("ok")}</div><div><b>Sei in tempo</b>Se paghi entro la scadenza non c'è nessuna multa.</div></div>`; return; }
    const perc = ftSanzione(gg), sanz = imp * perc / 100, int = ftInteresseLegale(imp, sc, pag);
    const senza = imp * 25 / 100;
    out.innerHTML = `<table class="fp-tab">
      <tr><td>Giorni di ritardo</td><td><b>${gg}</b></td></tr>
      <tr><td>Multa ridotta</td><td><b>${eur(sanz)}</b> <span class="ft-grigio">(${String(Math.round(perc * 1000) / 1000).replace(".", ",")}%)</span></td></tr>
      <tr><td>Interessi</td><td><b>${eur(int)}</b></td></tr>
      <tr><td>Totale da pagare</td><td><b class="ft-grande2">${eur(imp + sanz + int)}</b></td></tr>
      </table>
      <div class="fp-cons ${gg > 90 ? "giallo" : "verde"}"><div>${fpIc("idea")}</div><div><b>${gg <= 90 ? "Paga adesso: costa poco" : "Paga il prima possibile"}</b>Se invece aspetti che ti scriva l'Agenzia, la multa può arrivare al 25% (${eur(senza)}), più gli interessi.</div></div>`;
  }
  document.addEventListener("input", function (e) {
    if (e.target && ["ft-r-imp", "ft-r-sc", "ft-r-pag"].indexOf(e.target.id) >= 0) ftRavvCalcola();
  });

  function ftLettera() {
    fpSheet("Mi è arrivata una lettera", `<div class="sh-b">
      <p><b>Prima regola: non buttarla e non aspettare.</b> Quasi tutte hanno una scadenza, e pagare presto costa meno. Guarda chi la manda e come si chiama.</p>
      <div class="ft-let"><b>${fpIc("doc")} «Comunicazione di irregolarità» (avviso bonario)</b>
        <p>La manda l'<b>Agenzia delle Entrate</b> quando dai controlli risulta una tassa non pagata o pagata male. Non è ancora una cartella.</p>
        <ul><li>Hai <b>60 giorni</b> per pagare con la multa ridotta.</li><li>Puoi pagare <b>fino a 20 rate</b> ogni 3 mesi, per qualunque importo.</li><li>Se pensi che sia sbagliata, portala subito al commercialista: si può correggere.</li></ul></div>
      <div class="ft-let"><b>${fpIc("doc")} «Cartella di pagamento»</b>
        <p>La manda l'<b>Agenzia delle Entrate-Riscossione</b> (l'ex Equitalia) quando l'avviso non è stato pagato.</p>
        <ul><li>Hai <b>60 giorni</b> per pagare o chiedere le rate.</li><li>Fino a <b>120.000 €</b> puoi chiedere <b>fino a 84 rate</b> mensili senza dimostrare niente (domande 2025–2026). Rata minima 50 €.</li><li>Attenzione: se salti <b>8 rate</b>, anche non di fila, perdi la rateizzazione.</li><li>La domanda si fa online sul sito dell'Agenzia Riscossione, anche da solo.</li></ul></div>
      <div class="ft-let"><b>${fpIc("palazzo")} Lettera dell'INPS</b>
        <p>Di solito sono contributi non pagati. Controlla nel <b>Cassetto previdenziale</b> sul sito INPS e chiama il commercialista.</p></div>
      <div class="fp-cons neutro"><div>${fpIc("foto")}</div><div><b>Fotografala: te la spiega l'AI</b>Fai una foto alla prima pagina e l'AI ti dice con parole semplici cos'è e cosa fare. <button class="fp-link" data-action="ft-vai-ai">Apri «Chiedi all'AI»</button></div></div>
      <p class="fp-stima">Informazioni generali aggiornate al 2026, non un parere. Per la tua lettera senti il commercialista.</p>
    </div>`, `<button class="btn-primary" data-action="close">Ho capito</button>`);
  }

  // ---------------------------------------------------------------------
  // 28/09/2026 — LE SCADENZE NEL CALENDARIO DEL TELEFONO (.ics)
  // Tutte le scadenze, non solo le prime 7. Ogni evento ha due avvisi del
  // telefono: 7 giorni prima e il giorno prima, alle 9. L'UID e' fisso per
  // data+testo: se lo riscarica, Google e iPhone aggiornano invece di doppiare.
  // ---------------------------------------------------------------------
  function ftIcsTesto(t) { return String(t || "").replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
  function ftIcsUid(d, t) { let h = 0; for (const c of d + t) h = (h * 31 + c.charCodeAt(0)) | 0; return "ti-fisco-" + d + "-" + (h >>> 0).toString(36) + "@trovaimpresa.com"; }
  function ftIcs() {
    if (!ftProfilo || !ftDati) { toast("Prima compila il profilo fiscale"); return; }
    const L = ftScadenze(ftProfilo, ftStima(ftProfilo, ftProiezione(ftDati.incassi).val), ftDati, true);
    if (!L.length) { toast("Nessuna scadenza da mettere"); return; }
    const ora = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const giornoDopo = d => { const [y, m, g] = d.split("-").map(Number), x = new Date(y, m - 1, g + 1); return x.getFullYear() + String(x.getMonth() + 1).padStart(2, "0") + String(x.getDate()).padStart(2, "0"); };
    const R = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//TrovaImpresa//Tasse e fisco//IT", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Tasse e fisco"];
    L.forEach(x => {
      const desc = (x.imp > 0 ? "Circa " + eur(x.imp) + " (stima: verifica col commercialista). " : "") + (x.nota || "");
      R.push("BEGIN:VEVENT", "UID:" + ftIcsUid(x.d, x.cosa), "DTSTAMP:" + ora,
        "DTSTART;VALUE=DATE:" + x.d.replace(/-/g, ""), "DTEND;VALUE=DATE:" + giornoDopo(x.d),
        "SUMMARY:" + ftIcsTesto("Tasse: " + x.cosa), "DESCRIPTION:" + ftIcsTesto(desc), "TRANSP:TRANSPARENT",
        "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + ftIcsTesto(x.cosa), "TRIGGER:-P6DT15H", "END:VALARM",
        "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + ftIcsTesto(x.cosa), "TRIGGER:-PT15H", "END:VALARM",
        "END:VEVENT");
    });
    R.push("END:VCALENDAR");
    const blob = new Blob([R.join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "scadenze-tasse.ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast("Scaricato ✔ Aprilo e scegli «Aggiungi tutti»: il telefono ti avvisa 7 giorni prima e il giorno prima");
  }

  // ---------------------------------------------------------------------
  // 28/09/2026 — «QUALE IVA METTO?»
  // Tre domande a bottoni. Le regole (DPR 633/72 e L. 488/1999):
  //  - forfettario: niente IVA, mai (neanche il reverse charge)
  //  - subappalto a un'impresa edile: reverse charge art. 17 c.6 lett. a (N6.3)
  //  - pulizie, demolizione, impianti, completamento per chi ha P.IVA:
  //    reverse charge lett. a-ter (N6.7)
  //  - manutenzione su casa: 10% (beni significativi a parte)
  //  - ristrutturazione / restauro / risanamento: 10% su tutto
  //  - casa nuova prima casa non di lusso 4%, altre case non di lusso 10%
  //  - barriere architettoniche 4%
  //  - manutenzione su negozio, ufficio, capannone: 22%
  // ---------------------------------------------------------------------
  let ftIvaStato = {};
  function ftIvaForm() {
    fpSheet("Quale IVA metto?", `<div class="sh-b"><div id="ft-iva-box"></div>
      <p class="fp-stima">Regole generali del 2026. Nei casi misti (un contratto unico per tutto l'edificio, lavori su parti di uso diverso) chiedi al commercialista.</p></div>`,
      `<button class="btn-primary" data-action="close">Chiudi</button>`);
    ftIvaDisegna();
  }
  function ftIvaDom(k, dom, opz) {
    const sc = ftIvaStato[k];
    return `<div class="ft-iva-d"><div class="ft-iva-q">${dom}</div><div class="ft-iva-o">` +
      opz.map(o => `<button class="fp-chip${sc === o[0] ? " on" : ""}" data-action="ft-iva-sc" data-k="${k}" data-v="${o[0]}">${o[1]}</button>`).join("") + `</div></div>`;
  }
  function ftIvaRis(aliq, titolo, righe, frase) {
    return `<div class="ft-iva-r"><div class="ft-iva-al">${aliq}</div><div><b>${titolo}</b>
      ${righe.map(r => `<p>${r}</p>`).join("")}
      ${frase ? `<div class="ft-iva-frase"><small>Da scrivere in fattura</small>${frase}</div>` : ""}
      <button class="fp-link" data-action="ft-iva-da-capo">Ricomincia</button></div></div>`;
  }
  function ftIvaDisegna() {
    const box = $("#ft-iva-box"); if (!box) return;
    const S = ftIvaStato, p = ftProfilo || {};
    if (p.regime === "forfettario" && !S.tutte) {
      box.innerHTML = ftIvaRis("0", "Sei forfettario: niente IVA, mai",
        ["Né 10%, né 22%, né reverse charge: anche se lavori in subappalto per un'impresa edile.",
         "Se la fattura supera <b>77,47 €</b> ci va il <b>bollo da 2 €</b>. Il gestionale lo mette nel campo «Bollo»."],
        "Operazione senza applicazione dell'IVA, effettuata ai sensi dell'art. 1, commi da 54 a 89, Legge n. 190/2014 – Regime forfettario")
        + `<p class="ft-grigio">Non sei forfettario? <button class="fp-link" data-action="ft-iva-da-capo">Rispondi alle domande</button> e poi correggi il profilo.</p>`;
      return;
    }
    let h = ftIvaDom("chi", "1. Per chi fai il lavoro?", [["privato", "Un privato o un condominio"], ["impresa", "Un'impresa edile (sono in subappalto)"], ["azienda", "Un'altra azienda, un negozio, un ente"]]);
    const fine = r => { box.innerHTML = h + r; };
    if (!S.chi) return fine("");
    if (S.chi === "impresa") return fine(ftIvaRis("RC", "Reverse charge: niente IVA in fattura",
      ["L'IVA la mette l'impresa che ti paga, non tu.",
       "<b>Attenzione ai soldi:</b> i materiali li paghi col 22% ma l'IVA non la incassi. A fine anno puoi trovarti <b>a credito IVA</b>: dillo al commercialista, si può recuperare."],
      "Inversione contabile – art. 17, comma 6, lett. a), DPR 633/72 (natura N6.3)"));
    if (S.chi === "azienda") {
      h += ftIvaDom("ater", "2. È uno di questi lavori?", [["si", "Pulizie, demolizione, impianti (elettrico, idraulico, gas, clima), completamento (intonaci, pavimenti, pitture, infissi…)"], ["no", "No, altro"]]);
      if (!S.ater) return fine("");
      if (S.ater === "si") return fine(ftIvaRis("RC", "Reverse charge: niente IVA in fattura",
        ["Per questi lavori su un edificio, se il cliente ha la partita IVA, l'IVA la mette lui. Vale anche se non sei in subappalto.",
         "Come sopra: puoi trovarti a credito IVA a fine anno."],
        "Inversione contabile – art. 17, comma 6, lett. a-ter), DPR 633/72 (natura N6.7)"));
    }
    const n = S.chi === "azienda" ? 3 : 2;
    h += ftIvaDom("lavoro", n + ". Che lavoro è?", [["manut", "Manutenzione o riparazione"], ["ristr", "Ristrutturazione, restauro, risanamento"], ["nuova", "Una casa nuova"], ["barriere", "Togliere barriere (rampe, montascale, bagno per disabili)"]]);
    if (!S.lavoro) return fine("");
    if (S.lavoro === "barriere") return fine(ftIvaRis("4%", "IVA al 4%",
      ["Vale per le opere fatte apposta per superare le barriere architettoniche."], ""));
    if (S.lavoro === "ristr") return fine(ftIvaRis("10%", "IVA al 10% su tutto",
      ["Lavoro e materiali, senza limiti.", "Serve il titolo del Comune (CILA, SCIA o permesso di costruire): tienine il numero e scrivilo in fattura."], ""));
    if (S.lavoro === "nuova") {
      h += ftIvaDom("prima", (n + 1) + ". È la prima casa del cliente?", [["si", "Sì, prima casa (non di lusso)"], ["no", "No, o non lo so"]]);
      if (!S.prima) return fine("");
      return fine(S.prima === "si"
        ? ftIvaRis("4%", "IVA al 4%", ["Fatti dare dal cliente la dichiarazione che ha i requisiti della prima casa, e tienila con la fattura."], "")
        : ftIvaRis("10%", "IVA al 10%", ["Vale per le case non di lusso. Per una casa di lusso è 22%."], ""));
    }
    h += ftIvaDom("dove", (n + 1) + ". Su che edificio?", [["casa", "Una casa o un appartamento"], ["altro", "Negozio, ufficio, capannone"]]);
    if (!S.dove) return fine("");
    if (S.dove === "altro") return fine(ftIvaRis("22%", "IVA al 22%", ["La manutenzione su edifici che non sono case va al 22%."], ""));
    return fine(ftIvaRis("10%", "IVA al 10%",
      ["Per la manutenzione (ordinaria e straordinaria) sulle case.",
       "<b>Attenzione:</b> se monti <b>caldaia, infissi, sanitari, rubinetteria, condizionatori, ascensore o videocitofono</b>: su questi pezzi il 10% vale solo fino al valore della manodopera, il resto va al 22%. Scrivi in fattura il valore di questi pezzi."], ""));
  }

  // ---------------------------------------------------------------------
  // 28/09/2026 — IL BONIFICO DEL BONUS CASA
  // ---------------------------------------------------------------------
  function ftBonusForm() {
    fpSheet("Bonifico del bonus casa", `<div class="sh-b">
      <p>Quando il cliente usa un <b>bonus casa</b> (ristrutturazioni, ecobonus…) ti paga con il <b>bonifico parlante</b>. La banca ti trattiene una parte e la manda allo Stato a nome tuo.</p>
      <div class="field"><label>Quanto ti paga il cliente (il totale della fattura)</label><input id="ft-b-imp" type="text" inputmode="decimal" placeholder="Es. 11000" data-euro></div>
      <div id="ft-b-out"></div>
      <div class="ft-let"><b>Non sono soldi persi</b>
        <ul><li>Sono tasse <b>già pagate in anticipo</b>. In dichiarazione il commercialista le toglie dalle tue tasse.</li>
        <li>Se sono più delle tue tasse, ti restano come <b>credito</b> da usare negli F24.</li>
        <li>Conserva le contabili dei bonifici e dalle al commercialista.</li></ul></div>
      <div class="fp-cons giallo"><div>${fpIc("info")}</div><div><b>Nel gestionale segna la fattura pagata per intero</b>Il cliente ha pagato tutto: la differenza l'ha presa lo Stato per te. Se segni solo quello che ti è arrivato, i conti delle tue tasse vengono sbagliati.</div></div>
      <p class="fp-stima">Ritenuta dell'${FT_RIT_BONUS}% in vigore dal 1° marzo 2024, uguale nel 2026. La banca toglie sempre il 22% di IVA prima del conto, anche se in fattura c'è il 10% o niente IVA.</p>
    </div>`, `<button class="btn-primary" data-action="close">Ho capito</button>`);
  }
  function ftBonusCalcola() {
    const out = $("#ft-b-out"); if (!out) return;
    const v = parseFloat(String(($("#ft-b-imp") || {}).value || "").replace(/\./g, "").replace(",", "."));
    if (!(v > 0)) { out.innerHTML = ""; return; }
    const rit = Math.round(v / 1.22 * FT_RIT_BONUS) / 100;
    out.innerHTML = `<table class="fp-tab">
      <tr><td>Il cliente paga</td><td><b>${eur(v)}</b></td></tr>
      <tr><td>La banca trattiene</td><td><b class="fp-rosso">− ${eur(rit)}</b> <span class="ft-grigio">(${FT_RIT_BONUS}% di ${eur(v / 1.22)})</span></td></tr>
      <tr><td>Sul tuo conto arrivano</td><td><b class="ft-grande2">${eur(v - rit)}</b></td></tr></table>`;
  }
  document.addEventListener("input", function (e) {
    if (e.target && e.target.id === "ft-b-imp") ftBonusCalcola();
  });

  document.addEventListener("click", function (e) {
    const t = e.target && e.target.closest ? e.target.closest("[data-action]") : null;
    if (!t) return;
    const a = t.dataset.action;
    if (a.indexOf("ft-") !== 0) return;
    if (a === "ft-profilo") { ftProfiloForm(); return; }
    if (a === "ft-salva")   { ftSalvaProfilo(); return; }
    if (a === "ft-ricorda") { ftRicorda(t.dataset.d, t.dataset.t, t.dataset.i); return; }
    if (a === "ft-ravv")    { ftRavvForm(); return; }
    if (a === "ft-lettera") { ftLettera(); return; }
    if (a === "ft-vai-ai")  { closeSheet(); fpSezione = "ai"; renderFisco(); return; }
    if (a === "ft-ics")     { ftIcs(); return; }
    if (a === "ft-sc-tutte") {
      ftScTutte = !ftScTutte;
      const L = $("#fisco .ft-sc-lista"); if (L) L.classList.toggle("tutte", ftScTutte);
      t.textContent = ftScTutte ? "Mostra meno" : "Vedi tutte (" + document.querySelectorAll("#fisco .ft-sc").length + ")";
      return;
    }
    if (a === "ft-sc-nota") { t.classList.toggle("aperta"); return; }
    if (a === "ft-iva")     { ftIvaStato = {}; ftIvaForm(); return; }
    if (a === "ft-iva-sc")  { ftIvaStato[t.dataset.k] = t.dataset.v; ftIvaDisegna(); return; }
    if (a === "ft-iva-da-capo") { ftIvaStato = { tutte: "1" }; ftIvaDisegna(); return; }
    if (a === "ft-bonus")   { ftBonusForm(); return; }
  });
