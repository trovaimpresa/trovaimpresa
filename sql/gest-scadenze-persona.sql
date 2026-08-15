-- =====================================================================
-- TrovaImpresa — UNA SCADENZA LEGATA A UNA PERSONA
-- Da salvare come  sql/gest-scadenze-persona.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 15 agosto 2026
--
-- IL BUCO
-- Nello Scadenzario una scadenza si puo' gia' attaccare a un LAVORO, a un
-- CLIENTE e a un MEZZO. A una PERSONA no.
-- Le uniche date legate a una persona sono le quattro fisse nella sua scheda:
-- visita medica, formazione, documento, permesso di soggiorno. Tutto il resto
-- finisce in "Attestati e patentini", che e' un campo di testo libero: ci
-- scrivi "patentino muletto" e quella cosa non scade mai e non avvisa nessuno.
--
-- Il patentino del muletto scade. La piattaforma aerea scade. Il primo
-- soccorso scade. E se scade e l'uomo sale lo stesso, in cantiere non e' un
-- fastidio: e' il verbale.
--
-- COSA AGGIUNGE
-- Una colonna sola: gest_scadenze.operatore_id.
-- Da li' in poi funziona tutto quello che c'e' gia': l'elenco, i colori,
-- il "si ripete", e soprattutto l'email a 30, 7 e 1 giorno che gira ogni
-- mattina alle 6:15 (netlify/functions/promemoria-scadenze.js). Non c'e' da
-- costruire niente di nuovo: c'era solo da poter dire A CHI.
--
-- ⚠️ set null e non cascade, come gia' fatto per gest_ore.operatore_id.
-- Se una persona viene tolta dalla squadra la sua scadenza NON sparisce da
-- sola: resta, e il gestionale la mostra dicendo che quella persona non c'e'
-- piu'. Una riga che sparisce in silenzio e' peggio di una riga da buttare a
-- mano: la prima non la vedi, la seconda la chiudi tu quando hai deciso.
--
-- IL GESTIONALE FUNZIONA ANCHE PRIMA DI LANCIARE QUESTO FILE: se la colonna
-- non c'e', la tendina "Persona" semplicemente non compare e tutto il resto
-- dello Scadenzario resta com'era.
-- =====================================================================


alter table public.gest_scadenze
  add column if not exists operatore_id uuid
  references public.gest_operatori(id) on delete set null;

/* ⚠️ "add column if not exists" non aggiunge il collegamento se la colonna
   esiste GIA' senza. Succede se un giorno la colonna e' stata creata a mano,
   o se un lancio si e' fermato a meta'. In quel caso il file, senza questo
   pezzo, si limitava a dire "a meta'" invece di sistemare — e chi legge deve
   arrangiarsi. Trovato provandolo.
   Qui il collegamento si aggiunge se manca, e non si tocca se c'e' gia'. */
do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema='public' and table_name='gest_scadenze'
                and column_name='operatore_id')
     and not exists (
       select 1
         from pg_constraint c
         join pg_class t     on t.oid = c.conrelid
         join pg_attribute a on a.attrelid = t.oid and a.attnum = any (c.conkey)
        where t.relname = 'gest_scadenze'
          and a.attname = 'operatore_id'
          and c.contype = 'f')
  then
    alter table public.gest_scadenze
      add constraint gest_scadenze_operatore_id_fkey
      foreign key (operatore_id) references public.gest_operatori(id) on delete set null;
  end if;
end $$;

create index if not exists gest_scadenze_operatore_idx
  on public.gest_scadenze(operatore_id);


-- =====================================================================
-- VERIFICA — una riga di risultato, che l'Editor mostra sempre.
-- (I raise notice su Supabase non si vedono.)
-- =====================================================================
SELECT
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema='public' AND table_name='gest_scadenze'
                        AND column_name='operatore_id')
      THEN 'NIENTE FATTO — la colonna non c''e''. Rilancia il file tutto intero.'
    WHEN NOT EXISTS (
           SELECT 1
             FROM pg_constraint c
             JOIN pg_class t   ON t.oid = c.conrelid
             JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY (c.conkey)
            WHERE t.relname = 'gest_scadenze'
              AND a.attname = 'operatore_id'
              AND c.contype = 'f')
      THEN 'A META'' — la colonna c''e'' ma non e'' collegata alla squadra: le scadenze non saprebbero di chi sono.'
    WHEN EXISTS (
           SELECT 1
             FROM pg_constraint c
             JOIN pg_class t   ON t.oid = c.conrelid
             JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY (c.conkey)
            WHERE t.relname = 'gest_scadenze'
              AND a.attname = 'operatore_id'
              AND c.contype = 'f'
              AND c.confdeltype <> 'n')      -- 'n' = set null
      THEN 'ATTENZIONE — il collegamento non e'' "set null": togliendo una persona dalla squadra le sue scadenze sparirebbero da sole. Scrivimelo.'
    ELSE 'FATTO — adesso una scadenza puo'' essere di una persona. Il patentino del muletto scade, e l''email parte come per tutte le altre.'
  END AS risultato,
  (SELECT COUNT(*) FROM public.gest_scadenze) AS scadenze_che_hai,
  (SELECT COUNT(*) FROM public.gest_scadenze WHERE operatore_id IS NOT NULL) AS gia_legate_a_una_persona;
