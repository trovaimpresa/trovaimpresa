-- =====================================================================
-- CORREZIONE URGENTE — le note del calendario non si salvavano piu'
-- Da salvare come  sql/gest-cestino-fix-note.sql
-- Incolla in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 9 agosto 2026, poche ore dopo sql/gest-cestino.sql.
--
-- COSA ERA SUCCESSO
-- Per far funzionare il cestino, gest-cestino.sql aveva tolto il vincolo
-- "un giorno = una nota" e messo al suo posto un indice unico PARZIALE
-- (valido solo sulle righe non eliminate).
-- Ma il gestionale salva la nota con un upsert "ON CONFLICT (user_id,
-- mestiere_id, data)", e Postgres NON accetta un indice parziale come
-- arbitro di ON CONFLICT: rispondeva errore 42P10 e la nota non si salvava.
--
-- LA SCELTA
-- Le note escono dal cestino e tornano a cancellarsi davvero. Una nota del
-- calendario e' una riga di testo: recuperarla vale meno del danno di non
-- poterla piu' scrivere. Il vincolo torna intero.
-- (Nel codice: gest_note e' stata tolta dall'elenco in js/cestino.js.)
-- =====================================================================

-- via l'indice parziale messo da gest-cestino.sql
drop index if exists public.gest_note_giorno_uniq;

-- e torna il vincolo vero, quello che ON CONFLICT sa usare
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'gest_note_user_id_mestiere_id_data_key'
       and conrelid = 'public.gest_note'::regclass
  ) then
    alter table public.gest_note
      add constraint gest_note_user_id_mestiere_id_data_key
      unique (user_id, mestiere_id, data);
  end if;
end$$;

-- le note eventualmente finite nel cestino in queste ore tornano visibili:
-- se restassero li' dentro occuperebbero il loro giorno senza farsi vedere
update public.gest_note set eliminato_il = null where eliminato_il is not null;

-- ---------------------------------------------------------------------
-- VERIFICA: deve elencare il vincolo unique
-- ---------------------------------------------------------------------
-- select conname, contype from pg_constraint
--  where conrelid = 'public.gest_note'::regclass and contype = 'u';
