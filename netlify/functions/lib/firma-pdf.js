// =====================================================================
// IL PDF DA FIRMARE CON CODICE SMS — 8 novembre 2026
//
// Si costruisce dalla FOTOGRAFIA di gest_preventivi_link.dati: la stessa
// che il cliente vede sul link «Invia al cliente». Qui NON si fa nessun
// conto: righe, totali e capitolati arrivano gia' scritti dal gestionale
// (con le funzioni del PDF del preventivo). Si mettono solo in pagina.
//
// L'ultima pagina e' quella della firma: in alto il testo di accettazione,
// sotto un grande spazio vuoto dove Openapi mette la firma del cliente.
// Lo spazio e' grande apposta: la posizione (FIRMA_POS) e' a meta' pagina,
// cosi' cade nel vuoto sia se Openapi conta dall'alto sia dal basso.
//
// ⛔ Il carattere Helvetica del PDF conosce solo le lettere «europee»
//    (WinAnsi): € , à, è, «», — ci sono; emoji e frecce no. Ogni lettera
//    sconosciuta diventa «?» invece di far fallire tutto il PDF.
// =====================================================================
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const A4 = [595.28, 841.89];
const M = 50;                       // margine
const LARGO = A4[0] - 2 * M;
const FIRMA_POS = { x: 70, y: 420 }; // a meta' dell'ultima pagina

const BLU = rgb(0.04, 0.16, 0.30);
const GRIGIO = rgb(0.35, 0.38, 0.45);
const NERO = rgb(0.06, 0.09, 0.16);

function T(v) { return String(v == null ? '' : v).trim(); }

async function costruisci(dati, firmatario) {
  dati = dati || {};
  const doc = await PDFDocument.create();
  doc.setTitle(T(dati.titolo) || 'Documento da firmare');
  doc.setProducer('TrovaImpresa');
  doc.setCreator('TrovaImpresa');
  const f = await doc.embedFont(StandardFonts.Helvetica);
  const fb = await doc.embedFont(StandardFonts.HelveticaBold);

  // le lettere che il carattere non conosce diventano «?»
  const okLettera = new Map();
  function pulisci(s, font) {
    s = String(s == null ? '' : s)
      .replace(/[    ]/g, ' ')
      .replace(/[​‌‍️]/g, '')
      .replace(/[\u2192\u27a1]/g, '->').replace(/\u2190/g, '<-')
      .replace(/\r/g, '');
    let out = '';
    for (const ch of s) {
      if (ch === '\n' || ch === '\t') { out += ch === '\t' ? ' ' : ch; continue; }
      const k = (font === fb ? 'b' : 'n') + ch;
      if (!okLettera.has(k)) {
        let ok = true;
        try { font.encodeText(ch); } catch (e) { ok = false; }
        okLettera.set(k, ok);
      }
      // le faccine si tolgono e basta; le altre lettere sconosciute diventano «?»
      out += okLettera.get(k) ? ch : (/\p{Extended_Pictographic}/u.test(ch) ? '' : '?');
    }
    return out;
  }
  // va a capo per stare nella larghezza
  function aCapo(testo, font, size, largo) {
    const righe = [];
    pulisci(testo, font).split('\n').forEach(par => {
      const parole = par.split(/ +/);
      let r = '';
      parole.forEach(p => {
        const prova = r ? r + ' ' + p : p;
        if (font.widthOfTextAtSize(prova, size) <= largo) { r = prova; return; }
        if (r) righe.push(r);
        // parola piu' lunga della riga: si spezza
        let w = p;
        while (font.widthOfTextAtSize(w, size) > largo && w.length > 1) {
          let n = w.length;
          while (n > 1 && font.widthOfTextAtSize(w.slice(0, n), size) > largo) n--;
          righe.push(w.slice(0, n)); w = w.slice(n);
        }
        r = w;
      });
      righe.push(r);
    });
    return righe;
  }

  let pag = null, y = 0;
  function nuovaPagina() { pag = doc.addPage(A4); y = A4[1] - M; }
  function spazio(h) { if (y - h < M + 20) nuovaPagina(); }
  function testo(t, { size = 10.5, bold = false, colore = NERO, x = M, largo = LARGO, dopo = 3 } = {}) {
    const font = bold ? fb : f;
    const righe = aCapo(t, font, size, largo);
    righe.forEach(r => {
      spazio(size + 3);
      pag.drawText(r, { x, y: y - size, size, font, color: colore });
      y -= size + 3.5;
    });
    y -= dopo;
  }
  function riga2(sx, dx, { size = 10.5, bold = false } = {}) {
    const font = bold ? fb : f;
    const dxp = pulisci(dx, font);
    const wdx = font.widthOfTextAtSize(dxp, size);
    const righe = aCapo(sx, font, size, LARGO - wdx - 16);
    righe.forEach((r, i) => {
      spazio(size + 3);
      pag.drawText(r, { x: M, y: y - size, size, font, color: NERO });
      if (i === 0 && dxp) pag.drawText(dxp, { x: M + LARGO - wdx, y: y - size, size, font, color: NERO });
      y -= size + 3.5;
    });
  }
  function filo() { spazio(10); pag.drawLine({ start: { x: M, y: y - 4 }, end: { x: M + LARGO, y: y - 4 }, thickness: 0.6, color: rgb(0.8, 0.83, 0.88) }); y -= 12; }

  nuovaPagina();
  const imp = dati.impresa || {};
  testo(T(imp.nome) || 'Impresa', { size: 16, bold: true, colore: BLU, dopo: 0 });
  const contatti = [T(imp.tel), T(imp.email)].filter(Boolean).join('  ·  ');
  if (contatti) testo(contatti, { size: 9.5, colore: GRIGIO });
  y -= 6;
  const nomeDoc = dati.includi_prev === false ? 'Capitolato'
    : ((dati.tipo === 'parcella' ? 'Parcella' : 'Preventivo') + (dati.numero ? ' n. ' + dati.numero : ''));
  testo(nomeDoc + (dati.data ? ' del ' + String(dati.data).split('-').reverse().join('/') : ''), { size: 14, bold: true });
  if (T(dati.titolo)) testo(T(dati.titolo), { size: 12 });
  if (T(dati.cliente)) testo('Cliente: ' + T(dati.cliente), { size: 10.5, colore: GRIGIO });
  if (T(dati.dove)) testo('Dove: ' + T(dati.dove), { size: 10.5, colore: GRIGIO });
  filo();

  if (dati.includi_prev !== false) {
    (dati.righe || []).forEach(r => {
      if (r && r.sez) { y -= 4; testo(T(r.d), { size: 11, bold: true, colore: BLU, dopo: 1 }); return; }
      if (!r) return;
      riga2(T(r.d), T(r.t));
      if (T(r.q)) testo(T(r.q), { size: 9, colore: GRIGIO, dopo: 4 });
    });
    filo();
    (dati.totali || []).forEach(t => { if (Array.isArray(t)) riga2(T(t[0]), T(t[1])); });
    if (Array.isArray(dati.totale)) { y -= 2; riga2(T(dati.totale[0]), T(dati.totale[1]), { size: 13, bold: true }); }
    if (T(dati.totale_nota)) testo(T(dati.totale_nota), { size: 9, colore: GRIGIO });
    if (T(dati.nota_iva)) testo(T(dati.nota_iva), { size: 9, colore: GRIGIO });
    if (T(dati.note)) { y -= 6; testo('Note', { size: 11, bold: true }); testo(T(dati.note), { size: 10 }); }
  }

  (dati.capitolati || []).forEach(c => {
    if (!c) return;
    nuovaPagina();
    testo('Capitolato — ' + (T(c.nome) || 'Capitolato'), { size: 14, bold: true, colore: BLU });
    [['Dove', c.dove], ['Inizio', c.inizio], ['Durata', c.durata], ['Pagamenti', c.pagamenti]]
      .forEach(([k, v]) => { if (T(v)) testo(k + ': ' + T(v), { size: 10.5 }); });
    filo();
    (c.voci || []).forEach((v, i) => {
      if (!v) return;
      testo((i + 1) + '. ' + (T(v.titolo) || 'Voce'), { size: 11.5, bold: true, dopo: 1 });
      if (T(v.cosa)) testo(T(v.cosa), { size: 10.5 });
      if (T(v.materiali)) testo('Materiali: ' + T(v.materiali), { size: 10 });
      if (T(v.compreso)) testo('Compreso: ' + T(v.compreso), { size: 10 });
      if (T(v.escluso)) testo('Escluso: ' + T(v.escluso), { size: 10 });
      y -= 5;
    });
    if (T(c.garanzie)) { testo('Garanzie', { size: 11, bold: true }); testo(T(c.garanzie), { size: 10 }); }
    if (T(c.note)) { testo('Note', { size: 11, bold: true }); testo(T(c.note), { size: 10 }); }
    if ((c.allegati || []).length) testo('Foto allegate: ' + c.allegati.length + ' (si vedono dal link del documento).', { size: 9, colore: GRIGIO });
  });

  // ---- l'ultima pagina: la firma
  nuovaPagina();
  const chi = [T(firmatario && firmatario.nome), T(firmatario && firmatario.cognome)].filter(Boolean).join(' ');
  testo('Accettazione', { size: 15, bold: true, colore: BLU });
  testo('Io sottoscritto/a ' + (chi || '______________________') + ' dichiaro di aver letto '
    + (dati.includi_prev === false ? 'il capitolato' : (dati.tipo === 'parcella' ? 'la parcella' : 'il preventivo'))
    + ' delle pagine precedenti'
    + ((dati.capitolati || []).length && dati.includi_prev !== false ? ' e il capitolato allegato' : '')
    + ' e di accettarlo.', { size: 11 });
  testo('Firma elettronica con codice SMS (regolamento europeo eIDAS).', { size: 9, colore: GRIGIO });
  testo('Firma del cliente:', { size: 11, bold: true });

  const pagine = doc.getPageCount();
  const bytes = await doc.save();
  return { bytes: Buffer.from(bytes), pagine, firma: { page: pagine, x: FIRMA_POS.x, y: FIRMA_POS.y } };
}

module.exports = { costruisci };
