/* ═══ 29 settembre 2026 — FATTURA DEL NOLEGGIO ALLO SDI ═════════════════════
   Il pulsante «Invia allo SDI» dentro la scheda della fattura del Noleggio
   (tabella nol_fatture). Stessa funzione sul server del gestionale imprese
   (netlify/functions/sdi.js, con tabella:"nol_fatture"): cambia solo come
   si prepara il file, perche' le fatture del noleggio hanno una forma piu'
   semplice: righe con un importo, UNA sola aliquota IVA, niente ritenuta.

   Il codice del noleggio sta dentro una (function(){...}): sb e sbUid da qui
   non si vedono, quindi il file si fa il suo collegamento a Supabase (stessa
   chiave pubblica, stessa sessione). Il pulsante lo scrive la scheda nel
   file gestionale-noleggio.html con l'attributo data-nol-sdi="<id>".

   REGOLE
   - IVA a 0%: il file NON si fa. Lo SDI vuole sapere PERCHE' (reverse charge
     del nolo a caldo = codice N6.x) e il gestionale non puo' indovinarlo.
   - Prima di mandare si controlla tutto quello che lo SDI controllerebbe.
   - Una fattura gia' partita non riparte (solo se e' stata scartata).
   - Il file va comunque provato una volta nel validatore gratuito
     dell'Agenzia delle Entrate prima di accendere l'invio vero.
   ═════════════════════════════════════════════════════════════════════════ */
(function () {
  var URL_SB = "https://nacvrsgkyfavykxjxszu.supabase.co";
  var KEY_SB = "sb_publishable_TnPNRwYVQu3IlwY4GpZsUg_okv0sI0R";
  var OK_KEY = "ti-sdi-autorizzo";
  var LAB = {
    inviata: "Partita, aspettiamo lo SDI",
    consegnata: "Consegnata al cliente",
    non_consegnata: "Nel cassetto fiscale del cliente",
    scartata: "Scartata dallo SDI",
    errore: "Non partita"
  };
  var sb = null;

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function xesc(s) { return esc(s).replace(/'/g, "&apos;"); }
  function taglia(v, n) { return String(v == null ? "" : v).trim().slice(0, n); }
  function pul(v) { return String(v || "").replace(/[^0-9A-Za-z]/g, "").toUpperCase(); }
  function num(v) { return (Math.round((+v || 0) * 100) / 100).toFixed(2); }
  function fd(d) { var p = String(d || "").slice(0, 10).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : ""; }
  function pivaOk(v) {
    if (!/^\d{11}$/.test(v)) return false;
    var s = 0;
    for (var i = 0; i < 11; i++) { var d = +v[i]; if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; } s += d; }
    return s % 10 === 0;
  }
  function toast(t) {
    var e = document.getElementById("toast");
    if (e) { e.textContent = t; e.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(function () { e.classList.remove("show"); }, 3500); }
  }

  /* ---- la finestra: una sola, semplice, sopra tutto ---- */
  function finestra(titolo, corpo, pulsanti) {
    chiudi();
    var w = document.createElement("div");
    w.id = "nsdi-fin";
    w.innerHTML = '<div class="nsdi-box" role="dialog" aria-modal="true"><div class="nsdi-tit">' + esc(titolo) + '</div>'
      + '<div class="nsdi-corpo">' + corpo + '</div><div class="nsdi-pul">' + pulsanti + '</div></div>';
    document.body.appendChild(w);
  }
  function chiudi() { var w = document.getElementById("nsdi-fin"); if (w) w.remove(); }

  function rigaStato(f) {
    if (!f.sdi_stato) return "";
    var t = f.sdi_stato === "consegnata" ? "ok" : (f.sdi_stato === "scartata" || f.sdi_stato === "errore") ? "err" : "attesa";
    return '<div class="nsdi-stato nsdi-' + t + '"><b>' + esc(LAB[f.sdi_stato] || f.sdi_stato) + '</b>'
      + (f.sdi_esito ? '<span>' + esc(f.sdi_esito) + '</span>' : '')
      + (f.sdi_inviata_il ? '<small>Partita il ' + esc(fd(f.sdi_inviata_il)) + (f.sdi_ambiente === "test" ? ' · PROVA, non è andata davvero allo SDI' : '') + '</small>' : '')
      + '</div>';
  }

  async function chiama(corpo) {
    var r0 = await sb.auth.getSession();
    var tok = r0 && r0.data && r0.data.session ? r0.data.session.access_token : null;
    if (!tok) return { error: "Accesso scaduto: ricarica la pagina." };
    try {
      var r = await fetch("/.netlify/functions/sdi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.assign({ access_token: tok, tabella: "nol_fatture" }, corpo))
      });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok && !j.error) j.error = "Errore " + r.status;
      return j;
    } catch (e) { return { error: "Nessuna connessione. Riprova fra poco." }; }
  }

  /* ---- i dati che servono, presi freschi dal database ---- */
  async function carica(id) {
    var r0 = await sb.auth.getSession();
    var uid = r0 && r0.data && r0.data.session ? r0.data.session.user.id : null;
    if (!uid) return null;
    var f = (await sb.from("nol_fatture").select("*").eq("id", id).eq("user_id", uid).maybeSingle()).data;
    if (!f) return null;
    var az = (await sb.from("gest_azienda").select("*").eq("user_id", uid).maybeSingle()).data || {};
    var cli = f.cliente_id ? ((await sb.from("gest_clienti").select("*").eq("id", f.cliente_id).eq("user_id", uid).maybeSingle()).data || {}) : {};
    return { f: f, az: az, cli: cli };
  }

  /* ---- il controllo: quello che lo SDI controllerebbe ---- */
  function controllo(D) {
    var f = D.f, az = D.az, cli = D.cli, m = [];
    var righe = (Array.isArray(f.righe) ? f.righe : []).filter(function (r) { return String(r.voce || "").trim() || (+r.importo || 0); });
    if (!f.numero) m.push("La fattura è ancora una bozza: prima va emessa, così prende il numero.");
    if (!f.data) m.push("Manca la data della fattura.");
    if (!righe.length) m.push("La fattura non ha nessuna riga.");
    righe.forEach(function (r, i) { if (!String(r.voce || "").trim()) m.push("La riga n. " + (i + 1) + " non ha descrizione."); });
    if (!(+f.iva_perc > 0)) m.push("L'IVA è a 0%. Lo SDI in questo caso vuole sapere PERCHÉ (per il nolo a caldo in edilizia è il reverse charge, con un codice preciso) e il gestionale non può indovinarlo. Per ora questa fattura va mandata dal commercialista.");
    var imp = Math.round((+f.imponibile || 0) * 100), iva = Math.round((+f.iva || 0) * 100), perc = +f.iva_perc || 0;
    if (Math.abs(iva - Math.round(imp * perc / 100)) > 1) m.push("L'IVA scritta non torna con imponibile e aliquota. Apri la fattura e salvala di nuovo.");

    if (!String(az.nome || "").trim()) m.push("Manca il nome della tua azienda — Dati azienda.");
    var ap = pul(az.piva);
    if (!ap) m.push("Manca la tua partita IVA — Dati azienda.");
    else if (!/^\d{11}$/.test(ap)) m.push("La tua partita IVA è di " + ap.length + " cifre, ma una partita IVA italiana ne ha 11 — Dati azienda.");
    else if (!pivaOk(ap)) m.push("La tua partita IVA ha 11 cifre ma non è valida: la cifra di controllo non torna — Dati azienda.");
    if (!String(az.regime_fiscale || "").trim()) m.push("Manca il tuo regime fiscale — Dati azienda.");
    if (!String(az.indirizzo || "").trim()) m.push("Manca la via della tua sede — Dati azienda.");
    if (!/^\d{5}$/.test(String(az.cap || "").trim())) m.push("Il CAP della tua sede manca o non è di 5 cifre — Dati azienda.");
    if (!String(az.citta || "").trim()) m.push("Manca la città della tua sede — Dati azienda.");

    if (!f.cliente_id) m.push("La fattura non ha un cliente.");
    else {
      var cp = pul(cli.piva), cc = pul(cli.cod_fiscale);
      if (!cp && !cc) m.push("Il cliente non ha né partita IVA né codice fiscale — apri la sua scheda in Clienti.");
      if (cp && !/^\d{11}$/.test(cp)) m.push("La partita IVA del cliente è di " + cp.length + " cifre invece di 11 — Clienti.");
      else if (cp && !pivaOk(cp)) m.push("La partita IVA del cliente ha 11 cifre ma non è valida — Clienti.");
      if (cc && !/^(\d{11}|[A-Z0-9]{16})$/.test(cc)) m.push("Il codice fiscale del cliente non ha una forma valida — Clienti.");
      if (!String(cli.indirizzo || "").trim()) m.push("Manca la via del cliente — Clienti.");
      if (!/^\d{5}$/.test(String(cli.cap || "").trim())) m.push("Il CAP del cliente manca o non è di 5 cifre — Clienti.");
      if (!String(cli.citta || "").trim()) m.push("Manca la città del cliente — Clienti.");
      var sd = String(cli.sdi_codice || "").trim(), pc = String(cli.sdi_pec || "").trim();
      if (!sd && !pc) m.push("Il cliente non ha né codice destinatario né PEC. Se non li ha davvero, scrivi 0000000 nel codice destinatario — Clienti.");
      if (sd && sd !== "0000000" && sd.length !== 7) m.push("Il codice destinatario del cliente deve essere di 7 caratteri (o 0000000) — Clienti.");
    }
    return m;
  }

  /* ---- il file (FatturaPA 1.2.2, FPR12) ---- */
  function costruisci(D) {
    var f = D.f, az = D.az, cli = D.cli;
    var righe = (Array.isArray(f.righe) ? f.righe : []).filter(function (r) { return String(r.voce || "").trim() || (+r.importo || 0); });
    var piva = pul(az.piva), cPiva = pul(cli.piva), cCf = pul(cli.cod_fiscale);
    var sd = String(cli.sdi_codice || "").trim(), pec = String(cli.sdi_pec || "").trim();
    var dest = sd || "0000000";
    var prog = Date.now().toString(36).toUpperCase().slice(-8);   /* identifica l'INVIO, diverso a ogni tentativo */
    var sede = function (o) {
      return "        <Indirizzo>" + xesc(taglia(o.indirizzo, 60)) + "</Indirizzo>\n"
        + "        <CAP>" + xesc(String(o.cap || "").trim()) + "</CAP>\n"
        + "        <Comune>" + xesc(taglia(o.citta, 60)) + "</Comune>\n"
        + (String(o.prov || "").trim() ? "        <Provincia>" + xesc(String(o.prov).trim().toUpperCase()) + "</Provincia>\n" : "")
        + "        <Nazione>IT</Nazione>\n";
    };
    var perc = +f.iva_perc || 0;
    var x = '<?xml version="1.0" encoding="UTF-8"?>\n';
    x += '<p:FatturaElettronica versione="FPR12"'
      + ' xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2"'
      + ' xmlns:ds="http://www.w3.org/2000/09/xmldsig#"'
      + ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
      + ' xsi:schemaLocation="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2'
      + ' http://www.fatturapa.gov.it/export/fatturazione/sdi/fatturapa/v1.2.2/Schema_del_file_xml_FatturaPA_versione_1.2.2.xsd">\n';
    x += "  <FatturaElettronicaHeader>\n    <DatiTrasmissione>\n";
    x += "      <IdTrasmittente>\n        <IdPaese>IT</IdPaese>\n        <IdCodice>" + xesc(piva) + "</IdCodice>\n      </IdTrasmittente>\n";
    x += "      <ProgressivoInvio>" + xesc(prog) + "</ProgressivoInvio>\n      <FormatoTrasmissione>FPR12</FormatoTrasmissione>\n";
    x += "      <CodiceDestinatario>" + xesc(dest) + "</CodiceDestinatario>\n";
    if (dest === "0000000" && pec) x += "      <PECDestinatario>" + xesc(pec) + "</PECDestinatario>\n";
    x += "    </DatiTrasmissione>\n    <CedentePrestatore>\n      <DatiAnagrafici>\n";
    x += "        <IdFiscaleIVA>\n          <IdPaese>IT</IdPaese>\n          <IdCodice>" + xesc(piva) + "</IdCodice>\n        </IdFiscaleIVA>\n";
    if (pul(az.cod_fiscale)) x += "        <CodiceFiscale>" + xesc(pul(az.cod_fiscale)) + "</CodiceFiscale>\n";
    x += "        <Anagrafica>\n          <Denominazione>" + xesc(taglia(az.nome, 80)) + "</Denominazione>\n        </Anagrafica>\n";
    x += "        <RegimeFiscale>" + xesc(az.regime_fiscale || "RF01") + "</RegimeFiscale>\n      </DatiAnagrafici>\n      <Sede>\n" + sede(az) + "      </Sede>\n    </CedentePrestatore>\n";
    x += "    <CessionarioCommittente>\n      <DatiAnagrafici>\n";
    if (cPiva) x += "        <IdFiscaleIVA>\n          <IdPaese>IT</IdPaese>\n          <IdCodice>" + xesc(cPiva) + "</IdCodice>\n        </IdFiscaleIVA>\n";
    if (cCf) x += "        <CodiceFiscale>" + xesc(cCf) + "</CodiceFiscale>\n";
    x += "        <Anagrafica>\n          <Denominazione>" + xesc(taglia(f.cliente || cli.nome, 80)) + "</Denominazione>\n        </Anagrafica>\n      </DatiAnagrafici>\n      <Sede>\n" + sede(cli) + "      </Sede>\n    </CessionarioCommittente>\n";
    x += "  </FatturaElettronicaHeader>\n  <FatturaElettronicaBody>\n    <DatiGenerali>\n      <DatiGeneraliDocumento>\n";
    x += "        <TipoDocumento>TD01</TipoDocumento>\n        <Divisa>EUR</Divisa>\n        <Data>" + xesc(String(f.data).slice(0, 10)) + "</Data>\n        <Numero>" + xesc(String(f.numero)) + "</Numero>\n";
    x += "        <ImportoTotaleDocumento>" + num(f.totale) + "</ImportoTotaleDocumento>\n";
    var causale = taglia(f.note, 200);
    if (causale) x += "        <Causale>" + xesc(causale) + "</Causale>\n";
    x += "      </DatiGeneraliDocumento>\n    </DatiGenerali>\n    <DatiBeniServizi>\n";
    righe.forEach(function (r, i) {
      var d = taglia(r.voce, 900) + (String(r.dettaglio || "").trim() ? " — " + taglia(r.dettaglio, 90) : "");
      x += "      <DettaglioLinee>\n        <NumeroLinea>" + (i + 1) + "</NumeroLinea>\n        <Descrizione>" + xesc(taglia(d, 1000)) + "</Descrizione>\n";
      x += "        <Quantita>1.00</Quantita>\n        <PrezzoUnitario>" + num(r.importo) + "</PrezzoUnitario>\n        <PrezzoTotale>" + num(r.importo) + "</PrezzoTotale>\n";
      x += "        <AliquotaIVA>" + num(perc) + "</AliquotaIVA>\n      </DettaglioLinee>\n";
    });
    x += "      <DatiRiepilogo>\n        <AliquotaIVA>" + num(perc) + "</AliquotaIVA>\n        <ImponibileImporto>" + num(f.imponibile) + "</ImponibileImporto>\n";
    x += "        <Imposta>" + num(f.iva) + "</Imposta>\n        <EsigibilitaIVA>I</EsigibilitaIVA>\n      </DatiRiepilogo>\n    </DatiBeniServizi>\n";
    var iban = pul(az.iban);
    if (/^IT\d{2}[A-Z]\d{10}[A-Z0-9]{12}$/.test(iban)) {
      x += "    <DatiPagamento>\n      <CondizioniPagamento>TP02</CondizioniPagamento>\n      <DettaglioPagamento>\n        <ModalitaPagamento>MP05</ModalitaPagamento>\n";
      x += "        <ImportoPagamento>" + num(f.totale) + "</ImportoPagamento>\n        <IBAN>" + xesc(iban) + "</IBAN>\n      </DettaglioPagamento>\n    </DatiPagamento>\n";
    }
    x += "  </FatturaElettronicaBody>\n</p:FatturaElettronica>\n";
    return x;
  }

  /* ---- le tre finestre ---- */
  async function apri(id) {
    var D = await carica(id);
    if (!D) { toast("Fattura non trovata"); return; }
    var f = D.f;

    if (f.sdi_uuid && f.sdi_stato !== "scartata") {
      finestra("Fattura n. " + (f.numero || "") + " allo SDI", rigaStato(f),
        '<button type="button" class="nsdi-b" data-nsdi-chiudi="1">Chiudi</button>'
        + '<button type="button" class="nsdi-b nsdi-b-p" data-nsdi-agg="' + esc(id) + '">Aggiorna lo stato</button>');
      return;
    }
    var m = controllo(D);
    if (m.length) {
      finestra("Non posso ancora mandarla allo SDI",
        '<div class="nsdi-nota">Lo SDI rifiuta la fattura se anche una sola di queste cose non c\'è. Meglio saperlo adesso.</div>'
        + '<ul class="nsdi-elenco">' + m.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>",
        '<button type="button" class="nsdi-b nsdi-b-p" data-nsdi-chiudi="1">Ho capito</button>');
      return;
    }
    var amb = await chiama({ azione: "conto" });
    var prova = amb && amb.ambiente === "test";
    /* gestionale gratis: servono gli invii del pacchetto (anche in prova, cosi la finestra si vede subito) */
    var aPacchetto = !!amb && amb.incluso === false;
    if (aPacchetto && !(amb.residuo > 0)) { vendi(prova, id); return; }
    var gia = false; try { gia = localStorage.getItem(OK_KEY) === "1"; } catch (_) {}
    finestra("Invia allo SDI",
      (prova ? '<div class="nsdi-prova"><b>Siamo in PROVA.</b> La fattura va al finto SDI di Openapi: non arriva al cliente e non vale per il Fisco.</div>' : "")
      + (f.sdi_stato === "scartata" ? rigaStato(f) + '<div class="nsdi-nota">Hai sistemato quello che lo SDI chiedeva? Allora puoi rimandarla.</div>' : "")
      + '<div class="nsdi-conf"><b>Mando allo SDI la fattura n. ' + esc(f.numero) + '</b><span>a ' + esc(f.cliente || "il cliente") + '</span></div>'
      + '<div class="nsdi-nota"><b>Una fattura partita non si ritira.</b> Se c\'è un errore si corregge con una nota di credito. Controlla la fattura prima di mandarla.</div>'
      + (aPacchetto ? '<div class="nsdi-nota">Questo invio usa <b>1</b> dei tuoi invii. Te ne restano <b>' + esc(String(amb.residuo)) + '</b>.</div>' : "")
      + (gia ? "" : '<label class="nsdi-aut"><input type="checkbox" id="nsdi-aut"> Autorizzo TrovaImpresa a trasmettere allo SDI, per mio conto, le fatture che mando con questo pulsante.</label>'),
      '<button type="button" class="nsdi-b" data-nsdi-chiudi="1">Annulla</button>'
      + '<button type="button" class="nsdi-b nsdi-b-p" data-nsdi-vai="' + esc(id) + '">Invia allo SDI</button>');
  }

  async function vai(id, btn) {
    var cb = document.getElementById("nsdi-aut");
    if (cb && !cb.checked) { toast("Spunta l'autorizzazione per mandarla"); cb.focus(); return; }
    if (cb) { try { localStorage.setItem(OK_KEY, "1"); } catch (_) {} }
    btn.disabled = true; btn.textContent = "Sto mandando…";
    var D = await carica(id);
    if (!D || controllo(D).length) { chiudi(); apri(id); return; }
    var r = await chiama({ azione: "invia", fattura_id: id, xml: costruisci(D) });
    if (r.codice === "serve_pacchetto") { chiudi(); vendi(); return; }
    if (r.error) { btn.disabled = false; btn.textContent = "Riprova"; toast("Non partita: " + r.error); return; }
    chiudi();
    toast(r.ambiente === "test" ? "Partita (PROVA) ✅ — fra poco arriva la risposta" : "Fattura partita per lo SDI ✅");
    apri(id);
  }

  /* ---- i pacchetti di invii (gestionale gratis) ---- */
  function vendi(prova, id) {
    finestra("Invii allo SDI",
      '<div class="nsdi-conf"><b>Hai finito gli invii allo SDI</b><span>Compra un pacchetto: non scade e lo usi quando vuoi.</span></div>'
      + '<div class="nsdi-nota">Con il gestionale con assistenza AI e chat gli invii sono già compresi.</div>',
      '<button type="button" class="nsdi-b" data-nsdi-chiudi="1">Chiudi</button>'
      + (prova ? '<button type="button" class="nsdi-b" data-nsdi-vai="' + esc(id) + '">Prova lo stesso (PROVA)</button>' : '')
      + '<button type="button" class="nsdi-b nsdi-b-p" data-nsdi-compra="50">50 invii · 9,90 €</button>'
      + '<button type="button" class="nsdi-b nsdi-b-p" data-nsdi-compra="200">200 invii · 29 €</button>');
  }

  async function compra(pacchetto, btn) {
    var testo = btn.textContent;
    btn.disabled = true; btn.textContent = "Apro il pagamento…";
    var tok = null;
    try { var g = await sb.auth.getSession(); tok = g && g.data && g.data.session ? g.data.session.access_token : null; } catch (_) {}
    if (!tok) { btn.disabled = false; btn.textContent = testo; toast("Accesso scaduto: ricarica la pagina."); return; }
    try {
      var r = await fetch("/.netlify/functions/crea-checkout-sdi", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok },
        body: JSON.stringify({ pacchetto: pacchetto, pagina: "noleggio" })
      });
      var j = await r.json().catch(function () { return {}; });
      if (j.url) { window.location.href = j.url; return; }
      toast(j.messaggio || j.error || "Non riesco ad aprire il pagamento.");
    } catch (e) { toast("Nessuna connessione. Riprova fra poco."); }
    btn.disabled = false; btn.textContent = testo;
  }

  /* di ritorno da Stripe */
  (function () {
    var q = ""; try { q = new URLSearchParams(location.search).get("sdi") || ""; } catch (_) {}
    if (q === "ok") setTimeout(function () { toast("Pagamento ricevuto ✅ — gli invii arrivano in pochi secondi"); }, 1500);
    else if (q === "annullato") setTimeout(function () { toast("Pagamento annullato: non hai speso nulla"); }, 1500);
  })();

  async function aggiorna(id, btn) {
    btn.disabled = true; btn.textContent = "Chiedo…";
    var r = await chiama({ azione: "stato", fattura_id: id });
    if (r.error) { btn.disabled = false; btn.textContent = "Aggiorna lo stato"; toast(r.error); return; }
    apri(id);
  }

  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-nol-sdi],[data-nsdi-chiudi],[data-nsdi-vai],[data-nsdi-agg],[data-nsdi-compra]") : null;
    if (!t) return;
    if (t.dataset.nolSdi) { if (sb) apri(t.dataset.nolSdi); return; }
    if (t.dataset.nsdiChiudi) { chiudi(); return; }
    if (t.dataset.nsdiCompra) { compra(t.dataset.nsdiCompra, t); return; }
    if (t.dataset.nsdiVai) { vai(t.dataset.nsdiVai, t); return; }
    if (t.dataset.nsdiAgg) { aggiorna(t.dataset.nsdiAgg, t); }
  });

  function avvio() {
    if (!window.supabase || !window.supabase.createClient) return;
    try { sb = window.supabase.createClient(URL_SB, KEY_SB); } catch (_) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvio); else avvio();
})();
