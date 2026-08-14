-- =====================================================================
-- TrovaImpresa — I PAGAMENTI SI SCRIVONO
-- Da salvare come  sql/pagamenti.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 14 agosto 2026 (notte)
--
-- ---------------------------------------------------------------------
-- COSA SUCCEDE OGGI
-- ---------------------------------------------------------------------
-- Quando qualcuno paga il Premium o l'add-on Gestionale, il webhook di
-- Stripe fa questo, e solo questo:
--
--     imprese.piano = 'premium', premium_pagato = true
--     imprese.gestionale_attivo = true
--
-- Una spunta. Non c'è l'importo, non c'è la data, non c'è il numero della
-- transazione. Non è che il dato sparisce quando la persona si cancella:
-- NON VIENE MAI SCRITTO.
--
-- Vuol dire che anche adesso, con il cliente ancora iscritto e pagante,
-- dal database non si può sapere quando ha pagato, quanto, né quante
-- volte ha rinnovato. E il giorno che si cancella sparisce pure la spunta.
--
-- Per la pubblicità va un po' meglio: resta `stato='pagato'` e il numero
-- della sessione Stripe — ma non il prezzo, che viene ricalcolato ogni
-- volta da un listino che può cambiare. Fra due anni non si saprà più
-- quanto era stato pagato davvero.
--
-- ---------------------------------------------------------------------
-- PERCHÉ FARLO ADESSO CHE NON C'È NIENTE
-- ---------------------------------------------------------------------
-- Contati il 14 agosto: 0 Premium paganti, 1 gestionale attivo, 1 annuncio
-- pagato. Il buco c'è ma dentro non ci è ancora caduto quasi niente.
--
-- È esattamente il momento giusto: mettere le mani sul percorso dei
-- pagamenti quando i soldi passano davvero è tutta un'altra cosa. E la
-- prima riga scritta è il primo incasso che non si perde.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. LA TABELLA
-- ---------------------------------------------------------------------
create table if not exists public.pagamenti (
  id            uuid primary key default gen_random_uuid(),

  -- ⚠️ NIENTE references auth.users, NIENTE references imprese.
  -- Stessa ragione di iscrizioni_annullate: con il collegamento, la riga
  -- dell'incasso sparirebbe insieme al cliente che se ne va, e il totale
  -- dell'anno diventerebbe più BASSO continuando a sembrare giusto.
  -- Sono numeri che restano solo se nessuno li tiene per mano.
  user_id       uuid,
  impresa_id    uuid,

  -- l'email con cui ha pagato: nei webhook di Stripe è l'UNICA cosa che
  -- collega il pagamento alla persona (il cliente viene ritrovato per
  -- email, non per id). Si può svuotare senza perdere la riga contabile.
  email         text,

  prodotto      text not null,   -- premium | gestionale | pubblicita | crediti-ai

  -- ⚠️ I SOLDI SI TENGONO IN CENTESIMI, INTERI.
  -- Stripe li manda così (`amount_total`), e sono interi apposta: 19,99
  -- non esiste come numero con la virgola nei computer, e a forza di
  -- somme un centesimo si perde. Gli euro si calcolano da qui, e li
  -- calcola PostgreSQL — che con `numeric` non sbaglia mai.
  centesimi     integer not null,
  importo_eur   numeric(12,2) generated always as (centesimi::numeric / 100) stored,
  valuta        text not null default 'eur',

  fornitore     text not null default 'stripe',

  -- ⚠️ QUESTA È LA RIGA CHE IMPEDISCE DI CONTARE DUE VOLTE.
  -- Stripe rimanda lo stesso avviso più volte se non gli si risponde
  -- subito: senza questo «unique», un incasso da 99 euro può diventare
  -- 198 o 297 nei conti. È lo stesso trucco già usato per le ricariche
  -- di crediti (`payment_reference unique`), e lì funziona.
  riferimento   text not null unique,

  tipo_evento   text,            -- checkout.session.completed | invoice.paid | ...
  quando        timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists pagamenti_quando_idx   on public.pagamenti (quando desc);
create index if not exists pagamenti_prodotto_idx on public.pagamenti (prodotto);
create index if not exists pagamenti_email_idx    on public.pagamenti (lower(email));

comment on table public.pagamenti is
  'Scritture contabili: ogni incasso, una riga. Nessun collegamento a auth.users o imprese, e'' voluto: la riga deve sopravvivere al cliente che se ne va. Si scrive solo dal server, con registra_pagamento().';

comment on column public.pagamenti.riferimento is
  'Il numero della transazione Stripe (sessione o fattura). UNIQUE: e'' quello che impedisce a un webhook ripetuto di contare l''incasso due volte.';

-- ---------------------------------------------------------------------
-- 2. IL LUCCHETTO
-- Qui dentro ci sono email e importi. Dal browser non si tocca: RLS
-- accesa, nessuna policy, nessun grant = porta chiusa. Legge e scrive
-- solo il server con la service key, che da queste regole non passa.
-- ---------------------------------------------------------------------
alter table public.pagamenti enable row level security;
revoke all on public.pagamenti from anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. LA FUNZIONE CHE SCRIVE
--
-- Perché una funzione invece di un `insert` dentro ai due webhook: così
-- la regola sta in UN posto solo. Se un domani cambia (una colonna, un
-- controllo in più), si cambia qui e vale per tutti e due. Due copie
-- della stessa cosa in due file diversi vuol dire correggerne una sola.
--
-- Risponde come `add_credits_pack`, che fa già così sul sito:
--   {ok:true}                                 -> scritta
--   {ok:false, reason:'already_processed'}    -> era gia' arrivata
-- ---------------------------------------------------------------------
create or replace function public.registra_pagamento(
  p_prodotto     text,
  p_centesimi    integer,
  p_riferimento  text,
  p_email        text        default null,
  p_user_id      uuid        default null,
  p_impresa_id   uuid        default null,
  p_valuta       text        default 'eur',
  p_tipo_evento  text        default null,
  p_quando       timestamptz default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_riferimento is null or btrim(p_riferimento) = '' then
    return json_build_object('ok', false, 'reason', 'riferimento_mancante');
  end if;
  if p_centesimi is null then
    return json_build_object('ok', false, 'reason', 'importo_mancante');
  end if;

  insert into public.pagamenti
    (prodotto, centesimi, riferimento, email, user_id, impresa_id,
     valuta, tipo_evento, quando)
  values
    (p_prodotto, p_centesimi, btrim(p_riferimento), p_email, p_user_id, p_impresa_id,
     coalesce(p_valuta, 'eur'), p_tipo_evento, coalesce(p_quando, now()));

  return json_build_object('ok', true);

exception
  when unique_violation then
    -- lo stesso avviso di Stripe arrivato due volte: NON si scrive di
    -- nuovo, e non e' un errore. E' il caso normale.
    return json_build_object('ok', false, 'reason', 'already_processed');
end;
$$;

-- ⚠️ CRITICO — SENZA QUESTO REVOKE CHIUNQUE SI SCRIVE INCASSI FINTI.
-- La funzione è `security definer`: gira con i permessi di chi l'ha
-- creata, cioè scavalca RLS. Se resta eseguibile da un utente qualsiasi
-- del sito, quello può inventarsi righe di pagamento a piacere e sporcare
-- la contabilità. È la stessa riga che sta sotto `add_credits_pack`, dove
-- c'era scritto «senza questo revoke un utente si autoricarica crediti».
revoke all on function public.registra_pagamento(
  text, integer, text, text, uuid, uuid, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.registra_pagamento(
  text, integer, text, text, uuid, uuid, text, text, timestamptz) to service_role;

-- ---------------------------------------------------------------------
-- VERIFICA — deve dire «chiusa» e «solo il server»
-- ---------------------------------------------------------------------
select
  case when has_table_privilege('anon','public.pagamenti','SELECT')
         or has_table_privilege('authenticated','public.pagamenti','SELECT')
       then 'ATTENZIONE: si legge dal browser'
       else 'chiusa' end                                        as tabella,
  case when has_function_privilege('anon',
              'public.registra_pagamento(text,integer,text,text,uuid,uuid,text,text,timestamptz)','EXECUTE')
         or has_function_privilege('authenticated',
              'public.registra_pagamento(text,integer,text,text,uuid,uuid,text,text,timestamptz)','EXECUTE')
       then 'ATTENZIONE: chiunque puo- scriversi incassi finti'
       else 'solo il server' end                                as chi_puo_scrivere,
  (select count(*) from public.pagamenti)                       as pagamenti_registrati,
  (select coalesce(sum(importo_eur),0) from public.pagamenti)   as euro_in_tutto;
