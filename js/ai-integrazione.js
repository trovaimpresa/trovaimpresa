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
  AI.apri = apriPannello;              // pulsante "✨ Genera con AI" nei Preventivi
  AI.apriAiuto = apriAiuto;            // voce di menu "Aiuto"
  AI.compilaCliente = compilaCliente;  // pulsante "✨ Compila con AI" nei Condomini/Clienti
  AI.compilaLavoro = compilaLavoro;    // pulsante "✨ Compila con AI" nei Lavori

  /* ------------------------------------------------------------------ */
  /* UTILITY                                                             */
  /* ------------------------------------------------------------------ */
  const euro = n => (Number(n) || 0).toLocaleString('it-IT', {
    style: 'currency', currency: 'EUR'
  });

  // Markdown minimale per le risposte dell'assistente: PRIMA escape dell'HTML
  // (mai innerHTML su testo grezzo), POI **grassetto** e *corsivo*.
  const mdInline = txt => String(txt)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');

  const avviso = msg => {
    if (typeof window.gestToast === 'function') { window.gestToast(msg); return; }
    // fuori dal gestionale: mini-toast a schermo (non solo console)
    let t = document.getElementById('ai-toast');
    if (!t) { t = document.createElement('div'); t.id = 'ai-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(avviso._t);
    avviso._t = setTimeout(() => t.classList.remove('on'), 3000);
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
      // L'assistente "Come si fa" è gratuito: niente modale piani, l'errore
      // va mostrato nel pannello stesso (lo gestisce chi ha chiamato genera).
      if (feature === 'assistente') {
        throw new Error(body.reason === 'no_help_credits'
          ? 'Hai esaurito le domande gratuite di questo mese. Riprova il mese prossimo.'
          : (body.error || 'Servizio non disponibile al momento'));
      }
      mostraUpgrade(body.reason);
      return null;
    }
    if (!res.ok) throw new Error(body.error || 'Errore AI');

    if (AI.stato) {
      if (feature === 'assistente') {
        // Per l'assistente il "remaining" del server è il numero di DOMANDE GRATUITE
        // rimaste: va su help_left. NON toccare AI.stato.remaining (crediti preventivi).
        if (typeof body.help_left !== 'undefined') AI.stato.help_left = body.help_left;
        else if (typeof body.remaining !== 'undefined') AI.stato.help_left = body.remaining;
      } else {
        if (typeof body.remaining !== 'undefined') AI.stato.remaining = body.remaining;
        if (typeof body.help_left !== 'undefined') AI.stato.help_left = body.help_left;
      }
    }
    return body.result;
  }

  /* ------------------------------------------------------------------ */
  /* AI.dati — 16 agosto 2026                                            */
  /*                                                                     */
  /* La porta nuova, quella che usa il gestionale per riempire le caselle */
  /* DENTRO il modulo. Qui non si disegna niente: si chiede all'AI e si   */
  /* restituiscono i dati. Le finestre le fa chi chiama.                  */
  /*                                                                     */
  /* Restituisce l'oggetto con i dati, oppure null quando i crediti sono  */
  /* finiti (in quel caso l'avviso l'ha gia' mostrato `genera`).          */
  /* Lancia un errore, con parole comprensibili, in tutti gli altri casi. */
  /* ------------------------------------------------------------------ */
  AI.dati = async function (feature, testo) {
    const risultato = await genera(feature, testo);
    if (risultato === null) return null;
    try {
      return JSON.parse(risultato);
    } catch (e) {
      throw new Error('Non ho capito, prova a riscriverlo con parole tue');
    }
  };

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

        <div class="ai-fila">
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
  /* ASSISTENTE "COME SI FA" (gratuito)                                  */
  /* ------------------------------------------------------------------ */
  function apriAiuto() {
    chiudiTutto();

    const sezione = (document.querySelector('section.active') || {}).id || 'nessuna';
    const domande = [
      'Come aggiungo un cliente?',
      'Come creo il mio primo lavoro?',
      'Come mando un preventivo al cliente?',
      'Come segno una fattura come pagata?'
    ];
    const helpLeft = (AI.stato && typeof AI.stato.help_left !== 'undefined') ? AI.stato.help_left : '—';

    const ov = document.createElement('div');
    ov.className = 'ai-ov';
    ov.innerHTML = `
      <div class="ai-box">
        <button class="ai-x" aria-label="Chiudi">&times;</button>
        <div class="ai-occhio">Assistente · Come si fa</div>
        <h3 class="ai-tit">Come posso aiutarti?</h3>
        <p class="ai-sub">Chiedi in parole tue, come lo diresti a un collega.</p>

        <div class="ai-help-chips">
          ${domande.map(d => `<button type="button" class="ai-help-chip">${d}</button>`).join('')}
        </div>

        <textarea id="ai-help-in" rows="3" placeholder="Es. Come faccio a..."></textarea>

        <div class="ai-fila">
          <span></span>
          <button id="ai-help-go" class="ai-cta">Chiedi</button>
        </div>

        <div id="ai-help-out"></div>
        <p class="ai-help-foot" id="ai-help-foot">Domande gratuite rimaste questo mese: ${helpLeft}</p>
      </div>`;
    document.body.appendChild(ov);

    ov.querySelector('.ai-x').onclick = chiudiTutto;
    ov.onclick = e => { if (e.target === ov) chiudiTutto(); };

    const inp = ov.querySelector('#ai-help-in');
    inp.focus();

    // I 4 suggerimenti riempiono la casella
    ov.querySelectorAll('.ai-help-chip').forEach(c => {
      c.onclick = () => { inp.value = c.textContent; inp.focus(); };
    });

    ov.querySelector('#ai-help-go').onclick = async () => {
      const btn = ov.querySelector('#ai-help-go');
      const out = ov.querySelector('#ai-help-out');
      const domanda = inp.value.trim();
      if (domanda.length < 4) { avviso('Scrivi la domanda'); return; }

      btn.disabled = true;
      btn.textContent = 'Chiedo...';
      out.innerHTML = '<div class="ai-load">Sto cercando la risposta...</div>';

      try {
        const contesto = `[Sezione aperta: ${sezione}]\n` + domanda;
        const risposta = await genera('assistente', contesto);
        if (risposta === null) { out.innerHTML = ''; return; }   // es. non loggato: avviso già mostrato
        out.innerHTML = `
          <div class="ai-help-res">
            <div class="ai-help-txt"></div>
            <button id="ai-help-nuovo" class="ai-ghost">Fai un'altra domanda</button>
          </div>`;
        // markdown -> HTML (escape già fatto dentro mdInline); a capo rispettati via pre-wrap CSS
        out.querySelector('.ai-help-txt').innerHTML = mdInline(risposta);
        out.querySelector('#ai-help-nuovo').onclick = () => { out.innerHTML = ''; inp.value = ''; inp.focus(); };
        // aggiorna il footer con le domande gratuite rimaste (help_left)
        const foot = ov.querySelector('#ai-help-foot');
        if (foot && AI.stato && typeof AI.stato.help_left !== 'undefined') {
          foot.textContent = 'Domande gratuite rimaste questo mese: ' + AI.stato.help_left;
        }
      } catch (e) {
        // include il 402 "no_help_credits": messaggio qui dentro, NON la modale piani
        out.innerHTML = '<div class="ai-err"></div>';
        out.querySelector('.ai-err').textContent = (e && e.message) || String(e);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Chiedi';
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
          <button id="ai-salva" class="ai-cta">Salva nel gestionale</button>
          <button id="ai-copia" class="ai-ghost">Copia testo</button>
          <button id="ai-nuovo" class="ai-ghost">Genera un altro</button>
        </div>
        <p class="ai-disc">Prezzi indicativi generati dall'AI. Verificali sempre prima di inviarli al cliente.</p>
      </div>`;

    document.getElementById('ai-salva').onclick = async () => {
      const btn = document.getElementById('ai-salva');
      if (typeof window.gestSalvaPreventivoAI !== 'function') { avviso('Salvataggio disponibile solo nel gestionale'); return; }
      btn.disabled = true;
      const orig = btn.textContent;
      btn.textContent = 'Salvo...';
      try {
        const r = await window.gestSalvaPreventivoAI(p.titolo || 'Preventivo', voci, p.note || null);
        if (r && r.ok) { chiudiTutto(); avviso('Preventivo salvato ✓'); }
        else { avviso('Errore: ' + ((r && r.error) || 'salvataggio non riuscito')); btn.disabled = false; btn.textContent = orig; }
      } catch (e) {
        avviso('Errore: ' + (e.message || e)); btn.disabled = false; btn.textContent = orig;
      }
    };

    document.getElementById('ai-copia').onclick = () => {
      const btn = document.getElementById('ai-copia');
      const txt = [
        p.titolo || 'Preventivo', '',
        ...voci.map(v => `${v.descrizione} — ${v.quantita} ${v.unita || ''} x ${euro(v.prezzo_unitario)} = ${euro((Number(v.quantita)||0) * (Number(v.prezzo_unitario)||0))}`),
        '', `TOTALE IMPONIBILE: ${euro(totale)}`,
        p.note ? '\n' + p.note : ''
      ].join('\n');
      navigator.clipboard.writeText(txt)
        .then(() => { const orig = btn.textContent; btn.textContent = 'Copiato ✓'; setTimeout(() => { btn.textContent = orig; }, 2000); })
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

    /* ===== 16 agosto 2026 — PREZZI VERI E PORTE CHE ESISTONO =====
       Qui c'erano due piani che non esistono piu' da nessuna parte:
       «AI 299€/anno» e «AI Pro 599€/anno». Non sono mai stati in vendita:
       l'AI sta dentro il Premium (100 crediti al mese) e i crediti in piu'
       si comprano a pacchetti da /ricarica-crediti.html.

       ⚠️ E soprattutto: due casi su tre mandavano su /abbonamento.html,
       che NON ESISTE. Stesso identico difetto del pulsante «Ricarica
       crediti» di ieri: una finestra data per finita senza provare
       l'ultimo clic. Adesso si va su /prezzi.html, che c'e'.

       I prezzi qui dentro devono restare uguali a quelli di prezzi.html e
       di ricarica-crediti.html: se cambiano li', cambiano anche qui. */
    const c = motivo === 'no_credits' ? {
      occhio: 'Crediti esauriti',
      tit:    'Hai finito i crediti di questo mese',
      sub:    `Si rinnovano il ${rinnovo}. Se ti servono subito, ricarica: i crediti acquistati non scadono mai.`,
      cta:    'Ricarica crediti',
      href:   '/ricarica-crediti.html',
      piani:  [
        { n: '150 crediti',   p: '19€', d: 'non scadono mai' },
        { n: '400 crediti',   p: '45€', d: 'non scadono mai', top: true },
        { n: '1.000 crediti', p: '99€', d: 'non scadono mai' },
      ],
    } : motivo === 'subscription_expired' ? {
      occhio: 'Premium scaduto',
      tit:    'Rinnova per continuare',
      sub:    'I tuoi dati sono al sicuro. Rinnova il Premium e riprendi da dove avevi lasciato.',
      cta:    'Vedi i piani',
      href:   '/prezzi.html',
      piani:  [
        { n: 'Premium', p: '49€', u: '/anno', d: '100 crediti AI al mese', top: true },
      ],
    } : {
      occhio: 'Assistente AI',
      tit:    'L\'assistente AI è dentro il Premium',
      sub:    'Scrivi il lavoro a parole e lui riempie le caselle, o ti prepara il preventivo voce per voce. Nel Premium ci sono 100 crediti al mese, che si rinnovano ogni mese.',
      cta:    'Vedi il Premium',
      href:   '/prezzi.html',
      piani:  [
        { n: 'Premium', p: '49€', u: '/anno', d: '100 crediti AI al mese', top: true },
        { n: 'Premium', p: '5€',  u: '/mese', d: 'stessa cosa, mese per mese' },
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
            <div class="ai-pp">${x.p}${x.u ? `<small>${x.u}</small>` : ''}</div>
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
  /* COMPILA CON AI — l'AI riempie il form, NON scrive mai nel DB        */
  /* ------------------------------------------------------------------ */
  // confronto tollerante: minuscole, senza accenti, senza spazi ai bordi
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

  // I <select> j-cliente / j-operaio sono popolati in modo asincrono da
  // fillClienti()/fillOperai(): riprovo ogni 200ms per max 3s finché trovo
  // l'opzione col testo corrispondente; se non arriva, lascio il select com'è.
  function impostaSelectQuando(sel, nome, timeoutMs) {
    if (!sel || !nome) return;
    const target = norm(nome);
    const scadenza = Date.now() + (timeoutMs || 3000);
    const prova = () => {
      if (!document.body.contains(sel)) return;   // form chiuso nel frattempo
      const opt = Array.from(sel.options).find(o => norm(o.textContent) === target);
      if (opt) { sel.value = opt.value; return; }
      if (Date.now() < scadenza) setTimeout(prova, 200);
      // scaduto: nessun errore, select invariato
    };
    prova();
  }

  // Pannello generico "descrivi a parole → compilo il form"
  function pannelloCompila(titolo, placeholder, onCompila) {
    chiudiTutto();
    const ov = document.createElement('div');
    ov.className = 'ai-ov';
    ov.innerHTML = `
      <div class="ai-box">
        <button class="ai-x" aria-label="Chiudi">&times;</button>
        <div class="ai-occhio">Assistente · Compila con AI</div>
        <h3 class="ai-tit">${titolo}</h3>
        <p class="ai-sub">Scrivi come parleresti al telefono, ci penso io a mettere le cose al posto giusto.</p>
        <textarea id="ai-comp-in" rows="4" placeholder="${placeholder}"></textarea>
        <div class="ai-fila"><span></span><button id="ai-comp-go" class="ai-cta">Compila il modulo</button></div>
        <div id="ai-comp-out"></div>
      </div>`;
    document.body.appendChild(ov);

    ov.querySelector('.ai-x').onclick = chiudiTutto;
    ov.onclick = e => { if (e.target === ov) chiudiTutto(); };
    const inp = ov.querySelector('#ai-comp-in');
    inp.focus();

    ov.querySelector('#ai-comp-go').onclick = async () => {
      const btn = ov.querySelector('#ai-comp-go');
      const out = ov.querySelector('#ai-comp-out');
      const testo = inp.value.trim();
      if (testo.length < 8) { avviso('Scrivi qualche dettaglio in più'); return; }

      btn.disabled = true;
      btn.textContent = 'Compilo...';
      out.innerHTML = '<div class="ai-load">Sto leggendo e compilo il modulo...</div>';

      try {
        const ok = await onCompila(testo);
        if (!ok) { out.innerHTML = ''; btn.disabled = false; btn.textContent = 'Compila il modulo'; }
        // se ok === true il pannello è già stato chiuso da onCompila
      } catch (e) {
        // include il JSON.parse fallito: messaggio nel pannello, nessun form aperto
        out.innerHTML = '<div class="ai-err"></div>';
        out.querySelector('.ai-err').textContent = (e && e.message) || String(e);
        btn.disabled = false;
        btn.textContent = 'Compila il modulo';
      }
    };
  }

  /* Numero scritto all'italiana -> numero che <input type="number"> accetta.
     Serve perché l'AI risponde come parla l'utente: "1000 euro", "€ 1.000",
     "1.200,50". Un input numerico rifiuta in SILENZIO tutto cio' che non è un
     numero puro (el.value resta ''), ed è così che l'importo spariva prima di
     arrivare al Salva. Peggio ancora "1.000": l'input lo accetta e lo legge
     come 1 euro, quindi i punti delle migliaia vanno tolti a mano. */
  function numeroIt(val) {
    if (val == null) return '';
    if (typeof val === 'number') return isFinite(val) ? String(val) : '';
    let s = String(val).trim().replace(/[^\d.,-]/g, '');   // via €, spazi, "euro", ecc.
    if (!s) return '';
    const vir = s.lastIndexOf(','), pun = s.lastIndexOf('.');
    if (vir > -1 && pun > -1) {
      // ci sono entrambi: l'ultimo è il separatore decimale, l'altro le migliaia
      s = vir > pun ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    } else if (vir > -1) {
      s = s.replace(',', '.');                             // virgola = decimali
    } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
      s = s.replace(/\./g, '');                            // 1.000 = mille, non 1
    }
    const n = Number(s);
    return isFinite(n) ? String(n) : '';
  }

  // Riempie un input solo se il valore non è vuoto; ritorna l'elemento se compilato
  function riempiCampo(id, val, primoRef) {
    const el = document.getElementById(id);
    if (!el) return null;
    // i campi numerici passano dal normalizzatore, gli altri restano come sono
    const v = el.type === 'number' ? numeroIt(val) : (val == null ? '' : String(val).trim());
    if (v === '') return null;
    el.value = v;
    if (primoRef && !primoRef.el) primoRef.el = el;
    return el;
  }

  /* ⚠️ 16 agosto 2026 — QUESTI DUE PULSANTI NON APRONO PIU' UNA FINESTRELLA.
     Aprono il modulo vero con la riga dell'AI gia' pronta: cosi' le due
     strade (il pulsante in cima alla sezione e la riga dentro il modulo)
     finiscono nello stesso posto, e chi scrive vede riempirsi le caselle
     invece di ricevere un modulo pieno di roba che non ha scritto lui.

     La vecchia finestrella resta qui sotto solo come rete di sicurezza:
     serve se il browser ha in memoria una versione vecchia di
     gestionale-app.html e il ponte `gestApriModuloAI` non c'e' ancora.
     In quel caso l'AI continua a funzionare come prima invece di non
     fare niente. */
  function compilaCliente() {
    if (typeof window.gestApriModuloAI === 'function') { window.gestApriModuloAI('cliente'); return; }
    pannelloCompila(
      'Descrivi il cliente',
      'Condominio Le Betulle, via Verdi 12 Milano, amministratore Rossi, 02 1234567',
      async (testo) => {
        const risultato = await genera('dati_cliente', testo);
        if (risultato === null) return false;            // es. non loggato: avviso già mostrato
        let d;
        try { d = JSON.parse(risultato); } catch (e) { throw new Error('Non ho capito, prova a riscriverlo'); }

        chiudiTutto();                                    // chiudi il pannello AI
        const apri = document.querySelector('[data-action="new-cli"]');
        if (apri) apri.click();                           // apre il form Cliente (openSheet, sincrono)

        const primo = { el: null };
        riempiCampo('c-nome', d.nome, primo);
        riempiCampo('c-ind', d.indirizzo, primo);
        riempiCampo('c-ref', d.referente, primo);
        riempiCampo('c-tel', d.telefono, primo);

        avviso('Modulo compilato, controlla i dati e premi Salva');
        if (primo.el) primo.el.focus();
        return true;
      }
    );
  }

  function compilaLavoro() {
    if (typeof window.gestApriModuloAI === 'function') { window.gestApriModuloAI('lavoro'); return; }
    pannelloCompila(
      'Descrivi il lavoro',
      'Giovedì prossimo taglio siepe da Le Betulle, ci va Marco, 350 euro',
      async (testo) => {
        const risultato = await genera('dati_lavoro', testo);
        if (risultato === null) return false;
        let d;
        try { d = JSON.parse(risultato); } catch (e) { throw new Error('Non ho capito, prova a riscriverlo'); }

        chiudiTutto();
        const apri = document.querySelector('[data-action="new-job"]');
        if (apri) apri.click();                           // apre il form Lavoro (modalità semplice/supa)

        const primo = { el: null };
        riempiCampo('j-desc', d.descrizione, primo);
        riempiCampo('j-dove', d.dove, primo);
        riempiCampo('j-data', d.data, primo);
        riempiCampo('j-imp', d.importo, primo);

        // select popolati in modo asincrono: imposta il valore solo quando l'opzione compare
        impostaSelectQuando(document.getElementById('j-cliente'), d.cliente, 3000);
        impostaSelectQuando(document.getElementById('j-operaio'), d.operatore, 3000);

        avviso('Modulo compilato, controlla i dati e premi Salva');
        if (primo.el) primo.el.focus();
        return true;
      }
    );
  }

  /* ------------------------------------------------------------------ */
  /* STILI                                                               */
  /* ------------------------------------------------------------------ */
  function stili() {
    if (document.getElementById('ai-css')) return;
    const s = document.createElement('style');
    s.id = 'ai-css';
    s.textContent = `
#ai-toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,20px);z-index:9600;
  background:#111827;color:#fff;padding:12px 18px;border-radius:10px;font:600 14px system-ui,-apple-system,Segoe UI,sans-serif;
  box-shadow:0 8px 24px rgba(0,0,0,.3);opacity:0;pointer-events:none;transition:opacity .2s ease,transform .2s ease;max-width:90vw}
#ai-toast.on{opacity:1;transform:translate(-50%,0)}

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
.ai-occhio{font:700 13px/1.2 system-ui;letter-spacing:1.2px;text-transform:uppercase;color:#0f766e;margin-bottom:9px}  /* 16 ago 2026: era 11px, sotto il minimo del progetto */
.ai-tit{font-size:21px;font-weight:750;color:#111827;margin:0 0 8px}
.ai-sub{font-size:14px;line-height:1.55;color:#4b5563;margin:0 0 18px}
#ai-in,#ai-help-in,#ai-comp-in{width:100%;border:1.5px solid #e5e7eb;border-radius:11px;padding:13px;font:14px/1.5 inherit;
  resize:vertical;box-sizing:border-box;color:#111827}
#ai-in:focus,#ai-help-in:focus,#ai-comp-in:focus{outline:none;border-color:#0f766e;box-shadow:0 0 0 3px rgba(15,118,110,.12)}
/* ⚠️ 18 agosto 2026 — QUESTA CLASSE SI CHIAMAVA `.ai-riga`, COME QUELLA
   DELLA RIGA AI DENTRO I MODULI DEL GESTIONALE (css/gestionale.css).
   Questo file lo stile se lo inietta a mano dentro <head> QUANDO PARTE,
   cioe' DOPO il foglio di stile: stessa forza, ma arriva dopo, e vinceva
   lui. Risultato: la riga dell'AI dentro il modulo del preventivo
   diventava una fila orizzontale e la casella dove si scrive passava da
   645 a 206 px — una fessura, con dentro un testo lungo.
   Misurato nel browser, non a occhio. Rinominata in `.ai-fila`, che qui
   dentro e' solo sua. */
.ai-fila{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px;flex-wrap:wrap}
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
.ai-disc{margin-top:12px;font-size:13px;color:#9ca3af;line-height:1.5}

.ai-piani{display:flex;gap:11px;margin-bottom:20px}
.ai-piano{flex:1;border:1.5px solid #e5e7eb;border-radius:12px;padding:15px 10px;position:relative;background:#fafafa}
.ai-piano.top{border-color:#0f766e;background:#f0fdfa}
.ai-tag{position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:#0f766e;color:#fff;
  font:700 13px/1.2 system-ui;padding:4px 10px;border-radius:20px;white-space:nowrap;letter-spacing:.4px}
  /* 16 ago 2026: era 9px. Su un'etichetta piccola si nota poco, ma la regola
     del progetto e' che sotto i 13 px non ci va niente, e vale anche qui. */
.ai-pn{font-size:13px;font-weight:650;color:#6b7280;margin-bottom:5px}
.ai-pp{font-size:21px;font-weight:750;color:#111827}
.ai-pp small{font-size:13px;font-weight:500;color:#9ca3af}
.ai-pd{font-size:13px;color:#6b7280;margin-top:5px}

.ai-help-chips{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 16px}
.ai-help-chip{background:#f0fdfa;border:1px solid #ccece6;color:#115e59;border-radius:999px;
  padding:8px 14px;font:600 13px inherit;cursor:pointer;transition:background .15s ease}
.ai-help-chip:hover{background:#d9f3ee}
.ai-help-res{margin-top:20px;border-top:1px solid #e5e7eb;padding-top:18px}
.ai-help-txt{white-space:pre-wrap;font-size:14.5px;line-height:1.6;color:#1f2937}
.ai-help-res .ai-ghost{display:block;margin-top:10px}
.ai-help-foot{margin-top:16px;font-size:13px;color:#9ca3af;text-align:center}

@media(max-width:560px){
  .ai-box{padding:24px 18px 18px;border-radius:14px}
  .ai-piani{flex-direction:column}
}`;
    document.head.appendChild(s);
  }

  /* ------------------------------------------------------------------ */
  /* AVVIO — aspetta che la sessione (token in localStorage) sia pronta  */
  /* ------------------------------------------------------------------ */
  async function avvia() {
    if (AI.pronto) return;
    if (!getToken()) return;       // non loggato: niente AI

    AI.pronto = true;
    stili();
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
