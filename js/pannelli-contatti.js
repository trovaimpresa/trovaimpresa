/* ============================================================
   PANNELLI — LOGO E CONTATTI
   Codice UGUALE nei tre pannelli (impresa, artigiano, professionisti):
   caricamento di copertina e logo, numero «contatti» in alto e
   finestra con l'elenco dei contatti.
   Si carica PRIMA dello script grande della pagina.
   Usa dalla pagina: sb, impresaCorrente, esc.
   ============================================================ */

async function caricaCopertina(event) {
  const file = event.target.files[0];
  if (!file || !impresaCorrente) return;
  const prep = await preparaFileUpload(file, { lato: 1600, qualita: 0.85, formato: 'webp' });
  if (prep.errore) { alert(prep.errore); return; }
  const path = `${impresaCorrente.user_id}/banner.${prep.compressa ? 'webp' : 'png'}`;
  const { error: upErr } = await sb.storage.from('banner-personalizzati')
    .upload(path, prep.file, { upsert: true, contentType: prep.compressa ? 'image/webp' : file.type, cacheControl: '31536000' });
  if (upErr) { alert('Errore caricamento copertina: ' + upErr.message); return; }
  const { data: pub } = sb.storage.from('banner-personalizzati').getPublicUrl(path);
  const url = pub.publicUrl + '?v=' + Date.now();
  const pers = Object.assign({}, impresaCorrente.personalizzazione || {}, { banner_url: url });
  const { error } = await sb.from('imprese').update({ personalizzazione: pers }).eq('id', impresaCorrente.id);
  if (error) { alert('Errore salvataggio copertina: ' + error.message); return; }
  impresaCorrente.personalizzazione = pers;
  applicaBannerHero(url);
  applicaPosCopertina(pers.banner_pos);
  /* la copertina adesso c'e': si puo' riposizionare */
  var _br=document.getElementById('btn-riposiziona'); if(_br)_br.style.display='';
}

async function caricaLogoImpresa(event) {
  const file = event.target.files[0];
  if (!file) return;
  const userId = impresaCorrente.user_id;
  const prep = await preparaFileUpload(file, { lato: 400, qualita: 0.82, formato: 'webp' });
  if (prep.errore) { alert(prep.errore); return; }
  const path = `${userId}/logo.${prep.compressa ? 'webp' : 'png'}`;
  const { error: upErr } = await sb.storage.from('loghi-imprese').upload(path, prep.file, { upsert: true, contentType: prep.compressa ? 'image/webp' : file.type, cacheControl: '31536000' });
  if (upErr) { alert('Errore caricamento logo: ' + upErr.message); return; }
  const { data: urlData } = sb.storage.from('loghi-imprese').getPublicUrl(path);
  const logoUrl = urlData.publicUrl + '?v=' + Date.now();
  await sb.from('imprese').update({ logo_url: logoUrl }).eq('id', impresaCorrente.id);
  impresaCorrente.logo_url = logoUrl;
  const img = document.getElementById('dash-logo-img');
  const placeholder = document.getElementById('dash-logo-placeholder');
  if (img) { img.src = logoUrl; img.style.display = 'block'; }
  if (placeholder) placeholder.style.display = 'none';   /* il tondo grigio col disegno */
  const prevLogoWrap = document.getElementById('prev-logo-wrap');
  if (prevLogoWrap) prevLogoWrap.innerHTML = `<img src="${logoUrl}" style="width:100%;height:100%;object-fit:cover;" alt="logo">`;
}

/* ============================================================
   QUANTE PERSONE HANNO CHIESTO I TUOI CONTATTI — 2 settembre 2026
   Legge la tabella `contatti`, che la scheda pubblica riempie ogni volta che
   un cliente chiede un contatto (mostra il numero, apre WhatsApp, scrive una
   mail, apre il sito).
   ⚠️ Si contano le PERSONE, non le righe: due richieste diverse dello stesso
   browser (per esempio prima il numero e poi WhatsApp) sono UNA persona che
   ti stava cercando. Il database gia' scarta le ripetizioni della stessa cosa
   entro un'ora; qui si raggruppa per visitatore.
   ⚠️ Chi non ha il numero del visitatore (browser che vietano la memoria)
   conta come una persona a se': meglio contarla una volta in piu' che
   buttarla via.
   ⚠️ Il lucchetto della tabella fa gia' il lavoro: un'impresa collegata vede
   solo le proprie righe. Qui non serve nessun altro filtro oltre all'id.
   ⚠️ ZERO NON SI SCRIVE: un «0» grande nel pannello di un'impresa che ha
   appena cominciato e' una brutta accoglienza. Si scrive il trattino e sotto
   «Ancora nessuno questo mese» — stessa regola dello zero delle recensioni
   sulla scheda pubblica (1 settembre). */
function _quantePersone(righe) {
  const visti = new Set();
  let senzaNome = 0;
  (righe || []).forEach(function (r) {
    if (r && r.visitatore) visti.add(r.visitatore);
    else senzaNome++;
  });
  return visti.size + senzaNome;
}
async function caricaContatti() {
  const num = document.getElementById('dash-stat-contatti');
  const sub = document.getElementById('dash-stat-contatti-sub');
  if (!num || !impresaCorrente) return;
  const { data, error } = await sb.from('contatti')
    .select('visitatore, created_at, tipo')
    .eq('impresa_id', impresaCorrente.id)
    .order('created_at', { ascending: false });
  if (error) {
    /* se il database non risponde non si inventa uno zero: si dice che il
       numero non si sa */
    num.textContent = '—';
    if (sub) sub.textContent = 'non riesco a leggerlo';
    console.error('contatti:', error.message);
    return;
  }
  const righe = data || [];
  _contattiRighe = righe;
  const inizioMese = new Date(); inizioMese.setDate(1); inizioMese.setHours(0, 0, 0, 0);
  const delMese = righe.filter(function (r) { return new Date(r.created_at) >= inizioMese; });
  const personeMese = _quantePersone(delMese);
  const personeTutte = _quantePersone(righe);
  num.textContent = personeMese > 0 ? String(personeMese) : '—';
  if (sub) {
    sub.textContent = personeMese > 0
      ? ('questo mese · ' + personeTutte + ' in tutto')
      : 'Ancora nessuno questo mese';
  }
}

/* L'ELENCO DELLE RICHIESTE — 3 settembre 2026.
   Una riga per richiesta: il giorno e l'ora, e che cosa ha chiesto (numero
   mostrato, WhatsApp, email, sito). Raggruppate per mese, le piu' recenti
   in cima. Nessun nome, nessun numero del cliente: non li abbiamo.
   Zero righe = «Ancora nessuno», non una tabella vuota. */
let _contattiRighe = [];
const _CTT_TIPO = { telefono: 'Numero mostrato', whatsapp: 'WhatsApp', email: 'Email', sito: 'Sito' };
function _contattiHTML(righe) {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const lista = (righe || []).filter(r => r && r.created_at).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (!lista.length) return '<div class="ctt-vuoto">Ancora nessuno. Quando un cliente chiede il tuo numero dalla scheda, lo vedi qui.</div>';
  const mesi = {}; const ordine = [];
  lista.forEach(r => {
    const d = new Date(r.created_at);
    const k = d.getFullYear() + '-' + d.getMonth();
    if (!mesi[k]) { mesi[k] = { nome: d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }), righe: [] }; ordine.push(k); }
    mesi[k].righe.push(r);
  });
  return ordine.map(k => {
    const m = mesi[k]; const persone = _quantePersone(m.righe);
    const titolo = m.nome.charAt(0).toUpperCase() + m.nome.slice(1);
    return '<div class="ctt-mese">' + esc(titolo) + ' — ' + persone + (persone === 1 ? ' persona' : ' persone') + '</div>' +
      m.righe.map(r => {
        const d = new Date(r.created_at);
        const quando = d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) + ', ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        return '<div class="ctt-riga"><span>' + esc(_CTT_TIPO[r.tipo] || r.tipo || 'Contatto') + '</span><span>' + esc(quando) + '</span></div>';
      }).join('');
  }).join('');
}
async function apriModalContatti() {
  const body = document.getElementById('modal-contatti-body');
  if (!body) return;
  body.innerHTML = _contattiHTML(_contattiRighe);
  document.getElementById('modal-contatti').classList.add('show');
  await caricaContatti();                 // numeri freschi, poi si ridisegna
  body.innerHTML = _contattiHTML(_contattiRighe);
}
