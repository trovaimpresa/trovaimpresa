/* ⛔ L'INTERRUTTORE DEL GESTIONALE BASE GRATIS — UN SOLO POSTO (3 ott 2026).
   false = come prima: il gestionale e' solo per chi ha il piano o la prova.
   true  = il gestionale base e' gratis per chi e' iscritto: i pannelli
           mostrano la schermata nuova, il cancello fa entrare chi non ha il
           piano e chiede il profilo minimo (7 voci) a chi non paga.
   ⚠️ SI ACCENDE DOPO il database. L'ordine e' questo:
      1) su Supabase: gest_base_aperto() → 'select true'
         (create or replace function public.gest_base_aperto() returns boolean
          language sql immutable set search_path to 'pg_catalog' as 'select true';)
      2) qui sotto: true, commit e push.
   Se si accende questo e non il database, chi entra non puo' salvare niente.
   Per spegnere: l'inverso, prima questo e poi il database. */
window.GESTIONALE_BASE_APERTO = false;
