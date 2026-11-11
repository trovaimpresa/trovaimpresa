-- =====================================================================
-- 11 nov 2026 — collaudo della semplicita' (3.8 Squadra)
-- «ELIMINA PER SEMPRE» DI UNA PERSONA DAVA UN ERRORE TECNICO.
--
-- Provato dal vivo: una persona nel Cestino, «Elimina per sempre» →
-- «Errore: structure of query does not match function result type».
-- Il camminatore _gest_cascata guarda chi punta alla riga e restituisce
-- l'id di ogni figlio come uuid. Ma gest_rifornimenti (che punta alla
-- persona) ha l'id NUMERICO (bigint): la riga non entrava nel risultato
-- e tutta la domanda saltava. Quindi una persona non si poteva mai
-- eliminare per sempre (e nemmeno un mezzo o una carta con rifornimenti).
--
-- Cambia UNA cosa: «ha un id» vuol dire «ha un id uuid». Se l'id e' di
-- un altro tipo, la riga si conta con un numero usa e getta (come le
-- tabelle-ponte che l'id non ce l'hanno). Se quella tabella si cancella
-- A CATENA e qualcun altro punta a lei, la funzione si FERMA (non sa
-- scendere sotto): fallisce chiusa, come per tutto il resto. Oggi l'unica
-- e' gest_rifornimenti, e a lei non punta nessuno.
-- Tutto il resto e' identico a sql/gest-cestino-elimina.sql.
-- =====================================================================
create or replace function public._gest_cascata(p_tabella text, p_ids uuid[], p_uid uuid, p_liv integer default 0)
 returns table(tabella text, id uuid, esito text, viva boolean, altrui boolean, storage_path text)
 language plpgsql
 security definer
 set search_path to 'public', 'pg_catalog'
as $function$
declare
  r      record;
  ha_el  boolean;
  ha_uid boolean;
  ha_sp  boolean;
  ha_id  boolean;
  id_altro boolean;
  figli  uuid[];
begin
  if p_ids is null or cardinality(p_ids) = 0 then
    return;
  end if;
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
    if cardinality(r.cols_figlio) <> 1
       or (select attname from pg_attribute
            where attrelid = format('public.%I', p_tabella)::regclass
              and attnum = r.cols_padre[1]) <> 'id' then
      raise exception 'Collegamento "%" non gestito (chiave composita o non su id): per sicurezza non elimino niente.', r.vincolo;
    end if;
    if r.azione not in ('c','n','r','a','d') then
      raise exception 'Collegamento "%" con regola sconosciuta: per sicurezza non elimino niente.', r.vincolo;
    end if;

    select exists(select 1 from pg_attribute where attrelid=format('public.%I',r.figlio)::regclass and attname='eliminato_il' and not attisdropped) into ha_el;
    select exists(select 1 from pg_attribute where attrelid=format('public.%I',r.figlio)::regclass and attname='user_id'      and not attisdropped) into ha_uid;
    select exists(select 1 from pg_attribute where attrelid=format('public.%I',r.figlio)::regclass and attname='storage_path' and not attisdropped) into ha_sp;
    -- 11 nov 2026: l'id conta solo se e' uuid (il risultato e' uuid)
    select exists(select 1 from pg_attribute where attrelid=format('public.%I',r.figlio)::regclass and attname='id' and not attisdropped and atttypid='uuid'::regtype) into ha_id;
    select exists(select 1 from pg_attribute where attrelid=format('public.%I',r.figlio)::regclass and attname='id' and not attisdropped and atttypid<>'uuid'::regtype) into id_altro;
    if id_altro and r.azione = 'c'
       and exists(select 1 from pg_constraint where contype='f' and confrelid=format('public.%I',r.figlio)::regclass) then
      raise exception 'Collegamento "%" verso una tabella con id non uuid che si cancella a catena: per sicurezza non elimino niente.', r.vincolo;
    end if;

    return query execute format(
      'select %L::text, %s, %L::text, %s, %s, %s from public.%I t where t.%I = any($1)',
      r.figlio,
      case when ha_id then 't.id' else 'gen_random_uuid()' end,
      case when r.azione = 'c' then 'cancellata'
           when r.azione = 'n' then 'scollegata'
           else 'blocca' end,
      case when ha_el then 't.eliminato_il is null' else 'false' end,
      case when ha_uid then format('t.user_id is distinct from %L::uuid', p_uid) else 'false' end,
      case when ha_sp then 't.storage_path::text' else 'null::text' end,
      r.figlio,
      (select attname from pg_attribute where attrelid=format('public.%I',r.figlio)::regclass and attnum=r.cols_figlio[1])
    ) using p_ids;

    if r.azione = 'c' and ha_id then
      execute format('select coalesce(array_agg(t.id), ''{}''::uuid[]) from public.%I t where t.%I = any($1)',
                     r.figlio,
                     (select attname from pg_attribute where attrelid=format('public.%I',r.figlio)::regclass and attnum=r.cols_figlio[1]))
        into figli using p_ids;
      return query select * from public._gest_cascata(r.figlio, figli, p_uid, p_liv + 1);
    end if;
  end loop;
end;
$function$;

revoke all on function public._gest_cascata(text, uuid[], uuid, int) from public, anon, authenticated;
