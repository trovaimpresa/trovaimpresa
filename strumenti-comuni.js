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
