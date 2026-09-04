-- =====================================================================
-- PREVENTIVI: GLI ALLEGATI DEL CLIENTE  --  4 settembre 2026
-- =====================================================================
-- Il problema: il cliente NON e' loggato. La foto veniva caricata nel
-- bucket "foto-lavori", che accetta solo l'impresa proprietaria (policy
-- owner): l'upload falliva IN SILENZIO e nessuna richiesta e' mai
-- arrivata con la foto.
--
-- La soluzione: un bucket suo, "preventivi-allegati", privato, dove
-- puo' scrivere anche chi non e' loggato ma SOLO dentro la cartella di
-- un'impresa che esiste davvero; e legge solo l'impresa proprietaria.
-- Stessa forma delle policy gia' in piedi per "documenti-incarichi".
--
-- Gia' passato sul database il 4 set 2026. Si puo' rilanciare: e'
-- tutto idempotente.
-- =====================================================================

-- 1) Il bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'preventivi-allegati',
  'preventivi-allegati',
  false,
  10485760,                      -- 10 MB per file
  array[
    'image/jpeg','image/png','image/webp','image/heic','image/heif','image/gif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/vnd.dwg','image/vnd.dxf','application/acad','application/dxf'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2) Chi scrive: chiunque, ma solo in  preventivi/<id impresa esistente>/
drop policy if exists "prevall_insert_anon" on storage.objects;
create policy "prevall_insert_anon"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'preventivi-allegati'
  and (storage.foldername(name))[1] = 'preventivi'
  and exists (
    select 1 from public.imprese im
    where im.id::text = (storage.foldername(name))[2]
  )
);

-- 3) Chi legge: solo l'impresa proprietaria della cartella
drop policy if exists "prevall_select_owner" on storage.objects;
create policy "prevall_select_owner"
on storage.objects for select
to authenticated
using (
  bucket_id = 'preventivi-allegati'
  and exists (
    select 1 from public.imprese im
    where im.user_id = auth.uid()
      and im.id::text = (storage.foldername(name))[2]
  )
);

-- 4) La colonna sulla richiesta: [{path, nome, tipo, dim}]
alter table public.preventivi
  add column if not exists allegati jsonb not null default '[]'::jsonb;

-- 5) La vista che leggono i 4 pannelli deve farla vedere
create or replace view public.preventivi_safe as
 SELECT id, impresa_id, nome, tipo_lavoro, descrizione, created_at, cognome,
        risposta, prezzo_min, prezzo_max, risposta_at, stato, citta, via,
        piano, mq, categoria_lavoro, voci_lavoro, validita_giorni,
        iva_inclusa, note_aggiuntive, data_preferita, urgenza, budget,
        foto, allegati
   FROM preventivi;
