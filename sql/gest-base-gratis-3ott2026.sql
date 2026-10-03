-- 3 ottobre 2026 — IL GESTIONALE BASE GRATIS: l'interruttore del database.
-- (gia' applicato su Supabase come migrazione
--  gestionale_base_gratis_interruttore_spento_3ott2026, con l'interruttore SPENTO)
--
-- gest_base_aperto() = false  → come prima: scrive solo chi ha piano o prova.
-- gest_base_aperto() = true   → scrive anche chi e' iscritto (ha una riga in imprese).
-- Il guardiano gest_blocco_piano non si tocca: decide sempre gest_piano_ok.
--
-- PER ACCENDERE (PRIMA il database, POI js/gestionale-base.js):
--   create or replace function public.gest_base_aperto()
--    returns boolean language sql immutable set search_path to 'pg_catalog' as 'select true';
-- PER SPEGNERE (PRIMA js/gestionale-base.js, POI il database):
--   create or replace function public.gest_base_aperto()
--    returns boolean language sql immutable set search_path to 'pg_catalog' as 'select false';

create or replace function public.gest_base_aperto()
 returns boolean
 language sql
 immutable
 set search_path to 'pg_catalog'
as 'select false';

create or replace function public.gest_piano_ok(_titolare uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public', 'pg_catalog'
as $function$
  select exists (
    select 1
      from public.imprese i
     where i.user_id = _titolare
       and (
            -- il piano vero
            (lower(btrim(coalesce(i.piano, ''))) = 'premium'
             and (i.premium_scadenza is null or i.premium_scadenza >= now()))
            -- oppure la prova di 30 giorni, finche' dura
            or (i.gest_prova_fine is not null and i.gest_prova_fine > now())
            -- oppure il gestionale base gratis, quando l'interruttore e' acceso
            or public.gest_base_aperto()
           )
  );
$function$;
