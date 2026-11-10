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
  const [foto, spese, rif, fatt, mezzi] = await Promise.all([
    tenta(ids.length ? sb.from("gest_foto").select("id,lavoro_id,tipo,created_at,storage_path").eq("user_id", sbUid).in("lavoro_id", ids).in("tipo", ["da_fare", "fatto"]).gte("created_at", isoDa).lt("created_at", isoA) : vuota),
    tenta(sb.from("gest_spese").select("id,lavoro_id,descrizione,importo,data,created_at").eq("user_id", sbUid)
      .or('and(data.gte.' + da + ',data.lt.' + a + '),and(data.is.null,created_at.gte."' + isoDa + '",created_at.lt."' + isoA + '")')),
    tenta(sb.from("gest_rifornimenti").select("id,data,importo,km,mezzo_id,distributore").eq("user_id", sbUid).gte("data", da).lt("data", a)),
    tenta(sb.from("gest_fatture_fornitori").select("id,lavoro_id,data,importo,numero").eq("user_id", sbUid).gte("data", da).lt("data", a)),
    tenta(sb.from("gest_mezzi").select("id,nome,mestiere_id").eq("user_id", sbUid).order("nome"))
  ]);
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
    spese: gxDati.spese.filter(s => String(s.lavoro_id) === L && gxGiorno(s) === g.data),
    rif: primaDelGiorno ? gxDati.rif.filter(r => r.data === g.data) : [],
    fatt: gxDati.fatt.filter(f => String(f.lavoro_id || "") === L && f.data === g.data)
  };
}
function gxNomeMezzo(id) { const m = gxDati.mezzi.find(x => String(x.id) === String(id)); return m ? m.nome : ""; }
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
  if (d.foto.length) ha.push('<button type="button" data-gx="vedi-foto" data-k="' + k + '">' + GX_IC.foto + d.foto.length + " foto" + '</button>');
  if (d.spese.length) ha.push('<button type="button" data-gx="spesa" data-k="' + k + '">' + GX_IC.spesa + d.spese.length + (d.spese.length === 1 ? " spesa" : " spese") + " · " + gxEuro(gxSomma(d.spese)) + '</button>');
  if (d.rif.length) {
    const km = d.rif.reduce((s, r) => s + (+r.km || 0), 0);
    const mezzi = [...new Set(d.rif.map(r => gxNomeMezzo(r.mezzo_id)).filter(Boolean))];
    ha.push('<button type="button" data-gx="benz" data-k="' + k + '">' + GX_IC.benz + gxEuro(gxSomma(d.rif)) + (km > 0 ? " · " + gxKm(km) : "") + (mezzi.length ? " · " + esc(mezzi.join(", ")) : "") + '</button>');
  }
  if (d.fatt.length) ha.push('<span>' + GX_IC.fatt + d.fatt.length + (d.fatt.length === 1 ? " fattura" : " fatture") + " · " + gxEuro(gxSomma(d.fatt)) + '</span>');
  return (ha.length ? '<div class="gx-ha">' + ha.join("") + '</div>' : "")
    + '<div class="gx-btn">'
    + '<button type="button" data-gx="foto" data-k="' + k + '">' + GX_IC.foto + 'Foto</button>'
    + '<button type="button" data-gx="spesa" data-k="' + k + '">' + GX_IC.spesa + 'Spesa</button>'
    + '<button type="button" data-gx="benz" data-k="' + k + '">' + GX_IC.benz + 'Benzina e km</button>'
    + '<button type="button" data-gx="fatt" data-k="' + k + '">' + GX_IC.fatt + 'Fattura o bolla</button>'
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
function gxScegliFoto(g) {
  let f = document.getElementById("gx-file");
  if (!f) {
    f = document.createElement("input"); f.type = "file"; f.id = "gx-file"; f.accept = "image/*"; f.multiple = true; f.style.display = "none";
    document.body.appendChild(f);
  }
  f.value = "";
  f.onchange = function () { if (f.files && f.files.length) gxCaricaFoto(g, f.files); };
  f.click();
}
async function gxCaricaFoto(g, files) {
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
    const riga = { user_id: sbUid, lavoro_id: g.lavoro_id, tipo: "fatto", operatore: "Capo", storage_path: path };
    /* la foto di un giorno passato resta su QUEL giorno */
    if (g.data !== gxYmd(new Date())) riga.created_at = new Date(g.data + "T12:00:00").toISOString();
    const ins = await sb.from("gest_foto").insert(riga).select("id");
    if (ins.error || !ins.data || !ins.data.length) {
      try { await sb.storage.from("gestionale-foto").remove([path]); } catch (e) {}
      toast("Foto non salvata: " + ((ins.error && ins.error.message) || "riprova")); continue;
    }
    n++;
  }
  if (n) toast(n === 1 ? "Foto aggiunta ✔" : n + " foto aggiunte ✔");
  await gxRicarica();
}
async function gxVediFoto(g) {
  const d = gxDella(g, false);
  openSheetGrande("Foto",
    '<div class="sh-b sh-centro"><div class="sh-tit">' + esc(gxTitolo(g)) + '</div>'
    + '<div id="gx-griglia" class="gx-griglia"><div class="loading">Carico…</div></div></div>',
    '<button class="btn b-cancel" data-action="close">Chiudi</button>'
    + '<button class="btn-primary b-save" data-gx="foto" data-k="' + esc(g.k) + '">+ Aggiungi foto</button>');
  const box = document.getElementById("gx-griglia"); if (!box) return;
  const pezzi = [];
  for (const f of d.foto) {
    try {
      const su = await sb.storage.from("gestionale-foto").createSignedUrl(f.storage_path, 3600);
      if (su && su.data && su.data.signedUrl) pezzi.push('<a href="' + esc(su.data.signedUrl) + '" target="_blank" rel="noopener"><img src="' + esc(su.data.signedUrl) + '" alt="Foto del lavoro" loading="lazy"></a>');
    } catch (e) {}
  }
  if (document.getElementById("gx-griglia") === box) box.innerHTML = pezzi.length ? pezzi.join("") : '<div class="gx-vuoto">Le foto non si riescono ad aprire adesso. Riprova fra poco.</div>';
}

/* ---------------------------------------------------------------------
   SPESA
   --------------------------------------------------------------------- */
function gxSpesaApri(g) {
  gxAperta = { lavoro_id: g.lavoro_id, data: g.data, k: g.k };
  const d = gxDella(g, false);
  const righe = d.spese.map(function (s) {
    const aspetta = gxTogli === "spesa:" + s.id;
    return '<div class="gx-riga"><div class="t">' + esc(s.descrizione || "Spesa") + '</div><b>' + gxEuro(s.importo) + '</b>'
      + (aspetta ? '<button type="button" class="gx-si" data-gx="spesa-togli-si" data-id="' + esc(String(s.id)) + '">Sì, togli</button>'
                 : '<button type="button" class="gx-link" data-gx="spesa-togli" data-id="' + esc(String(s.id)) + '">togli</button>')
      + '</div>';
  }).join("");
  openSheetGrande("Spesa",
    '<div class="sh-b sh-centro"><div class="sh-tit">' + esc(gxTitolo(g)) + '</div>'
    + (righe ? '<div class="gx-lista">' + righe + '</div>' : '')
    + '<div class="field"><label>Cosa hai comprato</label><input type="text" id="gx-sp-desc" placeholder="Es. sabbia e cemento" autocomplete="off"></div>'
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
  if (testo && importo == null) { toast("Non ho capito l'importo: scrivilo come 12,50"); return; }
  if (importo == null || importo <= 0) { toast("Scrivi quanto hai speso, per esempio 12,50"); return; }
  if (!descrizione) { toast("Scrivi cosa hai comprato"); return; }
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
    return '<div class="gx-riga"><div class="t">' + esc(gxNomeMezzo(r.mezzo_id) || "Mezzo") + (+r.km > 0 ? " · " + gxKm(r.km) : "") + (r.distributore ? " · " + esc(r.distributore) : "") + '</div><b>' + gxEuro(r.importo) + '</b>'
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
  if (tImp && importo == null) { toast("Non ho capito la benzina: scrivila come 50 o 50,00"); return; }
  if (tKm && kmN == null) { toast("Non ho capito i chilometri: scrivi solo il numero, per esempio 120"); return; }
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
  if (a === "foto") { if (g) gxScegliFoto(g); return; }
  if (a === "vedi-foto") { if (g) gxVediFoto(g); return; }
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
