/* ═══ TASSE E FISCO — «CHI PAGA PIÙ TASSE?» ═══════════════════════════════
   15 novembre 2026. Chiesto da Alessio: «quante imposte devo pagare da
   forfettario, ordinario o srl».

   A CHE SERVE
   Uno scrive quanto incassa e quanto spende in un anno, e vede affiancati
   forfettario, ordinario, Srl e dipendente: tasse + contributi, e quanto gli resta.

   ⛔ I CONTI DI FORFETTARIO E ORDINARIO NON SONO RIFATTI: e' ftStima() di
      gest-fisco-tasse.js, la stessa di «Le tue tasse». Se cambia la', cambia
      anche qui.
   ⛔ LA SRL QUI SI CALCOLA, MA CON UN'IPOTESI SOLA E SCRITTA SOTTO: un socio
      solo che lavora, tutto l'utile tirato fuori come dividendo. Nel resto
      del reparto per le societa' si continua a usare la % del commercialista.
   ⛔ E' UNA STIMA E LO DICE. Niente detrazioni, niente addizionali.

   Numeri di legge della Srl, verificati il 15/11/2026:
     IRES 24% (il 20% «premiale» non e' stato prorogato al 2026)
     IRAP 3,9% di base (le Regioni la spostano: Lazio 4,82%)
     dividendi al socio: 26%
   Si apre dal pulsante in «Ti serve aiuto?»: data-action="fc-apri".
   ═════════════════════════════════════════════════════════════════════════ */

  const FC_IRES = 24, FC_IRAP = 3.9, FC_DIVIDENDI = 26;
  /* IL DIPENDENTE (aggiunto il 15/11/2026, chiesto da Alessio) — regole 2026:
     contributi in busta paga 9,19% (un punto in piu' sopra 56.224 €);
     detrazione da lavoro dipendente: 1.955 € fino a 15.000; poi
     1.910 + 1.190 × (28.000 − r) / 13.000 fino a 28.000; poi
     1.910 × (50.000 − r) / 22.000 fino a 50.000; +65 € fra 25.000 e 35.000;
     taglio del cuneo: fino a 20.000 una somma in piu' (7,1% / 5,3% / 4,8%),
     fra 20.000 e 32.000 altri 1.000 € di detrazione, che calano a zero a 40.000.
     NON c'e' il trattamento integrativo (i 100 € al mese dei redditi bassi). */
  const FC_DIP_INPS = 9.19;
  /* LA CASSA EDILE (aggiunta il 15/11/2026: «inserisci se il dipendente e' in
     cassa edile tutte le spese che comporta»).
     Percentuali della Cassa Edile di RIETI in vigore dal 1/1/2026 (tabella
     ufficiale cassaedilerieti.it): totale contributi 8,9244% di cui 7,5272%
     ditta e 1,3972% operaio; in piu' alla ditta fondo sanitario 0,60% e RLST
     0,30%. Cambiano da provincia a provincia, di poco.
     Si pagano sulla paga delle ore lavorate: qui lo stipendio lordo dell'anno
     comprende gia' ferie e gratifica (la maggiorazione del 18,5% che passa
     dalla Cassa), quindi la base e' lordo / 1,185.
     ⛔ INPS e INAIL della ditta sono «circa»: INPS 33,68% e' l'industria edile
        fino a 15 dipendenti (operai, totale 42,87% meno il 9,19% dell'operaio),
        l'artigianato paga qualcosa meno; INAIL 7,5% e' un'ipotesi media per
        l'edilizia, il tasso vero e' sulla posizione INAIL della ditta.
        Lo sconto edile dell'11,50% non e' contato. TFR = lordo / 13,5. */
  const FC_CE = { ditta: 7.5272 + 0.60 + 0.30, operaio: 1.3972, maggiorazione: 18.5 };
  const FC_DITTA = { inps: 33.68, inail: 7.5, tfr: 13.5 };
  const FC_TASTI = [20000, 30000, 40000, 50000, 60000, 85000];

  let fcStato = null;

  /* i punti delle migliaia messi a mano: il browser a «9726» non li mette */
  function fcP(n) { return String(Math.round(+n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  /* lo spazio prima di € non va mai a capo (sul telefono stretto il € restava da solo) */
  function fcE(n) { return fcP(n) + "\u00a0€"; }
  /* 18 nov 2026 — all'italiana: prima si buttava via tutto quello che non era
     una cifra, e «40.000,50» diventava 4.000.050 €. Adesso i centesimi si
     tagliano (qui si ragiona in euro tondi). */
  function fcNum(v) { const n = typeof fpNum === "function" ? fpNum(v) : +String(v == null ? "" : v).replace(/[^\d]/g, ""); return n > 0 ? Math.floor(n) : 0; }
  /* una percentuale scritta a mano: «33,68», «7.5», «7,5 %» */
  function fcPerc(v) { const n = parseFloat(String(v == null ? "" : v).replace(",", ".").replace(/[^\d.]/g, "")); return isFinite(n) ? Math.min(100, Math.max(0, n)) : 0; }
  function fcPercTesto(n) { return String(Math.round(n * 100) / 100).replace(".", ","); }
  /* INPS e INAIL della ditta li puo' cambiare l'impresa (15/11/2026): restano
     ricordati su questo telefono/computer, non nel database */
  function fcRicorda(S) { try { localStorage.setItem("ti_fc_ditta", JSON.stringify({ inps: S.inps, inail: S.inail })); } catch (e) {} }
  function fcRicordati() { try { const r = JSON.parse(localStorage.getItem("ti_fc_ditta") || "null"); if (r && isFinite(+r.inps) && isFinite(+r.inail)) return { inps: fcPerc(r.inps), inail: fcPerc(r.inail) }; } catch (e) {} return null; }
  function fcPro() { return typeof ruoloUtente !== "undefined" && ruoloUtente === "professionista"; }

  /* la cassa da usare: quella del profilo, se la conosciamo */
  function fcCassa() {
    const p = (typeof ftProfilo !== "undefined" && ftProfilo) || {};
    if (p.cassa && p.cassa !== "altra") return p.cassa;
    return fcPro() ? "separata" : "artigiani";
  }

  /* Srl con un socio solo che ci lavora e si prende tutto l'utile */
  function fcSrl(incassi, spese, cassa) {
    const utile = Math.max(0, incassi - spese);
    const ires = utile * FC_IRES / 100, irap = utile * FC_IRAP / 100;
    const dividendi = (utile - ires - irap) * FC_DIVIDENDI / 100;
    const c = ftContributi({ cassa: cassa === "commercianti" ? "commercianti" : "artigiani", regime: "ordinario" }, utile);
    return { imposta: ires + irap + dividendi, contrib: c.tot, totale: ires + irap + dividendi + c.tot, ires, irap, dividendi };
  }

  /* dipendente con lo stipendio lordo uguale al guadagno (incassi − spese) */
  function fcDip(lordo, ce, inps, inail) {
    const contrib = Math.min(lordo, FT_SCAGLIONE_INPS) * FC_DIP_INPS / 100 + Math.max(0, lordo - FT_SCAGLIONE_INPS) * (FC_DIP_INPS + 1) / 100;
    const r = lordo - contrib;
    let det = r <= 15000 ? 1955 : r <= 28000 ? 1910 + 1190 * (28000 - r) / 13000 : r <= 50000 ? 1910 * (50000 - r) / 22000 : 0;
    if (r > 25000 && r <= 35000) det += 65;
    const ult = r > 20000 && r <= 32000 ? 1000 : r > 32000 && r <= 40000 ? 1000 * (40000 - r) / 8000 : 0;
    const bonus = r <= 8500 ? r * 7.1 / 100 : r <= 15000 ? r * 5.3 / 100 : r <= 20000 ? r * 4.8 / 100 : 0;
    const irpef = Math.max(0, ftIrpef(r) - det - ult);
    const d = { irpef, bonus, imposta: irpef - bonus, contrib, totale: irpef - bonus + contrib, cassa: 0, ditta: null };
    if (ce) {
      const base = lordo / (1 + FC_CE.maggiorazione / 100);
      d.cassa = base * FC_CE.operaio / 100;
      d.contrib += d.cassa; d.totale += d.cassa;
      const v = { lordo, inps: lordo * (inps == null ? FC_DITTA.inps : inps) / 100, inail: lordo * (inail == null ? FC_DITTA.inail : inail) / 100, cassa: base * FC_CE.ditta / 100, tfr: lordo / FC_DITTA.tfr };
      v.totale = v.lordo + v.inps + v.inail + v.cassa + v.tfr;
      d.ditta = v;
    }
    return d;
  }

  /* le strade, sugli stessi incassi e sulle stesse spese */
  function fcCalcola(S) {
    const cassa = fcCassa(), pro = fcPro(), forma = pro ? "professionista" : "ditta";
    const p0 = (typeof ftProfilo !== "undefined" && ftProfilo) || {};
    const coeff = +p0.coeff || (pro ? 78 : 86);
    const sconto35 = cassa === "artigiani" || cassa === "commercianti";
    const out = [];

    const f = ftStima({ forma, regime: "forfettario", cassa, coeff, aliquota_5: !!S.a5, riduzione35: sconto35 && !!S.r35 }, S.inc);
    out.push({ k: "forf", nome: "Forfettario", sotto: "imposta " + (S.a5 ? 5 : 15) + "%", imposta: f.imposta, contrib: f.contrib.tot, totale: f.totale,
               no: S.inc > FT_SOGLIA_FORF ? "Sopra " + fcE(FT_SOGLIA_FORF) + " di incassi non si può" : "" });

    const o = ftStima({ forma, regime: "ordinario", cassa, spese_anno: S.spese }, S.inc);
    out.push({ k: "ord", nome: "Ordinario", sotto: "IRPEF a scaglioni", imposta: o.imposta, contrib: o.contrib.tot, totale: o.totale, no: "" });

    if (!pro) {
      const s = fcSrl(S.inc, S.spese, cassa);
      out.push({ k: "srl", nome: "Srl", sotto: "IRES, IRAP e dividendi", imposta: s.imposta, contrib: s.contrib, totale: s.totale, no: "" });
    }
    /* lo studio tecnico non ha l'operaio in cassa edile (il pulsante non c'e') */
    const d = fcDip(Math.max(0, S.inc - S.spese), !!S.ce && !pro, S.inps, S.inail);
    out.push({ k: "dip", nome: "Dipendente", sotto: S.ce ? "busta paga con cassa edile" : "busta paga, stesso guadagno", imposta: d.imposta, contrib: d.contrib, totale: d.totale, ditta: d.ditta, no: "" });
    out.forEach(x => { x.resta = S.inc - S.spese - x.totale; });
    return out;
  }

  function fcForm() {
    const p = (typeof ftProfilo !== "undefined" && ftProfilo) || {};
    if (!fcStato) fcStato = { inc: 40000, spese: +p.spese_anno || 0, r35: true, a5: !!p.aliquota_5, ce: !fcPro() };
    if (fcPro()) fcStato.ce = false;
    if (fcStato.inps == null) { const r = fcRicordati() || FC_DITTA; fcStato.inps = r.inps; fcStato.inail = r.inail; }
    const S = fcStato, cassa = fcCassa(), sconto35 = cassa === "artigiani" || cassa === "commercianti";
    fpSheet("Chi paga più tasse?", `<div class="sh-cols"><div class="sh-col"><div class="sh-b fc"><div class="sh-tit">I tuoi numeri</div>
        <div class="fc-q">Quanto incassi in un anno?</div>
        <div class="fc-tasti">${FC_TASTI.map(v => `<button class="fp-chip" data-action="fc-tasto" data-v="${v}">${v / 1000} mila</button>`).join("")}</div>
        <div class="fc-campi">
          <div class="field"><label for="fc-inc">Oppure scrivi la tua cifra</label><input id="fc-inc" inputmode="numeric" autocomplete="off" value="${fcP(S.inc)}"></div>
          <div class="field"><label for="fc-spese">Quanto spendi per lavorare</label><input id="fc-spese" inputmode="numeric" autocomplete="off" value="${S.spese ? fcP(S.spese) : ""}" placeholder="Materiali, furgone, attrezzi"></div>
        </div>
        <div class="fc-tasti fc-opz">
          ${sconto35 ? `<button class="fp-chip" data-action="fc-opz" data-k="r35">Sconto 35% INPS</button>` : ""}
          <button class="fp-chip" data-action="fc-opz" data-k="a5">Primi 5 anni (5%)</button>
          ${fcPro() ? "" : `<button class="fp-chip" data-action="fc-opz" data-k="ce">Dipendente in cassa edile</button>`}
        </div>
        <div class="fc-campi" id="fc-ditta-campi">
          <div class="field"><label for="fc-inps">INPS della ditta (%)</label><input id="fc-inps" inputmode="decimal" autocomplete="off" value="${fcPercTesto(S.inps)}"></div>
          <div class="field"><label for="fc-inail">INAIL della ditta (%)</label><input id="fc-inail" inputmode="decimal" autocomplete="off" value="${fcPercTesto(S.inail)}"></div>
        </div>
      </div></div><div class="sh-col"><div class="sh-b fc"><div class="sh-tit">Il confronto</div>
        <div id="fc-ris"></div>
      </div></div></div>`,
      `<button class="btn-primary" data-action="close">Chiudi</button>`);
    fcAggiorna();
  }

  function fcAggiorna() {
    const box = $("#fc-ris"); if (!box) return;
    const S = fcStato;
    document.querySelectorAll('[data-action="fc-tasto"]').forEach(b => b.classList.toggle("on", +b.dataset.v === S.inc));
    document.querySelectorAll('[data-action="fc-opz"]').forEach(b => b.classList.toggle("on", !!S[b.dataset.k]));
    const dc = $("#fc-ditta-campi"); if (dc) dc.hidden = !S.ce;
    if (!S.inc) { box.innerHTML = ""; return; }

    const R = fcCalcola(S), buoni = R.filter(x => !x.no);
    const max = Math.max(1, ...buoni.map(x => x.totale));
    const primo = buoni.slice().sort((a, b) => a.totale - b.totale)[0];
    const ultimo = buoni.slice().sort((a, b) => b.totale - a.totale)[0];

    let h = R.map(x => x.no
      ? `<div class="fc-riga no"><div class="fc-nome"><b>${x.nome}</b><small>${x.no}</small></div></div>`
      : `<div class="fc-riga${x === primo ? " meglio" : ""}">
          <div class="fc-nome"><b>${x.nome}</b><small>${x.sotto}</small></div>
          <div class="fc-cifra"><small>tasse e contributi</small><b>${fcE(x.totale)}</b></div>
          <div class="fc-barra"><i style="width:${Math.max(3, Math.round(x.totale / max * 100))}%"></i></div>
          <div class="fc-dett"><span>imposte ${fcE(x.imposta)} · contributi ${fcE(x.contrib)}</span><span class="fc-resta">ti restano <b>${fcE(x.resta)}</b></span></div>
          ${x.ditta ? `<div class="fc-ditta"><div class="fc-ditta-t"><span>Alla ditta questo operaio costa, circa</span><b>${fcE(x.ditta.totale)}</b></div>
            <div><span>Stipendio lordo</span><span>${fcE(x.ditta.lordo)}</span></div>
            <div><span>INPS della ditta (${fcPercTesto(S.inps)}%)</span><span>${fcE(x.ditta.inps)}</span></div>
            <div><span>INAIL (${fcPercTesto(S.inail)}%)</span><span>${fcE(x.ditta.inail)}</span></div>
            <div><span>Cassa edile</span><span>${fcE(x.ditta.cassa)}</span></div>
            <div><span>TFR (liquidazione)</span><span>${fcE(x.ditta.tfr)}</span></div></div>` : ""}
        </div>`).join("");

    if (buoni.length > 1 && ultimo.totale - primo.totale >= 1)
      h += `<div class="fc-esito">${fpIc("euro")}<div><b>Paghi meno da ${{ forf: "forfettario", ord: "ordinario", srl: "Srl", dip: "dipendente" }[primo.k]}</b>
        ${fcE(ultimo.totale - primo.totale)} in meno ${{ forf: "del forfettario", ord: "dell'ordinario", srl: "della Srl", dip: "del dipendente" }[ultimo.k]}, ogni anno.</div></div>`;

    h += `<p class="fp-stima">${fpIc("bilancia")} È una <b>stima</b> con le regole del 2026, senza addizionali. Il dipendente ha lo stipendio lordo uguale al tuo guadagno (incassi meno spese), con le detrazioni e il bonus della busta paga; per gli altri niente detrazioni.`
      + (R.some(x => x.k === "srl") ? ` La Srl è contata con un socio solo che ci lavora e tira fuori tutto l'utile; non ci sono i costi in più della società (notaio, commercialista).` : "")
      + (S.ce ? ` Cassa edile: percentuali di Rieti del 2026; INPS e INAIL della ditta partono da una media dell'edilizia: metti le tue.` : "")
      + ` Il conto vero lo fa il tuo commercialista.</p>`;
    box.innerHTML = h;
  }

  document.addEventListener("click", e => {
    const t = e.target.closest("[data-action]"); if (!t) return;
    const a = t.dataset.action;
    if (a === "fc-apri") { fcForm(); return; }
    if (a === "fc-tasto") { fcStato.inc = +t.dataset.v; const i = $("#fc-inc"); if (i) i.value = fcP(fcStato.inc); fcAggiorna(); return; }
    if (a === "fc-opz") { fcStato[t.dataset.k] = !fcStato[t.dataset.k]; fcAggiorna(); return; }
  });
  document.addEventListener("input", e => {
    const t = e.target; if (!fcStato || !t) return;
    if (t.id === "fc-inps" || t.id === "fc-inail") { fcStato[t.id.slice(3)] = fcPerc(t.value); fcRicorda(fcStato); fcAggiorna(); return; }
    if (t.id !== "fc-inc" && t.id !== "fc-spese") return;
    fcStato[t.id === "fc-inc" ? "inc" : "spese"] = fcNum(t.value);
    fcAggiorna();
  });
