-- =====================================================================
-- I FILE CHE RESTAVANO NEL MAGAZZINO PER SEMPRE     5 settembre 2026
-- =====================================================================
-- Il problema: cancellando una richiesta di preventivo (o un preventivo
-- di cantiere, o una foto, o una fattura) la RIGA spariva ma il FILE no.
-- Sul magazzino non c'era nessun permesso di cancellazione, quindi il
-- `remove()` del sito falliva — e nessuno lo leggeva, quindi falliva
-- ZITTO. Stessa famiglia del difetto n.1 del 4 settembre.
--
-- Il modello copiato e' `foto_lavori_owner_delete`, che sta in piedi da
-- mesi: «puoi cancellare solo dentro la cartella che e' tua».
--
-- ⚠️ LE CARTELLE NON HANNO TUTTE LA STESSA FORMA:
--   preventivi-allegati  →  preventivi/<id impresa>/<file>   → posto [2]
--   cantieri-*           →  <id cantiere>/<file>             → posto [1]
-- Sbagliare il numero vuol dire dare a uno il permesso di cancellare la
-- roba di un altro. Il banco `banco-cancella-allegati.js` lo prova.
--
-- Tutto idempotente: si puo' rilanciare.
-- =====================================================================

-- 1) GLI ALLEGATI DELLE RICHIESTE DI PREVENTIVO
--    Cancella solo l'impresa padrona della cartella.
drop policy if exists "prevall_delete_owner" on storage.objects;
create policy "prevall_delete_owner"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'preventivi-allegati'
  and exists (
    select 1 from public.imprese im
    where im.user_id = auth.uid()
      and im.id::text = (storage.foldername(name))[2]
  )
);

-- 2) I PREVENTIVI DEL CANTIERE
drop policy if exists "cantprev_delete_owner" on storage.objects;
create policy "cantprev_delete_owner"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'cantieri-preventivi'
  and exists (
    select 1 from public.cantieri c
    where c.user_id = auth.uid()
      and c.id::text = (storage.foldername(name))[1]
  )
);

-- 3) LE FOTO DEL CANTIERE
drop policy if exists "cantfoto_delete_owner" on storage.objects;
create policy "cantfoto_delete_owner"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'cantieri-foto'
  and exists (
    select 1 from public.cantieri c
    where c.user_id = auth.uid()
      and c.id::text = (storage.foldername(name))[1]
  )
);

-- 4) LE FATTURE DEL CANTIERE
drop policy if exists "cantfatt_delete_owner" on storage.objects;
create policy "cantfatt_delete_owner"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'cantieri-fatture'
  and exists (
    select 1 from public.cantieri c
    where c.user_id = auth.uid()
      and c.id::text = (storage.foldername(name))[1]
  )
);

-- =====================================================================
-- 5) I CANTIERI: ANCHE LEGGERE E SCRIVERE  (passato dopo, col si' di Alex)
-- =====================================================================
-- ⛔ SCOPERTO COL BANCO: per cancellare una riga il database deve prima
-- POTERLA VEDERE. Sui 3 magazzini dei cantieri non c'era nessun permesso
-- di lettura, quindi i permessi di cancellazione qui sopra non facevano
-- niente: il file era invisibile, e un file invisibile non si cancella.
-- Ed essendoci nemmeno il permesso di SCRIVERE, nei Cantieri non si e'
-- mai potuto allegare niente: 1 cantiere, 0 foto, 0 preventivi con file,
-- 0 fatture con file. Il pulsante c'era in 3 pannelli, non ha mai
-- funzionato per nessuno.
drop policy if exists "cant_insert_owner" on storage.objects;
create policy "cant_insert_owner"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('cantieri-preventivi','cantieri-foto','cantieri-fatture')
  and exists (
    select 1 from public.cantieri c
    where c.user_id = auth.uid()
      and c.id::text = (storage.foldername(name))[1]
  )
);

drop policy if exists "cant_select_owner" on storage.objects;
create policy "cant_select_owner"
on storage.objects for select
to authenticated
using (
  bucket_id in ('cantieri-preventivi','cantieri-fatture')
  and exists (
    select 1 from public.cantieri c
    where c.user_id = auth.uid()
      and c.id::text = (storage.foldername(name))[1]
  )
);

-- cantieri-foto e' un magazzino PUBBLICO (le foto si mostrano con un
-- indirizzo diretto), quindi la lettura e' aperta come per foto-lavori.
drop policy if exists "cantfoto_select_pubblico" on storage.objects;
create policy "cantfoto_select_pubblico"
on storage.objects for select
to public
using ( bucket_id = 'cantieri-foto' );

-- =====================================================================
-- Il banco che prova tutto questo:
--   prove-claude/banchi-fissi/allegati/permessi-cancella.sql
-- Passato il 5 set 2026: 12 verdi, 0 rossi, sabotaggio visto.
-- =====================================================================
