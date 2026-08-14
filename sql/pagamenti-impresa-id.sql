-- =====================================================================
-- TrovaImpresa — CORREZIONE: `impresa_id` era del tipo sbagliato
-- Da salvare come  sql/pagamenti-impresa-id.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 14 agosto 2026 (notte)
--
-- ---------------------------------------------------------------------
-- COSA AVEVO SBAGLIATO
-- ---------------------------------------------------------------------
-- In `pagamenti` avevo fatto `impresa_id uuid`. Ma su TrovaImpresa
-- `imprese.id` è un NUMERO: 67, 68, 69. L'ho visto guardando una riga
-- vera di `annunci_pubblicitari`, dopo aver già consegnato la tabella.
--
-- Conseguenze, se non si corregge:
--
--   1. Al prossimo annuncio pagato, il webhook della pubblicità prova a
--      infilare 67 dentro una colonna uuid, PostgreSQL rifiuta, e
--      l'incasso NON viene registrato. In silenzio: per progetto quel
--      pezzo non blocca il cliente, quindi l'annuncio si attiva
--      regolarmente e nessuno si accorge che la riga non c'è.
--      È il modo peggiore di sbagliare: tutto sembra funzionare.
--
--   2. Il file di recupero dell'annuncio già pagato darebbe errore.
--
-- ---------------------------------------------------------------------
-- PERCHÉ TESTO E NON «NUMERO»
-- ---------------------------------------------------------------------
-- Perché qui dentro `impresa_id` è solo un riferimento per ritrovare le
-- cose, non una chiave su cui il database deve ragionare (non c'è nessun
-- collegamento, apposta: la riga dell'incasso deve sopravvivere
-- all'impresa che se ne va). Come testo ci sta il numero di oggi e ci
-- starebbe anche un uuid domani, senza rifare niente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. LA COLONNA
-- La tabella è vuota, quindi il cambio è immediato. `using` serve lo
-- stesso: se ci fosse dentro qualcosa, verrebbe convertito invece di far
-- fallire tutto.
-- ---------------------------------------------------------------------
do $$
begin
  if to_regclass('public.pagamenti') is null then
    raise notice 'la tabella pagamenti non esiste: lancia prima sql/pagamenti.sql';
    return;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pagamenti'
      and column_name = 'impresa_id' and data_type = 'uuid'
  ) then
    alter table public.pagamenti
      alter column impresa_id type text using impresa_id::text;
    raise notice 'impresa_id: da uuid a testo, fatto';
  else
    raise notice 'impresa_id e- gia- testo: niente da fare';
  end if;
end $$;

comment on column public.pagamenti.impresa_id is
  'Il numero dell''impresa come TESTO: su TrovaImpresa imprese.id e'' un numero (67, 68...), non un uuid. E'' solo un riferimento per ritrovare le cose: nessun collegamento, se no la riga dell''incasso sparirebbe con l''impresa.';

-- ---------------------------------------------------------------------
-- 2. LA FUNZIONE
--
-- ⚠️ QUI SI DEVE PER FORZA CANCELLARE, NON BASTA «create or replace».
-- Cambiando il tipo di un parametro, PostgreSQL non sostituisce la
-- funzione: ne crea una SECONDA con lo stesso nome. Resterebbero tutte e
-- due, e — cosa peggiore — quella nuova nascerebbe eseguibile da
-- CHIUNQUE, perché il `revoke` che avevamo messo vale solo per la
-- vecchia. Cioè un utente qualsiasi del sito potrebbe scriversi incassi
-- finti. Quindi: prima si toglie quella vecchia, poi si rifà.
-- ---------------------------------------------------------------------
drop function if exists public.registra_pagamento(
  text, integer, text, text, uuid, uuid, text, text, timestamptz);

create or replace function public.registra_pagamento(
  p_prodotto     text,
  p_centesimi    integer,
  p_riferimento  text,
  p_email        text        default null,
  p_user_id      uuid        default null,
  p_impresa_id   text        default null,
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
    return json_build_object('ok', false, 'reason', 'already_processed');
end;
$$;

revoke all on function public.registra_pagamento(
  text, integer, text, text, uuid, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.registra_pagamento(
  text, integer, text, text, uuid, text, text, text, timestamptz) to service_role;

-- ---------------------------------------------------------------------
-- VERIFICA — deve dire «testo», «una sola» e «solo il server»
-- ---------------------------------------------------------------------
select
  (select data_type from information_schema.columns
    where table_schema='public' and table_name='pagamenti' and column_name='impresa_id')
                                                                as tipo_impresa_id,
  case (select count(*) from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname='public' and p.proname='registra_pagamento')
    when 1 then 'una sola'
    else 'ATTENZIONE: ce ne sono piu- di una, la vecchia non e- stata tolta'
  end                                                           as quante_funzioni,
  case when has_function_privilege('anon',
              'public.registra_pagamento(text,integer,text,text,uuid,text,text,text,timestamptz)','EXECUTE')
         or has_function_privilege('authenticated',
              'public.registra_pagamento(text,integer,text,text,uuid,text,text,text,timestamptz)','EXECUTE')
       then 'ATTENZIONE: chiunque puo- scriversi incassi finti'
       else 'solo il server' end                                as chi_puo_scrivere,
  (select count(*) from public.pagamenti)                       as pagamenti_registrati;
