-- ============================================================
-- TrovaImpresa — IL NOLEGGIO IMPARA A FARE IL CONTO
-- 22 agosto 2026
--
-- COSA MANCA OGGI
-- Sul mezzo ci sono tre tariffe (giorno, settimana, mese) e nessuno le usa:
-- l'importo del noleggio si scrive a mano. E il noleggio vero non si paga
-- solo a tempo — si paga anche a ore di macchina, a chilometri, a materiale
-- consumato e a usura. Di tutto questo nel database non c'e' niente.
--
-- COSA AGGIUNGE QUESTO FILE
--   sul MEZZO      quanto costa: all'ora, e cosa e' incluso e cosa no
--   sul NOLEGGIO   quanto ha lavorato davvero: contaore, chilometri,
--                  materiale consumato, e il conto salvato riga per riga
--
-- ⛔ NON TOGLIE E NON CAMBIA NIENTE DI QUELLO CHE C'E' GIA'.
--    Tutte le colonne sono "add column if not exists" con un valore di
--    partenza a zero: i noleggi gia' scritti restano identici, e un mezzo
--    che non ha la tariffa oraria semplicemente non si noleggia a ore.
--
-- ⚠️ DUE COLONNE CHE VALGONO PIU' DELLE ALTRE: mezzo_id e cliente_id.
--    Oggi il noleggio salva il mezzo col NOME SCRITTO. Se rinomini un mezzo,
--    i noleggi vecchi perdono il collegamento e il conto non si puo' piu'
--    rifare. Qui si aggiunge il collegamento vero, e si riempie da solo
--    guardando i nomi — ma SOLO quando il nome porta a un mezzo solo. Se in
--    magazzino ci sono due mezzi che si chiamano uguale, quella riga si
--    lascia com'e': meglio vuota che collegata al mezzo sbagliato.
--    Il nome scritto NON si toglie: resta li' per i noleggi vecchi.
--
-- Si esegue nell'SQL Editor di Supabase. Si puo' rilanciare quante volte si
-- vuole. In fondo risponde con una riga che dice com'e' andata.
-- ============================================================


-- ------------------------------------------------------------
-- 1. IL MEZZO — quanto costa
-- ------------------------------------------------------------
alter table public.nol_mezzi
  -- il tempo: la tariffa oraria mancava, le altre tre c'erano gia'
  add column if not exists tariffa_ora         numeric not null default 0,

  -- il contaore: quante ore di macchina sono comprese in una giornata di
  -- noleggio, e quanto costa ogni ora oltre a quelle
  add column if not exists ore_incluse_giorno  numeric not null default 0,
  add column if not exists tariffa_ora_extra   numeric not null default 0,

  -- i chilometri: stessa idea, per i mezzi che si spostano da soli
  add column if not exists km_inclusi_giorno   numeric not null default 0,
  add column if not exists tariffa_km          numeric not null default 0,

  -- l'usura: una cifra fissa per ogni noleggio, oppure una percentuale
  -- calcolata sul tempo. Si possono usare tutte e due, o nessuna.
  add column if not exists usura_fissa         numeric not null default 0,
  add column if not exists usura_percento      numeric not null default 0,

  -- il mezzo si legge al contaore o al contachilometri? Serve solo a non
  -- far comparire caselle che per quel mezzo non vogliono dire niente.
  add column if not exists ha_contaore         boolean not null default false,
  add column if not exists ha_contakm          boolean not null default false;


-- ------------------------------------------------------------
-- 2. IL NOLEGGIO — quanto ha lavorato davvero
-- ------------------------------------------------------------
alter table public.nol_noleggi
  -- il collegamento vero al mezzo e al cliente (vedi la nota in cima)
  add column if not exists mezzo_id            uuid,
  add column if not exists cliente_id          uuid,

  -- le ore del giorno: servono quando il mezzo esce e rientra lo stesso
  -- giorno, che e' l'unico caso in cui si paga a ore
  add column if not exists ora_uscita          time,
  add column if not exists ora_rientro         time,

  -- le due letture, all'uscita e al rientro
  add column if not exists contaore_uscita     numeric,
  add column if not exists contaore_rientro    numeric,
  add column if not exists km_uscita           numeric,
  add column if not exists km_rientro          numeric,

  -- il materiale consumato: righe libere
  -- [{"descrizione":"Gasolio","quantita":80,"prezzo":1.75}]
  add column if not exists consumi             jsonb not null default '[]'::jsonb,

  -- ⚠️ IL CONTO SALVATO RIGA PER RIGA.
  -- Non e' un lusso: le tariffe del mezzo cambiano nel tempo, e fra sei mesi
  -- un cliente che contesta la fattura va risposto con il conto DI ALLORA,
  -- non con quello che verrebbe fuori oggi.
  add column if not exists dettaglio_prezzo    jsonb,

  -- quello che dice il motore, tenuto separato da "importo", che resta
  -- quello che l'impresa fa pagare davvero e che puo' sempre correggere
  add column if not exists importo_calcolato   numeric;


-- ------------------------------------------------------------
-- 3. IL COLLEGAMENTO SI RIEMPIE DA SOLO, dove non c'e' dubbio
--    Solo dove il nome porta a UN mezzo solo (o a UN cliente solo).
--    I doppioni si lasciano vuoti apposta.
-- ------------------------------------------------------------
update public.nol_noleggi n
   set mezzo_id = (select m.id from public.nol_mezzi m
                    where m.user_id = n.user_id and m.nome = n.mezzo
                    limit 1)
 where n.mezzo_id is null
   and n.mezzo is not null
   and (select count(*) from public.nol_mezzi m
         where m.user_id = n.user_id and m.nome = n.mezzo) = 1;

update public.nol_noleggi n
   set cliente_id = (select c.id from public.nol_clienti c
                      where c.user_id = n.user_id and c.nome = n.cliente
                      limit 1)
 where n.cliente_id is null
   and n.cliente is not null
   and (select count(*) from public.nol_clienti c
         where c.user_id = n.user_id and c.nome = n.cliente) = 1;


-- ------------------------------------------------------------
-- 4. I COLLEGAMENTI VERI (chiavi esterne)
--    "set null": se un mezzo viene cancellato, il noleggio vecchio resta —
--    con il nome scritto sopra — e non si porta via lo storico.
--    Si aggiungono solo se non ci sono gia', cosi' il file si rilancia.
-- ------------------------------------------------------------
do $blocco$
begin
  if not exists (select 1 from pg_constraint where conname = 'nol_noleggi_mezzo_id_fk') then
    alter table public.nol_noleggi
      add constraint nol_noleggi_mezzo_id_fk
      foreign key (mezzo_id) references public.nol_mezzi(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'nol_noleggi_cliente_id_fk') then
    alter table public.nol_noleggi
      add constraint nol_noleggi_cliente_id_fk
      foreign key (cliente_id) references public.nol_clienti(id) on delete set null;
  end if;
end
$blocco$;

create index if not exists nol_noleggi_mezzo_idx   on public.nol_noleggi (mezzo_id);
create index if not exists nol_noleggi_cliente_idx on public.nol_noleggi (cliente_id);


-- ------------------------------------------------------------
-- 5. LA RIGA DI RISULTATO
--    Conta le colonne che ci sono davvero, non quelle scritte qui sopra.
-- ------------------------------------------------------------
select 'mezzi: ' || (select count(*) from information_schema.columns
                      where table_schema = 'public' and table_name = 'nol_mezzi'
                        and column_name in ('tariffa_ora','ore_incluse_giorno','tariffa_ora_extra',
                                            'km_inclusi_giorno','tariffa_km','usura_fissa',
                                            'usura_percento','ha_contaore','ha_contakm'))
    || ' colonne nuove su 9'
    || '  ·  noleggi: ' || (select count(*) from information_schema.columns
                             where table_schema = 'public' and table_name = 'nol_noleggi'
                               and column_name in ('mezzo_id','cliente_id','ora_uscita','ora_rientro',
                                                   'contaore_uscita','contaore_rientro','km_uscita',
                                                   'km_rientro','consumi','dettaglio_prezzo',
                                                   'importo_calcolato'))
    || ' su 11'
    || '  ·  noleggi collegati al mezzo: ' || (select count(*) from public.nol_noleggi where mezzo_id is not null)
    || ' su ' || (select count(*) from public.nol_noleggi)
    || '  ·  rimasti scollegati (nome doppio o mezzo cancellato): '
    || (select count(*) from public.nol_noleggi where mezzo_id is null)
       as risultato;
