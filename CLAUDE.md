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

## Stack e ambiente
- Repo GitHub `trovaimpresa/trovaimpresa`, branch `main`.
- Netlify: `NODE_VERSION = "22"` in `netlify.toml`.
- `@supabase/supabase-js` **bloccato a 2.39.8** in package.json: le versioni più recenti richiedono Node 22 / WebSocket nativo e rompono le Netlify Functions con l'errore "native WebSocket not found". Non sbloccare il `^`.
- Supabase project: `nacvrsgkyfavykxjxszu`.

## Pannelli
- 5 pannelli: `pannello-impresa`, `pannello-artigiano`, `pannello-professionisti`, `pannello-negozio` (le 4 categorie business con pay-per-lead) + `pannello-candidato` (senza pay-per-lead).
- Modal "Genera preventivo con AI": stile `.modal-ai` a tutta pagina (fullscreen), header chiaro. Funzione AI (generaConAI/generaTestoPreventivo/calcolaPrezzo) uniforme su tutti i 4 pannelli.
- Badge numero preventivi sul bottone: presente su impresa/artigiano/professionisti. **Negozio ancora senza** (opzionale da aggiungere).

## Pay-per-lead
- Contatti cliente (email/telefono) nascosti; si sbloccano con pagamento Stripe 5€ (`crea-checkout-lead.js` + `stripe-webhook-lead.js`). I **Premium** hanno incluse le proprie richieste dirette.
- Il campo `imprese.piano` può valere `premium`, `mensile` o `annuale`: tutti i check "è premium?" devono accettare tutti e tre (frontend + functions).
- Le richieste arrivano nella tabella `preventivi`; i pannelli leggono la vista `preventivi_safe` (esclude email/telefono). Sblocchi tracciati in `lead_sblocchi`.
- **ATTENZIONE**: se si aggiungono colonne nuove a `preventivi`, rieseguire il blocco `GRANT SELECT (colonne tranne email/telefono) ON public.preventivi TO anon, authenticated`, altrimenti il pannello va in 403 ("permission denied for table preventivi").
- L'email di notifica "nuova richiesta" all'impresa è stata **rimossa**: le nuove richieste si vedono solo dal numero sul bottone del pannello.

## Da fare / opzionali
- Badge numero preventivi anche sul pannello negozio.
- Verificare che il webhook Stripe (`STRIPE_WEBHOOK_SECRET_LEAD`) sia configurato, così lo sblocco si registra dopo il pagamento.
- Decisione aperta: la generazione del preventivo AI è libera anche per i Free (pagano solo il contatto) — valutare se bloccarla dietro lo sblocco.
