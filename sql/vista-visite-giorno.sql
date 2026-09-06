-- 6 settembre 2026 — VISTA: quante PERSONE aprono il sito, giorno per giorno.
-- Serve alle due caselle in cima alla dashboard admin ("Hanno aperto il sito
-- ieri" / "oggi"), lette da netlify/functions/admin-visite.js con service_role.
-- "Persone" = sessioni diverse: js/conta-visita.js scrive una riga per pagina
-- vista, con lo stesso codice sessione per tutta la visita.
-- Il giorno e' all'ora italiana: il server Netlify sta a UTC, senza questo
-- dopo mezzanotte "oggi" sarebbe ancora ieri.
-- GIA' APPLICATA su Supabase il 6 settembre 2026.
create or replace view public.visite_giorno as
select (v.creato_il at time zone 'Europe/Rome')::date as giorno,
       count(distinct v.sessione)::int as persone,
       count(*)::int as pagine
from public.visite_sito v
where v.creato_il > now() - interval '60 days'
group by 1;
