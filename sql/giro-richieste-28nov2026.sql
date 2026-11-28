-- 28 nov 2026 — IL GIRO DELLE RICHIESTE: cliente -> impresa -> cliente
-- Solo colonne nuove, niente si cancella.
--  token_cliente          : il codice del link «la tua richiesta» (richiesta.html?t=...)
--                           Non lo legge chi non e' loggato (anon non ha SELECT su queste tabelle).
--  chat_conv              : la conversazione (chat_messaggi) legata alla richiesta: risposta
--                           dell'impresa e messaggi del cliente stanno li', come la chat.
--  arrivata_inviata_at    : email «la tua richiesta e' arrivata» mandata al cliente
--  alternative_inviate_at : email «ti proponiamo altre imprese» (dopo 2 giorni senza risposta)
alter table public.preventivi
  add column if not exists token_cliente uuid not null default gen_random_uuid(),
  add column if not exists chat_conv text,
  add column if not exists arrivata_inviata_at timestamptz,
  add column if not exists alternative_inviate_at timestamptz;
create unique index if not exists preventivi_token_cliente_uq on public.preventivi(token_cliente);

alter table public.incarichi_richieste
  add column if not exists token_cliente uuid not null default gen_random_uuid(),
  add column if not exists chat_conv text,
  add column if not exists arrivata_inviata_at timestamptz,
  add column if not exists alternative_inviate_at timestamptz;
create unique index if not exists incarichi_token_cliente_uq on public.incarichi_richieste(token_cliente);
