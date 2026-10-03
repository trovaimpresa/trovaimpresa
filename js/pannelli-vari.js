/* ============================================================
   PANNELLI — FINESTRE E SEZIONI VARIE
   Codice UGUALE nei tre pannelli (impresa, artigiano, professionisti):
   accesso a due passaggi (MFA), certificazioni, segnalazione, visibilita e priorita, lista d'attesa, FAQ, supporto e finestre di chiusura.
   Si carica PRIMA dello script grande della pagina.
   Usa dalla pagina: sb, impresaCorrente, esc e le altre funzioni comuni.
   ============================================================ */

// =====================
// 2FA (TOTP)
// =====================
let mfa2faFactorId = null;

let mfa2faChallengeId = null;

async function avviaMFA(e) {
  e.preventDefault();
  mfaShowAlert('', '');
  document.getElementById('mfa-code').value = '';
  document.getElementById('mfa-overlay').classList.add('open');
  document.getElementById('mfa-btn').disabled = true;
  document.getElementById('mfa-btn').textContent = '⏳ Caricamento...';

  const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp' });
  if (error) {
    mfaShowAlert('Errore: ' + error.message, 'error');
    document.getElementById('mfa-btn').textContent = '✅ Attiva 2FA';
    return;
  }
  mfa2faFactorId = data.id;

  // Mostra QR code (SVG fornito da Supabase)
  document.getElementById('mfa-qr-wrap').innerHTML = data.totp.qr_code;
  document.getElementById('mfa-secret').textContent = 'Codice manuale: ' + data.totp.secret;
  document.getElementById('mfa-btn').disabled = false;
  document.getElementById('mfa-btn').textContent = '✅ Attiva 2FA';

  // Avvia subito la challenge
  const { data: ch, error: chErr } = await sb.auth.mfa.challenge({ factorId: mfa2faFactorId });
  if (chErr) { mfaShowAlert('Errore challenge: ' + chErr.message, 'error'); return; }
  mfa2faChallengeId = ch.id;
}

async function confermaMFA() {
  const code = document.getElementById('mfa-code').value.trim();
  if (code.length !== 6) { mfaShowAlert('Inserisci un codice a 6 cifre.', 'error'); return; }
  const btn = document.getElementById('mfa-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Verifica...';
  mfaShowAlert('', '');

  const { error } = await sb.auth.mfa.verify({
    factorId: mfa2faFactorId,
    challengeId: mfa2faChallengeId,
    code
  });

  if (error) {
    mfaShowAlert('❌ Codice non valido o scaduto. Riprova.', 'error');
    btn.disabled = false;
    btn.textContent = '✅ Attiva 2FA';
    return;
  }

  mfaShowAlert('✅ 2FA attivato con successo!', 'success');
  btn.style.display = 'none';
  document.getElementById('mfa-qr-wrap').style.display = 'none';
  document.getElementById('mfa-secret').style.display = 'none';
  document.querySelector('#mfa-step-qr p').style.display = 'none';
  document.getElementById('mfa-code').style.display = 'none';
  document.getElementById('mfa-title').textContent = '🔐 2FA attivato!';
  document.getElementById('mfa-desc').textContent = 'Da ora ti verrà chiesto il codice ad ogni accesso.';
  setTimeout(chiudiMFA, 2500);
}

function chiudiMFA() {
  document.getElementById('mfa-overlay').classList.remove('open');
}

function mfaShowAlert(msg, type) {
  const box = document.getElementById('mfa-alert-box');
  if (!msg) { box.style.display = 'none'; return; }
  box.className = 'mfa-alert mfa-alert-' + type;
  box.textContent = msg;
  box.style.display = 'block';
}

function toggleFullscreen(btn) {
  const modal = btn.closest('.modal-ai');
  modal.classList.toggle('fullscreen');
  btn.textContent = modal.classList.contains('fullscreen') ? '⊟' : '⛶';
}

/* 6 settembre 2026 - le tre linguette di «Parla con TrovaImpresa».
   Prima erano due card separate nel pannello: «Risoluzione problemi» (le
   domande + l'assistente AI) e «Parla subito con TrovaImpresa» (la chat).
   Misurato prima di unirle: la chat l'avevano usata 3 imprese vere,
   l'assistente AI 1 sola volta, e il modulo «Scrivi all'assistenza» MAI
   nessuno. Adesso sono un posto solo, e si sceglie con un bottone. */
function mostraPezzoSupporto(quale, el){
  ['domande','ai','chat'].forEach(function(n){
    var p = document.getElementById('sup-' + n);
    if(p) p.classList.toggle('on', n === quale);
  });
  document.querySelectorAll('.sup-ling button').forEach(function(b){
    b.classList.toggle('on', b.getAttribute('data-sup') === quale);
  });
  /* se non arriva il bottone (chiamata da codice) si accende quello giusto */
  if(!el){
    var b = document.querySelector('.sup-ling button[data-sup="' + quale + '"]');
    if(b) b.classList.add('on');
  }
}

function apriModalRisoluzione() {
  const lista = document.getElementById('faq-list');
  if (!lista) return;
  lista.innerHTML = FAQS_LIST.map(f => `
    <div class="faq-item">
      <div class="faq-domanda" onclick="toggleFaq(this)">${f.domanda}</div>
      <div class="faq-risposta">${f.risposta}</div>
    </div>
  `).join('');
}

/* --- Lista d'attesa pubblicità --- */
async function apriModalListaAttesaPub() {
  const ris = document.getElementById('lap-risultato');
  ris.style.display = 'none';
  ris.innerHTML = '';
  document.getElementById('modalListaAttesaPub').classList.add('show');

  // Carica le righe attive (attesa/offerto) dell'azienda loggata
  const { data, error } = await sb.from('lista_attesa_pubblicita')
    .select('citta, stato, created_at, offerta_scadenza')
    .eq('impresa_id', impresaCorrente.id)
    .in('stato', ['attesa', 'offerto'])
    .order('created_at', { ascending: true });

  if (error || !data || data.length === 0) {
    ris.textContent = "Non sei in lista d'attesa. Per iscriverti vai su Pubblicità quando lo spazio che vuoi è occupato.";
    ris.style.display = '';
    return;
  }

  // 'offerto' ha priorità: spazio riservato all'azienda
  const offerto = data.find(r => r.stato === 'offerto');
  if (offerto) {
    let scad = '';
    if (offerto.offerta_scadenza) {
      const [g, m, a] = String(offerto.offerta_scadenza).split('/');
      const d = new Date(`${a}-${m}-${g}`);
      scad = isNaN(d) ? String(offerto.offerta_scadenza) : d.toLocaleDateString('it-IT');
    }
    ris.innerHTML = `Si è liberato uno spazio a ${escHtml(offerto.citta)}! È tuo fino al ${escHtml(scad)}. Vuoi prenotarlo?` +
      `<div style="margin-top:14px;"><a href="pubblicita.html" class="btn-salva-annuncio" style="display:inline-block;text-decoration:none;">🛒 Acquista</a></div>`;
    ris.style.display = '';
    return;
  }

  // 'attesa': posizione = n. aziende in attesa per quella città con created_at <= la sua
  const inAttesa = data.find(r => r.stato === 'attesa');
  const { count } = await sb.from('lista_attesa_pubblicita')
    .select('id', { count: 'exact', head: true })
    .ilike('citta', inAttesa.citta)
    .eq('stato', 'attesa')
    .lte('created_at', inAttesa.created_at);
  ris.textContent = `Sei in posizione n° ${count || 1} per ${inAttesa.citta}`;
  ris.style.display = '';
}

function chiudiModalListaAttesaPub() {
  document.getElementById('modalListaAttesaPub').classList.remove('show');
}

function toggleFaq(headerEl) {
  headerEl.parentElement.classList.toggle('open');
}

/* ⛔ 30 agosto 2026 — IL NOME DELL'IMPRESA, IN UN POSTO SOLO.
   Nella tabella `imprese` la colonna `cognome` NON ESISTE (controllato sul
   database). Il pannello scriveva `nome_attivita || nome + ' ' + cognome`:
   per chi non ha il nome dell'attivita' usciva «Spazio Giardino undefined».
   Sono →4← imprese vere (→54←, →55←, →59←, →60←), e la stessa riga finiva
   dentro il PREVENTIVO mandato al cliente.
   La regola e' la stessa della scheda pubblica e delle pagine di ricerca:
   prima il nome dell'attivita', se non c'e' quello della persona.
   ⚠️ E' una `function` e non una `const` apposta: cosi' si puo' usare anche
   sopra la riga in cui e' scritta, senza fermare tutta la pagina. */
function _nomeImpresa(x) {
  return String((x && x.nome_attivita) || '').trim()
      || String((x && x.nome) || '').trim();
}

// =====================
// LOGO & COLORE HEADER
// =====================
/* La copertina si cambia dal bottone con la macchina fotografica, senza
   passare da «Personalizza». Stesso secchio e stesso percorso del banner
   salvato di la' (`banner-personalizzati/<user_id>/banner.<ext>`), cosi' i due
   posti restano d'accordo. */
// Logo e Contatti: il codice e' in /js/pannelli-contatti.js
function chiudiModalContatti() {
  document.getElementById('modal-contatti').classList.remove('show');
}

// =====================
// CERTIFICAZIONI
// =====================
async function caricaCertificazioni() {
  const { data } = await sb.from('imprese').select('certificazioni').eq('id', impresaCorrente.id).single();
  const certs = data?.certificazioni || [];
  impresaCorrente.certificazioni = certs;
  renderCertificazioni(certs);
}

/* ⛔ 30 agosto 2026 — LA SCADENZA SCRITTA ALL'AMERICANA.
   Qui la data usciva com'e' scritta nel database: «2027-12-31». Un
   artigiano legge 31/12/2027.
   ⚠️ NON si usa `new Date(iso).toLocaleDateString`: una data senza ora
   viene letta come mezzanotte di Greenwich, e in un fuso indietro
   rispetto a Londra diventerebbe il giorno prima. Qui c'e' solo una
   data, quindi si spezza la stringa e basta: non puo' sbagliare.
   (`fmtData` in strumenti-cantiere.js usa l'altra strada: in Italia va
   sempre bene, ma e' la stessa trappola addormentata.) */
function _dataIt(iso) {
  var p = String(iso || '').slice(0, 10).split('-');
  if (p.length !== 3 || p[0].length !== 4) return iso || '';
  return p[2] + '/' + p[1] + '/' + p[0];
}

function renderCertificazioni(certs) {
  const container = document.getElementById('lista-certificazioni');
  if (!container) return;
  if (!certs.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📜</div>Nessuna certificazione aggiunta.</div>';
    return;
  }
  container.innerHTML = certs.map((c, i) => `
    <div class="cert-item">
      <div>
        <div class="cert-nome">${c.nome}</div>
        <div class="cert-meta">${c.scadenza ? '📅 Scade: ' + _dataIt(c.scadenza) : ''}${c.file_url ? (c.scadenza ? ' · ' : '') + '<a href="' + c.file_url + '" target="_blank" style="color:var(--verde);font-weight:700;">📎 Visualizza file</a>' : ''}</div>
      </div>
      <button class="btn-az arancio" style="padding:10px 16px;font-size:0.82rem;" onclick="eliminaCertificazione(${i})">🗑️ Rimuovi</button>
    </div>
  `).join('');
}

async function eliminaCertificazione(index) {
  if (!confirm('Rimuovere questa certificazione?')) return;
  const certs = [...(impresaCorrente.certificazioni || [])];
  certs.splice(index, 1);
  const { error } = await sb.from('imprese').update({ certificazioni: certs }).eq('id', impresaCorrente.id);
  if (error) { alert('Errore: ' + error.message); return; }
  impresaCorrente.certificazioni = certs;
  renderCertificazioni(certs);
}

function apriModalSegnalazione() {
  document.getElementById('segnalazione-testo').value = '';
  document.getElementById('segnalazione-form').style.display = '';
  document.getElementById('segnalazione-success').style.display = 'none';
  const btn = document.getElementById('btn-invia-segnalazione');
  btn.disabled = false;
  btn.textContent = 'Invia';
  document.getElementById('modal-segnalazione').classList.add('show');
}

function chiudiModalSegnalazione() {
  document.getElementById('modal-segnalazione').classList.remove('show');
}

function chiudiModalPriorita() {
  document.getElementById('modalPriorita').classList.remove('show');
}

function aggiornaCardVisibile(piano) {
  const card = document.getElementById('card-visibile');
  const icon = document.getElementById('card-visibile-icon');
  const label = document.getElementById('card-visibile-label');
  if (!card || !icon || !label) return;
  if (piano === 'premium') {
    card.style.borderTopColor = '#7c3aed';
    icon.textContent = '🌍';
    label.textContent = 'Visibile in tutta la regione';
  } else {
    card.style.borderTopColor = '#0066ff';
    icon.textContent = '📍';
    label.textContent = 'Visibile nella tua città';
  }
}

function ctaPremium(d,piuUtenti) {
  return `<p style="color:#666;font-size:14px">Senza il Gestionale saresti visibile solo a ${d.citta} (${d.nCitta} utenti). Stai raggiungendo <strong>${piuUtenti} utenti in più</strong> perché sei in evidenza.</p><button onclick="window.location.href='${d.cercaPage}?regione=${encodeURIComponent(d.regione)}'" style="background:#7c3aed;color:white;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;width:100%;margin-top:8px;font-weight:600">Vedi come ti vedono</button>`;
}

function ctaFree(d,piuUtenti) {
  return `<p style="color:#666;font-size:14px">Con il Gestionale saresti visibile in tutta ${d.regione} (${d.nRegione} utenti, <strong>${piuUtenti} in più</strong>).</p><button onclick="window.location.href='prezzi.html'" style="background:#0066ff;color:white;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;width:100%;margin-top:8px;font-weight:600">Attiva il Gestionale</button>`;
}

// Recensioni: il codice e' in /js/pannelli-recensioni.js
function renderModalVisibile(d) {
  const titolo=d.isPremium?'🌍 Visibile in tutta la regione':'📍 Visibile nella tua città';
  const bgBox=d.isPremium?'#e8f5e9':'#fff3e0';
  const colorBox=d.isPremium?'#2e537d':'#e65100';
  const numero=d.isPremium?d.nRegione:d.nCitta;
  const dove=d.isPremium?'utenti in tutta la regione '+d.regione:'utenti a '+d.citta;
  const piuUtenti=d.nRegione-d.nCitta;
  let h='<div id="modalVisibileOverlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px" onclick="document.getElementById(\'modalVisibileOverlay\').remove()">';
  h+='<div style="background:white;border-radius:16px;padding:24px;max-width:500px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.2)" onclick="event.stopPropagation()">';
  h+=`<h2 style="margin:0 0 16px">${titolo}</h2>`;
  h+=`<div style="background:${bgBox};padding:16px;border-radius:8px;margin-bottom:16px">`;
  h+=`<strong style="color:${colorBox}">✓ ATTIVO</strong>`;
  h+=`<p style="margin:8px 0 0">Stai raggiungendo <strong>${numero}</strong> ${dove}.</p>`;
  h+='</div>';
  h+=d.isPremium?ctaPremium(d,piuUtenti):ctaFree(d,piuUtenti);
  h+='<button onclick="document.getElementById(\'modalVisibileOverlay\').remove()" style="background:transparent;border:1px solid #ddd;padding:10px 16px;border-radius:8px;cursor:pointer;width:100%;margin-top:8px">Chiudi</button>';
  h+='</div></div>';
  return h;
}
