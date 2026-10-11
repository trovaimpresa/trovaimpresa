-- 12 ottobre 2026 — CHAT: modifica, elimina e foto/PDF nei messaggi.
-- Additivo: aggiunge 3 colonne e rimpiazza la guardia. Niente si cancella davvero:
-- «elimina» nasconde il messaggio (eliminato_il). Ognuno cambia solo i SUOI messaggi.
alter table public.gest_messaggi add column if not exists allegati jsonb not null default '[]'::jsonb;
alter table public.gest_messaggi add column if not exists modificato_il timestamptz;
alter table public.gest_messaggi add column if not exists eliminato_il timestamptz;

-- il testo puo' mancare se c'e' almeno un allegato
alter table public.gest_messaggi drop constraint if exists gest_messaggi_testo_check;
alter table public.gest_messaggi drop constraint if exists gest_messaggi_testo_ok;
alter table public.gest_messaggi add constraint gest_messaggi_testo_ok
  check (char_length(testo) <= 2000 and (char_length(testo) >= 1 or jsonb_array_length(allegati) > 0));

create or replace function public.gest_messaggi_guardia() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
declare lato text;
begin
  if tg_op = 'INSERT' then
    new.autore := case when new.user_id = auth.uid() then 'titolare' else 'operaio' end;
    new.letto_il := null;
    new.modificato_il := null;
    new.eliminato_il := null;
    new.created_at := now();
    return new;
  end if;
  if tg_op = 'DELETE' then
    lato := case when old.user_id = auth.uid() then 'titolare' else 'operaio' end;
    if old.autore <> lato then raise exception 'Puoi togliere solo i tuoi messaggi.'; end if;
    return old;
  end if;
  lato := case when new.user_id = auth.uid() then 'titolare' else 'operaio' end;
  -- tutto e' fermo, tranne: letto_il (l'altra parte), testo / modificato_il / eliminato_il (l'autore)
  if (to_jsonb(new) - 'letto_il' - 'testo' - 'modificato_il' - 'eliminato_il')
     is distinct from (to_jsonb(old) - 'letto_il' - 'testo' - 'modificato_il' - 'eliminato_il') then
    raise exception 'Un messaggio non si puo'' riscrivere.';
  end if;
  if new.testo is distinct from old.testo or new.eliminato_il is distinct from old.eliminato_il
     or new.modificato_il is distinct from old.modificato_il then
    if old.autore <> lato then raise exception 'Puoi cambiare solo i tuoi messaggi.'; end if;
    if old.eliminato_il is not null then raise exception 'Il messaggio e'' gia'' eliminato.'; end if;
    if new.testo is distinct from old.testo then new.modificato_il := now(); else new.modificato_il := old.modificato_il; end if;
    if new.eliminato_il is not null then new.eliminato_il := now(); end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_gest_messaggi_guardia on public.gest_messaggi;
create trigger trg_gest_messaggi_guardia before insert or update or delete on public.gest_messaggi
  for each row execute function public.gest_messaggi_guardia();
