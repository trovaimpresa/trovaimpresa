/* ============================================================
   TrovaImpresa — preparazione dei file prima dell'upload
   Bucket: gestionale-foto

   Perche' esiste: fino a luglio 2026 le foto andavano su a piena
   risoluzione. Una foto da telefono occupa 3-5 MB, e il piano free di
   Supabase da' 1 GB in tutto: bastavano 200 foto per riempirlo.
   La compressione c'era gia' (compress(), lato lungo 1200) ma la usava
   solo il vecchio flusso locale, non i due percorsi che caricano davvero.

   Regole (una sola implementazione per tutti e 4 i gestionali):
   - oltre 15 MB si rifiuta, con un messaggio leggibile
   - se NON e' un'immagine (il PDF della fattura) passa intatto
   - le immagini scendono a 1600px sul lato lungo, JPEG 0.75
     (1600 e non 1200: in cantiere serve leggere i dettagli)
   - se la compressione fallisce si carica l'originale, non si
     fa fallire l'upload

   Uso:
     const p = await preparaFileUpload(file);
     if(p.errore){ toast(p.errore); return; }
     // p.file = Blob (o il File originale), p.nome = nome da usare nel path
   ============================================================ */
(function(){
  var LATO_MAX = 1600;                 /* px sul lato lungo */
  var QUALITA  = 0.75;                 /* qualita' JPEG */
  var MAX_BYTE = 15 * 1024 * 1024;     /* 15 MB sul file ORIGINALE */

  function eImmagine(file){
    return !!(file && file.type && file.type.indexOf("image/") === 0);
  }

  /* Il nome cambia estensione: dopo il canvas il contenuto e' JPEG anche se
     l'originale era .png o .heic. Lasciare la vecchia estensione produrrebbe
     file che il browser poi rifiuta di mostrare. */
  function nomeJpg(nome){
    return String(nome || "foto").replace(/\.[^.]+$/, "") + ".jpg";
  }

  function comprimiImmagine(file){
    return new Promise(function(risolvi, rifiuta){
      var rd = new FileReader(), img = new Image();
      rd.onerror = rifiuta;
      rd.onload = function(){
        img.onerror = rifiuta;   /* HEIC su browser che non lo sa leggere finisce qui */
        img.onload = function(){
          try{
            var w = img.width, h = img.height;
            if(!w || !h) return rifiuta(new Error("immagine senza dimensioni"));
            if(w > h){ if(w > LATO_MAX){ h = Math.round(h * LATO_MAX / w); w = LATO_MAX; } }
            else     { if(h > LATO_MAX){ w = Math.round(w * LATO_MAX / h); h = LATO_MAX; } }
            var cv = document.createElement("canvas");
            cv.width = w; cv.height = h;
            cv.getContext("2d").drawImage(img, 0, 0, w, h);
            cv.toBlob(function(blob){
              if(!blob) return rifiuta(new Error("toBlob vuoto"));
              risolvi(blob);
            }, "image/jpeg", QUALITA);
          }catch(e){ rifiuta(e); }
        };
        img.src = rd.result;
      };
      rd.readAsDataURL(file);
    });
  }

  /* Ritorna {errore} oppure {file, nome, compressa, byteOrig, byteFin}. */
  async function preparaFileUpload(file){
    if(!file) return { errore: "Nessun file da caricare" };

    /* il limite vale sull'originale: e' li' che si difende la connessione
       di chi carica dal cantiere, non solo lo spazio nel bucket */
    if(file.size > MAX_BYTE){
      return { errore: (eImmagine(file) ? "Foto" : "File") + " troppo grande, massimo 15 MB" };
    }

    var intatto = { file: file, nome: file.name, compressa: false,
                    byteOrig: file.size, byteFin: file.size };
    if(!eImmagine(file)) return intatto;   /* PDF della fattura: non si tocca */

    try{
      var blob = await comprimiImmagine(file);
      /* se il "compresso" pesa di piu' (foto gia' piccole, o gia' ottimizzate)
         si tiene l'originale: comprimere due volte peggiora e basta */
      if(!blob || blob.size >= file.size) return intatto;
      return { file: blob, nome: nomeJpg(file.name), compressa: true,
               byteOrig: file.size, byteFin: blob.size };
    }catch(e){
      return intatto;                       /* mai far fallire l'upload per questo */
    }
  }

  window.preparaFileUpload = preparaFileUpload;
})();
