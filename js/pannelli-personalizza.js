/* ============================================================
   PANNELLI — PERSONALIZZA PANNELLO
   Codice UGUALE nei tre pannelli (impresa, artigiano, professionisti):
   font, colori e posizione di copertina e logo, riposizionamento,
   temi pronti, apertura e salvataggio della finestra.
   Si carica PRIMA dello script grande della pagina.
   Usa dalla pagina: sb, impresaCorrente, showSection, FONDATORE_EMAIL.
   ⚠️ Resta DENTRO ogni pagina solo aggiornaPreviewPersonalizza,
   perche' il nome di base cambia: «Pannello impresa», «Pannello
   artigiano», «Pannello professionista».
   ============================================================ */

function applicaFontHero(font) {
  const hero = document.getElementById('dash-hero');
  if (!hero) return;
  hero.querySelectorAll('.dash-welcome, .dash-nome').forEach(el => {
    if (font) el.style.setProperty('font-family', font, 'important');
    else el.style.removeProperty('font-family');
  });
}
function applicaColoreTestoHero(colore) {
  const hero = document.getElementById('dash-hero');
  if (!hero) return;
  if (colore) hero.style.setProperty('color', colore, 'important');
  else hero.style.removeProperty('color');
  hero.querySelectorAll('.dash-welcome, .dash-nome').forEach(el => {
    if (colore) el.style.setProperty('color', colore, 'important');
    else el.style.removeProperty('color');
  });
}
function applicaSizeTestoHero(size) {
  const nome = document.querySelector('#dash-hero .dash-nome');
  if (!nome) return;
  const n = parseFloat(size);
  if (n && n !== 1) {
    nome.style.fontSize = `calc(1.6rem * ${n})`;
  } else {
    nome.style.fontSize = '';
  }
}
function applicaBannerHero(url) {
  /* 31 agosto 2026: la copertina adesso ha una casella sua (#dash-cover),
     larga e bassa come su Facebook. Il logo non ci sta piu' dentro: sta nel
     tondo della riga sotto, quindi i due non possono piu' sovrapporsi. */
  const cover = document.getElementById('dash-cover');
  if (!cover) return;
  if (url) {
    cover.style.backgroundImage = `url("${url}")`;
    cover.classList.add('ha-banner');
  } else {
    cover.style.backgroundImage = '';
    cover.classList.remove('ha-banner');
  }
}
/* ============================================================
   RIPOSIZIONA LA COPERTINA — 2 settembre 2026
   Chiesto da Alessio guardando la sua copertina, che e' una foto IN PIEDI
   (3024x4032) dentro una fascia sdraiata: «lo strumento che fa posizionare la
   foto in modo che si sceglie quale e' la zona che ti interessa far vedere».
   Con `background-size:cover` la foto riempie la fascia e il resto viene
   tagliato: prima si tagliava sempre dal centro, adesso il punto lo sceglie
   l'impresa trascinando, e si salva in `personalizzazione.banner_pos`.
   ⚠️ La stessa scelta vale sulla SCHEDA PUBBLICA: sarebbe assurdo scegliere
   l'inquadratura qui e poi far vedere al cliente un'altra parte della foto.
   ⚠️ Chi non ha mai scelto resta al centro: senza `banner_pos` esce
   «50% 50%», cioe' il taglio di sempre. Per le altre 81 imprese non cambia
   niente finche' non ci mettono mano.
   ============================================================ */
/* ⛔ _posSicura E' SCRITTA DUE VOLTE, qui e in profilo-impresa.html, e devono
   restare identiche carattere per carattere: se una accettasse un valore che
   l'altra rifiuta, l'impresa vedrebbe un'inquadratura e il cliente un'altra,
   e la pagina funzionerebbe lo stesso — nessuno se ne accorgerebbe.
   banco-riposiziona.js confronta l'impronta md5 delle due copie.
   ⚠️ Quello che entra qui finisce dentro uno STILE: si accettano solo due
   numeri da 0 a 100 con la percentuale, tutto il resto diventa «50% 50%». */
function _posSicura(p){
  var m=/^(\d{1,3})% (\d{1,3})%$/.exec(String(p==null?'':p).trim());
  if(!m)return '50% 50%';
  var x=parseInt(m[1],10), y=parseInt(m[2],10);
  if(!(x>=0&&x<=100&&y>=0&&y<=100))return '50% 50%';
  return x+'% '+y+'%';
}
function applicaPosCopertina(pos){
  var cover=document.getElementById('dash-cover');
  if(!cover)return;
  var p=_posSicura(pos);
  /* la posizione va scritta su TUTTI E DUE: la fascia disegna lo sfondo e
     `.cover-img` gli sta sopra con la stessa immagine ereditata. Scriverla su
     uno solo lascia l'altro tagliato dal centro. */
  cover.style.backgroundPosition=p;
  var ci=cover.querySelector('.cover-img');
  if(ci)ci.style.backgroundPosition=p;
}
var _rip=null;   /* null = non stiamo riposizionando */
/* 2 settembre 2026, seconda parte — ANCHE IL LOGO.
   Un solo modo «riposiziona» per tutte e due le immagini: si preme una volta
   sola, si trascina la copertina E il tondo, e un solo Salva li scrive
   tutti e due. Due bottoni separati avrebbero voluto dire due modi, due
   salvataggi e il doppio delle cose che si possono lasciare accese.
   ⚠️ Nel tondo l'immagine e' un <img> con object-fit:cover: il punto del
   taglio si scrive in `object-position`, non in `background-position`. Il
   conto di quanto sborda invece e' identico. */
function applicaPosLogo(pos){
  var img=document.getElementById('dash-logo-img');
  if(!img)return;
  img.style.objectPosition=_posSicura(pos);
}
/* ⛔ 2 SETTEMBRE 2026 — IL BOTTONE CHE SI INCHIODAVA IN SILENZIO.
   Trovato provando la pagina vera, non col banco: se l'immagine non arriva,
   `decode()` NON FINISCE MAI — non risponde ne' bene ne' male — e
   `avviaRiposiziona` restava lì ad aspettarla per sempre. A schermo: premi
   «Riposiziona» e non succede niente, nessun errore, nessun avviso. Il caso
   in cui e' successo era la rete bloccata, ma vale uguale per una rete lenta
   o un file cancellato dal secchio.
   RIMEDIO: si aspetta al massimo 4 secondi. Scaduti quelli si va avanti lo
   stesso — senza il logo si riposiziona solo la copertina, e se a mancare e'
   la copertina si dice all'impresa cosa e' successo invece di lasciarla li'.
   ⚠️ E il logo, quando c'e' gia' nella pagina, non si riscarica per niente:
   le misure vere stanno gia' nell'<img> (`naturalWidth`). */
function _ripAttesa(ms){ return new Promise(function(r){ setTimeout(function(){ r(null); }, ms); }); }
async function _ripCarica(url){
  if(!url)return null;
  var im=new Image(); im.src=url;
  try{ return await Promise.race([im.decode().then(function(){ return im; }), _ripAttesa(4000)]); }
  catch(e){ return null; }
}
async function avviaRiposiziona(){
  var cover=document.getElementById('dash-cover');
  var avatar=document.getElementById('dash-avatar');
  var pers=(impresaCorrente&&impresaCorrente.personalizzazione)||{};
  if(!cover||!pers.banner_url)return;
  var imCop=await _ripCarica(pers.banner_url);
  /* il logo puo' non esserci: allora si riposiziona solo la copertina */
  var imgLogo=document.getElementById('dash-logo-img');
  var haLogo=!!(imgLogo && imgLogo.style.display!=='none' && impresaCorrente.logo_url);
  /* il logo e' gia' disegnato nella pagina: le sue misure vere sono li', non
     serve riscaricarlo. Si riscarica solo se per qualche motivo non e' pronto. */
  var imLog=null;
  if(haLogo) imLog=(imgLogo.complete && imgLogo.naturalWidth) ? imgLogo : await _ripCarica(impresaCorrente.logo_url);
  /* ⚠️ se una delle due immagini non si riesce a leggere, si riposiziona
     l'altra invece di non fare niente. Si rinuncia solo se mancano tutte e
     due, e in quel caso lo si dice. */
  if(!imCop && !imLog){ alert('Non riesco a leggere le immagini: controlla la connessione e riprova.'); return; }
  var pc=_posSicura(pers.banner_pos).split(' ');
  var pl=_posSicura(pers.logo_pos).split(' ');
  _rip={
    copertina: imCop ? {img:imCop, x:parseInt(pc[0],10), y:parseInt(pc[1],10)} : null,
    logo: imLog ? {img:imLog, x:parseInt(pl[0],10), y:parseInt(pl[1],10)} : null,
    quale:null, daX:0, daY:0, partenzaX:0, partenzaY:0
  };
  if(_rip.copertina) cover.classList.add('in-riposizione');
  if(_rip.logo && avatar) avatar.classList.add('in-riposizione');
  var b1=document.getElementById('btn-riposiziona'); if(b1)b1.style.display='none';
  var b2=document.getElementById('btn-copertina');   if(b2)b2.style.display='none';
  var b3=document.getElementById('btn-logo');        if(b3)b3.style.display='none';
  var az=document.getElementById('riposiziona-azioni'); if(az)az.style.display='flex';
  var ai=document.getElementById('riposiziona-aiuto');
  if(ai){
    ai.textContent=(_rip.copertina&&_rip.logo) ? 'Trascina la copertina e il logo'
                  : (_rip.copertina ? 'Trascina la foto su e giù' : 'Trascina il logo');
    ai.style.display='block';
  }
  if(_rip.copertina) cover.addEventListener('pointerdown',_ripGiuCopertina);
  if(_rip.logo && avatar) avatar.addEventListener('pointerdown',_ripGiuLogo);
  window.addEventListener('pointermove',_ripMuovi);
  window.addEventListener('pointerup',_ripSu);
}
/* quanto sborda l'immagine dalla sua casella, in pixel: e' quello che si puo'
   spostare. Vale uguale per la fascia (background cover) e per il tondo
   (object-fit cover): cambia solo da quale elemento si prendono le misure. */
function _ripSbordo(quale){
  var el = quale==='logo' ? document.getElementById('dash-logo-img')
                          : document.getElementById('dash-cover');
  if(!el||!_rip||!_rip[quale])return {x:0,y:0};
  var r=el.getBoundingClientRect();
  var im=_rip[quale].img;
  var scala=Math.max(r.width/im.naturalWidth, r.height/im.naturalHeight);
  return {x: im.naturalWidth*scala-r.width, y: im.naturalHeight*scala-r.height};
}
function _ripPrendi(quale,e){
  if(!_rip||!_rip[quale])return;
  _rip.quale=quale;
  _rip.partenzaX=e.clientX; _rip.partenzaY=e.clientY;
  _rip.daX=_rip[quale].x; _rip.daY=_rip[quale].y;
  e.preventDefault();
  /* il tondo sta dentro la riga sotto la copertina: senza questo, un dito sul
     tondo muoverebbe anche la copertina */
  e.stopPropagation();
}
function _ripGiuCopertina(e){ _ripPrendi('copertina',e); }
function _ripGiuLogo(e){ _ripPrendi('logo',e); }
function _ripMuovi(e){
  if(!_rip||!_rip.quale)return;
  var quale=_rip.quale;
  var sb2=_ripSbordo(quale);
  var nx=_rip.daX, ny=_rip.daY;
  /* trascinando in giu' la foto scende e si scopre la parte ALTA: la
     percentuale cala. Se da quel lato non sborda niente, non si muove. */
  if(sb2.y>0) ny=_rip.daY-((e.clientY-_rip.partenzaY)/sb2.y)*100;
  if(sb2.x>0) nx=_rip.daX-((e.clientX-_rip.partenzaX)/sb2.x)*100;
  _rip[quale].x=Math.max(0,Math.min(100,Math.round(nx)));
  _rip[quale].y=Math.max(0,Math.min(100,Math.round(ny)));
  var p=_rip[quale].x+'% '+_rip[quale].y+'%';
  if(quale==='logo') applicaPosLogo(p); else applicaPosCopertina(p);
}
function _ripSu(){ if(_rip)_rip.quale=null; }
function _ripChiudi(){
  var cover=document.getElementById('dash-cover');
  var avatar=document.getElementById('dash-avatar');
  if(cover){
    cover.classList.remove('in-riposizione');
    cover.removeEventListener('pointerdown',_ripGiuCopertina);
  }
  if(avatar){
    avatar.classList.remove('in-riposizione');
    avatar.removeEventListener('pointerdown',_ripGiuLogo);
  }
  window.removeEventListener('pointermove',_ripMuovi);
  window.removeEventListener('pointerup',_ripSu);
  var az=document.getElementById('riposiziona-azioni'); if(az)az.style.display='none';
  var ai=document.getElementById('riposiziona-aiuto');  if(ai)ai.style.display='none';
  /* ⚠️ quello che un ramo spegne, l'altro lo riaccende: uno stile scritto
     sull'elemento non se ne va da solo (lezione del 30 agosto). */
  var b1=document.getElementById('btn-riposiziona'); if(b1)b1.style.display='';
  var b2=document.getElementById('btn-copertina');   if(b2)b2.style.display='';
  var b3=document.getElementById('btn-logo');        if(b3)b3.style.display='';
  _rip=null;
}
function annullaRiposiziona(){
  var pers=(impresaCorrente&&impresaCorrente.personalizzazione)||{};
  applicaPosCopertina(pers.banner_pos);   /* tornano tutte e due a com'erano */
  applicaPosLogo(pers.logo_pos);
  _ripChiudi();
}
async function salvaRiposiziona(){
  if(!_rip||!impresaCorrente)return;
  var b=document.getElementById('btn-riposiziona-salva');
  var prima=b?b.textContent:'';
  if(b){ b.disabled=true; b.textContent='Salvo...'; }
  var nuovaCop=_rip.copertina ? (_rip.copertina.x+'% '+_rip.copertina.y+'%') : null;
  var nuovoLog=_rip.logo ? (_rip.logo.x+'% '+_rip.logo.y+'%') : null;
  var cambi={};
  if(nuovaCop) cambi.banner_pos=nuovaCop;  /* si scrive solo quello che si e' */
  if(nuovoLog) cambi.logo_pos=nuovoLog;    /* davvero potuto riposizionare */
  var pers=Object.assign({}, impresaCorrente.personalizzazione||{}, cambi);
  var r=await sb.from('imprese').update({personalizzazione:pers}).eq('id',impresaCorrente.id);
  if(b){ b.disabled=false; b.textContent=prima; }
  if(r.error){ alert('Errore nel salvare la posizione: '+r.error.message); return; }
  impresaCorrente.personalizzazione=pers;
  if(nuovaCop) applicaPosCopertina(nuovaCop);
  if(nuovoLog) applicaPosLogo(nuovoLog);
  _ripChiudi();
}
// Applica la personalizzazione salvata al PANNELLO REALE (header, sfondo, logo, tema...)
function applicaPersonalizzazioneDashboard() {
  const pers = (impresaCorrente && impresaCorrente.personalizzazione) || {};
  const hero = document.getElementById('dash-hero');
  if (hero && pers.colore_header) {
    hero.style.background = `linear-gradient(135deg, ${pers.colore_header}, color-mix(in srgb, ${pers.colore_header} 60%, black))`;
  }
  if (pers.colore_sfondo) document.body.style.background = pers.colore_sfondo;
  /* Vista FONDATORE attiva: ignoro il nome pannello salvato, cosi' Alessio
     vede sempre il titolo vero del pannello in cui si trova (9/8/2026) */
  const _vfAttiva = (function(){ try{ return String((impresaCorrente&&impresaCorrente.email)||'').trim().toLowerCase()===FONDATORE_EMAIL && !!sessionStorage.getItem('ti_vedi_tipo'); }catch(e){ return false; } })();
  if (pers.nome_pannello && !_vfAttiva) {
    const w = document.getElementById('dash-welcome');
    if (w) w.textContent = pers.nome_pannello;
  }
  if (pers.font_pannello) applicaFontHero(pers.font_pannello);
  if (pers.colore_testo_header) applicaColoreTestoHero(pers.colore_testo_header);
  if (pers.size_testo_header) applicaSizeTestoHero(pers.size_testo_header);
  if (pers.banner_url) applicaBannerHero(pers.banner_url);
  applicaPosCopertina(pers.banner_pos);   /* 2 set 2026: dove tagliare */
  applicaPosLogo(pers.logo_pos);          /* e dove tagliare il logo */
  const sidebarLogo = document.querySelector('.sidebar-logo');
  if (sidebarLogo) {
    const small = sidebarLogo.querySelector('small');
    const smallHtml = small ? small.outerHTML : '';
    const haCustomLogo = impresaCorrente.logo_url && impresaCorrente.logo_url !== '/img/logo.png';
    sidebarLogo.innerHTML = haCustomLogo
      ? `<img src="${impresaCorrente.logo_url}" style="max-height:40px;width:auto">${smallHtml}`
      : smallHtml;
  }
  if (pers.tema_scuro === true) document.body.classList.add('theme-dark');
  else document.body.classList.remove('theme-dark');
}

// Temi preset (1 click): nome, colore header, sfondo, testo header, tema scuro
const PERS_PRESETS = [
  { nome: 'TrovaImpresa', header: '#0066ff', sfondo: '#f5f5f5', testo: '#ffffff', scuro: false },
  { nome: 'Blu notte',    header: '#0a2a4d', sfondo: '#eef2f7', testo: '#ffffff', scuro: false },
  { nome: 'Verde cantiere',header:'#15803d', sfondo: '#f2f7f3', testo: '#ffffff', scuro: false },
  { nome: 'Arancio',      header: '#ea580c', sfondo: '#fdf6f1', testo: '#ffffff', scuro: false },
  { nome: 'Viola intenso',header: '#7c3aed', sfondo: '#f6f3fc', testo: '#ffffff', scuro: false },
  { nome: 'Grafite',      header: '#111827', sfondo: '#0f141b', testo: '#ffffff', scuro: true  }
];

function renderPersPresets() {
  const box = document.getElementById('pers-pannello-presets');
  if (!box) return;
  box.innerHTML = PERS_PRESETS.map((p, idx) =>
    `<button type="button" class="mpp-preset" data-idx="${idx}" onclick="applicaPresetPersonalizza(${idx})" title="${p.nome}">`
    + `<span class="sw" style="background:${p.header}"></span>`
    + `<span class="sw-bg" style="background:${p.sfondo}"></span>`
    + `<span class="sw-nome">${p.nome}</span></button>`
  ).join('');
  segnaPresetAttivo();
}
/* il tema che combacia con i colori scelti si vede con la spunta */
function segnaPresetAttivo() {
  const g = id => (document.getElementById(id) || {}).value;
  const scuro = !!(document.getElementById('pers-pannello-tema-scuro') || {}).checked;
  document.querySelectorAll('#pers-pannello-presets .mpp-preset').forEach(b => {
    const p = PERS_PRESETS[+b.dataset.idx];
    b.classList.toggle('attivo', !!p && p.header === g('pers-pannello-colore-header')
      && p.sfondo === g('pers-pannello-colore-sfondo') && p.testo === g('pers-pannello-colore-testo') && p.scuro === scuro);
  });
}

function applicaPresetPersonalizza(idx) {
  const p = PERS_PRESETS[idx];
  if (!p) return;
  document.getElementById('pers-pannello-colore-header').value = p.header;
  document.getElementById('pers-pannello-colore-sfondo').value = p.sfondo;
  document.getElementById('pers-pannello-colore-testo').value = p.testo;
  document.getElementById('pers-pannello-tema-scuro').checked = p.scuro;
  aggiornaPreviewPersonalizza();
}

function resetPersonalizzaPannello() {
  document.getElementById('pers-pannello-colore-header').value = '#0066ff';
  document.getElementById('pers-pannello-colore-sfondo').value = '#f5f5f5';
  document.getElementById('pers-pannello-colore-testo').value = '#ffffff';
  document.getElementById('pers-pannello-font').value = '';
  document.getElementById('pers-pannello-size-testo').value = 1;
  document.getElementById('pers-pannello-size-label').textContent = '1.0x';
  document.getElementById('pers-pannello-tema-scuro').checked = false;
  aggiornaPreviewPersonalizza();
}

function apriModalPersonalizzaPannello() {
  const pers = (impresaCorrente && impresaCorrente.personalizzazione) || {};
  const welcomeEl = document.getElementById('dash-welcome');
  document.getElementById('pers-pannello-colore-header').value = pers.colore_header || '#0066ff';
  document.getElementById('pers-pannello-colore-sfondo').value = pers.colore_sfondo || '#f5f5f5';
  document.getElementById('pers-pannello-nome').value = pers.nome_pannello || (welcomeEl ? welcomeEl.textContent : '');
  document.getElementById('pers-pannello-font').value = pers.font_pannello || '';
  document.getElementById('pers-pannello-colore-testo').value = pers.colore_testo_header || '#ffffff';
  const sizeVal = pers.size_testo_header || 1;
  document.getElementById('pers-pannello-size-testo').value = sizeVal;
  document.getElementById('pers-pannello-size-label').textContent = parseFloat(sizeVal).toFixed(1) + 'x';
  document.getElementById('pers-pannello-tema-scuro').checked = pers.tema_scuro === true;

  const haCustomLogo = impresaCorrente.logo_url && impresaCorrente.logo_url !== '/img/logo.png';
  const logoPreviewEl = document.getElementById('pers-pannello-logo-preview');
  if (logoPreviewEl) {
    logoPreviewEl.innerHTML = haCustomLogo
      ? `<img src="${impresaCorrente.logo_url}" style="max-height:40px;width:auto;">`
      : '<span style="font-size:15px;color:var(--light);">Nessun logo personalizzato</span>';
  }
  document.getElementById('pers-pannello-logo-file').value = '';
  const logoRemoveBtn = document.getElementById('pers-pannello-logo-remove');
  if (logoRemoveBtn) logoRemoveBtn.style.display = haCustomLogo ? '' : 'none';
  const bannerPreviewEl = document.getElementById('pers-pannello-banner-preview');
  if (bannerPreviewEl) {
    bannerPreviewEl.innerHTML = pers.banner_url
      ? `<img src="${pers.banner_url}" style="max-height:60px;max-width:100%;object-fit:cover;border-radius:6px;">`
      : '<span style="font-size:15px;color:var(--light);">Nessun banner</span>';
  }
  document.getElementById('pers-pannello-banner-file').value = '';

  renderPersPresets();

  // Ogni modifica aggiorna SOLO l'anteprima (il pannello reale cambia al Salva)
  const upd = () => aggiornaPreviewPersonalizza();
  ['pers-pannello-colore-header','pers-pannello-colore-sfondo','pers-pannello-colore-testo']
    .forEach(id => { document.getElementById(id).oninput = upd; });
  document.getElementById('pers-pannello-nome').oninput = upd;
  document.getElementById('pers-pannello-font').onchange = upd;
  document.getElementById('pers-pannello-tema-scuro').onchange = upd;
  document.getElementById('pers-pannello-size-testo').oninput = (e) => {
    document.getElementById('pers-pannello-size-label').textContent = parseFloat(e.target.value).toFixed(1) + 'x';
    aggiornaPreviewPersonalizza();
  };
  document.getElementById('pers-pannello-logo-file').onchange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => aggiornaPreviewPersonalizza({ logoUrl: ev.target.result });
    reader.readAsDataURL(f);
  };
  document.getElementById('pers-pannello-banner-file').onchange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => aggiornaPreviewPersonalizza({ bannerUrl: ev.target.result });
    reader.readAsDataURL(f);
  };

  // Stato iniziale dell'anteprima
  aggiornaPreviewPersonalizza({
    logoUrl: haCustomLogo ? impresaCorrente.logo_url : '',
    bannerUrl: pers.banner_url || ''
  });
}
function chiudiModalPersonalizzaPannello() {
  // L'anteprima è isolata: il pannello reale non è stato toccato, basta tornare indietro.
  showSection('dashboard');
}
async function rimuoviLogoPersonalizzato() {
  await sb.from('imprese').update({ logo_url: null }).eq('id', impresaCorrente.id);
  impresaCorrente.logo_url = null;
  const previewEl = document.getElementById('pers-pannello-logo-preview');
  if (previewEl) previewEl.innerHTML = '<span style="font-size:15px;color:var(--light);">Nessun logo personalizzato</span>';
  document.getElementById('pers-pannello-logo-file').value = '';
  const removeBtn = document.getElementById('pers-pannello-logo-remove');
  if (removeBtn) removeBtn.style.display = 'none';
  // Aggiorna il logo nell'anteprima e nella sidebar reale
  aggiornaPreviewPersonalizza({ logoUrl: '' });
  const sidebarLogo = document.querySelector('.sidebar-logo');
  if (sidebarLogo) {
    const small = sidebarLogo.querySelector('small');
    sidebarLogo.innerHTML = small ? small.outerHTML : '';
  }
}
async function salvaCardOrdine() {
  const card_ordine = Array.from(document.querySelectorAll('.dash-quick-grid [data-card-id]')).map(el => el.dataset.cardId);
  const personalizzazione = { ...(impresaCorrente.personalizzazione || {}), card_ordine };
  await sb.from('imprese').update({ personalizzazione }).eq('id', impresaCorrente.id);
  impresaCorrente.personalizzazione = personalizzazione;
}
async function salvaPersonalizzaPannello() {
  const colore_header = document.getElementById('pers-pannello-colore-header').value;
  const colore_sfondo = document.getElementById('pers-pannello-colore-sfondo').value;
  const nome_pannello = document.getElementById('pers-pannello-nome').value;
  const font_pannello = document.getElementById('pers-pannello-font').value;
  const tema_scuro = document.getElementById('pers-pannello-tema-scuro').checked;
  const colore_testo_header = document.getElementById('pers-pannello-colore-testo').value;
  const size_testo_header = parseFloat(document.getElementById('pers-pannello-size-testo').value);
  const personalizzazione = { ...(impresaCorrente.personalizzazione || {}), colore_header, colore_sfondo, nome_pannello, font_pannello, tema_scuro, colore_testo_header, size_testo_header };
  const updateData = { personalizzazione };
  const fileInput = document.getElementById('pers-pannello-logo-file');
  if (fileInput && fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    const parts = file.name.split('.');
    const ext = parts.length > 1 ? parts.pop().toLowerCase() : 'png';
    const path = `${impresaCorrente.user_id}/logo.${ext}`;
    const { error: upErr } = await sb.storage.from('loghi-personalizzati').upload(path, file, { upsert: true });
    if (upErr) {
      alert('Errore caricamento logo: ' + upErr.message);
      return;
    }
    const { data: pub } = sb.storage.from('loghi-personalizzati').getPublicUrl(path);
    if (pub && pub.publicUrl) updateData.logo_url = pub.publicUrl;
  }
  const bannerInput = document.getElementById('pers-pannello-banner-file');
  if (bannerInput && bannerInput.files && bannerInput.files[0]) {
    const file = bannerInput.files[0];
    const parts = file.name.split('.');
    const ext = parts.length > 1 ? parts.pop().toLowerCase() : 'png';
    const path = `${impresaCorrente.user_id}/banner.${ext}`;
    const { error: bnErr } = await sb.storage.from('banner-personalizzati').upload(path, file, { upsert: true });
    if (bnErr) {
      alert('Errore caricamento banner: ' + bnErr.message);
      return;
    }
    const { data: pub } = sb.storage.from('banner-personalizzati').getPublicUrl(path);
    if (pub && pub.publicUrl) personalizzazione.banner_url = pub.publicUrl;
  }
  const { error: updErr } = await sb.from('imprese').update(updateData).eq('id', impresaCorrente.id);
  if (updErr) {
    alert('Errore salvataggio: ' + updErr.message);
    return;
  }
  impresaCorrente.personalizzazione = personalizzazione;
  if (updateData.logo_url) impresaCorrente.logo_url = updateData.logo_url;
  applicaPersonalizzazioneDashboard();
  chiudiModalPersonalizzaPannello();
}
