-- Fatture: data di emissione e termine di pagamento
-- Da eseguire una volta sola in Supabase (SQL Editor).
-- Il gestionale funziona anche senza: queste due colonne servono a rendere
-- esatti "da quanti giorni aspetti" e "entro quando devono pagarti".

-- 1) quando hai segnato la fattura come emessa
alter table gest_lavori
  add column if not exists data_fatt_emessa date;

-- 2) entro quanti giorni ti devono pagare (impostabile nei Dati azienda)
alter table gest_azienda
  add column if not exists giorni_pagamento integer default 30;

-- 3) per le fatture gia' emesse prima di oggi: uso il giorno in cui il lavoro
--    e' stato finito, cosi' i conteggi partono da un dato sensato invece che da zero
update gest_lavori
   set data_fatt_emessa = coalesce(data_fatto, data_prevista)
 where data_fatt_emessa is null
   and fatt_stato in ('emessa','pagata');
