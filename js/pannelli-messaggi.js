/* ============================================================
   PANNELLI — MESSAGGI (chat con i clienti)
   Codice UGUALE nei tre pannelli (impresa, artigiano, professionisti).
   Si carica dallo STESSO punto in cui stava il blocco nella pagina,
   cosi' l'ordine di caricamento non cambia.
   Usa dalla pagina: sb, SUPABASE_URL, impresaCorrente, chatHdr.
   Le due variabili msgConversazioneAperta e msgRealtimeChannel
   vivono solo qui dentro.
   ============================================================ */
function msgEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

let msgConversazioneAperta = null;
let msgRealtimeChannel = null;

/* ⛔ 5 SETTEMBRE 2026 — LE CONVERSAZIONI TOLTE DALL'ELENCO.
   Non si cancella piu' niente: quello che l'impresa toglie finisce in
   `chat_nascoste` (impresa_id, conversation_id, quando) e da qui si salta.
   ⚠️ Si salta SOLO se dopo `quando` non e' arrivato nient'altro: se il
   cliente riscrive, la conversazione TORNA in elenco da sola. Se no
   l'impresa perderebbe un messaggio nuovo senza accorgersene, che e' peggio
   del problema che stiamo sistemando. */
async function leggiConversazioniNascoste() {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/chat_nascoste?impresa_id=eq.${impresaCorrente.id}&select=conversation_id,quando`, { headers: await chatHdr() });
    if (!r.ok) return {};                       // la tabella non c'e' ancora: si mostra tutto
    const righe = await r.json();
    const mappa = {};
    (Array.isArray(righe) ? righe : []).forEach(x => { mappa[x.conversation_id] = x.quando; });
    return mappa;
  } catch (e) { return {}; }                    // un errore non deve mai nascondere i messaggi
}

async function caricaListaConversazioniSilenziosa() {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/chat_messaggi?impresa_id=eq.${impresaCorrente.id}&order=created_at.desc`, { headers: await chatHdr() });
    const data = await r.json();
    const nascoste = await leggiConversazioniNascoste();
    renderListaConversazioni(Array.isArray(data) ? data : [], nascoste);
  } catch (e) { console.error(e); }
}

async function caricaConversazioni() {
  await caricaListaConversazioniSilenziosa();
  sottoscriviRealtimeMessaggi();
}

function renderListaConversazioni(rows, nascoste) {
  const lista = document.getElementById('lista-conversazioni');
  if (!lista) return;
  nascoste = nascoste || {};
  const gruppi = {};
  rows.forEach(m => { (gruppi[m.conversation_id] = gruppi[m.conversation_id] || []).push(m); });
  const conv = Object.keys(gruppi).map(convId => {
    const msgs = gruppi[convId]; // già ordinati desc
    const ultimo = msgs[0];
    const nonLetti = msgs.some(m => m.mittente === 'cliente' && m.letto === false);
    return { convId, ultimo, nonLetti };
  }).filter(c => {
    /* tolta dall'elenco? si salta, ma solo se non e' arrivato niente dopo */
    const quando = nascoste[c.convId];
    if (!quando) return true;
    const t = Date.parse(quando), u = Date.parse(c.ultimo && c.ultimo.created_at);
    if (isNaN(t) || isNaN(u)) return true;      // date illeggibili: si mostra
    return u > t;                               // il cliente ha riscritto: torna
  });
  if (!conv.length) {
    lista.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div>Nessun messaggio ricevuto</div>';
    return;
  }
  lista.innerHTML = '<div class="msg-conv-aiuto">Clicca su una conversazione per aprirla e rispondere</div>' + conv.map(c => `
    <div class="msg-conv-item" data-conv="${msgEsc(c.convId)}" data-nome="${msgEsc(c.ultimo.cliente_nome)}" data-email="${msgEsc(c.ultimo.cliente_email)}">
      <div class="msg-conv-sx">
        <div class="msg-conv-nome">${msgEsc(c.ultimo.cliente_nome || 'Cliente')}</div>
        <div class="msg-conv-ultimo">${msgEsc(c.ultimo.testo || '')}</div>
      </div>
      <div class="msg-conv-dx">
        ${c.nonLetti ? '<span class="msg-badge">nuovo</span>' : ''}
        <span class="msg-conv-apri">Apri e rispondi &rsaquo;</span>
      </div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', function () {
  const lista = document.getElementById('lista-conversazioni');
  if (lista) lista.addEventListener('click', function (e) {
    const item = e.target.closest('.msg-conv-item');
    if (!item) return;
    apriConversazione(item.dataset.conv, item.dataset.nome, item.dataset.email);
  });
});

function apriConversazione(convId, clienteNome, clienteEmail) {
  msgConversazioneAperta = { convId, clienteNome, clienteEmail };
  document.getElementById('lista-conversazioni').style.display = 'none';
  document.getElementById('chat-aperta').style.display = 'block';
  caricaMessaggiConversazione(convId);
  segnaMessaggiLetti(convId);
  aggiornaStatoBloccoCliente();
}

function tornaAConversazioni() {
  msgConversazioneAperta = null;
  document.getElementById('chat-aperta').style.display = 'none';
  document.getElementById('lista-conversazioni').style.display = 'block';
  caricaConversazioni();
}

/* ⛔ 5 SETTEMBRE 2026 — PRIMA QUESTO BOTTONE CANCELLAVA ANCHE LA COPIA DEL
   CLIENTE. Faceva `DELETE from chat_messaggi where conversation_id = ...`:
   le righe sparivano per tutti e due, e il cliente si ritrovava la
   conversazione vuota senza sapere perche'. Il 2 settembre il bottone del
   CLIENTE era gia' stato sistemato allo stesso modo; questo era rimasto.
   Adesso non si cancella niente: si scrive una riga in `chat_nascoste` e la
   conversazione sparisce solo da QUESTO elenco. */
async function togliConversazioneDalMioElenco() {
  if (!msgConversazioneAperta) return;
  if (!confirm('La conversazione sparisce dal tuo elenco. I messaggi NON vengono cancellati: il cliente conserva la sua copia, e se ti riscrive la conversazione torna qui. Vuoi continuare?')) return;
  const convId = msgConversazioneAperta.convId;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/chat_nascoste`, {
      method: 'POST',
      headers: await chatHdr({ 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify({ impresa_id: impresaCorrente.id, conversation_id: convId, quando: new Date().toISOString() })
    });
    if (!res.ok) {
      /* ⚠️ non si tace: prima un errore qui non si vedeva e la conversazione
         restava li' senza spiegazione */
      alert('Non sono riuscito a toglierla dall\'elenco. Riprova fra poco.');
      console.error('chat_nascoste fallita:', res.status, await res.text());
      return;
    }
    tornaAConversazioni();
  } catch (e) {
    alert('Non sono riuscito a toglierla dall\'elenco. Riprova fra poco.');
    console.error(e);
  }
}

function setBloccoBtn(bloccato) {
  const btn = document.getElementById('btn-blocco-cliente');
  if (!btn) return;
  btn.dataset.bloccato = bloccato ? '1' : '0';
  btn.textContent = bloccato ? '✓ Sblocca cliente' : '🚫 Blocca cliente';
  btn.style.background = bloccato ? '#2e537d' : '#c0392b';
}

async function aggiornaStatoBloccoCliente() {
  const btn = document.getElementById('btn-blocco-cliente');
  if (!btn || !msgConversazioneAperta) return;
  const email = msgConversazioneAperta.clienteEmail || '';
  if (!email) { setBloccoBtn(false); return; }
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/chat_bloccati?impresa_id=eq.${impresaCorrente.id}&cliente_email=eq.${encodeURIComponent(email)}`, { headers: await chatHdr() });
    const data = await r.json();
    setBloccoBtn(Array.isArray(data) && data.length > 0);
  } catch (e) { console.error(e); }
}

async function toggleBloccoCliente() {
  const btn = document.getElementById('btn-blocco-cliente');
  if (!btn || !msgConversazioneAperta) return;
  const email = msgConversazioneAperta.clienteEmail || '';
  if (!email) return;
  const bloccato = btn.dataset.bloccato === '1';
  try {
    if (!bloccato) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/chat_bloccati`, {
        method: 'POST',
        headers: await chatHdr({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
        body: JSON.stringify({ impresa_id: impresaCorrente.id, cliente_email: email })
      });
      if (!res.ok) { console.error('Blocco cliente fallito:', res.status, await res.text()); return; }
      setBloccoBtn(true);
    } else {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/chat_bloccati?impresa_id=eq.${impresaCorrente.id}&cliente_email=eq.${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: await chatHdr({ 'Prefer': 'return=minimal' })
      });
      if (!res.ok) { console.error('Sblocco cliente fallito:', res.status, await res.text()); return; }
      setBloccoBtn(false);
    }
  } catch (e) { console.error(e); }
}

function renderMessaggioChat(m) {
  const wrap = document.getElementById('msg-messages');
  if (!wrap) return;
  if (m.id != null && wrap.querySelector(`[data-msg-id="${m.id}"]`)) return;
  const isImpresa = m.mittente === 'impresa';
  const div = document.createElement('div');
  if (m.id != null) div.dataset.msgId = m.id;
  div.className = 'msg-bubble ' + (isImpresa ? 'msg-bubble-impresa' : 'msg-bubble-cliente');
  const ora = m.created_at ? new Date(m.created_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
  div.innerHTML = msgEsc(m.testo) + (ora ? `<div class="msg-bubble-meta">${ora}</div>` : '');
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

async function caricaMessaggiConversazione(convId) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/chat_messaggi?conversation_id=eq.${encodeURIComponent(convId)}&order=created_at.asc`, { headers: await chatHdr() });
    const data = await r.json();
    const arr = Array.isArray(data) ? data : [];
    // Ricava nome/email cliente dai messaggi già caricati (fallback ai data-* passati all'apertura)
    if (msgConversazioneAperta && msgConversazioneAperta.convId === convId) {
      const info = arr.find(m => m.cliente_nome || m.cliente_email);
      if (info) {
        if (!msgConversazioneAperta.clienteNome) msgConversazioneAperta.clienteNome = info.cliente_nome || '';
        if (!msgConversazioneAperta.clienteEmail) msgConversazioneAperta.clienteEmail = info.cliente_email || '';
      }
    }
    const wrap = document.getElementById('msg-messages');
    if (wrap) wrap.innerHTML = '';
    arr.forEach(renderMessaggioChat);
  } catch (e) { console.error(e); }
}

async function segnaMessaggiLetti(convId) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/chat_messaggi?conversation_id=eq.${encodeURIComponent(convId)}&mittente=eq.cliente&letto=eq.false`, {
      method: 'PATCH',
      headers: await chatHdr({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
      body: JSON.stringify({ letto: true })
    });
    aggiornaBadgeMessaggi();
  } catch (e) { console.error(e); }
}

async function aggiornaBadgeMessaggi() {
  const badge = document.getElementById('badge-msg-card');
  if (!badge || !impresaCorrente || !impresaCorrente.id) return;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/chat_messaggi?impresa_id=eq.${impresaCorrente.id}&mittente=eq.cliente&letto=eq.false&select=id`, { headers: await chatHdr() });
    const data = await r.json();
    const n = Array.isArray(data) ? data.length : 0;
    badge.textContent = n;
    badge.style.display = n > 0 ? 'inline-block' : 'none';
  } catch (e) { console.error(e); }
}

async function inviaMessaggioArtigiano() {
  if (!msgConversazioneAperta) return;
  const input = document.getElementById('msg-testo');
  const testo = input.value.trim();
  if (!testo) return;
  // Prende conversation_id e dati cliente dalla conversazione aperta (messaggi caricati o data-*)
  const convId = msgConversazioneAperta.convId;
  const clienteNome = msgConversazioneAperta.clienteNome || '';
  const clienteEmail = msgConversazioneAperta.clienteEmail || '';
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/chat_messaggi`, {
      method: 'POST',
      headers: await chatHdr({ 'Content-Type': 'application/json', 'Prefer': 'return=representation' }),
      body: JSON.stringify({
        conversation_id: convId,
        impresa_id: impresaCorrente.id,
        cliente_nome: clienteNome,
        cliente_email: clienteEmail,
        testo,
        mittente: 'impresa'
      })
    });
    if (!res.ok) { console.error('Invio messaggio fallito:', res.status, await res.text()); msgAvvisoInvio('Il messaggio non \u00e8 partito. Controlla la connessione e premi di nuovo Invia.'); return; }
    msgAvvisoInvio('');
    const rows = await res.json().catch(() => []);
    const nuovo = (Array.isArray(rows) && rows.length) ? rows[0] : { testo, mittente: 'impresa', created_at: new Date().toISOString() };
    renderMessaggioChat(nuovo);
    input.value = '';
    /* 26 set 2026 — l'email al cliente «ti ha risposto», col link per tornare
       nella chat. La funzione controlla da sola chi sei e ne manda al massimo
       una ogni 30 minuti. Se non parte, il messaggio c'e' comunque. */
    try {
      fetch('/.netlify/functions/chat-avviso', { method: 'POST', headers: await chatHdr({ 'Content-Type': 'application/json' }), body: JSON.stringify({ conv: convId }) }).catch(() => {});
    } catch (_) {}
  } catch (e) { console.error(e); msgAvvisoInvio('Il messaggio non \u00e8 partito. Controlla la connessione e premi di nuovo Invia.'); }
}

/* 26 set 2026 — prima un invio fallito non lo diceva a nessuno */
function msgAvvisoInvio(t) {
  let b = document.getElementById('msg-avviso-invio');
  if (!b) {
    const row = document.querySelector('#sec-messaggi .msg-input-row') || document.getElementById('msg-testo');
    if (!row || !row.parentNode) return;
    b = document.createElement('div'); b.id = 'msg-avviso-invio'; b.setAttribute('role', 'status');
    b.style.cssText = 'display:none;margin-top:10px;padding:12px 14px;border-radius:8px;background:#fdecea;color:#a61b1b;font-size:15px;font-weight:700';
    row.parentNode.insertBefore(b, row.nextSibling);
  }
  b.textContent = t || ''; b.style.display = t ? 'block' : 'none';
}
/* Invio manda il messaggio (prima non faceva niente) */
document.addEventListener('DOMContentLoaded', function () {
  const i = document.getElementById('msg-testo');
  if (i) i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); inviaMessaggioArtigiano(); } });
});

function sottoscriviRealtimeMessaggi() {
  if (msgRealtimeChannel) return;
  msgRealtimeChannel = sb.channel('chat_messaggi_impresa_' + impresaCorrente.id)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messaggi', filter: `impresa_id=eq.${impresaCorrente.id}` }, payload => {
      if (payload.eventType === 'INSERT' && msgConversazioneAperta && payload.new.conversation_id === msgConversazioneAperta.convId) {
        renderMessaggioChat(payload.new);
      }
      caricaListaConversazioniSilenziosa();
    })
    .subscribe();
}
