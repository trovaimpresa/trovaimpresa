/* ============================================================================
   L'ELENCO ISCRITTI NON SI SCARICA PIU' IN BLOCCO — 5 settembre 2026
   ============================================================================
   ⛔ IL BUCO (misurato, non sospettato). `imprese` aveva la regola
   `SELECT … using (true)` per `anon` e `authenticated`: tutta la tabella, tutte
   e →83← le colonne. Con la chiave `anon` — che sta scritta in chiaro dentro le
   pagine del sito — chiunque, anche senza account, poteva portarsi via:
     →117← imprese · →117← email · →116← telefoni · →66← partite IVA ·
     →117← date di scadenza del Premium · chi ha il gestionale acceso ·
     i →24← che non hanno confermato la mail.
   Cioe' la lista iscritti di TrovaImpresa, che e' il capitale dell'azienda.

   ⚠️ NON e' «l'email e' pubblica»: quella e' giusto che sia pubblica, il
   cliente deve poter chiamare l'idraulico. Il buco e' che si scarica TUTTA
   INSIEME, e che insieme escono anche le colonne dei conti.

   COME SI CHIUDE, in tre pezzi:
     1. la vista `imprese_pubbliche` — le sole colonne che le pagine disegnano;
     2. `scheda_impresa(id)` — i contatti, UNA impresa per volta;
        `impresa_gia_iscritta(colonna, cifre)` — risponde si/no alle
        registrazioni senza far uscire nessuna riga;
     3. QUESTO FILE: la tabella si chiude.

   ⛔ NON LANCIARE QUESTO FILE finche' le pagine non sono pubblicate e provate.
   Prima devono essere online: cerca-*, professionisti, mappa, profilo-impresa,
   recensioni-impresa, i →4← pannelli, js/controllo-doppioni.js e
   netlify/edge-functions/scheda-meta.js. Se si chiude prima, le ricerche si
   svuotano.

   ⚠️ RESTA FUORI, e va sistemato prima o subito dopo:
   `tools/rimanda-conferme.js` legge `imprese` con la chiave pubblica e vuole
   `email` e `email_confermata`, che nella vista non ci sono: dopo questo file
   quel programma non trova piu' niente. Va fatto girare con la chiave di
   servizio, non con quella pubblica.
   ============================================================================ */

/* la vecchia regola: tutto a tutti */
drop policy if exists allow_select_all on public.imprese;
drop policy if exists imprese_select_public on public.imprese;

/* la nuova: ognuno la sua riga, e il fondatore tutto (gli serve per l'admin) */
create policy imprese_select_propria on public.imprese
for select to authenticated
using ( user_id = auth.uid() or public.sono_il_fondatore() );

/* Chi non e' loggato non legge piu' la tabella: legge la vista
   `imprese_pubbliche` e chiede `scheda_impresa(id)` una scheda per volta.
   ⚠️ La vista e' `security_invoker`, quindi eredita le regole della tabella:
   per farla funzionare le si da' il permesso di lettura per conto suo. */
alter view public.imprese_pubbliche set (security_invoker = false);
grant select on public.imprese_pubbliche to anon, authenticated;

/* --- controllo a occhio, subito dopo ------------------------------------- */
-- deve dare 0
begin;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select count(*) as un_estraneo_vede_nella_tabella from public.imprese;
select count(*) as e_nella_vista from public.imprese_pubbliche;
rollback;
