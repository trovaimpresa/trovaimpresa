/* =====================================================================
   TrovaImpresa — Integrazione AI nel gestionale
   NON usa il client `sb` del gestionale (è chiuso in una closure, irraggiungibile):
   legge il token di sessione da localStorage e la chiave anon dall'HTML della pagina.
   Non crea un secondo client: niente warning GoTrueClient.

   INSTALLAZIONE
   1. Salva questo file come  /js/ai-integrazione.js
   2. In gestionale-app.html, subito prima di </body>, aggiungi:
        <script src="/js/ai-integrazione.js"></script>
   3. Fine. Il pulsante compare da solo in basso a destra.
   ===================================================================== */
(function () {
  'use strict';

  // Il gestionale tiene il client Supabase (`sb`) dentro una closure: dall'esterno
  // è irraggiungibile (`typeof sb` === 'undefined'). Quindi NON usiamo `sb`: leggiamo
  // il token di sessione direttamente da localStorage e la chiave anon dall'HTML.
  function getToken(){
    try{
      const k=Object.keys(localStorage).find(x=>x.startsWith('sb-')&&x.includes('auth-token'));
      if(!k) return null;
      const v=JSON.parse(localStorage.getItem(k));
      return v&&v.access_token?v.access_token:null;
    }catch(e){return null;}
  }

  let ANON=null;
  async function getAnon(){
    if(ANON) return ANON;
    try{
      const html=await (await fetch(location.href,{cache:'no-store'})).text();
      const m=html.match(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/);
      if(m){ANON=m[0];return ANON;}
    }catch(e){}
    return null;
  }

  // Il reparto attivo (prima da `cur.nome`, anch'esso nella closure) lo leggiamo
  // dal primo h1 della pagina; se vuoto o è il titolo del gestionale, stringa vuota.
  function repartoAttivo(){
    const h=document.querySelector('h1');
    const t=h?(h.textContent||'').trim():'';
    if(!t||/gestionale/i.test(t)) return '';
    return t;
  }

  const FUNCTION_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co/functions/v1/ai-generate';
  const RPC_STATUS_URL = 'https://nacvrsgkyfavykxjxszu.supabase.co/rest/v1/rpc/get_ai_status';

  const AI = {
    stato: null,
    pronto: false,
  };
  window.AI = AI;

  /* ------------------------------------------------------------------ */
  /* UTILITY                                                             */
  /* ------------------------------------------------------------------ */
  const euro = n => (Number(n) || 0).toLocaleString('it-IT', {
    style: 'currency', currency: 'EUR'
  });

  const avviso = msg => {
    if (typeof toast === 'function') toast(msg);
    else console.log('[AI]', msg);
  };

  /* ------------------------------------------------------------------ */
  /* STATO CREDITI                                                       */
  /* ------------------------------------------------------------------ */
  async function caricaStato() {
    const token = getToken();
    if (!token) return null;
    try {
      const anon = await getAnon();
      const res = await fetch(RPC_STATUS_URL, {
        method: 'POST',
        headers: {
          'apikey': anon,
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) { console.warn('[AI] get_ai_status', res.status); return null; }
      AI.stato = await res.json();
      aggiornaFab();
      return AI.stato;
    } catch (e) {
      console.warn('[AI] stato non disponibile', e);
      return null;
    }
  }

  /* ------------------------------------------------------------------ */
  /* CHIAMATA ALLA EDGE FUNCTION                                         */
  /* ------------------------------------------------------------------ */
  async function genera(feature, input) {
    const token = getToken();
    if (!token) { avviso('Sessione scaduta, rifai il login'); return null; }

    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ feature, input }),
    });

    const body = await res.json();

    if (res.status === 402) {
      await caricaStato();
      mostraUpgrade(body.reason);
      return null;
    }
    if (!res.ok) throw new Error(body.error || 'Errore AI');

    if (AI.stato) { AI.stato.remaining = body.remaining; aggiornaFab(); }
    return body.result;
  }

  /* ------------------------------------------------------------------ */
  /* PULSANTE FLOTTANTE                                                  */
  /* ------------------------------------------------------------------ */
  function creaFab() {
    if (document.getElementById('ai-fab')) return;
    const b = document.createElement('button');
    b.id = 'ai-fab';
    b.type = 'button';
    b.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/>
      </svg>
      <span id="ai-fab-txt">Preventivo AI</span>
      <span id="ai-fab-num"></span>`;
    b.onclick = apriPannello;
    document.body.appendChild(b);
    aggiornaFab();
  }

  function aggiornaFab() {
    const num = document.getElementById('ai-fab-num');
    const fab = document.getElementById('ai-fab');
    if (!num || !fab) return;

    if (!AI.stato || !AI.stato.has_ai) {
      num.textContent = 'PRO';
      fab.className = 'ai-locked';
    } else {
      num.textContent = AI.stato.remaining;
      fab.className = AI.stato.remaining <= 10 ? 'ai-basso' : '';
    }
  }

  /* ------------------------------------------------------------------ */
  /* PANNELLO GENERAZIONE                                                */
  /* ------------------------------------------------------------------ */
  function apriPannello() {
    if (!AI.stato || !AI.stato.has_ai) { mostraUpgrade('plan_without_ai'); return; }
    if (AI.stato.remaining <= 0)       { mostraUpgrade('no_credits');      return; }

    chiudiTutto();

    const reparto = repartoAttivo();
    const ruolo   = 'artigiano';

    const ov = document.createElement('div');
    ov.className = 'ai-ov';
    ov.innerHTML = `
      <div class="ai-box">
        <button class="ai-x" aria-label="Chiudi">&times;</button>
        <div class="ai-occhio">Assistente AI${reparto ? ' · ' + reparto : ''}</div>
        <h3 class="ai-tit">Genera un preventivo</h3>
        <p class="ai-sub">Descrivi il lavoro come lo racconteresti al cliente. Più dettagli dai, più preciso sarà il preventivo.</p>

        <textarea id="ai-in" rows="5" placeholder="Es. Rifacimento bagno 6 mq: demolizione rivestimenti, nuovo impianto idraulico, posa piastrelle pavimento e pareti, sanitari sospesi, box doccia 90x70. Zona Milano."></textarea>

        <div class="ai-riga">
          <span class="ai-crediti">Crediti: <b>${AI.stato.remaining}</b></span>
          <button id="ai-go" class="ai-cta">Genera preventivo</button>
        </div>

        <div id="ai-out"></div>
      </div>`;
    document.body.appendChild(ov);

    ov.querySelector('.ai-x').onclick = chiudiTutto;
    ov.onclick = e => { if (e.target === ov) chiudiTutto(); };
    document.getElementById('ai-in').focus();

    document.getElementById('ai-go').onclick = async () => {
      const inp = document.getElementById('ai-in');
      const btn = document.getElementById('ai-go');
      const out = document.getElementById('ai-out');
      const testo = inp.value.trim();

      if (testo.length < 15) { avviso('Descrivi il lavoro un po\' più nel dettaglio'); return; }

      btn.disabled = true;
      btn.textContent = 'Genero...';
      out.innerHTML = '<div class="ai-load">L\'AI sta preparando il preventivo, 10-15 secondi...</div>';

      try {
        // Contesto: reparto + ruolo aiutano il modello a usare le voci giuste
        const contesto = `[Settore: ${reparto || ruolo}]\n${testo}`;
        const risultato = await genera('preventivo', contesto);
        if (!risultato) { out.innerHTML = ''; return; }
        mostraPreventivo(JSON.parse(risultato));
      } catch (e) {
        out.innerHTML = `<div class="ai-err">${e.message}</div>`;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Genera preventivo';
        const c = document.querySelector('.ai-crediti b');
        if (c && AI.stato) c.textContent = AI.stato.remaining;
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /* RENDER PREVENTIVO                                                   */
  /* ------------------------------------------------------------------ */
  function mostraPreventivo(p) {
    const out = document.getElementById('ai-out');
    if (!out) return;

    const voci = Array.isArray(p.voci) ? p.voci : [];
    let totale = 0;

    const righe = voci.map(v => {
      const q  = Number(v.quantita) || 0;
      const pu = Number(v.prezzo_unitario) || 0;
      const st = q * pu;
      totale += st;
      return `<tr>
        <td>${v.descrizione || ''}</td>
        <td class="n">${q}</td>
        <td class="n">${v.unita || ''}</td>
        <td class="n">${euro(pu)}</td>
        <td class="n b">${euro(st)}</td>
      </tr>`;
    }).join('');

    out.innerHTML = `
      <div class="ai-res">
        <h4>${p.titolo || 'Preventivo'}</h4>
        <div class="ai-tw">
          <table class="ai-tab">
            <thead><tr><th>Descrizione</th><th>Q.tà</th><th>U.M.</th><th>Prezzo</th><th>Totale</th></tr></thead>
            <tbody>${righe}</tbody>
            <tfoot><tr><td colspan="4">Totale imponibile</td><td class="n b">${euro(totale)}</td></tr></tfoot>
          </table>
        </div>
        ${p.note ? `<p class="ai-note">${p.note}</p>` : ''}
        <div class="ai-azioni">
          <button id="ai-copia" class="ai-cta">Copia preventivo</button>
          <button id="ai-nuovo" class="ai-ghost">Genera un altro</button>
        </div>
        <p class="ai-disc">Prezzi indicativi generati dall'AI. Verificali sempre prima di inviarli al cliente.</p>
      </div>`;

    document.getElementById('ai-copia').onclick = () => {
      const txt = [
        p.titolo || 'Preventivo', '',
        ...voci.map(v => `${v.descrizione} — ${v.quantita} ${v.unita || ''} x ${euro(v.prezzo_unitario)} = ${euro((Number(v.quantita)||0) * (Number(v.prezzo_unitario)||0))}`),
        '', `TOTALE IMPONIBILE: ${euro(totale)}`,
        p.note ? '\n' + p.note : ''
      ].join('\n');
      navigator.clipboard.writeText(txt)
        .then(() => avviso('Preventivo copiato ✓'))
        .catch(() => avviso('Copia non riuscita'));
    };

    document.getElementById('ai-nuovo').onclick = () => {
      out.innerHTML = '';
      const i = document.getElementById('ai-in');
      if (i) { i.value = ''; i.focus(); }
    };
  }

  /* ------------------------------------------------------------------ */
  /* MODALE UPGRADE                                                      */
  /* ------------------------------------------------------------------ */
  function mostraUpgrade(motivo) {
    chiudiTutto();

    const rinnovo = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
      .toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });

    const c = motivo === 'no_credits' ? {
      occhio: 'Crediti esauriti',
      tit:    'Hai finito i crediti di questo mese',
      sub:    `Si rinnovano il ${rinnovo}. Se ti servono subito, ricarica: i crediti acquistati non scadono mai.`,
      cta:    'Ricarica 150 crediti — 19€',
      href:   '/ricarica-crediti.html',
      piani:  [
        { n: '150 crediti', p: '19€',  d: 'non scadono' },
        { n: 'AI Pro',      p: '599€', d: '600 al mese', top: true },
      ],
    } : motivo === 'subscription_expired' ? {
      occhio: 'Abbonamento scaduto',
      tit:    'Rinnova per continuare',
      sub:    'I tuoi dati sono al sicuro. Rinnova e riprendi da dove avevi lasciato.',
      cta:    'Rinnova ora',
      href:   '/abbonamento.html',
      piani:  [],
    } : {
      occhio: 'Funzione AI',
      tit:    'Sblocca l\'assistente AI',
      sub:    'Descrivi il lavoro a parole e ottieni un preventivo completo, voce per voce, in 15 secondi. Basta fogli di calcolo.',
      cta:    'Vedi i piani',
      href:   '/abbonamento.html',
      piani:  [
        { n: 'AI',     p: '299€', d: '150 preventivi/mese' },
        { n: 'AI Pro', p: '599€', d: '600 preventivi/mese', top: true },
      ],
    };

    const ov = document.createElement('div');
    ov.className = 'ai-ov';
    ov.innerHTML = `
      <div class="ai-box ai-box--sm">
        <button class="ai-x" aria-label="Chiudi">&times;</button>
        <div class="ai-occhio">${c.occhio}</div>
        <h3 class="ai-tit">${c.tit}</h3>
        <p class="ai-sub">${c.sub}</p>
        ${c.piani.length ? `<div class="ai-piani">${c.piani.map(x => `
          <div class="ai-piano ${x.top ? 'top' : ''}">
            ${x.top ? '<span class="ai-tag">Consigliato</span>' : ''}
            <div class="ai-pn">${x.n}</div>
            <div class="ai-pp">${x.p}<small>/anno</small></div>
            <div class="ai-pd">${x.d}</div>
          </div>`).join('')}</div>` : ''}
        <a class="ai-cta ai-cta--full" href="${c.href}">${c.cta}</a>
        <button class="ai-ghost ai-dopo">Più tardi</button>
      </div>`;
    document.body.appendChild(ov);

    ov.querySelector('.ai-x').onclick    = chiudiTutto;
    ov.querySelector('.ai-dopo').onclick = chiudiTutto;
    ov.onclick = e => { if (e.target === ov) chiudiTutto(); };
  }

  function chiudiTutto() {
    document.querySelectorAll('.ai-ov').forEach(x => x.remove());
  }

  document.addEventListener('keydown', e => { if (e.key === 'Escape') chiudiTutto(); });

  /* ------------------------------------------------------------------ */
  /* STILI                                                               */
  /* ------------------------------------------------------------------ */
  function stili() {
    if (document.getElementById('ai-css')) return;
    const s = document.createElement('style');
    s.id = 'ai-css';
    s.textContent = `
#ai-fab{position:fixed;right:20px;bottom:20px;z-index:9000;display:flex;align-items:center;gap:8px;
  padding:13px 19px;border:none;border-radius:999px;cursor:pointer;
  background:#0f766e;color:#fff;font:650 14px/1 system-ui,-apple-system,Segoe UI,sans-serif;
  box-shadow:0 6px 20px rgba(15,118,110,.35);transition:transform .15s ease,box-shadow .15s ease}
#ai-fab:hover{transform:translateY(-2px);box-shadow:0 10px 26px rgba(15,118,110,.45)}
#ai-fab.ai-locked{background:#111827;box-shadow:0 6px 20px rgba(0,0,0,.3)}
#ai-fab.ai-basso{background:#b45309;box-shadow:0 6px 20px rgba(180,83,9,.35)}
#ai-fab-num{background:rgba(255,255,255,.22);padding:3px 8px;border-radius:999px;font-size:12px;font-weight:700}

.ai-ov{position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(3px);
  display:flex;align-items:center;justify-content:center;z-index:9500;padding:20px;
  font-family:system-ui,-apple-system,Segoe UI,sans-serif;animation:aiF .18s ease;overflow-y:auto}
@keyframes aiF{from{opacity:0}to{opacity:1}}
.ai-box{background:#fff;border-radius:18px;width:100%;max-width:720px;padding:30px 28px 24px;
  position:relative;box-shadow:0 24px 60px rgba(0,0,0,.28);animation:aiU .22s cubic-bezier(.2,.8,.3,1);
  max-height:92vh;overflow-y:auto}
.ai-box--sm{max-width:440px;text-align:center}
@keyframes aiU{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}
.ai-x{position:absolute;top:10px;right:15px;background:none;border:none;font-size:27px;
  line-height:1;color:#9ca3af;cursor:pointer}
.ai-x:hover{color:#111827}
.ai-occhio{font:700 11px/1 system-ui;letter-spacing:1.2px;text-transform:uppercase;color:#0f766e;margin-bottom:9px}
.ai-tit{font-size:21px;font-weight:750;color:#111827;margin:0 0 8px}
.ai-sub{font-size:14px;line-height:1.55;color:#4b5563;margin:0 0 18px}
#ai-in{width:100%;border:1.5px solid #e5e7eb;border-radius:11px;padding:13px;font:14px/1.5 inherit;
  resize:vertical;box-sizing:border-box;color:#111827}
#ai-in:focus{outline:none;border-color:#0f766e;box-shadow:0 0 0 3px rgba(15,118,110,.12)}
.ai-riga{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px;flex-wrap:wrap}
.ai-crediti{font-size:13px;color:#6b7280}
.ai-cta{background:#0f766e;color:#fff;border:none;text-decoration:none;display:inline-block;
  padding:12px 22px;border-radius:10px;font:650 14px inherit;cursor:pointer;transition:background .15s ease}
.ai-cta:hover{background:#115e59}
.ai-cta:disabled{opacity:.6;cursor:default}
.ai-cta--full{display:block;padding:14px;text-align:center;font-size:15px}
.ai-ghost{background:none;border:none;color:#6b7280;font:14px inherit;cursor:pointer;padding:12px}
.ai-ghost:hover{color:#111827}
.ai-dopo{display:block;margin:10px auto 0;font-size:13px}

.ai-load{margin-top:20px;padding:26px;text-align:center;color:#6b7280;font-size:14px;
  background:#f9fafb;border-radius:11px}
.ai-err{margin-top:18px;padding:14px;background:#fef2f2;color:#b91c1c;border-radius:10px;font-size:14px}
.ai-res{margin-top:22px;border-top:1px solid #e5e7eb;padding-top:20px}
.ai-res h4{font-size:17px;font-weight:700;color:#111827;margin:0 0 14px}
.ai-tw{overflow-x:auto;-webkit-overflow-scrolling:touch}
.ai-tab{width:100%;border-collapse:collapse;font-size:13px;min-width:520px}
.ai-tab th{text-align:left;padding:9px 8px;background:#f3f4f6;color:#374151;font-weight:650;
  border-bottom:1.5px solid #e5e7eb;white-space:nowrap}
.ai-tab td{padding:9px 8px;border-bottom:1px solid #f3f4f6;color:#374151;vertical-align:top}
.ai-tab .n{text-align:right;white-space:nowrap}
.ai-tab .b{font-weight:650;color:#111827}
.ai-tab tfoot td{background:#f9fafb;font-weight:700;color:#111827;border-top:1.5px solid #e5e7eb;
  border-bottom:none;font-size:14px}
.ai-note{margin-top:14px;padding:12px;background:#f9fafb;border-radius:9px;font-size:13px;
  line-height:1.55;color:#4b5563}
.ai-azioni{display:flex;align-items:center;gap:8px;margin-top:18px;flex-wrap:wrap}
.ai-disc{margin-top:12px;font-size:11.5px;color:#9ca3af;line-height:1.5}

.ai-piani{display:flex;gap:11px;margin-bottom:20px}
.ai-piano{flex:1;border:1.5px solid #e5e7eb;border-radius:12px;padding:15px 10px;position:relative;background:#fafafa}
.ai-piano.top{border-color:#0f766e;background:#f0fdfa}
.ai-tag{position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:#0f766e;color:#fff;
  font:700 9px/1 system-ui;padding:4px 8px;border-radius:20px;white-space:nowrap;letter-spacing:.4px}
.ai-pn{font-size:12px;font-weight:650;color:#6b7280;margin-bottom:5px}
.ai-pp{font-size:21px;font-weight:750;color:#111827}
.ai-pp small{font-size:11px;font-weight:500;color:#9ca3af}
.ai-pd{font-size:11.5px;color:#6b7280;margin-top:5px}

@media(max-width:560px){
  .ai-box{padding:24px 18px 18px;border-radius:14px}
  .ai-piani{flex-direction:column}
  #ai-fab{right:14px;bottom:14px;padding:12px 16px;font-size:13px}
}`;
    document.head.appendChild(s);
  }

  /* ------------------------------------------------------------------ */
  /* AVVIO — aspetta che la sessione (token in localStorage) sia pronta  */
  /* ------------------------------------------------------------------ */
  async function avvia() {
    if (AI.pronto) return;
    if (!getToken()) return;       // non loggato: niente pulsante

    AI.pronto = true;
    stili();
    creaFab();
    await caricaStato();
  }

  // Il gestionale carica in modo asincrono: riproviamo finché il token non c'è
  let tentativi = 0;
  const t = setInterval(() => {
    avvia();
    if (AI.pronto || ++tentativi > 40) clearInterval(t);   // max 20 secondi
  }, 500);

  document.addEventListener('DOMContentLoaded', avvia);
})();
