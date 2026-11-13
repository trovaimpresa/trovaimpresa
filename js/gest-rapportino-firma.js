/* ═══ 13 nov 2026 — IL RAPPORTINO DA FAR FIRMARE AL CLIENTE (lista «MANCA», n. 6) ═══
   Dentro il lavoro, nel riquadro «Rapportini di giornata»:
     · «＋ Rapportino da far firmare»: il titolare scrive la giornata (cosa è
       stato fatto, materiali) e il cliente firma col dito sullo schermo;
     · su ogni rapportino (anche quelli scritti dal telefono della squadra)
       «Fai firmare al cliente», oppure «Firmato da … il …».
   Il foglio PDF esce con le ore del registro di quel giorno, i materiali e le
   due firme.

   ⛔ LA FIRMA VALE SOLO PER IL TESTO CHE C'ERA. Come nel capitolato: con la
   firma si salva l'impronta del rapportino (giorno, cosa è stato fatto,
   materiali, ore). Se dopo cambia qualcosa, la firma non vale più, il foglio
   esce senza e lo dice.
   ⛔ Le ORE non si scrivono qui: si leggono dal registro del lavoro
   (gest_ore di quel lavoro e di quel giorno). Due posti per le ore vogliono
   dire due numeri diversi.
   ⛔ La firma sta nella riga del rapportino (gest_rapportini.firma_cliente,
   sql/2026-11-13-rapportino-firma-voci.sql), non in un file a parte.

   pdfFirme() è il disegnatore delle firme dei PDF dell'App (rapportino, SAL):
   righe, nomi sotto, e il disegno della firma sopra la riga se c'è.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ---- le firme in un PDF: N colonne uguali, alte PDF_FIRME_ALTE mm ---- */
const PDF_FIRME_ALTE = 34;
function pdfFirme(doc, y, M, R, colonne) {
  const n = colonne.length, gap = 10, larg = (R - M - gap * (n - 1)) / n;
  y += 18;
  colonne.forEach(function (c, i) {
    const x = M + i * (larg + gap);
    if (c.img) { try { doc.addImage(c.img, "PNG", x + 2, y - 17, Math.min(larg - 4, 55), 16); } catch (e) {} }
    doc.setDrawColor(120); doc.setLineWidth(.2); doc.line(x, y, x + larg, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(90);
    doc.text(String(c.etichetta || ""), x, y + 5);
    let yy = y + 9.5;
    doc.setFontSize(8);
    if (c.nome) { doc.text(doc.splitTextToSize(String(c.nome), larg)[0], x, yy); yy += 4; }
    if (c.quando) { doc.text(String(c.quando), x, yy); }
  });
  doc.setTextColor(0);
  return y + 16;
}
window.pdfFirme = pdfFirme;

(function () {
  "use strict";
  let _rf = null;        /* il rapportino aperto: {id, lavoro, cli, ore, firma, nuovaFirma} */
  let _pad = null;       /* la tela della firma */

  function pronto() { return typeof sb !== "undefined" && sb && typeof sbUid !== "undefined" && sbUid; }
  function el(id) { return document.getElementById(id); }
  function V(id) { const e = el(id); return e ? String(e.value || "").trim() : ""; }
  function oraIt(iso) {
    try { const d = new Date(iso); return d.toLocaleDateString("it-IT") + " alle " + d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }); }
    catch (e) { return ""; }
  }
  function oreTesto(n) { return String(Math.round((+n || 0) * 100) / 100).replace(".", ",") + " h"; }
  function colonnaManca(err) { return /firma_cliente|schema cache|column/i.test(String((err && err.message) || "")); }

  /* l'impronta: giorno, testi e ore. Cambia uno → la firma non vale più */
  function impronta(data, cosa, mat, ore) {
    const s = JSON.stringify([data || "", cosa || "", mat || "", (ore || []).map(o => [o.nome, +o.ore || 0]).sort()]);
    let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return "r" + (h >>> 0).toString(36) + "-" + s.length;
  }
  function firmaValida(f, data, cosa, mat, ore) { return !!(f && f.img && f.hash && f.hash === impronta(data, cosa, mat, ore)); }
  window.rapfFirmaValida = function (r, ore) { return firmaValida(r && r.firma_cliente, r && r.data, r && r.note, r && r.materiali, ore); };

  /* le ore di quel lavoro in quel giorno, coi nomi */
  async function leggiOre(lavoroId, data) {
    const r = await sb.from("gest_ore").select("operatore_id,ore").eq("user_id", sbUid).eq("lavoro_id", lavoroId).eq("data", data).is("eliminato_il", null);
    if (r.error) return null;
    const righe = r.data || [], ids = [...new Set(righe.map(o => o.operatore_id).filter(Boolean))];
    const nomi = {};
    (typeof dipCache !== "undefined" ? dipCache : []).forEach(d => { nomi[d.id] = d.nome; });
    const mancano = ids.filter(i => !nomi[i]);
    if (mancano.length) {
      const ro = await sb.from("gest_operatori").select("id,nome").in("id", mancano);
      ((ro && ro.data) || []).forEach(o => { nomi[o.id] = o.nome; });
    }
    const per = {};
    righe.forEach(o => { const n = (o.operatore_id && nomi[o.operatore_id]) || "Senza nome"; per[n] = (per[n] || 0) + (+o.ore || 0); });
    return Object.keys(per).sort().map(n => ({ nome: n, ore: Math.round(per[n] * 100) / 100 }));
  }

  function oreHtml(ore) {
    if (ore === null) return '<div class="rapf-ore-v">Non riesco a leggere le ore di questo giorno.</div>';
    if (!ore.length) return '<div class="rapf-ore-v">Nel registro del lavoro non ci sono ore per questo giorno.</div>';
    const tot = ore.reduce((s, o) => s + o.ore, 0);
    return ore.map(o => '<div class="rapf-ora"><span>' + esc(o.nome) + '</span><b>' + oreTesto(o.ore) + '</b></div>').join("")
      + '<div class="rapf-ora rapf-ora--tot"><span>In tutto</span><b>' + oreTesto(tot) + '</b></div>';
  }

  /* ---- la tela della firma: dito sul telefono, mouse sul computer ---- */
  function attivaPad() {
    const tela = el("rapf-pad"); if (!tela) return;
    const r0 = tela.getBoundingClientRect();
    tela.width = 800; tela.height = 240;
    const ctx = tela.getContext("2d");
    ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#111";
    let giu = false, ultimo = null;
    _pad = { tela: tela, scritto: false };
    const dove = ev => { const r = tela.getBoundingClientRect(); return { x: (ev.clientX - r.left) * (tela.width / r.width), y: (ev.clientY - r.top) * (tela.height / r.height) }; };
    tela.addEventListener("pointerdown", ev => { giu = true; ultimo = dove(ev); ev.preventDefault(); try { tela.setPointerCapture(ev.pointerId); } catch (e) {} });
    tela.addEventListener("pointermove", ev => { if (!giu) return; const p = dove(ev); ctx.beginPath(); ctx.moveTo(ultimo.x, ultimo.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ultimo = p; _pad.scritto = true; ev.preventDefault(); stato(); });
    const fine = () => { giu = false; };
    tela.addEventListener("pointerup", fine); tela.addEventListener("pointercancel", fine); tela.addEventListener("pointerleave", fine);
    void r0;
  }
  /* si ritaglia intorno al segno: pesa poco e sul foglio viene grande */
  function ritaglia(tela) {
    let d; try { d = tela.getContext("2d").getImageData(0, 0, tela.width, tela.height); } catch (e) { return tela.toDataURL("image/png"); }
    const a = d.data, W = tela.width, H = tela.height; let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (a[(y * W + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return "";
    const p = 10; x0 = Math.max(0, x0 - p); y0 = Math.max(0, y0 - p); x1 = Math.min(W - 1, x1 + p); y1 = Math.min(H - 1, y1 + p);
    const c2 = document.createElement("canvas"); c2.width = x1 - x0 + 1; c2.height = y1 - y0 + 1;
    c2.getContext("2d").drawImage(tela, x0, y0, c2.width, c2.height, 0, 0, c2.width, c2.height);
    return c2.toDataURL("image/png");
  }

  /* la riga sotto la firma: dice com'è messa, a parole */
  function stato() {
    const st = el("rapf-st"); if (!st || !_rf) return;
    st.className = "rapf-st";
    if (_pad && _pad.scritto) { st.textContent = "Firma pronta: premi «Salva»."; return; }
    const f = _rf.firma;
    if (!f || !f.img) { st.textContent = "Non ancora firmato."; return; }
    if (firmaValida(f, V("rapf-data"), V("rapf-cosa"), V("rapf-mat"), _rf.ore)) { st.className = "rapf-st rapf-st--ok"; st.textContent = "Firmato da " + (f.nome || "il cliente") + " il " + oraIt(f.data) + "."; }
    else { st.className = "rapf-st rapf-st--err"; st.textContent = "Il rapportino è cambiato dopo la firma: la firma non vale più. Fai firmare di nuovo."; }
  }
  function disegnaFirma() {
    const box = el("rapf-firma-box"); if (!box || !_rf) return;
    const f = _rf.firma;
    box.innerHTML = (f && f.img)
      ? '<img class="rapf-firma-img" src="' + f.img + '" alt="La firma del cliente">'
      : '<canvas class="rapf-pad" id="rapf-pad" aria-label="Firma del cliente"></canvas>';
    const b = el("rapf-firma-b");
    if (b) b.innerHTML = (f && f.img)
      ? '<button type="button" class="btn" data-action="rapf-rifai">Rifai la firma</button>'
      : '<button type="button" class="btn" data-action="rapf-cancella">Cancella la firma</button>';
    if (!(f && f.img)) attivaPad();
    stato();
  }

  /* ---- la finestra ---- */
  async function apri(lavoroId, rapId) {
    if (!pronto()) { toast("Devi essere collegato"); return; }
    const rl = await sb.from("gest_lavori").select("id,descrizione,dove,cliente_id,mestiere_id").eq("id", lavoroId).eq("user_id", sbUid).maybeSingle();
    if (rl.error || !rl.data) { toast("Non riesco a leggere il lavoro: riprova fra un momento."); return; }
    let r = { data: todayStr(), note: "", materiali: "", firma_cliente: null };
    if (rapId) {
      const rr = await sb.from("gest_rapportini").select("*").eq("id", rapId).eq("user_id", sbUid).maybeSingle();
      if (rr.error || !rr.data) { toast("Non riesco a leggere il rapportino: riprova fra un momento."); return; }
      r = rr.data;
    }
    const cli = await cliDelDocumento(rl.data.cliente_id, "nome,indirizzo,cap,citta,prov,referente");
    const ore = await leggiOre(lavoroId, r.data || todayStr());
    _rf = { id: rapId || null, lavoro: rl.data, cli: cli || {}, ore: ore, firma: r.firma_cliente || null };
    _pad = null;
    const f = _rf.firma || {};
    const corpo = '<div class="sh-cols">'
      + '<div class="sh-col"><div class="sh-tit">Il rapportino</div>'
      + '<div class="sh-b">'
      + '<div class="field"><label>Lavoro</label><div class="sh-nota" style="margin:0">' + esc(rl.data.descrizione || "—") + (cli.nome ? " · " + esc(cli.nome) : "") + '</div></div>'
      + '<div class="field"><label for="rapf-data">Che giorno</label><input type="date" id="rapf-data" value="' + esc(r.data || todayStr()) + '"></div>'
      + '<div class="field"><label for="rapf-cosa">Cosa è stato fatto</label><textarea id="rapf-cosa" rows="4" placeholder="Es. Posato il pavimento della cucina, stuccato le fughe">' + esc(r.note || "") + '</textarea></div>'
      + '<div class="field"><label for="rapf-mat">Materiali usati</label><textarea id="rapf-mat" rows="2" placeholder="Es. 6 sacchi di colla, 2 di stucco">' + esc(r.materiali || "") + '</textarea></div>'
      + '<div class="field"><label>Chi c\'era e quante ore</label><div id="rapf-ore">' + oreHtml(ore) + '</div>'
      + '<div class="campo-aiuto">Le ore si segnano nel registro del lavoro: qui si leggono.</div></div>'
      + '</div></div>'
      + '<div class="sh-col"><div class="sh-tit">La firma del cliente</div>'
      + '<div class="sh-b">'
      + '<div class="field"><label for="rapf-nome">Nome di chi firma</label><input id="rapf-nome" value="' + esc(f.nome || cli.nome || "") + '" placeholder="Nome e cognome"></div>'
      + '<div class="field"><label>Firma qui, col dito o col mouse</label><div id="rapf-firma-box"></div>'
      + '<div class="rapf-firma-b" id="rapf-firma-b"></div>'
      + '<div class="rapf-st" id="rapf-st" role="status"></div></div>'
      + '</div></div></div>';
    if (typeof closeSheet === "function") closeSheet();
    openSheetGrande("Rapportino da far firmare", corpo,
      '<button class="btn b-cancel" data-action="rapf-torna">Torna al lavoro</button>'
      + '<button class="btn" data-action="rapf-pdf">Scarica il PDF</button>'
      + '<button class="btn-primary b-save" data-action="rapf-salva">Salva</button>');
    disegnaFirma();
    ["rapf-cosa", "rapf-mat"].forEach(id => { const e = el(id); if (e) e.addEventListener("input", stato); });
    const d = el("rapf-data");
    if (d) d.addEventListener("change", async () => {
      _rf.ore = await leggiOre(_rf.lavoro.id, V("rapf-data") || todayStr());
      const b = el("rapf-ore"); if (b) b.innerHTML = oreHtml(_rf.ore);
      stato();
    });
  }
  window.rapfApri = apri;

  /* ---- il salvataggio: ritorna il rapportino salvato, o null ---- */
  async function salva(zitto) {
    if (!_rf || !pronto()) return null;
    const data = V("rapf-data") || todayStr(), cosa = V("rapf-cosa"), mat = V("rapf-mat"), nome = V("rapf-nome");
    if (!cosa && !mat && !(_rf.ore && _rf.ore.length)) { campoManca("#rapf-cosa", "Manca cosa è stato fatto: scrivilo qui."); return null; }
    let firma = _rf.firma;
    if (_pad && _pad.scritto) {
      if (!nome) { campoManca("#rapf-nome", "Manca il nome di chi firma: scrivilo qui."); return null; }
      const img = ritaglia(_pad.tela);
      firma = img ? { img: img, nome: nome, data: new Date().toISOString(), hash: impronta(data, cosa, mat, _rf.ore) } : null;
    } else if (firma && firma.img && nome && nome !== firma.nome) {
      firma = Object.assign({}, firma, { nome: nome });
    }
    const riga = { data: data, note: cosa || null, materiali: mat || null, firma_cliente: firma || null };
    let res;
    if (_rf.id) res = await sb.from("gest_rapportini").update(riga).eq("id", _rf.id).eq("user_id", sbUid).select("*");
    else res = await sb.from("gest_rapportini").insert(Object.assign({ user_id: sbUid, mestiere_id: _rf.lavoro.mestiere_id || (typeof curMestiere === "function" ? curMestiere() : null), lavoro_id: _rf.lavoro.id }, riga)).select("*");
    if (res.error && colonnaManca(res.error)) { toast("Non salvato: manca un aggiornamento del database. Avvisa l'assistenza."); return null; }
    if (res.error || !res.data || !res.data.length) { toast("Non salvato: " + ((res.error && (typeof traduciErrore === "function" ? traduciErrore(res.error.message || "") : res.error.message)) || "nessuna riga") + ". Riprova."); return null; }
    const r = res.data[0];
    _rf.id = r.id; _rf.firma = r.firma_cliente || null; _pad = null;
    disegnaFirma();
    if (!zitto) toast(firma && firma.img ? "Rapportino salvato, con la firma ✔" : "Rapportino salvato ✔");
    return r;
  }

  /* ---- il foglio PDF ---- */
  async function pdf() {
    if (!(await caricaJsPDF())) { toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova"); return; }
    const r = await salva(true); if (!r) return;
    const { data: az } = await sb.from("gest_azienda").select("*").eq("user_id", sbUid).maybeSingle();
    if (!az || !az.nome) { toast("Compila prima i Dati azienda"); return; }
    const L0 = _rf.lavoro, c = _rf.cli || {}, ore = _rf.ore || [];
    const firmaOk = firmaValida(r.firma_cliente, r.data, r.note, r.materiali, ore);
    const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: "mm", format: "a4" });
    const M = 18, R = 210 - M, L = R - M, FONDO = 272;
    let y = 20;
    const nuova = h => { if (y + h > FONDO) { doc.addPage(); y = 20; } };
    const titolo = t => { nuova(16); doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.text(t, M, y); y += 6; doc.setFont("helvetica", "normal"); doc.setFontSize(10); };
    const testo = t => { doc.splitTextToSize(String(t), L).forEach(l => { nuova(5); doc.text(l, M, y); y += 5; }); y += 3; };
    y = window.gestLogoPdf ? await window.gestLogoPdf(doc, M, y) : y;
    doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text(az.nome, M, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(90);
    let hy = y + 6;
    [az.piva ? "P.IVA " + az.piva : "", azIndirizzo(az), [az.tel ? "Tel " + az.tel : "", az.email || ""].filter(Boolean).join("   ")]
      .filter(Boolean).forEach(t => { doc.text(t, M, hy); hy += 4.5; });
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text("RAPPORTINO DI LAVORO", R, y, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(90); doc.text("del " + fdate(r.data), R, y + 6, { align: "right" }); doc.setTextColor(0);
    y = Math.max(hy, y + 12) + 3; doc.setDrawColor(210); doc.line(M, y, R, y); y += 9;
    titolo("Cliente");
    testo([c.nome || "—", cliIndirizzo(c)].filter(Boolean).join("\n"));
    titolo("Lavoro");
    testo([L0.descrizione || "—", L0.dove && L0.dove !== L0.descrizione ? "Dove: " + L0.dove : ""].filter(Boolean).join("\n"));
    titolo("Cosa è stato fatto");
    testo(r.note || "—");
    if (ore.length) {
      titolo("Chi c'era e quante ore");
      ore.forEach(o => { nuova(6); doc.text(o.nome, M, y); doc.text(oreTesto(o.ore).replace(" h", " ore"), R, y, { align: "right" }); y += 5.5; });
      const tot = ore.reduce((s, o) => s + o.ore, 0);
      nuova(7); doc.setDrawColor(210); doc.line(M, y - 3.5, R, y - 3.5); doc.setFont("helvetica", "bold");
      doc.text("In tutto", M, y + 1); doc.text(oreTesto(tot).replace(" h", " ore"), R, y + 1, { align: "right" }); doc.setFont("helvetica", "normal"); y += 9;
    }
    if (r.materiali) { titolo("Materiali usati"); testo(r.materiali); }
    /* le firme: un blocco solo, che non resta da solo su una pagina nuova */
    nuova(PDF_FIRME_ALTE + 14);
    y += 4; doc.setFontSize(9.5); doc.text("Per presa visione e accettazione dei lavori eseguiti.", M, y); y += 2;
    const f = r.firma_cliente || {};
    y = pdfFirme(doc, y, M, R, [
      { etichetta: "L'impresa", nome: az.nome },
      { etichetta: "Il cliente", img: firmaOk ? f.img : "", nome: firmaOk ? f.nome : (c.nome || ""), quando: firmaOk ? "Firmato il " + oraIt(f.data) : "" }
    ]);
    if (firmaOk) { doc.setFontSize(7.5); doc.setTextColor(120); doc.text("Firma elettronica semplice apposta sul dispositivo dell'Impresa.", M, y); doc.setTextColor(0); }
    doc.save("rapportino-" + String(r.data || "").slice(0, 10) + "-" + String(L0.descrizione || "lavoro").replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40) + ".pdf");
    toast(firmaOk ? "PDF del rapportino scaricato, con la firma ✅" : (f.img ? "PDF scaricato SENZA la firma: il rapportino è cambiato dopo" : "PDF del rapportino scaricato ✅"));
  }

  function torna() {
    const id = _rf && _rf.lavoro && _rf.lavoro.id;
    _rf = null; _pad = null;
    if (typeof closeSheet === "function") closeSheet();
    if (!id) return;
    const b = document.createElement("button"); b.dataset.action = "edit-job"; b.dataset.id = id; b.style.display = "none";
    document.body.appendChild(b); b.click(); b.remove();
  }

  document.addEventListener("click", async function (e) {
    const t = e.target.closest && e.target.closest('[data-action^="rapf-"]'); if (!t) return;
    const a = t.dataset.action;
    if (a === "rapf-nuovo") { const lid = (typeof oreLavoroId !== "undefined" && oreLavoroId) || t.dataset.lavoro; if (lid) apri(lid, null); return; }
    if (a === "rapf-apri") { const lid = (typeof oreLavoroId !== "undefined" && oreLavoroId) || t.dataset.lavoro; if (lid) apri(lid, t.dataset.id); return; }
    if (a === "rapf-cancella") { if (_pad) { _pad.tela.getContext("2d").clearRect(0, 0, _pad.tela.width, _pad.tela.height); _pad.scritto = false; } stato(); return; }
    if (a === "rapf-rifai") { if (_rf) { _rf.firma = null; disegnaFirma(); } return; }
    if (a === "rapf-salva") { t.disabled = true; const ok = await salva(false); t.disabled = false; if (ok) torna(); return; }
    if (a === "rapf-pdf") { t.disabled = true; try { await pdf(); } finally { t.disabled = false; } return; }
    if (a === "rapf-torna") { torna(); return; }
  });
})();
