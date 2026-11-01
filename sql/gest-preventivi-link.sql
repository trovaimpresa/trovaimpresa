-- =====================================================================
-- INVIA AL CLIENTE — il link del preventivo (1 novembre 2026)
--
-- Dal preventivo, «Invia al cliente»: un link segreto che il cliente apre
-- dal telefono, SENZA account. Vede il preventivo e i capitolati scelti,
-- li stampa o li salva in PDF, e li accetta firmando col dito.
--
-- ⛔ IL CLIENTE NON ENTRA MAI NEL DATABASE. Passa da
--    netlify/functions/preventivo-cliente.js, che riconosce il token e
--    scrive col service role SOLO le aperture e la firma.
--
-- ⛔ «dati» E' UNA FOTOGRAFIA, NON IL PREVENTIVO VIVO. La scatta il
--    gestionale quando l'impresa apre «Invia al cliente», con le STESSE
--    funzioni dei conti del PDF (impRiga, _centPerc, calcolaParcella): la
--    funzione del cliente non rifa' nessun conto. Cosi' il cliente vede
--    esattamente quello che gli e' stato mandato, e la firma vale per quel
--    testo e basta.
--
-- ⛔ LA FIRMA LA SCRIVE SOLO IL SERVER. Senza il trigger qui sotto
--    l'impresa, che puo' aggiornare la sua riga, potrebbe scriversi da sola
--    «firmato da Mario Rossi». Dal browser la firma si puo' solo TOGLIERE
--    (quando l'impresa manda una versione nuova), mai mettere o cambiare.
--    Stessa cosa per il conto delle aperture.
--
-- ✅ Eseguito su Supabase il 1 nov 2026 (migrazione gest_preventivi_link_1nov2026).
-- =====================================================================

create table if not exists public.gest_preventivi_link (
  preventivo_id uuid primary key references public.gest_preventivi(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  token         text not null unique check (char_length(token) between 20 and 64),
  dati          jsonb not null default '{}'::jsonb check (jsonb_typeof(dati) = 'object'),
  creato_il     timestamptz not null default now(),
  aggiornato_il timestamptz not null default now(),
  -- le aperture: le scrive solo il server
  aperto_il     timestamptz,
  ultimo_aperto timestamptz,
  aperture      integer not null default 0,
  -- la firma del cliente: la scrive solo il server
  firmato_il    timestamptz,
  firma_nome    text check (firma_nome is null or char_length(firma_nome) <= 120),
  firma_img     text check (firma_img is null or char_length(firma_img) <= 300000),
  firma_ip      text,
  firma_hash    text
);

alter table public.gest_preventivi_link enable row level security;

drop policy if exists gest_preventivi_link_own on public.gest_preventivi_link;
create policy gest_preventivi_link_own on public.gest_preventivi_link
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists gest_preventivi_link_team_read on public.gest_preventivi_link;
create policy gest_preventivi_link_team_read on public.gest_preventivi_link
  for select using (public.gest_puo_accedere(user_id));

-- ⛔ Il preventivo deve essere DELL'IMPRESA che scrive.
create or replace function public.gest_preventivi_link_controlla()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_ruolo text;
begin
  if tg_op = 'INSERT' or new.preventivo_id is distinct from old.preventivo_id or new.user_id is distinct from old.user_id then
    if not exists (select 1 from gest_preventivi p where p.id = new.preventivo_id and p.user_id = new.user_id) then
      raise exception 'Preventivo non tuo' using errcode = '42501';
    end if;
  end if;

  v_ruolo := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    'postgres');
  if v_ruolo in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.aperto_il := null; new.ultimo_aperto := null; new.aperture := 0;
    new.firmato_il := null; new.firma_nome := null; new.firma_img := null;
    new.firma_ip := null; new.firma_hash := null;
    return new;
  end if;

  -- le aperture non si toccano dal browser
  new.aperto_il := old.aperto_il; new.ultimo_aperto := old.ultimo_aperto; new.aperture := old.aperture;
  -- la firma: dal browser si puo' solo togliere tutta insieme
  if new.firmato_il is null then
    new.firma_nome := null; new.firma_img := null; new.firma_ip := null; new.firma_hash := null;
  else
    new.firmato_il := old.firmato_il; new.firma_nome := old.firma_nome; new.firma_img := old.firma_img;
    new.firma_ip := old.firma_ip; new.firma_hash := old.firma_hash;
    -- e se e' firmato, la fotografia non si cambia: prima si toglie la firma
    if old.firmato_il is not null then new.dati := old.dati; end if;
  end if;
  new.aggiornato_il := now();
  return new;
end $$;
revoke execute on function public.gest_preventivi_link_controlla() from public, anon, authenticated;
drop trigger if exists gest_preventivi_link_guardia on public.gest_preventivi_link;
create trigger gest_preventivi_link_guardia before insert or update on public.gest_preventivi_link
  for each row execute function public.gest_preventivi_link_controlla();
