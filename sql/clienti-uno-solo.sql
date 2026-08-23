-- ============================================================
-- TrovaImpresa — UN SOLO ELENCO CLIENTI
-- 23 agosto 2026
--
-- COSA HA DETTO LA FOTOGRAFIA (sql/clienti-fotografia.sql):
--   clienti nel noleggio ............ 2
--   clienti nel gestionale .......... 2
--   nomi uguali da fondere .......... 0   ← nessun doppione: si spostano
--   noleggi con cliente collegato ... 2
--   il reparto puo' essere vuoto .... SI'  ← non serve inventarne uno
--   colonne che mancano a gest_clienti ... note
--   vincolo da sciogliere ........... nol_noleggi_cliente_id_fk
--
-- COSA FA QUESTO FILE
--   1. aggiunge «note» a gest_clienti (l'unica colonna che gli manca);
--   2. scioglie il vincolo che lega nol_noleggi a nol_clienti;
--   3. sposta i clienti del noleggio dentro gest_clienti — e se un nome
--      c'e' gia' non lo copia: RIUSA quello che c'e';
--   4. rifa' puntare i noleggi al cliente giusto;
--   5. rimette il vincolo, questa volta su gest_clienti.
--
-- ⛔ NON CANCELLA NIENTE. La tabella nol_clienti resta dov'e', piena, con
--    una colonna nuova «migrato_in» che dice dove e' finita ogni riga. Se
--    qualcosa va storto si torna indietro guardando li'.
--
-- ⛔ SI PUO' RILANCIARE. Sposta solo le righe che non hanno gia' un
--    «migrato_in»: la seconda volta non duplica niente.
--
-- ⚠️ IL REPARTO. I clienti spostati vengono messi nel PRIMO reparto di
--    quell'account, cosi' si vedono anche dal gestionale imprese. Se non
--    ha reparti restano senza: il noleggio li vede lo stesso, perche' li
--    legge tutti. Spostarli in un altro reparto e' un attimo, dalla loro
--    scheda.
--
-- ⚠️ ORDINE DELLE COSE: prima questa query, POI il push della pagina
--    nuova. In mezzo, per qualche minuto, il gestionale noleggio vecchio
--    non vedrebbe i clienti spostati.
--
-- Si esegue nell'SQL Editor di Supabase. Risponde con UNA RIGA.
-- ============================================================

-- 1. la colonna che manca
alter table public.gest_clienti
  add column if not exists note text;

-- la mappa di dove e' finita ogni riga: e' la strada del ritorno
alter table public.nol_clienti
  add column if not exists migrato_in uuid;

-- 2. via il vincolo vecchio (se c'e')
alter table public.nol_noleggi
  drop constraint if exists nol_noleggi_cliente_id_fk;

-- 3. + 4. lo spostamento, uno per uno
do $blocco$
declare
  r        record;
  v_gid    uuid;
  v_rep    uuid;
begin
  for r in
    select * from public.nol_clienti
     where migrato_in is null
       and coalesce(nome,'') <> ''
       and eliminato_il is null
     order by nome
  loop
    -- c'e' gia' un cliente con lo stesso nome? allora si riusa quello.
    -- Il confronto e' senza maiuscole e senza spazi ai bordi.
    select g.id into v_gid
      from public.gest_clienti g
     where g.user_id = r.user_id
       and lower(btrim(coalesce(g.nome,''))) = lower(btrim(r.nome))
     limit 1;

    if v_gid is null then
      -- il primo reparto di quell'account, se ne ha uno
      select m.id into v_rep
        from public.gest_mestieri m
       where m.user_id = r.user_id
       order by coalesce(m.ordine, 999), m.nome
       limit 1;

      insert into public.gest_clienti (user_id, mestiere_id, nome, telefono, email, indirizzo, piva, note)
      values (r.user_id, v_rep, btrim(r.nome), r.telefono, r.email, r.indirizzo, r.piva, r.note)
      returning id into v_gid;
    end if;

    -- i noleggi di quel cliente adesso puntano alla riga nuova
    update public.nol_noleggi
       set cliente_id = v_gid
     where user_id = r.user_id
       and cliente_id = r.id;

    -- e sulla riga vecchia resta scritto dove e' andata
    update public.nol_clienti set migrato_in = v_gid where id = r.id;
  end loop;
end
$blocco$;

-- 5. il vincolo nuovo: adesso il cliente di un noleggio sta in gest_clienti.
--    «on delete set null»: se il cliente sparisce, il noleggio resta —
--    col nome ancora scritto sopra, che e' quello che serve allo storico.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'nol_noleggi_cliente_gest_fk') then
    alter table public.nol_noleggi
      add constraint nol_noleggi_cliente_gest_fk
      foreign key (cliente_id) references public.gest_clienti(id) on delete set null;
  end if;
end $$;


-- ------------------------------------------------------------
-- UNA RIGA DI RISPOSTA
-- «rimasti_indietro» deve essere 0, e «noleggi_scollegati» pure.
-- ------------------------------------------------------------
select
  (select count(*) from public.nol_clienti
    where eliminato_il is null and coalesce(nome,'') <> '' and migrato_in is not null) as clienti_spostati,
  (select count(*) from public.nol_clienti
    where eliminato_il is null and coalesce(nome,'') <> '' and migrato_in is null)     as rimasti_indietro,
  (select count(*) from public.gest_clienti)                                           as clienti_in_tutto,
  (select count(*) from public.nol_noleggi n
     where n.cliente_id is not null
       and not exists (select 1 from public.gest_clienti g where g.id = n.cliente_id))  as noleggi_scollegati;
