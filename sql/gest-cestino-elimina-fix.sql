-- =====================================================================
-- CORREZIONE — "Elimina per sempre" del cestino
-- Da salvare come  sql/gest-cestino-elimina-fix.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 10 agosto 2026, dopo il giro di prova sul profilo Impresa.
--
-- COSA ERA SUCCESSO
-- La funzione gest_cestino_elimina di ieri sera aveva tre buchi, trovati
-- provandola su un PostgreSQL vero con lo schema ricostruito dai file in sql/.
-- Tutti e tre si aprono nello stesso momento: quando si svuota per sempre un
-- REPARTO dal cestino (un reparto tira dietro fatture, fornitori, ore, mezzi).
--
--   1. Una riga raggiungibile da DUE strade (per esempio le ore lavorate, che
--      stanno sotto il reparto con "cancella a catena" e sotto la persona con
--      "azzera il riferimento") veniva tenuta a caso da "distinct on". Nei
--      test, 4 volte su 5 vinceva la copia sbagliata: la riga non veniva
--      contata come ostacolo e il database la cancellava, VIVA, in silenzio.
--      Stesso effetto sui conteggi: l'anteprima diceva 16 dove ne cancellava 40.
--
--   2. Il blocco sulle fatture EMESSE valeva solo se cliccavi la fattura.
--      Svuotando il reparto, le fatture numerate se ne andavano comunque:
--      il buco nella numerazione si apriva, che e' esattamente la cosa che
--      quel blocco doveva impedire.
--
--   3. Il motivo del rifiuto veniva deciso su tutto il gruppo invece che riga
--      per riga: 2 lavori vivi tuoi + 1 di un altro account diventavano un
--      solo "altro account, 3 righe".
--
-- In piu': una VISTA chiamata gest_* con le due colonne giuste passava tutti i
-- controlli, e siccome le viste non hanno chiavi esterne nessuna catena veniva
-- guardata. Adesso si accettano solo tabelle vere.
--
-- Il camminatore _gest_cascata NON si tocca: era giusto.
-- =====================================================================

set check_function_bodies = off;

create or replace function public.gest_cestino_elimina(
  p_tabella  text,
  p_id       uuid,
  p_conferma boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_uid      uuid := auth.uid();
  v_reg      regclass;
  v_n        bigint;
  v_num      text;
  v_fisc     jsonb;
  v_ostacoli jsonb;
  v_va       jsonb;
  v_scoll    jsonb;
  v_file     jsonb;
begin
  if v_uid is null then
    raise exception 'Non sei collegato.';
  end if;
  if p_tabella !~ '^gest_[a-z_]+$' then
    raise exception 'Tabella non ammessa.';
  end if;

  -- ----------------------------------------------------------------
  -- Deve essere una TABELLA VERA, che esiste davvero.
  -- Prima si guardava solo se esistevano le colonne, e le colonne le hanno
  -- anche le viste: una vista gest_* con user_id e eliminato_il passava, il
  -- camminatore non trovava nessuna chiave esterna (le viste non ne hanno) e
  -- la delete cancellava la riga sotto con tutta la sua catena, senza che
  -- nessuno l'avesse guardata. Sistema anche il caso del nome sbagliato, che
  -- prima dava un errore tecnico invece del messaggio chiaro.
  -- ----------------------------------------------------------------
  select c.oid into v_reg
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname = p_tabella
     and c.relkind in ('r','p');
  if v_reg is null then
    raise exception 'Tabella non ammessa.';
  end if;

  if not exists(select 1 from pg_attribute where attrelid=v_reg and attname='user_id'      and not attisdropped)
  or not exists(select 1 from pg_attribute where attrelid=v_reg and attname='eliminato_il' and not attisdropped) then
    raise exception 'Tabella non ammessa.';
  end if;

  execute format('select 1 from public.%I where id=$1 and user_id=$2 and eliminato_il is not null for update', p_tabella)
    into v_n using p_id, v_uid;
  if v_n is null then
    raise exception 'Questa riga non e'' nel cestino, oppure non e'' tua.';
  end if;

  -- fattura emessa cliccata direttamente: rifiuto subito, come prima
  if p_tabella = 'gest_fatture' then
    execute 'select numero::text from public.gest_fatture where id=$1 and user_id=$2'
      into v_num using p_id, v_uid;
    if v_num is not null and v_num <> '' then
      return jsonb_build_object('ok', false, 'fiscale', v_num);
    end if;
  end if;

  create temp table if not exists _cascata_tmp(
    tabella text, id uuid, esito text, viva boolean, altrui boolean, storage_path text
  ) on commit drop;
  -- "where true" non e' decorativo: Supabase tiene acceso pg_safeupdate, che
  -- rifiuta QUALSIASI delete senza where, anche su una tabella temporanea.
  delete from _cascata_tmp where true;

  -- ----------------------------------------------------------------
  -- CORREZIONE 1 — le copie della stessa riga si riuniscono, e vince
  -- sempre l'esito piu' grave. Prima "distinct on" ne teneva una a caso.
  -- ----------------------------------------------------------------
  insert into _cascata_tmp
  select c.tabella,
         c.id,
         case when bool_or(c.esito = 'blocca')     then 'blocca'
              when bool_or(c.esito = 'cancellata') then 'cancellata'
              else 'scollegata' end,
         bool_or(c.viva),
         bool_or(c.altrui),
         max(c.storage_path)
    from public._gest_cascata(p_tabella, array[p_id], v_uid, 0) c
   group by c.tabella, c.id;

  -- ----------------------------------------------------------------
  -- CORREZIONE 3 — il motivo si decide riga per riga, non sul gruppo.
  -- ----------------------------------------------------------------
  select coalesce(jsonb_agg(jsonb_build_object('tabella',t.tabella,'n',t.n,'motivo',t.motivo) order by t.n desc), '[]'::jsonb)
    into v_ostacoli
    from (
      select tabella,
             case when altrui             then 'altro account'
                  when esito = 'blocca'   then 'il database non lo permette'
                  else 'non e'' nel cestino' end as motivo,
             count(*) n
        from _cascata_tmp
       where altrui
          or esito = 'blocca'
          or (esito = 'cancellata' and viva)
       group by 1, 2
    ) t;

  if jsonb_array_length(v_ostacoli) > 0 then
    return jsonb_build_object('ok', false, 'vivi', v_ostacoli);
  end if;

  -- ----------------------------------------------------------------
  -- CORREZIONE 2 — una fattura EMESSA non si cancella nemmeno per via
  -- indiretta. Il messaggio nomina il numero, come quando la clicchi.
  -- ----------------------------------------------------------------
  select coalesce(jsonb_agg(distinct f.numero::text), '[]'::jsonb)
    into v_fisc
    from _cascata_tmp t
    join public.gest_fatture f on f.id = t.id
   where t.tabella = 'gest_fatture'
     and t.esito   = 'cancellata'
     and f.numero is not null;
  if jsonb_array_length(v_fisc) > 0 then
    return jsonb_build_object('ok', false, 'fiscale', v_fisc->>0, 'fiscali', v_fisc);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('tabella',t.tabella,'n',t.n) order by t.n desc), '[]'::jsonb)
    into v_va
    from (select tabella, count(*) n from _cascata_tmp where esito='cancellata' group by tabella) t;

  select coalesce(jsonb_agg(jsonb_build_object('tabella',t.tabella,'n',t.n) order by t.n desc), '[]'::jsonb)
    into v_scoll
    from (select tabella, count(*) n from _cascata_tmp where esito='scollegata' and viva group by tabella) t;

  select coalesce(jsonb_agg(jsonb_build_object('tabella',tabella,'path',storage_path)), '[]'::jsonb)
    into v_file
    from _cascata_tmp where esito='cancellata' and storage_path is not null;

  if not p_conferma then
    return jsonb_build_object('ok',true,'anteprima',v_va,'scollegate',v_scoll,'file',v_file);
  end if;

  execute format('delete from public.%I where id=$1 and user_id=$2 and eliminato_il is not null', p_tabella)
    using p_id, v_uid;

  return jsonb_build_object('ok',true,'eliminati',v_va,'scollegate',v_scoll,'file',v_file);
end;
$$;

grant execute on function public.gest_cestino_elimina(text, uuid, boolean) to authenticated;


-- =====================================================================
-- SECONDA PARTE — il reparto che non si svuotava piu'
--
-- gest-cestino.sql aveva aggiunto la colonna eliminato_il anche a gest_note.
-- Poche ore dopo gest-cestino-fix-note.sql ha tolto le note dal cestino (il
-- vincolo "un giorno = una nota" non andava d'accordo con l'indice parziale),
-- ma la COLONNA e' rimasta li', e da allora e' sempre vuota.
--
-- Effetto: per la funzione una nota del calendario e' sempre "viva", quindi un
-- reparto con anche una sola nota non si puo' eliminare per sempre — e non c'e'
-- modo di sbloccarsi, perche' le note nel cestino non ci entrano piu'.
-- Il messaggio diceva "ci sono ancora collegate 1 note" e non si usciva.
--
-- Togliendo la colonna, la funzione tratta la nota come un pezzo del reparto:
-- se ne va con lui, come le righe di una fattura.
-- (Se un domani rilanci gest-cestino.sql, la colonna torna: rilancia anche
--  questo file.)
-- =====================================================================
alter table if exists public.gest_note drop column if exists eliminato_il;


-- ---------------------------------------------------------------------
-- VERIFICA (facoltativa) — la mappa vera dei collegamenti del tuo database.
-- Serve solo se vuoi vedere con i tuoi occhi da dove passano le catene.
-- ---------------------------------------------------------------------
-- select pcl.relname as padre, cl.relname as figlio, a.attname as colonna,
--        case c.confdeltype when 'c' then 'cancella a catena'
--                           when 'n' then 'azzera il riferimento'
--                           when 'r' then 'il database rifiuta'
--                           when 'a' then 'il database rifiuta'
--                           else c.confdeltype::text end as azione
--   from pg_constraint c
--   join pg_class cl  on cl.oid  = c.conrelid
--   join pg_class pcl on pcl.oid = c.confrelid
--   join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
--  where c.contype = 'f' and pcl.relname like 'gest_%'
--  order by 1, 2;
