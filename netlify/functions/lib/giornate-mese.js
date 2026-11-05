// =====================================================================
// 3 novembre 2026 — LE GIORNATE DEL MESE, PER EMAIL
// Usata da giornate-consulente.js (la prova, «Mandale a me») e da
// giornate-consulente-mese.js (il primo del mese, al consulente).
//
// ⛔ I conti sono quelli di giorTotali() in js/gest-giornate.js:
//    un giorno = una data diversa in cui la persona ha ore; le ore si
//    sommano; un cantiere conta i giorni diversi in cui ci si e' lavorato.
//    Le giornate col rapportino nel Cestino non contano. Se cambia uno,
//    va cambiato anche l'altro.
// ⛔ Non ci sono soldi qui: al consulente servono giorni e ore.
// =====================================================================
const MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
const GG = ['dom','lun','mar','mer','gio','ven','sab'];

function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function meseNome(ym) { const [y, m] = ym.split('-'); return MESI[+m - 1] + ' ' + y; }
function meseDopo(ym) { let [y, m] = ym.split('-').map(Number); m++; if (m > 12) { m = 1; y++; } return y + '-' + String(m).padStart(2, '0'); }
function mesePrima(ym) { let [y, m] = ym.split('-').map(Number); m--; if (m < 1) { m = 12; y--; } return y + '-' + String(m).padStart(2, '0'); }
function giorno(iso) { const d = new Date(iso + 'T12:00:00Z'); return GG[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MESI[d.getUTCMonth()]; }
function ore(n) { return String(Math.round((+n || 0) * 100) / 100).replace('.', ','); }
function csvCampo(v) { v = String(v == null ? '' : v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }

async function leggi(sb, userId, ym) {
  const da = ym + '-01', a = meseDopo(ym) + '-01';
  const ro = await sb.from('gest_ore').select('data,ore,operatore_id,lavoro_id,rapportino_id')
    .eq('user_id', userId).is('eliminato_il', null).gte('data', da).lt('data', a).limit(5000);
  if (ro.error) throw new Error('ore: ' + ro.error.message);
  let righe = ro.data || [];
  const rids = [...new Set(righe.map(r => r.rapportino_id).filter(Boolean))];
  if (rids.length) {
    const rr = await sb.from('gest_rapportini').select('id,eliminato_il').in('id', rids);
    if (rr.error) throw new Error('rapportini: ' + rr.error.message);
    const buttati = new Set((rr.data || []).filter(x => x.eliminato_il).map(x => x.id));
    righe = righe.filter(r => !(r.rapportino_id && buttati.has(r.rapportino_id)));
  }
  const oids = [...new Set(righe.map(r => r.operatore_id).filter(Boolean))];
  const lids = [...new Set(righe.map(r => r.lavoro_id).filter(Boolean))];
  const [rop, rla, raz] = await Promise.all([
    oids.length ? sb.from('gest_operatori').select('id,nome').in('id', oids) : { data: [] },
    lids.length ? sb.from('gest_lavori').select('id,descrizione,dove').in('id', lids) : { data: [] },
    sb.from('gest_azienda').select('nome').eq('user_id', userId).maybeSingle()
  ]);
  const nomeOp = {}; (rop.data || []).forEach(o => { nomeOp[o.id] = o.nome || 'Senza nome'; });
  const nomeLav = {}; (rla.data || []).forEach(l => { nomeLav[l.id] = l.descrizione || l.dove || 'Cantiere'; });
  const azienda = (raz && raz.data && raz.data.nome) || '';

  const per = {}, luo = {}, giorni = {};
  righe.forEach(r => {
    const n = nomeOp[r.operatore_id] || 'Senza nome';
    const L = nomeLav[r.lavoro_id] || 'Cantiere';
    per[n] = per[n] || { giorni: new Set(), ore: 0 };
    per[n].giorni.add(r.data); per[n].ore += +r.ore || 0;
    luo[L] = luo[L] || new Set(); luo[L].add(r.data);
    const k = r.data + '|' + L;
    giorni[k] = giorni[k] || { data: r.data, cantiere: L, chi: [] };
    if (giorni[k].chi.indexOf(n) < 0) giorni[k].chi.push(n);
  });
  return {
    ym, azienda, vuoto: !righe.length,
    persone: Object.keys(per).sort().map(n => ({ nome: n, giorni: per[n].giorni.size, ore: per[n].ore })),
    cantieri: Object.keys(luo).sort().map(L => ({ nome: L, giorni: luo[L].size })),
    giorni: Object.values(giorni).sort((x, y) => x.data.localeCompare(y.data) || x.cantiere.localeCompare(y.cantiere))
  };
}

function html(d, prova) {
  const th = 'style="text-align:left;padding:8px 10px;border-bottom:2px solid #0a2a4d;font-size:14px"';
  const td = 'style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:15px"';
  const tdn = 'style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:15px;text-align:right"';
  const tab = (tit, cols, righe) => '<h3 style="font-size:17px;margin:26px 0 8px;color:#0a2a4d">' + tit + '</h3>'
    + '<table style="border-collapse:collapse;width:100%"><tr>' + cols.map(c => '<th ' + th + '>' + c + '</th>').join('') + '</tr>'
    + righe.join('') + '</table>';
  return '<div style="font-family:Arial,sans-serif;color:#0f172a;max-width:680px">'
    + (prova ? '<p style="background:#fff7ed;border:1px solid #fdba74;padding:10px 12px;border-radius:8px">Questa è una <b>prova</b>: è l\'email che riceverà il tuo consulente del lavoro.</p>' : '')
    + '<h2 style="font-size:22px;margin:0 0 4px">Giornate di lavoro — ' + esc(meseNome(d.ym)) + '</h2>'
    + (d.azienda ? '<p style="margin:0 0 6px;font-size:16px">' + esc(d.azienda) + '</p>' : '')
    + '<p style="margin:0;color:#475569;font-size:14px">In allegato lo stesso elenco in un file che si apre con Excel.</p>'
    + tab('Per lavoratore', ['Nome', 'Giorni', 'Ore'], d.persone.map(p => '<tr><td ' + td + '>' + esc(p.nome) + '</td><td ' + tdn + '>' + p.giorni + '</td><td ' + tdn + '>' + ore(p.ore) + '</td></tr>'))
    + tab('Per cantiere', ['Cantiere', 'Giorni'], d.cantieri.map(c => '<tr><td ' + td + '>' + esc(c.nome) + '</td><td ' + tdn + '>' + c.giorni + '</td></tr>'))
    + tab('Giorno per giorno', ['Giorno', 'Cantiere', 'Chi'], d.giorni.map(g => '<tr><td ' + td + '>' + esc(giorno(g.data)) + '</td><td ' + td + '>' + esc(g.cantiere) + '</td><td ' + td + '>' + esc(g.chi.join(', ')) + '</td></tr>'))
    + '<p style="margin-top:28px;color:#64748b;font-size:13px">Mandata dal gestionale di TrovaImpresa.it</p></div>';
}

function csv(d) {
  const r = [['Giorno', 'Cantiere', 'Lavoratore']];
  d.giorni.forEach(g => g.chi.forEach(n => r.push([g.data, g.cantiere, n])));
  r.push([]); r.push(['Lavoratore', 'Giorni', 'Ore']);
  d.persone.forEach(p => r.push([p.nome, p.giorni, ore(p.ore)]));
  // il BOM fa leggere gli accenti a Excel
  return '﻿' + r.map(x => x.map(csvCampo).join(';')).join('\r\n');
}

async function manda(d, a, prova, replyTo) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'TrovaImpresa <info@trovaimpresa.com>', to: [a],
      reply_to: replyTo ? [replyTo] : undefined,
      subject: (prova ? '[Prova] ' : '') + 'Giornate di lavoro — ' + meseNome(d.ym) + (d.azienda ? ' — ' + d.azienda : ''),
      html: html(d, prova),
      attachments: [{ filename: 'giornate-' + d.ym + '.csv', content: Buffer.from(csv(d), 'utf8').toString('base64') }]
    })
  });
  if (!res.ok) throw new Error('Resend ' + res.status + ': ' + (await res.text()).slice(0, 200));
}

module.exports = { leggi, manda, mesePrima, meseNome, html, csv };
