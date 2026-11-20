-- 20 nov 2026 — CREDITI FORMATIVI: come conta il tuo Ordine + attestato.
-- Additivo: le righe che ci sono restano uguali (periodo vuoto = conto
-- dell'anno con cfp_obiettivo, come prima).
alter table public.gest_azienda
  add column if not exists cfp_ordine  text,
  add column if not exists cfp_periodo smallint,
  add column if not exists cfp_inizio  smallint,
  add column if not exists cfp_deont   numeric(6,2);

alter table public.gest_azienda drop constraint if exists gest_azienda_cfp_periodo_chk;
alter table public.gest_azienda add constraint gest_azienda_cfp_periodo_chk
  check (cfp_periodo is null or cfp_periodo in (1,3));

-- il file dell'attestato sta nel deposito «gestionale-foto», cartella <utente>/attestati/
alter table public.gest_crediti
  add column if not exists attestato_path text,
  add column if not exists attestato_nome text;

-- gli attestati sono della PERSONA: nessun collaboratore li legge o li carica.
-- gest_file_reparto riconosce la cartella «attestati», gest_puo_file la chiude
-- (stessa riga di «commercialista» e «fornitori»; il titolare passa sempre).
CREATE OR REPLACE FUNCTION public.gest_file_reparto(_path text)
 RETURNS text LANGUAGE sql IMMUTABLE
 SET search_path TO 'public', 'storage', 'pg_catalog'
AS $function$
  select case coalesce((storage.foldername(_path))[2],'')
           when 'fatture'        then 'fatture'
           when 'clienti'        then 'clienti'
           when 'fornitori'      then 'fornitori'
           when 'commercialista' then 'commercialista'
           when 'giornate'       then 'giornate'
           when 'attestati'      then 'attestati'
           else 'lavoro' end;
$function$;
-- gest_puo_file: aggiunta la riga  when 'attestati' then false
-- (testo intero nella migrazione attestati_solo_titolare_20nov2026)
