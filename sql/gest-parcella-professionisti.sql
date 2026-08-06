-- ============================================================
-- Gestionale Studio: la PARCELLA (6 agosto 2026)
--
-- Il preventivo di un'impresa e' un elenco di voci: totale e via.
-- La parcella di un professionista ha tre righe in piu' che cambiano il totale:
--   1. cassa previdenziale, calcolata sul compenso  (Inarcassa 4%, Geometri 5%)
--   2. IVA, calcolata su compenso + cassa
--   3. ritenuta d'acconto 20%, SOLO sul compenso, sottratta alla fine
--
-- Esempio su 1.000 € di compenso (architetto, cassa 4%, IVA 22%, con ritenuta):
--   compenso            1.000,00
--   + cassa 4%             40,00
--   = imponibile IVA    1.040,00
--   + IVA 22%             228,80
--   - ritenuta 20%        200,00   (sul compenso, non sulla cassa)
--   = da incassare      1.068,80
--
-- Eseguire UNA volta nel SQL editor di Supabase. Sicuro da rilanciare.
-- Chi non e' professionista non vede questi campi: i suoi preventivi non cambiano.
-- ============================================================

ALTER TABLE public.gest_preventivi
  ADD COLUMN IF NOT EXISTS cassa_perc      numeric(5,2),          -- 4 = Inarcassa, 5 = Geometri/Periti
  ADD COLUMN IF NOT EXISTS iva_perc        numeric(5,2),          -- di norma 22
  ADD COLUMN IF NOT EXISTS ritenuta        boolean DEFAULT false, -- true se il cliente e' sostituto d'imposta
  ADD COLUMN IF NOT EXISTS ritenuta_perc   numeric(5,2) DEFAULT 20,
  ADD COLUMN IF NOT EXISTS spese_forfait   numeric(12,2);         -- spese documentate/forfettarie, fuori dal compenso

COMMENT ON COLUMN public.gest_preventivi.cassa_perc    IS 'Contributo integrativo della cassa, calcolato sul compenso. 4% Inarcassa, 5% Cassa Geometri.';
COMMENT ON COLUMN public.gest_preventivi.ritenuta      IS 'Ritenuta d''acconto: si applica solo se il cliente e'' sostituto d''imposta (azienda, professionista, condominio). Con un privato NO.';
COMMENT ON COLUMN public.gest_preventivi.spese_forfait IS 'Spese (bolli, diritti di segreteria, copie): entrano nell''imponibile IVA ma NON nella base della ritenuta.';

-- Controllo finale
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name='gest_preventivi'
  AND column_name IN ('cassa_perc','iva_perc','ritenuta','ritenuta_perc','spese_forfait')
ORDER BY column_name;
