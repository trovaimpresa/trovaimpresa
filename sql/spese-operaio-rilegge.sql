/* ============================================================================
   L'OPERAIO RILEGGE E CORREGGE LE SPESE CHE HA SCRITTO LUI — 5 settembre 2026
   ============================================================================
   IL DIFETTO (trovato il →4← set, chiuso oggi):
   `gest_spese` aveva la regola per INSERIRE (`gest_spese_team_insert`) e
   NESSUNA regola per LEGGERE. Quindi l'operaio scriveva una spesa e da quel
   momento non la vedeva piu': se sbagliava una cifra non poteva ne' accorgersene
   ne' correggerla, e la correzione tornava addosso al capo.

   LA DECISIONE (Alessio, 5 settembre): «solo le sue, e le corregge».
   Non vede le spese dei colleghi, non vede quelle del capo, non vede quanto
   costa il materiale del cantiere.

   ⛔ PERCHE' SERVE UNA COLONNA NUOVA.
   In tabella c'era gia' `inserito_da`, ma e' un NOME scritto a mano (text):
   l'app ci mette `MIO.nome`. Un nome non e' una firma — chi sa scrivere codice
   ci mette il nome che vuole e si prende le spese di un altro. La firma vera e'
   `creato_da`, che punta alla riga di `gest_operatori`, esattamente come fa gia'
   `gest_rapportini.creato_da`. `inserito_da` resta: serve a farci vedere il nome
   senza una seconda lettura.

   ⚠️ LE RIGHE VECCHIE hanno `creato_da` vuoto: sono le spese del capo, e
   restano invisibili all'operaio. E' quello che vogliamo.

   Si puo' rilanciare senza fare danni.
   ============================================================================ */

alter table public.gest_spese
  add column if not exists creato_da uuid references public.gest_operatori(id);

comment on column public.gest_spese.creato_da is
  'Chi ha scritto la spesa dall''app dell''operaio (gest_operatori.id). Vuoto = l''ha scritta il titolare. E'' la firma su cui girano le regole RLS: inserito_da e'' solo un nome e non vale come firma.';

create index if not exists gest_spese_creato_da_idx on public.gest_spese(creato_da);

/* ---------------------------------------------------------------------------
   LA STESSA DOMANDA IN TRE REGOLE: «questa spesa l'ha scritta CHI la guarda?»
   Scritta uguale in select/update/insert apposta: e' la stessa domanda, e se
   un domani cambia deve cambiare in tutte e tre insieme.
   --------------------------------------------------------------------------- */

drop policy if exists gest_spese_team_read on public.gest_spese;
create policy gest_spese_team_read on public.gest_spese
for select using (
  gest_puo_sezione(user_id,'pagamenti')
  and exists (
    select 1 from public.gest_membri m
     where m.membro_id  = auth.uid()
       and m.impresa_id = gest_spese.user_id
       and m.stato      = 'attivo'
       and m.operatore_id = gest_spese.creato_da
  )
);

drop policy if exists gest_spese_team_update on public.gest_spese;
create policy gest_spese_team_update on public.gest_spese
for update using (
  gest_puo_sezione(user_id,'pagamenti')
  and exists (
    select 1 from public.gest_membri m
     where m.membro_id  = auth.uid()
       and m.impresa_id = gest_spese.user_id
       and m.stato      = 'attivo'
       and m.operatore_id = gest_spese.creato_da
  )
) with check (
  /* ⛔ il `with check` guarda la riga NUOVA: cosi' correggendo la cifra non si
     puo' spostare la spesa a un'altra impresa ne' firmarla con il nome di un
     collega. Senza questo, «correggere» sarebbe una porta aperta. */
  gest_puo_sezione(user_id,'pagamenti')
  and exists (
    select 1 from public.gest_membri m
     where m.membro_id  = auth.uid()
       and m.impresa_id = gest_spese.user_id
       and m.stato      = 'attivo'
       and m.operatore_id = gest_spese.creato_da
  )
);

drop policy if exists gest_spese_team_insert on public.gest_spese;
create policy gest_spese_team_insert on public.gest_spese
for insert with check (
  gest_puo_sezione(user_id,'pagamenti')
  and lavoro_id is not null
  /* ⚠️ NUOVO: adesso la spesa deve essere FIRMATA. Senza firma non si scrive:
     se no nascerebbe una spesa che nemmeno chi l'ha scritta puo' rileggere —
     cioe' il difetto di prima, di nuovo. */
  and exists (
    select 1 from public.gest_membri m
     where m.membro_id  = auth.uid()
       and m.impresa_id = gest_spese.user_id
       and m.stato      = 'attivo'
       and m.operatore_id = gest_spese.creato_da
  )
);

/* Il titolare non passa di qui: per lui vale `gest_spese_own` (auth.uid() =
   user_id), che comanda su tutto e non e' stata toccata.
   ⚠️ NESSUNA regola di CANCELLAZIONE per l'operaio: puo' correggere quello che
   ha scritto, non farlo sparire. Se una spesa e' da buttare, la butta il capo. */

/* --- controllo a occhio, dopo aver lanciato ------------------------------ */
select policyname, cmd from pg_policies
 where schemaname='public' and tablename='gest_spese' order by cmd, policyname;
