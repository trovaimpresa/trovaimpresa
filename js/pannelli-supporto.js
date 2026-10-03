/* ============================================================
   PANNELLI — ANTEPRIMA PUBBLICA E ASSISTENZA
   Codice UGUALE nei tre pannelli (impresa, artigiano, professionisti):
   anteprima della scheda pubblica (computer/telefono) e chat di
   assistenza (messaggi, allegati, invio).
   Si carica PRIMA dello script grande della pagina.
   Usa dalla pagina: sb, impresaCorrente.
   ============================================================ */

// === ANTEPRIMA PUBBLICA: iframe del profilo pubblico dell'utente loggato ===
function caricaAnteprima() {
  if (!impresaCorrente || impresaCorrente.id == null) return;
  const url = 'profilo-impresa.html?id=' + encodeURIComponent(impresaCorrente.id);
  const ifr = document.getElementById('anteprima-iframe');
  if (ifr && ifr.getAttribute('src') !== url) ifr.src = url;
  const nt = document.getElementById('anteprima-newtab');
  if (nt) nt.href = url;
}
function ricaricaAnteprima() {
  const ifr = document.getElementById('anteprima-iframe');
  if (ifr && ifr.src) { ifr.src = ifr.src; } else { caricaAnteprima(); }
}
/* ⛔ 5 SETTEMBRE 2026 — PERCHE' QUI C'E' `width` E NON `max-width`.
   Il tasto «📱 Mobile» non faceva niente: la casella restava larga uguale.
   Non era colpa di questa funzione, che la sua riga la scriveva davvero
   (`style.maxWidth` diventava `390px`). Era `css/mobile.css`:

       @media (max-width: 768px) {
         body *:not(#cal-griglia):not(.calendar-header) {
           max-width: 100% !important;

   Quel `!important` batte anche lo stile scritto sull'elemento, quindi sotto
   i →768← px di finestra il `max-width` veniva annullato. Con `width` la
   regola non c'entra piu' e la casella diventa davvero →390← px; sul telefono
   vero (schermo piu' stretto di 390) resta comunque quel `max-width:100%` a
   impedire che esca dallo schermo.
   ⚠️ Misurato dal vivo prima di cambiare: con `max-width` →465← px, con
   `width` →390← px, a parita' di tutto. */
function anteprimaDevice(mode) {
  const wrap = document.getElementById('anteprima-frame-wrap');
  if (wrap) wrap.style.width = (mode === 'mobile') ? '390px' : '100%';
  const d = document.getElementById('anteprima-btn-desktop');
  const m = document.getElementById('anteprima-btn-mobile');
  if (d) { d.style.background = (mode === 'desktop') ? '#7c3aed' : '#f3f0fa'; d.style.color = (mode === 'desktop') ? '#fff' : '#7c3aed'; }
  if (m) { m.style.background = (mode === 'mobile') ? '#7c3aed' : '#f3f0fa'; m.style.color = (mode === 'mobile') ? '#fff' : '#7c3aed'; }
}

// === SUPPORTO: chat con TrovaImpresa (tabella supporto_messaggi) ===
let _supportoChan = null;
async function caricaSupporto() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  const box = document.getElementById('supporto-msgs');
  if (box) box.innerHTML = '';
  /* ⛔ 5 SETTEMBRE 2026 — quello che l'iscritto ha svuotato non si rivede
     QUI, ma non e' stato cancellato: l'assistenza conserva tutto. E se
     l'assistenza risponde dopo, la risposta si vede lo stesso. */
  let _daQuando = null;
  try {
    const { data: nas } = await sb.from('supporto_nascoste')
      .select('quando').eq('user_id', user.id).maybeSingle();
    if (nas && nas.quando) _daQuando = Date.parse(nas.quando);
  } catch (e) { _daQuando = null; }   /* un errore non deve nascondere niente */
  const { data } = await sb.from('supporto_messaggi')
    .select('*').eq('user_id', user.id).order('created_at', { ascending: true });
  (data || [])
    .filter(m => {
      if (_daQuando == null || isNaN(_daQuando)) return true;
      const t = Date.parse(m && m.created_at);
      return isNaN(t) ? true : t > _daQuando;
    })
    .forEach(renderSupportoMsg);
  scrollSupporto();
  sb.from('supporto_messaggi').update({ letto: true })
    .eq('user_id', user.id).eq('da_admin', true).eq('letto', false).then(function () {});
  if (!_supportoChan) {
    _supportoChan = sb.channel('supporto-' + user.id)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'supporto_messaggi', filter: 'user_id=eq.' + user.id },
        function (payload) { renderSupportoMsg(payload.new); scrollSupporto(); })
      .subscribe();
  }
}
function renderSupportoMsg(m) {
  const box = document.getElementById('supporto-msgs');
  if (!box || !m) return;
  const mine = !m.da_admin;
  const div = document.createElement('div');
  div.style.cssText = 'max-width:78%;padding:9px 13px;border-radius:12px;font-size:14px;line-height:1.4;white-space:pre-wrap;word-break:break-word;'
    + (mine ? 'align-self:flex-end;background:#0066ff;color:#fff' : 'align-self:flex-start;background:#fff;color:#111;border:1px solid var(--border)');
  div.textContent = m.messaggio || '';
  if (m.allegato) div.appendChild(supportoAllegatoEl(m));
  box.appendChild(div);
}

// 3 settembre 2026 — allegati: bucket privato «supporto-allegati», cartella <uid>/.
// Il link per vederlo e' firmato (vale un'ora) e si chiede al momento.
function supportoAllegatoEl(m) {
  const a = document.createElement('a');
  a.target = '_blank'; a.rel = 'noopener';
  a.style.cssText = 'display:block;margin-top:8px;color:inherit;font-weight:700;text-decoration:underline;font-size:15.5px';
  const img = /^image\//.test(m.allegato_tipo || '') || /\.(jpe?g|png|webp|gif|heic)$/i.test(m.allegato || '');
  a.textContent = img ? 'Carico la foto…' : (m.allegato_nome || 'allegato');
  sb.storage.from('supporto-allegati').createSignedUrl(m.allegato, 3600).then(function (r) {
    if (!r || !r.data || !r.data.signedUrl) { a.textContent = 'Allegato non leggibile'; return; }
    a.href = r.data.signedUrl;
    if (img) {
      a.textContent = '';
      const im = document.createElement('img');
      im.src = r.data.signedUrl; im.alt = m.allegato_nome || 'foto'; im.loading = 'lazy';
      im.style.cssText = 'display:block;max-width:100%;max-height:260px;border-radius:10px;border:1px solid rgba(0,0,0,.08);cursor:zoom-in';
      a.appendChild(im);
    }
  });
  return a;
}
let _supportoFile = null;
function supportoFileCambiato() {
  const i = document.getElementById('supporto-file');
  const f = i && i.files && i.files[0];
  const chip = document.getElementById('supporto-chip');
  if (!f) { _supportoFile = null; if (chip) { chip.hidden = true; chip.innerHTML = ''; } return; }
  if (!(/^image\//.test(f.type) || f.type === 'application/pdf')) { alert('Puoi allegare solo foto, screenshot o PDF'); i.value = ''; _supportoFile = null; return; }
  _supportoFile = f;
  if (chip) {
    chip.hidden = false;
    chip.innerHTML = '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>'
      + '<button type="button" onclick="supportoTogliFile()" title="Togli" style="font-size:18px;line-height:1;border:none;background:none;color:#5b6b80;cursor:pointer;padding:0 4px">×</button>';
    chip.querySelector('span').textContent = f.name;
  }
}
function supportoTogliFile() { const i = document.getElementById('supporto-file'); if (i) i.value = ''; supportoFileCambiato(); }
function scrollSupporto() {
  const box = document.getElementById('supporto-msgs');
  if (box) box.scrollTop = box.scrollHeight;
}
async function inviaSupporto() {
  const inp = document.getElementById('supporto-input');
  let txt = (inp && inp.value || '').trim();
  if (!txt && !_supportoFile) return;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { alert('Sessione scaduta, accedi di nuovo.'); return; }
  // l'allegato si carica PRIMA di scrivere la riga: se fallisce non parte niente
  let allegato = null, allegatoNome = null, allegatoTipo = null;
  if (_supportoFile) {
    const prep = window.preparaFileUpload ? await preparaFileUpload(_supportoFile, { lato: 1600, qualita: 0.8 }) : { file: _supportoFile, nome: _supportoFile.name };
    if (prep.errore) { alert(prep.errore); return; }
    const pulito = String(prep.nome || 'allegato').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80);
    const path = user.id + '/' + Date.now() + '-' + pulito;
    const tipo = (prep.file && prep.file.type) || _supportoFile.type || 'application/octet-stream';
    const up = await sb.storage.from('supporto-allegati').upload(path, prep.file, { contentType: tipo, upsert: false });
    if (up.error) { alert('Allegato non caricato: ' + up.error.message); return; }
    allegato = path; allegatoNome = _supportoFile.name; allegatoTipo = tipo;
    if (!txt) txt = /^image\//.test(tipo) ? 'Ti mando una foto' : 'Ti mando un file';
  }
  inp.value = '';
  const { error } = await sb.from('supporto_messaggi')
    .insert({ user_id: user.id, da_admin: false, messaggio: txt, letto: false,
              allegato: allegato, allegato_nome: allegatoNome, allegato_tipo: allegatoTipo });
  if (error) { alert('Errore invio: ' + error.message); inp.value = txt; return; }
  supportoTogliFile();
}
/* ⛔ 5 SETTEMBRE 2026 — PRIMA QUESTO BOTTONE CANCELLAVA ANCHE LA COPIA
   DELL'ASSISTENZA. Faceva `delete from supporto_messaggi where user_id = ...`:
   spariva tutto anche all'admin, che perdeva la richiesta E la risposta che
   aveva dato. Stesso difetto della chat coi clienti, altro tavolo.
   Adesso si segna solo fino a quando l'iscritto non vuole piu' vedere. */
async function svuotaSchermataSupporto() {
  if (!confirm('La schermata si svuota per te. I messaggi NON vengono cancellati: l\'assistenza conserva la sua copia, e se ti risponde la risposta la vedi lo stesso. Vuoi continuare?')) return;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { alert('Sessione scaduta, accedi di nuovo.'); return; }
  const { error } = await sb.from('supporto_nascoste')
    .upsert({ user_id: user.id, quando: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) { alert('Non sono riuscito a svuotarla. Riprova fra poco.'); return; }
  const box = document.getElementById('supporto-msgs');
  if (box) box.innerHTML = '';
}
