-- =====================================================================
-- PROVA DAL VIVO — 18 agosto 2026
--
-- Crea una richiesta FINTA e il suo link, cosi' la pagina «Voglio
-- contattarlo» si puo' aprire davvero sul sito online e si vede con gli
-- occhi che il telefono NON esce prima del clic.
--
-- Il telefono e' finto apposta: 399 000 0000 non e' un numero italiano
-- valido, quindi anche se qualcuno lo componesse non chiamerebbe nessuno.
--
-- Si puo' rilanciare quante volte si vuole: la seconda volta non crea
-- niente e ridice il link. Alla fine si butta via tutto con
-- `sql/prova-prendi-richiesta-pulisci.sql`.
-- =====================================================================

with finta as (
  insert into public.richieste_clienti (nome, telefono, email, categoria, zona, ricerca)
  select 'PROVA — non chiamare', '3990000000', 'prova@trovaimpresa.com',
         'imprese', 'Rieti', 'PROVA del 18 agosto: rifacimento bagno'
   where not exists (select 1 from public.richieste_inviate
                      where token = 'prova-18-agosto')
  returning id
), segno as (
  insert into public.richieste_inviate (richiesta_id, impresa_id, token, email_inviata_a)
  select id, 0, 'prova-18-agosto', 'prova@trovaimpresa.com' from finta
  returning id
)
select case when exists (select 1 from segno) then 'CREATA ADESSO' else 'C''ERA GIA''' end
         as esito,
       'https://trovaimpresa.com/prendi-richiesta?t=prova-18-agosto' as link_da_aprire;
