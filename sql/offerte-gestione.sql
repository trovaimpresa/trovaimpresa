-- =====================================================================
-- OFFERTE DI LAVORO: GESTIONE DELL'ANNUNCIO (24 ottobre 2026)
--
-- Stessa strada dei subappalti (sql/subappalti-gestione.sql):
--   · data_scadenza_annuncio -> c'era gia': da oggi vale SEMPRE (30 giorni
--     se nessuno la sceglie). La legge anche offerta-lavoro.html per Google.
--   · avviso_scadenza_il     -> quando e' partita l'email «ancora valido?»
--   · ogni offerta ha il SUO link segreto (offerte_token), anche quelle
--     delle imprese iscritte: prima ce l'avevano solo le anonime.
--
-- Le scritture del link passano da netlify/functions/offerta-gestione.js
-- (chiave di servizio, controllo del token o del proprietario).
-- =====================================================================

alter table public.offerte_lavoro
  add column if not exists avviso_scadenza_il timestamptz;

alter table public.offerte_lavoro
  alter column data_scadenza_annuncio set default (current_date + 30);

-- chi la lascia vuota (anche passando null di proposito) prende 30 giorni;
-- piu' di 60 giorni non si puo': una bacheca vecchia non serve a nessuno
create or replace function public.offerte_scadenza_giusta()
returns trigger language plpgsql as $$
begin
  if new.data_scadenza_annuncio is null
     or new.data_scadenza_annuncio < current_date
     or new.data_scadenza_annuncio > current_date + 60 then
    new.data_scadenza_annuncio := current_date + 30;
  end if;
  return new;
end $$;

drop trigger if exists trg_offerte_scadenza on public.offerte_lavoro;
create trigger trg_offerte_scadenza before insert on public.offerte_lavoro
  for each row execute function public.offerte_scadenza_giusta();

-- il link segreto nasce con l'offerta, per tutti
create or replace function public.offerte_crea_token()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.offerte_token (offerta_id) values (new.id)
  on conflict (offerta_id) do nothing;
  return new;
end $$;

drop trigger if exists trg_offerte_token on public.offerte_lavoro;
create trigger trg_offerte_token after insert on public.offerte_lavoro
  for each row execute function public.offerte_crea_token();

insert into public.offerte_token (offerta_id)
select id from public.offerte_lavoro
on conflict (offerta_id) do nothing;

update public.offerte_lavoro set data_scadenza_annuncio = current_date + 30
 where attiva and (data_scadenza_annuncio is null or data_scadenza_annuncio < current_date + 30);

-- la pubblicazione anonima: il token adesso lo crea il trigger, qui si legge
create or replace function public.pubblica_offerta_anonima(p jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_id uuid;
  v_token uuid;
  v_email text;
  v_recenti int;
begin
  v_email := lower(trim(coalesce(p->>'email','')));

  if coalesce(trim(p->>'nome_azienda'),'') = '' then
    raise exception 'Manca il nome dell''attivita''.' using errcode = 'P0001';
  end if;
  if coalesce(trim(p->>'titolo'),'') = '' then
    raise exception 'Manca il titolo dell''annuncio.' using errcode = 'P0001';
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$' then
    raise exception 'Email non valida.' using errcode = 'P0001';
  end if;
  if coalesce(trim(p->>'citta'),'') = '' then
    raise exception 'Manca la citta''.' using errcode = 'P0001';
  end if;

  select count(*) into v_recenti
    from public.offerte_lavoro
   where impresa_id is null
     and lower(email) = v_email
     and created_at > now() - interval '24 hours';
  if v_recenti >= 5 then
    raise exception 'Hai gia'' pubblicato 5 annunci nelle ultime 24 ore. Riprova domani.' using errcode = 'P0001';
  end if;

  insert into public.offerte_lavoro (
    impresa_id, nome_azienda, email, telefono, titolo, descrizione,
    tipo_offerta, tipo_contratto, citta, regione, provincia, mestiere,
    livello_esperienza, orario, posti_disponibili, stipendio,
    data_scadenza_annuncio, note_aggiuntive,
    patenti_richieste, certificazioni_richieste, competenze_richieste,
    auto_propria, disponibilita_trasferte, mezzi_forniti,
    attiva, data_pubblicazione
  ) values (
    null,
    left(trim(p->>'nome_azienda'), 120),
    v_email,
    left(nullif(trim(coalesce(p->>'telefono','')),''), 40),
    left(trim(p->>'titolo'), 160),
    left(nullif(trim(coalesce(p->>'descrizione','')),''), 6000),
    nullif(trim(coalesce(p->>'tipo_offerta','')),''),
    nullif(trim(coalesce(p->>'tipo_contratto','')),''),
    left(trim(p->>'citta'), 80),
    nullif(trim(coalesce(p->>'regione','')),''),
    nullif(trim(coalesce(p->>'provincia','')),''),
    nullif(trim(coalesce(p->>'mestiere','')),''),
    nullif(trim(coalesce(p->>'livello_esperienza','')),''),
    nullif(trim(coalesce(p->>'orario','')),''),
    greatest(1, least(99, coalesce((p->>'posti_disponibili')::int, 1))),
    left(nullif(trim(coalesce(p->>'stipendio','')),''), 80),
    nullif(p->>'data_scadenza_annuncio','')::date,
    left(nullif(trim(coalesce(p->>'note_aggiuntive','')),''), 3000),
    case when jsonb_typeof(p->'patenti_richieste') = 'array'
         then array(select jsonb_array_elements_text(p->'patenti_richieste')) end,
    case when jsonb_typeof(p->'certificazioni_richieste') = 'array'
         then array(select jsonb_array_elements_text(p->'certificazioni_richieste')) end,
    case when jsonb_typeof(p->'competenze_richieste') = 'array'
         then array(select jsonb_array_elements_text(p->'competenze_richieste')) end,
    coalesce((p->>'auto_propria')::boolean, false),
    coalesce((p->>'disponibilita_trasferte')::boolean, false),
    coalesce((p->>'mezzi_forniti')::boolean, false),
    true, now()
  )
  returning id into v_id;

  select token into v_token from public.offerte_token where offerta_id = v_id;
  if v_token is null then
    insert into public.offerte_token (offerta_id) values (v_id) returning token into v_token;
  end if;

  return jsonb_build_object('id', v_id, 'token', v_token);
end;
$function$;

create index if not exists offerte_attiva_scade_idx on public.offerte_lavoro (attiva, data_scadenza_annuncio);
