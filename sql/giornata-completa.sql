-- =====================================================================
-- 10 nov 2026 — LA GIORNATA COMPLETA DELL'OPERAIO (dal telefono)
-- L'operaio manda al capo, in una volta sola: il giorno, il lavoro, cosa ha
-- fatto, le FOTO, le SPESE e le BOLLE/FATTURE fotografate. Tutto resta
-- «da vedere» in gest_giornate_proposte: niente entra nei conti finche' il
-- capo non preme «Approva» (gestionale → Giornate → Da approvare).
--
--   · gest_giornate_proposte.lavoro_id  il lavoro scelto (facoltativo)
--   · gest_giornate_proposte.extra      {spese:[{importo,cosa}],
--                                         foto:[{path,nome}],
--                                         bolle:[{path,nome,tipo}]}
--   · i file stanno in gestionale-foto, cartella
--         <impresa>/giornate/<operatore>/<file>
--     e l'operaio vede e carica SOLO la sua cartella (serve «Lavori»).
-- =====================================================================

alter table public.gest_giornate_proposte
  add column if not exists lavoro_id uuid references public.gest_lavori(id) on delete set null;
alter table public.gest_giornate_proposte
  add column if not exists extra jsonb not null default '{}'::jsonb;

-- il lavoro deve essere della stessa impresa (la guardia di sempre)
drop trigger if exists trg_gest_stesso_padrone on public.gest_giornate_proposte;
create trigger trg_gest_stesso_padrone
  before insert or update on public.gest_giornate_proposte
  for each row execute function public.gest_stesso_padrone();

-- controllo di quello che arriva dentro «extra»: forma giusta, quantita'
-- ragionevoli, e i file SOLO dalla cartella dell'operaio che manda
create or replace function public.gest_giornate_proposte_extra()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_catalog'
as $$
declare x jsonb; pref text; imp numeric;
begin
  if new.extra is null then new.extra := '{}'::jsonb; end if;
  if jsonb_typeof(new.extra) <> 'object' then
    raise exception 'Dati della giornata non validi.' using errcode = 'P0001';
  end if;
  if coalesce(jsonb_array_length(case when jsonb_typeof(new.extra->'spese') = 'array' then new.extra->'spese' end),0) > 10
     or coalesce(jsonb_array_length(case when jsonb_typeof(new.extra->'foto') = 'array' then new.extra->'foto' end),0) > 12
     or coalesce(jsonb_array_length(case when jsonb_typeof(new.extra->'bolle') = 'array' then new.extra->'bolle' end),0) > 6 then
    raise exception 'Troppe cose in una giornata: massimo 12 foto, 10 spese e 6 bolle.' using errcode = 'P0001';
  end if;
  -- le spese: un importo vero e una descrizione corta
  for x in select * from jsonb_array_elements(case when jsonb_typeof(new.extra->'spese') = 'array' then new.extra->'spese' else '[]'::jsonb end) loop
    begin imp := (x->>'importo')::numeric; exception when others then imp := null; end;
    if imp is null or imp <= 0 or imp > 100000 then
      raise exception 'Una spesa ha un importo non valido.' using errcode = 'P0001';
    end if;
    if length(coalesce(x->>'cosa','')) > 200 then
      raise exception 'La descrizione di una spesa e'' troppo lunga.' using errcode = 'P0001';
    end if;
  end loop;
  -- i file: solo dalla cartella <impresa>/giornate/<operatore>/
  pref := new.user_id::text || '/giornate/' || coalesce(new.operatore_id::text,'-') || '/';
  for x in select * from jsonb_array_elements(
             (case when jsonb_typeof(new.extra->'foto') = 'array' then new.extra->'foto' else '[]'::jsonb end)
          || (case when jsonb_typeof(new.extra->'bolle') = 'array' then new.extra->'bolle' else '[]'::jsonb end)) loop
    if left(coalesce(x->>'path',''), length(pref)) <> pref or position('..' in coalesce(x->>'path','')) > 0 then
      raise exception 'Un file della giornata non sta nella cartella giusta.' using errcode = 'P0001';
    end if;
  end loop;
  return new;
end $$;

drop trigger if exists trg_gest_giornate_proposte_extra on public.gest_giornate_proposte;
create trigger trg_gest_giornate_proposte_extra
  before insert or update of extra, user_id, operatore_id on public.gest_giornate_proposte
  for each row execute function public.gest_giornate_proposte_extra();

-- il deposito: la cartella «giornate» ha una regola sua
create or replace function public.gest_file_reparto(_path text)
returns text
language sql
immutable
set search_path to 'public', 'storage', 'pg_catalog'
as $$
  select case coalesce((storage.foldername(_path))[2],'')
           when 'fatture'        then 'fatture'
           when 'clienti'        then 'clienti'
           when 'fornitori'      then 'fornitori'
           when 'commercialista' then 'commercialista'
           when 'giornate'       then 'giornate'
           else 'lavoro' end;
$$;

create or replace function public.gest_puo_file(_bucket text, _path text, _azione text)
returns boolean
language sql
stable security definer
set search_path to 'public', 'storage', 'pg_catalog'
as $$
  select case
    -- percorso storto: NO, e senza andare in errore
    when gest_file_impresa(_path) is null then false
    -- il titolare passa sempre, su tutto
    when gest_file_impresa(_path) = auth.uid() then true

    when _bucket = 'gestionale-video' then
      case _azione
        when 'legge'  then gest_puo_sezione(gest_file_impresa(_path),'foto')
                        or gest_puo_sezione(gest_file_impresa(_path),'lavori')
        when 'carica' then gest_puo_sezione(gest_file_impresa(_path),'foto')
        else false                    -- cancellare dal deposito: solo il titolare
      end

    when _bucket = 'gestionale-foto' then
      case gest_file_reparto(_path)
        -- nell'app dell'operaio queste due sezioni non esistono nemmeno
        when 'commercialista' then false
        when 'fornitori'      then false
        when 'fatture' then (_azione in ('legge','carica')
                             and gest_puo_sezione(gest_file_impresa(_path),'fatture'))
        when 'clienti' then (_azione in ('legge','carica')
                             and gest_puo_sezione(gest_file_impresa(_path),'clienti'))
        -- 10 nov 2026: la giornata completa. Solo la PROPRIA cartella.
        when 'giornate' then (_azione in ('legge','carica')
                             and (storage.foldername(_path))[3] = gest_mio_operatore(gest_file_impresa(_path))::text
                             and gest_puo_sezione(gest_file_impresa(_path),'lavori'))
        else
          -- la cartella di un lavoro: foto di cantiere E fatture caricate
          -- dall'operaio dal telefono (vedi l'avviso in testa al file)
          case _azione
            when 'legge'  then gest_puo_sezione(gest_file_impresa(_path),'foto')
                            or gest_puo_sezione(gest_file_impresa(_path),'lavori')
                            or gest_puo_sezione(gest_file_impresa(_path),'fatture')
            when 'carica' then gest_puo_sezione(gest_file_impresa(_path),'foto')
                            or gest_puo_sezione(gest_file_impresa(_path),'fatture')
            else false
          end
      end
    else false
  end;
$$;
