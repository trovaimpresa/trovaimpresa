-- ============================================================
-- Blog: riordino degli articoli per MESTIERE (agosto 2026)
-- Eseguire UNA volta nel SQL editor di Supabase. Sicuro da rilanciare.
--
-- Valori ammessi (devono coincidere con GRUPPI in blog.html):
--   ristrutturazione | bagno | elettrico | clima | tetto | infissi
--   pavimenti | pitture | cartongesso | bonus | strumenti | imprese
-- Se il campo resta vuoto, blog.html mette comunque l'articolo nel gruppo
-- giusto usando la mappa degli slug; gli slug nuovi finiscono in "Altre guide".
-- ============================================================

-- 1. La colonna
ALTER TABLE public.blog_articoli
  ADD COLUMN IF NOT EXISTS mestiere text;

-- 2. Assegnazione degli articoli esistenti
UPDATE public.blog_articoli SET mestiere = 'ristrutturazione'
  WHERE slug IN ('costi-ristrutturazione','quanto-costa-ristrutturare-casa','quanto-costa-un-muratore-al-giorno');

UPDATE public.blog_articoli SET mestiere = 'bagno'
  WHERE slug IN ('quanto-costa-rifare-il-bagno','quanto-costa-rifare-impianto-idraulico','quanto-costa-trasformare-vasca-in-doccia');

UPDATE public.blog_articoli SET mestiere = 'elettrico'
  WHERE slug IN ('quanto-costa-rifare-impianto-elettrico');

UPDATE public.blog_articoli SET mestiere = 'clima'
  WHERE slug IN ('quanto-costa-sostituire-la-caldaia','quanto-costa-installare-un-condizionatore','quanto-costa-impianto-fotovoltaico');

UPDATE public.blog_articoli SET mestiere = 'tetto'
  WHERE slug IN ('quanto-costa-rifare-il-tetto','quanto-costa-rifare-la-facciata','quanto-costa-cappotto-termico');

UPDATE public.blog_articoli SET mestiere = 'infissi'
  WHERE slug IN ('quanto-costa-cambiare-gli-infissi');

UPDATE public.blog_articoli SET mestiere = 'pavimenti'
  WHERE slug IN ('quanto-costa-posare-il-pavimento');

UPDATE public.blog_articoli SET mestiere = 'pitture'
  WHERE slug IN ('quanto-costa-imbiancare-casa');

UPDATE public.blog_articoli SET mestiere = 'cartongesso'
  WHERE slug IN ('quanto-costa-parete-cartongesso');

UPDATE public.blog_articoli SET mestiere = 'bonus'
  WHERE slug IN ('bonus-ristrutturazione-2026','permessi-ristrutturazione-cila-scia');

UPDATE public.blog_articoli SET mestiere = 'strumenti'
  WHERE slug IN ('calcolatori','controlla-preventivo-bagno');

UPDATE public.blog_articoli SET mestiere = 'imprese'
  WHERE slug IN ('trova-cantieri');

-- 3. Controllo finale: quali articoli sono rimasti senza mestiere?
--    (se ne escono, aggiungerli a uno degli UPDATE qui sopra)
SELECT slug, titolo, mestiere
FROM public.blog_articoli
ORDER BY mestiere NULLS FIRST, titolo;
