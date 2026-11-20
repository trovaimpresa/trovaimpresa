-- 20 nov 2026 (voce Stati di avanzamento dello studio, sì di Alex con la foto)
-- «Impresa che esegue i lavori»: il nome dell'impresa sul Certificato di
-- pagamento che firma il direttore dei lavori. Testo libero, facoltativo.
-- Un SAL nuovo lo riprende dal SAL di prima dello stesso computo.
alter table public.gest_sal
  add column if not exists impresa_esecutrice text;
