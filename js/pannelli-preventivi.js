/* ============================================================
   PANNELLI — PREVENTIVI E CANDIDATURE
   Codice UGUALE nei tre pannelli (impresa, artigiano, professionisti):
   finestra della richiesta, contatto sbloccato, testo del preventivo con AI, calcolo del prezzo, calcolatrice; elenco e stato delle candidature.
   Si carica PRIMA dello script grande della pagina.
   Usa dalla pagina: sb, impresaCorrente, esc e le altre funzioni comuni.
   ============================================================ */

let preventivoCorrente = null;

function chiudiModal() {
  document.getElementById('modal-overlay').classList.remove('show');
}

// ============ CONTATTO CLIENTE ============
// ============ ALLEGATI DELLA RICHIESTA (4 settembre 2026) ============
// Foto, PDF, computi e disegni che il cliente allega alla richiesta. Stanno
// nel bucket privato "preventivi-allegati": si aprono con un link firmato
// che vale un'ora, e lo puo' chiedere solo l'impresa proprietaria.
async function mostraAllegatiRichiesta(allegati) {
  const box = document.getElementById('ric-allegati');
  if (!box) return;
  let lista = [];
  try { lista = (typeof allegati === 'string') ? JSON.parse(allegati) : (allegati || []); } catch (e) { lista = []; }
  if (!Array.isArray(lista) || !lista.length) { box.style.display = 'none'; box.innerHTML = ''; return; }
  box.style.display = '';
  box.innerHTML = `<span class="ric-key">Allegati:</span><span>\u23F3 caricamento\u2026</span>`;
  const pezzi = [];
  for (const a of lista) {
    const nome = (a && (a.nome || a.path)) || 'allegato';
    let url = '';
    try {
      const { data } = await sb.storage.from('preventivi-allegati').createSignedUrl(a.path, 3600);
      url = (data && data.signedUrl) || '';
    } catch (e) { }
    const peso = (a && a.dim)
      ? ` <span style="color:#888">(${a.dim >= 1048576 ? (a.dim / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(a.dim / 1024)) + ' KB'})</span>`
      : '';
    pezzi.push(url
      ? `<a href="${escHtml(url)}" target="_blank" rel="noopener" style="display:inline-block;background:#eef4ff;border:1px solid #cfe0f5;color:#0052cc;padding:8px 12px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;margin:0 8px 8px 0">\uD83D\uDCCE ${escHtml(nome)}${peso}</a>`
      : `<span style="display:inline-block;color:#c0392b;font-size:14px;margin:0 8px 8px 0">\uD83D\uDCCE ${escHtml(nome)} \u2014 non si apre, riprova fra poco</span>`);
  }
  box.innerHTML = `<span class="ric-key">Allegati:</span><span>${pezzi.join('')}</span>`;
}

async function caricaContattoSbloccato(prevId) {
  try {
    const { data: { session } } = await sb.auth.getSession();
    const res = await fetch('/.netlify/functions/contatto-preventivo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
      body: JSON.stringify({ preventivo_id: prevId })
    });
    if (!res.ok) throw new Error(await res.text());
    const c = await res.json();
    const telPulito = (c.telefono || '').replace(/[\s\-+]/g, '').replace(/^39/, '');
    const waUrl = telPulito ? `https://wa.me/39${telPulito}` : '';
    const el = document.getElementById('ric-contatto');
    if (el) el.innerHTML = `<span class="ric-key">Contatto:</span><span>${c.email || '—'} · ${c.telefono || '—'}${waUrl ? ` &nbsp;<a href="${waUrl}" target="_blank" style="background:#25d366;color:white;padding:6px 12px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:700">📱 WhatsApp</a>` : ''}</span>`;
  } catch (e) {
    const el = document.getElementById('ric-contatto');
    if (el) el.innerHTML = `<span class="ric-key">Contatto:</span><span>⚠️ Errore nel caricamento, riprova</span>`;
  }
}

async function generaConAI() {
  const btn = document.getElementById('btn-genera-ai');
  btn.disabled = true;
  btn.innerHTML = '<span class="ai-spinner-btn"></span> L\'AI sta scrivendo il preventivo...';

  const p = preventivoCorrente;
  const imp = impresaCorrente;
  const nomeImp = _nomeImpresa(imp) || 'La tua impresa';

  await new Promise(r => setTimeout(r, 2000));

  const testo = generaTestoPreventivo(p, imp, nomeImp);
  const { min, max } = calcolaPrezzo(p);

  document.getElementById('prev-testo').value = testo;
  document.getElementById('prev-min').value = min;
  document.getElementById('prev-max').value = max;
  document.getElementById('prev-generato').classList.add('show');
  document.getElementById('btn-invia-prev').style.display = window._isMiaRichiesta ? 'block' : 'none';

  btn.innerHTML = '✅ Preventivo generato — personalizzalo!';
}

function generaTestoPreventivo(p, imp, nomeImp) {
  const oggi = new Date().toLocaleDateString('it-IT', {day:'numeric', month:'long', year:'numeric'});
  const { min, max } = calcolaPrezzo(p);
  return `Gentile ${p.nome.split(' ')[0]},

grazie per aver contattato ${nomeImp} tramite TrovaImpresa.

Abbiamo analizzato la sua richiesta riguardante: ${p.tipo_lavoro || 'il lavoro richiesto'}${p.indirizzo ? ` presso ${p.indirizzo}` : ''}.

DESCRIZIONE LAVORO
${p.descrizione || 'Come da richiesta.'}

PREVENTIVO INDICATIVO
• Costo manodopera e materiali: €${min.toLocaleString('it-IT')} – €${max.toLocaleString('it-IT')}
• Tempistiche: da definire dopo sopralluogo
• Inizio lavori: da concordare secondo disponibilità

COSA INCLUDE
✓ Sopralluogo gratuito senza impegno
✓ Manodopera qualificata e assicurata
✓ Materiali di prima qualità
✓ Pulizia area lavoro al termine
✓ Garanzia sulla lavorazione

PROSSIMI PASSI
Per un preventivo definitivo e vincolante, proponiamo un sopralluogo gratuito presso la sua abitazione. La contatteremo entro 24 ore per concordare data e orario.

Cordiali saluti,
${nomeImp}
${imp.telefono || ''}
${imp.email}

---
Preventivo generato il ${oggi} tramite TrovaImpresa`;
}

function calcolaPrezzo(p) {
  const prezzi = {
    'muratura': [800,2500], 'elettricista': [500,1800], 'idraulico': [400,1500],
    'tinteggiatura': [300,900], 'parquet': [600,1800], 'piastrelle': [500,1500],
    'ristrutturazione': [15000,60000], 'climatizzatore': [800,2500], 'caldaia': [1200,3500],
    'giardinaggio': [200,800], 'serramenti': [600,2500], 'fabbro': [200,800]
  };
  const lavoro = (p.tipo_lavoro || '').toLowerCase();
  let [min, max] = [800, 2000];
  for (const [k, v] of Object.entries(prezzi)) {
    if (lavoro.includes(k)) { [min, max] = v; break; }
  }
  const sup = parseInt(p.superficie) || 0;
  if (sup > 20) { min = Math.round(min * (1 + sup/100)); max = Math.round(max * (1 + sup/100)); }
  if (p.urgenza === 'urgente') { min = Math.round(min * 1.2); max = Math.round(max * 1.3); }
  return { min: Math.round(min/50)*50, max: Math.round(max/50)*50 };
}

function chiudiCalcolatrice() {
  showSection('dashboard');
}

const _fmtCalc = n => Number(n).toLocaleString('it-IT', { minimumFractionDigits:2, maximumFractionDigits:2 });

function chiudiModalPreventivoDash() {
  showSection('dashboard');
}

async function caricaCandidature() {
  const { data, error } = await sb.from('candidature')
    .select('*, candidati_lavoro(nome,cognome,email,telefono,cv,mestiere,citta), offerte_lavoro(titolo)')
    .eq('impresa_id', impresaCorrente.id)
    .order('data_candidatura', { ascending: false });
  const container = document.getElementById('lista-candidature');
  if (error) { container.innerHTML = '<div class="empty-state">Errore nel caricamento. Riprova.</div>'; return; }
  const lista = data || [];
  if (!lista.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📥</div>' +
      '<div style="font-size:1.05rem;margin-bottom:6px">Nessuna candidatura ancora.</div>' +
      '<div style="color:#777;font-size:0.95rem;margin-bottom:18px">Le candidature arrivano qui quando qualcuno risponde a una tua offerta di lavoro.</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">' +
        '<a href="javascript:void(0)" onclick="showSection(\'mie-offerte\'); caricaMieOfferte()" style="background:#fff;border:2px solid #7c3aed;color:#7c3aed;text-decoration:none;font-weight:700;padding:11px 20px;border-radius:10px">Le mie offerte di lavoro</a>' +
        '<a href="offerte-registrazione.html" style="background:#7c3aed;color:#fff;text-decoration:none;font-weight:700;padding:11px 20px;border-radius:10px">➕ Pubblica un\'offerta</a>' +
      '</div></div>';
    return;
  }
  const badge = {
    inviata:   { txt: 'Nuova',     col: '#1565c0' },
    vista:     { txt: 'Vista',     col: '#e65100' },
    accettata: { txt: 'Accettata', col: '#2e537d' },
    rifiutata: { txt: 'Rifiutata', col: '#c62828' }
  };
  container.innerHTML = lista.map(c => {
    const cand = c.candidati_lavoro || {};
    const off = c.offerte_lavoro || {};
    /* ⛔ 26 set 2026 — TUTTO QUELLO CHE SCRIVE IL CANDIDATO PASSA DA escHtml.
       Prima nome, messaggio, email e link del CV finivano nella pagina cosi'
       com'erano: chi si candidava poteva infilare del codice nel pannello
       dell'impresa. Il CV si apre solo se e' un indirizzo https vero. */
    const nome = escHtml([cand.nome, cand.cognome].filter(Boolean).join(' ') || 'Candidato');
    const cvOk = typeof cand.cv === 'string' && /^https:\/\//i.test(cand.cv.trim());
    const cvLink = cvOk ? `<a href="${escHtml(cand.cv.trim())}" target="_blank" rel="noopener">📄 Apri CV</a>` : '';
    const st = badge[c.stato] || badge.inviata;
    return `
      <div class="prev-card">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <div style="font-weight:600">${nome}${cand.mestiere ? ' · ' + escHtml(cand.mestiere) : ''}</div>
          <span style="background:${st.col};color:#fff;padding:3px 10px;border-radius:12px;font-size:15px;white-space:nowrap">${st.txt}</span>
        </div>
        ${off.titolo ? `<div style="color:#666;font-size:14px">Offerta: ${escHtml(off.titolo)}</div>` : ''}
        ${c.messaggio ? `<div style="margin-top:8px">${escHtml(c.messaggio)}</div>` : ''}
        <div style="margin-top:8px;font-size:14px">${cand.email ? '✉️ ' + escHtml(cand.email) + ' ' : ''}${cand.telefono ? '· 📞 ' + escHtml(cand.telefono) + ' ' : ''}${cvLink}</div>
        <div style="margin-top:12px;display:flex;gap:8px">
          <button onclick="aggiornaStatoCandidatura(${Number(c.id)}, 'accettata')" style="background:#2e537d;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-weight:600;cursor:pointer">✓ Accetta</button>
          <button onclick="aggiornaStatoCandidatura(${Number(c.id)}, 'rifiutata')" style="background:#c62828;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-weight:600;cursor:pointer">✗ Rifiuta</button>
        </div>
      </div>`;
  }).join('');
}

async function aggiornaStatoCandidatura(id, stato) {
  const { error } = await sb.from('candidature').update({ stato }).eq('id', id);
  if (error) { alert('Errore nell\'aggiornamento. Riprova.'); return; }
  caricaCandidature();
}
