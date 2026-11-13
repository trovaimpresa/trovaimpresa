/* ============================================================================
   13 nov 2026 — lista «MANCA», GRUPPO 4
   ============================================================================
   1. gest_rapportini.firma_cliente (voce 6: il rapportino da far firmare al
      cliente dal gestionale). Un jsonb come le firme del capitolato:
        { "img": "data:image/png;base64,...", "nome": "Mario Rossi",
          "data": "2026-11-13T18:00:00Z", "hash": "..." }
      «hash» e' l'impronta del testo del rapportino quando e' stato firmato:
      se il testo cambia dopo, la firma non vale piu' (stessa regola del
      capitolato). Vuota = non firmato.

   2. lavoro_voci_senza_prezzi(p_lavoro) (le voci del preventivo nel PDF
      «scheda lavoro» e nell'app dell'operaio, SENZA prezzi).
      ⛔ Perche' una funzione e non una lettura della tabella: l'operaio non
      deve poter leggere gest_preventivo_righe (dentro ci sono i prezzi, e
      dal browser una tabella letta si legge tutta). La funzione restituisce
      solo descrizione, quantita', unita' e capitolo.
      ⛔ Chi la puo' chiamare: le stesse persone che possono LEGGERE quel
      lavoro (regola lavori_read di sql/operaio-solo-i-suoi-lavori.sql):
      il titolare, chi ha «Fatture», e chi ha «Lavori» se il lavoro e' suo
      (o se e' preposto / segretaria). Gli altri ricevono zero righe.

   Si puo' rilanciare senza fare danni.
   ============================================================================ */

alter table public.gest_rapportini add column if not exists firma_cliente jsonb;

create or replace function public.lavoro_voci_senza_prezzi(p_lavoro uuid)
returns table(preventivo_numero integer, descrizione text, qta numeric, unita text, sezione boolean, ordine integer)
language sql stable security definer
set search_path to 'public','pg_catalog' as $$
  select p.numero, r.descrizione, r.qta, r.unita, coalesce(r.sezione,false), r.ordine
    from public.gest_lavori l
    join public.gest_preventivi p on p.lavoro_id = l.id and p.user_id = l.user_id and p.eliminato_il is null
    join public.gest_preventivo_righe r on r.preventivo_id = p.id
   where l.id = p_lavoro
     and l.eliminato_il is null
     and ( auth.uid() = l.user_id
           or public.gest_puo_sezione(l.user_id,'fatture')
           or ( public.gest_puo_sezione(l.user_id,'lavori')
                and ( coalesce(public.gest_mio_ruolo(l.user_id),'') in ('preposto','segretaria')
                      or l.operatore_id = public.gest_mio_operatore(l.user_id) ) ) )
   order by p.created_at desc, r.ordine
$$;

revoke all on function public.lavoro_voci_senza_prezzi(uuid) from public, anon;
grant execute on function public.lavoro_voci_senza_prezzi(uuid) to authenticated;
