/* ═══ 16 ottobre 2026 — LE FATTURE RICEVUTE DAI FORNITORI ════════════════════
   Il pulsante «📥 Fatture ricevute» nella sezione Fatture.
   Come funziona (la parte server sta in netlify/functions/lib/sdi-ricezione.js):
     1. l'impresa registra il codice destinatario di Openapi (JKKZDGR) all'Agenzia
        delle Entrate, poi preme «Attiva la ricezione»;
     2. quando un fornitore le manda una fattura, Openapi avvisa il nostro sito
        (sdi-ricevuta.js) e la fattura si salva da sola;
     3. qui si vede la lista, si scarica il PDF o il file XML.
   Costa 1 invio per fattura (come per quelle che si mandano): compreso nel
   gestionale a pagamento; nel gratuito la fattura che arriva senza invii
   resta «da sbloccare» e il file non si scarica finche' non si sblocca.
   Si LEGGE dal database direttamente (niente funzione Netlify = niente crediti
   Netlify); la funzione sdi serve solo per attivare, sbloccare e scaricare.
   Gira dentro una funzione sua: vede sb, sbUid, esc, fdate, toast,
   openSheetGrande, closeSheet, sdiChiama (gest-sdi.js).
   ═════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const CODICE = "JKKZDGR";
  let _stato = null;   /* {attiva, ambiente, incluso, residuo} dalla funzione */
  let _lista = [];

  function eur(n) {
    if (n == null || n === "") return "—";
    try { return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(+n); }
    catch (_) { return String(n) + " €"; }
  }
  function pronto() { return typeof sb !== "undefined" && sb && typeof sbUid !== "undefined" && sbUid; }

  /* ── il numerino rosso sul pulsante ─────────────────────────────────────── */
  async function aggiornaBadge() {
    const b = document.getElementById("ric-badge");
    if (!b || !pronto()) return;
    try {
      const { count } = await sb.from("gest_fatture_ricevute").select("id", { count: "exact", head: true })
        .eq("user_id", sbUid).eq("vista", false);
      if (count > 0) { b.textContent = count > 99 ? "99+" : String(count); b.hidden = false; }
      else b.hidden = true;
    } catch (_) {}
  }

  async function leggiLista() {
    const { data, error } = await sb.from("gest_fatture_ricevute")
      .select("id,fornitore_nome,fornitore_piva,numero,data,importo,tipo_documento,sbloccata,vista,ambiente,ricevuta_il")
      .eq("user_id", sbUid).order("ricevuta_il", { ascending: false }).limit(300);
    if (error) throw error;
    return data || [];
  }

  /* ── le due schermate ───────────────────────────────────────────────────── */
  function htmlProva() {
    return _stato && _stato.ambiente === "test"
      ? '<div class="sh-b"><div class="sdi-prova"><b>Siamo in PROVA.</b> Le fatture che arrivano qui sono finte, e non si scala nessun invio.</div></div>'
      : "";
  }

  function htmlAttiva() {
    return htmlProva()
      + '<div class="sh-b"><div class="ric-sommario">Ricevi qui le fatture dei tuoi fornitori</div>'
      + '<ul class="ric-passi">'
      + '<li><i>1</i><div>Registra questo <b>codice destinatario</b> sul sito dell\'Agenzia delle Entrate (o fallo fare al tuo commercialista):'
      + '<div class="ric-codice"><b>' + CODICE + '</b><button class="btn" type="button" data-ric-copia="1">📋 Copia</button></div></div></li>'
      + '<li><i>2</i><div>Torna qui e premi <b>Attiva la ricezione</b>.</div></li>'
      + '<li><i>3</i><div>Da quel momento le fatture dei fornitori compaiono qui, col PDF pronto da scaricare.</div></li>'
      + '</ul></div>'
      + '<div class="sh-b"><div class="ric-attenzione"><b>Attenzione:</b> con questo codice le fatture dei fornitori arrivano a TrovaImpresa e <b>non più al tuo commercialista</b>. Parlane prima con lui.</div></div>'
      + '<div class="sh-b"><div class="sh-nota">Ogni fattura ricevuta usa <b>1</b> dei tuoi invii, come quelle che mandi.'
      + (_stato && _stato.incluso ? ' Con il tuo gestionale a pagamento sono <b>già compresi</b>.' : '') + '</div></div>';
  }

  function cardRicevuta(r) {
    const nuova = !r.vista;
    const bloccata = !r.sbloccata;
    const tono = bloccata ? "t-err" : (nuova ? "t-attesa" : "t-ok");
    const stato = bloccata ? "Da sbloccare" : (nuova ? "Nuova" : "Vista");
    const nome = r.fornitore_nome || ("P.IVA " + (r.fornitore_piva || "—"));
    const meta = [
      "🧾 " + esc(r.numero ? "n. " + r.numero : "senza numero"),
      "📅 " + esc(r.data ? fdate(r.data) : "—"),
      r.fornitore_piva ? "🏢 P.IVA " + esc(r.fornitore_piva) : "",
      r.tipo_documento === "TD04" ? "📄 Nota di credito" : "",
      r.ambiente === "test" ? "PROVA" : ""
    ].filter(Boolean);
    const id = esc(r.id);
    const az = bloccata
      ? '<button class="btn btn-primary" type="button" data-ric-sblocca="' + id + '">🔓 Sblocca (usa 1 invio)</button>'
      : '<button class="btn" type="button" data-ric-file="' + id + '" data-fmt="pdf">⬇ Scarica il PDF</button>'
        + '<button class="btn" type="button" data-ric-file="' + id + '" data-fmt="xml">⬇ File XML</button>'
        + (nuova ? '<button class="btn" type="button" data-ric-vista="' + id + '">✔ Segna come vista</button>' : "");
    return '<div class="job ' + tono + '"><div class="job-top"><div class="job-cli">' + esc(nome) + " — " + stato + '</div>'
      + '<span class="job-imp">' + eur(r.importo) + '</span></div>'
      + '<div class="job-meta">' + meta.map(x => "<span>" + x + "</span>").join("") + '</div>'
      + '<div class="job-actions">' + az + '</div></div>';
  }

  function htmlLista() {
    const nuove = _lista.filter(r => !r.vista).length;
    const da = _lista.filter(r => !r.sbloccata).length;
    let corpo = htmlProva() + '<div class="sh-b">';
    if (!_lista.length) {
      corpo += '<div class="ric-sommario">Ancora nessuna fattura ricevuta</div>'
        + '<div class="sh-nota">La ricezione è accesa. Quando un fornitore ti manda una fattura, la trovi qui da sola: non devi fare niente.<br><br>'
        + 'Se non arriva niente, controlla che il codice destinatario <b>' + CODICE + '</b> sia registrato all\'Agenzia delle Entrate.</div>';
    } else {
      corpo += '<div class="ric-sommario">' + (nuove ? (nuove === 1 ? "1 nuova da vedere" : nuove + " nuove da vedere") : "Tutte viste") + '</div>'
        + (da ? '<div class="sh-nota">' + (da === 1 ? "1 fattura è" : da + " fatture sono") + ' <b>da sbloccare</b>: non hai invii a disposizione. Con il gestionale a pagamento sono compresi.</div>' : '')
        + '<div class="ric-lista">' + _lista.map(cardRicevuta).join("") + '</div>';
    }
    return corpo + '</div>';
  }

  function azioniLista() {
    return '<button class="btn b-cancel" data-action="close">Chiudi</button>'
      + (_stato && _stato.ambiente === "test" ? '<button class="btn b-cancel" type="button" data-ric-prova="1">Fattura di prova</button>' : '')
      + '<button class="btn btn-primary" type="button" data-ric-agg="1">Aggiorna la lista</button>';
  }

  /* ── aprire la finestra ─────────────────────────────────────────────────── */
  async function apri() {
    if (!pronto()) { toast("Accedi per vedere le fatture ricevute."); return; }
    openSheetGrande("Fatture ricevute", '<div class="sh-b"><div class="sh-nota">Un attimo…</div></div>',
      '<button class="btn b-cancel" data-action="close">Chiudi</button>');
    try {
      const [st, lista] = await Promise.all([sdiChiama({ azione: "ric_stato" }), leggiLista()]);
      if (st.error) { disegna('<div class="sh-b"><div class="sh-nota">' + esc(st.error) + '</div></div>', '<button class="btn b-cancel" data-action="close">Chiudi</button>'); return; }
      _stato = st; _lista = lista;
      mostra();
    } catch (e) {
      disegna('<div class="sh-b"><div class="sh-nota">Non riesco a caricare le fatture ricevute. Riprova fra poco.</div></div>', '<button class="btn b-cancel" data-action="close">Chiudi</button>');
    }
  }
  function disegna(corpo, azioni) {
    const s = document.getElementById("sheet");
    if (!s || !s.classList.contains("sheet--grande")) return;
    const body = s.querySelector(".sh-body"), foot = s.querySelector(".sh-foot");
    if (body) body.innerHTML = corpo;
    if (foot) foot.innerHTML = azioni;
  }
  function mostra() {
    if (_stato && _stato.attiva) disegna(htmlLista(), azioniLista());
    else disegna(htmlAttiva(), '<button class="btn b-cancel" data-action="close">Chiudi</button>'
      + '<button class="btn btn-primary" type="button" data-ric-attiva="1">Attiva la ricezione</button>');
    aggiornaBadge();
  }
  async function ricarica() {
    try { _lista = await leggiLista(); } catch (_) { toast("Non riesco ad aggiornare la lista."); return; }
    mostra();
  }

  /* ── le azioni ──────────────────────────────────────────────────────────── */
  function scaricaFile(nome, tipo, base64) {
    const bin = atob(base64), arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([arr], { type: tipo }));
    const a = document.createElement("a");
    a.href = url; a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 2000);
  }
  function inLista(id) { return _lista.find(x => String(x.id) === String(id)); }

  async function attiva(btn) {
    btn.disabled = true; const t = btn.textContent; btn.textContent = "Attivo…";
    const r = await sdiChiama({ azione: "ric_attiva" });
    if (r.error) { btn.disabled = false; btn.textContent = t; toast(r.error); return; }
    _stato = r; _lista = await leggiLista().catch(() => []);
    toast("Ricezione accesa ✅");
    mostra();
  }
  async function sblocca(id, btn) {
    btn.disabled = true; const t = btn.textContent; btn.textContent = "Sblocco…";
    const r = await sdiChiama({ azione: "ric_sblocca", ricevuta_id: id });
    if (r.error) {
      btn.disabled = false; btn.textContent = t;
      if (r.codice === "serve_pacchetto" && typeof sdiVendi === "function") { closeSheet(); sdiVendi(false, null); return; }
      toast(r.error); return;
    }
    const x = inLista(id); if (x) x.sbloccata = true;
    mostra();
  }
  async function file(id, fmt, btn) {
    btn.disabled = true; const t = btn.textContent; btn.textContent = "Preparo…";
    const r = await sdiChiama({ azione: "ric_file", ricevuta_id: id, formato: fmt });
    btn.disabled = false; btn.textContent = t;
    if (r.error) { toast(r.error); return; }
    scaricaFile(r.nome, r.tipo, r.base64);
    const x = inLista(id);
    if (x && !x.vista) { x.vista = true; sdiChiama({ azione: "ric_vista", ricevuta_id: id }); mostra(); }
  }
  async function vista(id, btn) {
    btn.disabled = true;
    const r = await sdiChiama({ azione: "ric_vista", ricevuta_id: id });
    if (r.error) { btn.disabled = false; toast(r.error); return; }
    const x = inLista(id); if (x) x.vista = true;
    mostra();
  }
  async function prova(btn) {
    btn.disabled = true; const t = btn.textContent; btn.textContent = "Chiedo a Openapi…";
    const r = await sdiChiama({ azione: "ric_prova" });
    btn.disabled = false; btn.textContent = t;
    if (r.error) { toast(r.error); return; }
    toast("Fattura di prova partita: arriva fra qualche secondo");
    setTimeout(ricarica, 6000);
  }
  function copia(btn) {
    const ok = function () { btn.textContent = "✔ Copiato"; setTimeout(function () { btn.textContent = "📋 Copia"; }, 2000); };
    try { navigator.clipboard.writeText(CODICE).then(ok, function () { toast("Copialo a mano: " + CODICE); }); }
    catch (_) { toast("Copialo a mano: " + CODICE); }
  }

  document.addEventListener("click", function (e) {
    const t = e.target.closest && e.target.closest("[data-ric-apri],[data-ric-attiva],[data-ric-copia],[data-ric-file],[data-ric-sblocca],[data-ric-vista],[data-ric-prova],[data-ric-agg],[data-tab='fatture']");
    if (!t) return;
    if (t.matches("[data-tab='fatture']")) { setTimeout(aggiornaBadge, 1200); return; }
    if (t.hasAttribute("data-ric-apri")) apri();
    else if (t.hasAttribute("data-ric-attiva")) attiva(t);
    else if (t.hasAttribute("data-ric-copia")) copia(t);
    else if (t.hasAttribute("data-ric-file")) file(t.getAttribute("data-ric-file"), t.getAttribute("data-fmt") === "xml" ? "xml" : "pdf", t);
    else if (t.hasAttribute("data-ric-sblocca")) sblocca(t.getAttribute("data-ric-sblocca"), t);
    else if (t.hasAttribute("data-ric-vista")) vista(t.getAttribute("data-ric-vista"), t);
    else if (t.hasAttribute("data-ric-prova")) prova(t);
    else if (t.hasAttribute("data-ric-agg")) ricarica();
  });

  /* il numerino: appena la pagina e' pronta, e di nuovo quando si apre Fatture */
  setTimeout(aggiornaBadge, 3500);
  window.gestRicevute = { apri: apri, badge: aggiornaBadge };
})();
