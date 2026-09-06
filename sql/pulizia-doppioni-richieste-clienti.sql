-- 6 settembre 2026 — TOLTI I DOPPIONI DA `richieste_clienti`.
--
-- COS'ERA. 20 righe, ma solo 14 persone: 4 clienti risultavano 2 o 3 volte
-- con nome, telefono, zona e testo identici, salvati a 2-3 secondi di
-- distanza. Erano persone che avevano premuto "Invia" piu' volte, tutte fra
-- il 27 luglio e il 2 agosto 2026.
--
-- PERCHE' NON RITORNA. Il 2 agosto (commit 4d70df8) erano gia' entrate due
-- protezioni: il tasto del modulo si spegne al clic (cerca-*.html) e
-- netlify/functions/richiesta-cliente.js rifiuta la stessa richiesta
-- (stesso telefono + stesso testo) arrivata negli ultimi 2 minuti.
-- Dal 2 agosto in poi, zero doppioni.
--
-- COSA E' STATO FATTO. Di ogni gruppo e' rimasta la riga PIU' VECCHIA
-- (l'originale); le copie successive sono state cancellate: id 6, 8, 9, 11,
-- 12, 14. Nessun cliente e' sparito: 20 righe -> 14, 14 persone diverse.
--
-- LA COPIA DI SICUREZZA E' RIMASTA nel database, tabella
-- `zz_doppioni_richieste_20260906` (6 righe). Si puo' buttare quando si e'
-- sicuri che non serve piu'.
--
-- GIA' APPLICATO su Supabase il 6 settembre 2026.

-- 1) copia di sicurezza delle righe doppie
create table if not exists public.zz_doppioni_richieste_20260906 as
with num as (
  select *, row_number() over (partition by telefono, ricerca, zona
                               order by coalesce(creato_il, created_at)) as _n
  from public.richieste_clienti
)
select * from num where _n > 1;

-- 2) via le copie, resta la prima di ogni gruppo
delete from public.richieste_clienti
where id in (select id from public.zz_doppioni_richieste_20260906);

-- 3) controllo: deve dare 14 righe e 0 doppioni
-- select count(*) as righe,
--        count(*) - count(distinct (telefono || '|' || coalesce(ricerca,'') || '|' || coalesce(zona,''))) as doppioni
-- from public.richieste_clienti;
