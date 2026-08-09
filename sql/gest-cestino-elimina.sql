-- ============================================================
-- ELIMINAZIONE DEFINITIVA SICURA DAL CESTINO  (versione 2)
-- 9 agosto 2026
-- ============================================================
--
-- Da eseguire UNA VOLTA SOLA in Supabase: SQL Editor -> incolla tutto -> Run.
-- Si puo' rilanciare senza rischi.
--
-- PERCHE' ESISTE
-- Nel cestino "Elimina per sempre" c'era solo sulle cose senza figli. Su
-- pratiche, clienti, fatture e reparti no: cancellarli fa scattare le
-- cancellazioni a catena del database e si porterebbe via anche roba VIVA.
--
-- LA REGOLA DI QUESTA FUNZIONE: NEL DUBBIO RIFIUTA.
-- Non prova a indovinare. Chiede al catalogo di Postgres quali tabelle
-- dipendono dalla riga, scende lungo la catena, e si ferma se trova:
--   - una riga che NON e' nel cestino          -> la perderesti
--   - una riga di un ALTRO account             -> non e' tua
--   - un tipo di collegamento che non sa gestire -> non puo' garantire nulla
-- Solo se non trova niente di tutto questo cancella.
--
-- PERCHE' SECURITY DEFINER
-- Con SECURITY INVOKER la funzione legge filtrata dalle RLS, ma il CASCADE del
-- database le RLS non le guarda: quello che la funzione non vede muore lo
-- stesso. Quindi la funzione gira con pieni poteri (vede tutto) e i controlli
-- di proprieta' li fa a mano, riga per riga, contro auth.uid().

set check_function_bodies = off;

-- ------------------------------------------------------------
-- 1. Il camminatore
-- ------------------------------------------------------------
-- Restituisce ogni riga che verrebbe toccata cancellando p_ids da p_tabella.
--   esito: 'cancellata'   la riga sparisce (cascade)
--          'scollegata'   la riga resta ma perde il riferimento (set null)
--   viva : true se NON e' nel cestino
--   altrui: true se appartiene a un altro account
create or replace function public._gest_cascata(
  p_tabella text,
  p_ids     uuid[],
  p_uid     uuid,
  p_liv     int default 0
) returns table(tabella text, id uuid, esito text, viva boolean, altrui boolean, storage_path text)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  r      record;
  ha_el  boolean;
  ha_uid boolean;
  ha_sp  boolean;
  figli  uuid[];
begin
  if p_ids is null or cardinality(p_ids) = 0 then
    return;
  end if;
  -- Il limite NON lascia passare in silenzio: se la catena e' piu' profonda
  -- di cosi' c'e' qualcosa che non capisco, e allora mi fermo.
  if p_liv > 8 then
    raise exception 'Catena di collegamenti troppo profonda: per sicurezza non elimino niente.';
  end if;

  for r in
    select cl.relname::text as figlio,
           c.conkey            as cols_figlio,
           c.confkey           as cols_padre,
           c.confdeltype       as azione,
           c.conname::text     as vincolo
      from pg_constraint c
      join pg_class     cl on cl.oid = c.conrelid
      join pg_namespace n  on n.oid  = cl.relnamespace
     where c.contype   = 'f'
       and n.nspname   = 'public'
       and c.confrelid = format('public.%I', p_tabella)::regclass
  loop
    -- FALLISCI CHIUSO: solo collegamenti a una colonna che puntano a "id".
    -- Le chiavi composite e quelle che puntano a un'altra colonna esistono,
    -- ma questa funzione non le sa seguire: meglio dirlo che tirare a indovinare.
    if cardinality(r.cols_figlio) <> 1
       or (select attname from pg_attribute
            where attrelid = format('public.%I', p_tabella)::regclass
              and attnum = r.cols_padre[1]) <> 'id' then
      raise exception 'Collegamento "%" non gestito (chiave composita o non su id): per sicurezza non elimino niente.', r.vincolo;
    end if;
    -- 'c' cancella a catena, 'n' azzera il riferimento, 'r'/'a' il database rifiuta,
    -- 'd' rimette il valore di default. Le ultime tre le tratto tutte come "guarda
    -- prima cosa c'e'", perche' o fanno fallire il delete o cambiano dati vivi.
    if r.azione not in ('c','n','r','a','d') then
      raise exception 'Collegamento "%" con regola sconosciuta: per sicurezza non elimino niente.', r.vincolo;
    end if;

    select exists(select 1 from pg_attribute where attrelid=format('public.%I',r.figlio)::regclass and attname='eliminato_il' and not attisdropped) into ha_el;
    select exists(select 1 from pg_attribute where attrelid=format('public.%I',r.figlio)::regclass and attname='user_id'      and not attisdropped) into ha_uid;
    select exists(select 1 from pg_attribute where attrelid=format('public.%I',r.figlio)::regclass and attname='storage_path' and not attisdropped) into ha_sp;

    return query execute format(
      'select %L::text, t.id, %L::text, %s, %s, %s from public.%I t where t.%I = any($1)',
      r.figlio,
      case when r.azione = 'c' then 'cancellata'
           when r.azione = 'n' then 'scollegata'
           else 'blocca' end,
      -- "viva": una riga senza la colonna del cestino e' un pezzo del padre
      -- (righe di fattura, tabelle ponte) e se ne va con lui: non e' una perdita.
      case when ha_el then 't.eliminato_il is null' else 'false' end,
      case when ha_uid then format('t.user_id is distinct from %L::uuid', p_uid) else 'false' end,
      case when ha_sp then 't.storage_path' else 'null::text' end,
      r.figlio,
      (select attname from pg_attribute where attrelid=format('public.%I',r.figlio)::regclass and attnum=r.cols_figlio[1])
    ) using p_ids;

    -- si scende solo dove il database cancella davvero
    if r.azione = 'c' then
      execute format('select coalesce(array_agg(t.id), ''{}''::uuid[]) from public.%I t where t.%I = any($1)',
                     r.figlio,
                     (select attname from pg_attribute where attrelid=format('public.%I',r.figlio)::regclass and attnum=r.cols_figlio[1]))
        into figli using p_ids;
      return query select * from public._gest_cascata(r.figlio, figli, p_uid, p_liv + 1);
    end if;
  end loop;
end;
$$;


-- ------------------------------------------------------------
-- 2. La funzione che chiama il gestionale
-- ------------------------------------------------------------
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
  v_uid    uuid := auth.uid();
  v_n      bigint;
  v_ostacoli jsonb;
  v_va     jsonb;
  v_scoll  jsonb;
  v_file   jsonb;
begin
  if v_uid is null then
    raise exception 'Non sei collegato.';
  end if;
  if p_tabella !~ '^gest_[a-z_]+$' then
    raise exception 'Tabella non ammessa.';
  end if;
  -- deve avere sia user_id sia eliminato_il, se no non e' una scheda del cestino
  if not exists(select 1 from pg_attribute where attrelid=format('public.%I',p_tabella)::regclass and attname='user_id' and not attisdropped)
  or not exists(select 1 from pg_attribute where attrelid=format('public.%I',p_tabella)::regclass and attname='eliminato_il' and not attisdropped) then
    raise exception 'Tabella non ammessa.';
  end if;

  -- La riga deve essere tua e gia' nel cestino. "for update" la blocca fino a
  -- fine transazione: cosi' nessuno puo' attaccarle un figlio nuovo fra il
  -- controllo e la cancellazione.
  -- "select 1 ... for update": con count(*) Postgres non lo permette
  execute format('select 1 from public.%I where id=$1 and user_id=$2 and eliminato_il is not null for update', p_tabella)
    into v_n using p_id, v_uid;
  if v_n is null then
    raise exception 'Questa riga non e'' nel cestino, oppure non e'' tua.';
  end if;

  create temp table if not exists _cascata_tmp(tabella text, id uuid, esito text, viva boolean, altrui boolean, storage_path text) on commit drop;
  delete from _cascata_tmp;
  insert into _cascata_tmp
  select distinct on (c.tabella, c.id) c.tabella, c.id, c.esito, c.viva, c.altrui, c.storage_path
    from public._gest_cascata(p_tabella, array[p_id], v_uid, 0) c
   order by c.tabella, c.id, c.viva desc, c.altrui desc;

  -- OSTACOLI: righe vive che sparirebbero, righe di altri, legami che il
  -- database rifiuterebbe. Uno solo di questi e non si cancella niente.
  select coalesce(jsonb_agg(jsonb_build_object('tabella',t.tabella,'n',t.n,'motivo',t.motivo) order by t.n desc), '[]'::jsonb)
    into v_ostacoli
    from (
      select tabella,
             case when bool_or(altrui) then 'altro account'
                  when esito = 'blocca' then 'il database non lo permette'
                  else 'non e'' nel cestino' end as motivo,
             count(*) n
        from _cascata_tmp
       where altrui
          or esito = 'blocca'
          or (esito = 'cancellata' and viva)
       group by tabella, case when esito='blocca' then 'blocca' else 'altro' end, esito
    ) t;

  if jsonb_array_length(v_ostacoli) > 0 then
    return jsonb_build_object('ok', false, 'vivi', v_ostacoli);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('tabella',t.tabella,'n',t.n) order by t.n desc), '[]'::jsonb)
    into v_va
    from (select tabella, count(*) n from _cascata_tmp where esito='cancellata' group by tabella) t;

  -- le righe che restano ma perdono il collegamento: non bloccano, ma vanno dette
  select coalesce(jsonb_agg(jsonb_build_object('tabella',t.tabella,'n',t.n) order by t.n desc), '[]'::jsonb)
    into v_scoll
    from (select tabella, count(*) n from _cascata_tmp where esito='scollegata' and viva group by tabella) t;

  -- i file da togliere dallo storage: il gestionale non li vedrebbe piu'
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

revoke all on function public._gest_cascata(text, uuid[], uuid, int) from public, anon, authenticated;
grant execute on function public.gest_cestino_elimina(text, uuid, boolean) to authenticated;
