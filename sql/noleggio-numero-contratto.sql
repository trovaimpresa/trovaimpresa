-- ============================================================
-- TrovaImpresa — IL NUMERO DEL CONTRATTO SE LO PRENDE DA SOLO
-- 24 agosto 2026
--
-- PERCHE'
-- Al collaudo del 24 agosto e' venuto fuori che il DDT il suo numero se lo
-- prende da solo dal contatore dell'azienda, e il contratto no: quello va
-- scritto a mano, e nessuno te lo dice. Risultato: un contratto stampato,
-- firmato in due punti e scaricato in PDF risultava «mancante» nella
-- schermata Contratti e documenti, con la scritta rossa MANCANO 4.
--
-- Qui si aggiunge il contatore dei contratti accanto a quello dei DDT e
-- delle fatture, con la stessa identica regola: si prende alla PRIMA
-- stampa e poi non cambia piu'.
--
-- ⛔ NON TOGLIE E NON CAMBIA NIENTE di quello che c'e'. Una colonna nuova
--    con un valore di partenza, e il contatore portato avanti se hai gia'
--    scritto dei numeri a mano. Si puo' rilanciare quante volte si vuole.
--
-- Si esegue nell'SQL Editor di Supabase. Risponde con UNA RIGA.
-- ============================================================

-- il contatore, accanto a num_ddt che c'e' gia' dal 23 agosto
alter table public.gest_azienda
  add column if not exists num_contratto integer not null default 1;


-- ------------------------------------------------------------
-- Chi ha gia' scritto dei numeri a mano riparte da dopo l'ultimo, cosi'
-- il gestionale non assegna un numero gia' usato.
-- ⚠️ Si guardano SOLO i numeri fatti di sole cifre, e al massimo nove
--    («14», «207»). Quelli scritti all'italiana con l'anno davanti
--    («2026/014») si contano a parte e si vedono nella risposta: quelli
--    li decidi tu.
-- ⛔ Il limite di nove cifre non e' pignoleria: provando questa query su
--    un PostgreSQL vero, un numero di contratto lunghissimo scritto per
--    sbaglio la faceva fermare a meta' con «out of range». Adesso quel
--    numero viene solo segnalato, e la query arriva in fondo lo stesso.
-- ------------------------------------------------------------
update public.gest_azienda a
set num_contratto = greatest(
  a.num_contratto,
  coalesce((select max(n.contratto_num::bigint)
            from public.nol_noleggi n
            where n.user_id = a.user_id
              and n.contratto_num ~ '^[0-9]{1,9}$'), 0) + 1
);


-- ------------------------------------------------------------
-- UNA RIGA DI RISPOSTA
--   contatore     -> deve essere 1 (la colonna c'e')
--   prossimo      -> il numero che il gestionale dara' al primo contratto
--   da_guardare   -> contratti col numero scritto a mano che il contatore
--                    non sa leggere (con l'anno davanti, o lunghissimo):
--                    se e' 0 non devi fare niente
-- ------------------------------------------------------------
select
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='gest_azienda'
       and column_name='num_contratto')                        as contatore,
  (select coalesce(max(num_contratto),1) from public.gest_azienda) as prossimo,
  (select count(*) from public.nol_noleggi
     where contratto_num is not null
       and contratto_num !~ '^[0-9]{1,9}$')                    as da_guardare;
