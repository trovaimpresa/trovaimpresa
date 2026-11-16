// =====================================================================
// TrovaImpresa — Edge Function AI con blocco crediti
//
// Percorso nel tuo progetto:  supabase/functions/ai-generate/index.ts
// Deploy:                     supabase functions deploy ai-generate
//
// Secrets da impostare (una volta sola):
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY ci sono gia' di default)
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const MODEL = "claude-haiku-4-5-20251001";

// Prezzi in EUR per milione di token (aggiorna se cambiano)
const PREZZO_INPUT_EUR_PER_MTOK  = 0.92;
const PREZZO_OUTPUT_EUR_PER_MTOK = 4.60;

// ⛔ 16 nov 2026 — IL CONTROLLO AI USA UN MODELLO PIU' BRAVO.
// Con Haiku il controllo segnalava come «doppi» piatto doccia e box doccia
// anche con la regola scritta che dice il contrario, e leggeva male le
// quantita'. Il controllo e' corto (un preventivo intero costa circa un
// centesimo con Sonnet), quindi si paga volentieri. Il preventivo resta su
// Haiku: con i prezzi di riferimento scritti nel prompt va bene.
// E il controllo PENSA prima di rispondere (thinking): senza, anche Sonnet
// segnalava prezzi dentro la forbice e voci «mancanti» che c'erano gia'.
const MODEL_FORTE = "claude-sonnet-4-5";
const PREZZO_FORTE_INPUT_EUR_PER_MTOK  = 2.76;
const PREZZO_FORTE_OUTPUT_EUR_PER_MTOK = 13.80;

// Che giorno e' in Italia, adesso. Sempre AAAA-MM-GG.
// Se il fuso non fosse disponibile (non dovrebbe mai succedere) si ricade
// sull'ora del server invece di rompere la chiamata: una data imprecisa e'
// meglio di una funzione che non risponde.
function oggiARoma(): string {
  try {
    return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
  } catch (_) {
    return new Date().toISOString().slice(0, 10);
  }
}

const CORS = {
  "Access-Control-Allow-Origin":  "*", // in produzione: "https://trovaimpresa.com"
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---------------------------------------------------------------------
// Le funzioni AI disponibili. Il prompt sta QUI, sul server:
// l'utente non puo' modificarlo ne' usare la tua chiave per altro.
// ---------------------------------------------------------------------
// ---------------------------------------------------------------------
// MANUALE DEL GESTIONALE — l'assistente risponde SOLO su questo.
// Aggiornalo quando aggiungi sezioni: e' l'unica cosa che sa.
// ---------------------------------------------------------------------
const MANUALE = `
GESTIONALE TROVAIMPRESA — come funziona

REGOLA BASE: il gestionale e' diviso in REPARTI (es. giardiniere, pulizia,
edile). Ogni reparto ha lavori, clienti, squadra e calendario separati: non
si mischiano mai. Si sceglie il reparto all'ingresso; per cambiarlo si usa
la freccia in alto a sinistra.

PRIMA COSA DA FARE: compilare "Dati azienda" (pulsante in basso a sinistra).
Senza il nome dell'azienda non si possono generare PDF di fatture e preventivi.

SEZIONI (menu a sinistra):

1. RIEPILOGO — Cruscotto in sola lettura: lavori da fare/in corso/fatti,
   soldi da incassare e incassati, ore, spese, utile, prossimi lavori.
   Non si crea nulla qui: si popola da solo con le altre sezioni.

2. AGENDA OPERATORE — Si sceglie un collaboratore e si vedono tutti i suoi
   lavori con indirizzo, mappa, foto e note. E' la vista da usare in cantiere.
   Serve aver creato persone in Squadra e aver assegnato loro dei lavori.

3. CALENDARIO — I lavori su griglia mensile. Frecce per cambiare mese,
   il punto centrale torna a oggi. Cliccando un giorno si crea un lavoro
   con quella data gia' impostata.

4. LAVORI — Elenco dei lavori del reparto. Pulsante "+ Nuovo".
   Obbligatori: descrizione ("cosa c'e' da fare") e data prevista.
   Filtri: Tutti / Da fare / In corso / Fatti / Da incassare.
   Su ogni lavoro: PDF di cortesia, "Fattura emessa", "Segna pagata",
   modifica, elimina. Nel form completo serve scegliere un condominio.
   Le foto del lavoro si caricano da qui, non dalla Galleria.

5. PREVENTIVI — Pulsanti "+ Nuovo preventivo" e "Con AI".
   Obbligatori: titolo e almeno una voce di costo (voci senza descrizione
   vengono scartate). Il numero e' progressivo automatico.
   Stati: bozza, inviato, accettato, rifiutato.
   Con "Accettato -> crea lavoro" il preventivo diventa un lavoro.
   Il PDF richiede i Dati azienda compilati.
   "Con AI" genera le voci partendo da una descrizione a parole.

6. FATTURE — Ciclo: da emettere -> da incassare -> pagate.
   "+ Nuova" richiede descrizione, data e importo maggiore di zero.
   Si puo' allegare un PDF. Le colonne sono ordinabili.

7. REPORT — Incassi e spese mese per mese, clienti migliori, ore della
   squadra. Sola lettura, con esportazione CSV.

8. GALLERIA — Tutte le foto del reparto divise per cantiere, filtrabili
   per tipo (Da fare / Fatto) e per operatore. Le foto NON si caricano
   qui: si caricano aprendo il lavoro.

9. CONDOMINI / CLIENTI — Rubrica del reparto. "+ Nuovo".
   Obbligatorio solo il nome; indirizzo, referente e telefono facoltativi.
   E' di solito il primo passo, perche' lavori, preventivi e scadenze
   si collegano a un cliente.

10. SQUADRA — Collaboratori e segretarie, con ruolo (operaio, preposto,
    segretaria) e permessi. Obbligatorio solo il nome. Entrano da
    trovaimpresa.com/gestionale con la loro email.

11. SCADENZARIO — Scadenze e pratiche (es. SCIA, DURC, assicurazioni).
    Obbligatori: titolo e data di scadenza. Cliente facoltativo.

ORDINE CONSIGLIATO PER CHI INIZIA:
Dati azienda -> Condomini/Clienti -> Squadra -> primo Lavoro o Preventivo.
`;

const FEATURES: Record<string, {
  costo: number;
  maxTokens: number;
  system: string;
  forte?: boolean;
}> = {

  // costo 0 = usa la quota gratuita separata (consume_help_credit)
  assistente: {
    costo: 0,
    maxTokens: 700,
    system: `Sei l'assistente del gestionale TrovaImpresa. Aiuti artigiani e
piccole imprese a usarlo. Molti non sono pratici di computer.

${MANUALE}

COME RISPONDERE:
- Italiano semplice, niente termini tecnici. Mai dire "record", "campo
  obbligatorio", "istanza": di' "riga", "va compilato", "scheda".
- Massimo 120 parole. Passi numerati quando servono.
- Di' esattamente dove cliccare, con i nomi veri dei pulsanti.
- Se manca un passaggio precedente, dillo subito
  (es. "Prima devi creare il cliente, altrimenti non lo trovi nell'elenco").
- Se la domanda riguarda qualcosa che il gestionale NON fa, dillo con
  chiarezza e non inventare funzioni che non esistono.
- Niente emoji. Tono cortese e concreto, come un collega che ti spiega
  una cosa al volo.
- Ti viene detto in quale sezione si trova l'utente: dai per scontato che
  parli di quella, se non specifica altro.`,
  },

  // -------------------------------------------------------------------
  // ⛔ 16 nov 2026 — IL PREVENTIVO GRANDE (collaudo dal vivo di Alessio)
  // Ristrutturazione chiavi in mano di 90 mq a Roma: l'AI dava 35.000 €
  // (la guida del sito dice 600-800 €/mq, cioe' 54-72.000), dimenticava
  // assistenze murarie, smontaggi, tubi del riscaldamento, piatto doccia,
  // battiscopa, pulizia; contava l'impianto elettrico due volte (a corpo
  // + punti «aggiuntivi»); metteva lo smaltimento a mq; 27 voci in fila
  // senza capitoli. E la versione online NON aveva nemmeno le regole
  // sulle misure del 22 agosto: il file era cambiato, il deploy no.
  // I prezzi di riferimento qui sotto vengono dalle guide «quanto costa»
  // del sito (stessa fonte, stessi numeri): se cambiano li', vanno
  // cambiati anche qui.
  // ⚠️ «capitolo» e «iva» sono campi IN PIU': chi legge il JSON vecchio
  //    (la finestra di AI.apri) li ignora e funziona come prima.
  // -------------------------------------------------------------------
  preventivo: {
    costo: 1,
    // 6000: una ristrutturazione intera con i capitoli ne usa gia' ~3.200;
    // se la risposta si tronca il JSON non si legge e il credito e' perso.
    maxTokens: 6000,
    system: `Sei un capocantiere italiano con trent'anni di mestiere che scrive preventivi per imprese edili e artigiani.
Dato un lavoro descritto dall'utente, genera il preventivo in JSON con questa struttura:
{"titolo":"...","iva":10,"voci":[{"capitolo":"Demolizioni e smaltimenti","descrizione":"...","unita":"mq|ml|mc|cad|corpo|h|kg","quantita":0,"prezzo_unitario":0}],"note":"..."}

I PREZZI — e' la parte che sbagliavi: erano troppo BASSI.
- Sono prezzi da IMPRESA al cliente privato, FORNITURA E POSA (materiale + manodopera + utile d'impresa), IVA esclusa, area di Roma/Lazio. Mai il solo costo del materiale, mai il prezzo da bricolage.
- Manodopera tutto compreso: manovale 25 €/h, muratore specializzato 33 €/h.
- Riferimenti (fornitura e posa, finiture medie). Stai DENTRO queste forbici, verso il centro:
  demolizione pavimenti/rivestimenti con carico macerie 12-18 €/mq; demolizione tramezzo 8-12 cm, chiavi in mano 40-50 €/mq;
  trasporto e conferimento macerie in discarica: A CORPO (un bagno o una stanza 300-600 €, appartamento intero 1.200-2.500 €) oppure a mc, MAI a mq;
  parete in cartongesso posata e stuccata 60-85 €/mq; massetto 18-25 €/mq; pavimento in gres posato 45-70 €/mq (grande formato 60-90);
  rivestimento bagno posato 50-70 €/mq; battiscopa 8-12 €/ml (non dove le pareti sono gia' rivestite di piastrelle, come nei bagni);
  impianto elettrico completo a norma con quadro e dichiarazione di conformita': 70-100 €/mq della casa, oppure 80-150 € a punto (presa, punto luce, comando) — UNO dei due metodi, MAI tutti e due insieme;
  impianto idraulico: bagno completo 900-1.300 €, cucina 800-900 €, a punto acqua 75-150 €;
  sanitari sospesi con cassetta a incasso, posati: 1.000-1.600 € a bagno; rubinetteria a bagno 300-600 €; piatto doccia 150-300 € + box 300-550 €; vasca con posa 600-1.200 €;
  caldaia a condensazione 24 kW chiavi in mano 1.800-2.500 € (+ adeguamento scarico fumi 300-600 €); impianto di riscaldamento nuovo (tubazioni + collettori) 2.500-4.500 € per 90 mq; radiatore posato 250-400 € l'uno;
  rasatura 10-15 €/mq; tinteggiatura pareti e soffitti 6-12 €/mq di superficie dipinta;
  porta interna posata 350-600 €; porta blindata classe 3 posata 1.200-1.900 €;
  infissi PVC posati: finestra 2 ante 480-680 €, portafinestra 2 ante 800-1.150 € (alluminio circa +60%); smontaggio vecchi infissi 30-50 € a pezzo;
  pratica CILA con tecnico 600-1.000 € + direzione lavori 1.500-3.000 € su una ristrutturazione intera.
- Prova del nove: una ristrutturazione COMPLETA chiavi in mano (impianti nuovi, finiture medie) viene 600-800 €/mq della casa; leggera (solo superfici) 350-600 €/mq. Se il tuo totale diviso i mq sta sotto, hai dimenticato voci o messo prezzi bassi: rifallo prima di rispondere.

LE VOCI CHE SI DIMENTICANO (mettile quando il lavoro le richiede):
allestimento cantiere e protezioni; smontaggio di sanitari, caldaia, radiatori, infissi e porte vecchi; tracce e chiusura tracce / assistenze murarie agli impianti; tubazioni del riscaldamento quando ci sono caldaia e termosifoni nuovi; scarico fumi della caldaia; piatto doccia (il box da solo non basta); rubinetteria; impermeabilizzazione della doccia; battiscopa; soglie e davanzali se cambiano gli infissi; dichiarazioni di conformita' degli impianti; pulizia finale di cantiere.
Ogni lavorazione UNA volta sola: se la metti a corpo non la ripeti a pezzi.
I sanitari si scrivono UNA voce per bagno (vaso, bidet e lavabo), con quantita' 1 a corpo ciascuna: mai due bagni dentro una voce sola. Il rivestimento della cucina va con pavimenti e rivestimenti, non coi bagni.

I CAPITOLI
- Se le voci sono piu' di 8, raggruppale con "capitolo" (stesso nome per tutte le voci dello stesso gruppo, gruppi uno dopo l'altro). Esempi: "Opere preliminari e demolizioni", "Opere murarie", "Impianto elettrico", "Impianto idraulico e riscaldamento", "Pavimenti e rivestimenti", "Bagni", "Serramenti e porte", "Pitture e finiture", "Pratiche e oneri tecnici".
- Lavoro piccolo (8 voci o meno): niente capitoli, ometti il campo.

L'UNITA' DI MISURA deve tornare con la lavorazione: superfici a mq, battiscopa e tubi a ml, volumi a mc, pezzi a cad, impianti interi e pratiche a corpo. Mai lo smaltimento a mq.

LE MISURE
- Usa SOLO le misure che ti da' l'utente. Non inventarne di tue.
- Se ti da' i metri quadri di una stanza, il PAVIMENTO e' uguale a quei metri quadri.
- Le PARETI si ricavano dal perimetro, non a occhio:
  perimetro ≈ 4 x radice quadrata dei mq;
  superficie da rivestire = perimetro x altezza del rivestimento, meno circa 2 mq per la porta.
  Esempio: bagno 8 mq, rivestimento a 2 m -> perimetro ≈ 11,3 m -> 11,3 x 2 = 22,6 -> meno la porta ≈ 21 mq.
- Se l'utente ti da' l'altezza del rivestimento, usala. Se non te la da', usa 2 m e SCRIVILO nella prima riga delle note.
- La PITTURA sta sopra il rivestimento: e' la parte di parete che resta, non tutta la parete.
- Stuccatura, battiscopa e silicone si ricavano dalle STESSE misure delle piastrelle: le quantita' devono tornare fra loro.
- Se una misura non c'e' e non si puo' ricavare, metti quantita' 1 e prezzo_unitario 0, e nelle note scrivi che quella voce va misurata.

L'IVA
- "iva": 10 per lavori su una casa d'abitazione (manutenzione e ristrutturazione); 22 per negozi, uffici, capannoni o nuove costruzioni non prima casa; null se non si capisce.

LE NOTE (una cosa per riga, separate da a capo)
- Prima riga: le misure usate e quali hai supposto tu.
- Poi: cosa e' compreso e cosa e' escluso (es. arredi, elettrodomestici, imprevisti murari).
- Se l'IVA e' 10 e ci sono infissi, caldaia o sanitari: "IVA al 10%: su infissi, caldaia e sanitari l'agevolazione ha dei limiti (beni significativi), da verificare col commercialista."
- Tempi indicativi e pagamenti a stati di avanzamento.
- Ultima riga: "Offerta valida 30 giorni."

Rispondi SOLO con il JSON, senza testo attorno.`,
  },
  risposta_cliente: {
    costo: 1,
    maxTokens: 800,
    system: `Scrivi la risposta di un'impresa edile a un cliente.
Tono: professionale, cordiale, concreto. Italiano corretto. Massimo 150 parole.
Non promettere prezzi o date che non ti sono stati forniti.`,
  },
  // --- "Fallo per me": l'AI estrae i dati, il frontend riempie il TUO
  // --- form, l'utente controlla e salva. L'AI non scrive mai nel DB.
  dati_cliente: {
    costo: 1,
    maxTokens: 400,
    system: `Estrai i dati di un cliente o condominio dal testo dell'utente.
Rispondi SOLO con questo JSON, senza testo attorno:
{"nome":"","indirizzo":"","referente":"","telefono":""}

Regole:
- "nome" e' il condominio o la ragione sociale o il nome della persona.
- "referente" e' l'amministratore o la persona di contatto, se diversa dal nome.
- "telefono": solo cifre, spazi e +. Se non c'e', stringa vuota.
- "indirizzo": via, numero civico, citta' se presenti.
- Campo non deducibile = stringa vuota. NON inventare mai dati.
- MAIUSCOLE: sistema sempre le iniziali dei nomi propri, anche se
  l'utente scrive tutto minuscolo.
  "condominio le betulle" -> "Condominio Le Betulle"
  "rossi" -> "Rossi"
  "via verdi milano 12" -> "Via Verdi 12, Milano"
  Lascia invariate le sigle: SRL, SPA, SNC, SAS.`,
  },

  dati_lavoro: {
    costo: 1,
    maxTokens: 500,
    system: `Estrai i dati di un lavoro da svolgere dal testo dell'utente.
Oggi e' {{OGGI}} (formato AAAA-MM-GG).

Rispondi SOLO con questo JSON, senza testo attorno:
{"descrizione":"","dove":"","data":"","importo":null,"cliente":"","operatore":""}

Regole:
- "descrizione": cosa c'e' da fare, chiara e sintetica.
- "dove": indirizzo, scala, piano, se indicati.
- "data": formato AAAA-MM-GG. Converti le espressioni relative
  ("domani", "giovedi prossimo", "tra due settimane") usando la data
  di oggi. Se non e' indicata nessuna data, usa oggi.
- "importo": numero senza simboli, oppure null se non indicato.
- "cliente": il nome del condominio o cliente, se nominato.
- "operatore": il nome della persona che ci va, se nominata.
- Campo non deducibile = stringa vuota (o null per importo).
  NON inventare mai dati, soprattutto prezzi.
- MAIUSCOLE: sistema le iniziali di "cliente" e "operatore" anche se
  l'utente scrive minuscolo ("le betulle" -> "Le Betulle",
  "marco" -> "Marco"). La descrizione inizia con la maiuscola.`,
  },

  // -------------------------------------------------------------------
  // IL RAPPORTINO DETTATO A VOCE DAL CANTIERE
  //
  // L'operaio tiene premuto il microfono della SUA tastiera e parla:
  //   "oggi alle betulle io e marco otto ore, comprati due sacchi di
  //    premiscelato quarantadue euro e cinquanta"
  // Qui quella frase diventa i campi del rapportino. Poi il telefono
  // RIEMPIE il form e lui controlla e salva: l'AI non scrive mai nel
  // database, esattamente come per dati_cliente e dati_lavoro.
  //
  // ⚠️ I NOMI NON SI INVENTANO. Il telefono manda la lista vera della
  // squadra di quel lavoro. Se uno non e' in lista, non entra: un'ora
  // messa sulla persona sbagliata e' una busta paga sbagliata, ed e' un
  // errore che salta fuori a fine mese quando non ci si ricorda piu'
  // niente.
  // -------------------------------------------------------------------
  dati_rapportino: {
    costo: 1,
    maxTokens: 600,
    system: `Trasformi in dati il racconto parlato di una giornata di cantiere.
Oggi e' {{OGGI}} (formato AAAA-MM-GG).

Rispondi SOLO con questo JSON, senza testo attorno:
{"ore":[{"nome":"","ore":0}],"materiali":"","note":"","spesa":{"descrizione":"","importo":null}}

Regole:
- "ore": una voce per ogni persona di cui si parla. "ore" e' un numero,
  anche con la mezz'ora ("sette e mezza" -> 7.5). Mai sopra 24, mai sotto 0.
- I NOMI VANNO PRESI DALLA LISTA "SQUADRA" che trovi nel messaggio, e
  ricopiati IDENTICI. Se chi parla nomina qualcuno che non e' in quella
  lista, quella persona NON va messa: si ignora e basta.
- "io", "me", "il sottoscritto" indicano CHI PARLA: nel messaggio trovi
  "IO SONO: <nome>". Usa quel nome, ricopiato identico dalla lista.
- Se dice un numero di ore senza dire per chi ("abbiamo fatto otto ore"),
  mettile a tutte le persone nominate. Se non e' nominato nessuno,
  mettile a chi parla.
- "materiali": cosa e' stato usato o portato in cantiere, in una riga.
- "note": quello che serve ricordare (problemi, ritardi, cose da finire).
  Frasi corte. NON ripetere qui i materiali e le ore.
- "spesa": SOLO se ha detto di aver comprato o pagato qualcosa.
  "importo" e' un numero: "quarantadue e cinquanta" -> 42.5.
  Se non ha parlato di soldi: {"descrizione":"","importo":null}.
- Campo non deducibile = stringa vuota, oppure null per l'importo,
  oppure lista vuota per le ore. NON INVENTARE MAI NIENTE: ne' nomi,
  ne' ore, ne' prezzi. Meglio un campo vuoto che un campo sbagliato.
- Il parlato del cantiere e' sgrammaticato e pieno di dialetto: sistemalo
  tu, ma non aggiungere cose che non ha detto.
- Maiuscole solo dove servono: i nomi propri e l'inizio delle frasi.`,
  },

  descrizione_azienda: {
    costo: 1,
    maxTokens: 600,
    system: `Scrivi la descrizione del profilo pubblico di un'impresa edile per un marketplace.
Tono: professionale, orientato al cliente finale, senza superlativi vuoti.
150-200 parole. Solo il testo, niente titoli.`,
  },
  report: {
    costo: 2,
    maxTokens: 1500,
    system: `Analizza i dati gestionali forniti di un'impresa edile.
Produci: 3 osservazioni concrete sui numeri e 3 azioni suggerite.
Vai dritto al punto, cita sempre i numeri. Formato markdown, massimo 300 parole.`,
  },

  // -------------------------------------------------------------------
  // 19 agosto 2026 — LA PARTE AI DEL CONTROLLORE
  //
  // Il controllore del gestionale gira su REGOLE: campi vuoti, numeri
  // impossibili, aliquote sbagliate. Sono immediate, costano zero e non
  // sbagliano mai. Questa feature serve solo a quello che una regola non
  // sa vedere: un refuso, una voce scritta in modo troppo vago, la stessa
  // lavorazione contata due volte.
  //
  // ⚠️ NON ARRIVA QUI NESSUN DATO DEL CLIENTE. Il gestionale manda solo
  //    titolo, descrizioni delle voci e note: niente nome, indirizzo,
  //    telefono, partita IVA.
  // ⛔ 16 nov 2026 — DA OGGI GUARDA ANCHE PREZZI E VOCI MANCANTI. Prima era
  //    vietato; nel collaudo dal vivo un preventivo da 35.000 € per una
  //    ristrutturazione di 90 mq e' passato senza un fiato, mentre l'AI
  //    segnalava come «sospetti» i 300 mq di pittura (giusti) e i due bagni
  //    (scritti dall'utente). Deciso con Alessio: il controllo serve proprio
  //    a quello. Il gestionale adesso gli manda anche unita' e prezzo.
  // ⚠️ TUTTO QUELLO CHE ESCE DA QUI E' «DA GUARDARE», MAI «DA CORREGGERE».
  //    Una regola non sbaglia, l'AI si': se marcasse in rosso, dalla terza
  //    volta l'utente smetterebbe di leggere anche i rossi veri.
  // -------------------------------------------------------------------
  controllo_documento: {
    costo: 1,
    maxTokens: 5000,
    forte: true,
    system: `Sei un capocantiere italiano con trent'anni di mestiere. Rileggi un
documento (preventivo, fattura o computo metrico) PRIMA che parta al cliente e
segnali solo quello che salta all'occhio a un occhio esperto.

Ti arrivano il titolo, l'elenco delle voci (con quantita', unita' di misura e
prezzo di una unita', quando ci sono), i capitoli e le note. Nient'altro: non
hai i dati del cliente e non devi chiederli.

GUARDA QUESTE SEI COSE:
1. REFUSI ed errori di ortografia nelle descrizioni.
2. VOCI TROPPO VAGHE: "lavori vari", "come da accordi", "opere murarie",
   "varie ed eventuali". Il cliente non sa cosa sta pagando.
3. VOCI DOPPIE: la stessa lavorazione contata due volte (per esempio un
   impianto elettrico "completo a corpo" e poi ancora i punti luce a pezzo).
   NON sono doppie due voci numerate per locali diversi ("bagno 1", "bagno 2").
4. UNITA' CHE NON TORNA con la lavorazione (una tinteggiatura a "cad", un
   massetto a metri lineari, lo smaltimento delle macerie a mq).
5. PREZZI FUORI MERCATO: solo quando sono CHIARAMENTE lontani dai prezzi da
   impresa a Roma/Lazio, fornitura e posa, IVA esclusa (piu' o meno della
   meta' sotto, o il doppio sopra). Riferimenti: porta blindata posata
   1.200-1.900 €; porta interna 350-600 €; finestra PVC 2 ante 480-680 €;
   caldaia a condensazione chiavi in mano 1.800-2.500 €; impianto idraulico
   di un bagno 900-1.300 €; impianto elettrico completo 70-100 €/mq della
   casa; pavimento in gres posato 45-70 €/mq; ristrutturazione completa
   chiavi in mano 600-800 €/mq. Di' il prezzo scritto e la forbice giusta.
6. VOCI CHE MANCANO in modo evidente per il lavoro scritto nel titolo (per
   esempio caldaia e termosifoni nuovi senza tubazioni, box doccia senza
   piatto, impianti nuovi senza assistenze murarie, infissi nuovi senza
   smontaggio dei vecchi). Al massimo due segnalazioni di questo tipo.
   PRIMA di dire che una cosa manca, rileggi TUTTE le voci: se una voce la
   copre, anche con altre parole o dentro una voce piu' grande (es. la
   demolizione dei rivestimenti sta in "demolizione pavimenti e
   rivestimenti"), NON manca.

PRIMA DI GIUDICARE UN PREZZO leggi la quantita': il totale di una voce e'
quantita' x prezzo (2 bagni a 1.100 € l'uno sono 2.200 €, non 1.100). Un
prezzo che sta DENTRO la forbice non si segnala, nemmeno se e' vicino al bordo.

COSE GIUSTE, NON SEGNALARLE:
- piatto doccia e box doccia sono due pezzi diversi e servono tutti e due:
  non sono una voce doppia;
- pareti piu' soffitti da tinteggiare pari a circa 3-3,5 volte la superficie
  della casa (90 mq di casa -> 270-320 mq da dipingere) e' normale;
- il rivestimento di un bagno a 2 m di altezza e' circa 3-4 volte i mq del
  bagno.

NON FARE MAI:
- non riscrivere il documento;
- non ripetere quello che gia' si vede (che una casella e' vuota lo dicono
  gia' le regole del gestionale);
- non inventare: se una cosa non e' scritta nel testo, non esiste.

Rispondi SOLO con questo JSON, senza testo attorno:
{"segnalazioni":[{"dove":"","problema":""}]}

- "dove": dove sta, con le parole del documento. Esempi: "Titolo",
  "Voce 3: opere murarie", "Note".
- "problema": cos'e' che non va e perche', in italiano semplice, massimo 25
  parole. Niente termini tecnici, niente emoji.
- Al massimo 6 segnalazioni, le piu' importanti. Meglio 2 vere che 6 dubbie:
  ogni segnalazione sbagliata fa perdere fiducia nelle altre.
- Se non c'e' niente da segnalare: {"segnalazioni":[]}. E' una risposta
  giusta, non un fallimento: non inventare un problema pur di riempire.`,
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  try {
    // -----------------------------------------------------------------
    // 1. AUTENTICAZIONE — chi sei?
    // -----------------------------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Non autenticato" }, 401);

    // Client "come utente": auth.uid() dentro le funzioni SQL funziona
    const userClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: "Sessione non valida" }, 401);

    // Client admin, per rimborsi e chiusura log
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // -----------------------------------------------------------------
    // 2. VALIDAZIONE INPUT
    // -----------------------------------------------------------------
    const { feature, input } = await req.json();

    const conf = FEATURES[feature];
    if (!conf) return json({ error: "Funzione AI non riconosciuta" }, 400);

    if (typeof input !== "string" || input.trim().length < 3) {
      return json({ error: "Input mancante o troppo corto" }, 400);
    }
    if (input.length > 8000) {
      return json({ error: "Input troppo lungo (max 8000 caratteri)" }, 400);
    }

    // -----------------------------------------------------------------
    // 3. SCALO (atomico) — PRIMA di chiamare l'AI
    //    costo 0 -> quota aiuto gratuita, disponibile anche sul piano base
    //    costo > 0 -> crediti a pagamento
    // -----------------------------------------------------------------
    const gratuita = conf.costo === 0;

    const { data: consumo, error: consumoError } = gratuita
      ? await userClient.rpc("consume_help_credit")
      : await userClient.rpc("consume_ai_credit", { p_feature: feature, p_cost: conf.costo });

    if (consumoError) {
      console.error("consumo:", consumoError);
      return json({ error: "Errore nel controllo crediti" }, 500);
    }

    if (!consumo.ok) {
      const messaggi: Record<string, string> = {
        plan_without_ai:      "Le funzioni AI non sono incluse nel tuo piano.",
        no_credits:           "Hai esaurito i crediti AI di questo mese.",
        no_help_credits:      "Hai esaurito le domande di aiuto di questo mese. Si rinnovano il primo del mese.",
        subscription_expired: "Il tuo abbonamento e' scaduto.",
        no_account:           "Account non trovato.",
      };
      return json({
        error:     messaggi[consumo.reason] ?? "Funzione non disponibile",
        reason:    consumo.reason,
        remaining: consumo.remaining ?? 0,
      }, 402);
    }

    // L'aiuto gratuito non crea un log a crediti: lo registriamo a parte
    let logId = consumo.log_id ?? null;
    if (gratuita) {
      const { data: nuovoLog } = await admin
        .from("ai_usage_log")
        .insert({ user_id: user.id, feature, credits_cost: 0, status: "pending" })
        .select("id")
        .single();
      logId = nuovoLog?.id ?? null;
    }

    // -----------------------------------------------------------------
    // 4. CHIAMATA AI
    // -----------------------------------------------------------------
    try {
      const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key":         ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type":      "application/json",
        },
        body: JSON.stringify({
          model:      conf.forte ? MODEL_FORTE : MODEL,
          max_tokens: conf.maxTokens,
          ...(conf.forte ? { thinking: { type: "enabled", budget_tokens: 3000 } } : {}),
          // {{OGGI}} serve alle feature che devono interpretare date
          // relative ("giovedi prossimo"): il modello non sa che giorno e'.
          //
          // ⚠️ 15 agosto 2026 — CON L'ORA DI ROMA, NON DI LONDRA.
          // Prima qui c'era toISOString(), che da' sempre l'ora di Londra.
          // In estate sono due ore avanti: fra mezzanotte e le due di notte
          // il server credeva che fosse ancora ieri, e chi dettava un lavoro
          // "domani" all'una se lo ritrovava con la data di un giorno prima.
          // "sv-SE" non e' un vezzo svedese: e' l'unica lingua che scrive le
          // date come AAAA-MM-GG, che e' il formato che serve qui.
          system:     conf.system.replace("{{OGGI}}", oggiARoma()),
          messages:   [{ role: "user", content: input }],
        }),
      });

      if (!aiRes.ok) {
        const dettaglio = await aiRes.text();
        throw new Error(`AI ${aiRes.status}: ${dettaglio.slice(0, 300)}`);
      }

      const aiData = await aiRes.json();
      // col thinking il primo pezzo e' il ragionamento: si prende il testo
      let testo = (aiData.content ?? []).find((b: { type?: string }) => b.type === "text")?.text ?? "";

      if (!testo) throw new Error("Risposta AI vuota");

      // I modelli tendono a incapsulare il JSON in ```json ... ``` anche
      // quando il prompt lo vieta esplicitamente. Lo togliamo qui, una
      // volta per tutte, invece di sperare che il modello obbedisca.
      testo = testo.trim()
        .replace(/^```(?:json)?\s*\n?/i, "")
        .replace(/\n?```\s*$/i, "")
        .trim();

      // 16 nov 2026: Sonnet a volte scrive una frase prima del JSON
      // («Ecco le segnalazioni: {...}») e il gestionale non lo legge piu'.
      // Per le funzioni che rispondono in JSON si tiene solo il pezzo fra la
      // prima { e l'ultima }.
      if (conf.system.includes("JSON") && !testo.startsWith("{")) {
        const i = testo.indexOf("{"), j = testo.lastIndexOf("}");
        if (i >= 0 && j > i) testo = testo.slice(i, j + 1);
      }

      // Costo reale, per la vista margini
      const inTok  = aiData.usage?.input_tokens  ?? 0;
      const outTok = aiData.usage?.output_tokens ?? 0;
      const costo  = (inTok  / 1_000_000) * (conf.forte ? PREZZO_FORTE_INPUT_EUR_PER_MTOK  : PREZZO_INPUT_EUR_PER_MTOK)
                   + (outTok / 1_000_000) * (conf.forte ? PREZZO_FORTE_OUTPUT_EUR_PER_MTOK : PREZZO_OUTPUT_EUR_PER_MTOK);

      if (logId) {
        await admin.rpc("settle_ai_usage", {
          p_log_id:        logId,
          p_input_tokens:  inTok,
          p_output_tokens: outTok,
          p_cost_eur:      Number(costo.toFixed(5)),
        });
      }

      return json({
        ok:        true,
        result:    testo,
        remaining: consumo.remaining,
      });

    } catch (aiError) {
      // -----------------------------------------------------------------
      // 5. RIMBORSO se l'AI fallisce — non fai pagare un errore tuo
      // -----------------------------------------------------------------
      console.error("Errore AI:", aiError);
      if (logId && !gratuita) {
        await admin.rpc("refund_ai_credit", {
          p_log_id: logId,
          p_error:  String(aiError).slice(0, 500),
        });
      } else if (logId) {
        // aiuto gratuito: restituisci la domanda invece del credito
        await admin.from("ai_usage_log")
          .update({ status: "failed", error_message: String(aiError).slice(0, 500) })
          .eq("id", logId);
        await admin.rpc("restituisci_help", { p_user_id: user.id });
      }

      return json({
        error: "Il servizio AI non ha risposto. Il credito e' stato rimborsato, riprova.",
      }, 502);
    }

  } catch (e) {
    console.error("Errore generale:", e);
    return json({ error: "Errore interno" }, 500);
  }
});
