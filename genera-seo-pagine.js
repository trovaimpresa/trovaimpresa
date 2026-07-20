/* ============================================================
   Generatore pagine SEO per professioni e tipi di negozio
   TrovaImpresa — esegui con:  node genera-seo-pagine.js
   Crea una pagina .html per ogni voce + aggiorna sitemap.xml
   Rilancialo quando aggiungi voci: sovrascrive senza problemi.
   ============================================================ */
const fs = require('fs');
const path = require('path');

const OUT = __dirname;
const BASE = 'https://trovaimpresa.com';
const TODAY = new Date().toISOString().slice(0, 10);

// --- Dati: professioni ---
const professionisti = [
  { slug:'architetto', tipo:'architetto', nome:'Architetto',
    h1:'Trova un architetto vicino a te',
    desc:"Cerchi un architetto? Su TrovaImpresa trovi architetti verificati vicino a te per progetti, ristrutturazioni e pratiche edilizie. Contatto diretto e preventivo gratuito.",
    intro:"L'architetto progetta e segue ristrutturazioni e nuove costruzioni, cura il design degli spazi e gestisce permessi e pratiche edilizie. È la figura giusta quando vuoi trasformare un'idea in un progetto realizzabile.",
    bullets:["Progetto di ristrutturazione o nuova costruzione","Permessi edilizi, SCIA e CILA","Ridistribuzione degli spazi e interior design"] },
  { slug:'ingegnere-civile', tipo:'ingegnere_civile', nome:'Ingegnere civile',
    h1:'Trova un ingegnere civile vicino a te',
    desc:"Cerchi un ingegnere civile? Su TrovaImpresa trovi ingegneri civili verificati vicino a te per calcoli, opere edili e direzione lavori. Contatto diretto e preventivo gratuito.",
    intro:"L'ingegnere civile si occupa di calcoli, opere edili e infrastrutture, garantendo che ogni intervento sia sicuro e a norma. È fondamentale nelle nuove costruzioni e negli interventi importanti.",
    bullets:["Nuova costruzione o ampliamento","Verifiche e calcoli strutturali","Direzione e controllo dei lavori"] },
  { slug:'ingegnere-strutturale', tipo:'ingegnere_strutturale', nome:'Ingegnere strutturale',
    h1:'Trova un ingegnere strutturale vicino a te',
    desc:"Cerchi un ingegnere strutturale? Su TrovaImpresa trovi tecnici verificati per calcolo strutturale, antisismica e consolidamenti. Contatto diretto e preventivo gratuito.",
    intro:"L'ingegnere strutturale progetta e verifica le strutture portanti, si occupa di antisismica e consolidamenti. È indispensabile quando si interviene su travi, pilastri o fondazioni.",
    bullets:["Calcolo e verifica delle strutture","Adeguamento e miglioramento antisismico","Consolidamento di solai e fondazioni"] },
  { slug:'ingegnere-impiantistico', tipo:'ingegnere_impiantistico', nome:'Ingegnere impiantistico',
    h1:'Trova un ingegnere impiantistico vicino a te',
    desc:"Cerchi un ingegnere impiantistico? Su TrovaImpresa trovi tecnici verificati per progettazione di impianti elettrici, termici e idraulici. Contatto diretto e preventivo gratuito.",
    intro:"L'ingegnere impiantistico progetta impianti elettrici, termici e idraulici efficienti e a norma. È la figura giusta per la parte impiantistica di una nuova costruzione o ristrutturazione.",
    bullets:["Progetto impianti elettrici e termici","Efficienza energetica degli impianti","Pratiche e conformità a norma"] },
  { slug:'geometra', tipo:'geometra', nome:'Geometra',
    h1:'Trova un geometra vicino a te',
    desc:"Cerchi un geometra? Su TrovaImpresa trovi geometri verificati vicino a te per pratiche catastali, accatastamenti, rilievi e ristrutturazioni. Contatto diretto e preventivo gratuito.",
    intro:"Il geometra segue pratiche catastali, accatastamenti, rilievi, computi metrici e piccole ristrutturazioni. È spesso il primo professionista da contattare per una pratica edilizia.",
    bullets:["Accatastamenti e visure catastali","Rilievi e computi metrici","Pratiche edilizie e piccole ristrutturazioni"] },
  { slug:'perito-industriale', tipo:'perito_industriale', nome:'Perito industriale',
    h1:'Trova un perito industriale vicino a te',
    desc:"Cerchi un perito industriale? Su TrovaImpresa trovi periti verificati vicino a te per impianti, sicurezza e pratiche tecniche. Contatto diretto e preventivo gratuito.",
    intro:"Il perito industriale si occupa di impianti, pratiche tecniche e sicurezza, soprattutto in ambito impiantistico ed energetico. È un tecnico versatile per molti adempimenti.",
    bullets:["Progetto e verifica impianti","Pratiche tecniche e collaudi","Consulenza su sicurezza ed energia"] },
  { slug:'topografo', tipo:'topografo', nome:'Topografo',
    h1:'Trova un topografo vicino a te',
    desc:"Cerchi un topografo? Su TrovaImpresa trovi topografi verificati vicino a te per rilievi, frazionamenti e confini. Contatto diretto e preventivo gratuito.",
    intro:"Il topografo esegue rilievi del terreno, frazionamenti e definizione dei confini. È essenziale quando si deve misurare, dividere o accatastare un'area.",
    bullets:["Rilievi topografici del terreno","Frazionamenti e tipi di frazionamento","Definizione e verifica dei confini"] },
  { slug:'consulente-energetico', tipo:'consulente_energetico', nome:'Consulente energetico',
    h1:'Trova un consulente energetico vicino a te',
    desc:"Cerchi un consulente energetico? Su TrovaImpresa trovi tecnici verificati per APE, diagnosi energetiche e bonus. Contatto diretto e preventivo gratuito.",
    intro:"Il consulente energetico redige l'APE, esegue diagnosi energetiche e ti guida tra cappotto termico e detrazioni fiscali. Ti aiuta a ridurre i consumi e accedere ai bonus.",
    bullets:["Attestato di Prestazione Energetica (APE)","Diagnosi energetica dell'edificio","Consulenza su cappotto e bonus fiscali"] },
  { slug:'consulente-sicurezza', tipo:'consulente_sicurezza', nome:'Consulente sicurezza',
    h1:'Trova un consulente per la sicurezza vicino a te',
    desc:"Cerchi un coordinatore per la sicurezza? Su TrovaImpresa trovi tecnici verificati per cantieri, POS e PSC. Contatto diretto e preventivo gratuito.",
    intro:"Il consulente per la sicurezza coordina la sicurezza in cantiere e predispone i piani previsti dal D.Lgs 81. È obbligatorio nei cantieri con più imprese.",
    bullets:["Coordinatore sicurezza in fase di progetto ed esecuzione","Redazione di POS e PSC","Adempimenti D.Lgs 81 in cantiere"] },
  { slug:'direttore-lavori', tipo:'direttore_lavori', nome:'Direttore dei lavori',
    h1:'Trova un direttore dei lavori vicino a te',
    desc:"Cerchi un direttore dei lavori? Su TrovaImpresa trovi tecnici verificati per la direzione e il controllo del cantiere. Contatto diretto e preventivo gratuito.",
    intro:"Il direttore dei lavori controlla che il cantiere proceda secondo il progetto, i tempi e le regole. È la tua garanzia che i lavori siano eseguiti a regola d'arte.",
    bullets:["Direzione e supervisione del cantiere","Controllo di qualità, tempi e costi","Rapporti con l'impresa esecutrice"] },
  { slug:'collaudatore-strutture', tipo:'collaudatore_strutture', nome:'Collaudatore di strutture',
    h1:'Trova un collaudatore di strutture vicino a te',
    desc:"Cerchi un collaudatore statico? Su TrovaImpresa trovi tecnici verificati per il collaudo delle strutture. Contatto diretto e preventivo gratuito.",
    intro:"Il collaudatore verifica la sicurezza e la conformità delle strutture realizzate. Il collaudo statico è obbligatorio per legge nelle opere in cemento armato e acciaio.",
    bullets:["Collaudo statico delle strutture","Verifica di conformità al progetto","Certificazione finale dell'opera"] },
  { slug:'project-manager', tipo:'project_manager', nome:'Project manager',
    h1:'Trova un project manager edile vicino a te',
    desc:"Cerchi un project manager per l'edilizia? Su TrovaImpresa trovi professionisti verificati per gestire tempi, costi e fornitori. Contatto diretto e preventivo gratuito.",
    intro:"Il project manager coordina l'intero progetto edilizio: tempi, costi, fornitori e imprese. È utile negli interventi complessi dove serve una regia unica.",
    bullets:["Pianificazione e gestione del progetto","Controllo di budget e scadenze","Coordinamento di imprese e fornitori"] },
  { slug:'amministratore-condominio', tipo:'amministratore_condominio', nome:'Amministratore di condominio',
    h1:'Trova un amministratore di condominio vicino a te',
    desc:"Cerchi un amministratore di condominio? Su TrovaImpresa trovi professionisti verificati per la gestione del condominio e dei lavori sulle parti comuni. Contatto diretto e preventivo gratuito.",
    intro:"L'amministratore di condominio gestisce le parti comuni, i bilanci e i lavori straordinari. È il punto di riferimento per interventi e manutenzioni condominiali.",
    bullets:["Gestione ordinaria e straordinaria","Lavori e manutenzioni sulle parti comuni","Bilanci, assemblee e adempimenti"] }
];

// --- Dati: tipi di negozio ---
const negozi = [
  { slug:'negozio-materiali-edili', tipo:'materiali_edili', nome:'Negozio di materiali edili',
    h1:'Trova un negozio di materiali edili vicino a te',
    desc:"Cerchi materiali edili? Su TrovaImpresa trovi negozi e rivenditori verificati vicino a te per cemento, laterizi e tutto per il cantiere. Contatto diretto, senza intermediari.",
    intro:"Il negozio di materiali edili rifornisce cantieri e privati di cemento, laterizi, inerti e tutto il necessario per costruire e ristrutturare. Il punto di partenza per ogni lavoro.",
    bullets:["Cemento, malte, laterizi e inerti","Materiali per costruzione e ristrutturazione","Consegna e ritiro in zona"] },
  { slug:'ferramenta', tipo:'ferramenta', nome:'Ferramenta',
    h1:'Trova una ferramenta vicino a te',
    desc:"Cerchi una ferramenta? Su TrovaImpresa trovi ferramenta e negozi di utensili verificati vicino a te. Contatto diretto, senza intermediari.",
    intro:"La ferramenta offre utensili, viteria, minuteria e attrezzatura per il fai-da-te e i professionisti. Indispensabile per grandi e piccoli lavori.",
    bullets:["Utensili manuali ed elettrici","Viteria, bulloneria e minuteria","Serrature, maniglie e accessori"] },
  { slug:'negozio-termoidraulica', tipo:'termoidraulica', nome:'Negozio di termoidraulica',
    h1:'Trova un negozio di termoidraulica vicino a te',
    desc:"Cerchi materiale idraulico e per il riscaldamento? Su TrovaImpresa trovi negozi di termoidraulica verificati vicino a te. Contatto diretto, senza intermediari.",
    intro:"Il negozio di termoidraulica fornisce tubazioni, raccorderia e materiale per riscaldamento e impianti idraulici. Per idraulici e per chi rinnova il proprio impianto.",
    bullets:["Tubazioni e raccorderia","Materiale per riscaldamento e sanitari","Valvole, pompe e accessori"] },
  { slug:'negozio-materiale-elettrico', tipo:'elettrico', nome:'Negozio di materiale elettrico',
    h1:'Trova un negozio di materiale elettrico vicino a te',
    desc:"Cerchi materiale elettrico? Su TrovaImpresa trovi negozi e rivenditori verificati vicino a te per cavi, quadri e componenti. Contatto diretto, senza intermediari.",
    intro:"Il negozio di materiale elettrico rifornisce elettricisti e privati di cavi, quadri, prese e componentistica. Per impianti nuovi e riparazioni.",
    bullets:["Cavi, quadri e interruttori","Prese, frutti e canaline","Illuminazione e domotica"] },
  { slug:'negozio-ceramiche-bagno', tipo:'ceramiche', nome:'Negozio di ceramiche e bagno',
    h1:'Trova un negozio di ceramiche e bagno vicino a te',
    desc:"Cerchi piastrelle e sanitari? Su TrovaImpresa trovi showroom di ceramiche e bagno verificati vicino a te. Contatto diretto, senza intermediari.",
    intro:"Il negozio di ceramiche e bagno espone piastrelle, gres, sanitari e rivestimenti. Ideale per scegliere con calma i materiali del tuo bagno o della tua casa.",
    bullets:["Piastrelle, gres e mosaici","Sanitari e rubinetteria","Rivestimenti per bagno e cucina"] },
  { slug:'negozio-pavimenti-rivestimenti', tipo:'pavimenti', nome:'Negozio di pavimenti e rivestimenti',
    h1:'Trova un negozio di pavimenti e rivestimenti vicino a te',
    desc:"Cerchi pavimenti e rivestimenti? Su TrovaImpresa trovi negozi e showroom verificati vicino a te per parquet, laminato e resine. Contatto diretto, senza intermediari.",
    intro:"Il negozio di pavimenti e rivestimenti propone parquet, laminato, gres, resine e rivestimenti per ogni ambiente. Per rinnovare superfici con lo stile giusto.",
    bullets:["Parquet, laminato e LVT","Gres e resine per pavimenti","Rivestimenti per pareti"] },
  { slug:'colorificio', tipo:'colorificio', nome:'Colorificio',
    h1:'Trova un colorificio vicino a te',
    desc:"Cerchi un colorificio o un negozio di pittura e vernici? Su TrovaImpresa trovi colorifici verificati vicino a te. Contatto diretto, senza intermediari.",
    intro:"Il colorificio (negozio di pittura e vernici) offre pitture, smalti, vernici, cartongesso e prodotti per la decorazione. Per imbianchini, decoratori e fai-da-te.",
    bullets:["Pitture, smalti e vernici","Prodotti per cartongesso e stucchi","Attrezzi per pittura e decorazione"] },
  { slug:'negozio-legname', tipo:'legname', nome:'Rivenditore di legname',
    h1:'Trova un rivenditore di legname vicino a te',
    desc:"Cerchi legname da costruzione? Su TrovaImpresa trovi rivenditori di legname verificati vicino a te per travi, tavole e pannelli. Contatto diretto, senza intermediari.",
    intro:"Il rivenditore di legname fornisce travi, tavole, pannelli e legno per costruzioni e falegnameria. Per cantieri, tetti e lavori in legno.",
    bullets:["Travi e legname da costruzione","Tavole e pannelli","Legno per tetti e falegnameria"] },
  { slug:'negozio-infissi-serramenti', tipo:'infissi_serramenti', nome:'Negozio di infissi e serramenti',
    h1:'Trova un negozio di infissi e serramenti vicino a te',
    desc:"Cerchi infissi e serramenti? Su TrovaImpresa trovi rivenditori verificati vicino a te per finestre, porte e persiane. Contatto diretto, senza intermediari.",
    intro:"Il negozio di infissi e serramenti propone finestre, porte, persiane e zanzariere, con consulenza su isolamento e detrazioni. Per sostituire o installare nuovi serramenti.",
    bullets:["Finestre e porte-finestra","Porte interne e blindate","Persiane, tapparelle e zanzariere"] },
  { slug:'negozio-attrezzature-edili', tipo:'attrezzature_edili', nome:'Negozio di attrezzature edili',
    h1:'Trova un negozio di attrezzature edili vicino a te',
    desc:"Cerchi attrezzature edili? Su TrovaImpresa trovi negozi verificati vicino a te per utensili professionali e macchine da cantiere. Contatto diretto, senza intermediari.",
    intro:"Il negozio di attrezzature edili vende utensili professionali, betoniere e macchine da cantiere. Per imprese e artigiani che lavorano ogni giorno.",
    bullets:["Utensili elettrici professionali","Betoniere e macchine da cantiere","Ricambi e accessori"] },
  { slug:'noleggio-attrezzature-edili', tipo:'noleggio_attrezzature', nome:'Noleggio attrezzature edili',
    h1:'Trova un noleggio di attrezzature edili vicino a te',
    desc:"Cerchi il noleggio di attrezzature edili? Su TrovaImpresa trovi punti noleggio verificati vicino a te per ponteggi, piattaforme e macchinari. Contatto diretto, senza intermediari.",
    intro:"Il noleggio di attrezzature edili mette a disposizione ponteggi, piattaforme aeree e macchinari senza doverli acquistare. Conveniente per lavori occasionali.",
    bullets:["Ponteggi e trabattelli","Piattaforme aeree e sollevatori","Macchine e utensili a noleggio"] },
  { slug:'negozio-isolanti-impermeabilizzanti', tipo:'isolanti_impermeabilizzanti', nome:'Negozio di isolanti e impermeabilizzanti',
    h1:'Trova un negozio di isolanti e impermeabilizzanti vicino a te',
    desc:"Cerchi isolanti e impermeabilizzanti? Su TrovaImpresa trovi rivenditori verificati vicino a te per cappotto e guaine. Contatto diretto, senza intermediari.",
    intro:"Il negozio di isolanti e impermeabilizzanti fornisce cappotto termico, guaine e prodotti per l'isolamento. Per migliorare comfort ed efficienza energetica.",
    bullets:["Materiali per cappotto termico","Guaine e impermeabilizzanti per tetti","Isolanti acustici e termici"] },
  { slug:'negozio-arredo-bagno', tipo:'arredo_bagno', nome:'Negozio di arredo bagno',
    h1:'Trova un negozio di arredo bagno vicino a te',
    desc:"Cerchi arredo bagno? Su TrovaImpresa trovi showroom verificati vicino a te per sanitari, mobili e docce. Contatto diretto, senza intermediari.",
    intro:"Il negozio di arredo bagno propone sanitari, mobili, box doccia e accessori per progettare il bagno completo. Per ristrutturare o rinnovare con stile.",
    bullets:["Sanitari e mobili bagno","Box doccia e vasche","Rubinetteria e accessori"] },
  { slug:'negozio-climatizzazione-caldaie', tipo:'climatizzazione_caldaie', nome:'Negozio di climatizzazione e caldaie',
    h1:'Trova un negozio di climatizzazione e caldaie vicino a te',
    desc:"Cerchi caldaie e condizionatori? Su TrovaImpresa trovi rivenditori verificati vicino a te per climatizzazione e riscaldamento. Contatto diretto, senza intermediari.",
    intro:"Il negozio di climatizzazione e caldaie offre caldaie, condizionatori e pompe di calore, con consulenza su efficienza e incentivi. Per riscaldare e raffrescare casa.",
    bullets:["Caldaie a condensazione","Condizionatori e climatizzatori","Pompe di calore e ibridi"] },
  { slug:'negozio-stufe-camini', tipo:'stufe_camini', nome:'Negozio di stufe e camini',
    h1:'Trova un negozio di stufe e camini vicino a te',
    desc:"Cerchi stufe e camini? Su TrovaImpresa trovi negozi verificati vicino a te per stufe a pellet, camini e termostufe. Contatto diretto, senza intermediari.",
    intro:"Il negozio di stufe e camini propone stufe a pellet e legna, camini e termostufe, con installazione a norma. Per un riscaldamento efficiente e piacevole.",
    bullets:["Stufe a pellet e a legna","Camini e termocamini","Termostufe e canne fumarie"] },
  { slug:'agenzia-immobiliare', tipo:'agenzia_immobiliare', nome:'Agenzia immobiliare',
    h1:'Trova un\'agenzia immobiliare vicino a te',
    desc:"Cerchi un'agenzia immobiliare? Su TrovaImpresa trovi agenzie verificate vicino a te per comprare, vendere o affittare casa. Contatto diretto, senza intermediari.",
    intro:"L'agenzia immobiliare segue compravendite e affitti, con valutazioni e consulenza sul mercato locale. Il riferimento per vendere o trovare casa nella tua zona.",
    bullets:["Compravendita di immobili","Affitti e locazioni","Valutazioni e consulenza"] }
];

// --- Template head (analytics + css, come il resto del sito) ---
const HEAD_SCRIPTS = `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});try{if(localStorage.getItem('cookie_consent')==='all'){gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'});}}catch(e){}</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-GQ0HDYPCXE"></script>
<script>gtag('js',new Date());gtag('config','G-GQ0HDYPCXE',{anonymize_ip:true});</script>`;

const HEADER = `<header>
  <a href="index.html"><img src="/trovaimpresa_logo_transparent.png" alt="TrovaImpresa"></a>
  <nav>
    <a href="cerca-artigiani.html">Artigiani</a>
    <a href="cerca-imprese.html">Imprese</a>
    <a href="cerca-negozi.html">Negozi</a>
    <a href="cerca-professionisti.html">Professionisti</a>
    <a href="/login-impresa.html" class="ti-accedi">Accedi</a>
    <a href="/#registrati" class="ti-iscriviti">Iscrivi la tua attivit&agrave;</a>
  </nav>
</header>`;

const FOOTER = `<footer style="background:#0a2a4d;color:white;font-size:0.9rem;padding:18px;text-align:center">
  &copy; 2026 TrovaImpresa &ndash; Alessio Pinto &ndash; Rieti (RI) &ndash;
  <a href="mailto:info@trovaimpresa.com" style="color:#a9c9f5">info@trovaimpresa.com</a> |
  <a href="/termini-condizioni.html" style="color:#a9c9f5">Termini</a> |
  <a href="/cookie-policy.html" style="color:#a9c9f5">Cookie Policy</a> |
  <a href="/privacy-policy.html" style="color:#a9c9f5">Privacy</a> |
  <a href="/contatti.html" style="color:#a9c9f5">Contatti</a>
</footer>
<script src="/cookie-banner.js"></script>`;

const CONTENT_CSS = `<style>
  .seo-wrap{max-width:860px;margin:0 auto;padding:32px 20px 8px;color:#2b3a4d;}
  .seo-bc{font-size:13px;color:#7a879a;margin-bottom:14px;}
  .seo-bc a{color:#0052cc;text-decoration:none;}
  .seo-wrap h1{font-size:30px;line-height:1.2;color:#0a2a4d;margin:0 0 10px;}
  .seo-sub{font-size:17px;color:#3c4a5c;font-weight:600;margin:0 0 18px;}
  .seo-wrap p{font-size:16px;line-height:1.7;margin:0 0 18px;}
  .seo-box{background:#fffdf2;border:2px solid #ffd60a;border-radius:14px;padding:18px 20px;margin:8px 0 26px;}
  .seo-box label{display:block;font-weight:800;color:#7a5c00;margin-bottom:10px;font-size:15px;}
  .seo-row{display:flex;gap:10px;flex-wrap:wrap;}
  .seo-row input{flex:1;min-width:180px;border:2px solid #ffe680;border-radius:11px;padding:0 14px;height:50px;font-size:16px;font-family:inherit;outline:none;}
  .seo-row input:focus{border-color:#ffd60a;}
  .seo-row button{background:#0052cc;color:#fff;border:none;border-radius:11px;padding:0 26px;height:50px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;}
  .seo-cta{display:inline-block;background:#FF6B35;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:13px 26px;border-radius:10px;margin:2px 0 28px;}
  .seo-wrap h2{font-size:21px;color:#0a2a4d;margin:26px 0 12px;}
  .seo-list{list-style:none;padding:0;margin:0 0 26px;}
  .seo-list li{position:relative;padding:8px 0 8px 30px;font-size:16px;border-bottom:1px solid #eef1f6;}
  .seo-list li:before{content:'\\2713';position:absolute;left:0;top:8px;color:#15803d;font-weight:800;}
  .seo-rel{background:#f4f6f9;border-radius:14px;padding:20px;margin:10px 0 8px;}
  .seo-rel b{display:block;color:#0a2a4d;margin-bottom:10px;font-size:15px;}
  .seo-rel a{display:inline-block;background:#fff;border:1px solid #e3e8ef;border-radius:8px;padding:7px 12px;margin:4px 6px 4px 0;color:#0052cc;text-decoration:none;font-size:14px;font-weight:600;}
  .seo-rel a:hover{border-color:#0052cc;}
</style>`;

function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function buildPage(item, cat, siblings){
  const catPage = cat === 'professionisti' ? 'cerca-professionisti.html' : 'cerca-negozi.html';
  const catLabel = cat === 'professionisti' ? 'Professionisti' : 'Negozi';
  const title = `${item.nome} vicino a te in tutta Italia | TrovaImpresa`;
  const url = `${BASE}/${item.slug}.html`;
  const bullets = item.bullets.map(b => `      <li>${b}</li>`).join('\n');
  const rel = siblings.filter(s => s.slug !== item.slug)
    .map(s => `<a href="${s.slug}.html">${s.nome}</a>`).join('');
  const schemaType = cat === 'professionisti' ? 'ProfessionalService' : 'Store';
  const schema = {
    "@context":"https://schema.org",
    "@type":schemaType,
    "name":`${item.nome} su TrovaImpresa`,
    "description":item.desc,
    "areaServed":{"@type":"Country","name":"Italia"},
    "url":url
  };
  const breadcrumb = {
    "@context":"https://schema.org","@type":"BreadcrumbList",
    "itemListElement":[
      {"@type":"ListItem","position":1,"name":"Home","item":`${BASE}/`},
      {"@type":"ListItem","position":2,"name":catLabel,"item":`${BASE}/${catPage}`},
      {"@type":"ListItem","position":3,"name":item.nome,"item":url}
    ]
  };
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="canonical" href="${url}">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(item.desc)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="TrovaImpresa">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(item.desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${BASE}/logo.png">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
  ${HEAD_SCRIPTS}
  <link rel="stylesheet" href="/css/barra-comune.css">
  ${CONTENT_CSS}
</head>
<body>
${HEADER}
<main class="seo-wrap">
  <div class="seo-bc"><a href="index.html">Home</a> &rsaquo; <a href="${catPage}">${catLabel}</a> &rsaquo; ${item.nome}</div>
  <h1>${item.h1}</h1>
  <p class="seo-sub">Confronta profili verificati, contatto diretto e preventivo gratuito &mdash; in tutta Italia.</p>
  <p>${item.intro}</p>

  <div class="seo-box">
    <label>In quale citt&agrave; cerchi?</label>
    <div class="seo-row">
      <input id="cittaSeo" type="text" placeholder="Scrivi la tua citt&agrave;... es. Roma" onkeydown="if(event.key==='Enter')vaiSeo()">
      <button type="button" onclick="vaiSeo()">Cerca</button>
    </div>
  </div>

  <a class="seo-cta" href="${catPage}?tipo=${item.tipo}">Vedi tutti i risultati &rarr;</a>

  <h2>${cat === 'professionisti' ? 'Quando rivolgersi a questo professionista' : 'Cosa trovi in questo negozio'}</h2>
  <ul class="seo-list">
${bullets}
  </ul>

  <div class="seo-rel">
    <b>Altre categorie di ${catLabel.toLowerCase()}</b>
    ${rel}
  </div>
</main>
${FOOTER}
<script>
  function vaiSeo(){
    var v=(document.getElementById('cittaSeo').value||'').trim();
    location.href='${catPage}?tipo=${item.tipo}'+(v?'&citta='+encodeURIComponent(v):'');
  }
</script>
</body>
</html>`;
}

// --- Genera pagine ---
let generated = [];
professionisti.forEach(it => {
  fs.writeFileSync(path.join(OUT, it.slug + '.html'), buildPage(it, 'professionisti', professionisti), 'utf8');
  generated.push(it.slug + '.html');
});
negozi.forEach(it => {
  fs.writeFileSync(path.join(OUT, it.slug + '.html'), buildPage(it, 'negozi', negozi), 'utf8');
  generated.push(it.slug + '.html');
});

// --- Sitemap SEPARATA (non tocca la sitemap.xml esistente) ---
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${generated.map(u => `  <url><loc>${BASE}/${u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(OUT, 'sitemap-seo.xml'), sitemap, 'utf8');

console.log('OK: generate ' + generated.length + ' pagine SEO + sitemap-seo.xml (' + generated.length + ' url)');
