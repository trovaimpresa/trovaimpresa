-- 4 novembre 2026 — NIENTE LINK NEI MESSAGGI CHE ARRIVANO ALLE IMPRESE
--
-- La truffa del «finto preventivo»: un finto cliente manda un link,
-- l'impresa lo apre, mette la password di Google o Microsoft, e il
-- truffatore entra nella sua email e cambia l'IBAN sulle fatture.
-- La richiesta di preventivo arriva all'impresa per email FIRMATA
-- TrovaImpresa: e' il canale piu' credibile per un truffatore.
--
-- Prima di oggi i link erano bloccati solo nella bacheca/forum
-- (bacheca-pubblica.js). Qui si chiudono le altre porte, nel database,
-- cosi' vale anche per chi scavalca la pagina e scrive con la chiave pubblica.
--
-- Si controllano SOLO i testi scritti da chi arriva da fuori:
--   preventivi, incarichi_richieste, richieste_clienti  (clienti -> imprese)
--   chat_messaggi                                         (solo mittente = cliente)
--   subappalti, candidature                               (annunci e candidature)
-- L'impresa che RISPONDE in chat puo' ancora mettere il suo sito.
-- Le colonne con le foto/allegati (indirizzi del nostro deposito) non si guardano.
-- Le email scritte nel testo (mario@gmail.com) NON contano come link.
-- trovaimpresa.com nel testo e' permesso.
-- Solo INSERT: le risposte delle imprese (UPDATE) non passano di qui.
--
-- Misurato prima di accendere: 0 righe vecchie su tutte queste tabelle
-- sarebbero state bloccate.

create or replace function public.ha_link(t text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select coalesce(
    regexp_replace(
      regexp_replace(lower(t), '[[:alnum:]._%+-]+@[[:alnum:].-]+', ' ', 'g'),
      '\mtrovaimpresa\.(com|it)\M', ' ', 'g')
    ~ '(https?:|www\.|\m[a-z0-9-]+\.(com|it|net|org|eu|info|biz|ly|gl|cc|ws|tk|ru|cn|xyz|top|site|online|link|click|app|page|dev|live|shop|store|club)\M)',
    false);
$$;

create or replace function public.blocca_link_moduli()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  t text;
begin
  if tg_table_name = 'chat_messaggi' then
    if new.mittente is distinct from 'cliente' then return new; end if;
    t := concat_ws(' ', new.testo, new.cliente_nome);
  elsif tg_table_name = 'preventivi' then
    t := concat_ws(' ', new.descrizione, new.note_aggiuntive, new.tipo_lavoro, new.via,
                   new.nome, new.cognome, new.citta, new.voci_lavoro::text);
  elsif tg_table_name = 'incarichi_richieste' then
    t := concat_ws(' ', new.note, new.prestazione, new.comune, new.nome);
  elsif tg_table_name = 'richieste_clienti' then
    t := concat_ws(' ', new.ricerca, new.nome, new.zona);
  elsif tg_table_name = 'subappalti' then
    t := concat_ws(' ', new.descrizione, new.lavoro, new.nome_impresa);
  elsif tg_table_name = 'candidature' then
    t := new.messaggio;
  else
    return new;
  end if;

  if public.ha_link(t) then
    raise exception 'Niente link: scrivi a parole, senza indirizzi di siti internet.'
      using errcode = 'check_violation', hint = 'LINK_VIETATO';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_blocca_link on public.preventivi;
create trigger trg_blocca_link before insert on public.preventivi
  for each row execute function public.blocca_link_moduli();

drop trigger if exists trg_blocca_link on public.incarichi_richieste;
create trigger trg_blocca_link before insert on public.incarichi_richieste
  for each row execute function public.blocca_link_moduli();

drop trigger if exists trg_blocca_link on public.richieste_clienti;
create trigger trg_blocca_link before insert on public.richieste_clienti
  for each row execute function public.blocca_link_moduli();

drop trigger if exists trg_blocca_link on public.chat_messaggi;
create trigger trg_blocca_link before insert on public.chat_messaggi
  for each row execute function public.blocca_link_moduli();

drop trigger if exists trg_blocca_link on public.subappalti;
create trigger trg_blocca_link before insert on public.subappalti
  for each row execute function public.blocca_link_moduli();

drop trigger if exists trg_blocca_link on public.candidature;
create trigger trg_blocca_link before insert on public.candidature
  for each row execute function public.blocca_link_moduli();
