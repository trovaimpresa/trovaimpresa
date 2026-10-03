/* ============================================================
   PANNELLI COMUNI — codice che e' UGUALE nei tre pannelli
   (pannello-impresa, pannello-artigiano, pannello-professionisti).
   Si carica con un tag normale, PRIMA dello script grande della
   pagina, cosi' usa le stesse sb e impresaCorrente della pagina.
   Regola: qui dentro entra SOLO codice identico nei tre pannelli.
   Se un pannello ha bisogno di una versione diversa, la funzione
   resta nella sua pagina.
   ============================================================ */

// NOTE PERSONALI
async function caricaNote() {
  const { data } = await sb.from('note_personali').select('*')
    .eq('impresa_id', impresaCorrente.id)
    .order('created_at', { ascending: false });
  const container = document.getElementById('lista-note');
  if (!container) return;
  const lista = data || [];
  if (!lista.length) {
    container.innerHTML = '<div style="font-size:15px;color:#888;text-align:center;padding:6px">Nessuna nota</div>';
    return;
  }
  container.innerHTML = lista.map(n => {
    const testoSafe = (n.testo || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const dataFmt = new Date(n.created_at).toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
    return `
    <div style="background:#fffbea;border:1px solid #f0e3a0;border-radius:8px;padding:8px 10px;position:relative;font-size:0.82rem;color:#1a1a1a;line-height:1.4">
      <button onclick="eliminaNota('${n.id}')" title="Elimina nota" style="position:absolute;top:4px;right:4px;background:transparent;border:none;cursor:pointer;font-size:0.9rem;color:#c0392b;padding:2px 4px;line-height:1">🗑️</button>
      <div style="white-space:pre-wrap;word-break:break-word;margin-right:20px">${testoSafe}</div>
      <div style="font-size:15px;color:#888;margin-top:4px">${dataFmt}</div>
    </div>`;
  }).join('');
}

async function aggiungiNota() {
  const ta = document.getElementById('widget-note');
  if (!ta) return;
  const testo = ta.value.trim();
  if (!testo) return;
  const { error } = await sb.from('note_personali').insert({ impresa_id: impresaCorrente.id, testo });
  if (error) { alert('Errore: ' + error.message); return; }
  ta.value = '';
  await caricaNote();
}

async function eliminaNota(id) {
  if (!confirm('Eliminare questa nota?')) return;
  const { error } = await sb.from('note_personali').delete().eq('id', id);
  if (error) { alert('Errore: ' + error.message); return; }
  await caricaNote();
}
