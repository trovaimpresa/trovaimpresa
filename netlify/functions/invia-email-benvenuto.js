// Email di benvenuto inviata alla registrazione.
// 13 set 2026: il regalo dei 3 mesi NON esiste piu'. Ogni nuovo iscritto
// nasce sul piano 'free' (trigger crea_profilo_impresa): la vetrina e'
// gratis per sempre, a pagamento c'e' solo il gestionale (30 giorni di prova)
// crea_profilo_impresa; qui inviamo la mail che lo annuncia.
// Body atteso: { nome, email, tipo, premium }
//  - premium: true  -> email "grazie per il Gestionale" (upgrade pagato)
//  - premium: false/assente -> email di benvenuto (vetrina gratis, nessun regalo)

const PANNELLI = {
  impresa: 'pannello-impresa.html',
  professionista: 'pannello-professionisti.html',
  artigiano: 'pannello-artigiano.html',
  negozio: 'pannello-negozio.html',
  candidato: 'pannello-candidato.html'
};

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let nome, email, tipo, premium;
  try {
    ({ nome, email, tipo, premium } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: 'JSON non valido' };
  }

  if (!email) {
    return { statusCode: 400, body: 'Parametro mancante: email obbligatoria' };
  }

  // ------------------------------------------------------------------
  //  L'indirizzo arriva come lo ha scritto l'utente. Sul telefono la tastiera
  //  mette da sola la maiuscola iniziale ("Ac.immobiliare@..."), mentre in
  //  Supabase l'email viene salvata tutta minuscola. Il controllo "email gia'
  //  mandata" qui sotto cerca con email=eq., che distingue maiuscole e
  //  minuscole: non trovava la riga, non metteva la spunta benvenuto_inviato
  //  e mandava l'email due volte (una dalla registrazione, una dal primo
  //  accesso, che invece usa l'email minuscola della sessione).
  // ------------------------------------------------------------------
  email = String(email).trim().toLowerCase();

  // ------------------------------------------------------------------
  //  UNA SOLA EMAIL PER ISCRITTO
  //  Prima questa funzione mandava tutte le volte che qualcuno la chiamava,
  //  e la chiamavano in due: la pagina di registrazione (sempre) e la pagina
  //  di accesso al primo ingresso. Risultato: due o tre email uguali.
  //  Ora il controllo sta qui, sul server, e funziona cosi':
  //  provo a "prendermi" il diritto di mandare con un UPDATE che riesce solo
  //  se benvenuto_inviato e' ancora false. Se l'UPDATE non tocca nessuna riga
  //  vuol dire che qualcun altro l'ha gia' fatto, e non mando niente.
  //  Essendo una sola istruzione sul database, due chiamate contemporanee non
  //  possono passare entrambe.
  //  L'email di chi attiva il Gestionale (premium: true) e' un'altra cosa e non
  //  passa da questo controllo.
  // ------------------------------------------------------------------
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  let userId = null;   // riempito qui sotto: serve ai bottoni del sondaggio
  /* ⛔ 18 set 2026 — DAL-GESTIONALE: da quale porta e' entrato.
     `vetrina_attiva=false` vuol dire «si e' iscritto da /gestionale»: lo
     scrive il trigger crea_profilo_impresa e non si puo' falsificare dal
     browser. `gest_piano_scelto` e' il prezzo che aveva scelto, e serve a
     scriverglielo nell'email invece di fargli rifare la scelta. */
  let daGestionale = false;
  let pianoScelto = null;

  if (!premium && SUPABASE_KEY) {
    const sbHeaders = {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
    const emailEnc = encodeURIComponent(email);
    const tabella = tipo === 'candidato' ? 'candidati_lavoro' : 'imprese';

    async function provaAPrendere(tab) {
      const url = SUPABASE_URL + '/rest/v1/' + tab
                + '?email=eq.' + emailEnc + '&benvenuto_inviato=is.false'
                + '&select=id,user_id,vetrina_attiva,gest_piano_scelto';
      const r = await fetch(url, {
        method: 'PATCH',
        headers: sbHeaders,
        body: JSON.stringify({ benvenuto_inviato: true })
      });
      if (!r.ok) return null;              // tabella o colonna diversa: non blocco l'invio
      const righe = await r.json();
      /* 11 set 2026: serve anche lo user_id, per i bottoni «come ci hai
         conosciuto?» in fondo all'email. Se non si trova, quel blocco non
         compare e basta: l'email parte lo stesso. */
      if (Array.isArray(righe) && righe.length && righe[0].user_id) userId = righe[0].user_id;
      /* ⚠️ `=== false` e non `!`: la tabella dei candidati questa colonna non
         ce l'ha, e li' il valore arriva `undefined`. Con `!` sarebbero
         finiti tutti i candidati nell'email del gestionale. */
      if (Array.isArray(righe) && righe.length) {
        if (righe[0].vetrina_attiva === false) daGestionale = true;
        if (righe[0].gest_piano_scelto) pianoScelto = righe[0].gest_piano_scelto;
      }
      return Array.isArray(righe) ? righe.length : 0;
    }
    async function esiste(tab) {
      const r = await fetch(SUPABASE_URL + '/rest/v1/' + tab + '?email=eq.' + emailEnc + '&select=id&limit=1',
                            { headers: sbHeaders });
      if (!r.ok) return false;
      const righe = await r.json();
      return Array.isArray(righe) && righe.length > 0;
    }

    try {
      let presa = await provaAPrendere(tabella);
      // il tipo puo' essere sbagliato o mancante: provo anche l'altra tabella
      if (presa === 0) {
        const altra = tabella === 'imprese' ? 'candidati_lavoro' : 'imprese';
        const p2 = await provaAPrendere(altra);
        if (p2 > 0) presa = p2;
        else if (await esiste(tabella) || await esiste(altra)) {
          // la riga c'e' ma era gia' spuntata: l'email e' gia' partita
          console.log('[benvenuto] gia inviata a', email, '- non rimando');
          return { statusCode: 200, body: JSON.stringify({ ok: true, saltata: true }) };
        }
        // nessuna riga trovata: mando lo stesso, meglio una email in piu' che nessuna
        console.log('[benvenuto] nessun profilo trovato per', email, '- mando comunque');
      }
    } catch (e) {
      // se il controllo non funziona non blocco l'email: meglio un doppione che il silenzio
      console.warn('[benvenuto] controllo non riuscito:', e && e.message);
    }
  }

  const saluto = nome ? 'Gentile ' + nome + ',' : 'Gentile utente,';
  const pannello = PANNELLI[tipo] || 'login-impresa.html';
  /* ⛔ 18 set 2026 — chi arriva dal gestionale NON va sul pannello del
     marketplace: va dritto al gestionale, dove il muro gli mostra il suo
     prezzo e il bottone per pagare. */
  const linkPannello = 'https://trovaimpresa.com/' + pannello;
  const NOMI_PIANO = {
    'base-anno': 'Gestionale &mdash; 249 &euro; all&rsquo;anno',
    'base-mese': 'Gestionale &mdash; 29 &euro; al mese',
    'ai-anno':   'Gestionale con AI &mdash; 349 &euro; all&rsquo;anno',
    'ai-mese':   'Gestionale con AI &mdash; 39 &euro; al mese'
  };
  const isCandidato = tipo === 'candidato';

  let subject, corpo, mostraRegalo, ctaTesto;

  // Il pezzo piu' importante di tutta l'email: senza profilo completo
  // l'iscritto resta invisibile e il portale non puo' fare niente per lui.
  // Va detto subito e chiaro, altrimenti legge "ti ho regalato l'abbonamento",
  // pensa di aver finito e non torna piu'.
  const bloccoProfilo =
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;">' +
      '<tr><td style="background:#eefbf1;border:1px solid #b7e4c3;border-left:5px solid #1e8e3e;border-radius:10px;padding:16px 18px;">' +
        '<div style="font-size:15px;font-weight:800;color:#1e8e3e;margin-bottom:6px;">Adesso serve una cosa sola: completare il profilo</div>' +
        '<div style="font-size:14px;color:#25452f;line-height:1.6;">' +
          'Entra nel pannello, apri <strong>&ldquo;Modifica profilo&rdquo;</strong> e compila tutti i campi. Contano soprattutto tre cose: ' +
          'l&rsquo;<strong>indirizzo</strong>, che &egrave; quello che ti fa comparire tra i risultati dei clienti della tua zona; ' +
          'una <strong>descrizione</strong> chiara di quello che fai; e qualche <strong>foto dei tuoi lavori</strong>.<br><br>' +
          'Ci tengo a essere chiaro, perch&eacute; &egrave; il cuore di TrovaImpresa: tutto il portale si regge sul farti vedere e notare dai clienti. ' +
          'Ma io posso mostrare solo quello che c&rsquo;&egrave;. <strong>Se il profilo resta a met&agrave; rimani invisibile</strong>, e il sito non pu&ograve; aiutarti. ' +
          'Non &egrave; una formalit&agrave;: &egrave; la differenza tra essere iscritto ed essere trovato.' +
        '</div>' +
      '</td></tr>' +
    '</table>';

  if (premium) {
    // Upgrade pagato (Stripe): niente scadenza, ringraziamento.
    // 20 set 2026 — via l'emoji dall'oggetto (scelta di Alessio: e' brutto,
    // e un'emoji in oggetto e' anche un segnale che piace poco ai filtri).
    subject = 'Grazie per aver scelto il Gestionale TrovaImpresa';
    mostraRegalo = false;
    ctaTesto = 'Vai al tuo pannello &rarr;';
    corpo =
      '<p style="margin:0 0 16px;">' + saluto + '</p>' +
      '<p style="margin:0 0 16px;">grazie per aver scelto il <strong>Gestionale TrovaImpresa</strong>.</p>' +
      '<p style="margin:0 0 16px;">Da ora hai accesso a tutte le funzionalit&agrave; avanzate del portale: <strong>posizione prioritaria</strong> nei risultati, maggiore visibilit&agrave; e pi&ugrave; possibilit&agrave; di essere contattato dai clienti.</p>';
  } else if (isCandidato) {
    // I candidati non hanno il Gestionale: benvenuto semplice.
    subject = '🎉 Benvenuto su TrovaImpresa!';
    mostraRegalo = false;
    ctaTesto = 'Completa il tuo profilo &rarr;';
    corpo =
      '<p style="margin:0 0 16px;">' + saluto + '</p>' +
      '<p style="margin:0 0 16px;">grazie per esserti iscritto a <strong>TrovaImpresa.com</strong>.</p>' +
      '<p style="margin:0 0 16px;">Il tuo profilo &egrave; attivo, ma per farti trovare dalle imprese che cercano collaboratori nella tua zona deve essere <strong>completo</strong>: mestiere, esperienza, zona e curriculum. Un profilo a met&agrave; non viene notato.</p>';
  } else if (daGestionale) {
    /* ⛔ 18 SETTEMBRE 2026 — L'EMAIL DI CHI VIENE PER IL GESTIONALE.
       Non si e' iscritto per farsi trovare dai clienti: si e' iscritto per
       un programma, e lo vuole aprire. Quindi niente «vetrina gratis per
       sempre», niente «completa il profilo», niente 30 giorni.
       Una cosa sola: il prezzo che aveva scelto e il bottone per entrare. */
    subject = '\u2699\uFE0F Il tuo Gestionale TrovaImpresa \u2014 manca un passo';
    mostraRegalo = false;
    ctaTesto = 'Entra e attiva &rarr;';
    const rigaPrezzo = pianoScelto && NOMI_PIANO[pianoScelto]
      ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">'
        + '<tr><td style="background:#eaf2ff;border-radius:10px;padding:14px 16px;">'
        + '<div style="font-size:13px;font-weight:800;color:#5a6b7b;letter-spacing:.4px;">IL PREZZO CHE AVEVI SCELTO</div>'
        + '<div style="font-size:18px;font-weight:800;color:#0a2a4d;margin-top:4px;">' + NOMI_PIANO[pianoScelto] + '</div>'
        + '</td></tr></table>'
      : '';
    corpo =
      '<p style="margin:0 0 16px;">' + saluto + '</p>' +
      '<p style="margin:0 0 16px;">il tuo account &egrave; pronto: <strong>la mail &egrave; confermata</strong> e il gestionale ti aspetta.</p>' +
      rigaPrezzo +
      '<p style="margin:0 0 16px;">Manca solo il pagamento. Premi il bottone qui sotto: entri nel gestionale e trovi il tuo prezzo con il tasto per attivarlo. Ci vuole un minuto, si paga con Stripe e si disdice quando vuoi.</p>' +
      '<p style="margin:0 0 16px;">Dentro ci trovi lavori, preventivi e fatture, computo metrico e stati di avanzamento, clienti e fornitori, mezzi, squadra, scadenze e l&rsquo;AI che ti compila i moduli.</p>' +
      '<p style="margin:0 0 16px;color:#5a6b7b;font-size:14px;">Insieme al gestionale ti arriva anche un profilo su TrovaImpresa, dove i clienti cercano imprese e artigiani. Non devi compilare niente: se non ti serve, ignoralo.</p>';
  } else {
    /* ⛔ 13 SETTEMBRE 2026 — VIA IL REGALO DEI 3 MESI.
       Alex: «togliere i tre mesi gratis a tutti i nuovi iscritti perche'
       ormai il progetto e' cambiato — a pagamento e' solamente il
       Gestionale e il Gestionale AI, tutto il resto rimane attivo».
       Prima questa email prometteva «3 mesi in regalo» e una
       fascia viola col regalo. Adesso il trigger del database scrive
       piano='free', quindi quella promessa sarebbe una bugia al primo
       messaggio che l'iscritto riceve da noi.
       La riga che deve restare in cima, sempre (regola di Alex del 2 set):
       stare su TrovaImpresa e' gratis e non costa nulla. */
    subject = '🎉 Benvenuto su TrovaImpresa — la tua vetrina &egrave; online';
    mostraRegalo = true;
    ctaTesto = 'Completa il tuo profilo &rarr;';
    corpo =
      '<p style="margin:0 0 16px;">' + saluto + '</p>' +
      '<p style="margin:0 0 16px;">grazie per esserti iscritto a <strong>TrovaImpresa.com</strong>.</p>' +
      '<p style="margin:0 0 16px;">La tua vetrina &egrave; attiva ed &egrave; <strong>gratis. E resta gratis</strong>: niente scadenze, niente carta, nessun addebito. Foto dei lavori, video, recensioni, messaggi dai clienti &mdash; &egrave; tutto tuo senza pagare niente.</p>' +
      bloccoProfilo +
      '<p style="margin:0 0 16px;color:#5a6b7b;font-size:14px;">L&rsquo;unica cosa a pagamento &egrave; il <strong>gestionale</strong> &mdash; preventivi, fatture, cantieri, computo metrico. Da <strong>249 &euro; l&rsquo;anno</strong>, oppure 29 &euro; al mese: lo attivi dal tuo pannello quando vuoi.</p>';
  }

  /* ⛔ 11 settembre 2026 — «COME CI HAI CONOSCIUTO?» DENTRO L'EMAIL.
     La stessa domanda sta gia' nella schermata dopo l'iscrizione, ma li' ha
     raccolto →4← risposte in due mesi: quella pagina la gente la chiude subito
     per andare a leggere la mail. Qui l'iscritto e' gia' dentro e sta gia'
     leggendo: un clic non costa niente e non rovina niente.
     Sei bottoni, un tocco, finisce li'. Se manca lo user_id il blocco non
     compare: meglio niente che un bottone che non scrive. */
  const SONDAGGIO = [
    { v: 'facebook',    t: 'Facebook' },
    { v: 'instagram',   t: 'Instagram' },
    { v: 'google',      t: 'Google' },
    { v: 'passaparola', t: 'Un amico' },
    { v: 'linkedin',    t: 'LinkedIn' },
    { v: 'altro',       t: 'Altro' }
  ];

  function bottoneSondaggio(s) {
    const url = 'https://trovaimpresa.com/.netlify/functions/sondaggio'
              + '?u=' + encodeURIComponent(userId)
              + '&r=' + encodeURIComponent(s.v)
              + '&t=' + encodeURIComponent(tipo || '');
    return '<td style="padding:0 5px 8px 0;">'
      + '<a href="' + url + '" style="display:inline-block;padding:9px 15px;font-size:14px;'
      + 'font-weight:700;color:#0a2a4d;background:#f0f3f7;border:1px solid #dbe3ec;'
      + 'border-radius:999px;text-decoration:none;">' + s.t + '</a></td>';
  }

  const bloccoSondaggio = userId
    ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 20px;border-top:1px solid #e5e7eb;">'
      + '<tr><td style="padding-top:18px;">'
        + '<div style="font-size:15px;font-weight:800;color:#0a2a4d;margin-bottom:10px;">'
          + 'Un&rsquo;ultima curiosit&agrave;: come ci hai conosciuto?</div>'
        + '<div style="font-size:13.5px;color:#5a6b7b;margin-bottom:12px;line-height:1.55;">'
          + 'Un tocco e basta. Mi serve per capire dove farmi trovare dalle persone come te.</div>'
        + '<table role="presentation" cellpadding="0" cellspacing="0"><tr>'
          + SONDAGGIO.slice(0, 3).map(bottoneSondaggio).join('')
        + '</tr><tr>'
          + SONDAGGIO.slice(3).map(bottoneSondaggio).join('')
        + '</tr></table>'
      + '</td></tr></table>'
    : '';

  const fasciaRegalo = mostraRegalo
    ? '<tr><td style="background:#1e8e3e;padding:13px 32px;text-align:center;color:#ffffff;font-size:15px;font-weight:700;">✓ La tua vetrina su TrovaImpresa &egrave; gratis, per sempre</td></tr>'
    : '';

  const html =
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;margin:0;padding:24px 0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Arial,sans-serif;">' +
      '<tr><td align="center">' +
        '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(10,42,77,0.08);">' +
          '<tr><td style="background:#ffffff;padding:20px 32px 4px;text-align:center;">' +
            '<a href="https://trovaimpresa.com" style="text-decoration:none"><img src="https://trovaimpresa.com/img/logo-email.png" width="220" alt="TrovaImpresa" style="width:220px;max-width:70%;height:auto;border:0;display:block;margin:0 auto"></a>' +
          '</td></tr>' +
          '<tr><td style="background:#0066ff;padding:26px 32px;text-align:center;">' +
            '<div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">🏗️ TrovaImpresa</div>' +
            '<div style="font-size:13px;color:#dbe8ff;margin-top:4px;">Il portale delle imprese e degli artigiani</div>' +
          '</td></tr>' +
          fasciaRegalo +
          '<tr><td style="padding:32px;color:#1a2733;font-size:15px;line-height:1.65;">' +
            corpo +
            '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px auto 22px;"><tr>' +
              '<td align="center" style="border-radius:9px;background:#0066ff;">' +
                '<a href="' + (daGestionale ? 'https://trovaimpresa.com/gestionale-app.html' : linkPannello) + '" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:9px;">' + (ctaTesto || 'Vai al tuo pannello &rarr;') + '</a>' +
              '</td>' +
            '</tr></table>' +
            bloccoSondaggio +
            '<p style="margin:0 0 16px;">Resto a disposizione per qualsiasi necessit&agrave; o chiarimento tramite questo indirizzo email.</p>' +
            '<p style="margin:0;">Un cordiale saluto,<br><strong>Il Team di TrovaImpresa.com</strong></p>' +
          '</td></tr>' +
          '<tr><td style="background:#0a2a4d;padding:18px 32px;text-align:center;color:#a9c9f5;font-size:13px;line-height:1.5;">' +
            '&copy; 2026 TrovaImpresa &ndash; Alessio Pinto &ndash; Rieti (RI)<br>' +
            '<a href="mailto:info@trovaimpresa.com" style="color:#a9c9f5;text-decoration:underline;">info@trovaimpresa.com</a> &middot; ' +
            '<a href="https://trovaimpresa.com/privacy-policy.html" style="color:#a9c9f5;text-decoration:underline;">Privacy</a>' +
          '</td></tr>' +
        '</table>' +
      '</td></tr>' +
    '</table>';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'TrovaImpresa <info@trovaimpresa.com>',
        to: [email],
        subject,
        html
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { statusCode: 500, body: 'Errore Resend: ' + errBody };
    }

    // Notifica admin: avvisa info@trovaimpresa.com di ogni nuova iscrizione/upgrade.
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'TrovaImpresa <info@trovaimpresa.com>',
          to: ['info@trovaimpresa.com'],
          subject: (premium ? '⭐ Ha attivato il Gestionale: ' : '🔔 Nuova iscrizione: ')
                   + (nome || 'senza nome') + ' (' + (tipo || 'n/d') + ')',
          html: '<h2>' + (premium ? 'Ha attivato il Gestionale' : 'Nuova iscrizione') + ' su TrovaImpresa</h2>'
                + '<p><strong>Nome:</strong> ' + (nome || '—') + '</p>'
                + '<p><strong>Email:</strong> ' + email + '</p>'
                + '<p><strong>Tipo:</strong> ' + (tipo || '—') + '</p>'
                + (premium ? '<p><strong>Gestionale:</strong> sì</p>' : '')
        })
      });
    } catch (e) {
      // notifica admin fallita: ignorata di proposito
    }

    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    return { statusCode: 500, body: 'Errore: ' + err.message };
  }
};
