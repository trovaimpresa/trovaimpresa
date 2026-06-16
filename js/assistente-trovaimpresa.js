/* ============================================================
   ASSISTENTE TROVAIMPRESA — finestrella interattiva del sito
   Campo libero (AI: ai-orienta) + menu di voci fisse (gratis).
   JS puro, niente dipendenze.
   ============================================================ */

/* >>> CONTROLLA SOLO QUESTI NOMI DI PAGINA <<<
   Se sui tuoi file si chiamano diversamente, correggi qui. */
const PAGINE_REGISTRAZIONE = {
  artigiano:      'registrazione-artigiano.html',
  impresa:        'registrazione-impresa.html',
  negozio:        'registrazione-negozio.html',
  professionista: 'registrazione-professionista.html'
};
const PAGINA_LOGIN_IMPRESA    = 'login-impresa.html';
const PAGINA_LOGIN_CANDIDATO  = 'login-candidato.html';
const PAGINA_PREZZI           = 'prezzi.html';
const PAGINA_CONTATTI         = 'contatti.html';
const PAGINA_OFFERTE_LAVORO   = 'offerte-lavoro.html';
const PAGINA_SUBAPPALTO       = 'subappalto.html';

/* Pagine di RICERCA — combaciano con ai-orienta, NON cambiare */
const PAGINE_RICERCA = [
  'cerca-artigiani.html',
  'cerca-imprese.html',
  'cerca-negozi.html',
  'cerca-professionisti.html'
];

(function () {
  if (window.__assistenteTI) return;
  window.__assistenteTI = true;

  const css = `
  #ti-bolla{position:fixed;bottom:20px;right:20px;z-index:99999;width:64px;height:64px;border-radius:50%;background:#0066ff;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.2);font-size:28px;display:flex;align-items:center;justify-content:center;transition:transform .15s}
  #ti-bolla:hover{transform:scale(1.08)}
  #ti-box{position:fixed;top:20px;bottom:20px;right:20px;z-index:99999;width:33vw;min-width:360px;max-width:calc(100vw - 40px);background:#fff;border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,.18);overflow:hidden;display:none;flex-direction:column;font-family:'Trebuchet MS',sans-serif}
  #ti-box.aperto{display:flex}
  #ti-head{flex:0 0 auto;background:linear-gradient(135deg,#0066ff,#0047b3);color:#fff;padding:20px;display:flex;justify-content:space-between;align-items:center}
  #ti-head b{font-size:18px}
  #ti-chiudi{background:none;border:none;color:#fff;font-size:24px;cursor:pointer;line-height:1}
  #ti-body{flex:1 1 auto;padding:20px;overflow-y:auto}
  .ti-msg{background:#eef3ff;border-radius:12px;padding:15px;margin-bottom:12px;font-size:16px;color:#222;line-height:1.5;white-space:pre-wrap}
  .ti-sep{font-size:13px;color:#888;text-align:center;margin:14px 0 6px}
  .ti-btn{display:block;width:100%;background:#0066ff;color:#fff;border:none;border-radius:8px;padding:15px;margin-top:9px;font-size:16px;cursor:pointer;font-family:inherit}
  .ti-btn:hover{background:#0052cc}
  .ti-btn.sec{background:#fff;color:#0066ff;border:2px solid #0066ff}
  #ti-input{width:100%;box-sizing:border-box;border:2px solid #ddd;border-radius:8px;padding:13px;font-size:16px;font-family:inherit;resize:none}
  .ti-link{display:block;text-align:center;background:#0066ff;color:#fff;text-decoration:none;border-radius:8px;padding:15px;margin-top:9px;font-size:16px}
  @media (max-width:600px){#ti-box{top:10px;bottom:10px;right:10px;left:10px;width:auto;min-width:0;max-width:none}}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const bolla = document.createElement('button');
  bolla.id = 'ti-bolla';
  bolla.setAttribute('aria-label', 'Assistente TrovaImpresa');
  bolla.textContent = '💬';

  const box = document.createElement('div');
  box.id = 'ti-box';
  box.innerHTML =
    '<div id="ti-head"><b>Assistente TrovaImpresa</b>' +
    '<button id="ti-chiudi" aria-label="Chiudi">×</button></div>' +
    '<div id="ti-body"></div>';

  document.body.appendChild(bolla);
  document.body.appendChild(box);

  const body = box.querySelector('#ti-body');

  bolla.onclick = () => {
    box.classList.toggle('aperto');
    if (box.classList.contains('aperto')) schermataIniziale();
  };
  box.querySelector('#ti-chiudi').onclick = () => box.classList.remove('aperto');

  /* ---------- helper (textContent = niente XSS) ---------- */
  function msg(testo) {
    const d = document.createElement('div');
    d.className = 'ti-msg';
    d.textContent = testo;
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
    return d;
  }
  function pulisci() { body.innerHTML = ''; }
  function btn(testo, onclick, sec) {
    const b = document.createElement('button');
    b.className = 'ti-btn' + (sec ? ' sec' : '');
    b.textContent = testo;
    b.onclick = onclick;
    body.appendChild(b);
    return b;
  }
  function link(testo, href) {
    const a = document.createElement('a');
    a.className = 'ti-link';
    a.href = '/' + href;
    a.textContent = testo;
    body.appendChild(a);
    return a;
  }
  function sep(testo) {
    const d = document.createElement('div');
    d.className = 'ti-sep';
    d.textContent = testo;
    body.appendChild(d);
  }
  function bottoneIndietro() {
    btn('↩️ Torna al menu', schermataIniziale, true);
  }

  /* ---------- Menu iniziale ---------- */
  function schermataIniziale() {
    pulisci();
    msg('Ciao! 👋 Dimmi cosa cerchi, oppure scegli un\'opzione qui sotto.');
    const ta = document.createElement('textarea');
    ta.id = 'ti-input';
    ta.rows = 3;
    ta.placeholder = 'Cosa cerchi? Es: rifare il bagno a Rieti';
    body.appendChild(ta);
    btn('🔍 Cerca', () => orienta(ta.value));
    sep('— oppure —');
    btn('❓ Come funziona', ramoComeFunziona, true);
    btn('🆓 È gratis cercare?', ramoGratis, true);
    btn('📍 In quali città siete?', ramoCitta, true);
    btn('💼 Offerte di lavoro', ramoLavoro, true);
    btn('🔨 Subappalti', ramoSubappalti, true);
    btn('🏗️ Registra la tua attività', ramoImpresa, true);
    btn('💶 Prezzi e piani', ramoPrezzi, true);
    btn('⭐ Premium: compari prima?', ramoPremium, true);
    btn('🔑 Accedi', ramoAccedi, true);
    btn('✉️ Contatti', ramoContatti, true);
    ta.focus();
  }

  /* ---------- Campo libero → AI (ai-orienta) ---------- */
  async function orienta(testo) {
    testo = (testo || '').trim();
    if (!testo) return;
    pulisci();
    msg('Sto cercando...');
    try {
      const r = await fetch('/.netlify/functions/ai-orienta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testo })
      });
      const raw = await r.text();
      mostraRisultato(estraiJSON(raw));
    } catch (e) {
      fallback();
    }
  }
  function estraiJSON(raw) {
    try { return JSON.parse(raw); } catch (e) {}
    const a = raw.indexOf('{'), b = raw.lastIndexOf('}');
    if (a >= 0 && b > a) { try { return JSON.parse(raw.slice(a, b + 1)); } catch (e) {} }
    return null;
  }
  function mostraRisultato(dato) {
    pulisci();
    if (!dato || !PAGINE_RICERCA.includes(dato.pagina)) return fallback();
    if (dato.motivo) msg(dato.motivo);
    link('➡️ Vai alla ricerca', dato.pagina);
    bottoneIndietro();
  }
  function fallback() {
    pulisci();
    msg('Scegli tu la categoria che cerchi:');
    link('Artigiani', 'cerca-artigiani.html');
    link('Imprese', 'cerca-imprese.html');
    link('Negozi', 'cerca-negozi.html');
    link('Professionisti', 'cerca-professionisti.html');
    bottoneIndietro();
  }

  /* ---------- Come funziona ---------- */
  function ramoComeFunziona() {
    pulisci();
    msg('TrovaImpresa ti aiuta a trovare artigiani, imprese, negozi e professionisti edili nella tua città.\n\nScrivi cosa ti serve o scegli una categoria, confronta i profili e contatta chi preferisci.\n\nSei un\'azienda? Registrati per farti trovare dai clienti.');
    bottoneIndietro();
  }

  /* ---------- È gratis cercare? ---------- */
  function ramoGratis() {
    pulisci();
    msg('Sì! Per chi cerca un\'impresa, un artigiano o un professionista, TrovaImpresa è gratuito. Scrivi cosa ti serve o scegli una categoria e contatta chi preferisci, senza costi.');
    bottoneIndietro();
  }

  /* ---------- In quali città siete? ---------- */
  function ramoCitta() {
    pulisci();
    msg('TrovaImpresa copre tutte le principali città italiane. Cerca per la tua città e trovi le imprese e i professionisti della tua zona.');
    bottoneIndietro();
  }

  /* ---------- Offerte di lavoro ---------- */
  function ramoLavoro() {
    pulisci();
    msg('Su TrovaImpresa le imprese pubblicano offerte di lavoro e i candidati possono rispondere. Dai un\'occhiata alle offerte disponibili.');
    link('Vai alle offerte di lavoro', PAGINA_OFFERTE_LAVORO);
    bottoneIndietro();
  }

  /* ---------- Subappalti ---------- */
  function ramoSubappalti() {
    pulisci();
    msg('C\'è una bacheca dedicata a chi cerca e offre subappalti e cottimi nel settore edile. Se sei del mestiere, puoi consultarla o pubblicare.');
    link('Vai ai subappalti', PAGINA_SUBAPPALTO);
    bottoneIndietro();
  }

  /* ---------- Registra la tua attività ---------- */
  function ramoImpresa() {
    pulisci();
    msg('Ottimo! Scegli la categoria della tua attività per registrarti:');
    link('Sono un artigiano', PAGINE_REGISTRAZIONE.artigiano);
    link('Sono un\'impresa', PAGINE_REGISTRAZIONE.impresa);
    link('Ho un negozio', PAGINE_REGISTRAZIONE.negozio);
    link('Sono un professionista', PAGINE_REGISTRAZIONE.professionista);
    bottoneIndietro();
  }

  /* ---------- Prezzi e piani ---------- */
  function ramoPrezzi() {
    pulisci();
    msg('Su TrovaImpresa hai due piani:\n\nFREE — €0\nProfilo base e visibilità nella tua città.\n\nPREMIUM — €5 al mese (oppure €49 all\'anno)\nPiù visibilità, foto dei lavori, preventivi con AI e strumenti avanzati.');
    link('Vedi tutti i dettagli', PAGINA_PREZZI);
    bottoneIndietro();
  }

  /* ---------- Premium: compari prima? ---------- */
  function ramoPremium() {
    pulisci();
    msg('Sì. Con il piano Premium la tua attività compare più in alto nei risultati, prima dei profili Free. In più sei visibile in tutta la tua regione: i clienti ti trovano anche se cercano in una città vicina, non solo nella tua. È uno dei vantaggi principali del Premium.');
    link('Scopri il Premium', PAGINA_PREZZI);
    bottoneIndietro();
  }

  /* ---------- Accedi ---------- */
  function ramoAccedi() {
    pulisci();
    msg('Hai già un account? Scegli come accedere:');
    link('Sono un\'impresa o un professionista', PAGINA_LOGIN_IMPRESA);
    link('Cerco lavoro (candidato)', PAGINA_LOGIN_CANDIDATO);
    bottoneIndietro();
  }

  /* ---------- Contatti ---------- */
  function ramoContatti() {
    pulisci();
    msg('Hai bisogno di aiuto? Scrivici dalla pagina contatti, ti rispondiamo al più presto.');
    link('Vai ai contatti', PAGINA_CONTATTI);
    bottoneIndietro();
  }
})();
