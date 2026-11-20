// I testi dei post per la pagina Facebook «Trova impresa» (20 novembre 2026).
// Un posto solo: li usano fb-testo.js (la pagina con «Copia» e «Apri Facebook»)
// e fb-riepilogo.js (l'email del mattino ad Alessio).
//
// ⛔ Nel post NON vanno telefono ed email: per i subappalti stanno dietro un
//    clic sulla pagina dell'annuncio (scelta di Alex del 6 set 2026).
const SITO = 'https://trovaimpresa.com';

const pulisci = s => String(s ?? '').replace(/\s+/g, ' ').trim();
const taglia = (s, n) => { s = pulisci(s); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
const primaRiga = s => String(s ?? '').split(/\r?\n/).map(x => x.trim()).find(Boolean) || '';
const hashtag = s => pulisci(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const maiuscola = s => { s = pulisci(s); return s ? s[0].toUpperCase() + s.slice(1) : s; };

const linkSubappalto = id => `${SITO}/subappalto-annuncio?id=${encodeURIComponent(id)}`;
const linkOfferta = id => `${SITO}/offerta-lavoro.html?id=${encodeURIComponent(id)}`;
const linkImpresa = id => `${SITO}/profilo-impresa?id=${encodeURIComponent(id)}`;

function testoSubappalto(a) {
  const link = linkSubappalto(a.id);
  const righe = [
    a.tipo === 'cerca' ? '🔎 Cercasi subappaltatori' : '🏗️ Impresa disponibile per subappalti',
    a.nome_impresa ? `👷 ${pulisci(a.nome_impresa)}` : null,
    a.lavoro ? `🔧 ${taglia(primaRiga(a.lavoro), 160)}` : null,
    a.citta ? `📍 ${taglia(a.citta, 80)}` : null,
    '',
    '👉 Leggi l\'annuncio e contatta direttamente l\'impresa:',
    link,
    '',
    'Pubblica anche tu un subappalto o un\'offerta di lavoro, gratis:',
    `${SITO}/lavoro-edilizia`,
    '',
    '#subappalti #edilizia #lavoroedilizia #trovaimpresa'
  ];
  return { titolo: `Subappalto — ${pulisci(a.nome_impresa) || 'senza nome'}`, testo: righe.filter(r => r !== null).join('\n'), link };
}

function testoOfferta(o) {
  const link = linkOfferta(o.id);
  const c = pulisci(o.citta), p = pulisci(o.provincia);
  const dove = c && p ? `${c} (${p})` : (c || p);
  const righe = [
    '💼 Offerta di lavoro in edilizia',
    o.titolo ? `🔧 ${taglia(o.titolo, 120)}` : null,
    o.nome_azienda ? `👷 ${pulisci(o.nome_azienda)}` : null,
    dove ? `📍 ${dove}` : null,
    o.tipo_contratto ? `📄 ${taglia(o.tipo_contratto, 60)}` : null,
    o.stipendio ? `💶 ${taglia(o.stipendio, 60)}` : null,
    '',
    '👉 Leggi l\'offerta e candidati:',
    link,
    '',
    'Altri subappalti e offerte di lavoro, gratis:',
    `${SITO}/lavoro-edilizia`,
    '',
    '#lavoro #edilizia #offertedilavoro #trovaimpresa'
  ];
  return { titolo: `Offerta di lavoro — ${pulisci(o.titolo) || 'senza titolo'}`, testo: righe.filter(r => r !== null).join('\n'), link };
}

const TIPI = { impresa: 'Impresa edile', artigiano: 'Artigiano', professionista: 'Studio tecnico', negozio: 'Negozio' };

function testoIscritto(i) {
  const link = linkImpresa(i.id);
  const nome = pulisci(i.nome_attivita) || pulisci(i.nome);
  const mestiere = maiuscola(i.mestiere) || TIPI[i.tipo] || '';
  const citta = pulisci(i.citta);
  const tagCitta = hashtag(citta);
  const righe = [
    '🏗️ Nuovo su TrovaImpresa!',
    nome ? `👷 ${nome}` : null,
    mestiere ? `🔧 ${mestiere}` : null,
    citta ? `📍 ${citta}${i.provincia && pulisci(i.provincia) !== citta ? ' (' + pulisci(i.provincia) + ')' : ''}` : null,
    '',
    '👉 Guarda la scheda e chiedi un preventivo, gratis:',
    link,
    '',
    'Hai un\'impresa o sei un artigiano? La tua vetrina su TrovaImpresa è gratis:',
    `${SITO}/iscriviti`,
    '',
    '#edilizia #artigiani' + (tagCitta ? ' #' + tagCitta : '') + ' #trovaimpresa'
  ];
  return { titolo: `Nuovo iscritto — ${nome || 'senza nome'}`, testo: righe.filter(r => r !== null).join('\n'), link };
}

// I marchi della pubblicita' della home (Awin). Stessi id e frasi di
// js/locandine-home.js e js/marchio-in-guida.js: se ne entra uno nuovo,
// va aggiunto anche qui. Rowenta e Moulinex no (c'entrano poco coi lavori).
const AWIN_ME = '3137864';
const MARCHI = {
  plenitude: { id: 9529,   nome: 'Plenitude',  tag: 'plenitude', frase: 'Plenitude (gruppo Eni): luce e gas per la casa, fotovoltaico, climatizzatori e caldaie con installazione.' },
  vevor:     { id: 118433, nome: 'Vevor',      tag: 'vevor',     frase: 'Betoniere, ponteggi, attrezzi e macchinari da cantiere a buon prezzo.' },
  gagliardi: { id: 54303,  nome: 'Gagliardi',  tag: 'gagliardi', frase: 'Materiale elettrico, idraulico e videosorveglianza di marca, con spedizione rapida.' },
  trotec:    { id: 115365, nome: 'Trotec',     tag: 'trotec',    frase: 'Deumidificatori, misuratori di umidità e utensili per chi lavora in casa e in cantiere.' },
  vonroc:    { id: 126387, nome: 'Vonroc',     tag: 'vonroc',    frase: 'Trapani, smerigliatrici e utensili elettrici per casa e giardino.' },
  lampade:   { id: 10404,  nome: 'Lampade.it', tag: 'lampade',   frase: 'Lampade, faretti e illuminazione per ogni stanza, anche a LED.' },
  comet:     { id: 23030,  nome: 'Comet',      tag: 'comet',     frase: 'Elettrodomestici, climatizzatori e illuminazione per la casa nuova.' },
  kasanova:  { id: 17198,  nome: 'Kasanova',   tag: 'kasanova',  frase: 'Casalinghi, cucina e arredo per completare la casa dopo i lavori.' }
};
// ⛔ Plenitude NO: nel suo programma Awin c'e' scritto «Le attivita' sui social
// (Instagram e Facebook) sono assolutamente vietate» (controllato il 20 nov 2026).
const GIRO = ['vevor', 'gagliardi', 'trotec', 'vonroc', 'lampade', 'comet', 'kasanova'];
// il marchio del giorno: uno diverso ogni giorno, in giro
function marchioDelGiorno(d = new Date()) {
  const g = Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 864e5);
  return GIRO[g % GIRO.length];
}

function testoMarchio(chiave) {
  const m = MARCHI[chiave];
  if (!m) return null;
  // link corto: netlify.toml lo gira su Awin (con clickref=facebook, per sapere da dove arriva)
  const link = `${SITO}/vai/${chiave}`;
  const righe = [
    `🛠️ ${m.nome}`,
    m.frase,
    '',
    '👉 Guarda le offerte:',
    link,
    '',
    'Stai facendo lavori? Trova l\'impresa o l\'artigiano giusto, gratis:',
    SITO,
    '',
    `Pubblicità · link affiliato #adv #${m.tag} #casa #edilizia #trovaimpresa`
  ];
  return { titolo: `Pubblicità — ${m.nome}`, testo: righe.join('\n'), link };
}

module.exports = { SITO, MARCHI, GIRO, marchioDelGiorno, testoSubappalto, testoOfferta, testoIscritto, testoMarchio };
