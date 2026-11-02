-- 2 novembre 2026 — gia' applicata su Supabase (migrazione fondatore_anche_info_2nov2026).
-- L'account di Alessio passa da pintoalessio@icloud.com a info@trovaimpresa.com.
-- Le tre funzioni che riconoscono il fondatore (sono_il_fondatore,
-- gest_blocco_piano, imprese_blocca_piano) accettano tutte e due le email.
-- Lo stesso elenco sta nel codice: js/gate-gestionale.js, js/fondatore.js,
-- i 3 pannelli (FONDATORE_EMAIL) e admin-controllo-abbonamenti.js.
do $$
declare
  f text; d text;
begin
  foreach f in array array['sono_il_fondatore','gest_blocco_piano','imprese_blocca_piano'] loop
    select pg_get_functiondef(p.oid) into d
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = f;
    d := replace(d, $q$coalesce(v_mail, '') <> 'pintoalessio@icloud.com'$q$,
                    $q$coalesce(v_mail, '') not in ('pintoalessio@icloud.com', 'info@trovaimpresa.com')$q$);
    d := replace(d, $q$v_mail = 'pintoalessio@icloud.com'$q$,
                    $q$v_mail in ('pintoalessio@icloud.com', 'info@trovaimpresa.com')$q$);
    d := replace(d, $q$= 'pintoalessio@icloud.com'$q$,
                    $q$in ('pintoalessio@icloud.com', 'info@trovaimpresa.com')$q$);
    execute d;
  end loop;
end $$;
