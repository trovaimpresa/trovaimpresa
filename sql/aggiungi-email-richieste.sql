-- Campo email nelle richieste dei clienti + colonna data per l'anti-doppione.
-- Da eseguire una volta sola nell'editor SQL di Supabase.

-- 1) email del cliente (facoltativa)
alter table richieste_clienti add column if not exists email text;

-- 2) data di arrivo della richiesta
alter table richieste_clienti add column if not exists created_at timestamptz;

-- 3) le richieste gia' in tabella le mettiamo nel passato,
--    cosi' non vengono scambiate per doppioni appena arrivati
update richieste_clienti set created_at = timestamptz '2020-01-01' where created_at is null;

-- 4) da adesso ogni nuova richiesta si data da sola
alter table richieste_clienti alter column created_at set default now();

-- 5) indice per il controllo anti-doppione (telefono + data)
create index if not exists idx_richieste_clienti_tel_data
  on richieste_clienti (telefono, created_at desc);
