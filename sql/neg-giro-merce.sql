-- ============================================================
-- IL GIRO DELLA MERCE NEL NEGOZIO
-- TrovaImpresa — 26 agosto 2026
--
-- ✅ ESEGUITA il 26 agosto 2026 alle 19.35, dal connettore Supabase.
--    Risposta: colonne_pronte = 3, blocchi_sulla_parola = 0.
--    Sicuro da rilanciare: non fa danni se gira una seconda volta.
--
-- A cosa serve. Oggi nel negozio la merce che entra, la merce che esce e
-- la giacenza sono tre cose scollegate: la vendita nei Movimenti non
-- scala il magazzino, e il + / - del Magazzino non lascia nessuna
-- traccia. Queste tre colonne chiudono il giro.
--
--  1. neg_movimenti.prodotto_id     (uuid, neg_prodotti.id)
--     QUALE prodotto del magazzino tocca questo movimento. Vuoto = riga
--     scritta a mano (trasporto, manodopera, roba che non tieni a
--     magazzino): quella non scala niente, ed e' voluto.
--     ⛔ Vuoto NON vuol dire errore: vuol dire "fuori magazzino".
--
--  2. neg_movimenti.motivo          (text)
--     Il perche' di una rettifica: rotti | inventario | calo | omaggio.
--     Senza il perche' la traccia direbbe solo "e' cambiato".
--
--  3. neg_movimenti.arrivato_il     (date)
--     Quando la merce dell'ordine e' entrata davvero.
--     ⛔ VUOTO = ordine ancora IN ARRIVO, magazzino non ancora caricato.
--     Il caricamento avviene una volta sola, il giorno che si spunta
--     "Merce arrivata": e' il lucchetto contro il doppio carico, la
--     stessa rete del preventivo accettato.
--
-- ⚠️ E poi c'e' la PAROLA NUOVA. Fino a oggi neg_movimenti.tipo valeva
--    'vendita' o 'ordine'. Da adesso vale anche 'rettifica'. Se sulla
--    colonna ci fosse un CHECK che elenca i valori ammessi, la riga
--    nuova verrebbe rifiutata: il blocco DO qui sotto lo toglie, se c'e'.
--    (Se non c'e', non fa niente e non da' errore.)
--
-- ⛔ La parola nuova va aggiornata anche in TUTTI i posti che leggono
--    'tipo': elenco movimenti, riepilogo (venduto/ordinato del mese),
--    report, export Excel e CSV. E' la lezione di 'uscita', trovata
--    stamattina dal banco. Il codice nuovo lo fa; questa query e' solo
--    il permesso del database.
-- ============================================================

alter table public.neg_movimenti
  add column if not exists prodotto_id uuid
    references public.neg_prodotti(id) on delete set null;
alter table public.neg_movimenti add column if not exists motivo      text;
alter table public.neg_movimenti add column if not exists arrivato_il date;

comment on column public.neg_movimenti.prodotto_id is
  'Prodotto del magazzino toccato dal movimento. Vuoto = riga a mano, fuori magazzino: non scala niente.';
comment on column public.neg_movimenti.motivo is
  'Perche di una rettifica di magazzino: rotti | inventario | calo | omaggio.';
comment on column public.neg_movimenti.arrivato_il is
  'Giorno in cui la merce dell ordine e entrata. Vuoto = ancora in arrivo, magazzino non caricato.';

-- il permesso per la terza parola: via ogni CHECK che elenca i valori di tipo
do $$
declare c record;
begin
  for c in
    select con.conname
      from pg_constraint con
      join pg_class     rel on rel.oid = con.conrelid
      join pg_namespace ns  on ns.oid  = rel.relnamespace
     where ns.nspname   = 'public'
       and rel.relname  = 'neg_movimenti'
       and con.contype  = 'c'
       and pg_get_constraintdef(con.oid) ilike '%tipo%'
  loop
    execute format('alter table public.neg_movimenti drop constraint %I', c.conname);
  end loop;
end $$;

-- cercare i movimenti di un prodotto deve restare veloce
create index if not exists neg_movimenti_prodotto_id_idx
  on public.neg_movimenti(prodotto_id);

-- una riga sola di risultato: deve dire  3  e  0
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'neg_movimenti'
      and column_name in ('prodotto_id','motivo','arrivato_il')) as colonne_pronte,
  (select count(*) from pg_constraint con
      join pg_class     rel on rel.oid = con.conrelid
      join pg_namespace ns  on ns.oid  = rel.relnamespace
     where ns.nspname  = 'public' and rel.relname = 'neg_movimenti'
       and con.contype = 'c'
       and pg_get_constraintdef(con.oid) ilike '%tipo%')          as blocchi_sulla_parola;

-- ============================================================
-- ⚠️ SI PUO' LANCIARE ANCHE PRIMA che il codice nuovo sia online: le
-- colonne in piu' non danno fastidio a nessuno, e i movimenti gia'
-- scritti restano com'erano (prodotto_id vuoto = riga a mano, che e'
-- esattamente quello che erano).
-- ============================================================
