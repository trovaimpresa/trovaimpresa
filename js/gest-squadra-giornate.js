/* =====================================================================
   TrovaImpresa — LA SQUADRA FATTA COME LE GIORNATE (10 novembre 2026)

   Chiesto da Alessio: «vorrei fare delle modifiche alla squadra, renderlo
   un po' come giornate di lavoro, credo che funzioni molto meglio».

   Prima la Squadra era una tabella (nome, mansione, telefono, documenti).
   Adesso ogni persona e' UNA SCHEDA GRANDE: il nome, i giorni lavorati nel
   mese (una striscia di quadretti, uno per giorno), gli avvisi dei
   documenti e tre tasti: Giornate, Messaggi, Scheda.
   «Giornate» apre il mese di quella persona, giorno per giorno.

   ⛔ NIENTE DI NUOVO NEL DATABASE: i giorni sono le stesse ore di Giornate
      (gest_ore), contate su TUTTA l'azienda come fa Giornate.
   ⛔ I tasti usano le azioni di sempre (chat-squadra, sq-edit, sq-wa...):
      qui cambia solo come si vede.
   ⛔ File non chiuso in una funzione: usa sb, sbUid, esc, toast, todayStr,
      openSheetGrande, dipAvvisi, dipVoci solo DENTRO le funzioni.
   ===================================================================== */

const SQG_MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const SQG_GG = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
const SQG_IC = {
  giorni: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  msg: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  scheda: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  invia: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>'
};

let sqgMese = "";          /* "AAAA-MM" che si vede sulle schede */
let sqgDati = {};          /* operatore_id -> {giorni:{data:ore}, ore, lavori:Set} */
let sqgPers = null;        /* la persona aperta: {id,nome,mese} */

function sqgMeseNome(m, corto) {
  const p = String(m).split("-"); const n = SQG_MESI[(+p[1] || 1) - 1];
  return corto ? n : n.charAt(0).toUpperCase() + n.slice(1) + " " + p[0];
}
function sqgSposta(m, di) {
  const p = String(m).split("-"); const d = new Date(+p[0], (+p[1] - 1) + di, 1);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}
function sqgGiorniDelMese(m) { const p = String(m).split("-"); return new Date(+p[0], +p[1], 0).getDate(); }
function sqgNum(n) { return (Math.round(n * 10) / 10).toLocaleString("it-IT"); }
function sqgGiorniTxt(n) { return n + (n === 1 ? " giorno" : " giorni"); }

/* le ore del mese di tutta l'azienda, raggruppate per persona */
async function sqgLeggi(m) {
  const out = {};
  if (!sb || !sbUid) return out;
  const a = m + "-01", b = sqgSposta(m, 1) + "-01";
  const r = await sb.from("gest_ore").select("data,ore,operatore_id,lavoro_id").eq("user_id", sbUid).is("eliminato_il", null).gte("data", a).lt("data", b);
  if (r.error) return null;
  (r.data || []).forEach(function (x) {
    if (!x.operatore_id || !x.data) return;
    const k = String(x.operatore_id);
    const g = out[k] || (out[k] = { giorni: {}, ore: 0, lavori: new Set(), righe: [] });
    g.giorni[x.data] = (g.giorni[x.data] || 0) + (+x.ore || 0);
    g.ore += (+x.ore || 0);
    if (x.lavoro_id) g.lavori.add(String(x.lavoro_id));
    g.righe.push(x);
  });
  return out;
}

/* la striscia: un quadretto per ogni giorno del mese */
function sqgStriscia(m, giorni) {
  const n = sqgGiorniDelMese(m), oggi = todayStr(), p = m.split("-");
  let h = "";
  for (let d = 1; d <= n; d++) {
    const iso = m + "-" + String(d).padStart(2, "0");
    const fest = [0, 6].indexOf(new Date(+p[0], +p[1] - 1, d).getDay()) >= 0;
    h += '<i class="' + (giorni && giorni[iso] ? "si" : (fest ? "fest" : "")) + (iso === oggi ? " oggi" : "") + '"></i>';
  }
  return '<div class="sqg-striscia" aria-hidden="true">' + h + '</div>';
}

function sqgCard(o) {
  const d = sqgDati[String(o.id)] || { giorni: {}, ore: 0, lavori: new Set() };
  const ng = Object.keys(d.giorni).length;
  const av = (typeof dipAvvisi === "function") ? dipAvvisi(o) : [];
  const scaduti = av.filter(function (x) { return x.scaduto; });
  const id = esc(String(o.id)), nome = esc(o.nome || "");
  let avviso = "";
  if (scaduti.length) avviso = '<div class="sqg-avv rosso">' + esc(scaduti.length === 1 ? scaduti[0].lab + " " + scaduti[0].fin : scaduti.map(function (x) { return x.lab; }).join(", ") + ": scaduti") + '</div>';
  else if (av.length) avviso = '<div class="sqg-avv giallo">' + esc(av.map(function (x) { return x.lab + " fra " + x.giorni + " giorni"; }).join(", ")) + '</div>';
  /* le altre azioni (link, QR, rimuovi, elimina) restano nel menu coi tre puntini */
  let altro = "";
  if (typeof dipVoci === "function" && typeof SCHEDA_MENU !== "undefined") {
    const voci = dipVoci(o).filter(function (v) { return v.sep || ["chat-squadra", "sq-edit"].indexOf(v.action) < 0; });
    while (voci.length && voci[0].sep) voci.shift();
    if (voci.length) { const k = "sqg" + o.id; SCHEDA_MENU[k] = voci; altro = '<span class="job-menu"><button class="lav-dots" data-action="scheda-menu" data-k="' + esc(k) + '" title="Altre azioni" aria-label="Altre azioni per ' + nome + '">&#8943;</button></span>'; }
  }
  return '<div class="sqg-card' + (scaduti.length ? " ha-rosso" : "") + '">'
    + '<div class="sqg-top"><div><h3>' + (nome || "—") + '</h3>'
    /* 11 nov 2026 — collaudo 3.8: «Operaio3519095949» attaccati (il punto
       si metteva solo con la mansione scritta a mano); il numero si tocca */
    + '<div class="sqg-sotto">' + [esc(o.mansione || (typeof SQ_RUOLO !== "undefined" && SQ_RUOLO[o.ruolo]) || ""),
        o.telefono ? '<a class="cli-link" href="tel:' + esc(String(o.telefono).replace(/[^\d+]/g, "")) + '">' + esc(o.telefono) + '</a>' : ""
      ].filter(Boolean).join(" · ") + '</div></div>'
    + '<div class="sqg-dx"><span class="stato ' + (o.attivo ? "fatto" : "bozza") + '">' + (o.attivo ? "Attivo" : "Invitato") + '</span>' + altro + '</div></div>'
    + '<div class="sqg-mese"><b>' + ng + '</b><span>' + (ng === 1 ? "giorno" : "giorni") + " a " + sqgMeseNome(sqgMese, true) + (d.lavori.size ? " · " + d.lavori.size + (d.lavori.size === 1 ? " cantiere" : " cantieri") : "") + '</span></div>'
    + sqgStriscia(sqgMese, d.giorni)
    + avviso
    + (o.nuovi ? '<div class="sqg-avv rosso">' + o.nuovi + (o.nuovi === 1 ? " messaggio nuovo" : " messaggi nuovi") + '</div>' : "")
    + '<div class="sqg-btn">'
    + '<button type="button" class="pri" data-sqg="apri" data-id="' + id + '" data-nome="' + nome + '">' + SQG_IC.giorni + 'Giornate</button>'
    + '<button type="button" data-action="chat-squadra" data-id="' + id + '" data-nome="' + nome + '">' + SQG_IC.msg + 'Messaggi</button>'
    + '<button type="button" data-action="sq-edit" data-id="' + id + '">' + SQG_IC.scheda + 'Scheda</button>'
    + (!o.attivo && o.codice ? '<button type="button" class="invito" data-action="sq-wa" data-wa="' + esc(o.wa || "") + '">' + SQG_IC.invia + 'Mandagli l\'app</button>' : "")
    + '</div></div>';
}

/* la chiama renderDip (js/gest-squadra.js) con le persone gia' filtrate */
async function sqgDisegna(L, box, vuoto) {
  if (!box) return;
  box.style.display = "block";
  if (!L.length) { box.innerHTML = vuoto || ""; return; }
  if (!sqgMese) sqgMese = todayStr().slice(0, 7);
  const dati = await sqgLeggi(sqgMese);
  sqgDati = dati || {};
  const tot = L.reduce(function (s, o) { const d = sqgDati[String(o.id)]; return s + (d ? Object.keys(d.giorni).length : 0); }, 0);
  box.innerHTML = '<div class="sqg-testa"><div class="sqg-nav"><button type="button" data-sqg="mese-prima" aria-label="Mese prima">‹</button><b>' + esc(sqgMeseNome(sqgMese)) + '</b><button type="button" data-sqg="mese-dopo" aria-label="Mese dopo">›</button></div>'
    + '<span class="sqg-tot">' + L.length + (L.length === 1 ? " persona" : " persone") + " · " + sqgGiorniTxt(tot) + " in tutto</span></div>"
    + (dati === null ? '<div class="rie-errore"><b>Non riesco a leggere i giorni lavorati: controlla la connessione e riprova.</b></div>' : "")
    + '<div class="sqg-griglia">' + L.map(sqgCard).join("") + '</div>';
}

/* ---------- il mese di una persona ---------- */
function sqgData(iso) { const d = new Date(iso + "T12:00"); return SQG_GG[d.getDay()] + " " + d.getDate() + " " + SQG_MESI[d.getMonth()]; }
async function sqgApri(id, nome, mese) {
  sqgPers = { id: String(id), nome: nome || "", mese: mese || sqgMese || todayStr().slice(0, 7) };
  const n = esc(sqgPers.nome);
  openSheetGrande("Giornate di " + (sqgPers.nome || "questa persona"), '<div id="sqg-corpo"><div class="acq-vuoto">Un attimo…</div></div>',
    '<button class="btn b-cancel" data-action="close">Chiudi</button>'
    + '<button class="btn" data-action="sq-edit" data-id="' + esc(sqgPers.id) + '">' + SQG_IC.scheda + ' Scheda</button>'
    + '<button class="btn-primary" data-action="chat-squadra" data-id="' + esc(sqgPers.id) + '" data-nome="' + n + '">' + SQG_IC.msg + ' Messaggi</button>');
  await sqgPersDisegna();
}
async function sqgPersDisegna() {
  const c0 = document.getElementById("sqg-corpo"); if (!c0 || !sqgPers) return;
  const dati = await sqgLeggi(sqgPers.mese);
  const c = document.getElementById("sqg-corpo"); if (!c) return;
  const nav = '<div class="acq-mese"><button type="button" data-sqg="p-prima" aria-label="Mese prima">‹</button><b>' + esc(sqgMeseNome(sqgPers.mese)) + '</b><button type="button" data-sqg="p-dopo" aria-label="Mese dopo">›</button></div>';
  if (dati === null) { c.innerHTML = nav + '<div class="rie-errore"><b>Non riesco a leggere i giorni: controlla la connessione e riprova.</b></div>'; return; }
  const d = dati[sqgPers.id];
  if (!d) { c.innerHTML = nav + '<div class="acq-vuoto"><b>Nessun giorno segnato in questo mese.</b>I giorni si segnano da «Giornate».<button type="button" class="btn-primary" data-sqg="vai-giornate">Apri Giornate</button></div>'; return; }
  /* i nomi dei cantieri */
  const nomi = {};
  /* quelli che Giornate ha gia' letto non si richiedono */
  if (typeof giorLav !== "undefined") (giorLav || []).forEach(function (l) { nomi[String(l.id)] = l.descrizione || l.dove || "Cantiere"; });
  const ids = [...d.lavori].filter(function (k) { return !nomi[k]; });
  if (ids.length && sb) {
    const rl = await sb.from("gest_lavori").select("id,descrizione,dove").in("id", ids);
    (rl.data || []).forEach(function (l) { nomi[String(l.id)] = l.descrizione || l.dove || "Cantiere"; });
  }
  const date = Object.keys(d.giorni).sort().reverse();   /* gli ultimi giorni in cima */
  const perLav = {};
  d.righe.forEach(function (x) { const k = String(x.lavoro_id || ""); perLav[k] = perLav[k] || new Set(); perLav[k].add(x.data); });
  const c2 = document.getElementById("sqg-corpo"); if (!c2) return;
  c2.innerHTML = nav
    + '<div class="acq-tot"><div><b>' + date.length + '</b><span>' + (date.length === 1 ? "Giorno" : "Giorni") + '</span></div>'
    + '<div><b>' + sqgNum(d.ore) + '</b><span>Ore</span></div>'
    + '<div><b>' + d.lavori.size + '</b><span>' + (d.lavori.size === 1 ? "Cantiere" : "Cantieri") + '</span></div></div>'
    + sqgStriscia(sqgPers.mese, d.giorni)
    + '<div class="sh-cols"><div class="sh-col"><div class="sh-b"><div class="sh-tit">Giorno per giorno</div><div class="gx-lista">'
    + date.map(function (iso) {
      const dove = [...new Set(d.righe.filter(function (x) { return x.data === iso; }).map(function (x) { return nomi[String(x.lavoro_id)] || "Cantiere"; }))].join(", ");
      const ore = d.giorni[iso];
      return '<div class="gx-riga"><span class="t">' + esc(sqgData(iso)) + '<small>' + esc(dove) + '</small></span><b>' + (ore === 8 ? "1 giorno" : sqgNum(ore) + " ore") + '</b></div>';
    }).join("") + '</div></div></div>'
    + '<div class="sh-col"><div class="sh-b"><div class="sh-tit">Dove ha lavorato</div><div class="gx-lista">'
    + Object.keys(perLav).sort(function (a, b) { return perLav[b].size - perLav[a].size; }).map(function (k) {
      return '<div class="gx-riga"><span class="t">' + esc(nomi[k] || "Cantiere") + '</span><b>' + sqgGiorniTxt(perLav[k].size) + '</b></div>';
    }).join("") + '</div></div></div></div>';
}

/* ---------- i clic ---------- */
document.addEventListener("click", function (e) {
  const b = e.target && e.target.closest && e.target.closest("[data-sqg]"); if (!b) return;
  const a = b.dataset.sqg;
  if (a === "apri") return sqgApri(b.dataset.id, b.dataset.nome);
  if (a === "mese-prima" || a === "mese-dopo") { sqgMese = sqgSposta(sqgMese || todayStr().slice(0, 7), a === "mese-prima" ? -1 : 1); if (typeof renderDip === "function") renderDip(); return; }
  if (a === "p-prima" || a === "p-dopo") { if (!sqgPers) return; sqgPers.mese = sqgSposta(sqgPers.mese, a === "p-prima" ? -1 : 1); return sqgPersDisegna(); }
  if (a === "vai-giornate") {
    if (typeof closeSheet === "function") closeSheet();
    const v = document.querySelector('nav.tabs button[data-tab="giornate"]'); if (v) v.click();
  }
});
