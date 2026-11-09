/* 9 nov 2026 — stessa regola del database (public.testo_ha_link):
   vero se nel testo c'e' un link. Le email e i link a trovaimpresa
   restano permessi. */
module.exports = function haLink(t) {
  const s = String(t || '').replace(/\S+@\S+/g, ' ').replace(/(https?:\/\/)?(www\.)?trovaimpresa\.(com|it)\S*/gi, ' ');
  if (/(https?:\/\/|www\.|wa\.me\/|t\.me\/)/i.test(s)) return true;
  if (/\b[A-Za-z0-9-]{2,}\.(com|it|net|org|eu|ly|xyz|top|info|link|app|site|online|shop|click|ru|cn|biz|store|live|gl|tk|ml|ga|cf|gq|ws|cc)\b/.test(s)) return true;
  return /\b[A-Za-z0-9-]{2,}\.(io|me|co|to)\//.test(s);
};
