/* =====================================================================
   10 nov 2026 — LA GIORNATA COMPLETA MANDATA DAL TELEFONO (lato capo)
   L'operaio, dalla sua app, manda il giorno, il lavoro, cosa ha fatto,
   le FOTO, le SPESE e le BOLLE (gest_giornate_proposte.extra, vedi
   sql/giornata-completa.sql). Qui:
   · gpcExtraHTML(p)   — nella scheda «Da approvare» si vedono foto, spese
                         e bolle, prima di decidere;
   · gpcApprovaExtra() — con «Approva»: le spese vanno in gest_spese, le
                         foto e le bolle fra le foto del lavoro di quel
                         giorno (gest_foto). Nessun file si copia: resta
                         dov'e' e si collega.
   · «Leggi la bolla»  — apre il modulo «Fattura da pagare» di sempre con
                         la foto gia' dentro: l'AI legge fornitore e merce.
   ⛔ Niente entra nei conti finche' il capo non preme «Approva».
   ===================================================================== */
const GPC_BUCKET = "gestionale-foto";
const _gpcUrl = {};

function gpcExtra(p) {
  let x = p && p.extra;
  if (typeof x === "string") { try { x = JSON.parse(x); } catch (e) { x = {}; } }
  x = x || {};
  const arr = v => Array.isArray(v) ? v : [];
  return { spese: arr(x.spese), foto: arr(x.foto).filter(f => f && f.path), bolle: arr(x.bolle).filter(f => f && f.path) };
}
function _gpcEuro(n) { return (+n || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true }) + " €"; }
/* un file e' buono solo se sta nella cartella della giornata di QUESTA impresa */
function _gpcPathOk(path) { return typeof path === "string" && sbUid && path.indexOf(sbUid + "/giornate/") === 0 && path.indexOf("..") < 0; }

function gpcExtraHTML(p) {
  const x = gpcExtra(p);
  if (!x.spese.length && !x.foto.length && !x.bolle.length) return "";
  let h = '<div class="gpc">';
  if (x.foto.length) {
    h += '<div class="gpc-t">Foto (' + x.foto.length + ')</div><div class="gpc-foto">'
      + x.foto.map(f => '<a class="gpc-img" data-gpc-path="' + esc(f.path) + '" target="_blank" rel="noopener"><img alt="" data-gpc-img="' + esc(f.path) + '"></a>').join("")
      + '</div>';
  }
  if (x.spese.length) {
    const tot = x.spese.reduce((s, v) => s + (+v.importo || 0), 0);
    h += '<div class="gpc-t">Spese</div>'
      + x.spese.map(v => '<div class="gpc-sp"><span>' + esc(v.cosa || "Spesa") + '</span><b>' + _gpcEuro(v.importo) + '</b></div>').join("")
      + (x.spese.length > 1 ? '<div class="gpc-sp gpc-tot"><span>Totale</span><b>' + _gpcEuro(tot) + '</b></div>' : "");
  }
  if (x.bolle.length) {
    h += '<div class="gpc-t">Bolle e fatture (' + x.bolle.length + ')</div>'
      + x.bolle.map((f, i) => '<div class="gpc-bolla">'
        + (/pdf/i.test(f.tipo || f.nome || "") ? '<a class="gpc-pdf" data-gpc-path="' + esc(f.path) + '" target="_blank" rel="noopener">PDF</a>'
          : '<a class="gpc-img" data-gpc-path="' + esc(f.path) + '" target="_blank" rel="noopener"><img alt="" data-gpc-img="' + esc(f.path) + '"></a>')
        + '<button type="button" class="gpc-leggi" data-gpc="leggi" data-id="' + esc(p.id) + '" data-i="' + i + '">Leggi la bolla</button></div>').join("")
      + '<div class="gnota">«Leggi la bolla» apre il modulo di sempre e l\'AI scrive fornitore e merce (1 credito). Se non la leggi, con «Approva» resta comunque fra le foto di quel giorno.</div>';
  }
  h += '</div>';
  setTimeout(gpcRiempiImmagini, 0);
  return h;
}

async function gpcRiempiImmagini() {
  const els = Array.from(document.querySelectorAll("[data-gpc-path]"));
  const servono = [...new Set(els.map(a => a.dataset.gpcPath))].filter(pth => _gpcPathOk(pth) && !_gpcUrl[pth]);
  if (servono.length) {
    try {
      const { data } = await sb.storage.from(GPC_BUCKET).createSignedUrls(servono, 3600);
      (data || []).forEach(u => { if (u && u.path && u.signedUrl) _gpcUrl[u.path] = u.signedUrl; });
    } catch (e) {}
  }
  els.forEach(a => {
    const u = _gpcUrl[a.dataset.gpcPath]; if (!u) return;
    a.href = u;
    const img = a.querySelector("img"); if (img && !img.src) img.src = u;
  });
}

/* con «Approva»: spese e foto entrano nel lavoro di quel giorno */
async function gpcApprovaExtra(p, nome) {
  const x = gpcExtra(p);
  if (!x.spese.length && !x.foto.length && !x.bolle.length) return "";
  /* il lavoro: quello scelto dall'operaio, o quello che giorScrivi ha trovato/creato col nome */
  let lav = p.lavoro_id ? (giorLav || []).find(l => String(l.id) === String(p.lavoro_id)) : null;
  if (!lav) lav = (giorLav || []).find(l => _gNorm(_gNomeLav(l)) === _gNorm(p.dove));
  if (!lav) throw new Error("non trovo il cantiere: foto e spese non salvate");
  const pezzi = [];
  if (x.spese.length) {
    const righe = x.spese.map(v => ({ user_id: sbUid, lavoro_id: lav.id, descrizione: String(v.cosa || "Spesa").slice(0, 200), importo: Math.round((+v.importo || 0) * 100) / 100, data: p.data, inserito_da: nome, creato_da: p.operatore_id || null }))
      .filter(r => r.importo > 0);
    if (righe.length) {
      const r = await sb.from("gest_spese").insert(righe).select("id");
      if (r.error || !r.data || r.data.length !== righe.length) throw new Error("spese non salvate (" + ((r.error && r.error.message) || "nessuna riga") + ")");
      pezzi.push(righe.length === 1 ? "1 spesa" : righe.length + " spese");
    }
  }
  const file = x.foto.concat(x.bolle).filter(f => _gpcPathOk(f.path));
  if (file.length) {
    const quando = new Date(p.data + "T12:00:00").toISOString();
    const righe = file.map(f => ({ user_id: sbUid, lavoro_id: lav.id, tipo: "fatto", operatore: nome, storage_path: f.path, created_at: quando, nome_file: f.nome || null }));
    const r = await sb.from("gest_foto").insert(righe).select("id");
    if (r.error || !r.data || r.data.length !== righe.length) throw new Error("foto non collegate (" + ((r.error && r.error.message) || "nessuna riga") + ")");
    pezzi.push(file.length === 1 ? "1 foto" : file.length + " foto");
  }
  return pezzi.length ? " — con " + pezzi.join(" e ") + "." : "";
}

/* «Leggi la bolla»: il modulo «Fattura da pagare» con la foto gia' dentro */
async function gpcLeggiBolla(id, i) {
  const p = (giorProposte || []).find(x => String(x.id) === String(id)); if (!p) return;
  const b = gpcExtra(p).bolle[+i]; if (!b || !_gpcPathOk(b.path)) return;
  if (typeof fattfForm !== "function") { toast("Il modulo della fattura non è disponibile: ricarica la pagina."); return; }
  toast("Apro la bolla…");
  let file;
  try {
    const d = await sb.storage.from(GPC_BUCKET).download(b.path);
    if (d.error || !d.data) throw new Error((d.error && d.error.message) || "file non trovato");
    const tipo = d.data.type || (/\.pdf$/i.test(b.path) ? "application/pdf" : "image/jpeg");
    file = new File([d.data], b.nome || b.path.split("/").pop(), { type: tipo });
  } catch (e) { toast("Non riesco ad aprire la bolla: " + e.message); return; }
  try { if (typeof fornCache !== "undefined" && !fornCache.length && typeof renderFornitori === "function") await renderFornitori(); } catch (e) {}
  await fattfForm({ lavoro_id: p.lavoro_id || null, data: p.data });
  if (typeof ffFotoLeggi === "function") ffFotoLeggi(file);
}

document.addEventListener("click", function (e) {
  const b = e.target.closest && e.target.closest('[data-gpc="leggi"]'); if (!b) return;
  gpcLeggiBolla(b.dataset.id, b.dataset.i);
});

(function () {
  const st = document.createElement("style");
  st.textContent =
    "#giornate .gpc{max-width:760px;display:flex;flex-direction:column;gap:8px;background:#f8fafc;border:1px solid var(--bordo,#e2e8f0);border-radius:12px;padding:12px}" +
    "#giornate .gpc-t{font-size:15px;font-weight:800;color:var(--testo,#0f172a);margin-top:4px}" +
    "#giornate .gpc-foto{display:flex;flex-wrap:wrap;gap:8px}" +
    "#giornate .gpc-img{display:block;width:96px;height:96px;border-radius:10px;overflow:hidden;background:#e2e8f0;border:1px solid var(--bordo,#e2e8f0)}" +
    "#giornate .gpc-img img{width:100%;height:100%;object-fit:cover;display:block}" +
    "#giornate .gpc-sp{display:flex;justify-content:space-between;gap:12px;font-size:16px;color:var(--testo,#0f172a);border-bottom:1px solid var(--bordo,#e2e8f0);padding:6px 0}" +
    "#giornate .gpc-sp b{white-space:nowrap}" +
    "#giornate .gpc-tot{border-bottom:0;font-weight:800}" +
    "#giornate .gpc-bolla{display:flex;align-items:center;gap:12px;flex-wrap:wrap}" +
    "#giornate .gpc-pdf{display:flex;align-items:center;justify-content:center;width:96px;height:96px;border-radius:10px;background:#fff;border:1.5px solid var(--bordo-forte,#cbd5e1);font-weight:800;font-size:18px;color:#b3261e;text-decoration:none}" +
    "#giornate .gpc-leggi{background:#fff;color:var(--blu,#0066ff);border:1.5px solid var(--blu,#0066ff);border-radius:10px;padding:10px 16px;font-size:16px;font-weight:700;cursor:pointer;min-height:44px}";
  document.head.appendChild(st);
})();
