-- ============================================================
-- IL CAPITOLO DEI COSTI DELLA SICUREZZA — 6 settembre 2026
-- Gia' applicato al database (migrazione capitolo_costi_sicurezza_6set2026).
-- Questo file e' la COPIA SCRITTA: serve a sapere fra sei mesi cosa c'e'
-- e perche'.
--
-- IL PERCHE'. Nelle gare i COSTI della sicurezza (quelli del PSC: ponteggi,
-- recinzioni, baraccamenti, mensa) NON si ribassano, e non sono un pezzetto
-- da spalmare dentro ogni lavorazione: sono un computo a parte, con voci
-- proprie e proprie unita' di misura. Nel prezzario della Regione Lazio e'
-- la PARTE S, e nel database di Alessio c'e' gia': →972← voci con codice S,
-- fonte «Tariffa Regione Lazio» (recinzione al m², ponteggio cad, mensa al
-- mese, baraccamenti al m²).
--
-- ⚠️ NON CONFONDERE DUE PAROLE CHE SEMBRANO UGUALI:
--    · COSTI della sicurezza  → li stima il committente nel PSC, te li da'
--      lui, NON si ribassano mai. Sono questi.
--    · ONERI AZIENDALI della sicurezza → DPI, formazione, procedure tue.
--      Li dichiari tu nell'offerta (art. 108 c.9 del Codice Appalti) e non
--      sono una voce fissa non ribassabile.
--    La vecchia casella nel gestionale si chiamava «oneri» ma la nota sotto
--    diceva «non soggetti a ribasso»: erano due cose diverse nella stessa
--    riga.
--
-- ⚠️ LA COLONNA VECCHIA NON SI TOCCA. gest_computo_voci.oneri_sicurezza resta
--    dov'e' ed e' ancora sommata: i computi gia' scritti la usano, e toglierla
--    farebbe sparire una cifra senza dirlo a nessuno. Nel modulo la casella
--    si vede solo se e' gia' piena. Le due strade si SOMMANO.
-- ============================================================

alter table public.gest_computo_capitoli
  add column if not exists sicurezza boolean not null default false;

comment on column public.gest_computo_capitoli.sicurezza is
  'true = capitolo dei COSTI della sicurezza (PSC). Il suo importo entra nel computo ma resta fuori dal ribasso d''asta.';

-- ⚠️ QUESTA VISTA E' LA GEMELLA DI compRiepilogo() in js/gest-computo.js.
--    Il conto della sicurezza sta in DUE posti: qui (per l'elenco dei computi
--    e per il PDF) e li' (per la schermata aperta). Se se ne cambia uno solo,
--    l'elenco e la schermata dicono due totali diversi — ed e' successo gia'
--    una volta con le fatture. Si cambiano INSIEME.
create or replace view public.gest_computo_totali
with (security_invoker=true) as
 select c.id as computo_id,
    c.user_id,
    count(v.id) as voci,
    coalesce(sum(v.importo), 0::numeric)::numeric(16,2) as importo,
    coalesce(sum(v.importo * coalesce(v.incidenza_manodopera, 0::numeric) / 100::numeric), 0::numeric)::numeric(16,2) as importo_manodopera,
    coalesce(sum(
       coalesce(v.oneri_sicurezza, 0::numeric)
       + case when cap.sicurezza then coalesce(v.importo, 0::numeric) else 0::numeric end
    ), 0::numeric)::numeric(16,2) as oneri_sicurezza
   from gest_computi c
     left join gest_computo_voci_calc v on v.computo_id = c.id
     left join gest_computo_capitoli cap on cap.id = v.capitolo_id
  where c.eliminato_il is null
  group by c.id, c.user_id;

-- come si controlla che non abbia cambiato niente ai computi gia' scritti:
--   select count(*) from gest_computo_capitoli where sicurezza;  -- deve dare 0
--   select sum(oneri_sicurezza) from gest_computo_totali;        -- come prima
