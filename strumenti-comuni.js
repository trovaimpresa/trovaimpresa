// strumenti-comuni.js — funzioni condivise tra i pannelli (artigiano, impresa, negozio, professionisti)
// Dipendenze attese (definite nello script inline di ogni pannello):
//   sb              — client Supabase (window.supabase.createClient)
//   impresaCorrente — record dell'attività loggata (serve .user_id)
//   showSection     — navigazione tra le sezioni del pannello

// AGENDA
function apriAgenda() {
  showSection('agenda');
  const dataInp = document.getElementById('ag-data');
  if (dataInp && !dataInp.value) dataInp.value = new Date().toISOString().slice(0, 10);
  caricaAppuntamenti();
}

function chiudiAgenda() {
  showSection('dashboard');
}

let appuntamentiCache = [];

async function caricaAppuntamenti() {
  const lista = document.getElementById('agenda-appuntamenti-lista');
  if (!lista || !impresaCorrente) return;
  const { data } = await sb.from('agenda_appuntamenti').select('*')
    .eq('user_id', impresaCorrente.user_id)
    .order('data', { ascending: true })
    .order('ora', { ascending: true });
  appuntamentiCache = data || [];
  renderAppuntamenti();
}

function renderAppuntamenti() {
  const lista = document.getElementById('agenda-appuntamenti-lista');
  if (!lista) return;
  const app = appuntamentiCache;
  if (!app.length) {
    lista.innerHTML = '<div style="color:#999;font-size:0.9rem;text-align:center;padding:18px">Nessun appuntamento ancora</div>';
    return;
  }
  const esc = s => (s == null ? '' : String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fmtData = d => {
    if (!d) return '—';
    const parts = new Date(d).toLocaleDateString('it-IT', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
    return parts.charAt(0).toUpperCase() + parts.slice(1);
  };
  const fmtOra = o => (o ? String(o).slice(0, 5) : null);
  lista.innerHTML = app.map(a => {
    const oraLbl = fmtOra(a.ora);
    const extraStyle = a.completato ? 'opacity:0.6' : '';
    return `<div style="border:1px solid var(--border);border-radius:12px;padding:14px 16px;background:white;display:flex;gap:14px;align-items:flex-start;justify-content:space-between;${extraStyle}">
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">
          <div style="font-family:'Playfair Display',serif;font-size:1.05rem;color:#1a3a2a;font-weight:700">${fmtData(a.data)}</div>
          ${oraLbl ? `<span style="display:inline-block;padding:4px 10px;background:#2a7a4b;color:white;border-radius:999px;font-size:0.72rem;font-weight:700">🕐 ${oraLbl}</span>` : ''}
        </div>
        <div style="font-weight:700;color:#1a3a2a;font-size:0.98rem;margin-bottom:6px${a.completato ? ';text-decoration:line-through' : ''}">${esc(a.titolo) || '—'}</div>
        ${a.cliente ? `<div style="font-size:0.85rem;color:#555;margin-bottom:2px">👤 ${esc(a.cliente)}</div>` : ''}
        ${a.luogo ? `<div style="font-size:0.85rem;color:#555;margin-bottom:2px">📍 ${esc(a.luogo)}</div>` : ''}
        ${a.note ? `<div style="font-size:0.88rem;color:#555;white-space:pre-wrap;margin-top:6px">${esc(a.note)}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button onclick="toggleAppuntamento('${a.id}',${!a.completato})" title="${a.completato ? 'Riapri' : 'Segna come completato'}" style="background:transparent;border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:0.95rem;padding:4px 8px;line-height:1">${a.completato ? '↺' : '✓'}</button>
        <button onclick="eliminaAppuntamento('${a.id}')" title="Elimina appuntamento" style="background:transparent;border:none;cursor:pointer;font-size:1.1rem;color:#c0392b;padding:4px 6px;line-height:1">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

async function salvaAppuntamento() {
  if (!impresaCorrente) return;
  const titolo = document.getElementById('ag-titolo').value.trim();
  const data = document.getElementById('ag-data').value || null;
  if (!titolo) { alert('Il titolo è obbligatorio.'); return; }
  if (!data) { alert('La data è obbligatoria.'); return; }
  const ora = document.getElementById('ag-ora').value || null;
  const cliente = document.getElementById('ag-cliente').value.trim() || null;
  const luogo = document.getElementById('ag-luogo').value.trim() || null;
  const note = document.getElementById('ag-note').value.trim() || null;
  const { data: nuovo, error } = await sb.from('agenda_appuntamenti').insert({
    user_id: impresaCorrente.user_id, titolo, data, ora, cliente, luogo, note, completato: false
  }).select().single();
  if (error) { alert('Errore: ' + error.message); return; }
  document.getElementById('ag-titolo').value = '';
  document.getElementById('ag-data').value = new Date().toISOString().slice(0, 10);
  document.getElementById('ag-ora').value = '';
  document.getElementById('ag-cliente').value = '';
  document.getElementById('ag-luogo').value = '';
  document.getElementById('ag-note').value = '';
  const msg = document.getElementById('ag-msg');
  if (msg) { msg.textContent = '✅ Salvato'; msg.style.display = 'inline'; setTimeout(() => { msg.style.display = 'none'; }, 2000); }
  if (nuovo) {
    appuntamentiCache.push(nuovo);
    appuntamentiCache.sort((a, b) =>
      String(a.data || '').localeCompare(String(b.data || '')) ||
      String(a.ora || '99:99').localeCompare(String(b.ora || '99:99')));
    renderAppuntamenti();
  }
}

async function toggleAppuntamento(id, completato) {
  const { error } = await sb.from('agenda_appuntamenti').update({ completato }).eq('id', id);
  if (error) { alert('Errore: ' + error.message); return; }
  const app = appuntamentiCache.find(a => String(a.id) === String(id));
  if (app) app.completato = completato;
  renderAppuntamenti();
}

async function eliminaAppuntamento(id) {
  if (!confirm('Eliminare questo appuntamento?')) return;
  const { error } = await sb.from('agenda_appuntamenti').delete().eq('id', id);
  if (error) { alert('Errore: ' + error.message); return; }
  appuntamentiCache = appuntamentiCache.filter(a => String(a.id) !== String(id));
  renderAppuntamenti();
}

// SCADENZE FISCALI
function apriModalScadenzeFiscali() {
  showSection('scadenze-fiscali');
  caricaScadenzeFiscali();
}

function chiudiModalScadenzeFiscali() {
  showSection('dashboard');
}

let scadenzeFiscaliCache = [];

function sortScadenzeFiscali() {
  scadenzeFiscaliCache.sort((a, b) =>
    (a.completata === b.completata ? 0 : (a.completata ? 1 : -1)) ||
    String(a.data_scadenza || '9999-12-31').localeCompare(String(b.data_scadenza || '9999-12-31')));
}

async function caricaScadenzeFiscali() {
  const lista = document.getElementById('scad-fisc-lista');
  if (!lista || !impresaCorrente) return;
  const { data } = await sb.from('scadenze_fiscali').select('*')
    .eq('user_id', impresaCorrente.user_id)
    .order('completata', { ascending: true })
    .order('data_scadenza', { ascending: true });
  scadenzeFiscaliCache = data || [];
  renderScadenzeFiscali();
}

function renderScadenzeFiscali() {
  const lista = document.getElementById('scad-fisc-lista');
  if (!lista) return;
  const scad = scadenzeFiscaliCache;
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
  const fmtImporto = n => (n == null) ? null : Number(n).toLocaleString('it-IT', { minimumFractionDigits:2, maximumFractionDigits:2 });
  const oggi = new Date(); oggi.setHours(0,0,0,0);
  lista.innerHTML = scad.map(s => {
    let badgeBg = '#888', badgeLbl = '—', extraStyle = '', strike = '';
    if (s.completata) {
      badgeBg = '#888'; badgeLbl = '✓ Completata';
      extraStyle = 'opacity:0.6';
      strike = ';text-decoration:line-through';
    } else if (s.data_scadenza) {
      const ds = new Date(s.data_scadenza); ds.setHours(0,0,0,0);
      const diffGg = Math.round((ds - oggi) / 86400000);
      if (diffGg < 0) { badgeBg = '#c0392b'; badgeLbl = `⚠️ Scaduta da ${Math.abs(diffGg)}g`; }
      else if (diffGg === 0) { badgeBg = '#c0392b'; badgeLbl = '🔥 Oggi'; }
      else if (diffGg <= 7) { badgeBg = '#e8733a'; badgeLbl = `⏰ Tra ${diffGg}g`; }
      else { badgeBg = '#2a7a4b'; badgeLbl = `📅 Tra ${diffGg}g`; }
    }
    const importoLbl = fmtImporto(s.importo);
    const ricorrenteBadge = s.ricorrente
      ? `<span style="display:inline-block;padding:3px 8px;background:#7c3aed;color:white;border-radius:999px;font-size:0.68rem;font-weight:700">🔁 ${esc(s.frequenza || 'ricorrente')}</span>`
      : '';
    return `<div style="border:1px solid var(--border);border-radius:12px;padding:14px 16px;background:white;display:flex;gap:12px;align-items:flex-start;${extraStyle}">
      <input type="checkbox" ${s.completata ? 'checked' : ''} onchange="toggleScadenzaFiscale('${s.id}',this.checked)" style="margin-top:4px;width:18px;height:18px;cursor:pointer;flex-shrink:0">
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
          <div style="font-weight:700;color:#1a3a2a;font-size:1rem${strike}">${esc(s.tipo) || '—'}</div>
          ${ricorrenteBadge}
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
          <div style="font-size:0.85rem;color:#555">📅 ${fmtData(s.data_scadenza)}</div>
          <span style="display:inline-block;padding:4px 10px;background:${badgeBg};color:white;border-radius:999px;font-size:0.72rem;font-weight:700">${badgeLbl}</span>
        </div>
        ${importoLbl ? `<div style="font-size:0.88rem;color:#555;margin-bottom:4px">💰 € ${importoLbl}</div>` : ''}
        ${s.descrizione ? `<div style="font-size:0.88rem;color:#555;margin-bottom:4px">${esc(s.descrizione)}</div>` : ''}
        ${s.note ? `<div style="font-size:0.88rem;color:#555;white-space:pre-wrap">${esc(s.note)}</div>` : ''}
      </div>
      <button onclick="eliminaScadenzaFiscale('${s.id}')" title="Elimina scadenza" style="background:transparent;border:none;cursor:pointer;font-size:1.1rem;color:#c0392b;padding:4px 6px;line-height:1">🗑️</button>
    </div>`;
  }).join('');
}

async function salvaScadenzaFiscale() {
  if (!impresaCorrente) return;
  const tipo = document.getElementById('scad-fisc-tipo').value;
  const data_scadenza = document.getElementById('scad-fisc-data').value || null;
  if (!tipo) { alert('Seleziona un tipo.'); return; }
  if (!data_scadenza) { alert('La data scadenza è obbligatoria.'); return; }
  const descrizione = document.getElementById('scad-fisc-descrizione').value.trim() || null;
  const importoRaw = document.getElementById('scad-fisc-importo').value;
  const importo = (importoRaw === '' || isNaN(Number(importoRaw))) ? null : Number(importoRaw);
  const ricorrente = document.getElementById('scad-fisc-ricorrente').checked;
  const frequenza = ricorrente ? document.getElementById('scad-fisc-frequenza').value : null;
  const note = document.getElementById('scad-fisc-note').value.trim() || null;
  const { data: nuova, error } = await sb.from('scadenze_fiscali').insert({
    user_id: impresaCorrente.user_id, tipo, descrizione, data_scadenza, importo, ricorrente, frequenza, note, completata: false
  }).select().single();
  if (error) { alert('Errore: ' + error.message); return; }
  document.getElementById('scad-fisc-tipo').value = '';
  document.getElementById('scad-fisc-data').value = '';
  document.getElementById('scad-fisc-descrizione').value = '';
  document.getElementById('scad-fisc-importo').value = '';
  document.getElementById('scad-fisc-ricorrente').checked = false;
  document.getElementById('scad-fisc-frequenza-row').style.display = 'none';
  document.getElementById('scad-fisc-frequenza').value = 'annuale';
  document.getElementById('scad-fisc-note').value = '';
  const msg = document.getElementById('scad-fisc-msg');
  if (msg) { msg.textContent = '✅ Salvata'; msg.style.display = 'inline'; setTimeout(() => { msg.style.display = 'none'; }, 2000); }
  if (nuova) {
    scadenzeFiscaliCache.push(nuova);
    sortScadenzeFiscali();
    renderScadenzeFiscali();
  }
}

async function toggleScadenzaFiscale(id, completata) {
  const { error } = await sb.from('scadenze_fiscali').update({ completata }).eq('id', id);
  if (error) { alert('Errore: ' + error.message); return; }
  const s = scadenzeFiscaliCache.find(x => String(x.id) === String(id));
  if (s) s.completata = completata;
  sortScadenzeFiscali();
  renderScadenzeFiscali();
}

async function eliminaScadenzaFiscale(id) {
  if (!confirm('Eliminare questa scadenza?')) return;
  const { error } = await sb.from('scadenze_fiscali').delete().eq('id', id);
  if (error) { alert('Errore: ' + error.message); return; }
  scadenzeFiscaliCache = scadenzeFiscaliCache.filter(s => String(s.id) !== String(id));
  renderScadenzeFiscali();
}

// PROMEMORIA
function apriPromemoria() {
  const oggi = new Date().toISOString().slice(0, 10);
  const dataInput = document.getElementById('promemoria-data');
  dataInput.min = oggi;
  dataInput.value = '';
  document.getElementById('promemoria-testo').value = '';
  showSection('promemoria');
  caricaPromemoria();
}

function chiudiPromemoria() {
  showSection('dashboard');
}

let promemoriaCache = [];

async function caricaPromemoria() {
  const lista = document.getElementById('promemoria-lista');
  if (!lista || !impresaCorrente) return;
  const { data } = await sb.from('promemoria').select('*')
    .eq('user_id', impresaCorrente.user_id)
    .order('data', { ascending: true });
  promemoriaCache = data || [];
  renderPromemoria();
}

function renderPromemoria() {
  const lista = document.getElementById('promemoria-lista');
  if (!lista) return;
  const items = promemoriaCache;
  if (!items.length) {
    lista.innerHTML = '<div style="color:#999;font-size:0.9rem;text-align:center;padding:18px">Nessun promemoria ancora</div>';
    return;
  }
  const esc = s => (s == null ? '' : String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fmtData = d => {
    if (!d) return '—';
    const parts = new Date(d).toLocaleDateString('it-IT', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
    return parts.charAt(0).toUpperCase() + parts.slice(1);
  };
  lista.innerHTML = items.map(p => {
    return `<div style="border:1px solid var(--border);border-radius:12px;padding:14px 16px;background:white;display:flex;gap:14px;align-items:flex-start;justify-content:space-between">
      <div style="flex:1;min-width:0">
        <div style="font-family:'Playfair Display',serif;font-size:1.05rem;color:#1a3a2a;font-weight:700;margin-bottom:6px">${fmtData(p.data)}</div>
        <div style="font-size:0.9rem;color:#555;white-space:pre-wrap">${esc(p.testo)}</div>
      </div>
      <button onclick="eliminaPromemoria('${p.id}')" title="Elimina promemoria" style="background:transparent;border:none;cursor:pointer;font-size:1.1rem;color:#c0392b;padding:4px 6px;line-height:1">🗑️</button>
    </div>`;
  }).join('');
}

async function eliminaPromemoria(id) {
  if (!confirm('Eliminare questo promemoria?')) return;
  const { error } = await sb.from('promemoria').delete().eq('id', id);
  if (error) { alert('Errore: ' + error.message); return; }
  promemoriaCache = promemoriaCache.filter(p => String(p.id) !== String(id));
  renderPromemoria();
}

async function salvaPromemoria() {
  const testo = document.getElementById('promemoria-testo').value.trim();
  const data = document.getElementById('promemoria-data').value;
  if (!testo) { alert('Scrivi il testo del promemoria.'); return; }
  if (!data) { alert('Seleziona una data.'); return; }
  const btn = document.getElementById('btn-salva-promemoria');
  btn.disabled = true;
  btn.textContent = '⏳ Salvataggio...';
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error('Utente non autenticato.');
    const { error } = await sb.from('promemoria').insert({ user_id: user.id, testo, data });
    if (error) throw error;
    if (document.getElementById('promemoria-lista')) {
      document.getElementById('promemoria-testo').value = '';
      document.getElementById('promemoria-data').value = '';
      await caricaPromemoria();
    } else {
      chiudiPromemoria();
      alert('Promemoria salvato!');
    }
  } catch (err) {
    alert('Errore durante il salvataggio: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salva';
  }
}
