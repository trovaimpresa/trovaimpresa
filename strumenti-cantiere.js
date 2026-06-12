// strumenti-cantiere.js — sezione Cantieri condivisa (artigiano, impresa, professionisti)
// Dipendenze attese (definite nello script inline di ogni pannello):
//   sb              — client Supabase
//   impresaCorrente — record attività loggata (serve .user_id per lista/salva cantiere)
//   showSection     — navigazione sezioni
//   cantiereAttivo  — stato "cantiere corrente" (let dichiarato inline nel pannello;
//                     impostato da apriDettaglioCantiere, azzerato da chiudiModalDettaglioCantiere)

// CANTIERI
async function caricaCantieri() {
  const lista = document.getElementById('lista-cantieri');
  if (!lista || !impresaCorrente) return;
  const { data, error } = await sb.from('cantieri').select('*').eq('user_id', impresaCorrente.user_id).order('created_at', { ascending: false });
  if (error) {
    lista.innerHTML = '<div style="color:#c0392b;font-size:0.9rem;grid-column:1/-1">Errore caricamento cantieri</div>';
    return;
  }
  if (!data || !data.length) {
    lista.innerHTML = '<div style="color:#999;font-size:0.9rem;grid-column:1/-1;text-align:center;padding:12px">Nessun cantiere ancora</div>';
    return;
  }
  const esc = s => (s == null ? '' : String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const statoColore = { in_corso:'#e8733a', completato:'#2a7a4b', sospeso:'#888' };
  const statoLabel  = { in_corso:'In corso', completato:'Completato', sospeso:'Sospeso' };
  lista.innerHTML = data.map(c => {
    const colore = statoColore[c.stato] || '#888';
    const label  = statoLabel[c.stato]  || (c.stato || '—');
    return `<div onclick="apriDettaglioCantiere('${c.id}')" style="border:1.5px solid rgba(0,0,0,0.08);border-radius:14px;padding:16px;cursor:pointer;background:#fafafa">
      <div style="font-weight:700;color:#1a3a2a;margin-bottom:6px">${esc(c.nome) || '—'}</div>
      ${c.cliente ? `<div style="font-size:0.85rem;color:#555;margin-bottom:2px">👤 ${esc(c.cliente)}</div>` : ''}
      ${c.indirizzo ? `<div style="font-size:0.85rem;color:#555;margin-bottom:8px">📍 ${esc(c.indirizzo)}</div>` : ''}
      <span style="display:inline-block;padding:4px 10px;background:${colore};color:white;border-radius:999px;font-size:0.75rem;font-weight:700">${label}</span>
    </div>`;
  }).join('');
}

async function salvaCantiere() {
  const nome = document.getElementById('cant-nome').value.trim();
  if (!nome) { alert('Il nome del cantiere è obbligatorio.'); return; }
  const cliente   = document.getElementById('cant-cliente').value.trim() || null;
  const indirizzo = document.getElementById('cant-indirizzo').value.trim() || null;
  const data_inizio = document.getElementById('cant-data-inizio').value || null;
  const data_fine   = document.getElementById('cant-data-fine').value || null;
  const stato = document.getElementById('cant-stato').value;
  const note  = document.getElementById('cant-note').value.trim() || null;
  const { error } = await sb.from('cantieri').insert({
    user_id: impresaCorrente.user_id,
    nome, cliente, indirizzo, data_inizio, data_fine, stato, note
  });
  if (error) { alert('Errore: ' + error.message); return; }
  document.getElementById('cant-nome').value = '';
  document.getElementById('cant-cliente').value = '';
  document.getElementById('cant-indirizzo').value = '';
  document.getElementById('cant-data-inizio').value = '';
  document.getElementById('cant-data-fine').value = '';
  document.getElementById('cant-stato').value = 'in_corso';
  document.getElementById('cant-note').value = '';
  chiudiModalNuovoCantiere();
  await caricaCantieri();
}

function chiudiModalNuovoCantiere() {
  document.getElementById('modalNuovoCantiere').classList.remove('show');
}

// DETTAGLIO CANTIERE
async function apriDettaglioCantiere(id) {
  cantiereAttivo = id;
  document.getElementById('modalDettaglioCantiere').classList.add('show');
  switchTabCantiere('info');
  const { data: c } = await sb.from('cantieri').select('*').eq('id', id).single();
  if (!c) return;
  const statoLabel = { in_corso:'🟠 In corso', completato:'🟢 Completato', sospeso:'⚫ Sospeso' };
  document.getElementById('dett-cant-nome').textContent = `🏗️ ${c.nome || '—'}`;
  document.getElementById('dett-cant-sub').textContent = [c.cliente, c.indirizzo].filter(Boolean).join(' · ');
  document.getElementById('dett-cant-cliente').textContent = c.cliente || '—';
  document.getElementById('dett-cant-indirizzo').textContent = c.indirizzo || '—';
  document.getElementById('dett-cant-data-inizio').textContent = c.data_inizio || '—';
  document.getElementById('dett-cant-data-fine').textContent = c.data_fine || '—';
  document.getElementById('dett-cant-stato').textContent = statoLabel[c.stato] || c.stato || '—';
  document.getElementById('dett-cant-note').textContent = c.note || '—';
  const oggi = new Date().toISOString().slice(0, 10);
  const dataEmis = document.getElementById('fatt-cant-data-emissione');
  if (dataEmis && !dataEmis.value) dataEmis.value = oggi;
  const dataLog = document.getElementById('log-cant-data');
  if (dataLog && !dataLog.value) dataLog.value = oggi;
  const dataScad = document.getElementById('scad-cant-data');
  if (dataScad && !dataScad.value) {
    const d = new Date(); d.setDate(d.getDate() + 7);
    dataScad.value = d.toISOString().slice(0, 10);
  }
  await caricaFotoCantiere();
  await caricaPreventiviCantiere();
  await caricaFattureCantiere();
  await caricaLogCantiere();
  await caricaScadenzeCantiere();
}

function chiudiModalDettaglioCantiere() {
  document.getElementById('modalDettaglioCantiere').classList.remove('show');
  cantiereAttivo = null;
}

function switchTabCantiere(tabName) {
  document.querySelectorAll('#modalDettaglioCantiere .cant-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });
  document.querySelectorAll('#modalDettaglioCantiere .cant-pane').forEach(p => {
    p.classList.toggle('active', p.dataset.pane === tabName);
  });
}

let fotoCantiereCache = [];

async function caricaFotoCantiere() {
  const grid = document.getElementById('dett-cant-foto-grid');
  if (!grid || !cantiereAttivo) return;
  const { data } = await sb.from('cantiere_foto').select('*').eq('cantiere_id', cantiereAttivo).order('created_at', { ascending: false });
  fotoCantiereCache = data || [];
  renderFotoCantiere();
}

function renderFotoCantiere() {
  const grid = document.getElementById('dett-cant-foto-grid');
  if (!grid) return;
  const foto = fotoCantiereCache;
  if (!foto.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📷</div>Nessuna foto per questo cantiere</div>';
    return;
  }
  grid.innerHTML = foto.map(f => {
    const path = (f.url || '').split('/cantieri-foto/')[1] || '';
    const pathSafe = path.replace(/'/g, "\\'");
    return `<div class="foto-item"><img src="${f.url}" alt="" loading="lazy"><button class="foto-item-del" onclick="eliminaFotoCantiere('${f.id}','${pathSafe}')" title="Elimina foto">✕ Elimina</button></div>`;
  }).join('');
}

async function uploadFotoCantiere(files) {
  if (!files?.length || !cantiereAttivo) return;
  const progress = document.getElementById('dett-cant-foto-progress');
  if (progress) { progress.style.display = 'block'; progress.textContent = `⏳ Caricamento ${files.length} foto...`; }
  let ok = 0;
  for (const file of Array.from(files)) {
    if (file.size > 5 * 1024 * 1024) {
      alert(`"${file.name}" supera i 5 MB — saltata.`);
      continue;
    }
    const path = `${cantiereAttivo}/${Date.now()}-${file.name}`;
    const { error: upErr } = await sb.storage.from('cantieri-foto').upload(path, file, { upsert: false });
    if (upErr) { console.error('Upload cantiere errore:', upErr); continue; }
    const { data: { publicUrl } } = sb.storage.from('cantieri-foto').getPublicUrl(path);
    const { data: nuova, error: insErr } = await sb.from('cantiere_foto').insert({ cantiere_id: cantiereAttivo, url: publicUrl }).select().single();
    if (insErr) { console.error('Insert cantiere_foto errore:', insErr); continue; }
    if (nuova) fotoCantiereCache.unshift(nuova);
    ok++;
  }
  if (progress) { progress.textContent = `✅ ${ok} foto caricate!`; setTimeout(() => { progress.style.display = 'none'; }, 2500); }
  const input = document.getElementById('dett-cant-foto-input');
  if (input) input.value = '';
  renderFotoCantiere();
}

async function eliminaFotoCantiere(id, path) {
  if (!confirm('Eliminare questa foto?')) return;
  if (path) await sb.storage.from('cantieri-foto').remove([path]);
  const { error } = await sb.from('cantiere_foto').delete().eq('id', id);
  if (error) { alert('Errore: ' + error.message); return; }
  fotoCantiereCache = fotoCantiereCache.filter(f => String(f.id) !== String(id));
  renderFotoCantiere();
}

function dettCantDragOver(e) {
  e.preventDefault();
  document.getElementById('dett-cant-upload-area').classList.add('dragover');
}
function dettCantDragLeave(e) {
  document.getElementById('dett-cant-upload-area').classList.remove('dragover');
}
function dettCantDrop(e) {
  e.preventDefault();
  document.getElementById('dett-cant-upload-area').classList.remove('dragover');
  uploadFotoCantiere(e.dataTransfer.files);
}

// PREVENTIVI CANTIERE
let preventiviCantiereCache = [];

async function caricaPreventiviCantiere() {
  const lista = document.getElementById('dett-cant-preventivi-lista');
  if (!lista || !cantiereAttivo) return;
  const { data } = await sb.from('cantiere_preventivi').select('*').eq('cantiere_id', cantiereAttivo).order('created_at', { ascending: false });
  preventiviCantiereCache = data || [];
  renderPreventiviCantiere();
}

function renderPreventiviCantiere() {
  const lista = document.getElementById('dett-cant-preventivi-lista');
  if (!lista) return;
  const prev = preventiviCantiereCache;
  if (!prev.length) {
    lista.innerHTML = '<div style="color:#999;font-size:0.9rem;text-align:center;padding:18px">Nessun preventivo ancora</div>';
    return;
  }
  const esc = s => (s == null ? '' : String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fmtImporto = n => (n == null) ? '—' : Number(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  lista.innerHTML = prev.map(p => {
    const fileUrlSafe = (p.file_url || '').replace(/'/g, "\\'");
    const badge = p.accettato
      ? '<span style="display:inline-block;padding:4px 10px;background:#2a7a4b;color:white;border-radius:999px;font-size:0.72rem;font-weight:700">✓ Accettato</span>'
      : '<span style="display:inline-block;padding:4px 10px;background:#e8733a;color:white;border-radius:999px;font-size:0.72rem;font-weight:700">In attesa</span>';
    return `<div style="border:1px solid var(--border);border-radius:12px;padding:14px 16px;background:white;display:flex;gap:14px;align-items:flex-start;justify-content:space-between">
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">
          <div style="font-family:'Playfair Display',serif;font-size:1.4rem;color:#1a3a2a;font-weight:700">€ ${fmtImporto(p.importo)}</div>
          ${badge}
        </div>
        ${p.descrizione ? `<div style="font-size:0.88rem;color:#555;white-space:pre-wrap;margin-bottom:6px">${esc(p.descrizione)}</div>` : ''}
        ${p.file_url ? `<a href="${p.file_url}" target="_blank" rel="noopener" style="font-size:0.85rem;color:#2a7a4b;font-weight:600;text-decoration:none">📎 Apri allegato</a>` : ''}
      </div>
      <button onclick="eliminaPreventivoCantiere('${p.id}','${fileUrlSafe}')" title="Elimina preventivo" style="background:transparent;border:none;cursor:pointer;font-size:1.1rem;color:#c0392b;padding:4px 6px;line-height:1">🗑️</button>
    </div>`;
  }).join('');
}

async function salvaPreventivoCantiere() {
  if (!cantiereAttivo) return;
  const importoRaw = document.getElementById('prev-cant-importo').value;
  if (importoRaw === '' || isNaN(Number(importoRaw))) { alert('Inserisci un importo valido.'); return; }
  const importo = Number(importoRaw);
  const descrizione = document.getElementById('prev-cant-descrizione').value.trim() || null;
  const accettato = document.getElementById('prev-cant-accettato').checked;
  const fileInput = document.getElementById('prev-cant-file');
  const file = fileInput.files && fileInput.files[0];
  let file_url = null;
  if (file) {
    if (file.size > 10 * 1024 * 1024) { alert('Il file supera i 10 MB.'); return; }
    const path = `${cantiereAttivo}/${Date.now()}-${file.name}`;
    const { error: upErr } = await sb.storage.from('cantieri-preventivi').upload(path, file, { upsert: false });
    if (upErr) { alert('Errore upload file: ' + upErr.message); return; }
    const { data: { publicUrl } } = sb.storage.from('cantieri-preventivi').getPublicUrl(path);
    file_url = publicUrl;
  }
  const { data: nuovo, error: insErr } = await sb.from('cantiere_preventivi').insert({
    cantiere_id: cantiereAttivo, importo, descrizione, file_url, accettato
  }).select().single();
  if (insErr) { alert('Errore: ' + insErr.message); return; }
  document.getElementById('prev-cant-importo').value = '';
  document.getElementById('prev-cant-descrizione').value = '';
  document.getElementById('prev-cant-accettato').checked = false;
  fileInput.value = '';
  const msg = document.getElementById('prev-cant-msg');
  if (msg) { msg.textContent = '✅ Salvato'; msg.style.display = 'inline'; setTimeout(() => { msg.style.display = 'none'; }, 2000); }
  if (nuovo) {
    preventiviCantiereCache.unshift(nuovo);
    renderPreventiviCantiere();
  }
}

async function eliminaPreventivoCantiere(id, file_url) {
  if (!confirm('Eliminare questo preventivo?')) return;
  if (file_url) {
    const path = file_url.split('/cantieri-preventivi/')[1];
    if (path) await sb.storage.from('cantieri-preventivi').remove([path]);
  }
  const { error } = await sb.from('cantiere_preventivi').delete().eq('id', id);
  if (error) { alert('Errore: ' + error.message); return; }
  preventiviCantiereCache = preventiviCantiereCache.filter(p => String(p.id) !== String(id));
  renderPreventiviCantiere();
}

// FATTURE CANTIERE
let fattureCantiereCache = [];

async function caricaFattureCantiere() {
  const lista = document.getElementById('dett-cant-fatture-lista');
  if (!lista || !cantiereAttivo) return;
  const { data } = await sb.from('cantiere_fatture').select('*').eq('cantiere_id', cantiereAttivo).order('created_at', { ascending: false });
  fattureCantiereCache = data || [];
  renderFattureCantiere();
}

function renderFattureCantiere() {
  const lista = document.getElementById('dett-cant-fatture-lista');
  if (!lista) return;
  const fatt = fattureCantiereCache;
  if (!fatt.length) {
    lista.innerHTML = '<div style="color:#999;font-size:0.9rem;text-align:center;padding:18px">Nessuna fattura ancora</div>';
    return;
  }
  const esc = s => (s == null ? '' : String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fmtImporto = n => (n == null) ? '—' : Number(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtData = d => d ? new Date(d).toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—';
  lista.innerHTML = fatt.map(f => {
    const fileUrlSafe = (f.file_url || '').replace(/'/g, "\\'");
    const badge = f.pagata
      ? '<span style="display:inline-block;padding:4px 10px;background:#2a7a4b;color:white;border-radius:999px;font-size:0.72rem;font-weight:700">✓ Pagata</span>'
      : '<span style="display:inline-block;padding:4px 10px;background:#e8733a;color:white;border-radius:999px;font-size:0.72rem;font-weight:700">Da pagare</span>';
    return `<div style="border:1px solid var(--border);border-radius:12px;padding:14px 16px;background:white;display:flex;gap:14px;align-items:flex-start;justify-content:space-between">
      <div style="flex:1;min-width:0">
        ${f.numero ? `<div style="font-size:0.78rem;color:var(--mid);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Fattura nº ${esc(f.numero)}</div>` : ''}
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">
          <div style="font-family:'Playfair Display',serif;font-size:1.4rem;color:#1a3a2a;font-weight:700">€ ${fmtImporto(f.importo)}</div>
          ${badge}
        </div>
        <div style="font-size:0.82rem;color:#555;margin-bottom:6px">
          📅 Emessa: ${fmtData(f.data_emissione)}${f.data_scadenza ? ` · ⏰ Scadenza: ${fmtData(f.data_scadenza)}` : ''}
        </div>
        ${f.note ? `<div style="font-size:0.88rem;color:#555;white-space:pre-wrap;margin-bottom:6px">${esc(f.note)}</div>` : ''}
        ${f.file_url ? `<a href="${f.file_url}" target="_blank" rel="noopener" style="font-size:0.85rem;color:#2a7a4b;font-weight:600;text-decoration:none">📄 Apri allegato</a>` : ''}
      </div>
      <button onclick="eliminaFatturaCantiere('${f.id}','${fileUrlSafe}')" title="Elimina fattura" style="background:transparent;border:none;cursor:pointer;font-size:1.1rem;color:#c0392b;padding:4px 6px;line-height:1">🗑️</button>
    </div>`;
  }).join('');
}

async function salvaFatturaCantiere() {
  if (!cantiereAttivo) return;
  const importoRaw = document.getElementById('fatt-cant-importo').value;
  if (importoRaw === '' || isNaN(Number(importoRaw))) { alert('Inserisci un importo valido.'); return; }
  const importo = Number(importoRaw);
  const numero = document.getElementById('fatt-cant-numero').value.trim() || null;
  const data_emissione = document.getElementById('fatt-cant-data-emissione').value || null;
  const data_scadenza  = document.getElementById('fatt-cant-data-scadenza').value || null;
  const pagata = document.getElementById('fatt-cant-pagata').checked;
  const note = document.getElementById('fatt-cant-note').value.trim() || null;
  const fileInput = document.getElementById('fatt-cant-file');
  const file = fileInput.files && fileInput.files[0];
  let file_url = null;
  if (file) {
    if (file.size > 10 * 1024 * 1024) { alert('Il file supera i 10 MB.'); return; }
    const path = `${cantiereAttivo}/${Date.now()}-${file.name}`;
    const { error: upErr } = await sb.storage.from('cantieri-fatture').upload(path, file, { upsert: false });
    if (upErr) { alert('Errore upload file: ' + upErr.message); return; }
    const { data: { publicUrl } } = sb.storage.from('cantieri-fatture').getPublicUrl(path);
    file_url = publicUrl;
  }
  const { data: nuova, error: insErr } = await sb.from('cantiere_fatture').insert({
    cantiere_id: cantiereAttivo, numero, importo, data_emissione, data_scadenza, file_url, pagata, note
  }).select().single();
  if (insErr) { alert('Errore: ' + insErr.message); return; }
  document.getElementById('fatt-cant-numero').value = '';
  document.getElementById('fatt-cant-importo').value = '';
  document.getElementById('fatt-cant-data-emissione').value = new Date().toISOString().slice(0, 10);
  document.getElementById('fatt-cant-data-scadenza').value = '';
  document.getElementById('fatt-cant-pagata').checked = false;
  document.getElementById('fatt-cant-note').value = '';
  fileInput.value = '';
  const msg = document.getElementById('fatt-cant-msg');
  if (msg) { msg.textContent = '✅ Salvata'; msg.style.display = 'inline'; setTimeout(() => { msg.style.display = 'none'; }, 2000); }
  if (nuova) {
    fattureCantiereCache.unshift(nuova);
    renderFattureCantiere();
  }
}

async function eliminaFatturaCantiere(id, file_url) {
  if (!confirm('Eliminare questa fattura?')) return;
  if (file_url) {
    const path = file_url.split('/cantieri-fatture/')[1];
    if (path) await sb.storage.from('cantieri-fatture').remove([path]);
  }
  const { error } = await sb.from('cantiere_fatture').delete().eq('id', id);
  if (error) { alert('Errore: ' + error.message); return; }
  fattureCantiereCache = fattureCantiereCache.filter(f => String(f.id) !== String(id));
  renderFattureCantiere();
}

// QUADERNO CANTIERE
let logCantiereCache = [];

async function caricaLogCantiere() {
  const lista = document.getElementById('dett-cant-log-lista');
  if (!lista || !cantiereAttivo) return;
  const { data } = await sb.from('cantiere_log').select('*').eq('cantiere_id', cantiereAttivo).order('data', { ascending: false });
  logCantiereCache = data || [];
  renderLogCantiere();
}

function renderLogCantiere() {
  const lista = document.getElementById('dett-cant-log-lista');
  if (!lista) return;
  const log = logCantiereCache;
  if (!log.length) {
    lista.innerHTML = '<div style="color:#999;font-size:0.9rem;text-align:center;padding:18px">Nessuna registrazione ancora</div>';
    return;
  }
  const esc = s => (s == null ? '' : String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fmtData = d => {
    if (!d) return '—';
    const parts = new Date(d).toLocaleDateString('it-IT', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
    return parts.charAt(0).toUpperCase() + parts.slice(1);
  };
  const fmtOre = n => {
    if (n == null || n === '') return null;
    const v = Number(n);
    return Number.isInteger(v) ? `${v}h` : `${v.toString().replace('.', ',')}h`;
  };
  lista.innerHTML = log.map(l => {
    const oreLbl = fmtOre(l.ore_lavorate);
    return `<div style="border:1px solid var(--border);border-radius:12px;padding:14px 16px;background:white;display:flex;gap:14px;align-items:flex-start;justify-content:space-between">
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap">
          <div style="font-family:'Playfair Display',serif;font-size:1.15rem;color:#1a3a2a;font-weight:700">${fmtData(l.data)}</div>
          ${oreLbl ? `<span style="display:inline-block;padding:4px 10px;background:#2a7a4b;color:white;border-radius:999px;font-size:0.72rem;font-weight:700">⏱️ ${oreLbl}</span>` : ''}
        </div>
        ${l.materiali ? `<div style="font-size:0.88rem;color:#555;white-space:pre-wrap;margin-bottom:6px"><span style="margin-right:4px">📦</span>${esc(l.materiali)}</div>` : ''}
        ${l.note ? `<div style="font-size:0.88rem;color:#555;white-space:pre-wrap">${esc(l.note)}</div>` : ''}
      </div>
      <button onclick="eliminaLogCantiere('${l.id}')" title="Elimina registrazione" style="background:transparent;border:none;cursor:pointer;font-size:1.1rem;color:#c0392b;padding:4px 6px;line-height:1">🗑️</button>
    </div>`;
  }).join('');
}

async function salvaLogCantiere() {
  if (!cantiereAttivo) return;
  const data = document.getElementById('log-cant-data').value || null;
  const oreRaw = document.getElementById('log-cant-ore').value;
  const ore_lavorate = (oreRaw === '' || isNaN(Number(oreRaw))) ? null : Number(oreRaw);
  const materiali = document.getElementById('log-cant-materiali').value.trim() || null;
  const note = document.getElementById('log-cant-note').value.trim() || null;
  if (!data && ore_lavorate == null && !materiali && !note) {
    alert('Compila almeno un campo.');
    return;
  }
  const { data: nuovo, error } = await sb.from('cantiere_log').insert({
    cantiere_id: cantiereAttivo, data, ore_lavorate, materiali, note
  }).select().single();
  if (error) { alert('Errore: ' + error.message); return; }
  document.getElementById('log-cant-data').value = new Date().toISOString().slice(0, 10);
  document.getElementById('log-cant-ore').value = '';
  document.getElementById('log-cant-materiali').value = '';
  document.getElementById('log-cant-note').value = '';
  const msg = document.getElementById('log-cant-msg');
  if (msg) { msg.textContent = '✅ Salvato'; msg.style.display = 'inline'; setTimeout(() => { msg.style.display = 'none'; }, 2000); }
  if (nuovo) {
    logCantiereCache.push(nuovo);
    logCantiereCache.sort((a, b) =>
      String(b.data || '9999-12-31').localeCompare(String(a.data || '9999-12-31')));
    renderLogCantiere();
  }
}

async function eliminaLogCantiere(id) {
  if (!confirm('Eliminare questa registrazione?')) return;
  const { error } = await sb.from('cantiere_log').delete().eq('id', id);
  if (error) { alert('Errore: ' + error.message); return; }
  logCantiereCache = logCantiereCache.filter(l => String(l.id) !== String(id));
  renderLogCantiere();
}

// SCADENZE CANTIERE
let scadenzeCantiereCache = [];

function sortScadenzeCantiere() {
  scadenzeCantiereCache.sort((a, b) =>
    (a.completata === b.completata ? 0 : (a.completata ? 1 : -1)) ||
    String(a.data_scadenza || '9999-12-31').localeCompare(String(b.data_scadenza || '9999-12-31')));
}

async function caricaScadenzeCantiere() {
  const lista = document.getElementById('dett-cant-scadenze-lista');
  if (!lista || !cantiereAttivo) return;
  const { data } = await sb.from('cantiere_scadenze').select('*')
    .eq('cantiere_id', cantiereAttivo)
    .order('completata', { ascending: true })
    .order('data_scadenza', { ascending: true });
  scadenzeCantiereCache = data || [];
  renderScadenzeCantiere();
}

function renderScadenzeCantiere() {
  const lista = document.getElementById('dett-cant-scadenze-lista');
  if (!lista) return;
  const scad = scadenzeCantiereCache;
  if (!scad.length) {
    lista.innerHTML = '<div style="color:#999;font-size:0.9rem;text-align:center;padding:18px">Nessuna scadenza ancora</div>';
    return;
  }
  const esc = s => (s == null ? '' : String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fmtData = d => {
    if (!d) return '—';
    const parts = new Date(d).toLocaleDateString('it-IT', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
    return parts.charAt(0).toUpperCase() + parts.slice(1);
  };
  const oggi = new Date(); oggi.setHours(0,0,0,0);
  lista.innerHTML = scad.map(s => {
    let badgeBg = '#888', badgeLbl = '—', extraStyle = '';
    if (s.completata) {
      badgeBg = '#888'; badgeLbl = '✓ Completata';
      extraStyle = 'opacity:0.6';
    } else if (s.data_scadenza) {
      const ds = new Date(s.data_scadenza); ds.setHours(0,0,0,0);
      const diffGg = Math.round((ds - oggi) / 86400000);
      if (diffGg < 0) { badgeBg = '#c0392b'; badgeLbl = `⚠️ Scaduta da ${Math.abs(diffGg)}g`; }
      else if (diffGg === 0) { badgeBg = '#c0392b'; badgeLbl = '🔥 Oggi'; }
      else if (diffGg <= 7) { badgeBg = '#e8733a'; badgeLbl = `⏰ Tra ${diffGg}g`; }
      else { badgeBg = '#2a7a4b'; badgeLbl = `📅 Tra ${diffGg}g`; }
    }
    return `<div style="border:1px solid var(--border);border-radius:12px;padding:14px 16px;background:white;display:flex;gap:14px;align-items:flex-start;justify-content:space-between;${extraStyle}">
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">
          <div style="font-weight:700;color:#1a3a2a;font-size:1rem${s.completata ? ';text-decoration:line-through' : ''}">${esc(s.descrizione) || '—'}</div>
          <span style="display:inline-block;padding:4px 10px;background:${badgeBg};color:white;border-radius:999px;font-size:0.72rem;font-weight:700">${badgeLbl}</span>
        </div>
        <div style="font-size:0.82rem;color:#555;margin-bottom:6px">📅 ${fmtData(s.data_scadenza)}</div>
        ${s.note ? `<div style="font-size:0.88rem;color:#555;white-space:pre-wrap">${esc(s.note)}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button onclick="toggleScadenzaCantiere('${s.id}',${!s.completata})" title="${s.completata ? 'Riapri' : 'Segna come completata'}" style="background:transparent;border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:0.95rem;padding:4px 8px;line-height:1">${s.completata ? '↺' : '✓'}</button>
        <button onclick="eliminaScadenzaCantiere('${s.id}')" title="Elimina scadenza" style="background:transparent;border:none;cursor:pointer;font-size:1.1rem;color:#c0392b;padding:4px 6px;line-height:1">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

async function salvaScadenzaCantiere() {
  if (!cantiereAttivo) return;
  const descrizione = document.getElementById('scad-cant-titolo').value.trim();
  const data_scadenza = document.getElementById('scad-cant-data').value || null;
  if (!descrizione) { alert('Il titolo è obbligatorio.'); return; }
  if (!data_scadenza) { alert('La data scadenza è obbligatoria.'); return; }
  const note = document.getElementById('scad-cant-descrizione').value.trim() || null;
  const completata = document.getElementById('scad-cant-completata').checked;
  const { data: nuova, error } = await sb.from('cantiere_scadenze').insert({
    cantiere_id: cantiereAttivo, descrizione, data_scadenza, note, completata
  }).select().single();
  if (error) { alert('Errore: ' + error.message); return; }
  document.getElementById('scad-cant-titolo').value = '';
  const d = new Date(); d.setDate(d.getDate() + 7);
  document.getElementById('scad-cant-data').value = d.toISOString().slice(0, 10);
  document.getElementById('scad-cant-descrizione').value = '';
  document.getElementById('scad-cant-completata').checked = false;
  const msg = document.getElementById('scad-cant-msg');
  if (msg) { msg.textContent = '✅ Salvata'; msg.style.display = 'inline'; setTimeout(() => { msg.style.display = 'none'; }, 2000); }
  if (nuova) {
    scadenzeCantiereCache.push(nuova);
    sortScadenzeCantiere();
    renderScadenzeCantiere();
  }
}

async function toggleScadenzaCantiere(id, completata) {
  const { error } = await sb.from('cantiere_scadenze').update({ completata }).eq('id', id);
  if (error) { alert('Errore: ' + error.message); return; }
  const s = scadenzeCantiereCache.find(x => String(x.id) === String(id));
  if (s) s.completata = completata;
  sortScadenzeCantiere();
  renderScadenzeCantiere();
}

async function eliminaScadenzaCantiere(id) {
  if (!confirm('Eliminare questa scadenza?')) return;
  const { error } = await sb.from('cantiere_scadenze').delete().eq('id', id);
  if (error) { alert('Errore: ' + error.message); return; }
  scadenzeCantiereCache = scadenzeCantiereCache.filter(s => String(s.id) !== String(id));
  renderScadenzeCantiere();
}
