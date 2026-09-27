/* =====================================================================
   FRENO SULLA PASSWORD ADMIN — 27 settembre 2026
   Prima la password del pannello admin si poteva provare all'infinito.
   Adesso ogni funzione admin chiede qui prima di controllarla:
   10 errori dallo stesso indirizzo in 15 minuti (o 100 da tutti) e si
   blocca per 15 minuti, anche con la password giusta.
   Il conto lo tiene il database (tabella admin_tentativi, funzione
   admin_freno, chiamabile solo con la chiave di servizio).
   ⚠️ Se il database non risponde NON si blocca: meglio un freno in meno
   che Alessio chiuso fuori dal suo pannello.
   ⚠️ Sta in una cartella "lib" apposta: Netlify non la tratta come funzione.
   ===================================================================== */
module.exports = async function frenoAdmin(event, esito) {
  const URL = process.env.SUPABASE_URL || 'https://nacvrsgkyfavykxjxszu.supabase.co';
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!KEY) return false;
  const h = (event && event.headers) || {};
  const ip = h['x-nf-client-connection-ip'] || String(h['x-forwarded-for'] || '').split(',')[0].trim() || '?';
  try {
    const r = await fetch(URL + '/rest/v1/rpc/admin_freno', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_ip: ip, p_esito: !!esito })
    });
    if (!r.ok) return false;
    return (await r.json()) === true;
  } catch (e) {
    return false;
  }
};
