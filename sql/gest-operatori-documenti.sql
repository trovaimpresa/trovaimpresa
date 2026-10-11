-- 11 ottobre 2026 — Attestati, patentini e documenti: una lista senza limite per ogni persona della squadra.
-- Array di oggetti {tipo, numero, scadenza}. Il vecchio testo `attestati` resta, per compatibilita.
-- Additivo: nessuna riga esistente cambia. Gia' eseguito su Supabase l'11/10/2026.
alter table public.gest_operatori add column if not exists documenti jsonb;
comment on column public.gest_operatori.documenti is 'Elenco libero di attestati, patentini e documenti della persona: array di {tipo, numero, scadenza}. Sostituisce il vecchio campo di testo attestati (che resta, per compatibilita).';
