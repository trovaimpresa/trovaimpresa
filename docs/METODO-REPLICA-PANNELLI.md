# 🛠️ Metodo Replica Pannelli — TrovaImpresa

> **PRINCIPIO BASE:** L'**ARTIGIANO è il modello.**
> Non si tocca, non si reinventa. **Tutto si copia da lui.**
> Gli altri pannelli (impresa, negozio, professionista) si adeguano all'artigiano, mai il contrario.

_Scritto dopo la replica del pannello impresa del 31/05/2026. Serve per fare negozio e professionista **senza tornare nel caos**._

---

## I 5 PASSI — segui SEMPRE quest'ordine

### 1️⃣ Inventario PRIMA di toccare (sola lettura)
Prima di ogni modifica, fai fare a Code una lista in **SOLA LETTURA** dei due file (artigiano + pannello da sistemare):
- card / bottoni nell'ordine esatto
- lucchetti (`data-premium` sì/no)
- onclick e link
- etichette dei gruppi

Confronti le due liste e vedi le differenze **vere**. Niente supposizioni.
👉 È il passo che salva il lavoro. Quando indoviniamo, sbagliamo.

**Prompt tipo:**
```
Solo lettura, non modificare niente.
In pannello-artigiano.html e pannello-X.html, elencami le card di [SEZIONE] nell'ordine esatto.
Per ognuna: titolo + data-premium (lucchetto) sì/no + onclick/link.
Incolla qui le due liste, nessuna modifica.
```

### 2️⃣ Una sezione alla volta, obiettivo scritto
Lavori su **UNA** sezione per volta (Funzioni Premium → Strumenti → Cantieri → ...).
Obiettivo chiaro: _"questa sezione deve diventare IDENTICA a quella dell'artigiano"._
Non passi alla prossima finché questa non combacia.

### 3️⃣ Copia dal modello — MAI inventare
Copi il **blocco intero** dall'artigiano: card, ordine, onclick, link, `data-premium`.
Se qualcosa sembra mancare o rotto → **NON** inventi una soluzione nuova.
Guardi come lo risolve l'artigiano e copi **quello**.

> ⚠️ **L'errore del 31/05:** avevo inventato un gruppo "SEZIONI" che l'artigiano non aveva. Risultato: pannelli diversi e ore perse. La soluzione era già dentro l'artigiano.

### 4️⃣ Rete di sicurezza prima del push
Nel prompt a Code metti **sempre** questa riga:
```
Se un onclick richiama una funzione che NON esiste nel file, fermati e dimmelo prima di pushare.
```
Così Code non manda online un bottone rotto.

> ✅ Il 31/05 questa riga ha beccato `apriModalPreventivi()` (non esisteva nell'impresa) e si è fermato **prima** del push. Lavoro pulito.

### 5️⃣ diff prima del push + ricontrollo affiancato
- Sempre **`diff prima del push`** in fondo a ogni prompt.
- Guardi il diff: deve toccare **SOLO** quello che hai chiesto.
- Dopo il push → ricarichi con **Ctrl+Shift+R** e metti i due pannelli **affiancati**: devono combaciare.
- Se non combaciano → torni al **Passo 1** sulla sezione che non torna.

---

## 🟡 Quando una card è diversa per RUOLO
A volte una card non può essere identica perché cambia il ruolo:
- **Artigiano** = cerca lavoro ("Invia CV", "Ricerca Offerte")
- **Impresa** = assume ("Pubblica Offerta", "Ricerca Candidati")

👉 Questa è una **TUA decisione** (testo + link), non un problema tecnico. Decidi tu, non lasciare indovinare a Code.
Default semplice: **copia identico**, poi se dà fastidio cambi una parola dopo.

---

## 📌 Costanti tecniche (valgono per tutti i pannelli)
- Tutti i pannelli usano `sb.` come client Supabase.
- **Un file = un'azione.** Mai modifiche in parallelo.
- Prompt a Code: **max 4-6 righe**, finisci sempre con `diff prima del push`.
- Il **tema** (colori, header, banner) **NON è codice**: è la personalizzazione dell'account. Si imposta da "Personalizza pannello", non si tocca nei file.
- DevTools: usa **Ctrl+Shift+J** (F12 sul tuo PC attiva la modalità aereo).
- Testo dopo `>` nel terminale di Code = suggerimento automatico, **non** un tuo comando.

---

## 🔁 Ordine consigliato per un pannello nuovo (negozio / professionista)
1. Sidebar + mappa (larghezza uguale all'artigiano: `240px`)
2. Layout dashboard (calendario, calcolatrice, accesso rapido)
3. Funzioni Premium (card, ordine, lucchetti)
4. Strumenti, Cantieri, sezioni extra
5. Personalizzazioni **proprie della categoria** — _queste_ sì che cambiano:
   - Negozio → catalogo, orari
   - Professionista → portfolio, tariffe

Dopo ogni punto: **diff → push → ricarica → affianca → combacia? → avanti.**
