// Banco della Chat con AI allo STUDIO TECNICO (24 nov 2026, collaudo voce «Chat con AI»).
// Si lancia: node tools/banco-chat-studio.mjs   — non chiama né Anthropic né Supabase.
import * as C from '../netlify/functions/chat-gestionale.mjs';
let ko = 0, ok = 0;
const prova = (nome, vero) => { if (vero) { ok++; } else { ko++; console.log('✗', nome); } };
const st = C.istruzioniFisse('professionista'), im = C.istruzioniFisse('impresa');
prova('nessun pezzo del manuale dello studio perso', C.STUDIO_PEZZI_PERSI.length === 0);
for (const w of ['Lavori e interventi', 'crea lavoro', "Conferma d'ordine", 'Oggi, Lavori', 'Wahid', "app dell'operaio", 'Squadra e agenda', 'Mezzi e attrezzature', 'cliente, lavoro, preventivo'])
  prova('allo studio non c\'è «' + w + '»', st.indexOf(w) < 0);
for (const w of ['«Pratiche»', '«+ Nuova pratica»', '«Accettato → crea pratica»', '«🧾 Crea fattura»', '«Lettera d\'incarico»', 'Collaboratori', '«+ Nuovo strumento»', 'Assistente, Pratiche'])
  prova('allo studio c\'è ' + w, st.indexOf(w) >= 0);
prova('all\'impresa il manuale resta quello di prima', im.indexOf('«Accettato, crea lavoro»') >= 0 && im.indexOf('Wahid') >= 0 && im.indexOf('MANUALE DELLO STUDIO') < 0);
prova('impresa e artigiano hanno lo stesso testo fisso (memoria condivisa)', C.istruzioniFisse('artigiano') === im && C.istruzioniFisse() === im);
prova('regola «cosa deve fare una persona» per tutti', im.indexOf('COSA DEVE FARE UNA PERSONA') >= 0 && st.indexOf('COSA DEVE FARE UNA PERSONA') >= 0);
const pr = C.PAROLE_RUOLO.professionista;
prova('studio: ritenuta già tolta, mai imponibile il numero più basso', /GIÀ TOLTA la ritenuta/.test(pr) && /Mai chiamare «imponibile» il numero più basso/.test(pr));
prova('studio: stato della pratica come sta scritto', /senza dedurlo/.test(pr));
// letture
const U = '11111111-1111-4111-8111-111111111111', M = '22222222-2222-4222-8222-222222222222', G = '33333333-3333-4333-8333-333333333333';
const q1 = C.costruisciLettura('lavori', U, M, { persona: G, escludiStato: 'fatto' });
prova('lavori: legge operatore_id', /operatore_id/.test(q1.campi));
prova('lavori: filtro persona con id vero', q1.persona === G);
prova('lavori: filtro persona sbagliato buttato', !C.costruisciLettura('lavori', U, M, { persona: "x' or 1=1" }).persona);
prova('ore: filtro persona', C.costruisciLettura('ore', U, M, { persona: G }).persona === G);
prova('clienti: il filtro persona non vale', !C.costruisciLettura('clienti', U, M, { persona: G }).persona);
prova('i due filtri di sicurezza restano', q1.filtri.user_id === U && q1.filtri.mestiere_id === M);
const pt = C.costruisciLettura('preventivi_totali', U, M, {});
prova('parcella: cassa e ritenuta leggibili', /cassa/.test(pt.campi) && /ritenuta/.test(pt.campi) && /compenso/.test(pt.campi));
const schema = JSON.stringify(C.STRUMENTI.find(s => s.name === 'elenco_cose').input_schema);
prova('elenco_cose ha il filtro persona', /"persona"/.test(schema));
console.log((ko ? '✗ ' : '✓ ') + ok + ' verdi, ' + ko + ' rosse');
process.exit(ko ? 1 : 0);
