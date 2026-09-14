-- sql/promemoria-sezione.sql
--
-- 14 settembre 2026 — LA SEZIONE «PROMEMORIA» DEL GESTIONALE
--
-- LA TABELLA C'ERA GIA' E NON L'AVEVA MAI USATA NESSUNO
-- `promemoria` (id, user_id, testo, data, inviato, created_at) esisteva dal
-- primo giorno, con RLS accesa e la policy owner_all. Al 14 set 2026 aveva
-- →0← righe e →0← persone: era stata costruita e non aveva mai avuto una
-- schermata. Una function (invia-promemoria.js) la leggeva ogni mattina e
-- girava a vuoto.
-- Qui le si aggiunge quello che le manca per essere una sezione vera.
--
-- TUTTO ADDITIVO: le colonne vecchie restano dove sono, e chi legge la tabella
-- come prima continua a funzionare.
--
-- GIA' ESEGUITO SU SUPABASE il 14 set 2026 (migrazione
-- promemoria_sezione_gestionale). Questo file sta nel repo perche' il database
-- si deve poter rifare da zero leggendo sql/.

alter table public.promemoria
  add column if not exists ora            time,
  add column if not exists note           text,
  add column if not exists avvisa_giorni  integer not null default 0,
  add column if not exists ripeti_mesi    integer,
  add column if not exists stato          text not null default 'aperto',
  add column if not exists eliminato_il   timestamptz;

-- ⛔ IL CESTINO. Tutte le tabelle del gestionale hanno `eliminato_il`:
--    cancellare vuol dire scriverci la data, la riga resta e si recupera.
--    Senza questa colonna un promemoria buttato sarebbe perso davvero, e
--    l'email del mattino avrebbe continuato a nominarlo.
--    ⚠️ Va anche aggiunta una riga a CEST_COSE in gestionale-app.html, se no
--       la riga finisce nel cestino ma nel Cestino non la vede nessuno.

-- avvisa_giorni = quanti giorni PRIMA mandare l'avviso. 0 = il giorno stesso.
-- ripeti_mesi   = ogni quanti mesi torna. null = mai.
-- stato         = 'aperto' | 'fatto'.

comment on column public.promemoria.ora is
  'Ora scritta dall''utente. L''email parte comunque la mattina: l''ora finisce DENTRO il testo dell''avviso, non decide quando parte.';
comment on column public.promemoria.avvisa_giorni is
  'Quanti giorni prima avvisare. 0 = il giorno stesso.';
comment on column public.promemoria.ripeti_mesi is
  'Ogni quanti mesi si ripete. null = mai. Quando si segna fatto, se e'' valorizzato la data avanza da sola.';

-- l'indice serve a promemoria-mattina.js, che cerca «i promemoria da avvisare
-- oggi» su tutte le persone insieme
create index if not exists promemoria_data_idx
  on public.promemoria (data)
  where eliminato_il is null and stato = 'aperto';

-- CONTROLLO: la policy deve essere UNA sola, owner_all, e la RLS accesa.
-- Non serve nessuna policy nuova: e' l'iscritto che legge e scrive i suoi
-- promemoria dal browser.
-- select p.policyname, p.cmd, c.relrowsecurity
-- from pg_class c join pg_policies p on p.tablename=c.relname
-- where c.relname='promemoria';
