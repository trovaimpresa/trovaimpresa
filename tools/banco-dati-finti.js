/* ======================================================================
   I DATI FINTI DEL BANCO DEL GESTIONALE — 12 novembre 2026
   ======================================================================
   Il banco (tools/banco-gestionale.js) apre il gestionale con un database
   finto. Vuoto vedeva solo meta' dei difetti: una riga lunga che esce dallo
   schermo, un numero che va a zero senza rete, una domanda di «elimina»
   senza nome si vedono solo se dentro c'e' qualcosa.
   Qui c'e' quel qualcosa: POCHE righe per tabella, TUTTE INVENTATE (nomi,
   telefoni, partite IVA: nessuno e' vero), con dentro apposta i casi
   scomodi — un nome lunghissimo, un lavoro in ritardo, un mezzo fuori a
   noleggio da troppo, una fattura scaduta, una giacenza a zero.

   ⚠️ Le colonne sono quelle VERE del database (lette il 12 nov 2026). Se
   si aggiunge una colonna che una schermata mostra, va aggiunta anche qui.
   ====================================================================== */
"use strict";
module.exports = function datiFinti(UID, REPARTO) {
  const g = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const ts = (n) => g(n) + "T08:00:00+00:00";
  const id = (n) => "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
  const base = (n, giorniFa) => ({ id: id(n), user_id: UID, created_at: ts(-(giorniFa || 30)), eliminato_il: null });
  const anno = +g(0).slice(0, 4);
  const LUNGO = "Ristrutturazione completa dell'appartamento al terzo piano con rifacimento di impianto elettrico, idraulico e pavimenti";

  const clienti = [
    Object.assign(base(101), { mestiere_id: REPARTO, nome: "Condominio Le Magnolie di via Giuseppe Garibaldi", indirizzo: "Via Giuseppe Garibaldi 128, scala B", referente: "Amministratore Bianchi", telefono: "0746000001", piva: "00000000001", cod_fiscale: "00000000001", cap: "02100", citta: "Rieti", prov: "RI", sdi_codice: "0000000", sdi_pec: "", email: "amministrazione.condominio.magnolie@esempio.test", tipo: "condominio", note: "", listino: null, sconto_perc: 0 }),
    Object.assign(base(102), { mestiere_id: REPARTO, nome: "Rossi Mario", indirizzo: "Via Roma 1", referente: "", telefono: "3330000002", piva: "", cod_fiscale: "", cap: "02100", citta: "Rieti", prov: "RI", sdi_codice: "", sdi_pec: "", email: "mario@esempio.test", tipo: "privato", note: "", listino: null, sconto_perc: 0 })
  ];
  const operatori = [
    Object.assign(base(201), { mestiere_id: REPARTO, nome: "Giovanni Prova", telefono: "3330000003", mansione: "Operaio", costo_orario: 22.5, visita_medica_scadenza: g(-40), formazione_scadenza: g(200), attestati: "", documento_numero: "", documento_scadenza: null, permesso_scadenza: null, data_nascita: null, codice_fiscale: "", email: "", data_assunzione: null, tipo_contratto: "", emergenza_nome: "", emergenza_telefono: "", documenti: [] })
  ];
  const lavori = [
    Object.assign(base(301, 60), { mestiere_id: REPARTO, cliente_id: id(101), operatore_id: id(201), descrizione: LUNGO, dove: "Via Giuseppe Garibaldi 128, Rieti", data_prevista: g(-20), data_fatto: null, stato: "da_fare", lavoro_svolto: "", note: "", ore: 0, importo: 12450.5, fatt_stato: "none", num_fatt: null, fatt_data: null, fatt_iva_perc: null, fatt_sconto_perc: null, data_fatt_emessa: null }),
    Object.assign(base(302, 20), { mestiere_id: REPARTO, cliente_id: id(102), operatore_id: null, descrizione: "Tinteggiatura soggiorno", dove: "Via Roma 1, Rieti", data_prevista: g(5), data_fatto: null, stato: "in_corso", lavoro_svolto: "", note: "", ore: 0, importo: 800, fatt_stato: "none", num_fatt: null, fatt_data: null, fatt_iva_perc: null, fatt_sconto_perc: null, data_fatt_emessa: null }),
    Object.assign(base(303, 90), { mestiere_id: REPARTO, cliente_id: id(102), operatore_id: id(201), descrizione: "Riparazione perdita bagno", dove: "Via Roma 1, Rieti", data_prevista: g(-70), data_fatto: g(-68), stato: "fatto", lavoro_svolto: "Sostituito il flessibile", note: "", ore: 3, importo: 250, fatt_stato: "emessa", num_fatt: 1, fatt_data: g(-60), fatt_iva_perc: 22, fatt_sconto_perc: 0, data_fatt_emessa: g(-60) })
  ];
  const ore = [Object.assign(base(351), { mestiere_id: REPARTO, lavoro_id: id(303), operatore_id: id(201), data: g(-68), ore: 3, nota: "", rapportino_id: id(381) })];
  /* 13 nov 2026 (gruppo 4) — un rapportino del telefono, non ancora firmato dal cliente */
  const rapportini = [Object.assign(base(381, 68), { mestiere_id: REPARTO, lavoro_id: id(303), data: g(-68), note: "Sostituito il flessibile del lavabo e controllato lo scarico", materiali: "1 flessibile, 2 raccordi", creato_da: id(201), firma_cliente: null })];
  const spese = [Object.assign(base(361), { lavoro_id: id(303), descrizione: "Flessibile e raccordi", importo: 18.9, data: g(-68), fornitore_id: id(701), inserito_da: "Capo", creato_da: UID })];
  const preventivi = [
    Object.assign(base(401, 25), { mestiere_id: REPARTO, cliente_id: id(101), lavoro_id: null, numero: 1, titolo: LUNGO, note: "", stato: "bozza", data: g(-25), cassa_perc: 0, iva_perc: 10, ritenuta: false, ritenuta_perc: 0, spese_forfait: 0, capitolato: null, sconto: 0, sconto_perc: 0, accettato_il: null }),
    Object.assign(base(402, 10), { mestiere_id: REPARTO, cliente_id: id(102), lavoro_id: id(302), numero: 2, titolo: "Tinteggiatura soggiorno", note: "", stato: "accettato", data: g(-10), cassa_perc: 0, iva_perc: 22, ritenuta: false, ritenuta_perc: 0, spese_forfait: 0, capitolato: null, sconto: 0, sconto_perc: 0, accettato_il: null })
  ];
  const prevRighe = [
    { id: id(411), user_id: UID, preventivo_id: id(401), descrizione: "Demolizione e rimozione dei pavimenti esistenti, compreso il trasporto a discarica", qta: 85.5, unita: "m²", prezzo: 32.4, ordine: 1, sezione: false },
    { id: id(412), user_id: UID, preventivo_id: id(401), descrizione: "Posa pavimento in gres", qta: 85.5, unita: "m²", prezzo: 48, ordine: 2, sezione: false },
    { id: id(413), user_id: UID, preventivo_id: id(402), descrizione: "Tinteggiatura pareti", qta: 60, unita: "m²", prezzo: 9.5, ordine: 1, sezione: false },
    { id: id(414), user_id: UID, preventivo_id: id(402), descrizione: "Stuccatura e carteggiatura delle crepe", qta: 1, unita: "corpo", prezzo: 120, ordine: 2, sezione: false },
    { id: id(415), user_id: UID, preventivo_id: id(402), descrizione: "Tinteggiatura soffitto", qta: 22, unita: null, prezzo: 5, ordine: 3, sezione: false }
  ];
  const fatt = (n, numero, stato, giorniFa, cli, pagata) => Object.assign(base(n, giorniFa), { mestiere_id: REPARTO, cliente_id: cli.id, anno: anno, numero: numero, tipo: "fattura", data: g(-giorniFa), stato: stato, data_pagata: pagata || null, cli_nome: cli.nome, cli_piva: cli.piva, cli_cod_fiscale: cli.cod_fiscale, cli_indirizzo: cli.indirizzo, cli_cap: cli.cap, cli_citta: cli.citta, cli_prov: cli.prov, cli_sdi: "", cli_pec: "", regime_fiscale: "RF01", ritenuta_perc: 0, bollo: 0, sconto: 0, note: "", cassa_perc: 0, cassa_tipo: null, spese: 0, spese_iva: 0, spese_regime: null, scadenza: null, modo_pagamento: null, iban: null, sdi_uuid: null, sdi_stato: null, sdi_esito: null, sdi_inviata_il: null, sdi_aggiornata_il: null, sdi_ambiente: null });
  const fatture = [
    fatt(501, 1, "emessa", 60, clienti[1]),            /* scaduta da un mese */
    fatt(502, 2, "pagata", 40, clienti[0], g(-10)),
    fatt(503, null, "bozza", 12, clienti[0])
  ];
  const fattRighe = [
    { id: id(511), user_id: UID, fattura_id: id(501), descrizione: "Riparazione perdita bagno", qta: 1, prezzo: 250, iva: 22, ordine: 1, created_at: ts(-60) },
    { id: id(512), user_id: UID, fattura_id: id(502), descrizione: "Acconto lavori condominio", qta: 1, prezzo: 3000, iva: 10, ordine: 1, created_at: ts(-40) },
    { id: id(513), user_id: UID, fattura_id: id(503), descrizione: LUNGO, qta: 1, prezzo: 1500, iva: 10, ordine: 1, created_at: ts(-12) }
  ];
  const tot = (fid, imp, iva) => ({ fattura_id: fid, user_id: UID, mestiere_id: REPARTO, imponibile: imp, iva: +(imp * iva / 100).toFixed(2), totale: +(imp * (1 + iva / 100)).toFixed(2), n_righe: 1, totale_documento: +(imp * (1 + iva / 100)).toFixed(2), compenso: imp, cassa: 0, spese: 0, spese_iva: 0, sconto: 0, ritenuta: 0, segno: 1 });
  const fattTotali = [tot(id(501), 250, 22), tot(id(502), 3000, 10), tot(id(503), 1500, 10)];
  const mezzo = (n, nome, extra) => Object.assign(base(n), { mestiere_id: REPARTO, nome: nome, categoria: "movimento terra", targa: "", stato: "disponibile", note: "", tipo: "mezzo", noleggiabile: true, codice: "E-0" + (n - 600), tariffa_ora: 0, tariffa_giorno: 150, tariffa_settimana: 600, tariffa_mese: 1800, ore_incluse_giorno: 8, tariffa_ora_extra: 0, km_inclusi_giorno: 0, tariffa_km: 0, usura_fissa: 0, usura_percento: 0, cauzione: 500, ha_contaore: false, ha_contakm: false, verifica_ultima: g(-100), verifica_mesi: 12, verifica_ente: "", assicurazione_scad: g(120), revisione_scad: g(-15), collaudo_scad: null, tagliando_ogni_ore: null, tagliando_ultimo_ore: null, contaore_attuale: null, fuori_servizio: false, fuori_servizio_perche: "", manutenzione_note: "" }, extra || {});
  const mezzi = [mezzo(601, "Escavatore cingolato 3,5 tonnellate con martello demolitore"), mezzo(602, "Furgone", { categoria: "furgone", targa: "AA000AA", noleggiabile: false, revisione_scad: g(300) })];
  const scadenze = [
    Object.assign(base(651), { mestiere_id: REPARTO, titolo: "Revisione escavatore", tipo_pratica: "Revisione mezzo", cliente_id: null, data_scadenza: g(-15), stato: "aperta", note: "", mezzo_id: id(601), lavoro_id: null, avvisi: null, avvisa: true, ripeti_mesi: null, operatore_id: null }),
    Object.assign(base(652), { mestiere_id: REPARTO, titolo: "DURC", tipo_pratica: "Documento", cliente_id: null, data_scadenza: g(45), stato: "aperta", note: "", mezzo_id: null, lavoro_id: null, avvisi: null, avvisa: true, ripeti_mesi: null, operatore_id: null })
  ];
  const mezziScad = [{ mezzo_id: id(601), user_id: UID, mestiere_id: REPARTO, nome: mezzi[0].nome, categoria: mezzi[0].categoria, targa: "", stato: "disponibile", aperte: 1, scadute: 1, prossima_data: g(-15), prossimo_titolo: "Revisione escavatore", prossimo_tipo: "Revisione mezzo" }];
  const fornitori = [Object.assign(base(701), { mestiere_id: REPARTO, nome: "Rivendita Edile di prova Srl", categoria: "Rivendita edile", telefono: "0746000004", email: "ordini@esempio.test", piva: "00000000002", indirizzo: "Via dell'Industria 5, Rieti", note: "", trovaimpresa_id: null })];
  const fattForn = [Object.assign(base(711), { mestiere_id: REPARTO, fornitore_id: id(701), lavoro_id: null, numero: "A/15", data: g(-35), importo: 640.2, scadenza: g(-5), stato: "da_pagare", data_pagata: null, note: "" })];
  const carte = [Object.assign(base(751), { mestiere_id: REPARTO, nome: "Carta carburante", dipendente_id: id(201), stato: "attiva", note: "" })];
  const carteSaldo = [{ carta_id: id(751), user_id: UID, mestiere_id: REPARTO, nome: "Carta carburante", dipendente_id: id(201), stato: "attiva", saldo: 320.4 }];
  const promemoria = [{ id: 1, user_id: UID, testo: "Chiamare il commercialista per la scadenza dell'acconto e portargli le fatture del mese", data: g(2), inviato: false, created_at: ts(-3), ora: null, note: "", avvisa_giorni: 0, ripeti_mesi: null, stato: "da_fare", eliminato_il: null }];

  /* 13 nov 2026 (gruppo 4) — un computo con un SAL emesso, per il PDF del SAL */
  const computi = [Object.assign(base(951, 40), { mestiere_id: REPARTO, cliente_id: id(102), titolo: "Bagno via Roma", oggetto: "Rifacimento completo del bagno", luogo: "Via Roma 1, Rieti", numero: 1, tipo: "privato", ribasso_perc: 0, stato: "bozza" })];
  const sal = [Object.assign(base(961, 3), { mestiere_id: REPARTO, computo_id: id(951), numero: 2, data: g(-3), stato: "emesso", periodo_dal: g(-30), periodo_al: g(-3), note: "", ritenuta_perc: 5 })];
  const salTotali = [{ sal_id: id(961), user_id: UID, maturato: 8450, oneri_sicurezza: 0, importo_manodopera: 0, maturato_precedente: 5000, oneri_sicurezza_precedenti: 0, manodopera_precedente: 0, numero_precedente: 1, ritenuta_perc: 5 }];
  const salRighe = [
    { sal_id: id(961), user_id: UID, ordine: 1, codice: "A.01", descrizione: "Demolizione del pavimento e del rivestimento esistenti, compreso il trasporto a discarica", unita: "m2", quantita_eseguita: 40, quantita_computo: 40, prezzo_unitario: 100, importo: 4000, oltre_computo: false },
    { sal_id: id(961), user_id: UID, ordine: 2, codice: "B.02", descrizione: "Rifacimento impianto idrico e di scarico", unita: "corpo", quantita_eseguita: 1, quantita_computo: 1, prezzo_unitario: 3000, importo: 3000, oltre_computo: false },
    { sal_id: id(961), user_id: UID, ordine: 3, codice: "C.03", descrizione: "Posa pavimento in gres", unita: "m2", quantita_eseguita: 29, quantita_computo: 30, prezzo_unitario: 50, importo: 1450, oltre_computo: false }
  ];

  /* ---- Noleggio ---- */
  const nolClienti = [Object.assign(base(801), { nome: "Edilizia di prova Costruzioni Generali Srl", telefono: "3330000005", email: "info@esempio.test", documento: "", note: "", indirizzo: "Via Appia 200, Latina", piva: "00000000003", migrato_in: null })];
  const nol = (n, extra) => Object.assign(base(n), { mezzo: mezzi[0].nome, cliente: nolClienti[0].nome, mezzo_id: id(601), cliente_id: id(801), data_uscita: g(-30), data_rientro_prevista: g(-20), data_rientro_effettivo: null, importo: 1050.5, cauzione: 500, stato_pagamento: "da_pagare", danni: "", note: "", ora_uscita: null, ora_rientro: null, contaore_uscita: null, contaore_rientro: null, km_uscita: null, km_rientro: null, consumi: null, dettaglio_prezzo: null, importo_calcolato: null, contratto_num: null, contratto_data: null, operatori: null, dichiarazione_il: null, tipo_nolo: "freddo", stato_consegna: "", stato_rientro: "", contratto_firmato_il: null, luogo: "", check_uscita: null, check_rientro: null, verbale_uscita_il: null, verbale_rientro_il: null, firma_uscita: null, firma_rientro: null, ddt_uscita_num: null, ddt_uscita_data: null, ddt_rientro_num: null, ddt_rientro_data: null, fase: "fuori", uscita_confermata_il: ts(-30), prenotazione_nota: "", cauzione_forma: "", cauzione_rif: "", cauzione_ricevuta_il: g(-30), cauzione_stato: "in_deposito", cauzione_svincolata_il: null, cauzione_restituita: 0, cauzione_trattenuta: 0, cauzione_motivo: "", fattura_id: null, firma_uscita_img: null, firma_rientro_img: null, firma_contr_img: null, firma_contr2_img: null, firma_contr_nome: null, firma_contr_il: null, mestiere_id: null }, extra || {});
  const noleggi = [
    nol(851),                                                              /* fuori, in ritardo di 20 giorni */
    nol(852, { data_uscita: g(-90), data_rientro_prevista: g(-85), data_rientro_effettivo: g(-85), fase: "rientrato", importo: 630, stato_pagamento: "pagato", cauzione_stato: "svincolata", cauzione_svincolata_il: g(-85), cauzione_restituita: 350, cauzione_trattenuta: 150, cauzione_motivo: "Graffio sulla benna", fattura_id: id(871), ddt_uscita_num: "4", ddt_uscita_data: g(-90), ddt_rientro_num: "5", ddt_rientro_data: g(-85) })
  ];
  const nolFatture = [Object.assign(base(871, 80), { cliente_id: id(801), cliente: nolClienti[0].nome, numero: "1", data: g(-80), periodo_dal: g(-90), periodo_al: g(-85), righe: [{ noleggio_id: id(852), voce: "Noleggio " + mezzi[0].nome, dettaglio: "dal " + g(-90) + " al " + g(-85) + " — 6 giorni · DDT 4", descrizione: "Noleggio escavatore", importo: 630 }], imponibile: 630, iva_perc: 22, iva: 138.6, totale: 768.6, stato: "emessa", pagata_il: null, scadenza: null, modo_pagamento: null, iban: null, note: "", sdi_uuid: null, sdi_stato: null, sdi_esito: null, sdi_inviata_il: null, sdi_aggiornata_il: null, sdi_ambiente: null })];
  const negFornitori = [Object.assign(base(901), { nome: "Cementi di prova Spa", telefono: "0746000006", email: "vendite@esempio.test", indirizzo: "Zona industriale, Rieti", piva: "00000000004", note: "" })];
  const negProdotti = [
    Object.assign(base(911), { nome: "Calce idraulica naturale NHL 3,5 in sacco da 25 kg", prezzo: 12.9, quantita: 35, categoria: "leganti", soglia_minima: 10, codice: "CAL-355", note: "", unita: "sacco", prezzo_acquisto: 8.4, iva_perc: 22, fornitore_id: id(901), prezzo_impresa: null }),
    Object.assign(base(912), { nome: "Vernice", prezzo: 25, quantita: 0, categoria: "", soglia_minima: 5, codice: "", note: "", unita: "pz", prezzo_acquisto: 15, iva_perc: 22, fornitore_id: null, prezzo_impresa: null })
  ];
  const negMovimenti = [
    Object.assign(base(921), { tipo: "acquisto", prodotto: negProdotti[0].nome, quantita: 30, importo: 252, controparte: negFornitori[0].nome, data_mov: g(-12), note: "", prodotto_id: id(911), motivo: null, arrivato_il: g(-12) }),
    Object.assign(base(922), { tipo: "vendita", prodotto: negProdotti[0].nome, quantita: 2, importo: 25.8, controparte: "Rossi Mario", data_mov: g(-6), note: "", prodotto_id: id(911), motivo: null, arrivato_il: null })
  ];

  return {
    gest_clienti: clienti, gest_operatori: operatori, gest_lavori: lavori, gest_ore: ore, gest_rapportini: rapportini, gest_spese: spese,
    gest_preventivi: preventivi, gest_preventivo_righe: prevRighe,
    gest_fatture: fatture, gest_fattura_righe: fattRighe, gest_fatture_totali: fattTotali,
    gest_mezzi: mezzi, gest_scadenze: scadenze, gest_mezzi_scadenze: mezziScad,
    gest_fornitori: fornitori, gest_fatture_fornitori: fattForn,
    gest_computi: computi, gest_sal: sal, gest_sal_totali: salTotali, gest_sal_righe_calc: salRighe,
    gest_carte: carte, gest_carte_saldo: carteSaldo, promemoria: promemoria,
    nol_clienti: nolClienti, nol_noleggi: noleggi, nol_fatture: nolFatture,
    neg_fornitori: negFornitori, neg_prodotti: negProdotti, neg_movimenti: negMovimenti
  };
};
