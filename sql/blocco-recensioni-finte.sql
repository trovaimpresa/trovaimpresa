-- ============================================================
-- TrovaImpresa — LE RECENSIONI NON SI SCRIVONO PIU' DAL BROWSER
-- 21 agosto 2026
--
-- IL PROBLEMA
-- In sql/rls-batch5-feedback.sql la regola "public_insert" lascia scrivere
-- dentro "feedback_clienti" a CHIUNQUE, anche senza account:
--     for insert to anon, authenticated with check (true)
-- Su un sito di recensioni e' la prima cosa che un concorrente usa: si
-- scrivono cento stelline a se stesso, o cento recensioni brutte a un altro.
--
-- PERCHE' SI PUO' CHIUDERE SENZA ROMPERE NIENTE
-- Controllato: nel sito nessuna pagina scrive le recensioni dal browser.
-- Il modulo del cliente passa da netlify/functions/recensione-invia.js, che
-- gira sul server e scrive con la chiave "service_role" — quella non passa
-- dalle regole RLS, quindi continua a funzionare tale e quale. La conferma
-- via email (recensione-conferma.js) fa lo stesso.
-- La LETTURA resta aperta a tutti: le recensioni si devono vedere.
--
-- ⚠️ SE UN DOMANI SI VUOLE UN MODULO CHE SCRIVE DIRETTAMENTE DAL BROWSER,
--    non si rimette questa regola: si passa dalla function, che gia' fa i
--    controlli veri (una sola recensione per cliente, tetto giornaliero).
--
-- Si esegue nell'SQL Editor di Supabase. Si puo' rilanciare quante volte
-- si vuole. In fondo risponde con una riga che dice com'e' andata.
-- ============================================================


drop policy if exists "public_insert" on public.feedback_clienti;

-- Il permesso di tabella, oltre alla regola: senza questo PostgREST
-- risponderebbe comunque "permesso negato", ma tolto e' piu' pulito.
revoke insert on public.feedback_clienti from anon;
revoke insert on public.feedback_clienti from authenticated;


-- ------------------------------------------------------------
-- LA RIGA DI RISULTATO
-- ------------------------------------------------------------
select case
         when exists (select 1 from pg_policies
                       where schemaname='public' and tablename='feedback_clienti'
                         and cmd in ('INSERT','ALL'))
           or has_table_privilege('anon','public.feedback_clienti','insert')
         then 'ATTENZIONE: dal browser si possono ancora scrivere recensioni'
         else 'chiuso: le recensioni le scrive solo il server'
       end
    || '  ·  la lettura e ancora aperta a tutti: '
    || case when has_table_privilege('anon','public.feedback_clienti','select')
              and exists (select 1 from pg_policies
                           where schemaname='public' and tablename='feedback_clienti'
                             and cmd in ('SELECT','ALL'))
            then 'si' else 'NO — QUALCOSA E ANDATO STORTO' end
       as risultato;
