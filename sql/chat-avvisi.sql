-- =====================================================================
-- 26 settembre 2026 — LA CHAT CLIENTE-IMPRESA: AVVISI E NUMERI
--
-- 1. `chat_avvisi`: ricorda quando e' partita l'ultima email di avviso per
--    ogni conversazione e per ogni verso (all'impresa / al cliente).
--    Serve a netlify/functions/chat-avviso.js per non mandare piu' di
--    UNA email ogni 30 minuti per conversazione: dieci messaggi di fila
--    fanno partire un avviso solo, non dieci.
--    ⛔ Nessuna regola di lettura o scrittura: la tocca solo la funzione,
--       col service role. Dal browser non si vede e non si scrive.
--
-- 2. Via il trigger `pulisci_chat`: cancellava numeri di telefono ed email
--    dai messaggi («[contatto rimosso 🔒]»). Era del vecchio sistema a
--    pagamento dei contatti, tolto a luglio. Deciso da Alessio il 26 set:
--    TrovaImpresa e' una vetrina, cliente e impresa si scambiano il numero
--    come vogliono.
--    ⚠️ La funzione `maschera_contatti` RESTA: la usa ancora
--       `trg_pulisci_preventivo` sulle richieste di preventivo.
--    ⚠️ I messaggi vecchi gia' mascherati restano com'erano.
-- =====================================================================

create table if not exists public.chat_avvisi (
  conversation_id text not null,
  verso           text not null check (verso in ('impresa','cliente')),
  inviato_il      timestamptz not null default now(),
  primary key (conversation_id, verso)
);

alter table public.chat_avvisi enable row level security;
revoke all on public.chat_avvisi from anon, authenticated;
-- ⚠️ la SELECT si ridà a `authenticated` apposta, SENZA nessuna regola:
--    con la RLS accesa e zero regole non si legge nemmeno una riga, ma la
--    tabella resta visibile a `gest_schema_mancanti` (che guarda
--    information_schema, dove compare solo cio' su cui hai un permesso).
--    Senza questa riga il controllo del fondatore la darebbe «mancante».
grant select on public.chat_avvisi to authenticated;

drop trigger if exists pulisci_chat on public.chat_messaggi;

-- per tornare indietro:
--   create trigger pulisci_chat before insert or update on public.chat_messaggi
--     for each row execute function trg_pulisci_chat();
--   drop table if exists public.chat_avvisi;
