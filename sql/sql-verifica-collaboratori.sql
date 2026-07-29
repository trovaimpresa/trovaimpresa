-- ============================================================
-- VERIFICA MECCANISMO COLLABORATORI — da eseguire in Supabase SQL Editor
-- Non modifica nulla: solo controlli di lettura.
-- ============================================================

-- 1) La funzione di riscatto invito esiste?
select proname, prosecdef as security_definer
from pg_proc
where proname = 'gest_redeem_invito';
-- Atteso: 1 riga, security_definer = true.
-- Se VUOTO → il collegamento col codice NON può funzionare.

-- 2) Policy RLS sulle tabelle del gestionale
select tablename, policyname, cmd, qual
from pg_policies
where tablename like 'gest_%'
order by tablename, policyname;
-- Da controllare: gest_lavori, gest_clienti, gest_foto, gest_scadenze
-- devono avere ANCHE una policy che permette l'accesso ai membri
-- (qualcosa tipo: exists (select 1 from gest_membri m where m.membro_id = auth.uid()
--   and m.impresa_id = user_id and m.stato = 'attivo')).
-- Se hanno SOLO "user_id = auth.uid()" → i collaboratori vedono TUTTO VUOTO.

-- 3) gest_membri: il collaboratore deve poter leggere la propria riga
select policyname, cmd, qual from pg_policies where tablename = 'gest_membri';
-- Serve una policy di SELECT con membro_id = auth.uid() (oltre a quella del titolare).

-- 4) Policy sullo storage delle foto (bucket gestionale-foto)
select policyname, cmd, qual
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
-- I collaboratori caricano foto in percorsi "impresa_id/lavoro_id/...":
-- serve una policy che li autorizzi (non solo il proprietario del bucket path).

-- 5) Stato attuale di inviti e membri (colpo d'occhio)
select m.codice, m.stato, m.ruolo, o.nome as operatore, m.membro_id is not null as ha_account
from gest_membri m
left join gest_operatori o on o.id = m.operatore_id
order by m.stato;
