// 22 ott 2026: una email automatica parte UNA volta sola per chiave.
// Il 21 ottobre la stessa email e' partita tre volte alle stesse imprese:
// Netlify aveva lanciato la funzione tre volte. Prima di mandare si scrive la
// chiave in email_una_volta (sql/email-una-volta.sql): se c'e' gia', l'email
// e' gia' partita. Se la tabella non risponde si manda lo stesso: meglio un
// doppione raro che un avviso perso.
async function unaVolta(sb, chiave) {
  const { error } = await sb.from('email_una_volta').insert({ chiave });
  if (!error) return true;
  if (error.code === '23505') return false;
  console.error('email_una_volta:', error.message);
  return true;
}
module.exports = { unaVolta };
