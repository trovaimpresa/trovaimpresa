/* ═══ 29 settembre 2026 — FATTURA ALLO SDI CON UN CLIC ═════════════════════
   Il pulsante «Invia allo SDI» sulla scheda della fattura (gest-fatture.js).
   1. controlla che nel file non manchi niente (lo stesso controllo del
      «File per lo SDI»: se manca qualcosa apre quella finestra);
   2. chiede conferma, perche' una fattura partita NON si ritira;
   3. prepara il file XML (fattXmlCostruisci, lo stesso di sempre) e lo
      passa alla funzione Netlify «sdi», che lo manda tramite Openapi;
   4. da li' in poi la scheda mostra lo stato: partita, consegnata,
      scartata (col motivo), non consegnata.
   La risposta dello SDI arriva da sola (sdi-notifica.js); il pulsante
   «Aggiorna lo stato» la va a chiedere se si ha fretta.

   Gira senza (function(){}) come gli altri gest-: vede fattCache,
   fattXmlControllo, fattXmlCostruisci, fatturaXml, renderFatture, sb...
   ═════════════════════════════════════════════════════════════════════════ */
const SDI_CHIAVE_OK = "ti-sdi-autorizzo";
const SDI_STATO_LAB = {
  inviata: "Partita, aspettiamo lo SDI",
  consegnata: "Consegnata al cliente",
  non_consegnata: "Nel cassetto fiscale del cliente",
  scartata: "Scartata dallo SDI",
  errore: "Non partita"
};

async function sdiChiama(corpo) {
  const { data } = await sb.auth.getSession();
  const tok = data && data.session ? data.session.access_token : null;
  if (!tok) return { error: "Accesso scaduto: ricarica la pagina." };
  try {
    const r = await fetch("/.netlify/functions/sdi", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ access_token: tok }, corpo))
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok && !j.error) j.error = "Errore " + r.status;
    return j;
  } catch (e) { return { error: "Nessuna connessione. Riprova fra poco." }; }
}

/* rimette la fattura aggiornata nella lista, senza ricaricare tutto */
function sdiAggiornaCache(nuova) {
  if (!nuova) return;
  const i = fattCache.findIndex(x => String(x.id) === String(nuova.id));
  if (i >= 0) fattCache[i] = Object.assign({}, fattCache[i], nuova);
  if (typeof renderFatture === "function") renderFatture();
}

function sdiRigaStato(f) {
  if (!f.sdi_stato) return "";
  const tono = f.sdi_stato === "consegnata" ? "ok" : f.sdi_stato === "scartata" || f.sdi_stato === "errore" ? "err" : "attesa";
  return '<div class="sdi-stato sdi-' + tono + '"><b>' + esc(SDI_STATO_LAB[f.sdi_stato] || f.sdi_stato) + '</b>'
    + (f.sdi_esito ? '<span>' + esc(f.sdi_esito) + '</span>' : '')
    + (f.sdi_inviata_il ? '<small>Partita il ' + esc(fdate(String(f.sdi_inviata_il).slice(0, 10))) + (f.sdi_ambiente === "test" ? ' · PROVA, non è andata davvero allo SDI' : '') + '</small>' : '')
    + '</div>';
}

async function fattSdi(id) {
  const f = fattCache.find(x => String(x.id) === String(id));
  if (!f) { toast("Fattura non trovata"); return; }

  /* gia' partita: si mostra lo stato */
  if (f.sdi_uuid && f.sdi_stato !== "scartata") {
    openSheetGrande("Fattura " + fattNumero(f) + " allo SDI",
      '<div class="sh-b">' + sdiRigaStato(f) + '</div>',
      '<button class="btn b-cancel" data-action="close">Chiudi</button>'
      + '<button class="btn btn-primary" type="button" data-sdi-agg="' + esc(f.id) + '">Aggiorna lo stato</button>');
    return;
  }

  /* manca qualcosa nel file? la finestra che lo spiega c'e' gia' */
  if (fattXmlControllo(f).length) { fatturaXml(id); return; }

  const cli = f.cli_nome || "il cliente";
  const amb = await sdiChiama({ azione: "ambiente" });
  const prova = amb && amb.ambiente === "test";
  const giaOk = (() => { try { return localStorage.getItem(SDI_CHIAVE_OK) === "1"; } catch (_) { return false; } })();

  let corpo = '';
  if (prova) corpo += '<div class="sh-b"><div class="sdi-prova"><b>Siamo in PROVA.</b> La fattura va al finto SDI di Openapi: non arriva al cliente e non vale per il Fisco.</div></div>';
  if (f.sdi_stato === "scartata") corpo += '<div class="sh-b">' + sdiRigaStato(f) + '<div class="sh-nota">Hai sistemato quello che lo SDI chiedeva? Allora puoi rimandarla con lo stesso numero, entro 5 giorni dallo scarto.</div></div>';
  corpo += '<div class="sh-b"><div class="sdi-conferma">'
    + '<b>Mando allo SDI la fattura ' + esc(fattNumero(f)) + '</b>'
    + '<span>a ' + esc(cli) + '</span></div>'
    + '<div class="sh-nota"><b>Una fattura partita non si ritira.</b> Se c\'è un errore si corregge con una nota di credito. Controlla il PDF prima di mandarla.</div>'
    + (giaOk ? '' : '<label class="sdi-autorizzo"><input type="checkbox" id="sdi-autorizzo"> Autorizzo TrovaImpresa a trasmettere allo SDI, per mio conto, le fatture che mando con questo pulsante.</label>')
    + '</div>';
  openSheetGrande("Invia allo SDI", corpo,
    '<button class="btn b-cancel" data-action="close">Annulla</button>'
    + '<button class="btn btn-primary" type="button" data-sdi-vai="' + esc(f.id) + '">Invia allo SDI</button>');
}

async function fattSdiVai(id, btn) {
  const f = fattCache.find(x => String(x.id) === String(id));
  if (!f) return;
  const cb = document.getElementById("sdi-autorizzo");
  if (cb && !cb.checked) { toast("Spunta l'autorizzazione per mandarla"); cb.focus(); return; }
  if (cb) { try { localStorage.setItem(SDI_CHIAVE_OK, "1"); } catch (_) {} }
  if (fattXmlControllo(f).length) { closeSheet(); fatturaXml(id); return; }

  btn.disabled = true; btn.textContent = "Sto mandando…";
  const { xml } = fattXmlCostruisci(f);
  const r = await sdiChiama({ azione: "invia", fattura_id: f.id, xml });
  if (r.error) {
    btn.disabled = false; btn.textContent = "Riprova";
    toast("Non partita: " + r.error);
    if (r.fattura) sdiAggiornaCache(r.fattura);
    return;
  }
  closeSheet();
  sdiAggiornaCache(r.fattura);
  toast(r.ambiente === "test" ? "Partita (PROVA) ✅ — fra poco arriva la risposta" : "Fattura partita per lo SDI ✅");
}

async function fattSdiAggiorna(id, btn) {
  btn.disabled = true; btn.textContent = "Chiedo…";
  const r = await sdiChiama({ azione: "stato", fattura_id: id });
  btn.disabled = false; btn.textContent = "Aggiorna lo stato";
  if (r.error) { toast(r.error); return; }
  sdiAggiornaCache(r.fattura);
  closeSheet(); fattSdi(id);
}

document.addEventListener("click", function (e) {
  const v = e.target.closest && e.target.closest("[data-sdi-vai],[data-sdi-agg]");
  if (!v) return;
  if (v.dataset.sdiVai) fattSdiVai(v.dataset.sdiVai, v);
  else fattSdiAggiorna(v.dataset.sdiAgg, v);
});
