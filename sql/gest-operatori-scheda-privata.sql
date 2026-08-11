-- =====================================================================
-- TrovaImpresa — LA SCHEDA DEL DIPENDENTE NON LA LEGGONO PIU' I COLLEGHI
-- Da salvare come  sql/gest-operatori-scheda-privata.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 11 agosto 2026 — l'ultima tabella rimasta aperta.
--
-- IL PROBLEMA
-- Con sql/gest-permessi-collaboratori.sql le spunte adesso contano davvero, e
-- clienti, fatture, note e scadenze sono chiuse. Restava gest_operatori:
--
--     create policy "operatori_read" ... using (gest_puo_accedere(user_id))
--
-- cioe' "sei un collaboratore attivo -> leggi TUTTE le schede". E dentro la
-- scheda di una persona c'e':
--     telefono, email, codice fiscale, data di nascita,
--     numero e scadenza del documento, visita medica, formazione,
--     contatto di emergenza, tipo di contratto, data di assunzione
--     e il COSTO ORARIO.
--
-- Il costo orario e' quanto l'impresa paga quella persona. Con questa regola
-- lo sapevano tutti di tutti. Non e' una svista tecnica: e' la cosa che fa
-- litigare una squadra il lunedi' mattina.
--
-- COSA CAMBIA
-- Un collaboratore vede SOLO LA PROPRIA scheda. Dei colleghi, niente.
--
-- PERCHE' SI PUO' STRINGERE COSI' TANTO
-- Controllato nel codice prima di scriverlo: gestionale-operatore.html legge
-- gest_operatori in un punto solo, e chiede soltanto il PROPRIO nome
--     select nome ... eq("id", MIO.operatoreId)
-- Dei colleghi non gli serve niente. Tutte le altre letture di gest_operatori
-- stanno in gestionale-app.html, cioe' nel pannello del TITOLARE, e sono gia'
-- filtrate sul suo user_id: quelle non cambiano di una virgola.
--
-- ⚠️ UNA COSA DA SAPERE
-- Le colonne non si possono nascondere una per una: o si legge la riga o non
-- si legge. Quindi non esiste un "vede il nome ma non il costo orario" senza
-- costruire una vista apposta e cambiare le pagine. Per adesso la scelta e'
-- la piu' sicura: la propria riga e basta. Se un giorno serve la RUBRICA DELLA
-- SQUADRA (nome e telefono dei colleghi, per chiamarsi in cantiere), si fa una
-- vista con dentro solo quelle due colonne — e resta una funzione decisa, non
-- una porta lasciata aperta.
--
-- SI TORNA INDIETRO
-- Il blocco per rimettere tutto com'era e' in fondo al file.
-- =====================================================================

drop policy if exists "operatori_read" on public.gest_operatori;

create policy "operatori_read" on public.gest_operatori
  for select using (
        user_id = auth.uid()                    -- il titolare vede tutto
     or exists (                                -- il collaboratore: solo se stesso
          select 1 from gest_membri m
           where m.membro_id    = auth.uid()
             and m.impresa_id   = gest_operatori.user_id
             and m.stato        = 'attivo'
             and m.operatore_id = gest_operatori.id)
  );

comment on policy "operatori_read" on public.gest_operatori is
  'Il titolare vede tutte le schede. Un collaboratore attivo vede solo la propria: dentro ci sono codice fiscale, documenti e costo orario.';


-- ---------------------------------------------------------------------
-- VERIFICA (facoltativa) — deve dire "NUOVA".
-- ---------------------------------------------------------------------
-- select policyname,
--        case when qual like '%operatore_id%' then 'NUOVA (solo la propria scheda)'
--             else 'ancora vecchia' end as stato
--   from pg_policies
--  where schemaname='public' and tablename='gest_operatori' and policyname='operatori_read';


-- =====================================================================
-- COME SI TORNA INDIETRO
-- Togli i due trattini davanti alle due righe qui sotto e fai Run.
-- =====================================================================
-- drop policy if exists "operatori_read" on public.gest_operatori;
-- create policy "operatori_read" on public.gest_operatori for select using (gest_puo_accedere(user_id));
