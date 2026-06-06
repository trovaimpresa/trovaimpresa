-- ============================================================
-- Campi extra per le richieste di preventivo (profilo-impresa.html)
-- Eseguire nell'SQL Editor di Supabase.
-- ============================================================

-- 1) Nuove colonne sulla tabella preventivi
--    data_preferita: data scelta dal cliente per il sopralluogo
--    urgenza:        "Normale" | "Entro la settimana" | "Urgente"
--    budget:         testo libero (es. "500-1000€")
--    foto:           URL pubblico della foto allegata (bucket foto-lavori)
alter table public.preventivi add column if not exists data_preferita date;
alter table public.preventivi add column if not exists urgenza        text;
alter table public.preventivi add column if not exists budget         text;
alter table public.preventivi add column if not exists foto           text;

-- ============================================================
-- 2) Policy di upload anonimo sul bucket "foto-lavori"
--    Permette ai visitatori (ruolo anon) di caricare SOLO dentro
--    il prefisso "preventivi/", senza toccare le cartelle delle imprese.
--    NB: il bucket deve già esistere ed essere pubblico in lettura.
-- ============================================================
drop policy if exists "Anon upload foto preventivi" on storage.objects;

create policy "Anon upload foto preventivi"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'foto-lavori'
  and (storage.foldername(name))[1] = 'preventivi'
);
