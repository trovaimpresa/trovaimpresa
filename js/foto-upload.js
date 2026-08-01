/* ============================================================
   TrovaImpresa — preparazione dei file prima dell'upload
   Usata da: gestionale (bucket gestionale-foto), loghi-imprese,
   foto-lavori, cantieri-foto, registrazione-*.html

   Perche' esiste: fino a luglio 2026 le foto andavano su a piena
   risoluzione. Una foto da telefono occupa 3-5 MB, e il piano free di
   Supabase da' 1 GB in tutto: bastavano 200 foto per riempirlo.
   La compressione c'era gia' (compress(), lato lungo 1200) ma la usava
   solo il vecchio flusso locale, non i due percorsi che caricano davvero.
   Ad agosto 2026 e' stata agganciata anche a loghi/foto-lavori/cantieri,
   che fino ad allora caricavano il file grezzo (i loghi arrivavano
   a 800-900 KB l'uno).

   Regole (una sola implementazione per tutti i punti di upload):
   - oltre 15 MB si rifiuta, con un messaggio leggibile
   - se NON e' un'immagine (il PDF della fattura) passa intatto
   - default: le immagini scendono a 1600px sul lato lungo, JPEG 0.75
     (1600 e non 1200: in cantiere serve leggere i dettagli)
   - per i loghi si passano opzioni diverse (400px, WebP): il JPEG
     perderebbe la trasparenza dei loghi con sfondo trasparente
   - se la compressione fallisce si carica l'originale, non si
     fa fallire l'upload

   Uso base (foto, 1600px JPEG — invariato):
     const p = await preparaFileUpload(file);
     if(p.errore){ toast(p.errore); return; }
     // p.file = Blob (o il File originale), p.nome = nome da usare nel path

   Uso con opzioni (es. loghi, 400px WebP):
     const p = await preparaFileUpload(file, { lato: 400, qualita: 0.82, formato: 'webp' });
   ============================================================ */
(function(){
  var LATO_DEFAULT    = 1600;             /* px sul lato lungo */
  var QUALITA_DEFAULT = 0.75;             /* qualita' di default */
  var MAX_BYTE        = 15 * 1024 * 1024; /* 15 MB sul file ORIGINALE */

  function eImmagine(file){
    return !!(file && file.type && file.type.indexOf("image/") === 0);
  }

  /* Il nome cambia estensione: dopo il canvas il contenuto e' in un altro
     formato anche se l'originale era .png o .heic. Lasciare la vecchia
     estensione produrrebbe file che il browser poi rifiuta di mostrare. */
  function nomeConEstensione(nome, ext){
    return String(nome || "foto").replace(/\.[^.]+$/, "") + "." + ext;
  }

  function comprimiImmagine(file, lato, qualita, mime){
    return new Promise(function(risolvi, rifiuta){
      var rd = new FileReader(), img = new Image();
      rd.onerror = rifiuta;
      rd.onload = function(){
        img.onerror = rifiuta;   /* HEIC su browser che non lo sa leggere finisce qui */
        img.onload = function(){
          try{
            var w = img.width, h = img.height;
            if(!w || !h) return rifiuta(new Error("immagine senza dimensioni"));
            if(w > h){ if(w > lato){ h = Math.round(h * lato / w); w = lato; } }
            else     { if(h > lato){ w = Math.round(w * lato / h); h = lato; } }
            var cv = document.createElement("canvas");
            cv.width = w; cv.height = h;
            cv.getContext("2d").drawImage(img, 0, 0, w, h);
            cv.toBlob(function(blob){
              if(!blob) return rifiuta(new Error("toBlob vuoto"));
              risolvi(blob);
            }, mime, qualita);
          }catch(e){ rifiuta(e); }
        };
        img.src = rd.result;
      };
      rd.readAsDataURL(file);
    });
  }

  /* Ritorna {errore} oppure {file, nome, compressa, byteOrig, byteFin}.
     opts (tutti facoltativi): { lato, qualita, formato: 'jpeg'|'webp' } */
  async function preparaFileUpload(file, opts){
    if(!file) return { errore: "Nessun file da caricare" };

    var lato    = (opts && opts.lato)    || LATO_DEFAULT;
    var qualita = (opts && opts.qualita) || QUALITA_DEFAULT;
    var formato = (opts && opts.formato) || "jpeg";
    var ext     = formato === "webp" ? "webp" : "jpg";
    var mime    = formato === "webp" ? "image/webp" : "image/jpeg";

    /* il limite vale sull'originale: e' li' che si difende la connessione
       di chi carica dal cantiere, non solo lo spazio nel bucket */
    if(file.size > MAX_BYTE){
      return { errore: (eImmagine(file) ? "Foto" : "File") + " troppo grande, massimo 15 MB" };
    }

    var intatto = { file: file, nome: file.name, compressa: false,
                    byteOrig: file.size, byteFin: file.size };
    if(!eImmagine(file)) return intatto;   /* PDF della fattura: non si tocca */

    try{
      var blob = await comprimiImmagine(file, lato, qualita, mime);
      /* se il "compresso" pesa di piu' (foto gia' piccole, o gia' ottimizzate)
         si tiene l'originale: comprimere due volte peggiora e basta */
      if(!blob || blob.size >= file.size) return intatto;
      return { file: blob, nome: nomeConEstensione(file.name, ext), compressa: true,
               byteOrig: file.size, byteFin: blob.size };
    }catch(e){
      return intatto;                       /* mai far fallire l'upload per questo */
    }
  }

  window.preparaFileUpload = preparaFileUpload;
})();
