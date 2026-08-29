// Email di benvenuto inviata alla registrazione.
// Ogni nuovo iscritto riceve 3 mesi di Premium in regalo (reverse trial):
// il piano premium + scadenza 3 mesi viene impostato dal trigger DB
// crea_profilo_impresa; qui inviamo la mail che lo annuncia.
// Body atteso: { nome, email, tipo, premium }
//  - premium: true  -> email "grazie per il passaggio a Premium" (upgrade pagato)
//  - premium: false/assente -> email di benvenuto con regalo 3 mesi Premium

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
  //  L'email di passaggio a Premium (premium: true) e' un'altra cosa e non
  //  passa da questo controllo.
  // ------------------------------------------------------------------
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

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
                + '?email=eq.' + emailEnc + '&benvenuto_inviato=is.false&select=id';
      const r = await fetch(url, {
        method: 'PATCH',
        headers: sbHeaders,
        body: JSON.stringify({ benvenuto_inviato: true })
      });
      if (!r.ok) return null;              // tabella o colonna diversa: non blocco l'invio
      const righe = await r.json();
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
  const linkPannello = 'https://trovaimpresa.com/' + pannello;
  const isCandidato = tipo === 'candidato';

  let subject, corpo, mostraRegalo, ctaTesto;

  // Il pezzo piu' importante di tutta l'email: senza profilo completo
  // l'iscritto resta invisibile e il portale non puo' fare niente per lui.
  // Va detto subito e chiaro, altrimenti legge "ti ho regalato il Premium",
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
    subject = '⭐ Grazie per essere passato a TrovaImpresa Premium!';
    mostraRegalo = false;
    ctaTesto = 'Vai al tuo pannello &rarr;';
    corpo =
      '<p style="margin:0 0 16px;">' + saluto + '</p>' +
      '<p style="margin:0 0 16px;">grazie per aver scelto <strong>TrovaImpresa Premium</strong>.</p>' +
      '<p style="margin:0 0 16px;">Da ora hai accesso a tutte le funzionalit&agrave; avanzate del portale: <strong>posizione prioritaria</strong> nei risultati, maggiore visibilit&agrave; e pi&ugrave; possibilit&agrave; di essere contattato dai clienti.</p>';
  } else if (isCandidato) {
    // I candidati non hanno il piano Premium: benvenuto semplice.
    subject = '🎉 Benvenuto su TrovaImpresa!';
    mostraRegalo = false;
    ctaTesto = 'Completa il tuo profilo &rarr;';
    corpo =
      '<p style="margin:0 0 16px;">' + saluto + '</p>' +
      '<p style="margin:0 0 16px;">grazie per esserti iscritto a <strong>TrovaImpresa.com</strong>.</p>' +
      '<p style="margin:0 0 16px;">Il tuo profilo &egrave; attivo, ma per farti trovare dalle imprese che cercano collaboratori nella tua zona deve essere <strong>completo</strong>: mestiere, esperienza, zona e curriculum. Un profilo a met&agrave; non viene notato.</p>';
  } else {
    // Nuova iscrizione business: regalo 3 mesi Premium.
    subject = '🎁 Benvenuto su TrovaImpresa – 3 mesi di Premium in regalo!';
    mostraRegalo = true;
    ctaTesto = 'Completa il tuo profilo &rarr;';
    corpo =
      '<p style="margin:0 0 16px;">' + saluto + '</p>' +
      '<p style="margin:0 0 16px;">grazie per esserti iscritto a <strong>TrovaImpresa.com</strong>.</p>' +
      '<p style="margin:0 0 16px;">Per darti il benvenuto e ringraziarti della fiducia, ho deciso di attivare sul tuo account il <strong>Piano Premium per i primi 3 mesi, in modo del tutto gratuito</strong>.</p>' +
      '<p style="margin:0 0 16px;">Con il Premium hai <strong>maggiore visibilit&agrave;</strong>, posizione prioritaria nei risultati di ricerca e pi&ugrave; possibilit&agrave; di essere contattato dai potenziali clienti. Il tuo account &egrave; gi&agrave; stato aggiornato e non &egrave; richiesta alcuna azione da parte tua.</p>' +
      '<p style="margin:0 0 16px;color:#5a6b7b;font-size:14px;">Allo scadere dei 3 mesi il tuo profilo torner&agrave; automaticamente al piano Free, <strong>senza alcun addebito</strong>.</p>' +
      bloccoProfilo;
  }

  const fasciaRegalo = mostraRegalo
    ? '<tr><td style="background:#7b1fa2;padding:13px 32px;text-align:center;color:#ffffff;font-size:15px;font-weight:700;">🎁 In regalo per te: 3 mesi di Premium gratis</td></tr>'
    : '';

  const html =
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;margin:0;padding:24px 0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Arial,sans-serif;">' +
      '<tr><td align="center">' +
        '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(10,42,77,0.08);">' +
          '<tr><td style="background:#0066ff;padding:26px 32px;text-align:center;">' +
            '<div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">🏗️ TrovaImpresa</div>' +
            '<div style="font-size:13px;color:#dbe8ff;margin-top:4px;">Il portale delle imprese e degli artigiani</div>' +
          '</td></tr>' +
          fasciaRegalo +
          '<tr><td style="padding:32px;color:#1a2733;font-size:15px;line-height:1.65;">' +
            corpo +
            '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px auto 22px;"><tr>' +
              '<td align="center" style="border-radius:9px;background:#0066ff;">' +
                '<a href="' + linkPannello + '" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:9px;">' + (ctaTesto || 'Vai al tuo pannello &rarr;') + '</a>' +
              '</td>' +
            '</tr></table>' +
            '<p style="margin:0 0 16px;">Resto a disposizione per qualsiasi necessit&agrave; o chiarimento tramite questo indirizzo email.</p>' +
            '<p style="margin:0;">Un cordiale saluto,<br><strong>Il Team di TrovaImpresa.com</strong></p>' +
          '</td></tr>' +
          '<tr><td style="background:#0a2a4d;padding:18px 32px;text-align:center;color:#a9c9f5;font-size:12px;line-height:1.5;">' +
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
          subject: (premium ? '⭐ Passaggio a Premium: ' : '🔔 Nuova iscrizione: ')
                   + (nome || 'senza nome') + ' (' + (tipo || 'n/d') + ')',
          html: '<h2>' + (premium ? 'Passaggio a Premium' : 'Nuova iscrizione') + ' su TrovaImpresa</h2>'
                + '<p><strong>Nome:</strong> ' + (nome || '—') + '</p>'
                + '<p><strong>Email:</strong> ' + email + '</p>'
                + '<p><strong>Tipo:</strong> ' + (tipo || '—') + '</p>'
                + (premium ? '<p><strong>Premium:</strong> sì</p>' : '')
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
