-- ============================================================
-- TrovaImpresa — IL TETTO GIORNALIERO DELL'ASSISTENTE
-- 21 agosto 2026
--
-- A COSA SERVE
-- netlify/functions/ai-orienta.js e' la nuvoletta in basso a destra: un
-- visitatore scrive cosa gli serve e lei gli dice quale delle quattro
-- ricerche aprire. Chiama Anthropic con la chiave di Alessio, e fino a
-- oggi non aveva NESSUN limite: chi trovava l'indirizzo poteva chiamarla
-- all'infinito e far salire la bolletta a piacere.
--
-- Qui dentro c'e' solo il contatore: una riga per giorno e per indirizzo.
-- I tetti (quanti al giorno per indirizzo, quanti in tutto) stanno nella
-- function, e si possono cambiare dalle variabili di Netlify senza push:
--   AI_ORIENTA_TETTO_IP       (di suo 15)
--   AI_ORIENTA_TETTO_GIORNO   (di suo 400)
--
-- ⚠️ NIENTE DATI DI PERSONE. Si scrive solo l'indirizzo di rete e la data.
-- Le righe piu' vecchie di 30 giorni le cancella la funzione stessa, una
-- volta al giorno, cosi' la tabella non cresce all'infinito.
--
-- Si esegue nell'SQL Editor di Supabase. Si puo' rilanciare quante volte
-- si vuole. In fondo risponde con una riga che dice com'e' andata.
-- ============================================================

create table if not exists public.ai_orienta_uso (
  giorno date not null default current_date,
  chiave text not null,                       -- l'indirizzo di rete, oppure 'TUTTI'
  quante integer not null default 0,
  primary key (giorno, chiave)
);

-- Nessuno la legge dal browser: la scrive solo la function, col
-- service_role, che passa sopra le regole. Qui chiudiamo tutto il resto.
alter table public.ai_orienta_uso enable row level security;
revoke all on public.ai_orienta_uso from anon, authenticated;


-- ------------------------------------------------------------
-- IL CONTATORE
-- Una chiamata sola conta due cose: quante ne ha fatte questo indirizzo
-- oggi, e quante ne sono state fatte in tutto oggi. Il "+1" e' dentro
-- l'insert, quindi due richieste nello stesso istante non si sovrascrivono
-- (e' il motivo per cui non si legge-e-poi-scrive dal JavaScript).
-- ------------------------------------------------------------
create or replace function public.ai_orienta_segna(_ip text)
returns table(per_ip integer, totale integer)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_ip     integer;
  v_totale integer;
begin
  insert into public.ai_orienta_uso(giorno, chiave, quante)
       values (current_date, coalesce(nullif(trim(_ip),''),'sconosciuto'), 1)
  on conflict (giorno, chiave)
    do update set quante = public.ai_orienta_uso.quante + 1
    returning quante into v_ip;

  insert into public.ai_orienta_uso(giorno, chiave, quante)
       values (current_date, 'TUTTI', 1)
  on conflict (giorno, chiave)
    do update set quante = public.ai_orienta_uso.quante + 1
    returning quante into v_totale;

  -- pulizia: una volta al giorno, quando il contatore di 'TUTTI' e' a 1
  if v_totale = 1 then
    delete from public.ai_orienta_uso where giorno < current_date - 30;
  end if;

  per_ip := v_ip;
  totale := v_totale;
  return next;
end
$$;

revoke all on function public.ai_orienta_segna(text) from public, anon, authenticated;
grant execute on function public.ai_orienta_segna(text) to service_role;


-- ------------------------------------------------------------
-- LA RIGA DI RISULTATO
-- ------------------------------------------------------------
select 'contatore pronto  ·  righe di oggi: '
    || (select count(*)::text from public.ai_orienta_uso where giorno = current_date)
    || '  ·  lo puo usare solo il server: '
    || case when has_function_privilege('service_role','public.ai_orienta_segna(text)','execute')
             and not has_function_privilege('anon','public.ai_orienta_segna(text)','execute')
            then 'si' else 'NO — QUALCOSA E ANDATO STORTO' end
    || '  ·  dal browser la tabella non si legge: '
    || case when not has_table_privilege('anon','public.ai_orienta_uso','select')
            then 'giusto' else 'NO — QUALCOSA E ANDATO STORTO' end
       as risultato;
