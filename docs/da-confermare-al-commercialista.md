# Fattura elettronica del gestionale — cose da confermare

**TrovaImpresa · gestionale imprese e studi tecnici — 10 agosto 2026**

Il gestionale costruisce da solo il file XML per lo SDI. Sotto c'è **esattamente** quello che scrive
oggi, con i codici che usa. Mi serve un sì o un no su ognuno: sono cose che finiscono su documenti
fiscali, e preferisco sentirle da te prima che da uno scarto dello SDI.

Dove serve la tua risposta è segnato con **➜**.

---

## 1. La cosa più urgente: IVA allo 0% quando non sono in forfettario

Quando una voce della fattura ha l'aliquota **0%**, lo SDI vuole sapere *perché* l'IVA non si applica
(campo `Natura`). Oggi il gestionale scrive sempre:

```
<Natura>N2.2</Natura>
<RiferimentoNormativo>Operazione non soggetta a IVA ai sensi dell'art. 1,
commi 54-89, L. 190/2014 - regime forfettario</RiferimentoNormativo>
```

È corretto per chi è in **forfettario**. Ma un'impresa edile in regime ordinario mette lo zero per
un altro motivo — di solito l'**inversione contabile del subappalto edile** (art. 17 comma 6
lettera a-ter del DPR 633/72). In quel caso quella dicitura dichiara una cosa che non è vera.

Per ora ho **bloccato** la creazione del file elettronico in questo caso: il gestionale avvisa e non
lo produce. Il PDF si può mandare normalmente.

**➜ Quale codice `Natura` e quale riferimento normativo devo usare per il subappalto edile?**
(io mi aspetto N6.7, ma non voglio indovinare)

**➜ Ci sono altri casi di IVA non applicata che un'impresa edile incontra davvero?**
Reverse charge per cessioni di rottami, operazioni non imponibili art. 8/8-bis, split payment verso
la Pubblica Amministrazione… se sì, mi servono i codici così li metto in una tendina.

---

## 2. I codici delle casse previdenziali (`TipoCassa`)

Sono quelli che compaiono nella tendina "Cassa previdenziale" della fattura di uno studio tecnico:

| Cosa legge l'utente | % | Codice nel file |
|---|---|---|
| Nessuna cassa | 0 | *(il blocco non viene scritto)* |
| Inarcassa (ingegneri, architetti) | 4% | `TC04` |
| Cassa Geometri | 5% | `TC03` |
| EPPI (periti industriali) | 5% | `TC17` |
| INPS gestione separata | 4% | `TC22` |

**➜ I quattro codici sono giusti e abbinati alla cassa giusta?**
**➜ Le percentuali proposte per difetto (4% e 5%) sono quelle correnti?**

Come viene calcolata: la cassa si applica **solo sul compenso**, non sulle spese. Poi entra
nell'imponibile IVA insieme alle spese, con l'aliquota su cui sta più imponibile.

**➜ Confermi che la cassa va nell'imponibile IVA e non fuori?**

Nel file elettronico esce così:

```
<DatiCassaPrevidenziale>
  <TipoCassa>TC03</TipoCassa>
  <AlCassa>5.00</AlCassa>
  <ImportoContributoCassa>100.00</ImportoContributoCassa>
  <ImponibileCassa>2000.00</ImponibileCassa>   ← il compenso, non il totale
  <AliquotaIVA>22.00</AliquotaIVA>
</DatiCassaPrevidenziale>
```

---

## 3. La ritenuta d'acconto: RT01 o RT02

Il gestionale decide da solo il `TipoRitenuta` guardando il **codice fiscale** di chi emette:

- codice fiscale di **16 caratteri** → `RT01` (persona fisica)
- codice fiscale **uguale alla partita IVA** (11 cifre) → `RT02` (persona giuridica)
- in ogni altro caso → `RT01`

**➜ È il criterio giusto, o devo guardare qualcos'altro (per esempio la forma giuridica)?**

La `CausalePagamento` è fissa a **`A`**.
**➜ Va bene `A` per le prestazioni di un tecnico? E per un'impresa edile che subisce la ritenuta
del 4% su un lavoro condominiale, il codice è ancora `A` o cambia?**

Come viene calcolata: la ritenuta si applica **solo sul compenso**, non su spese e bolli. E non
viene sottratta dal totale del documento — esce come "netto a pagare" a parte.

**➜ Confermi che il `ImportoTotaleDocumento` deve restare al lordo della ritenuta?**

---

## 4. Lo sconto in fattura

Se metto uno sconto, oggi il gestionale lo toglie **dopo** aver calcolato l'IVA. Quindi:

- imponibile 10.000 · IVA 10% = 1.000 · sconto 500 → **totale 10.500**
- nel riepilogo IVA resta dichiarato: imponibile 10.000, imposta 1.000
- lo sconto viene scritto a parte come `<ScontoMaggiorazione><Tipo>SC</Tipo>`

**➜ È accettabile, o lo sconto deve ridurre la base imponibile (e quindi anche l'IVA)?**
Se deve ridurla, lo cambio: è una modifica di mezz'ora, ma cambia i numeri delle fatture nuove e
preferisco farla una volta sola e nel modo giusto.

---

## 5. Aliquote IVA proposte per difetto

- **impresa edile / artigiano**: 10%
- **studio tecnico (geometra, ingegnere, architetto)**: 22%

Le aliquote scelte riga per riga sono 22, 10, 4, 0.

**➜ Il 10% per difetto all'impresa edile va bene, o è meglio partire dal 22% e farlo scegliere ogni volta?**
(il 10% è manutenzione e ristrutturazione, il 4% la prima casa: sono i due casi di gran lunga più
frequenti, ma il 10% messo per difetto è comodo e rischioso allo stesso tempo)

---

## 6. Altre cose scritte fisse nel file

| Campo | Valore | ➜ Domanda |
|---|---|---|
| `TipoDocumento` | `TD01` fattura, `TD02` acconto, `TD04` nota di credito | giusti? |
| `RegimeFiscale` | `RF01` ordinario oppure `RF19` forfettario | bastano questi due? |
| `EsigibilitaIVA` | `I` (immediata) sempre | va bene sempre? |
| `CondizioniPagamento` | `TP02` (pagamento completo) | e per gli acconti? |
| `ModalitaPagamento` | `MP05` (bonifico) sempre | serve gestire anche contanti o RiBa? |
| `DatiBollo` | `BolloVirtuale SI` quando c'è il bollo | corretto anche in forfettario? |
| Bollo in forfettario | proposto a 2 € sopra i 77,47 € | soglia e importo aggiornati? |

---

## 7. Numerazione e cancellazioni

Le fatture **emesse** (quelle che hanno preso il numero) non si possono più cancellare dal
gestionale: restano nel cestino ma non si eliminano, per non aprire buchi nella numerazione. Per
correggerne una la strada è la **nota di credito**.

**➜ È l'approccio giusto? La numerazione può avere buchi in qualche caso legittimo
(per esempio una fattura annullata prima dell'invio allo SDI)?**

---

# Per un legale, non per il commercialista

Il gestionale genera anche due documenti che il cliente firma. I testi li ho scritti io e vanno
riletti da chi di dovere:

- **Lettera d'incarico professionale** — per l'obbligo dell'art. 9 comma 4 del DL 1/2012 (preventivo
  scritto obbligatorio per i professionisti). Va verificato che il modello lo soddisfi davvero.
- **Conferma d'ordine** per i lavori dell'impresa — in particolare la parte sul recesso quando il
  cliente è un consumatore (Codice del consumo) e il foro competente.
