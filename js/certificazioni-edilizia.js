(function (global) {
  'use strict';

  var CERTIFICAZIONI_EDILIZIA = [
    // 🏗️ SOA — Qualificazioni appalti pubblici
    { id: 'soa_og1',  nome: 'SOA OG1 — Edifici civili e industriali',           categoria: '🏗️ SOA — Appalti pubblici' },
    { id: 'soa_og2',  nome: 'SOA OG2 — Restauro beni tutelati',                 categoria: '🏗️ SOA — Appalti pubblici' },
    { id: 'soa_og3',  nome: 'SOA OG3 — Strade, autostrade, ferrovie',           categoria: '🏗️ SOA — Appalti pubblici' },
    { id: 'soa_og6',  nome: 'SOA OG6 — Acquedotti, gasdotti, oleodotti',        categoria: '🏗️ SOA — Appalti pubblici' },
    { id: 'soa_og11', nome: 'SOA OG11 — Impianti tecnologici',                  categoria: '🏗️ SOA — Appalti pubblici' },
    { id: 'soa_os3',  nome: 'SOA OS3 — Impianti idrico-sanitari',               categoria: '🏗️ SOA — Appalti pubblici' },
    { id: 'soa_os28', nome: 'SOA OS28 — Impianti termici e di condizionamento', categoria: '🏗️ SOA — Appalti pubblici' },
    { id: 'soa_os30', nome: 'SOA OS30 — Impianti elettrici',                    categoria: '🏗️ SOA — Appalti pubblici' },

    // 📋 ISO — Sistemi di gestione
    { id: 'iso_9001',  nome: 'ISO 9001 — Qualità',                              categoria: '📋 ISO — Sistemi di gestione' },
    { id: 'iso_14001', nome: 'ISO 14001 — Ambiente',                            categoria: '📋 ISO — Sistemi di gestione' },
    { id: 'iso_45001', nome: 'ISO 45001 — Salute e sicurezza sul lavoro',       categoria: '📋 ISO — Sistemi di gestione' },
    { id: 'iso_37001', nome: 'ISO 37001 — Anticorruzione',                      categoria: '📋 ISO — Sistemi di gestione' },
    { id: 'iso_50001', nome: 'ISO 50001 — Gestione energia',                    categoria: '📋 ISO — Sistemi di gestione' },

    // 🛡️ Sicurezza sul lavoro
    { id: 'durc',                      nome: 'DURC regolare',                                    categoria: '🛡️ Sicurezza sul lavoro' },
    { id: 'rspp_datore',               nome: 'Attestato RSPP datore di lavoro',                  categoria: '🛡️ Sicurezza sul lavoro' },
    { id: 'aspp',                      nome: 'ASPP — Addetto Servizio Prevenzione e Protezione', categoria: '🛡️ Sicurezza sul lavoro' },
    { id: 'rls',                       nome: 'RLS — Rappresentante Lavoratori per la Sicurezza', categoria: '🛡️ Sicurezza sul lavoro' },
    { id: 'csp_cse',                   nome: 'Coordinatore sicurezza CSP/CSE (D.Lgs. 81/08)',    categoria: '🛡️ Sicurezza sul lavoro' },
    { id: 'preposto',                  nome: 'Formazione Preposto',                              categoria: '🛡️ Sicurezza sul lavoro' },
    { id: 'dirigente',                 nome: 'Formazione Dirigente',                             categoria: '🛡️ Sicurezza sul lavoro' },
    { id: 'sicurezza_generale_4h',     nome: 'Formazione generale lavoratori (4 ore)',           categoria: '🛡️ Sicurezza sul lavoro' },
    { id: 'sicurezza_specifica_basso', nome: 'Formazione specifica rischio basso (4 ore)',       categoria: '🛡️ Sicurezza sul lavoro' },
    { id: 'sicurezza_specifica_medio', nome: 'Formazione specifica rischio medio (8 ore)',       categoria: '🛡️ Sicurezza sul lavoro' },
    { id: 'sicurezza_specifica_alto',  nome: 'Formazione specifica rischio alto (12 ore)',       categoria: '🛡️ Sicurezza sul lavoro' },
    { id: 'antincendio_basso',         nome: 'Addetto antincendio rischio basso (4 ore)',        categoria: '🛡️ Sicurezza sul lavoro' },
    { id: 'antincendio_medio',         nome: 'Addetto antincendio rischio medio (8 ore)',        categoria: '🛡️ Sicurezza sul lavoro' },
    { id: 'antincendio_alto',          nome: 'Addetto antincendio rischio alto (16 ore)',        categoria: '🛡️ Sicurezza sul lavoro' },
    { id: 'primo_soccorso',            nome: 'Addetto primo soccorso (BLS-D)',                   categoria: '🛡️ Sicurezza sul lavoro' },
    { id: 'pimus_ponteggi',            nome: 'PiMUS — Piano montaggio ponteggi',                 categoria: '🛡️ Sicurezza sul lavoro' },
    { id: 'lavori_quota',              nome: 'Formazione lavori in quota',                       categoria: '🛡️ Sicurezza sul lavoro' },
    { id: 'spazi_confinati',           nome: 'Formazione spazi confinati',                       categoria: '🛡️ Sicurezza sul lavoro' },
    { id: 'dpi_iii_categoria',         nome: 'Formazione DPI III categoria (anticaduta)',        categoria: '🛡️ Sicurezza sul lavoro' },
    { id: 'patente_cantiere',          nome: 'Patente a crediti cantiere',                       categoria: '🛡️ Sicurezza sul lavoro' },

    // ❄️ Gas / Climatizzazione / F-Gas
    { id: 'fgas',         nome: 'Patentino F-Gas (Reg. CE 517/2014)',                    categoria: '❄️ Gas e climatizzazione' },
    { id: 'dm37_lett_c',  nome: 'Abilitazione DM 37/08 lett. C — Riscaldamento e climatizzazione', categoria: '❄️ Gas e climatizzazione' },
    { id: 'dm37_lett_d',  nome: 'Abilitazione DM 37/08 lett. D — Impianti idrico-sanitari', categoria: '❄️ Gas e climatizzazione' },
    { id: 'dm37_lett_e',  nome: 'Abilitazione DM 37/08 lett. E — Impianti gas',          categoria: '❄️ Gas e climatizzazione' },
    { id: 'cig',          nome: 'CIG — Comitato Italiano Gas',                           categoria: '❄️ Gas e climatizzazione' },

    // ⚡ Impianti elettrici
    { id: 'dm37_lett_a',     nome: 'Abilitazione DM 37/08 lett. A — Impianti elettrici',   categoria: '⚡ Impianti elettrici' },
    { id: 'dm37_lett_b',     nome: 'Abilitazione DM 37/08 lett. B — Impianti elettronici', categoria: '⚡ Impianti elettrici' },
    { id: 'pes_pav_pei',     nome: 'PES/PAV/PEI (CEI 11-27)',                              categoria: '⚡ Impianti elettrici' },
    { id: 'lavori_tensione', nome: 'Abilitazione lavori sotto tensione',                   categoria: '⚡ Impianti elettrici' },

    // 🌿 Energia / Ambiente
    { id: 'certif_energetico', nome: 'Certificatore energetico edifici',          categoria: '🌿 Energia e ambiente' },
    { id: 'installatore_fer',  nome: 'Installatore FER (D.Lgs. 28/2011)',         categoria: '🌿 Energia e ambiente' },
    { id: 'esco_11352',        nome: 'ESCO certificata UNI CEI 11352',            categoria: '🌿 Energia e ambiente' },
    { id: 'co_acustico',       nome: 'Tecnico Competente in Acustica Ambientale', categoria: '🌿 Energia e ambiente' },

    // 🔨 Patentini operativi (macchine cantiere)
    { id: 'patentino_gru_torre',  nome: 'Patentino gru a torre',                 categoria: '🔨 Patentini operativi' },
    { id: 'patentino_ple',        nome: 'Patentino piattaforme aeree (PLE)',     categoria: '🔨 Patentini operativi' },
    { id: 'patentino_carrello',   nome: 'Patentino carrello elevatore',          categoria: '🔨 Patentini operativi' },
    { id: 'patentino_escavatori', nome: 'Patentino escavatori e pale',           categoria: '🔨 Patentini operativi' },
    { id: 'saldatore_uni_9606',   nome: 'Patentino saldatore UNI EN ISO 9606',   categoria: '🔨 Patentini operativi' },
    { id: 'caldaie_vapore',       nome: 'Patentino conduzione caldaie a vapore', categoria: '🔨 Patentini operativi' },
    { id: 'trattore_agricolo',    nome: 'Patentino trattore agricolo/forestale', categoria: '🔨 Patentini operativi' },

    // 🔧 Impianti DM 37/08
    { id: 'dm37_lett_f', nome: 'Abilitazione DM 37/08 lett. F — Impianti antincendio',  categoria: '🔧 Impianti DM 37/08' },
    { id: 'dm37_lett_g', nome: 'Abilitazione DM 37/08 lett. G — Impianti sollevamento', categoria: '🔧 Impianti DM 37/08' },

    // 🌳 Lavori speciali
    { id: 'bonifica_amianto_operativo',    nome: 'Operatore bonifica amianto',                  categoria: '🌳 Lavori speciali' },
    { id: 'bonifica_amianto_responsabile', nome: 'Responsabile cantieri bonifica amianto',      categoria: '🌳 Lavori speciali' },
    { id: 'bonifica_radon',                nome: 'Tecnico bonifica radon',                      categoria: '🌳 Lavori speciali' },
    { id: 'tree_climbing_potatura',        nome: 'Operatore tree climbing (potatura in quota)', categoria: '🌳 Lavori speciali' },
    { id: 'operatore_motosega',            nome: 'Operatore motosega',                          categoria: '🌳 Lavori speciali' },

    // 🏛️ Albi professionali
    { id: 'albo_architetti',         nome: 'Iscrizione Albo Architetti',           categoria: '🏛️ Albi professionali' },
    { id: 'albo_ingegneri',          nome: 'Iscrizione Albo Ingegneri',            categoria: '🏛️ Albi professionali' },
    { id: 'albo_geometri',           nome: 'Iscrizione Albo Geometri',             categoria: '🏛️ Albi professionali' },
    { id: 'albo_periti_industriali', nome: 'Iscrizione Albo Periti Industriali',   categoria: '🏛️ Albi professionali' },
    { id: 'albo_periti_agrari',      nome: 'Iscrizione Albo Periti Agrari',        categoria: '🏛️ Albi professionali' },
    { id: 'albo_agronomi_forestali', nome: 'Iscrizione Albo Agronomi e Forestali', categoria: '🏛️ Albi professionali' },

    // 📎 Altri
    { id: 'tecnico_antincendio_l818', nome: 'Tecnico Antincendio (L. 818/1984)', categoria: '📎 Altri' }
  ];

  global.CERTIFICAZIONI_EDILIZIA = CERTIFICAZIONI_EDILIZIA;
})(window);
