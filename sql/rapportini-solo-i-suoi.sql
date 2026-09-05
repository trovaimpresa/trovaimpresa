/* ============================================================================
   L'OPERAIO LEGGE SOLO I RAPPORTINI SUOI — 6 settembre 2026
   ============================================================================
   PRIMA: `gest_rapportini_team_read` chiedeva SOLO
     gest_puo_sezione(user_id,'rapportini')
   cioe' «hai la spunta rapportini». Chiunque in squadra con quella spunta
   leggeva note e materiali scritti da tutti gli altri.
   E' lo stesso buco chiuso il 5 settembre sui lavori, ma in lettura.
   (Le ORE erano gia' strette: `gest_ore_team_read` controlla che siano le sue.)

   ADESSO: si legge un rapportino solo se sei uno di questi tre:
     · il TITOLARE  → passa dalla regola `gest_rapportini_own`, non si tocca
     · il PREPOSTO o la SEGRETARIA → li leggono tutti (il capo squadra che
       scrive le ore per la squadra i rapportini della squadra li deve vedere)
     · l'OPERAIO → solo quelli che ha scritto lui (creato_da = il suo operatore)

   ⚠️ Scrivere e correggere erano gia' stretti: `gest_rapportini_team_update`
   chiedeva gia' che il rapportino fosse suo. Qui si tocca SOLO la lettura.

   Banco: prove-claude/banchi-fissi/operatore/permessi-rapportini.sql
   Col permesso di prima diventa ROSSO sulle prove 2, 3 e 4.
   ============================================================================ */

drop policy if exists gest_rapportini_team_read on public.gest_rapportini;

create policy gest_rapportini_team_read on public.gest_rapportini
for select using (
  gest_puo_sezione(user_id, 'rapportini')
  and exists (
    select 1 from public.gest_membri m
     where m.membro_id = auth.uid()
       and m.impresa_id = gest_rapportini.user_id
       and m.stato = 'attivo'
       and ( m.ruolo in ('preposto','segretaria')
             or m.operatore_id = gest_rapportini.creato_da )
  )
);
