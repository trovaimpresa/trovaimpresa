/* =====================================================================
   TrovaImpresa — LA GIORNATA AL CENTRO — 10 novembre 2026
   Chiesto da Alessio: dentro ogni giornata le FOTO dei lavori, le SPESE,
   la BENZINA coi CHILOMETRI e il mezzo, le FATTURE e le BOLLE. «Il giorno
   al centro»: le cose si aggiungono dove si cercano.

   ⛔ NIENTE TABELLE NUOVE. Sono le righe che il gestionale ha gia':
        foto            -> gest_foto            (lavoro + giorno in cui e' nata)
        spese           -> gest_spese           (lavoro + data)
        benzina e km    -> gest_rifornimenti    (mezzo + data)
        fatture e bolle -> gest_fatture_fornitori (lavoro + data)
      Quindi una spesa segnata qui e' la STESSA che si vede dentro il lavoro
      e nel suo margine: un posto solo dove stanno i soldi.
   ⛔ Una giornata e' (giorno + cantiere). Foto, spese e fatture stanno sul
      cantiere di quel giorno. La benzina non ha un cantiere: sta sul GIORNO,
      e si mostra sulla prima scheda di quel giorno (se no, con due cantieri
      nello stesso giorno, si vedrebbe due volte).
   ⛔ La fattura o bolla apre il modulo di sempre (fattfForm, con la foto
      letta dall'AI): qui non si riscrive.
   ⛔ Il pieno pagato con la CARTA aziendale si registra da Mezzi, dove la
      carta si scala da sola: qui solo contanti o buono.
   ⚠️ Se una lettura non risponde, quel pezzo resta vuoto e le giornate si
      vedono lo stesso.

   File non in un IIFE, come gli altri js/gest-*: vede sb, sbUid, esc, toast,
   $, openSheetGrande, closeSheet, curMestiere, todayStr, _numIt,
   preparaFileUpload, fattfForm, giorMese, giorRighe, giorCarica, giorDisegna
   solo DENTRO le funzioni. Le azioni hanno un ascoltatore suo su [data-gx].
   ===================================================================== */
let gxDati = { foto: [], spese: [], rif: [], fatt: [], mezzi: [] };
let gxAperta = null;      /* {lavoro_id, data} la giornata su cui si sta lavorando */
let gxTogli = null;       /* "spesa:<id>" / "rif:<id>": la riga che aspetta il secondo tocco */

const GX_IC = {
  foto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  spesa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
  benz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"/><path d="M3 21h12M7 8h4"/><path d="M14 11h2a2 2 0 0 1 2 2v3a1.5 1.5 0 0 0 3 0V9l-3-3"/></svg>',
  pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/><path d="M9 14l2 2 4-4"/></svg>',
  fatt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>'
};

function gxEuro(n) { return (+n || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true }) + " €"; }
function gxKm(n) { return Math.round(+n || 0).toLocaleString("it-IT") + " km"; }
function gxYmd(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
/* il giorno di una riga: la sua data se c'e', se no il giorno (di qui) in cui e' nata */
function gxGiorno(r) { return r.data || (r.created_at ? gxYmd(new Date(r.created_at)) : ""); }
function gxMesePrimoDopo(ym) { let p = ym.split("-").map(Number), y = p[0], m = p[1] + 1; if (m > 12) { m = 1; y++; } return y + "-" + String(m).padStart(2, "0") + "-01"; }

/* ---------------------------------------------------------------------
   LA LETTURA DEL MESE — la chiama giorCarica, dopo aver letto le giornate
   --------------------------------------------------------------------- */
async function gxCarica() {
  gxDati = { foto: [], spese: [], rif: [], fatt: [], mezzi: [] };
  if (!sb || !sbUid || !giorMese) return;
  const da = giorMese + "-01", a = gxMesePrimoDopo(giorMese);
  const isoDa = new Date(da + "T00:00:00").toISOString(), isoA = new Date(a + "T00:00:00").toISOString();
  const ids = [...new Set((giorRighe || []).map(g => g.lavoro_id).filter(Boolean))];
  const vuota = Promise.resolve({ data: [] });
  const tenta = async q => { try { const r = await q; return (r && !r.error && r.data) || []; } catch (e) { return []; } };
  let [foto, spese, rif, fatt, mezzi] = await Promise.all([
    tenta(ids.length ? sb.from("gest_foto").select("id,lavoro_id,tipo,created_at,storage_path").eq("user_id", sbUid).in("lavoro_id", ids).in("tipo", ["da_fare", "fatto"]).gte("created_at", isoDa).lt("created_at", isoA) : vuota),
    tenta(sb.from("gest_spese").select("id,lavoro_id,descrizione,importo,data,created_at").eq("user_id", sbUid)
      .or('and(data.gte.' + da + ',data.lt.' + a + '),and(data.is.null,created_at.gte."' + isoDa + '",created_at.lt."' + isoA + '")')),
    tenta(sb.from("gest_rifornimenti").select("id,data,importo,km,mezzo_id,distributore,mestiere_id").eq("user_id", sbUid).gte("data", da).lt("data", a)),
    tenta(sb.from("gest_fatture_fornitori").select("id,lavoro_id,data,importo,numero").eq("user_id", sbUid).gte("data", da).lt("data", a)),
    tenta(sb.from("gest_mezzi").select("id,nome,mestiere_id").eq("user_id", sbUid).order("nome"))
  ]);
  /* 24 nov 2026 — solo il reparto aperto (come le giornate): spese e
     fatture dei lavori di questo reparto, pieni del reparto */
  const _mid = (typeof _gMest === "function") ? _gMest() : null;
  if (_mid) {
    const lavRep = new Set((typeof giorLav !== "undefined" ? giorLav : []).map(l => String(l.id)));
    spese = spese.filter(x => lavRep.has(String(x.lavoro_id)));
    fatt = fatt.filter(x => !x.lavoro_id || lavRep.has(String(x.lavoro_id)));
    rif = rif.filter(x => !x.mestiere_id || String(x.mestiere_id) === String(_mid));
  }
  /* 10 nov 2026 — regola di Alessio: in cima sempre le ULTIME salvate */
  const ultimePrima = (x, y) => String(y.created_at || "").localeCompare(String(x.created_at || ""));
  foto.sort(ultimePrima); spese.sort(ultimePrima);
  gxDati = { foto, spese, rif, fatt, mezzi };
}
async function gxRicarica() {
  await giorCarica();          /* rilegge anche le giornate: una spesa cambia il margine del cantiere */
  giorDisegna();
}

/* quello che c'e' in UNA giornata (giorno + cantiere) */
function gxDella(g, primaDelGiorno) {
  const L = String(g.lavoro_id || "");
  return {
    foto: gxDati.foto.filter(f => String(f.lavoro_id) === L && gxYmd(new Date(f.created_at)) === g.data),
    /* 20 nov 2026 — PRIMA e DOPO, con gli stessi tipi della Galleria:
       da_fare = prima del lavoro, fatto = a lavoro finito */
    prima: gxDati.foto.filter(f => String(f.lavoro_id) === L && gxYmd(new Date(f.created_at)) === g.data && f.tipo === "da_fare"),
    dopo: gxDati.foto.filter(f => String(f.lavoro_id) === L && gxYmd(new Date(f.created_at)) === g.data && f.tipo !== "da_fare"),
    spese: gxDati.spese.filter(s => String(s.lavoro_id) === L && gxGiorno(s) === g.data),
    rif: primaDelGiorno ? gxDati.rif.filter(r => r.data === g.data) : [],
    fatt: gxDati.fatt.filter(f => String(f.lavoro_id || "") === L && f.data === g.data)
  };
}
function gxNomeMezzo(id) { const m = gxDati.mezzi.find(x => String(x.id) === String(id)); return m ? m.nome : ""; }
/* nel numero c'e' qualcosa che non e' una cifra (una «o» al posto dello zero…) */
function gxNonNumero(t) { return /[^0-9.,\s€'’\u00a0-]/.test(String(t || "")); }
function gxSomma(a) { return a.reduce((s, x) => s + (+x.importo || 0), 0); }

/* ---------------------------------------------------------------------
   IL DISEGNO — lo chiama giorDisegna
   --------------------------------------------------------------------- */
function gxHtmlTotali() {
  const sp = gxSomma(gxDati.spese), bz = gxSomma(gxDati.rif), ft = gxSomma(gxDati.fatt);
  const km = gxDati.rif.reduce((s, r) => s + (+r.km || 0), 0);
  const pezzi = [];
  if (sp > 0) pezzi.push('<div><b>' + gxEuro(sp) + '</b><span>Spese</span></div>');
  if (bz > 0) pezzi.push('<div><b>' + gxEuro(bz) + '</b><span>Benzina</span></div>');
  if (km > 0) pezzi.push('<div><b>' + gxKm(km) + '</b><span>Chilometri</span></div>');
  if (ft > 0) pezzi.push('<div><b>' + gxEuro(ft) + '</b><span>Fatture e bolle</span></div>');
  return pezzi.length ? '<div class="gx-tot">' + pezzi.join("") + '</div>' : "";
}
function gxHtmlGiorno(g, primaDelGiorno) {
  if (!g || !g.lavoro_id) return "";
  const d = gxDella(g, primaDelGiorno), k = esc(g.k);
  const ha = [];
  if (d.foto.length) ha.push('<button type="button" data-gx="vedi-foto" data-k="' + k + '">' + GX_IC.foto + [d.prima.length ? d.prima.length + " foto prima" : "", d.dopo.length ? d.dopo.length + (d.prima.length ? " dopo" : " foto dopo") : ""].filter(Boolean).join(" · ") + '</button>');
  if (d.spese.length) ha.push('<button type="button" data-gx="spesa" data-k="' + k + '">' + GX_IC.spesa + d.spese.length + (d.spese.length === 1 ? " spesa" : " spese") + " · " + gxEuro(gxSomma(d.spese)) + '</button>');
  if (d.rif.length) {
    const km = d.rif.reduce((s, r) => s + (+r.km || 0), 0);
    const mezzi = [...new Set(d.rif.map(r => gxNomeMezzo(r.mezzo_id)).filter(Boolean))];
    ha.push('<button type="button" data-gx="benz" data-k="' + k + '">' + GX_IC.benz + [gxSomma(d.rif) > 0 ? gxEuro(gxSomma(d.rif)) : "", km > 0 ? gxKm(km) : ""].filter(Boolean).join(" · ") + (mezzi.length ? " · " + esc(mezzi.join(", ")) : "") + '</button>');
  }
  if (d.fatt.length) ha.push('<span>' + GX_IC.fatt + d.fatt.length + (d.fatt.length === 1 ? " fattura" : " fatture") + " · " + gxEuro(gxSomma(d.fatt)) + '</span>');
  /* 20 nov 2026 — il lavoro svolto, per il cliente (gest_rapportini.didascalia) */
  const dida = g.didascalia ? '<div class="gx-dida"><b>Lavoro svolto:</b> <span class="gior-u">' + esc(g.didascalia) + '</span></div>' : "";
  /* 24 nov 2026 — allo studio: niente «Benzina e km» (chiede un mezzo, e allo
     studio i Mezzi sono nascosti: mandava a una voce del menu che non c'e')
     e «Fattura del fornitore» al posto di «Fattura o bolla». Se c'e' gia'
     un pieno segnato si vede lo stesso, sopra. */
  const pro = (typeof _gPro==="function"&&_gPro());
  return dida + (ha.length ? '<div class="gx-ha">' + ha.join("") + '</div>' : "")
    + '<div class="gx-btn">'
    + '<button type="button" data-gx="foto" data-k="' + k + '">' + GX_IC.foto + 'Foto</button>'
    + '<button type="button" data-gx="spesa" data-k="' + k + '">' + GX_IC.spesa + 'Spesa</button>'
    + (pro ? '' : '<button type="button" data-gx="benz" data-k="' + k + '">' + GX_IC.benz + 'Benzina e km</button>')
    + '<button type="button" data-gx="fatt" data-k="' + k + '">' + GX_IC.fatt + (pro ? 'Fattura del fornitore' : 'Fattura o bolla') + '</button>'
    + '<button type="button" class="gx-cli" data-gx="cliente" data-k="' + k + '">' + GX_IC.pdf + 'Per il cliente</button>'
    + '</div>';
}

function gxTrova(k) { return (giorRighe || []).find(g => String(g.k) === String(k)) || null; }
function gxPrima(g) { const delGiorno = (giorRighe || []).filter(x => x.data === g.data); return delGiorno.length && delGiorno[0].k === g.k; }
function gxTitolo(g) {
  const l = (typeof giorLavoro === "function") ? giorLavoro(g.lavoro_id) : null;
  const nome = l ? (l.descrizione || l.dove || "Cantiere") : "Cantiere";
  return (typeof _gData === "function" ? _gData(g.data) : g.data) + " — " + nome;
}

/* ---------------------------------------------------------------------
   FOTO
   --------------------------------------------------------------------- */
/* 20 nov 2026 — la foto si carica come PRIMA (da_fare) o DOPO (fatto) */
function gxScegliFoto(g, tipo) {
  let f = document.getElementById("gx-file");
  if (!f) {
    f = document.createElement("input"); f.type = "file"; f.id = "gx-file"; f.accept = "image/*"; f.multiple = true; f.style.display = "none";
    document.body.appendChild(f);
  }
  f.value = "";
  f.onchange = function () { if (f.files && f.files.length) gxCaricaFoto(g, f.files, tipo === "da_fare" ? "da_fare" : "fatto"); };
  f.click();
}
async function gxCaricaFoto(g, files, tipo) {
  if (!sbUid) { toast("Devi essere loggato"); return; }
  let n = 0;
  toast("Carico le foto…");
  for (const file of Array.from(files)) {
    const p = await preparaFileUpload(file);
    if (p.errore) { toast(p.errore); continue; }
    const safe = String(p.nome || "foto.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = sbUid + "/" + g.lavoro_id + "/" + Date.now() + "_" + safe;
    const up = await sb.storage.from("gestionale-foto").upload(path, p.file);
    if (up.error) { toast("Foto non caricata: " + up.error.message); continue; }
    const riga = { user_id: sbUid, lavoro_id: g.lavoro_id, tipo: tipo || "fatto", operatore: "Capo", storage_path: path };
    /* la foto di un giorno passato resta su QUEL giorno */
    if (g.data !== gxYmd(new Date())) riga.created_at = new Date(g.data + "T12:00:00").toISOString();
    const ins = await sb.from("gest_foto").insert(riga).select("id");
    if (ins.error || !ins.data || !ins.data.length) {
      try { await sb.storage.from("gestionale-foto").remove([path]); } catch (e) {}
      toast("Foto non salvata: " + ((ins.error && ins.error.message) || "riprova")); continue;
    }
    n++;
  }
  const quando = tipo === "da_fare" ? " prima" : " dopo";
  if (n) toast(n === 1 ? "Foto" + quando + " aggiunta ✔" : n + " foto" + quando + " aggiunte ✔");
  await gxRicarica();
  /* se la finestra delle foto era aperta, si ridisegna con la foto nuova */
  const ov = document.getElementById("overlay");
  if (ov && ov.classList.contains("open") && document.getElementById("gx-pd")) { const gg = gxTrova(g.k); if (gg) gxVediFoto(gg); }
}
/* una colonna (Prima o Dopo) della finestra delle foto */
async function gxColonnaFoto(box, lista, g) {
  const pezzi = [];
  for (const f of lista) {
    try {
      const su = await sb.storage.from("gestionale-foto").createSignedUrl(f.storage_path, 3600);
      /* 18 nov 2026 (ok di Alex): sotto ogni foto «togli», col secondo tocco come spesa e benzina */
      if (su && su.data && su.data.signedUrl) pezzi.push('<div class="gx-foto"><a href="' + esc(su.data.signedUrl) + '" target="_blank" rel="noopener"><img src="' + esc(su.data.signedUrl) + '" alt="Foto del lavoro" loading="lazy"></a>'
        + (gxTogli === "foto:" + f.id ? '<button type="button" class="gx-si" data-gx="foto-togli-si" data-id="' + esc(String(f.id)) + '" data-k="' + esc(g.k) + '">Sì, togli</button>'
                                      : '<button type="button" class="gx-link" data-gx="foto-togli" data-id="' + esc(String(f.id)) + '" data-k="' + esc(g.k) + '">togli</button>')
        + '</div>');
    } catch (e) {}
  }
  if (!box.isConnected) return;
  box.innerHTML = !lista.length ? '<div class="gx-vuoto">Nessuna foto.</div>'
    : pezzi.length ? pezzi.join("") : '<div class="gx-vuoto">Le foto non si riescono ad aprire adesso. Riprova fra poco.</div>';
}
/* 20 nov 2026 — la finestra delle foto: due colonne, Prima e Dopo */
async function gxVediFoto(g) {
  const d = gxDella(g, false), k = esc(g.k);
  const col = (tit, tipo, n) => '<div class="gx-pd-col"><div class="gx-pd-t"><h4>' + tit + (n ? ' <span>(' + n + ')</span>' : '') + '</h4>'
    + '<button type="button" class="btn" data-gx="foto" data-tipo="' + tipo + '" data-k="' + k + '">' + GX_IC.foto + (tipo === "da_fare" ? "+ Foto prima" : "+ Foto dopo") + '</button></div>'
    + '<div class="gx-griglia" id="gx-g-' + tipo + '"><div class="loading">Carico…</div></div></div>';
  const pro = (typeof _gPro==="function"&&_gPro());
  openSheetGrande("Foto",
    '<div class="sh-b sh-centro"><div class="sh-tit gior-u">' + esc(gxTitolo(g)) + '</div>'
    + '<div class="gx-pd" id="gx-pd">' + col(pro ? "Prima dei lavori" : "Prima del lavoro", "da_fare", d.prima.length) + col(pro ? "Fine lavori" : "Dopo il lavoro", "fatto", d.dopo.length) + '</div></div>',
    '<button class="btn b-cancel" data-action="close">Chiudi</button>'
    + '<button class="btn-primary b-save" data-gx="cliente" data-k="' + k + '">Per il cliente</button>');
  const bp = document.getElementById("gx-g-da_fare"), bd = document.getElementById("gx-g-fatto");
  await Promise.all([bp && gxColonnaFoto(bp, d.prima, g), bd && gxColonnaFoto(bd, d.dopo, g)]);
}

async function gxFotoTogli(id, k) {
  const f = gxDati.foto.find(x => String(x.id) === String(id));
  gxTogli = null;
  const r = await sb.from("gest_foto").delete().eq("id", id).eq("user_id", sbUid).select("id");
  if (r.error || !r.data || !r.data.length) { toast("Foto non tolta: " + ((r.error && r.error.message) || "riprova")); return; }
  const nelCestino = !!(window.cestinoAttivo && window.cestinoAttivo());
  if (!nelCestino && f && f.storage_path) { try { await sb.storage.from("gestionale-foto").remove([f.storage_path]); } catch (e) {} }
  toast(nelCestino ? "Foto nel cestino: la riprendi da lì" : "Foto tolta");
  await gxRicarica();
  const g = gxTrova(k);
  if (g) gxVediFoto(g); else closeSheet();
}

/* ---------------------------------------------------------------------
   SPESA
   --------------------------------------------------------------------- */
function gxSpesaApri(g) {
  gxAperta = { lavoro_id: g.lavoro_id, data: g.data, k: g.k };
  const d = gxDella(g, false);
  const righe = d.spese.map(function (s) {
    const aspetta = gxTogli === "spesa:" + s.id;
    return '<div class="gx-riga"><div class="t gior-u">' + esc(s.descrizione || "Spesa") + '</div><b>' + gxEuro(s.importo) + '</b>'
      + (aspetta ? '<button type="button" class="gx-si" data-gx="spesa-togli-si" data-id="' + esc(String(s.id)) + '">Sì, togli</button>'
                 : '<button type="button" class="gx-link" data-gx="spesa-togli" data-id="' + esc(String(s.id)) + '">togli</button>')
      + '</div>';
  }).join("");
  const pro = (typeof _gPro==="function"&&_gPro());
  openSheetGrande("Spesa",
    '<div class="sh-b sh-centro"><div class="sh-tit gior-u">' + esc(gxTitolo(g)) + '</div>'
    + (righe ? '<div class="gx-lista">' + righe + '</div>' : '')
    + '<div class="field"><label>' + (pro ? 'Cosa hai pagato' : 'Cosa hai comprato') + '</label><input type="text" id="gx-sp-desc" placeholder="' + (pro ? 'Es. diritti di segreteria, visure catastali' : 'Es. sabbia e cemento') + '" autocomplete="off"></div>'
    + '<div class="field"><label>Quanto hai speso (€)</label><input type="text" id="gx-sp-imp" inputmode="decimal" placeholder="0,00" autocomplete="off"></div>'
    + '</div>',
    '<button class="btn b-cancel" data-action="close">Chiudi</button>'
    + '<button class="btn-primary b-save" data-gx="spesa-salva">Aggiungi la spesa</button>');
}
async function gxSpesaSalva(btn) {
  if (!gxAperta || !sbUid) return;
  const descrizione = ($("#gx-sp-desc").value || "").trim();
  const testo = ($("#gx-sp-imp").value || "").trim();
  const importo = _numIt("#gx-sp-imp");
  /* 18 nov 2026: «12o» si leggeva 12 (la lettera spariva zitta) */
  if (testo && (importo == null || gxNonNumero(testo))) { toast("Non ho capito l'importo: scrivilo come 12,50"); return; }
  if (importo == null || importo <= 0) { toast("Scrivi quanto hai speso, per esempio 12,50"); return; }
  if (!descrizione) { toast(((typeof _gPro==="function"&&_gPro())) ? "Scrivi cosa hai pagato" : "Scrivi cosa hai comprato"); return; }
  if (btn) btn.disabled = true;
  const r = await sb.from("gest_spese").insert({ user_id: sbUid, lavoro_id: gxAperta.lavoro_id, descrizione: descrizione, importo: importo, data: gxAperta.data }).select("id");
  if (r.error || !r.data || !r.data.length) { if (btn) btn.disabled = false; toast("Spesa non salvata: " + ((r.error && r.error.message) || "riprova")); return; }
  closeSheet(); toast("Spesa aggiunta ✔");
  await gxRicarica();
}
async function gxSpesaTogli(id) {
  const r = await sb.from("gest_spese").delete().eq("id", id).eq("user_id", sbUid).select("id");
  gxTogli = null;
  if (r.error || !r.data || !r.data.length) { toast("Non tolta: " + ((r.error && r.error.message) || "riprova")); return; }
  toast("Spesa tolta");
  const k = gxAperta && gxAperta.k;
  await gxRicarica();
  const g = k && gxTrova(k); if (g) gxSpesaApri(g); else closeSheet();
}

/* ---------------------------------------------------------------------
   BENZINA E KM
   --------------------------------------------------------------------- */
function gxBenzApri(g) {
  gxAperta = { lavoro_id: g.lavoro_id, data: g.data, k: g.k };
  const delGiorno = gxDati.rif.filter(r => r.data === g.data);
  const mid = (typeof curMestiere === "function") ? curMestiere() : null;
  /* prima i mezzi del reparto aperto, poi gli altri */
  const mezzi = gxDati.mezzi.slice().sort((a, b) => (String(b.mestiere_id) === String(mid)) - (String(a.mestiere_id) === String(mid)));
  const righe = delGiorno.map(function (r) {
    const aspetta = gxTogli === "rif:" + r.id;
    return '<div class="gx-riga"><div class="t">' + esc(gxNomeMezzo(r.mezzo_id) || "Mezzo") + (+r.km > 0 ? " · " + gxKm(r.km) : "") + (r.distributore ? " · " + esc(r.distributore) : "") + '</div><b>' + (+r.importo > 0 ? gxEuro(r.importo) : "") + '</b>'
      + (aspetta ? '<button type="button" class="gx-si" data-gx="benz-togli-si" data-id="' + esc(String(r.id)) + '">Sì, togli</button>'
                 : '<button type="button" class="gx-link" data-gx="benz-togli" data-id="' + esc(String(r.id)) + '">togli</button>')
      + '</div>';
  }).join("");
  const giornoTxt = (typeof _gData === "function" ? _gData(g.data) : g.data);
  if (!mezzi.length) {
    openSheetGrande("Benzina e km",
      '<div class="sh-b sh-centro"><div class="sh-tit">' + esc(giornoTxt) + '</div>'
      + '<p class="gx-vuoto">Per segnare benzina e chilometri serve un mezzo. Aggiungilo una volta sola nella voce «Mezzi» del menu, poi torna qui.</p></div>',
      '<button class="btn b-cancel" data-action="close">Chiudi</button>'
      + '<button class="btn-primary b-save" data-gx="vai-mezzi">Vai a Mezzi</button>');
    return;
  }
  openSheetGrande("Benzina e km",
    '<div class="sh-b sh-centro"><div class="sh-tit">' + esc(giornoTxt) + '</div>'
    + (righe ? '<div class="gx-lista">' + righe + '</div>' : '')
    + '<div class="field"><label>Mezzo</label><select id="gx-bz-mezzo">' + mezzi.map(m => '<option value="' + esc(String(m.id)) + '">' + esc(m.nome || "Mezzo") + '</option>').join("") + '</select></div>'
    + '<div class="row2">'
    + '<div class="field"><label>Benzina (€)</label><input type="text" id="gx-bz-imp" inputmode="decimal" placeholder="0,00" autocomplete="off"></div>'
    + '<div class="field"><label>Chilometri fatti</label><input type="text" id="gx-bz-km" inputmode="numeric" placeholder="Es. 120" autocomplete="off"></div>'
    + '</div>'
    + '<div class="row2">'
    + '<div class="field"><label>Come hai pagato</label><select id="gx-bz-pag"><option value="contanti">Contanti o carta tua</option><option value="buono">Buono del distributore</option></select></div>'
    + '<div class="field"><label>Distributore (se vuoi)</label><input type="text" id="gx-bz-distr" placeholder="Es. Q8 via Salaria" autocomplete="off"></div>'
    + '</div>'
    + '</div>',
    '<button class="btn b-cancel" data-action="close">Chiudi</button>'
    + '<button class="btn-primary b-save" data-gx="benz-salva">Aggiungi</button>');
}
async function gxBenzSalva(btn) {
  if (!gxAperta || !sbUid) return;
  const mezzo_id = ($("#gx-bz-mezzo") || {}).value || null;
  if (!mezzo_id) { toast("Scegli il mezzo"); return; }
  const tImp = ($("#gx-bz-imp").value || "").trim(), tKm = ($("#gx-bz-km").value || "").trim();
  const importo = _numIt("#gx-bz-imp"), kmN = _numIt("#gx-bz-km");
  if (tImp && (importo == null || gxNonNumero(tImp))) { toast("Non ho capito la benzina: scrivila come 50 o 50,00"); return; }
  if (tKm && (kmN == null || gxNonNumero(tKm.replace(/\s*km\s*$/i, "")))) { toast("Non ho capito i chilometri: scrivi solo il numero, per esempio 120"); return; }
  const imp = importo == null ? 0 : importo, km = kmN == null ? null : Math.round(kmN);
  if (!(imp > 0) && !(km > 0)) { toast("Scrivi la benzina, i chilometri, o tutti e due"); return; }
  if (btn) btn.disabled = true;
  const m = gxDati.mezzi.find(x => String(x.id) === String(mezzo_id)) || {};
  const r = await sb.from("gest_rifornimenti").insert({
    user_id: sbUid, mestiere_id: m.mestiere_id || curMestiere(), mezzo_id: mezzo_id, data: gxAperta.data,
    pagamento: ($("#gx-bz-pag") || {}).value || "contanti", carta_id: null, movimento_id: null,
    distributore: ($("#gx-bz-distr").value || "").trim() || null, operatore_id: null, importo: imp, litri: null, km: km
  }).select("id");
  if (r.error || !r.data || !r.data.length) { if (btn) btn.disabled = false; toast("Non salvato: " + ((r.error && r.error.message) || "riprova")); return; }
  closeSheet(); toast("Segnato ✔");
  await gxRicarica();
}
async function gxBenzTogli(id) {
  const r = await sb.from("gest_rifornimenti").delete().eq("id", id).eq("user_id", sbUid).is("movimento_id", null).select("id");
  gxTogli = null;
  if (r.error) { toast("Non tolto: " + r.error.message); return; }
  if (!r.data || !r.data.length) { toast("Questo pieno è pagato con la carta aziendale: si toglie da Mezzi, così la carta torna a posto."); return; }
  toast("Tolto");
  const k = gxAperta && gxAperta.k;
  await gxRicarica();
  const g = k && gxTrova(k); if (g) gxBenzApri(g); else closeSheet();
}

/* ---------------------------------------------------------------------
   I CLIC
   --------------------------------------------------------------------- */
document.addEventListener("click", async function (e) {
  const b = e.target.closest && e.target.closest("[data-gx]"); if (!b) return;
  const a = b.dataset.gx;
  const g = b.dataset.k ? gxTrova(b.dataset.k) : null;
  if (a === "foto") {
    if (!g) return;
    /* dalla riga della giornata si apre la finestra (si sceglie lì Prima o Dopo); dentro, il pulsante ha il suo tipo */
    if (b.dataset.tipo) gxScegliFoto(g, b.dataset.tipo); else { gxTogli = null; gxVediFoto(g); }
    return;
  }
  if (a === "cliente") { if (g) gxResoconto(g); return; }
  if (a === "dida-ai") { if (g) gxDidaAI(g, b); return; }
  if (a === "dida-salva") { if (g) { b.disabled = true; const ok = await gxDidaSalva(g); b.disabled = false; if (ok) { toast("Salvato ✔"); gxResoconto(gxTrova(g.k) || g); } } return; }
  if (a === "dida-pdf") { if (g) { b.disabled = true; try { await gxPdfCliente(g); } finally { b.disabled = false; } } return; }
  if (a === "vedi-foto") { if (g) { gxTogli = null; gxVediFoto(g); } return; }
  if (a === "foto-togli") { gxTogli = "foto:" + b.dataset.id; if (g) gxVediFoto(g); return; }
  if (a === "foto-togli-si") { b.disabled = true; return gxFotoTogli(b.dataset.id, b.dataset.k); }
  if (a === "spesa") { if (g) { gxTogli = null; gxSpesaApri(g); } return; }
  if (a === "spesa-salva") return gxSpesaSalva(b);
  if (a === "spesa-togli") { gxTogli = "spesa:" + b.dataset.id; const gg = gxAperta && gxTrova(gxAperta.k); if (gg) gxSpesaApri(gg); return; }
  if (a === "spesa-togli-si") return gxSpesaTogli(b.dataset.id);
  if (a === "benz") { if (g) { gxTogli = null; gxBenzApri(g); } return; }
  if (a === "benz-salva") return gxBenzSalva(b);
  if (a === "benz-togli") { gxTogli = "rif:" + b.dataset.id; const gg = gxAperta && gxTrova(gxAperta.k); if (gg) gxBenzApri(gg); return; }
  if (a === "benz-togli-si") return gxBenzTogli(b.dataset.id);
  if (a === "vai-mezzi") { closeSheet(); const v = document.querySelector('nav.tabs button[data-tab="mezzi"]'); if (v) v.click(); return; }
  if (a === "fatt") {
    if (!g) return;
    if (typeof fattfForm !== "function") { toast("Il modulo della fattura non è disponibile: ricarica la pagina."); return; }
    gxAperta = { lavoro_id: g.lavoro_id, data: g.data, k: g.k, fattura: true };
    /* la tendina dei fornitori si riempie da renderFornitori: se la voce
       «Fornitori» non e' mai stata aperta in questa sessione sarebbe vuota */
    try { if (typeof fornCache !== "undefined" && !fornCache.length && typeof renderFornitori === "function") await renderFornitori(); } catch (e2) {}
    fattfForm({ lavoro_id: g.lavoro_id, data: g.data });
    return;
  }
});
/* la fattura la salva il modulo di sempre (save-fattf): quando ha finito e la
   finestra si e' chiusa, le giornate si rileggono */
document.addEventListener("click", function (e) {
  const b = e.target.closest && e.target.closest('[data-action="save-fattf"]');
  if (!b || !gxAperta || !gxAperta.fattura) return;
  let giri = 0;
  (function aspetta() {
    const ov = document.getElementById("overlay");
    if (ov && !ov.classList.contains("open")) {
      gxAperta = null;
      const s = document.getElementById("giornate");
      if (s && s.classList.contains("active")) gxRicarica();
      return;
    }
    if (++giri < 40) setTimeout(aspetta, 300);
  })();
});

/* =====================================================================
   20 nov 2026 — PER IL CLIENTE: il lavoro svolto e il PDF «Resoconto del
   lavoro». Chiesto da Alex, come sulla sua pagina «Giornate di cantiere».
   ⛔ Nel PDF del cliente NON ci vanno: nomi degli operai, ore, spese, note
      interne, luogo (in un giorno ci possono essere piu' clienti).
      Ci vanno: nome e logo della ditta, la data, il lavoro svolto, le foto
      prima e dopo, due per riga.
   ⛔ Il lavoro svolto sta in gest_rapportini.didascalia (una giornata = un
      rapportino). Se la colonna manca (migrazione non lanciata) si dice.
   ===================================================================== */
const GX_GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
const GX_MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
function gxDataLunga(iso, conGiorno) { const d = new Date(iso + "T12:00"); return (conGiorno ? GX_GIORNI[d.getDay()] + " " : "") + d.getDate() + " " + GX_MESI[d.getMonth()] + " " + d.getFullYear(); }
function gxColonnaManca(err) { return !!(err && /didascalia/i.test(err.message || "") && /column|colonna|schema/i.test(err.message || "")); }

function gxResoconto(g) {
  gxAperta = { lavoro_id: g.lavoro_id, data: g.data, k: g.k };
  const d = gxDella(g, false), k = esc(g.k);
  const senzaRap = !g.rapportino_id;
  const manca = (typeof giorDidaManca !== "undefined" && giorDidaManca);
  const fotoTxt = !d.foto.length ? "Nel PDF non ci sono foto." : "Nel PDF: " + [d.prima.length ? d.prima.length + " foto prima" : "", d.dopo.length ? d.dopo.length + " foto dopo" : ""].filter(Boolean).join(" e ") + ".";
  const pro = (typeof _gPro==="function"&&_gPro());
  openSheetGrande("Per il cliente",
    '<div class="sh-b sh-centro"><div class="sh-tit gior-u">' + esc(gxTitolo(g)) + '</div>'
    + (senzaRap || manca
      ? '<p class="gx-vuoto">' + (manca ? "Il lavoro svolto non si può ancora salvare: manca un aggiornamento del database. Il PDF esce lo stesso, con le foto." : "Questa giornata è stata segnata nel modo vecchio: il lavoro svolto non si può salvare. Il PDF esce lo stesso, con le foto.") + '</p>'
      : '<div class="field"><label for="gx-dida">Lavoro svolto (lo legge il cliente)</label>'
        + '<textarea id="gx-dida" rows="4" placeholder="' + (pro ? 'Es. Sopralluogo con rilievo delle misure dell\'appartamento per la CILA.' : 'Es. Rimosse le vecchie piastrelle e posate le nuove in gres nel bagno.') + '">' + esc(g.didascalia || "") + '</textarea></div>'
        + '<div class="gx-dida-ai"><button type="button" class="btn" data-gx="dida-ai" data-k="' + k + '">Scrivilo con l\'AI · 1 credito</button><span>guarda le foto e le note della giornata</span></div>')
    + '<div class="gx-dida-foto">' + GX_IC.foto + '<span>' + esc(fotoTxt) + '</span> <button type="button" class="gx-link blu" data-gx="vedi-foto" data-k="' + k + '">Aggiungi o guarda le foto</button></div>'
    + '<p class="gx-dida-nota">' + (pro ? 'Nel PDF non ci sono i nomi dei collaboratori, le ore, le spese, le note e l\'indirizzo.' : 'Nel PDF non ci sono i nomi degli operai, le ore, le spese, le note e l\'indirizzo.') + '</p>'
    + '</div>',
    '<button class="btn b-cancel" data-action="close">Chiudi</button>'
    + (senzaRap || manca ? '' : '<button class="btn" data-gx="dida-salva" data-k="' + k + '">Salva</button>')
    + '<button class="btn-primary b-save" data-gx="dida-pdf" data-k="' + k + '">Scarica il PDF</button>');
}

/* salva il testo della casella se e' cambiato. true = a posto (anche se non c'era niente da salvare) */
async function gxDidaSalva(g) {
  const ta = document.getElementById("gx-dida"); if (!ta || !g.rapportino_id) return true;
  const t = (ta.value || "").trim().slice(0, 1500);
  if (t === (g.didascalia || "")) return true;
  const r = await sb.from("gest_rapportini").update({ didascalia: t || null }).eq("id", g.rapportino_id).select("id");
  if (r.error || !r.data || !r.data.length) {
    toast(gxColonnaManca(r.error) ? "Manca un aggiornamento del database: il lavoro svolto non si salva ancora." : "Non salvato: " + ((r.error && r.error.message) || "riprova"));
    return false;
  }
  g.didascalia = t;
  const gg = (giorRighe || []).find(x => x.k === g.k); if (gg) gg.didascalia = t;
  if (typeof giorDisegna === "function") giorDisegna();
  return true;
}

/* una foto del deposito, rimpicciolita: {url (dataURL jpeg), w, h}. null se non si apre */
async function gxImmagine(path, maxPx, q) {
  try {
    const su = await sb.storage.from("gestionale-foto").createSignedUrl(path, 600);
    const u = su && su.data && su.data.signedUrl; if (!u) return null;
    const res = await fetch(u); if (!res.ok) return null;
    const blob = await res.blob();
    const img = await new Promise((ok, ko) => { const im = new Image(); const ou = URL.createObjectURL(blob); im.onload = () => { ok(im); setTimeout(() => URL.revokeObjectURL(ou), 1000); }; im.onerror = ko; im.src = ou; });
    const k = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const cx = c.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, w, h); cx.drawImage(img, 0, 0, w, h);
    return { url: c.toDataURL("image/jpeg", q || 0.8), w, h };
  } catch (e) { return null; }
}

async function gxDidaAI(g, btn) {
  if (!window.AI || typeof window.AI.didascalia !== "function") { toast("L'assistente non è pronto: ricarica la pagina."); return; }
  const d = gxDella(g, false);
  const nota = [g.nota || "", (typeof giorLavoro === "function" && giorLavoro(g.lavoro_id) ? "Lavoro: " + (giorLavoro(g.lavoro_id).descrizione || "") : "")].filter(Boolean).join("\n");
  if (!d.foto.length && nota.trim().length < 3) { toast("Aggiungi prima qualche foto, così l'AI vede cosa avete fatto."); return; }
  const testoBtn = btn ? btn.textContent : "";
  if (btn) { btn.disabled = true; btn.textContent = "Guardo le foto…"; }
  try {
    const foto = [];
    for (const [lista, quando] of [[d.prima.slice(0, 3), "prima"], [d.dopo.slice(0, 3), "dopo"]]) {
      for (const f of lista) {
        const im = await gxImmagine(f.storage_path, 1024, 0.7);
        if (im) foto.push({ tipo: "image/jpeg", dati: im.url.split(",")[1], quando });
      }
    }
    const t = await window.AI.didascalia(nota, foto);
    if (t == null) return;   /* crediti finiti: l'avviso l'ha gia' dato */
    const ta = document.getElementById("gx-dida");
    if (ta) { ta.value = t; ta.focus(); }
    toast("Controlla il testo e premi «Salva».");
  } catch (e) {
    toast(e.message || "L'assistente non ha risposto. Riprova.");
  } finally {
    if (btn && btn.isConnected) { btn.disabled = false; btn.textContent = testoBtn; }
  }
}

/* le foto nel PDF, due per riga. st = {y, M, W}; restituisce y */
async function gxGrigliaPdf(doc, st, lista, maxPx, q) {
  const gap = 6, cw = (st.W - 2 * st.M - gap) / 2, ch = cw * 0.75;
  for (let i = 0; i < lista.length; i += 2) {
    if (st.y + ch > 284) { doc.addPage(); st.y = 18; }
    for (let j = 0; j < 2 && i + j < lista.length; j++) {
      const x = st.M + j * (cw + gap);
      const im = await gxImmagine(lista[i + j].storage_path, maxPx, q);
      doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3); doc.rect(x, st.y, cw, ch);
      if (!im) { doc.setFontSize(10); doc.setTextColor(120); doc.text("Foto non disponibile", x + cw / 2, st.y + ch / 2, { align: "center" }); doc.setTextColor(0); continue; }
      const k = Math.min(cw / im.w, ch / im.h), w = im.w * k, h = im.h * k;
      doc.addImage(im.url, "JPEG", x + (cw - w) / 2, st.y + (ch - h) / 2, w, h);
    }
    st.y += ch + gap;
  }
  return st.y;
}

async function gxPdfCliente(g) {
  if (!(await gxDidaSalva(g))) return;
  const d = gxDella(g, false), dida = (g.didascalia || "").trim();
  if (!d.foto.length && !dida) { toast("Scrivi il lavoro svolto o aggiungi le foto, poi scarica il PDF."); return; }
  if (!(await caricaJsPDF())) { toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova"); return; }
  const J = window.jspdf && window.jspdf.jsPDF; if (!J) return;
  toast("Preparo il PDF…");
  const doc = new J({ unit: "mm", format: "a4" }); const W = 210, M = 15;
  const T = x => String(x == null ? "" : x).replace(/[^\x00-\xFF€]/g, "");
  const st = { y: 18, M, W };
  if (typeof window.gestLogoPdf === "function") { try { st.y = await window.gestLogoPdf(doc, M, st.y) || st.y; } catch (e) {} }
  /* il nome della ditta: Dati azienda; se e' vuoto, il nome del profilo */
  let nome = "";
  /* 24 nov 2026 — leggeva anche «ragione_sociale», che in gest_azienda NON
     esiste: la lettura falliva sempre e usciva il nome del profilo del sito
     («Admin TrovaImpresa») invece di quello di Dati azienda. */
  try { const ra = await sb.from("gest_azienda").select("nome").eq("user_id", sbUid).maybeSingle(); nome = (ra && ra.data && ra.data.nome) || ""; } catch (e) {}
  if (!nome) { try { const ri = await sb.from("imprese").select("nome_attivita").eq("user_id", sbUid).maybeSingle(); nome = (ri && ri.data && ri.data.nome_attivita) || ""; } catch (e) {} }
  if (nome) { doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(10, 42, 77); doc.text(T(nome), M, st.y + 2); doc.setTextColor(0); st.y += 9; }
  doc.setDrawColor(255, 136, 0); doc.setLineWidth(0.8); doc.line(M, st.y, W - M, st.y); st.y += 11;
  const pro = (typeof _gPro==="function"&&_gPro());
  doc.setFont("helvetica", "bold"); doc.setFontSize(21); doc.text(pro ? "Resoconto dell'attività" : "Resoconto del lavoro", M, st.y); st.y += 7.5;
  const data = gxDataLunga(g.data, true);
  doc.setFont("helvetica", "normal"); doc.setFontSize(12); doc.setTextColor(90); doc.text(T(data.charAt(0).toUpperCase() + data.slice(1)), M, st.y); doc.setTextColor(0); st.y += 10;
  if (dida) {
    doc.setFontSize(12.5); const righe = doc.splitTextToSize(T(dida), W - 2 * M);
    righe.forEach(r => { if (st.y > 280) { doc.addPage(); st.y = 18; } doc.text(r, M, st.y); st.y += 6; });
    st.y += 6;
  }
  for (const [tit, lista] of [[pro ? "Prima dei lavori" : "Prima del lavoro", d.prima], [pro ? "Fine lavori" : "Dopo il lavoro", d.dopo]]) {
    if (!lista.length) continue;
    if (st.y + 60 > 284) { doc.addPage(); st.y = 18; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text(tit, M, st.y); st.y += 5;
    await gxGrigliaPdf(doc, st, lista, 1200, 0.75);
    st.y += 4;
  }
  doc.save("Lavoro del " + gxDataLunga(g.data, false) + ".pdf");
}

/* nel PDF del mese (giorPdf): in fondo «Foto dei lavori», giornata per giornata.
   Questo PDF e' per te o per il consulente: qui il cantiere si scrive. */
async function gxFotoMesePdf(doc, y, M, W) {
  const T = x => String(x == null ? "" : x).replace(/[^\x00-\xFF€]/g, "");
  const st = { y, M, W };
  const giornate = [...(giorRighe || [])].sort((a, b) => a.data.localeCompare(b.data)).map(g => ({ g, d: gxDella(g, false) })).filter(x => x.d.foto.length);
  if (!giornate.length) return y;
  doc.addPage(); st.y = 20;
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(((typeof _gPro==="function"&&_gPro())) ? "Foto delle pratiche" : "Foto dei lavori", M, st.y); st.y += 9;
  for (const { g, d } of giornate) {
    if (st.y + 70 > 284) { doc.addPage(); st.y = 20; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text(doc.splitTextToSize(T(gxTitolo(g).replace(/\u2014/g, "-")), W - 2 * M)[0], M, st.y); st.y += 6;
    if (g.didascalia) { doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.splitTextToSize(T(g.didascalia), W - 2 * M).forEach(r => { doc.text(r, M, st.y); st.y += 5; }); st.y += 1; }
    for (const [tit, lista] of [["Prima", d.prima], ["Dopo", d.dopo]]) {
      if (!lista.length) continue;
      if (st.y + 50 > 284) { doc.addPage(); st.y = 20; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(90); doc.text(tit, M, st.y); doc.setTextColor(0); st.y += 3;
      await gxGrigliaPdf(doc, st, lista, 1000, 0.72);
    }
    st.y += 6;
  }
  return st.y;
}
