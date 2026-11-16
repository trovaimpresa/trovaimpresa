-- 16 novembre 2026 — IL SAL E IL CAPITOLO «COSTI DELLA SICUREZZA»
-- Gia' applicato al database (migrazione sal_capitolo_sicurezza_16nov2026).
--
-- IL PERCHE'. Dal 6 settembre i costi della sicurezza si mettono in un CAPITOLO
-- marcato (gest_computo_capitoli.sicurezza): il computo li tiene fuori dal
-- ribasso. Il SAL no: la vista gest_sal_righe_calc guardava solo la casella
-- vecchia (gest_computo_voci.oneri_sicurezza), quindi nel SAL, nel suo PDF e
-- nella fattura dell'acconto la sicurezza veniva RIBASSATA. A lavori finiti
-- la somma dei SAL non dava il totale del computo (provato: 3.686,43 contro
-- 3.721,43 con 350 € di sicurezza e ribasso del 10%).
--
-- Stesse colonne di prima, stesso ordine: cambia solo «oneri_sicurezza», che
-- adesso somma le due strade come fa gest_computo_totali.
create or replace view public.gest_sal_righe_calc
with (security_invoker = true) as
 select r.id,
    r.user_id,
    r.sal_id,
    r.voce_id,
    v.computo_id,
    v.capitolo_id,
    v.ordine,
    v.codice,
    v.descrizione,
    v.unita,
    v.prezzo_unitario,
    v.quantita as quantita_computo,
    r.quantita_eseguita,
    (r.quantita_eseguita * v.prezzo_unitario)::numeric(16,2) as importo,
        case
            when v.quantita > 0::numeric then r.quantita_eseguita / v.quantita * 100::numeric
            else null::numeric
        end::numeric(8,2) as percentuale,
    r.quantita_eseguita > v.quantita as oltre_computo,
    (
        case
            when v.quantita > 0::numeric then coalesce(v.oneri_sicurezza, 0::numeric) * (r.quantita_eseguita / v.quantita)
            else 0::numeric
        end
        + case when coalesce(cap.sicurezza, false) then r.quantita_eseguita * v.prezzo_unitario else 0::numeric end
    )::numeric(16,2) as oneri_sicurezza,
        case
            when v.quantita > 0::numeric then r.quantita_eseguita * v.prezzo_unitario * coalesce(v.incidenza_manodopera, 0::numeric) / 100::numeric
            else 0::numeric
        end::numeric(16,2) as importo_manodopera,
    r.note
   from gest_sal_righe r
     join gest_computo_voci_calc v on v.id = r.voce_id
     left join gest_computo_capitoli cap on cap.id = v.capitolo_id;
