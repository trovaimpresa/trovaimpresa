-- ============================================================
-- IL QUADRO ECONOMICO DEI LAVORI PUBBLICI — 19 agosto 2026
-- ============================================================
-- Il computo dice quanto costano i LAVORI. Il quadro economico dice
-- quanto costa l'OPERA: lavori + somme a disposizione della stazione
-- appaltante (spese tecniche, imprevisti, allacciamenti, IVA,
-- incentivi). È il numero che finisce nella delibera.
--
-- Sta in una colonna sola, in JSON, e non in una tabella nuova:
-- è un elenco corto che si legge e si scrive SEMPRE tutto insieme
-- col suo computo, non si cerca, non si somma da fuori e non ha
-- figli. Una tabella a parte avrebbe voluto dire una chiave, un
-- indice e quattro regole di sicurezza in più per non guadagnare
-- niente.
--
-- La forma di ogni riga:
--   { "d": "Spese tecniche", "e": 12000, "p": null }
--   { "d": "IVA sui lavori",  "e": null,  "p": 10   }
-- «e» = euro scritti a mano · «p» = percentuale del Totale A.
-- Se c'è «p», «e» non conta: lo dice anche la schermata.
--
-- NIENTE RLS DA RIFARE: le regole di gest_computi valgono sulla
-- riga, non sulla singola colonna. Restano quelle.
--
-- Si può eseguire più volte: se la colonna c'è già, non succede niente.
-- ============================================================

alter table public.gest_computi
  add column if not exists quadro_economico jsonb;

-- una riga di risultato che dice com'è andata
select case
  when exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name   = 'gest_computi'
       and column_name  = 'quadro_economico'
  )
  then 'FATTO — la colonna «quadro_economico» c''è: il quadro economico si salva.'
  else 'NON FATTO — la colonna «quadro_economico» non risulta creata. Riprova o dimmelo.'
end as esito;
