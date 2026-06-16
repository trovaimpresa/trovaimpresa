/* ============================================================
   ASSISTENTE TROVAIMPRESA — finestrella interattiva del sito
   Si aggancia alla funzione Netlify "ai-orienta" che hai già.
   Niente librerie, niente dipendenze: JS puro.
   ============================================================ */

/* >>> CONTROLLA SOLO QUESTI 4 NOMI <<<
   Sono le tue pagine di REGISTRAZIONE.
   Se sui tuoi file si chiamano diversamente, correggi qui sotto
   (e basta: non devi toccare altro nel file). */
const PAGINE_REGISTRAZIONE = {
  artigiano:      'registrazione-artigiano.html',
  impresa:        'registrazione-impresa.html',
  negozio:        'registrazione-negozio.html',
  professionista: 'registrazione-professionista.html'
};

/* Pagine di RICERCA — NON cambiare: combaciano con ai-orienta */
const PAGINE_RICERCA = [
  'cerca-artigiani.html',
  'cerca-imprese.html',
  'cerca-negozi.html',
  'cerca-professionisti.html'
];

(function () {
  if (window.__assistenteTI) return;      // evita doppio caricamento
  window.__assistenteTI = true;

  /* ---------- STILI (coerenti col tuo verde) ---------- */
  const css = `
  #ti-bolla{position:fixed;bottom:20px;right:20px;z-index:99999;width:60px;height:60px;border-radius:50%;background:#2a7a4b;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.2);font-size:26px;display:flex;align-items:center;justify-content:center;transition:transform .15s}
  #ti-bolla:hover{transform:scale(1.08)}
  #ti-box{position:fixed;bottom:90px;right:20px;z-index:99999;width:340px;max-width:calc(100vw - 40px);background:#fff;border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,.18);overflow:hidden;display:none;flex-direction:column;font-family:'Trebuchet MS',sans-serif}
  #ti-box.aperto{display:flex}
  #ti-head{background:linear-gradient(135deg,#2a7a4b,#1a4d2e);color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center}
  #ti-head b{font-size:16px}
  #ti-chiudi{background:none;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1}
  #ti-body{padding:16px;max-height:380px;overflow-y:auto}
  .ti-msg{background:#f1f5f2;border-radius:12px;padding:10px 12px;margin-bottom:10px;font-size:14px;color:#222;line-height:1.4}
  .ti-btn{display:block;width:100%;background:#2a7a4b;color:#fff;border:none;border-radius:8px;padding:11px;margin-top:8px;font-size:14px;cursor:pointer;font-family:inherit}
  .ti-btn:hover{background:#1f5e39}
  .ti-btn.sec{background:#fff;color:#2a7a4b;border:2px solid #2a7a4b}
  #ti-input{width:100%;box-sizing:border-box;border:2px solid #ddd;border-radius:8px;padding:10px;font-size:14px;font-family:inherit;resize:none}
  .ti-link{display:block;text-align:center;background:#2a7a4b;color:#fff;text-decoration:none;border-radius:8px;padding:11px;margin-top:8px;font-size:14px}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- Struttura base ---------- */
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

  /* ---------- Helper (textContent = niente XSS) ---------- */
  function msg(testo) {
    const d = document.createElement('div');
    d.className = 'ti-msg';
    d.textContent = testo;
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
    return d;
  }
  function pulisci() { body.innerHTML = ''; }
  function bottoneIndietro() {
    const b = document.createElement('button');
    b.className = 'ti-btn sec';
    b.textContent = '↩️ Torna indietro';
    b.onclick = schermataIniziale;
    body.appendChild(b);
  }

  /* ---------- Schermata iniziale: il bivio ---------- */
  function schermataIniziale() {
    pulisci();
    msg('Ciao! 👋 Come posso aiutarti?');
    const b1 = document.createElement('button');
    b1.className = 'ti-btn';
    b1.textContent = "🔍 Cerco un'impresa";
    b1.onclick = ramoCliente;
    body.appendChild(b1);
    const b2 = document.createElement('button');
    b2.className = 'ti-btn sec';
    b2.textContent = '🏗️ Voglio registrare la mia attività';
    b2.onclick = ramoImpresa;
    body.appendChild(b2);
  }

  /* ---------- Ramo CLIENTE (usa l'AI: ai-orienta) ---------- */
  function ramoCliente() {
    pulisci();
    msg('Dimmi cosa ti serve e ti porto nella pagina giusta. Esempio: "Devo rifare il bagno a Rieti".');
    const ta = document.createElement('textarea');
    ta.id = 'ti-input';
    ta.rows = 3;
    ta.placeholder = 'Scrivi qui...';
    body.appendChild(ta);
    const invia = document.createElement('button');
    invia.className = 'ti-btn';
    invia.textContent = 'Invia';
    invia.onclick = () => orienta(ta.value, invia);
    body.appendChild(invia);
    ta.focus();
  }

  async function orienta(testo, btn) {
    testo = (testo || '').trim();
    if (!testo) return;
    btn.disabled = true;
    btn.textContent = 'Sto pensando...';
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
    const a = document.createElement('a');
    a.className = 'ti-link';
    a.href = '/' + dato.pagina;
    a.textContent = '➡️ Vai alla ricerca';
    body.appendChild(a);
    bottoneIndietro();
  }

  function fallback() {
    pulisci();
    msg('Scegli tu la categoria che cerchi:');
    [['Artigiani', 'cerca-artigiani.html'],
     ['Imprese', 'cerca-imprese.html'],
     ['Negozi', 'cerca-negozi.html'],
     ['Professionisti', 'cerca-professionisti.html']
    ].forEach(([nome, pag]) => {
      const a = document.createElement('a');
      a.className = 'ti-link';
      a.href = '/' + pag;
      a.textContent = nome;
      body.appendChild(a);
    });
    bottoneIndietro();
  }

  /* ---------- Ramo IMPRESA (porta alla registrazione) ---------- */
  function ramoImpresa() {
    pulisci();
    msg('Ottimo! Scegli la categoria della tua attività per registrarti:');
    [['Sono un artigiano', 'artigiano'],
     ["Sono un'impresa", 'impresa'],
     ['Ho un negozio', 'negozio'],
     ['Sono un professionista', 'professionista']
    ].forEach(([nome, cat]) => {
      const a = document.createElement('a');
      a.className = 'ti-link';
      a.href = '/' + PAGINE_REGISTRAZIONE[cat];
      a.textContent = nome;
      body.appendChild(a);
    });
    bottoneIndietro();
  }
})();
