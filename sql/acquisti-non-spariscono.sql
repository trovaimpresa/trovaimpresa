-- =====================================================================
-- TrovaImpresa — GLI ACQUISTI NON SPARISCONO PIÙ
-- Da salvare come  sql/acquisti-non-spariscono.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 14 agosto 2026 (notte)
--
-- ---------------------------------------------------------------------
-- COSA SUCCEDE OGGI
-- ---------------------------------------------------------------------
-- `ai_credit_purchases` è l'UNICA tabella di tutto il sito dove è scritto
-- un pagamento con dentro l'importo: quanti crediti, quanti euro, con che
-- sistema, e il numero della transazione Stripe.
--
-- Quella tabella è agganciata all'account con la cascata:
--
--     user_id uuid not null references auth.users(id) on delete cascade
--
-- Vuol dire che quando la persona fa «annulla iscrizione», la riga del
-- pagamento sparisce insieme a lei. I soldi sono entrati davvero sul
-- conto Stripe — ma nel database non risulta più che siano mai entrati.
--
-- ⚠️ NON È UN'IPOTESI. Riprodotto su un PostgreSQL 16 vero
-- (prove-claude/banco/gest/nuove/soldi-che-spariscono.sql): due acquisti
-- da 50 e 20 euro, l'utente si cancella, e la tabella resta a ZERO righe
-- e ZERO euro. Con la correzione di questo file, gli stessi due acquisti
-- restano e il totale continua a dire 70.
--
-- ---------------------------------------------------------------------
-- PERCHÉ È DIVERSO DA TUTTO IL RESTO
-- ---------------------------------------------------------------------
-- I lavori, i preventivi, le foto di chi si cancella è giusto che se ne
-- vadano con lui: sono roba sua. Una ricevuta no. La ricevuta è di chi ha
-- incassato, e va tenuta anche quando il cliente ha chiuso il negozio.
-- Non è nemmeno una scelta: la contabilità si conserva per legge.
--
-- Il danno peggiore non è perdere una riga: è che il totale dell'anno
-- diventa più BASSO e continua a sembrare giusto. Non se ne accorge
-- nessuno, mai.
--
-- ---------------------------------------------------------------------
-- E IL DIRITTO DI SPARIRE?
-- ---------------------------------------------------------------------
-- Resta intero, perché qui dentro NON c'È IL NOME DI NESSUNO. La riga ha
-- l'importo, la data e il numero della transazione. Niente email, niente
-- telefono, niente partita IVA: `user_id` è solo un numero che, una volta
-- cancellato l'account, non porta più da nessuna parte.
--
-- La divisione giusta è questa:
--   · TrovaImpresa tiene i NUMERI (quanto, quando);
--   · Stripe tiene CHI (ce l'ha già, e per legge deve tenerlo lui).
-- Se un domani serve risalire a una transazione, si parte dal
-- `payment_reference` e si guarda su Stripe.
--
-- E se qualcuno chiede di cancellare anche quel numero, si può: sotto si
-- toglie anche il «not null», così `user_id` si può svuotare senza
-- buttare via la riga contabile.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. VIA IL VINCOLO CHE PORTA VIA LA RIGA
--
-- ⚠️ il nome del vincolo NON si scrive a mano. Su un database vero può
-- chiamarsi in tanti modi diversi (dipende da come è stata creata la
-- tabella), e una query che indovina il nome fallisce in silenzio o dà
-- errore. Qui si CERCA il vincolo che parte da user_id, qualunque nome
-- abbia, e si toglie quello.
-- ---------------------------------------------------------------------
do $$
declare v_nome text;
begin
  if to_regclass('public.ai_credit_purchases') is null then
    raise notice 'ai_credit_purchases non esiste: niente da fare';
    return;
  end if;

  select con.conname into v_nome
  from pg_constraint con
  join pg_class c      on c.oid = con.conrelid
  join pg_namespace n  on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'ai_credit_purchases'
    and con.contype = 'f'
    and con.conkey = array[(select attnum from pg_attribute
                            where attrelid = c.oid and attname = 'user_id')];

  if v_nome is null then
    raise notice 'il collegamento non c-e- gia- piu-: questa query e- gia- stata lanciata';
  else
    execute format('alter table public.ai_credit_purchases drop constraint %I', v_nome);
    raise notice 'tolto il collegamento %', v_nome;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2. `user_id` PUÒ RESTARE VUOTO
-- Non serve per i conti. Serve solo a raggruppare gli acquisti della
-- stessa persona finché c'è. Se un domani va svuotato per una richiesta
-- di cancellazione, la riga contabile deve poter restare lo stesso.
-- ---------------------------------------------------------------------
alter table public.ai_credit_purchases
  alter column user_id drop not null;

-- ---------------------------------------------------------------------
-- 3. UN PROMEMORIA SCRITTO NEL DATABASE
-- Fra sei mesi nessuno si ricorderà perché qui manca il collegamento, e
-- il primo che rifà lo schema lo rimette «perché mancava». Questo commento
-- si legge da Supabase, sulla tabella.
-- ---------------------------------------------------------------------
comment on column public.ai_credit_purchases.user_id is
  'NIENTE references auth.users, e'' voluto: con la cascata la riga del pagamento spariva insieme all''account e i conti dell''anno diventavano piu'' bassi senza che se ne accorgesse nessuno. Qui restano solo i numeri (importo, data, riferimento Stripe): il nome non c''e'' mai stato.';

comment on table public.ai_credit_purchases is
  'Scritture contabili: le ricariche di crediti pagate. Si conservano anche dopo che la persona ha annullato l''iscrizione. Chi ha pagato lo sa Stripe, a partire da payment_reference.';

-- ---------------------------------------------------------------------
-- VERIFICA — deve dire «adesso restano»
-- E ti dice anche quanto hai incassato finora, che è la cosa che questa
-- tabella serve a non farti perdere.
-- ---------------------------------------------------------------------
select
  case when exists (
         select 1
         from pg_constraint con
         join pg_class c     on c.oid = con.conrelid
         join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public'
           and c.relname = 'ai_credit_purchases'
           and con.contype = 'f'
           and con.conkey = array[(select attnum from pg_attribute
                                   where attrelid = c.oid and attname = 'user_id')]
       )
       then 'ATTENZIONE: il collegamento c-e- ancora, gli acquisti spariscono'
       else 'adesso restano' end                                as cascata,
  (select count(*)  from public.ai_credit_purchases)            as acquisti_registrati,
  (select coalesce(sum(amount_eur), 0)
     from public.ai_credit_purchases)                           as euro_incassati,
  (select count(*) from public.ai_credit_purchases p
     where not exists (select 1 from auth.users u where u.id = p.user_id))
                                                                as di_gente_gia_andata_via;
