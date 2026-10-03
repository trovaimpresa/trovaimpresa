/* ============================================================
   PANNELLI — CHAT CON AI DI ASSISTENZA
   Codice UGUALE nei tre pannelli (impresa, artigiano, professionisti):
   intestazioni, fumetti, svuotamento e invio delle domande alla chat con AI.
   Si carica PRIMA dello script grande della pagina.
   Usa dalla pagina: sb, impresaCorrente, esc e le altre funzioni comuni.
   ============================================================ */

/* ⛔ 21 agosto 2026 — L'AI DEVE SAPERE CHI LA STA CHIAMANDO.
   netlify/functions/ai-claude.js prima si fidava dell'impresa_id scritto
   qui nel browser: con l'id di un altro iscritto (che e' pubblico, la
   vetrina si legge senza account) si potevano bruciare le sue 30 chiamate
   al giorno e scrivergli righe nel pannello. Adesso la function ricava
   l'impresa dall'ACCESSO, e per farlo le serve il gettone della sessione.
   ⚠️ Se una chiamata nuova a ai-claude non passa da qui, torna indietro
   con 401 — ed e' giusto cosi'. */
async function _aiIntestazioni(){
  let token = '';
  try { const s = await sb.auth.getSession(); token = (s && s.data && s.data.session && s.data.session.access_token) || ''; } catch(e){}
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = 'Bearer ' + token;
  return h;
}

// --- CHAT: manda il token vero dell'utente loggato, non la chiave pubblica ---
async function chatHdr(extra){
  let tok = SUPABASE_KEY;
  try{
    const { data: { session } } = await sb.auth.getSession();
    if (session && session.access_token) tok = session.access_token;
  }catch(e){}
  return Object.assign({ 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + tok }, extra || {});
}

/* 6 settembre 2026 - «Chiedi all'AI» con le bolle, come «Scrivi a noi».
   ⚠️ L'AI NON si ricorda le domande di prima: le bolle restano a schermo, ma
   ogni domanda parte da zero. Farle ricordare la conversazione costa di piu'
   a ogni messaggio, ed e' una scelta da prendere a parte. */
function _aiBolla(testo, mia, html) {
  const box = document.getElementById('ai-msgs');
  if (!box) return null;
  const div = document.createElement('div');
  div.style.cssText = 'max-width:78%;padding:9px 13px;border-radius:12px;font-size:14px;line-height:1.4;white-space:pre-wrap;word-break:break-word;'
    + (mia ? 'align-self:flex-end;background:#0066ff;color:#fff'
           : 'align-self:flex-start;background:#fff;color:#111;border:1px solid var(--border)');
  if (html) { div.style.whiteSpace = 'normal'; div.innerHTML = testo; }
  else div.textContent = testo;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}

function svuotaChatAI() {
  const box = document.getElementById('ai-msgs');
  if (box) box.innerHTML = '';
}

async function chiediSupportoAI() {
  const casella = document.getElementById('ai-supporto-prompt');
  const btn = document.getElementById('btn-ai-supporto');
  const testo = (casella.value || '').trim();
  if (!testo) { casella.focus(); return; }
  if (!impresaCorrente || !impresaCorrente.id) {
    alert('Impresa non identificata. Ricarica la pagina.');
    return;
  }
  _aiBolla(testo, true, false);
  casella.value = '';
  const attesa = _aiBolla('Sto pensando…', false, false);
  btn.disabled = true;
  btn.style.opacity = '0.6';
  btn.style.cursor = 'not-allowed';

  function rispondi(t, html) {
    if (attesa) {
      if (html) { attesa.style.whiteSpace = 'normal'; attesa.innerHTML = t; }
      else attesa.textContent = t;
      const box = document.getElementById('ai-msgs');
      if (box) box.scrollTop = box.scrollHeight;
    }
  }

  const faqTesto = FAQS_LIST.map(f => `D: ${f.domanda}\nR: ${f.risposta}`).join('\n\n');
  const promptCompleto = `Rispondi basandoti su queste FAQ ufficiali di TrovaImpresa, non inventare funzioni o informazioni non presenti. Se la risposta non è nelle FAQ, dillo e invita a usare la linguetta «Scrivi a noi» qui sopra.\n\nFAQ UFFICIALI:\n${faqTesto}\n\nDOMANDA DELL'UTENTE:\n${testo}`;
  try {
    const resp = await fetch('/.netlify/functions/ai-claude', {
      method: 'POST',
      headers: await _aiIntestazioni(),
      body: JSON.stringify({
        azione: 'supporto',
        impresa_id: impresaCorrente.id,
        prompt: promptCompleto
      })
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      rispondi('Errore AI: ' + ((data && data.error) || resp.status), false);
      return;
    }
    if (data && data.risposta) {
      /* 22 agosto 2026 - prima qui si trasformava SOLO il grassetto, e i
         cancelletti dei titoli restavano a schermo. Adesso ci pensa
         js/testo-ai.js, che e' uno solo per tutti e quattro i pannelli.
         ⚠️ Se il file non si fosse caricato si torna al modo di prima,
         cosi' la risposta si legge lo stesso invece di sparire. */
      rispondi((typeof window.testoAI === 'function')
        ? window.testoAI(data.risposta)
        : escHtml(data.risposta).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'), true);
    } else {
      rispondi('Risposta vuota.', false);
    }
  } catch (e) {
    rispondi('Errore di rete: ' + (e && e.message ? e.message : e), false);
  } finally {
    btn.disabled = false;
    btn.style.opacity = '';
    btn.style.cursor = '';
    casella.focus();
  }
}

function escHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
