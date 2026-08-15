-- =====================================================================
-- TrovaImpresa — DA DOVE ARRIVA IL MESSAGGIO
-- Da salvare come  sql/supporto-origine.sql
-- Incolla tutto in Supabase > SQL Editor > Run. Sicuro da rilanciare.
--
-- 15 agosto 2026 (13)
--
-- PERCHE'
-- Nel pannello admin le conversazioni erano tutte uguali. Ma uno che scrive
-- dal SITO ha un problema col suo profilo pubblico; uno che scrive dal
-- GESTIONALE ce l'ha davanti aperto e non gli si salva una fattura. Sono due
-- telefonate diverse e vanno riconosciute a colpo d'occhio.
--
-- ⚠️ I MESSAGGI CHE CI SONO GIA' DIVENTANO «sito», E NON E' UN RIPIEGO:
-- e' vero. Fino a oggi la chat esisteva solo nei quattro pannelli pubblici.
--
-- ⚠️ CHI SCRIVE NON PUO' CAMBIARLA DOPO.
-- Dal 15 agosto un'impresa puo' scrivere soltanto dentro la colonna «letto»
-- (sql/supporto-messaggi-lucchetto.sql): «origine» si scrive una volta sola,
-- quando il messaggio nasce, e nessuno la puo' piu' toccare.
--
-- ⚠️ IL GESTIONALE FUNZIONA ANCHE PRIMA DI LANCIARE QUESTO FILE: se la
-- colonna non c'e', la chat riprova a mandare il messaggio senza, e il
-- messaggio parte lo stesso. Nessuno resta senza poter scrivere.
-- =====================================================================

alter table public.supporto_messaggi
  add column if not exists origine text not null default 'sito';

-- solo due valori possibili: un domani «origine» sbagliata vuol dire una
-- conversazione che non compare in nessuna delle due liste, cioe' un
-- messaggio che nessuno legge.
do $$
begin
  if not exists (select 1 from pg_constraint
                  where conname = 'supporto_messaggi_origine_ok'
                    and conrelid = 'public.supporto_messaggi'::regclass) then
    alter table public.supporto_messaggi
      add constraint supporto_messaggi_origine_ok
      check (origine in ('sito','gestionale'));
  end if;
end $$;

create index if not exists supporto_messaggi_origine_idx
  on public.supporto_messaggi (origine, created_at desc);


-- =====================================================================
-- VERIFICA — una riga di risultato, che l'Editor mostra sempre.
-- =====================================================================
SELECT
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema='public' AND table_name='supporto_messaggi'
                        AND column_name='origine')
      THEN 'NIENTE FATTO — la colonna non e'' stata creata. Rilancia il file tutto intero.'
    WHEN NOT EXISTS (SELECT 1 FROM pg_constraint
                      WHERE conname='supporto_messaggi_origine_ok')
      THEN 'A META'' — manca il controllo sui valori: potrebbe entrarci un''origine sbagliata e quel messaggio non lo vedresti in nessuna delle due liste.'
    WHEN EXISTS (SELECT 1 FROM information_schema.column_privileges
                  WHERE table_schema='public' AND table_name='supporto_messaggi'
                    AND grantee IN ('anon','authenticated')
                    AND privilege_type='UPDATE' AND column_name='origine')
      THEN 'A META'' — chi scrive potrebbe cambiare l''origine dopo. Rilancia prima sql/supporto-messaggi-lucchetto.sql.'
    ELSE 'FATTO — da adesso ogni messaggio dice da dove arriva. Quelli di prima sono segnati «sito», che e'' vero: la chat esisteva solo nei pannelli pubblici.'
  END AS risultato,
  (SELECT COUNT(*) FROM public.supporto_messaggi WHERE origine='sito')       AS messaggi_dal_sito,
  (SELECT COUNT(*) FROM public.supporto_messaggi WHERE origine='gestionale') AS messaggi_dal_gestionale,
  (SELECT COUNT(DISTINCT user_id) FROM public.supporto_messaggi)             AS quante_conversazioni;
