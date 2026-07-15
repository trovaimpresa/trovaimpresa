-- ============================================================
--  TrovaImpresa — Premium in regalo (3 mesi) con rientro a Free automatico
--  Workflow: cambi "piano" da free a premium a MANO nel Table Editor;
--  la scadenza (3 mesi) si imposta da sola grazie al trigger qui sotto.
--  I paganti (webhook Stripe) sono marcati premium_pagato = true e NON scadono.
-- ============================================================

-- 1) Colonne di servizio
alter table public.imprese
  add column if not exists premium_scadenza timestamptz;
alter table public.imprese
  add column if not exists premium_pagato boolean not null default false;

-- 2) Trigger: quando il piano diventa 'premium' SENZA scadenza e NON è un pagante,
--    imposta automaticamente la scadenza a 3 mesi da adesso.
create or replace function public.imposta_scadenza_premium()
returns trigger
language plpgsql
as $$
begin
  if new.piano = 'premium'
     and new.premium_scadenza is null
     and coalesce(new.premium_pagato, false) = false then
     new.premium_scadenza := now() + interval '3 months';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_scadenza_premium on public.imprese;
create trigger trg_scadenza_premium
  before update on public.imprese
  for each row execute function public.imposta_scadenza_premium();

-- 3) pg_cron: scheduler dentro il database (se non attivo).
--    Se dà errore permessi: Dashboard -> Database -> Extensions -> attiva "pg_cron",
--    poi rilancia dal punto 4.
create extension if not exists pg_cron;

-- 4) Job giornaliero (03:00): riporta a Free i regali scaduti. I paganti hanno
--    premium_scadenza = NULL, quindi non vengono mai toccati.
select cron.schedule(
  'declassa_premium_regalo_scaduto',
  '0 3 * * *',
  $$
    update public.imprese
       set piano = 'free',
           premium_scadenza = null
     where piano = 'premium'
       and premium_scadenza is not null
       and premium_scadenza <= now();
  $$
);


-- ============================================================
--  D'ORA IN POI: come regalare 3 mesi di Premium
--  Nel Table Editor cambi SOLO il campo "piano" da free a premium.
--  La scadenza si compila da sola. Non devi toccare altro.
-- ============================================================


-- ============================================================
--  COMANDI UTILI (facoltativi)
-- ============================================================
--  Regali attivi e scadenza:   select email, piano, premium_scadenza
--                                from public.imprese
--                               where premium_scadenza is not null
--                            order by premium_scadenza;
--  Job schedulati:             select jobname, schedule, active from cron.job;
--  Rimuovere l'automatismo:    select cron.unschedule('declassa_premium_regalo_scaduto');
