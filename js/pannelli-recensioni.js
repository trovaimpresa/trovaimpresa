/* ============================================================
   PANNELLI — RECENSIONI
   Codice UGUALE nei tre pannelli (impresa, artigiano, professionisti):
   sezione «Le tue recensioni» (elenco, risposta, modifica, rimozione)
   e finestra delle recensioni.
   Si carica PRIMA dello script grande della pagina.
   Usa dalla pagina: sb, impresaCorrente. Chiamata da showSection.
   ============================================================ */

// ===== LE TUE RECENSIONI (sezione) — 3 settembre 2026 =====
let _recCache = [];
async function caricaRecensioniSezione() {
  const box = document.getElementById('rec-lista');
  if (!box) return;
  if (!impresaCorrente) { box.innerHTML = '<div class="rec-vuoto">Accedi per vedere le recensioni.</div>'; return; }
  box.innerHTML = '<div class="rec-vuoto">Carico…</div>';
  const { data, error } = await sb.from('feedback_clienti').select('*')
    .eq('impresa_id', impresaCorrente.id).order('created_at', { ascending: false });
  if (error) { box.innerHTML = '<div class="rec-vuoto">Non riesco a leggere le recensioni: ' + recEsc(error.message) + '</div>'; return; }
  _recCache = data || [];
  disegnaRecensioniSezione();
}
function disegnaRecensioniSezione() {
  const box = document.getElementById('rec-lista');
  if (!box) return;
  if (!_recCache.length) {
    box.innerHTML = '<div class="rec-vuoto">Nessuna recensione ancora.<br>Le recensioni le scrivono i clienti dalla tua scheda pubblica: mandagli il link della scheda (lo trovi in «Anteprima del tuo pannello pubblico»).</div>';
    return;
  }
  box.innerHTML = _recCache.map(r => {
    const sub = [r.stelle_qualita, r.stelle_puntualita, r.stelle_prezzo, r.stelle_professionalita].filter(x => x != null);
    const voto = sub.length ? Math.round(sub.reduce((a, b) => a + b, 0) / sub.length) : 0;
    const data = r.created_at ? new Date(r.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const stelle = '★'.repeat(voto) + '☆'.repeat(5 - voto);
    const bolli = (r.verificata ? '<span class="rec-bollo ok">✅ Verificata</span>' : '')
      + (r.confermata === false ? '<span class="rec-bollo attesa">In attesa di conferma del cliente</span>' : '');
    let risposta;
    if (r._modifica || !r.risposta_impresa) {
      const quando = r.risposta_impresa ? '' : '';
      risposta = '<div class="rec-risp">'
        + '<div class="rec-risp-tit">' + (r.risposta_impresa ? 'Correggi la tua risposta a ' : 'Vuoi rispondere a ') + (recEsc(r.nome_cliente) || 'questo cliente') + '?<small>facoltativo · la vedono tutti sotto la sua recensione</small></div>'
        + '<textarea class="rec-ta" id="rec-ta-' + r.id + '" maxlength="1000" placeholder="Es. Grazie Marco, è stato un piacere lavorare a casa tua.">' + recEsc(r.risposta_impresa || '') + '</textarea>'
        + '<div class="rec-azioni">'
        + '<button type="button" class="rec-btn blu" onclick="salvaRispostaRecensione(' + r.id + ')">Pubblica risposta</button>'
        + (r.risposta_impresa ? '<button type="button" class="rec-btn" onclick="annullaModificaRisposta(' + r.id + ')">Annulla</button>' : '')
        + '<span class="rec-conta"><span id="rec-cnt-' + r.id + '">' + (r.risposta_impresa || '').length + '</span>/1000</span>'
        + '</div></div>';
    } else {
      const q = r.risposta_il ? new Date(r.risposta_il).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      risposta = '<div class="rec-risp">'
        + '<div class="rec-risp-tit">La tua risposta a ' + (recEsc(r.nome_cliente) || 'questo cliente') + (q ? '<small>' + q + '</small>' : '') + '</div>'
        + '<div class="rec-risp-testo">' + recEsc(r.risposta_impresa) + '</div>'
        + '<div class="rec-azioni">'
        + '<button type="button" class="rec-btn" onclick="modificaRispostaRecensione(' + r.id + ')">Correggi</button>'
        + '<button type="button" class="rec-btn rosso" onclick="togliRispostaRecensione(' + r.id + ')">Togli la risposta</button>'
        + '</div></div>';
    }
    return '<div class="rec-card" id="rec-card-' + r.id + '">'
      + '<div class="rec-testa"><span class="rec-nome">' + (recEsc(r.nome_cliente) || 'Cliente') + '</span>' + bolli + '<span class="rec-data">' + data + '</span></div>'
      + '<div class="rec-stelle">' + stelle + '</div>'
      + '<p class="rec-testo">' + recEsc(r.testo) + '</p>'
      + risposta + '</div>';
  }).join('');
  _recCache.forEach(r => {
    const ta = document.getElementById('rec-ta-' + r.id);
    if (ta) ta.addEventListener('input', () => { const c = document.getElementById('rec-cnt-' + r.id); if (c) c.textContent = ta.value.length; });
  });
}
function _recTrova(id) { return _recCache.find(x => String(x.id) === String(id)); }
function modificaRispostaRecensione(id) { const r = _recTrova(id); if (r) { r._modifica = true; disegnaRecensioniSezione(); } }
function annullaModificaRisposta(id) { const r = _recTrova(id); if (r) { r._modifica = false; disegnaRecensioniSezione(); } }
async function salvaRispostaRecensione(id) {
  const ta = document.getElementById('rec-ta-' + id);
  const testo = (ta ? ta.value : '').trim();
  if (!testo) { alert('Scrivi la risposta prima di pubblicarla.'); return; }
  await _recScrivi(id, testo, 'Risposta pubblicata: da adesso si vede sulla tua scheda.');
}
async function togliRispostaRecensione(id) {
  if (!confirm('Togliere la tua risposta? La recensione del cliente resta.')) return;
  await _recScrivi(id, '', 'Risposta tolta.');
}
async function _recScrivi(id, testo, msgOk) {
  const card = document.getElementById('rec-card-' + id);
  card && card.querySelectorAll('button').forEach(b => b.disabled = true);
  /* la scrittura passa dalla funzione del database: controlla che la recensione
     sia tua e non lascia toccare stelle e testo del cliente */
  const { data, error } = await sb.rpc('rispondi_recensione', { p_id: Number(id), p_testo: testo });
  if (error || !data || !data.length) {
    card && card.querySelectorAll('button').forEach(b => b.disabled = false);
    alert('Non salvata: ' + (error ? error.message : 'il database non ha scritto niente. Riprova.'));
    return;
  }
  const r = _recTrova(id);
  if (r) { r.risposta_impresa = data[0].risposta_impresa; r.risposta_il = data[0].risposta_il; r._modifica = false; }
  disegnaRecensioniSezione();
  if (typeof showToast === 'function') showToast(msgOk); else if (typeof toast === 'function') toast(msgOk);
}

async function apriModalRecensioni() {
  if(!impresaCorrente)return;
  const{data:recensioni}=await sb.from('feedback_clienti').select('*').eq('impresa_id',impresaCorrente.id).order('created_at',{ascending:false});
  document.body.insertAdjacentHTML('beforeend',renderModalRecensioni(recensioni||[]));
}
function recEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]})}
function renderModalRecensioni(recensioni) {
  let h='<div id="modalRecensioniOverlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px" onclick="document.getElementById(\'modalRecensioniOverlay\').remove()">';
  h+='<div style="background:white;border-radius:16px;padding:24px;max-width:560px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 4px 24px rgba(0,0,0,0.2)" onclick="event.stopPropagation()">';
  h+='<h2 style="margin:0 0 16px">⭐ Le tue recensioni</h2>';
  if(!recensioni.length){
    h+='<div style="background:#f9f9f9;border-radius:8px;padding:24px;text-align:center;color:#888">Nessuna recensione ancora</div>';
  } else {
    for(const r of recensioni){
      const sub=[r.stelle_qualita,r.stelle_puntualita,r.stelle_prezzo,r.stelle_professionalita].filter(s=>s!=null);
      const voto=sub.length?Math.round(sub.reduce((a,b)=>a+b,0)/sub.length):0;
      const data=r.created_at?new Date(r.created_at).toLocaleDateString('it-IT'):'';
      const stelle='★'.repeat(voto)+'☆'.repeat(5-voto);
      const bollino = r.verificata ? '<span style="display:inline-block;background:#e6f6ec;color:#1b8a3f;font-weight:800;font-size:15px;padding:3px 10px;border-radius:999px;margin-left:8px">✅ Verificata</span>' : '';
      const attesa  = (r.confermata === false) ? '<span style="display:inline-block;background:#fff3e0;color:#b26a00;font-weight:800;font-size:15px;padding:3px 10px;border-radius:999px;margin-left:8px">In attesa di conferma del cliente</span>' : '';
      h+='<div style="border:1px solid #eee;border-radius:8px;padding:12px;margin-bottom:10px">';
      h+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><strong>${recEsc(r.nome_cliente)||'Cliente'}</strong>${bollino}${attesa}<span style="font-size:15px;color:#888">${data}</span></div>`;
      h+=`<div style="color:#f5b50a;font-size:14px;margin-bottom:6px">${stelle}</div>`;
      h+=`<div style="color:#444;font-size:14px">${recEsc(r.testo)}</div>`;
      h+='</div>';
    }
  }
  h+='<button onclick="document.getElementById(\'modalRecensioniOverlay\').remove()" style="background:transparent;border:1px solid #ddd;padding:10px 16px;border-radius:8px;cursor:pointer;width:100%;margin-top:8px">Chiudi</button>';
  h+='</div></div>';
  return h;
}
