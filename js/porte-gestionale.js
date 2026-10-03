/* =====================================================================
   PORTE DEL GESTIONALE — il codice che prima era COPIATO in tutti e tre i
   pannelli (impresa, artigiano, professionisti): le porte, il listino, la
   finestra dei prezzi, la cassa Stripe, il portale clienti, «Attiva» da link.
   ⛔ 3 ott 2026: ora sta SOLO qui. Si cambia in un punto e vale per tutti.
   Va caricato PRIMA dello script grande del pannello (dopo gestionale-base.js).
   Usa le variabili del pannello (impresaCorrente, sb...) al momento del
   clic, non al caricamento: per questo puo' stare in un file a parte.
   ===================================================================== */
/* ⛔ 3 OTTOBRE 2026 — L'INTERRUTTORE DEL GESTIONALE BASE GRATIS (letto da js/gestionale-base.js).
   FALSE = la schermata resta quella di sempre (Gestionale, Gestionale AI,
   prova 30 giorni, Fai un giro). TRUE = schermata nuova: il riquadro verde
   «Usa gratis il gestionale base» e due sole card a pagamento (assistenza AI
   a 29/249, assistenza AI e chat a 39/349), senza prova e senza giro.
   ⚠️ NON metterlo a TRUE da solo: il bottone «Usa gratis» porta nel gestionale,
   e finche' il cancello (js/gate-gestionale.js) e la guardia del database non
   fanno entrare chi ha il piano gratis, quel bottone porta a un muro.
   Per vederla senza accenderla: aggiungere ?piani=prova all'indirizzo. */
const GESTIONALE_BASE_APERTO = (window.GESTIONALE_BASE_APERTO === true);   /* 3 ott: l'interruttore vero sta in js/gestionale-base.js */
const PORTE_GESTIONALE = [
  { chiave: 'premium', label: 'Gestionale', attiva: 'Attiva il Gestionale',
    mese: '29 \u20ac al mese', anno: '249 \u20ac all\'anno',
    tuo: 'porta-premium-tuo', azione: 'porta-premium-azione',
    entra: 'carta-entra-premium', entraAzione: 'carta-entra-premium-azione',
    provaAzione: 'carta-prova-premium-azione', vediAzione: 'carta-vedi-premium-azione',
    dentro: '/gestionale-app.html?piano=premium', guarda: '/gestionale-app.html?visita=1&piano=premium' },
  { chiave: 'premium-ai', label: 'Gestionale AI', attiva: 'Attiva il Gestionale AI',
    mese: '39 \u20ac al mese', anno: '349 \u20ac all\'anno',
    tuo: 'porta-ai-tuo', azione: 'porta-ai-azione',
    entra: 'carta-entra-ai', entraAzione: 'carta-entra-ai-azione',
    provaAzione: 'carta-prova-ai-azione', vediAzione: 'carta-vedi-ai-azione',
    dentro: '/gestionale-app.html', guarda: '/gestionale-app.html?visita=1' }
];

function montaPorteGestionale() {
  if (!impresaCorrente) return;

  const piano = String(impresaCorrente.piano || 'free').toLowerCase().trim();
  const scad  = impresaCorrente.premium_scadenza ? new Date(impresaCorrente.premium_scadenza) : null;
  const haPremium = piano === 'premium' && (!scad || isNaN(scad.getTime()) || scad.getTime() > Date.now());

  const scadAI = impresaCorrente.chat_pro_scadenza ? new Date(impresaCorrente.chat_pro_scadenza) : null;
  const haAI = haPremium && impresaCorrente.chat_pro === true
               && (!scadAI || isNaN(scadAI.getTime()) || scadAI.getTime() > Date.now());

  // ⛔ ABBONATO NON VUOL DIRE PREMIUM: i premium regalati alla registrazione
  // su Stripe non esistono, il portale direbbe «nessun abbonamento a tuo nome».
  const abbonato = haPremium && impresaCorrente.premium_pagato === true;

  const fineProva = impresaCorrente.gest_prova_fine ? new Date(impresaCorrente.gest_prova_fine) : null;
  const inProva = !!fineProva && !isNaN(fineProva.getTime()) && fineProva.getTime() > Date.now();

  // ⛔ 2 settembre, Alessio: «i bottoni di ingresso facciamoli tutti blu del
  // sito, non verde non viola non bianco». #0066ff e' il blu gia' usato in
  // questa pagina (il bottone «Vedi dove sta», l'uguale della calcolatrice).
  const BLU = 'background:#0066ff;color:white';
  /* ⛔ 13 SETTEMBRE 2026 — TORNANO DUE COLORI, E NON PER BELLEZZA.
     Il 2 settembre erano stati fatti tutti blu («non verde non viola non
     bianco»), ma allora le quattro carte erano tutte uguali. Adesso non lo
     sono piu': la carta che si paga ha il bordo arancione e quella di chi
     ce l'ha gia' e' una striscia verde. Con il bottone blu dentro una
     cornice arancione il colore diceva una cosa e la cornice un'altra.
     Adesso ogni colore vuol dire una cosa sola, in tutto il riquadro:
       🟠 arancione = si paga    🔵 blu = si prova, gratis    🟢 verde = ce l'hai gia', entra
     Restano blu la prova e «Fai un giro»: quelle sono gratis. */
  const VERDE = 'background:#1e8e3e;color:white';
  const ARANCIO = 'background:#e8733a;color:white';
  const VIOLA = ARANCIO;   /* il nome vecchio resta per non toccare le chiamate */
  const VUOTO = BLU;

  function metti(id, testo, stile, azione) {
    const box = document.getElementById(id);
    if (!box) return null;
    box.innerHTML = '';
    const b = document.createElement('button');
    b.className = 'g-b';
    b.textContent = testo;
    b.style.cssText = stile;
    b.onclick = azione;
    box.appendChild(b);
    return b;
  }
  // ⛔ nessuna delle otto caselle resta vuota: il riquadro col nulla dentro
  // e' il difetto visto in pagina il 2 settembre.
  // ⛔ 2 settembre: prima dove l'azione non serviva restava una scritta
  // grigia e meta' carte finivano senza bottone. Alessio: «tutti, non meta'».
  // Adesso il bottone blu c'e' sempre: quando non si puo' fare e' spento
  // (non si clicca) ma resta blu pieno come tutti gli altri.
  function spento(id, testo) {
    const box = document.getElementById(id);
    if (!box) return;
    box.innerHTML = '';
    const b = document.createElement('button');
    b.className = 'g-b';
    b.textContent = testo;
    b.disabled = true;
    /* ⛔ 13 SETTEMBRE 2026 — I BOTTONI SPENTI DIVENTANO GRIGI.
       Cambia la regola del 2 settembre («tutti blu, non meta'»), che era
       nata per un altro problema: allora meta' delle carte restavano SENZA
       bottone e il riquadro sembrava rotto. Il bottone c'e' sempre, quello
       resta. Ma tenerlo blu pieno anche quando non si puo' cliccare dice
       una bugia con un colore: sembra un invito e non succede niente.
       Adesso grigio, con la scritta grigia: si vede che c'e' e si vede che
       adesso non tocca a lui. Deciso da Alex il 13 set. */
    b.style.cssText = 'background:#eef1f6;color:#5f6b7a;border:1px solid #dfe4ec;cursor:default';
    box.appendChild(b);
  }


  /* ⛔ 3 OTTOBRE 2026 — LA SCADENZA SI VEDE UN MESE PRIMA (Alex).
     Per chi ha una data di fine e non ha ancora pagato: da 30 giorni prima
     compare l'avviso con il bottone per attivare. Chi paga davvero non ha data
     di fine, quindi non lo vede. */
  (function () {
    const box = document.getElementById('gest-scadenza');
    if (!box) return;
    let giorni = 0;
    if (haPremium && !abbonato && scad && !isNaN(scad.getTime())) {
      giorni = Math.ceil((scad.getTime() - Date.now()) / 86400000);
    }
    if (!(giorni >= 1 && giorni <= 30)) { box.style.display = 'none'; return; }
    const quando = scad.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
    const manca = giorni === 1 ? 'ultimo giorno' : 'mancano ' + giorni + ' giorni';
    const aperto = (typeof GESTIONALE_BASE_APERTO !== 'undefined') && GESTIONALE_BASE_APERTO;
    document.getElementById('gest-scadenza-testo').textContent = aperto
      ? 'Assistenza AI e chat: ' + manca + ' (scade il ' + quando + '). Poi resti al gestionale base, gratis.'
      : 'Gestionale: ' + manca + ' (scade il ' + quando + ').';
    box.style.display = 'flex';
    metti('azione-scadenza', aperto ? 'Rinnova' : 'Attiva', ARANCIO, () => mostraListino(PORTE_GESTIONALE[(aperto) ? 1 : 0], null));
  })();

  PORTE_GESTIONALE.forEach(porta => {
    const k = porta.chiave === 'premium' ? 'premium' : 'ai';

    // ⛔ 30 agosto — chi ha un piano entra da tutte e due le porte: il
    // Gestionale AI comprende il Gestionale.
    const aperta = porta.chiave === 'premium' ? haPremium : haAI;
    const suo    = porta.chiave === 'premium' ? (haPremium && !haAI) : haAI;
    const tuo = document.getElementById(porta.tuo);
    if (tuo) tuo.style.visibility = suo ? 'visible' : 'hidden';

    /* 1. ENTRA — l'unica porta, ed e' verde */
    if (aperta) metti('azione-entra-' + k, 'Entra', VERDE, () => { location.href = porta.dentro; });
    else {
      /* ⛔ 13 SETTEMBRE 2026, Alex: «Entra, se viene cliccato e non e'
         abbonato, deve mandare ad Attiva».
         Prima qui c'era un bottone SPENTO che diceva «Non ce l'hai ancora»:
         un vicolo cieco. Uno arriva in fondo al riquadro, trova la striscia
         piu' grande di tutte, la clicca e non succede niente.
         Adesso porta dove serve: apre il listino della carta Attiva e ce la
         porta davanti agli occhi. Arancione perche' porta a pagare — lo
         stesso colore della carta dove finisce. */
      const boxAttiva = document.getElementById('azione-attiva-' + k);
      metti('azione-entra-' + k, 'Attivalo per entrare', ARANCIO, () => {
        const carta = document.getElementById('carta-attiva-' + k);
        if (carta) {
          carta.scrollIntoView({ behavior: 'smooth', block: 'center' });
          /* un lampo, se no uno non capisce dove l'hai portato */
          carta.style.transition = 'box-shadow .25s';
          carta.style.boxShadow = '0 0 0 4px rgba(232,115,58,.35)';
          setTimeout(() => { carta.style.boxShadow = ''; }, 1400);
        }
        mostraListino(porta, boxAttiva);
      });
    }

    /* 2. ATTIVA — la cassa, e per chi paga gia' il portale Stripe.
       ⛔ 3 settembre 2026: chi ha il piano REGALATO (mai pagato) trovava qui
       «Vedi i piani e i prezzi» → pagina pubblica dei prezzi → «Scopri
       il Gestionale» → «Registrati» → la home. Un giro a vuoto per uno che e' gia'
       dentro. Adesso la cassa si apre QUI, come per chi e' free: due prezzi,
       mese o anno, e Stripe. Cosi' il regalo si trasforma in abbonamento
       senza uscire dal pannello. */
    if (aperta && abbonato) {
      metti('azione-attiva-' + k, "Gestisci l'abbonamento", ARANCIO, function () { apriPortaleClienti(this); });
    } else if (abbonato) {
      metti('azione-attiva-' + k, porta.attiva, VIOLA, function () { apriPortaleClienti(this); });
    } else {
      const box = document.getElementById('azione-attiva-' + k);
      metti('azione-attiva-' + k, porta.attiva, VIOLA, () => mostraListino(porta, box));
    }

    /* 3. PROVA 30 GIORNI */
    if (aperta) spento('azione-prova-' + k, "Ce l'hai già");
    else if (inProva) spento('azione-prova-' + k, 'Prova già in corso');
    else {
      const b = metti('azione-prova-' + k, 'Comincia la prova', VUOTO, null);
      if (b) b.onclick = () => avviaProvaGestionale(b, porta);
    }

    /* 4. ENTRA E VEDI — sempre, a chiunque */
    metti('azione-vedi-' + k, 'Fai un giro', VUOTO, () => { location.href = porta.guarda; });
  });

  /* ⛔ 3 OTTOBRE 2026 — SCHERMATA NUOVA (vedi GESTIONALE_BASE_APERTO).
     Con l'interruttore spento e senza ?piani=prova questo ramo non si apre mai. */
  const anteprimaPiani = new URLSearchParams(location.search).get('piani') === 'prova';
  if (GESTIONALE_BASE_APERTO || anteprimaPiani) {
    const nasc = id => { const e = document.getElementById(id); if (e) e.style.display = 'none'; };
    const NOMI = {
      premium: { nome: 'Gestionale con assistenza AI', desc: 'Tutto il gestionale, pi\u00f9 l\u2019assistenza AI', label: 'con assistenza AI' },
      ai:      { nome: 'Gestionale con assistenza AI e chat', desc: 'Tutto il gestionale, pi\u00f9 l\u2019assistenza AI e la Chat con AI', label: 'con assistenza AI e chat' }
    };
    /* ⛔ 3 OTTOBRE 2026 — PIANO UNICO (Alex): assistenza AI e chat insieme, 39/349.
       Resta la porta «premium-ai» (quella che gia' accende la chat nel pagamento);
       la porta da 29/249 sparisce. Entra da /gestionale-app.html senza ?piano=...,
       e nella finestra c'e' l'elenco completo, chat compresa. */
    const elPorte = document.getElementById('porte-gestionale');
    if (elPorte) elPorte.classList.add('gest-unico');   /* vedi css/porte-unico.css */
    const tit = document.getElementById('gest-titolo-testo');
    if (tit) tit.textContent = 'Il tuo gestionale';

    PORTE_GESTIONALE.forEach(porta => {
      const k = porta.chiave === 'premium' ? 'premium' : 'ai';
      if (k === 'premium') { nasc('porta-premium'); return; }   /* piano unico: la porta da 29/249 non c'e' piu' */
      nasc('carta-prova-' + k);
      nasc('carta-vedi-' + k);
      const n = NOMI[k];
      porta.label = n.label;
      const sez = document.getElementById(k === 'premium' ? 'porta-premium' : 'porta-ai');
      if (sez) {
        const a = sez.querySelector('.gest-nome'); if (a) a.textContent = n.nome;
        const d = sez.querySelector('.gest-desc'); if (d) d.textContent = n.desc;
      }
      /* le due righe del prezzo: al mese e all'anno, ognuna col suo «Attiva».
         Chi e' gia' abbonato vede solo «Gestisci l'abbonamento»: due righe
         gli farebbero ricomprare. */
      const carta = document.getElementById('carta-attiva-' + k);
      if (carta && !abbonato) {
        const fila = carta.parentElement;
        if (fila) fila.style.gridTemplateColumns = 'minmax(0,1fr)';
        const tt = carta.querySelector('.g-tit'); if (tt) tt.textContent = 'Al mese';
        const tx = carta.querySelector('.g-txt'); if (tx) tx.textContent = porta.mese;
        const box1 = document.getElementById('azione-attiva-' + k);
        metti('azione-attiva-' + k, 'Attiva', ARANCIO, () => mostraListino(porta, box1));
        let anno = document.getElementById('carta-attiva-anno-' + k);
        if (!anno) {
          anno = carta.cloneNode(true);
          anno.id = 'carta-attiva-anno-' + k;
          anno.querySelectorAll('[id]').forEach(e => { e.id = e.id.replace('azione-attiva-', 'azione-attiva-anno-'); });
          carta.after(anno);
        }
        carta.style.minHeight = '0'; anno.style.minHeight = '0';
        carta.classList.add('g-prezzo'); anno.classList.add('g-prezzo');
        const ta = anno.querySelector('.g-tit'); if (ta) ta.textContent = "All'anno";
        const xa = anno.querySelector('.g-txt'); if (xa) xa.textContent = porta.anno;
        metti('azione-attiva-anno-' + k, 'Attiva', ARANCIO, () => mostraListino(porta, null));
      }
      /* «Se ce l'hai già»: chi non ha il piano entra dal riquadro verde in
         alto, quindi la striscia «Attivalo per entrare» qui non serve (Alex,
         3 ott). Resta solo per chi il piano ce l'ha. */
      const apertaK = haAI;
      const stEntra = document.getElementById('carta-entra-' + k);
      const grEntra = stEntra && stEntra.closest('.gest-gruppo');
      if (grEntra) grEntra.style.display = apertaK ? '' : 'none';
    });

    /* il riquadro verde: solo per chi non ha gia' un piano a pagamento */
    const base = document.getElementById('gest-base-gratis');
    if (base) {
      base.style.display = haPremium ? 'none' : 'block';
      metti('azione-base-gratis', 'Usa gratis il gestionale base', VERDE, function () {
        if (anteprimaPiani && !GESTIONALE_BASE_APERTO) {
          const b = this; const t = b.textContent;
          b.textContent = 'Anteprima: ancora chiuso';
          setTimeout(() => { b.textContent = t; }, 2200);
          return;
        }
        location.href = '/gestionale-app.html?piano=base';
      });
    }
  }

}

// IL LISTINO, DOPO IL CLIC.
// Prende il posto del pulsante dentro la stessa porta: due scelte, col
// prezzo scritto per intero, e un modo per tornare indietro senza
// impegno. Da qui si va alla cassa.
/* 2 settembre 2026 sera — «premi Attiva, da li' si apre la pagina informativa
   e poi se vuoi paghi; l'unica informazione era il prezzo». Il listino non sta
   piu' dentro la carta: «Attiva» apre la finestra del piano, con l'elenco di
   cosa c'e' dentro (le stesse voci di prezzi.html) e in fondo i due prezzi. */
const PIANI_INFO = {
  /* ⛔ 13 SETTEMBRE 2026 — QUESTO ELENCO VENDEVA ROBA GIA' REGALATA.
     Fino a stamattina l'abbonamento comprendeva anche la vetrina, quindi qui
     dentro c'erano «Foto portfolio illimitate», «Video dei lavori», «QR
     profilo», «Descrizione estesa», «Personalizzazione profilo».
     Da oggi quelle cose ce le hanno TUTTI, gratis: erano diventate una
     promessa falsa dentro la finestra dove uno tira fuori la carta.
     Adesso qui c'e' solo quello che si paga davvero: il gestionale, piu'
     le tre cose che restano legate all'abbonamento (regione, priorita',
     badge). Chi cambia questo elenco controlli prima cos'e' gratis. */
  'premium': { sotto: 'Tutto il gestionale, più la vetrina in evidenza', voci: [
    'Cantieri e lavori, tutti in un posto', 'Preventivi in PDF, con lo storico', 'Preventivi con AI',
    'Computo metrico', 'Fatture, spese e margini', 'Squadra, ore e rapportini',
    'Agenda e scadenze fiscali', "L'email del mattino con le tue scadenze", 'Calcolatrice edile', 'Report dei lavori',
    'Visibile in tutta la regione', 'Priorità nei risultati', 'Badge In evidenza sulla tua scheda' ] },
  /* ⛔ 2 settembre 2026 sera, lo stesso difetto della pagina dei prezzi: qui
     l'AI aveva 6 righe e il Gestionale 17, e il piano che costa di piu' sembrava
     il piu' povero. Prima quello che si paga in piu', poi tutto il Gestionale. */
  'premium-ai': { sotto: 'Tutto il Gestionale, più la Chat con AI', voci: [
    'La chat con AI dentro il gestionale', 'Ti risponde coi conti dei tuoi lavori', 'Ti compila i moduli: lavori e clienti',
    '300 messaggi al mese', 'Cantieri e lavori, tutti in un posto',
    'Preventivi in PDF, con lo storico', 'Preventivi con AI', 'Computo metrico',
    'Fatture, spese e margini', 'Squadra, ore e rapportini', 'Agenda e scadenze fiscali',
    "L'email del mattino con le tue scadenze", 'Calcolatrice edile', 'Report dei lavori', 'Visibile in tutta la regione',
    'Priorità nei risultati', 'Badge In evidenza sulla tua scheda' ] }
};
function mostraListino(porta, box) {
  apriModalPiano(porta);
}
/* «29 € al mese» diventa {cifra:'29 €', quando:'al mese'}: la cifra va
   grande, il resto piccolo sotto. Se la scritta non ha quella forma si
   tiene tutta com'e' e non si rompe niente. */
function pezziPrezzo(testo) {
  const t = String(testo == null ? '' : testo).trim();
  const m = t.match(/^([\d.,]+\s*\u20ac)\s+(.+)$/);
  return m ? { cifra: m[1], quando: m[2] } : { cifra: t, quando: '' };
}
/* Quanto si tiene in tasca pagando a anno. Conta da solo: 29 x 12 - 249. */
function risparmioAnno(mese, anno) {
  const n = s => { const m = String(s || '').match(/[\d.,]+/); return m ? parseFloat(m[0].replace(/\./g, '').replace(',', '.')) : NaN; };
  const m = n(mese), a = n(anno);
  if (!isFinite(m) || !isFinite(a)) return '';
  const r = Math.round(m * 12 - a);
  return r > 0 ? ' \u00b7 risparmi ' + r + ' \u20ac' : '';
}
function apriModalPiano(porta) {
  const info = PIANI_INFO[porta.chiave] || PIANI_INFO['premium'];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const tit = document.getElementById('modal-piano-titolo');
  const sotto = document.getElementById('modal-piano-sotto');
  const body = document.getElementById('modal-piano-body');
  const piede = document.getElementById('modal-piano-piede');
  if (!tit || !sotto || !body || !piede) return;
  tit.textContent = 'Gestionale ' + porta.label;
  sotto.textContent = info.sotto;
  // L'elenco: due colonne sul computer, una sola sul telefono (lo decide
  // il CSS di #modal-piano). La spunta e' un cerchietto verde, non
  // l'emoji dentro il riquadro delle carte: li' dentro era enorme.
  body.innerHTML = '<p class="pi-sub">Cosa c\'è dentro</p><div class="pi-lista">' +
    info.voci.map(v => '<div class="pi-voce"><span class="pi-spunta">\u2713</span><span>' + esc(v) + '</span></div>').join('') +
    '</div>';
  // I due prezzi, scritti in due righe: la cifra grande, sotto il quando.
  // Il risparmio dell'anno NON e' scritto a mano: si conta da mese e anno,
  // cosi' il giorno che Alex cambia il listino in PORTE_GESTIONALE non
  // resta qui sotto un numero vecchio a dare del bugiardo alla pagina.
  const pm = pezziPrezzo(porta.mese), pa = pezziPrezzo(porta.anno);
  const risp = risparmioAnno(porta.mese, porta.anno);
  piede.innerHTML = '<div class="pi-prezzi">' +
    '<button id="pi-mese" class="pi-mese"><span class="pi-cifra">' + esc(pm.cifra) + '</span>' +
      '<span class="pi-quando">' + esc(pm.quando) + '</span></button>' +
    '<button id="pi-anno" class="pi-anno"><span class="pi-cifra">' + esc(pa.cifra) + '</span>' +
      '<span class="pi-quando">' + esc(pa.quando + risp) + '</span></button>' +
    '</div>' +
    '<p class="pi-nota">Si paga con carta su Stripe. Disdici quando vuoi.</p>';
  piede.querySelector('#pi-mese').onclick = function () { apriCassaGestionale(porta.chiave, 'mensile', this); };
  piede.querySelector('#pi-anno').onclick = function () { apriCassaGestionale(porta.chiave, 'annuale', this); };
  document.getElementById('modal-piano').classList.add('show');
}
function chiudiModalPiano() {
  document.getElementById('modal-piano').classList.remove('show');
}

// il pagamento: chi non e' ancora abbonato
async function apriCassaGestionale(prodotto, piano, bottone) {
  if (!impresaCorrente || !impresaCorrente.email) { alert('Manca la tua email: rientra e riprova.'); return; }
  bottone.disabled = true;
  /* 13 set 2026: era textContent. I bottoni del prezzo adesso hanno due
     <span> dentro (cifra + quando): salvare il testo li avrebbe buttati
     via, e dopo un pagamento annullato sarebbe rimasto «29 €al mese»
     tutto attaccato. Si salva e si rimette il contenuto intero. */
  const testoPrima = bottone.innerHTML;
  bottone.innerHTML = 'Apro il pagamento...';
  try {
    const res = await fetch('/.netlify/functions/crea-checkout-abbonamento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ piano, prodotto, email: impresaCorrente.email, returnUrl: window.location.href })
    });
    const dati = await res.json();
    if (dati && dati.url) { window.location.href = dati.url; return; }
    alert('Errore: ' + ((dati && dati.error) || 'sconosciuto'));
  } catch (e) {
    alert('Errore: ' + e.message);
  }
  bottone.disabled = false;
  bottone.innerHTML = testoPrima;
}

// I 30 GIORNI DI PROVA — senza carta, senza Stripe.
// ⛔ La data la scrive il SERVER, non questa pagina: le regole di accesso
// lasciano che ognuno modifichi la propria riga, quindi dal browser uno se
// la darebbe fino al 2050. Qui si chiede soltanto, col proprio gettone.
async function avviaProvaGestionale(bottone, porta) {
  const prima = bottone.textContent;
  bottone.disabled = true;
  bottone.textContent = 'Un attimo...';
  try {
    const { data: ses } = await sb.auth.getSession();
    const token = ses && ses.session && ses.session.access_token;
    if (!token) { alert('La sessione è scaduta. Rientra e riprova.'); }
    else {
      const res = await fetch('/.netlify/functions/prova-gestionale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
      });
      const dati = await res.json();
      if (dati && dati.ok) {
        // dentro subito, dalla porta da cui ha chiesto la prova
        location.href = porta.chiave === 'premium'
          ? '/gestionale-app.html?piano=premium'
          : '/gestionale-app.html';
        return;
      }
      alert((dati && (dati.messaggio || dati.error)) || 'Non sono riuscito ad aprire la prova.');
    }
  } catch (e) {
    alert('Errore: ' + e.message);
  }
  bottone.disabled = false;
  bottone.textContent = prima;
}

// il cambio piano e la disdetta: chi e' gia' abbonato
async function apriPortaleClienti(bottone) {
  if (bottone) { bottone.disabled = true; bottone.textContent = 'Apro...'; }
  try {
    const { data: ses } = await sb.auth.getSession();
    const token = ses && ses.session && ses.session.access_token;
    if (!token) { alert('La sessione è scaduta. Rientra e riprova.'); return; }
    const res = await fetch('/.netlify/functions/portale-clienti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ returnUrl: window.location.href })
    });
    const dati = await res.json();
    if (dati && dati.url) { window.location.href = dati.url; return; }
    alert((dati && dati.messaggio) || 'Non riesco ad aprire la gestione abbonamento. Riprova più tardi.');
  } catch (e) {
    alert('Errore: ' + e.message);
  }
  if (bottone) { bottone.disabled = false; montaPorteGestionale(); }
}

/* ⛔ 3 OTTOBRE 2026 — «ATTIVA» DALL'INTERNO DEL GESTIONALE.
   Il gestionale (e la chat) mandano qui con ?attiva=ai (assistenza AI, 29/249)
   o ?attiva=chat (assistenza AI e chat, 39/349): si apre subito la finestra
   dei due prezzi, e da li' si va a Stripe. Chi e' gia' abbonato NON ricompra:
   per lui si scorre solo fino alle porte, dove c'e' «Gestisci l'abbonamento». */
function apriAttivaDaLink() {
  const a = new URLSearchParams(location.search).get('attiva');
  if (a !== 'ai' && a !== 'chat') return;
  const box = document.getElementById('porte-gestionale');
  if (box && box.scrollIntoView) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (!impresaCorrente) return;
  if (impresaCorrente.premium_pagato === true) return;
  const unico = GESTIONALE_BASE_APERTO || new URLSearchParams(location.search).get('piani') === 'prova';
  const porta = PORTE_GESTIONALE.find(p => p.chiave === ((a === 'chat' || unico) ? 'premium-ai' : 'premium'));
  if (porta) apriModalPiano(porta);
}
