-- forum-regola-google.sql — 18 ottobre 2026
-- Incolla tutto nel SQL Editor di Supabase e premi Run. Non cancella niente.
--
-- La regola nuova del Forum, decisa da Alex: una richiesta va su Google
-- quando ha almeno UNA RISPOSTA VERA — non dell'autore e lunga almeno 200
-- caratteri — chiunque l'abbia scritta (impresa iscritta o ospite).
-- Prima contava solo l'impresa iscritta: le 9 risposte utili scritte da
-- ospite restavano nascoste e passava solo «meglio fare il sopralluogo».
-- La stessa regola sta in js/forum.js (funzione seo()).

create or replace function public.bacheca_risposta_dopo_insert()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not new.autore and length(trim(coalesce(new.testo, ''))) >= 200 then
    update public.bacheca_richieste set n_risposte = n_risposte + 1, indicizzabile = true where id = new.richiesta_id;
  else
    update public.bacheca_richieste set n_risposte = n_risposte + 1 where id = new.richiesta_id;
  end if;
  return new;
end $function$;

-- allinea le richieste che ci sono gia' (non tocca quelle gia' giuste)
update public.bacheca_richieste r
   set indicizzabile = exists (select 1 from public.bacheca_risposte x
                               where x.richiesta_id = r.id and not x.autore
                                 and length(trim(coalesce(x.testo, ''))) >= 200)
 where r.indicizzabile is distinct from exists (select 1 from public.bacheca_risposte x
                               where x.richiesta_id = r.id and not x.autore
                                 and length(trim(coalesce(x.testo, ''))) >= 200);

select count(*) filter (where indicizzabile) as su_google, count(*) as tutte from public.bacheca_richieste;
