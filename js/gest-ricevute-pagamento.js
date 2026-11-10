/* ═══ 10 novembre 2026 — LA RICEVUTA DI PAGAMENTO ═══════════════════════════
   Chiesta da Spazio Giardino (Roma, artigiano) dalla chat del gestionale:
   «ricevute di pagamento se il cliente non vuole fattura».

   ⛔ E' UN DOCUMENTO NON FISCALE, e lo dice sul foglio e nel modulo.
      Chi ha la partita IVA deve comunque certificare l'incasso con la
      fattura elettronica o con lo scontrino elettronico (documento
      commerciale). Questa ricevuta serve a dire al cliente «ho ricevuto
      500 €» — un acconto, un saldo — e a tenerne traccia. Non mette a posto
      le tasse: il gestionale non deve far credere il contrario.

   Il pulsante «🧾 Ricevute di pagamento» sta nella sezione Fatture, accanto a
   «📥 Fatture ricevute» (che sono un'altra cosa: le fatture dei fornitori).
   Tabella: gest_ricevute_pagamento (sql/2026-11-10-sconto-preventivi-e-ricevute.sql).
   Numerate da 1 ogni anno. In cima all'elenco le ULTIME fatte.

   Chiuso dentro la sua funzione: i nomi qui dentro non si scontrano con la
   pagina. Usa della pagina: sb, sbUid, esc, eur2, eurPdf, toast, fdate,
   todayStr, openSheetGrande, closeSheet, caricaJsPDF, curMestiere, _numIt,
   _cent2, azIndirizzo, gconfirm.
   ═════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const TAB = "gest_ricevute_pagamento";
  const METODI = ["Contanti", "Bonifico", "Assegno", "Carta / POS", "Altro"];
  const NON_FISCALE = "Documento non fiscale: non sostituisce la fattura elettronica né lo scontrino elettronico.";
  let _lista = [];
  let _clienti = [];

  function pronto() { return typeof sb !== "undefined" && sb && typeof sbUid !== "undefined" && sbUid; }
  function tabellaManca(e) {
    const m = String((e && (e.message || e.code)) || "");
    return /gest_ricevute_pagamento|42P01|PGRST205|schema cache|does not exist/i.test(m);
  }
  const AVVISO_SQL = '<div class="sh-b"><div class="sh-nota">Le ricevute di pagamento non sono ancora attive: '
    + 'manca un aggiornamento del database (sql/2026-11-10-sconto-preventivi-e-ricevute.sql).</div></div>';

  /* ── l'importo in lettere, come si scrive su una ricevuta ────────────────
     500,00 → «cinquecento/00». Fino a 999.999.999. */
  function lettere(n) {
    const U = ["", "uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove", "dieci",
      "undici", "dodici", "tredici", "quattordici", "quindici", "sedici", "diciassette", "diciotto", "diciannove"];
    const D = ["", "", "venti", "trenta", "quaranta", "cinquanta", "sessanta", "settanta", "ottanta", "novanta"];
    function sotto100(x) {
      if (x < 20) return U[x];
      const d = Math.floor(x / 10), u = x % 10;
      let t = D[d];
      if (u === 1 || u === 8) t = t.slice(0, -1);     /* ventuno, ventotto */
      return t + (u === 3 ? "tré" : U[u]);
    }
    function sotto1000(x) {
      const c = Math.floor(x / 100), r = x % 100;
      let t = c === 0 ? "" : (c === 1 ? "cento" : U[c] + "cento");
      if (c && r >= 80 && r < 90) t = t.slice(0, -1);   /* centottanta */
      return t + sotto100(r);
    }
    if (n === 0) return "zero";
    let out = "";
    const mil = Math.floor(n / 1e6), mig = Math.floor((n % 1e6) / 1000), res = n % 1000;
    if (mil) out += mil === 1 ? "unmilione" : sotto1000(mil) + "milioni";
    if (mig) out += mig === 1 ? "mille" : sotto1000(mig) + "mila";
    out += sotto1000(res);
    /* «tre» in fondo a un numero lungo prende l'accento: centotré, milletré */
    if (out.length > 3 && /tre$/.test(out)) out = out.slice(0, -3) + "tré";
    return out;
  }
  function importoLettere(v) {
    const c = Math.round(_cent2(+v || 0) * 100);
    const intero = Math.floor(c / 100), cent = c % 100;
    return lettere(intero) + "/" + String(cent).padStart(2, "0");
  }

  /* ── leggere ──────────────────────────────────────────────────────────── */
  async function leggi() {
    const { data, error } = await sb.from(TAB).select("*").eq("user_id", sbUid).is("eliminato_il", null)
      .order("anno", { ascending: false }).order("numero", { ascending: false }).limit(200);
    if (error) throw error;
    _lista = data || [];
    return _lista;
  }
  async function leggiClienti() {
    try {
      const { data } = await sb.from("gest_clienti").select("id,nome,indirizzo,cap,citta,prov,cod_fiscale,piva")
        .eq("user_id", sbUid).is("eliminato_il", null).order("nome");
      _clienti = data || [];
    } catch (_) { _clienti = []; }
  }

  /* ── l'elenco ─────────────────────────────────────────────────────────── */
  function htmlLista() {
    if (!_lista.length) {
      return '<div class="sh-b"><div class="sh-tit">Ricevute di pagamento</div>'
        + '<p class="sh-nota" style="margin-top:0">Non hai ancora fatto ricevute. Premi «+ Nuova ricevuta».</p></div>';
    }
    return '<div class="sh-b"><div class="sh-tit">Ricevute di pagamento</div><div class="righe">'
      + _lista.map(function (r) {
        return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--linea,#e5e7eb);flex-wrap:wrap">'
          + '<div style="min-width:0;flex:1"><div style="font-weight:800;font-size:17px">N. ' + esc(r.numero + "/" + r.anno) + ' — ' + esc(r.cli_nome || "—") + '</div>'
          + '<div style="color:var(--testo-2,#64748b);font-size:15px">' + esc(fdate(r.data)) + (r.causale ? " · " + esc(r.causale) : "") + (r.metodo ? " · " + esc(r.metodo) : "") + '</div></div>'
          + '<div style="font-weight:800;font-size:18px;white-space:nowrap">' + eur2(r.importo) + '</div>'
          + '<div style="display:flex;gap:8px">'
          + '<button type="button" class="btn" data-rp-pdf="' + esc(r.id) + '">PDF</button>'
          + '<button type="button" class="btn b-cancel" data-rp-del="' + esc(r.id) + '" title="Elimina">🗑</button>'
          + '</div></div>';
      }).join("") + '</div></div>';
  }
  const AZ_LISTA = '<button class="btn b-cancel" data-action="close">Chiudi</button>'
    + '<button class="btn-primary b-save" type="button" data-rp-nuova="1">+ Nuova ricevuta</button>';

  async function apri() {
    if (!pronto()) { toast("Accedi per fare le ricevute."); return; }
    openSheetGrande("🧾 Ricevute di pagamento", '<div class="sh-b"><div class="sh-nota">Un attimo…</div></div>', AZ_LISTA);
    try {
      await leggi();
      ridisegna(htmlLista(), AZ_LISTA);
    } catch (e) {
      ridisegna(tabellaManca(e) ? AVVISO_SQL : '<div class="sh-b"><div class="sh-nota">Non riesco a leggere le ricevute: ' + esc(e.message || "riprova") + '</div></div>',
        '<button class="btn b-cancel" data-action="close">Chiudi</button>');
    }
  }
  function ridisegna(corpo, azioni) {
    openSheetGrande("🧾 Ricevute di pagamento", corpo, azioni);
  }

  /* ── il modulo ───────────────────────────────────────────────────────── */
  async function nuova() {
    if (!pronto()) return;
    await leggiClienti();
    const opz = '<option value="">— scegli il cliente —</option>'
      + _clienti.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.nome || "") + '</option>'; }).join("")
      + '<option value="__altro">Un altro (scrivo il nome)</option>';
    const met = METODI.map(function (m) { return '<option>' + esc(m) + '</option>'; }).join("");
    openSheetGrande("🧾 Nuova ricevuta di pagamento",
      '<div class="sh-b"><div class="sh-tit">Chi ha pagato e quanto</div>'
      + '<div class="field"><label for="rp-cli">Cliente</label><select id="rp-cli">' + opz + '</select>'
      + '<input id="rp-nome" placeholder="Nome e cognome di chi paga" style="display:none;margin-top:8px" autocomplete="off"></div>'
      + '<div class="row2">'
      + '<div class="field"><label for="rp-imp">Importo ricevuto (€)</label><input id="rp-imp" type="text" inputmode="decimal" placeholder="Es. 500,00" data-euro></div>'
      + '<div class="field"><label for="rp-data">Data</label><input id="rp-data" type="date" value="' + todayStr() + '"></div></div>'
      + '<div class="field"><label for="rp-caus">Per</label><input id="rp-caus" placeholder="Es. Acconto lavori giardino"></div>'
      + '<div class="field"><label for="rp-met">Pagato con</label><select id="rp-met">' + met + '</select></div>'
      + '<div id="rp-avv-cont" class="sh-nota" style="display:none;background:#fff7ed;border:1.5px solid #fdba74;color:#9a3412;border-radius:10px;padding:10px 12px"></div>'
      + '<div class="field"><label for="rp-note">Note (escono sul foglio)</label><input id="rp-note" placeholder="Facoltativo"></div>'
      + '<div style="background:#fff7ed;border:1.5px solid #fdba74;border-radius:10px;padding:10px 12px;font-size:15px;color:#9a3412">'
      + '⚠️ È un documento <b>non fiscale</b>: non sostituisce la fattura o lo scontrino.</div>'
      + '</div>',
      '<button class="btn b-cancel" type="button" data-rp-torna="1">Annulla</button>'
      + '<button class="btn-primary b-save" type="button" data-rp-salva="1">Salva e scarica PDF</button>');
    const sel = document.getElementById("rp-cli"), nome = document.getElementById("rp-nome");
    sel.addEventListener("change", function () {
      nome.style.display = sel.value === "__altro" ? "" : "none";
      if (sel.value === "__altro") nome.focus();
    });
    /* in contanti la legge mette un tetto: sotto i 5.000 € */
    const cont = function () {
      const box = document.getElementById("rp-avv-cont"); if (!box) return;
      const v = _numIt("#rp-imp") || 0, m = document.getElementById("rp-met").value;
      if (m === "Contanti" && v >= 5000) {
        box.textContent = "⚠️ In contanti si può pagare solo sotto i 5.000 €. Sopra serve un pagamento tracciabile (bonifico, assegno, carta).";
        box.style.display = "";
      } else box.style.display = "none";
    };
    document.getElementById("rp-imp").addEventListener("input", cont);
    document.getElementById("rp-met").addEventListener("change", cont);
  }

  async function salva(btn) {
    const sel = document.getElementById("rp-cli");
    const altro = sel && sel.value === "__altro";
    const cli = (!altro && sel && sel.value) ? _clienti.find(function (c) { return String(c.id) === sel.value; }) : null;
    const nome = altro ? (document.getElementById("rp-nome").value || "").trim() : (cli ? cli.nome : "");
    if (!nome) { toast("Scegli il cliente o scrivi il nome di chi paga"); return; }
    const importo = _cent2(_numIt("#rp-imp") || 0);
    if (!(importo > 0)) { toast("Scrivi l'importo ricevuto"); return; }
    const data = document.getElementById("rp-data").value || todayStr();
    const anno = +String(data).slice(0, 4);
    if (btn) btn.disabled = true;
    try {
      /* il numero: il piu' alto dell'anno + 1, contando anche quelle eliminate
         (se no, eliminata l'ultima, la prossima riprende lo stesso numero) */
      const { data: mx, error: eN } = await sb.from(TAB).select("numero").eq("user_id", sbUid).eq("anno", anno)
        .order("numero", { ascending: false }).limit(1);
      if (eN) throw eN;
      const numero = ((mx && mx[0] && +mx[0].numero) || 0) + 1;
      const riga = {
        user_id: sbUid,
        mestiere_id: (typeof curMestiere === "function" ? curMestiere() : null) || null,
        cliente_id: cli ? cli.id : null,
        cli_nome: nome,
        anno: anno, numero: numero, data: data, importo: importo,
        causale: (document.getElementById("rp-caus").value || "").trim() || null,
        metodo: document.getElementById("rp-met").value || null,
        note: (document.getElementById("rp-note").value || "").trim() || null
      };
      const { data: nuovaR, error } = await sb.from(TAB).insert(riga).select().single();
      if (error) throw error;
      toast("Ricevuta N. " + numero + "/" + anno + " salvata ✔");
      await pdf(nuovaR);
      await apri();
    } catch (e) {
      if (btn) btn.disabled = false;
      toast(tabellaManca(e) ? "Le ricevute non sono ancora attive: manca l'aggiornamento del database" : "Non salvata: " + (e.message || "riprova"));
    }
  }

  async function elimina(id) {
    const r = _lista.find(function (x) { return String(x.id) === String(id); });
    if (!r) return;
    if (!gconfirm("Elimino la ricevuta N. " + r.numero + "/" + r.anno + " di " + (r.cli_nome || "") + "?")) return;
    const { error } = await sb.from(TAB).update({ eliminato_il: new Date().toISOString() }).eq("id", id).eq("user_id", sbUid);
    if (error) { toast("Non eliminata: " + error.message); return; }
    toast("Ricevuta eliminata");
    await apri();
  }

  /* ── il foglio ───────────────────────────────────────────────────────── */
  async function pdf(r) {
    if (!r) return;
    if (!(await caricaJsPDF())) { toast("Non riesco a scaricare il modulo PDF: controlla la connessione e riprova"); return; }
    const { data: azL } = await sb.from("gest_azienda").select("*").eq("user_id", sbUid).maybeSingle();
    const az = azL || {};
    let c = null;
    if (r.cliente_id) {
      try {
        const { data } = await sb.from("gest_clienti").select("nome,indirizzo,cap,citta,prov,cod_fiscale,piva").eq("id", r.cliente_id).eq("user_id", sbUid).maybeSingle();
        c = data || null;
      } catch (_) {}
    }
    const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: "mm", format: "a4" }), M = 18, R = 210 - M;
    let y = 20;
    y = window.gestLogoPdf ? await window.gestLogoPdf(doc, M, y) : y;
    doc.setFont("helvetica", "bold"); doc.setFontSize(16);
    doc.text(az.nome || "(il nome della tua attivita' va nei Dati azienda)", M, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(90);
    let hy = y + 6;
    const indAz = (typeof azIndirizzo === "function") ? azIndirizzo(az) : "";
    [az.piva ? "P.IVA " + az.piva : "", indAz, [az.tel ? "Tel " + az.tel : "", az.email || ""].filter(Boolean).join("   ")]
      .filter(Boolean).forEach(function (t) { doc.text(t, M, hy); hy += 4.5; });
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold"); doc.setFontSize(18);
    doc.text("RICEVUTA DI PAGAMENTO", R, y, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(90);
    doc.text("N. " + r.numero + "/" + r.anno + "   del " + fdate(r.data), R, y + 5.5, { align: "right" });
    doc.setTextColor(0);
    y = Math.max(hy, y + 15) + 4; doc.setDrawColor(210); doc.line(M, y, R, y); y += 14;

    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    doc.text("Si dichiara di aver ricevuto da:", M, y); y += 8;
    doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.text(r.cli_nome || "—", M, y); y += 6;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(90);
    if (c) {
      const luogo = [c.cap, c.citta].filter(Boolean).join(" ") + (c.prov ? " (" + c.prov + ")" : "");
      const ind = [c.indirizzo, luogo].map(function (x) { return String(x || "").trim(); }).filter(Boolean).join(", ");
      if (ind) { doc.text(ind, M, y); y += 4.8; }
      if (c.piva) { doc.text("P.IVA " + c.piva, M, y); y += 4.8; }
      else if (c.cod_fiscale) { doc.text("C.F. " + c.cod_fiscale, M, y); y += 4.8; }
    }
    doc.setTextColor(0); y += 8;

    /* il riquadro con la cifra */
    doc.setDrawColor(31, 111, 92); doc.setLineWidth(.5); doc.rect(M, y, R - M, 24); doc.setLineWidth(.2);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10.5);
    doc.text("la somma di", M + 4, y + 9);
    doc.setFont("helvetica", "bold"); doc.setFontSize(18);
    doc.text(eurPdf(r.importo), R - 4, y + 10, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(70);
    doc.text("(euro " + importoLettere(r.importo) + ")", R - 4, y + 18, { align: "right" });
    doc.setTextColor(0); y += 34;

    doc.setFontSize(11);
    if (r.causale) {
      doc.setFont("helvetica", "bold"); doc.text("Per:", M, y);
      doc.setFont("helvetica", "normal");
      const cl = doc.splitTextToSize(r.causale, R - M - 22); doc.text(cl, M + 22, y); y += cl.length * 5.5 + 3;
    }
    if (r.metodo) {
      doc.setFont("helvetica", "bold"); doc.text("Pagato con:", M, y);
      doc.setFont("helvetica", "normal"); doc.text(r.metodo, M + 30, y); y += 8.5;
    }
    if (r.note) {
      doc.setFontSize(9.5); doc.setTextColor(90);
      const nl = doc.splitTextToSize(r.note, R - M); doc.text(nl, M, y); y += nl.length * 4.8 + 4;
      doc.setTextColor(0);
    }

    /* la firma di chi incassa */
    y = Math.max(y + 18, 200);
    doc.setFontSize(10);
    doc.text((az.citta ? az.citta + ", " : "") + fdate(r.data), M, y);
    doc.text("Firma di chi riceve il pagamento", R, y, { align: "right" });
    doc.setDrawColor(120); doc.line(R - 75, y + 16, R, y + 16);

    /* in fondo, in chiaro */
    doc.setFillColor(255, 247, 237); doc.setDrawColor(253, 186, 116);
    doc.rect(M, 268, R - M, 12, "FD");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(154, 52, 18);
    doc.text(NON_FISCALE, 105, 275.5, { align: "center", maxWidth: R - M - 6 });
    doc.setTextColor(0);

    const nomeFile = "Ricevuta_" + r.numero + "-" + r.anno + "_" + String(r.cli_nome || "cliente").replace(/[^\w]+/g, "_").slice(0, 40) + ".pdf";
    doc.save(nomeFile);
  }

  /* ── i clic ──────────────────────────────────────────────────────────── */
  document.addEventListener("click", function (e) {
    const t = e.target.closest && e.target.closest("[data-rp-apri],[data-rp-nuova],[data-rp-salva],[data-rp-torna],[data-rp-pdf],[data-rp-del]");
    if (!t) return;
    e.preventDefault();
    if (t.hasAttribute("data-rp-apri")) apri();
    else if (t.hasAttribute("data-rp-nuova")) nuova();
    else if (t.hasAttribute("data-rp-salva")) salva(t);
    else if (t.hasAttribute("data-rp-torna")) apri();
    else if (t.hasAttribute("data-rp-pdf")) pdf(_lista.find(function (x) { return String(x.id) === t.getAttribute("data-rp-pdf"); }));
    else if (t.hasAttribute("data-rp-del")) elimina(t.getAttribute("data-rp-del"));
  });

  window.gestRicevutePagamento = { apri: apri, nuova: nuova, _lettere: importoLettere };
})();
