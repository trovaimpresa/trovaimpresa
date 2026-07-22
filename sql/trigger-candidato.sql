-- ============================================================
-- TrovaImpresa — Trigger creazione profilo CANDIDATO
-- Luglio 2026
--
-- Come per le imprese: il profilo del candidato NON si crea più
-- con un insert dal frontend (fallisce con la conferma email attiva
-- perché non c'è sessione e le RLS bloccano). Lo crea questo trigger
-- leggendo i dati da raw_user_meta_data (passati in signUp options.data).
--
-- Chiavi lette dai metadata:
--   tipo (= 'candidato'), nome, cognome, eta, sesso, mestiere,
--   anni_esperienza, competenze, telefono, regione, provincia, citta, cv
-- (email arriva da new.email)
-- ============================================================

-- 1) Funzione: crea la riga in candidati_lavoro SOLO per i candidati
create or replace function public.crea_profilo_candidato()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  md jsonb := new.raw_user_meta_data;
begin
  -- Agisce solo quando l'utente si registra come candidato
  if coalesce(md->>'tipo','') <> 'candidato' then
    return new;
  end if;

  -- Evita doppioni se il trigger viene rieseguito
  if exists (select 1 from public.candidati_lavoro where user_id = new.id) then
    return new;
  end if;

  insert into public.candidati_lavoro (
    user_id, nome, cognome, eta, sesso, mestiere, anni_esperienza,
    competenze, email, telefono, regione, provincia, citta, cv
  ) values (
    new.id,
    md->>'nome',
    md->>'cognome',
    nullif(md->>'eta',''),
    md->>'sesso',
    md->>'mestiere',
    nullif(md->>'anni_esperienza',''),
    md->>'competenze',
    new.email,
    md->>'telefono',
    md->>'regione',
    md->>'provincia',
    md->>'citta',
    md->>'cv'
  );

  return new;
end;
$$;

-- 2) Trigger dedicato al candidato (si aggiunge a quello delle imprese,
--    non lo sostituisce). Entrambi girano su ogni signup ma ognuno
--    agisce solo per il proprio "tipo".
drop trigger if exists on_auth_user_created_candidato on auth.users;
create trigger on_auth_user_created_candidato
  after insert on auth.users
  for each row execute function public.crea_profilo_candidato();

-- ============================================================
-- 3) IMPORTANTE — verifica il trigger delle IMPRESE
--    Ora che il candidato passa tipo = 'candidato' nei metadata,
--    assicurati che crea_profilo_impresa() NON crei una riga in
--    "imprese" per i candidati. Se la funzione non ha già un filtro
--    sul tipo, aggiungi in cima (adatta al corpo esistente):
--
--    if coalesce(new.raw_user_meta_data->>'tipo','')
--         not in ('impresa','artigiano','professionista','negozio') then
--      return new;
--    end if;
--
--    Così ogni signup crea il profilo nella tabella giusta e in una sola.
-- ============================================================
