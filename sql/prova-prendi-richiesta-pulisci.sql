-- =====================================================================
-- BUTTA VIA LA PROVA DAL VIVO — 18 agosto 2026
--
-- Toglie la richiesta finta e il suo link creati da
-- `sql/prova-prendi-richiesta.sql`. Prima di cancellare, dice se
-- l'impresa aveva chiesto i contatti: e' l'unica cosa che serviva sapere.
-- =====================================================================

with letto as (
  select i.id as id_inviata, i.richiesta_id, i.contatto_visto_at
    from public.richieste_inviate i
   where i.token = 'prova-18-agosto'
), via1 as (
  delete from public.richieste_inviate
   where id in (select id_inviata from letto)
  returning 1
), via2 as (
  delete from public.richieste_clienti
   where id in (select richiesta_id from letto)
  returning 1
)
select coalesce((select count(*) from via1), 0)                        as link_cancellati,
       coalesce((select count(*) from via2), 0)                        as richieste_cancellate,
       coalesce((select case when contatto_visto_at is null
                             then 'NO — nessuno ha premuto il pulsante'
                             else 'SI, il ' || to_char(contatto_visto_at, 'DD/MM/YYYY HH24:MI') end
                   from letto), 'non c''era niente da pulire')         as contatti_erano_stati_chiesti;
