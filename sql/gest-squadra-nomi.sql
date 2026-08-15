-- =====================================================================
-- TrovaImpresa — LA RUBRICA DELLA SQUADRA (solo i nomi)
-- Da salvare come  sql/gest-squadra-nomi.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 15 agosto 2026 — Fase 2a: serve al rapportino dal telefono.
--
-- PERCHE' SERVE
-- Dall'11 agosto (sql/gest-operatori-scheda-privata.sql) un collaboratore vede
-- SOLO LA PROPRIA scheda in gest_operatori, e va benissimo cosi': dentro quella
-- scheda ci sono codice fiscale, documenti e soprattutto il COSTO ORARIO, cioe'
-- quanto l'impresa paga quella persona.
--
-- Ma il rapportino di cantiere lo scrive il capo squadra per TUTTI, e per farlo
-- gli servono i nomi dei colleghi. Oggi dal telefono quell'elenco non si legge.
--
-- QUESTA E' ESATTAMENTE LA PORTA GIA' DISEGNATA IN QUEL FILE:
--   "Se un giorno serve la RUBRICA DELLA SQUADRA (nome e telefono dei colleghi,
--    per chiamarsi in cantiere), si fa una vista con dentro solo quelle due
--    colonne — e resta una funzione decisa, non una porta lasciata aperta."
--
-- COSA C'E' DENTRO LA VISTA: id, nome, reparto. E BASTA.
-- Niente costo orario, niente telefono, niente email, niente codice fiscale,
-- niente date di documenti o visite mediche. Le colonne non ci sono proprio:
-- non e' una regola che si puo' aggirare, e' roba che non esce dalla porta.
--
-- CHI LA VEDE
-- Il titolare, sempre. E i collaboratori attivi che hanno la spunta
-- "rapportini" nella loro scheda in Squadra. Nessun altro.
--
-- ⚠️ La tabella gest_operatori NON viene toccata. La regola dell'11 agosto
-- resta identica: la scheda completa di un collega non la legge nessuno.
-- =====================================================================


-- ---------------------------------------------------------------------
-- La vista
-- ---------------------------------------------------------------------
-- Una vista normale (non security_invoker) legge la tabella con i diritti di
-- chi la possiede, quindi passa sopra la regola di gest_operatori. E' il motivo
-- per cui funziona — ed e' anche il motivo per cui il filtro QUI DENTRO deve
-- essere giusto: e' l'unica cosa che protegge quei nomi.
--
-- Chi e' stato tolto dalla squadra non compare: nel rapportino di oggi non si
-- devono poter scrivere le ore di una persona che non c'e' piu'.
-- Il controllo sulla colonna del Cestino si mette solo se quella colonna
-- esiste davvero: cosi' il file non puo' dare errore su un database diverso.

do $$
declare
  _ha_cestino boolean;
  _sql text;
begin
  select exists (
    select 1 from information_schema.columns
     where table_schema='public' and table_name='gest_operatori'
       and column_name='eliminato_il'
  ) into _ha_cestino;

  -- ⚠️ "select distinct" e non "select", e non e' un vezzo.
  -- In PostgreSQL una vista costruita su UNA sola tabella si puo' anche
  -- SCRIVERE: da qui dentro si sarebbe potuto infilare una persona finta in
  -- gest_operatori. Il revoke in fondo lo impedisce, ma un GRANT ALL dato
  -- domani per un'altra ragione lo rimetterebbe in piedi in silenzio.
  -- Con distinct la vista smette di essere scrivibile per costruzione: il
  -- database rifiuta e basta, qualunque permesso ci sia. I nomi non cambiano.
  -- Trovato provando: senza questa riga la scrittura passava.
  _sql := $v$
    create or replace view public.gest_squadra_nomi as
      select distinct o.id, o.user_id, o.mestiere_id, o.nome
        from public.gest_operatori o
       where (
               o.user_id = auth.uid()          -- il titolare vede la sua squadra
            or (
                 public.gest_puo_sezione(o.user_id, 'rapportini')
                 and exists (
                       select 1 from public.gest_membri m
                        where m.membro_id  = auth.uid()
                          and m.impresa_id = o.user_id
                          and m.stato      = 'attivo'
                     )
               )
             )
  $v$;

  if _ha_cestino then
    _sql := _sql || ' and o.eliminato_il is null';
  end if;

  execute _sql;
end $$;

comment on view public.gest_squadra_nomi is
  'Solo id, reparto e nome dei colleghi. Serve al rapportino di cantiere per scrivere le ore della squadra dal telefono. Nessun dato personale e nessun costo orario: quelli restano in gest_operatori, che un collaboratore legge solo per se stesso.';

grant select on public.gest_squadra_nomi to authenticated;

-- La vista NON deve poter essere scritta: le persone si aggiungono e si
-- correggono solo dal pannello del titolare.
revoke insert, update, delete on public.gest_squadra_nomi from authenticated;


-- =====================================================================
-- VERIFICA — una riga di risultato, che l'Editor mostra sempre.
-- =====================================================================
SELECT
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.views
                      WHERE table_schema='public' AND table_name='gest_squadra_nomi')
      THEN 'NIENTE FATTO — la vista non c''e''. Rilancia il file tutto intero.'
    WHEN EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='gest_squadra_nomi'
                    AND column_name IN ('costo_orario','telefono','email','codice_fiscale',
                                        'data_nascita','documento_scadenza','visita_medica_scadenza'))
      THEN 'PERICOLO — nella vista e'' finita una colonna che non ci deve stare. NON usarla: scrivimelo.'
    ELSE 'FATTO — la rubrica della squadra c''e'', e dentro ci sono solo i nomi.'
  END AS risultato,
  (SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
     FROM information_schema.columns
    WHERE table_schema='public' AND table_name='gest_squadra_nomi') AS cosa_ce_dentro,
  (SELECT COUNT(*) FROM public.gest_squadra_nomi) AS persone_che_vedi_tu;
