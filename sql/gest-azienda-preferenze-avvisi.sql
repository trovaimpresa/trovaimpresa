-- 8 ottobre 2026 — «Le mie email di avviso»: cosa ricevere e quando.
-- GIA' ESEGUITA su Supabase l'8 ottobre 2026. Vuoto/false = tutto acceso, come prima.
alter table public.gest_azienda add column if not exists avvisi_esclusi text not null default '';
alter table public.gest_azienda add column if not exists avvisi_solo_lunedi boolean not null default false;
