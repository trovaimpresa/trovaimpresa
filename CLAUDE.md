# Memoria progetto — TrovaImpresa

## Come lavoriamo (IMPORTANTE)
- Modalità **Cowork**: Claude modifica i file direttamente nella cartella. Non servono prompt per Claude Code.
- **Il `git push` lo fa Alex** dal suo Git Bash. Claude NON deve tentare il push dal proprio ambiente: fallisce sempre.
- Motivo: nell'ambiente di Claude la cartella `.git` è vista tramite un mount con cache "congelata", che mostra un `index.lock` **fantasma** già rimosso lato Windows. Non è un problema reale sul PC di Alex — i suoi push funzionano regolarmente.
- Quindi: dopo aver modificato i file, dare **subito** ad Alex il blocco pronto da incollare (`git add ... / git commit -m "..." / git push`), senza tentativi a vuoto. Ad Alex di norma non serve `rm -f .git/index.lock`.
- Deploy: Netlify pubblica in automatico a ogni push su `main`.

## Preferenze di Alex
- Rispondere **in italiano**, in modo semplice e pratico, conciso.
- Soluzioni pronte da copiare/incollare, poca teoria.
- Alex è **solo founder e sviluppatore** (HTML/CSS/JS, Supabase, Netlify). Email: pintoalessio@icloud.com.

## Stile email di Alex (per le mail agli iscritti)
- Tono **caldo, personale, in prima persona singolare** ("ho deciso di attivare", "sarei lieto", "Resto a disposizione").
- Apertura: "Gentile [Nome]," poi "grazie per esserti iscritto a TrovaImpresa.com".
- Spesso include un **regalo/incentivo**: Piano Premium 3 mesi gratis.
- Sottolinea **visibilità** e **contatto con potenziali clienti**.
- Chiusura fissa: "Un cordiale saluto, Il Team di TrovaImpresa.com".
- Mittente: info@trovaimpresa.com. Colori brand: blu #0066ff, blu scuro #0a2a4d, viola Premium #7b1fa2.
- Template pronto: `email-completa-profilo.html` (versione HTML impaginata).

## Stack e ambiente
- Repo GitHub `trovaimpresa/trovaimpresa`, branch `main`.
- Netlify: `NODE_VERSION = "22"` in `netlify.toml`.
- `@supabase/supabase-js` **bloccato a 2.39.8** in package.json: le versioni più recenti richiedono Node 22 / WebSocket nativo e rompono le Netlify Functions con l'errore "native WebSocket not found". Non sbloccare il `^`.
- Supabase project: `nacvrsgkyfavykxjxszu`.

## Pannelli
- 5 pannelli: `pannello-impresa`, `pannello-artigiano`, `pannello-professionisti`, `pannello-negozio` (le 4 categorie business) + `pannello-candidato`.
- Modal "Genera preventivo con AI": stile `.modal-ai` a tutta pagina (fullscreen), header chiaro. Funzione AI (generaConAI/generaTestoPreventivo/calcolaPrezzo) uniforme su tutti i 4 pannelli.
- Badge numero preventivi sul bottone: presente su impresa/artigiano/professionisti. **Negozio ancora senza** (opzionale da aggiungere).

## Preventivi (pay-per-lead RIMOSSO — luglio 2026)
- **Nessun pagamento**: l'impresa vede gratis i contatti (email/telefono) delle richieste indirizzate a lei. Rimossi pulsante "Sblocca a 5€", sezione "Richieste dalla tua zona" e i file `crea-checkout-lead.js`, `stripe-webhook-lead.js`, `sql/pay-per-lead.sql`, `sql/condivisione-lead.sql`.
- Le richieste arrivano nella tabella `preventivi`; i pannelli leggono la vista `preventivi_safe` (esclude email/telefono). I contatti si ottengono dalla function `contatto-preventivo.js`, che ora li restituisce a chi ha la richiesta indirizzata (nessun gate di pagamento).
- **ATTENZIONE**: se si aggiungono colonne nuove a `preventivi`, rieseguire il blocco `GRANT SELECT (colonne tranne email/telefono) ON public.preventivi TO anon, authenticated` e ricreare `preventivi_safe`, altrimenti il pannello va in 403 ("permission denied for table preventivi").
- DB: le colonne `sbloccato`, `sbloccato_at`, `stripe_session_id`, `condivisibile` e la tabella `lead_sblocchi` restano ma sono **inutilizzate** (innocue). Si possono rimuovere in un secondo momento se si vuole pulire.
- Env Stripe `STRIPE_WEBHOOK_SECRET_LEAD` non serve più (l'endpoint webhook lead su Stripe si può disattivare).

## Registrazione (rifatta — luglio 2026)
- Il profilo in `imprese` NON si crea più con insert manuale lato frontend: lo crea il **trigger `on_auth_user_created`** (function `crea_profilo_impresa`, security definer) leggendo `raw_user_meta_data`.
- I 4 form (`registrazione-impresa/artigiano/professionista/negozio`) + `attiva-profilo` passano i dati in `signUp({ options: { data: {...} } })` con chiavi ESATTE: `tipo, nome_attivita, nome, telefono, citta, provincia, regione, mestiere` (negozio senza `mestiere`).
- **Solo 8 chiavi** vanno al trigger: i campi extra dei form (descrizione, P.IVA, logo, indirizzo, piano, lat/lng, zone, specializzazioni…) **non vengono più salvati alla registrazione** → vanno completati dal pannello/modifica-profilo dopo la conferma mail.
- Conferma email attiva: dopo `signUp` niente sessione, quindi niente login immediato. Messaggio "controlla la mail (anche SPAM)" e redirect a `login-impresa.html`.
- `login-impresa.html`: dopo il login verifica la riga in `imprese` per `user_id`; se manca → `signOut` + messaggio esplicito (non redirect silenzioso).
- Migliorie UX sui 4 form: validazione per-step, campo "Conferma password", indicatore forza password, honeypot anti-bot (`#website_hp`), banner `#form-msg` al posto degli `alert()`. Testo piano Free corretto (rimosso il vecchio "sblocco contatto 5€").

## Registrazione CANDIDATO (allineata — luglio 2026)
- I candidati NON sono imprese: il profilo va in `candidati_lavoro`, non in `imprese`.
- `registrazione-candidato.html` ora usa `supabaseClient.auth.signUp({ options: { data: {...} } })` (prima usava `fetch` diretto a `/auth/v1/signup` + insert manuale). Il CV si carica **prima** del signUp (usa la chiave anon, non la sessione) e l'URL si passa nei metadata.
- **Serve il trigger DB**: `sql/trigger-candidato.sql` crea `crea_profilo_candidato()` + trigger `on_auth_user_created_candidato`, che inserisce in `candidati_lavoro` SOLO quando `tipo = 'candidato'`. Da eseguire su Supabase (come per imprese).
- **ATTENZIONE**: verificare che `crea_profilo_impresa()` NON crei righe in `imprese` per i candidati → deve filtrare su `tipo in ('impresa','artigiano','professionista','negozio')` (snippet nel file SQL).
- Chiavi passate ai metadata: `tipo, nome, cognome, eta, sesso, mestiere, anni_esperienza, competenze, telefono, regione, provincia, citta, cv` (email da `new.email`).
- Stesse migliorie UX degli altri form (banner, honeypot, strength, validazione step) + messaggio conferma mail e redirect a `login-candidato.html`.
- `login-candidato.html`: dopo il login verifica la riga in `candidati_lavoro` per `user_id`; se manca → `signOut` + messaggio esplicito.

## Da fare / opzionali
- Badge numero preventivi anche sul pannello negozio.
- (Opzionale) Pulizia DB: droppare colonne/tabella del vecchio pay-per-lead ora inutilizzate.
- Eseguire `sql/trigger-candidato.sql` su Supabase e aggiungere il filtro sul `tipo` a `crea_profilo_impresa` (vedi sopra).
- Se in futuro si vuole salvare i campi extra alla registrazione impresa, ampliare il trigger `crea_profilo_impresa` per leggerli da `raw_user_meta_data`.
