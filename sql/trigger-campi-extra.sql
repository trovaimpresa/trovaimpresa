-- =====================================================================
-- TrovaImpresa — Campi extra alla registrazione (negozio e artigiano)
-- Da salvare come  sql/trigger-campi-extra.sql
-- Incolla tutto in Supabase > SQL Editor > Run
--
-- AGGIORNATO l'8 agosto 2026: salva anche i campi del blocco facoltativo
--   "Aggiungi altri dettagli" (P.IVA, indirizzo, CAP, descrizione, WhatsApp,
--   sito, specializzazioni, zone, anno, dipendenti, anni di esperienza).
--   Prima venivano chiesti nel modulo e buttati via.
--   Si puo' rieseguire quante volte si vuole (create or replace).
--
-- PROBLEMA (trovato l'8 agosto 2026):
--   Il form del NEGOZIO obbliga a scegliere la categoria (Ferramenta,
--   Termoidraulica...) ma quel dato non arrivava mai nel profilo: la
--   ricerca negozi filtra su `tipo_negozio` e mostra `nome_negozio`,
--   quindi il negozio si iscriveva e non compariva MAI quando un cliente
--   filtrava per la sua categoria. Stessa cosa per il 2° e 3° mestiere
--   dell'artigiano: chiesti, controllati e buttati via.
--
-- SCELTA PROGETTUALE:
--   NON si tocca la function `crea_profilo_impresa` esistente (è il pezzo
--   più delicato del sito: se si rompe, nessuno riesce più a iscriversi).
--   Si aggiunge un SECONDO trigger che gira DOPO e completa la riga.
--   Il nome finisce per "_extra": in Postgres, a parità di evento, i
--   trigger scattano in ordine alfabetico, quindi questo viene dopo
--   `on_auth_user_created`.
--
--   Se qualcosa qui dentro va storto, la registrazione NON si blocca:
--   l'eccezione viene ingoiata di proposito (meglio un campo mancante
--   che un'iscrizione persa).
-- =====================================================================

create or replace function public.completa_profilo_extra()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  m           jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_tipo      text  := lower(coalesce(m->>'tipo', ''));
  v_negozio   text  := nullif(trim(coalesce(m->>'tipo_negozio', '')), '');
  v_nomeneg   text  := nullif(trim(coalesce(m->>'nome_negozio', '')), '');
  v_mestieri  text[];
begin
  -- solo i 4 tipi business: i candidati hanno la loro tabella
  if v_tipo not in ('impresa', 'artigiano', 'professionista', 'negozio') then
    return new;
  end if;

  -- elenco mestieri (artigiano: principale + secondario + terzo)
  if m ? 'mestieri' and jsonb_typeof(m->'mestieri') = 'array' then
    select array_agg(x) into v_mestieri
    from jsonb_array_elements_text(m->'mestieri') as t(x)
    where nullif(trim(x), '') is not null;
  end if;

  update public.imprese
     set nome_negozio     = coalesce(v_nomeneg,  nome_negozio),
         tipo_negozio     = coalesce(v_negozio,  tipo_negozio),
         mestieri         = coalesce(v_mestieri, mestieri),
         -- campi facoltativi del modulo (blocco "Aggiungi altri dettagli"):
         -- se l'impresa li compila non devono andare persi
         piva             = coalesce(nullif(trim(coalesce(m->>'piva','')),''),             piva),
         indirizzo        = coalesce(nullif(trim(coalesce(m->>'indirizzo','')),''),        indirizzo),
         cap              = coalesce(nullif(trim(coalesce(m->>'cap','')),''),              cap),
         descrizione      = coalesce(nullif(trim(coalesce(m->>'descrizione','')),''),      descrizione),
         whatsapp         = coalesce(nullif(trim(coalesce(m->>'whatsapp','')),''),         whatsapp),
         sito_web         = coalesce(nullif(trim(coalesce(m->>'sito_web','')),''),         sito_web),
         specializzazioni = coalesce(nullif(trim(coalesce(m->>'specializzazioni','')),''), specializzazioni),
         zone             = coalesce(nullif(trim(coalesce(m->>'zone','')),''),             zone),
         anno_fondazione  = coalesce((nullif(regexp_replace(coalesce(m->>'anno_fondazione',''),'[^0-9]','','g'),''))::int,  anno_fondazione),
         dipendenti       = coalesce((nullif(regexp_replace(coalesce(m->>'dipendenti',''),'[^0-9]','','g'),''))::int,       dipendenti),
         anni_esperienza  = coalesce((nullif(regexp_replace(coalesce(m->>'anni_esperienza',''),'[^0-9]','','g'),''))::int,  anni_esperienza)
   where user_id = new.id;

  return new;
exception when others then
  -- mai bloccare la registrazione per colpa di un campo in più
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_extra on auth.users;
create trigger on_auth_user_created_extra
  after insert on auth.users
  for each row execute function public.completa_profilo_extra();

-- ---------------------------------------------------------------------
-- VERIFICA (dopo una registrazione di prova di un negozio)
-- ---------------------------------------------------------------------
-- select nome, tipo, tipo_negozio, nome_negozio, mestieri
--   from public.imprese order by created_at desc limit 3;
