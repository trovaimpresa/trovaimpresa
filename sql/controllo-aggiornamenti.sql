-- ============================================================
-- IL CONTROLLO DEGLI AGGIORNAMENTI DEL DATABASE — 19 settembre 2026
-- ============================================================
-- A cosa serve.
-- Il gestionale e' pieno di messaggi tipo «esegui sql/gest-sal-fattura.sql
-- su Supabase». Quei messaggi compaiono quando nel database manca una
-- colonna o una tabella che il codice si aspetta — cioe' quando ho scritto
-- una funzione nuova e mi sono DIMENTICATO di eseguire il suo file sql.
--
-- Il database e' UNO SOLO per tutti gli iscritti: se un aggiornamento c'e',
-- c'e' per tutti; se manca, e' rotto per tutti insieme. Quindi non serve
-- controllare «iscritto per iscritto»: basta guardare lo schema una volta.
--
-- Perche' una funzione nel database e non un controllo nel browser.
-- Controllare 97 cose dal browser vuol dire 97 domande al database a ogni
-- apertura. E' esattamente il difetto tolto il 18 settembre (28 domande
-- inutili all'avvio, 16,8 secondi di attesa). Cosi' invece e' UNA domanda
-- sola: il browser manda l'elenco di quello che si aspetta, il database
-- risponde con quello che manca. Se non manca niente, risponde zero righe.
--
-- Chi la puo' chiamare: solo chi ha fatto l'accesso (authenticated).
-- Cosa legge: solo i NOMI di tabelle e colonne. Nessun dato di nessuno.
-- SECURITY INVOKER: gira coi permessi di chi chiama, non con i miei.
-- ============================================================

create or replace function public.gest_schema_mancanti(attese jsonb)
returns table (tipo text, file text, oggetto text)
language sql
stable
security invoker
set search_path = public, pg_catalog
as $$
  select
    x.k,
    x.f,
    x.t || case when coalesce(x.c,'') = '' then '' else '.' || x.c end
  from jsonb_to_recordset(attese) as x(k text, f text, t text, c text)
  where
    case
      -- una COLONNA dentro una tabella o una vista
      when x.k = 'colonna' then not exists (
        select 1 from information_schema.columns ic
        where ic.table_schema = 'public'
          and ic.table_name  = x.t
          and ic.column_name = x.c
      )
      -- una FUNZIONE del database
      when x.k = 'funzione' then not exists (
        select 1
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = x.t
      )
      -- una TABELLA o una VISTA
      else not exists (
        select 1 from information_schema.tables it
        where it.table_schema = 'public' and it.table_name = x.t
      ) and not exists (
        select 1 from information_schema.views iv
        where iv.table_schema = 'public' and iv.table_name = x.t
      )
    end;
$$;

revoke all on function public.gest_schema_mancanti(jsonb) from public, anon;
grant execute on function public.gest_schema_mancanti(jsonb) to authenticated;

comment on function public.gest_schema_mancanti(jsonb) is
  'Dice quali aggiornamenti del database mancano. Riceve l''elenco di quello che il codice si aspetta (js/fondatore.js) e risponde con quello che non c''e''. Legge solo nomi, mai dati.';
