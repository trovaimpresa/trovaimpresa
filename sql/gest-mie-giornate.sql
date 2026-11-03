-- =====================================================================
-- 3 novembre 2026 — LE MIE GIORNATE PER OGNI OPERAIO
-- Deciso con Alessio: l'operaio vede le SUE giornate anche senza il
-- permesso «Rapportini» (che resta per chi scrive le ore di tutti).
-- Basta il permesso «Lavori».
--
-- ⛔ Non e' una regola nuova su gest_ore: e' una funzione che restituisce
--    SOLO le righe dell'operaio collegato a chi chiama (gest_membri attivo),
--    con il nome del cantiere. Cosi' non apre ne' le ore dei colleghi, ne'
--    i lavori a cui non e' assegnato, ne' le note del capo.
-- =====================================================================
create or replace function public.gest_mie_giornate(p_impresa uuid, p_da date, p_a date)
returns table(data date, ore numeric, cantiere text, rapportino_id uuid)
language sql stable security definer set search_path = public as $$
  select o.data, o.ore::numeric,
         coalesce(nullif(l.descrizione, ''), nullif(l.dove, ''), 'Cantiere'),
         o.rapportino_id
  from gest_ore o
  join gest_membri m on m.membro_id = auth.uid() and m.impresa_id = o.user_id
                    and m.stato = 'attivo' and m.operatore_id = o.operatore_id
  left join gest_lavori l on l.id = o.lavoro_id
  left join gest_rapportini r on r.id = o.rapportino_id
  where o.user_id = p_impresa
    and o.eliminato_il is null
    and r.eliminato_il is null
    and o.data >= p_da and o.data < p_a
    and (gest_puo_sezione(o.user_id, 'lavori') or gest_puo_sezione(o.user_id, 'rapportini'))
  order by o.data desc
  limit 400
$$;
revoke all on function public.gest_mie_giornate(uuid, date, date) from public, anon;
grant execute on function public.gest_mie_giornate(uuid, date, date) to authenticated;
