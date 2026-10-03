/* ============================================================
   PANNELLI — LAVORI CON FOTO E VIDEO
   Codice UGUALE nei tre pannelli (impresa, artigiano, professionisti):
   caricamento, salvataggio, ordine ed eliminazione dei lavori con foto; controllo, salvataggio ed eliminazione dei video.
   Si carica PRIMA dello script grande della pagina.
   Usa dalla pagina: sb, impresaCorrente, esc e le altre funzioni comuni.
   ============================================================ */

// =====================
// FOTO DEI LAVORI
// =====================
/* ⛔ 30 agosto 2026 — PERCHE' UN INTERRUTTORE E NON LA SCRITTA A SCHERMO.
   Il primo tentativo guardava se la scritta qui sotto conteneva la clessidra
   (⏳). Non puo' funzionare: piu' in basso in questa pagina c'e' `iconizza()`,
   che gira per tutti i testi e TRASFORMA le emoji in disegni SVG. Quindici
   millisecondi dopo, la clessidra non e' piu' testo e `textContent` legge
   « Caricamento foto...» senza di lei. Il ramo non partiva mai.
   Trovato aprendo la pagina vera: il banco, che usa una finta pagina, lo
   dava verde. ⛔ Su questa pagina NESSUNO deve decidere leggendo un'emoji
   dal testo: si usa una variabile. */
let _fotoLavoroInCaricamento = false;

// carica la foto nel bucket foto-lavori e mette l'URL pubblico in lav-foto
async function caricaFotoLavoroFile(file) {
  const stato = document.getElementById('lav-foto-stato');
  const hidden = document.getElementById('lav-foto');
  if (!file) { hidden.value = ''; stato.textContent = ''; _fotoLavoroInCaricamento = false; return; }
  if (file.size > 5 * 1024 * 1024) { hidden.value = ''; stato.textContent = '❌ La foto supera i 5 MB.'; _fotoLavoroInCaricamento = false; return; }
  _fotoLavoroInCaricamento = true;
  stato.textContent = '⏳ Caricamento foto...';
  const prep = await preparaFileUpload(file);
  if (prep.errore) { hidden.value = ''; stato.textContent = '❌ ' + prep.errore; _fotoLavoroInCaricamento = false; return; }
  const folder = String(impresaCorrente.id);
  const ext = prep.compressa ? 'jpg' : (file.name.split('.').pop() || 'jpg');
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2,7)}.${ext}`;
  const { error } = await sb.storage.from('foto-lavori').upload(path, prep.file, { upsert: false, contentType: prep.compressa ? 'image/jpeg' : file.type, cacheControl: '31536000' });
  if (error) { hidden.value = ''; stato.textContent = '❌ Errore upload: ' + error.message; _fotoLavoroInCaricamento = false; return; }
  const { data: { publicUrl } } = sb.storage.from('foto-lavori').getPublicUrl(path);
  hidden.value = publicUrl;
  stato.textContent = '✅ Foto caricata';
  _fotoLavoroInCaricamento = false;
}

// INSERT di un lavoro in lavori_foto
async function salvaLavoroFoto() {
  const foto = document.getElementById('lav-foto').value.trim();
  const titolo = document.getElementById('lav-titolo').value.trim();
  const descrizione = document.getElementById('lav-descrizione').value.trim();
  const pubblico = document.getElementById('lav-pubblico').checked;

  /* ⛔ 30 agosto 2026 — IL SALVA CHE SALVAVA IL NIENTE.
     Premendo «Salva» senza aver scelto la foto, questa funzione scriveva
     comunque la riga e rispondeva «✅ Lavoro salvato!»: una scheda senza
     immagine, senza titolo, e per giunta con «Mostra nel profilo pubblico»
     acceso. Il 30 agosto in tabella ce n'erano gia' 51, di 26 imprese
     diverse, su 134 righe: due su cinque erano vuote.
     Chi le ha fatte non ha sbagliato: ha premuto Salva mentre la foto era
     ancora in caricamento, oppure prima di sceglierla, e nessuno gliel'ha
     detto. Adesso glielo si dice, e si distingue fra le due cose. */
  if (!foto) {
    alert(_fotoLavoroInCaricamento
      ? 'La foto si sta ancora caricando: aspetta il segno verde e poi premi Salva.'
      : 'Manca la foto del lavoro: scegline una prima di salvare.');
    return;
  }

  const { data: { user } } = await sb.auth.getUser();
  if (!user) { alert('Sessione scaduta. Effettua di nuovo l\'accesso.'); return; }

  const { error } = await sb.from('lavori_foto').insert({
    owner_id: user.id,
    foto,
    titolo,
    descrizione,
    pubblico
  });
  if (error) { alert('Errore nel salvataggio: ' + error.message); return; }

  alert('✅ Lavoro salvato!');
  document.getElementById('lav-foto-file').value = '';
  document.getElementById('lav-foto').value = '';
  document.getElementById('lav-titolo').value = '';
  document.getElementById('lav-descrizione').value = '';
  document.getElementById('lav-pubblico').checked = true;
  await caricaListaLavoriFoto();
}

// legge lavori_foto dell'utente loggato e disegna le card (stessa grafica del pannello-negozio)
async function caricaListaLavoriFoto() {
  const grid = document.getElementById('lista-lavori-foto');
  if (!grid) return;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  /* ⭐ 12 set 2026 — l'ordine lo decide l'impresa, non l'orologio.
     `ordine` piu' alto = viene prima. Tutte a 0 (come prima di oggi)
     significa: decide la data, esattamente come si e' sempre fatto. */
  const { data, error } = await sb.from('lavori_foto')
    .select('*').eq('owner_id', user.id)
    .order('ordine', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1">⚠️ Errore nel caricamento</div>';
    return;
  }
  const lavori = data || [];
  const statFoto = document.getElementById('dash-stat-foto');
  if (statFoto) statFoto.textContent = lavori.length;
  if (!lavori.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📷</div>Nessun lavoro ancora.</div>';
    return;
  }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  grid.innerHTML = lavori.map((l, idx) => {
    const prima = idx === 0;
    const foto = l.foto
      ? `<img src="${esc(l.foto)}" alt="" loading="lazy" style="width:100%;aspect-ratio:1;object-fit:cover;display:block;background:#f0f0f0">`
      : '<div style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:2rem;background:#f0f0f0">📷</div>';
    const checked = l.pubblico ? 'checked' : '';
    const titoloHTML = l.titolo ? `<div style="font-size:0.95rem;font-weight:700;color:var(--dark);line-height:1.3">${esc(l.titolo)}</div>` : '';
    return `<div style="background:white;border:1px solid ${prima ? 'var(--verde)' : 'var(--border)'};border-radius:12px;overflow:hidden;box-shadow:var(--shadow);display:flex;flex-direction:column;position:relative">
      ${prima ? '<div style="position:absolute;top:10px;left:10px;background:var(--verde);color:white;font-size:13px;font-weight:700;padding:4px 10px;border-radius:20px;z-index:1">⭐ Prima foto</div>' : ''}
      ${foto}
      <div style="padding:10px;display:flex;flex-direction:column;gap:4px">
        ${titoloHTML}
        <div style="font-size:0.85rem;color:var(--dark);line-height:1.4">${esc(l.descrizione)}</div>
        <label style="display:flex;align-items:center;gap:8px;font-size:15px;color:var(--mid);cursor:pointer;margin-top:4px">
          <input type="checkbox" ${checked} style="width:18px;height:18px;accent-color:var(--verde);cursor:pointer" onchange="toggleLavoroPubblico('${esc(l.id)}', this.checked)">
          Mostra nel profilo pubblico
        </label>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:4px">
          ${prima ? '' : `<button onclick="mettiPerPrima('${esc(l.id)}')" style="background:transparent;border:1.5px solid var(--verde);color:var(--verde);font-size:0.9rem;font-weight:700;padding:6px 12px;border-radius:20px;cursor:pointer">⭐ Metti per prima</button>`}
          <button class="btn-rimuovi-riga" onclick="eliminaLavoroFoto('${esc(l.id)}')">🗑 Elimina</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ⭐ 12 set 2026 — «METTI PER PRIMA».
   Nato da una domanda vera: Lares Srls, 12 set, «trovo solo una e non e'
   la migliore». La prima foto e' il biglietto da visita dell'impresa e
   fino a oggi la sceglieva l'orologio.
   Come funziona: si scrive max(ordine)+1 sulla foto scelta, cosi' passa
   davanti a tutte senza dover rinumerare le altre. Niente si sposta,
   niente si rompe, e premendo la stella su un'altra si cambia di nuovo.
   ⚠️ Stesso ordine in profilo-impresa.html: se cambia qui, cambia li'. */
async function mettiPerPrima(id) {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { alert('Sessione scaduta. Effettua di nuovo l\'accesso.'); return; }
  const { data: righe, error: e1 } = await sb.from('lavori_foto')
    .select('ordine').eq('owner_id', user.id)
    .order('ordine', { ascending: false }).limit(1);
  if (e1) { alert('Errore: ' + e1.message); return; }
  const massimo = (righe && righe[0] && Number(righe[0].ordine)) || 0;
  const { error } = await sb.from('lavori_foto')
    .update({ ordine: massimo + 1 }).eq('id', id).eq('owner_id', user.id);
  if (error) { alert('Errore: ' + error.message); return; }
  await caricaListaLavoriFoto();
}

// aggiorna il flag pubblico del singolo lavoro
async function toggleLavoroPubblico(id, pubblico) {
  const { error } = await sb.from('lavori_foto').update({ pubblico }).eq('id', id);
  if (error) {
    alert('Errore aggiornamento visibilità: ' + error.message);
    await caricaListaLavoriFoto();
  }
}

// elimina un lavoro da lavori_foto
async function eliminaLavoroFoto(id) {
  if (!confirm('Eliminare questo lavoro?')) return;
  const { error } = await sb.from('lavori_foto').delete().eq('id', id);
  if (error) { alert('Errore eliminazione: ' + error.message); return; }
  await caricaListaLavoriFoto();
}

function _videoUrlValido(url) {
  const lower = (url || '').toLowerCase();
  return lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo.com');
}

function estraiVideoEmbed(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0];
      return /^[A-Za-z0-9_-]{6,}$/.test(id) ? 'https://www.youtube.com/embed/' + id : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const id = u.searchParams.get('v');
      return id && /^[A-Za-z0-9_-]{6,}$/.test(id) ? 'https://www.youtube.com/embed/' + id : null;
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const parts = u.pathname.split('/').filter(Boolean);
      const id = parts.find(p => /^\d+$/.test(p));
      return id ? 'https://player.vimeo.com/video/' + id : null;
    }
  } catch (_) {}
  return null;
}

async function caricaVideo() {
  const lista = document.getElementById('lista-video');
  if (!lista || !impresaCorrente) return;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const { data, error } = await sb.from('video_lavori').select('*').eq('impresa_id', impresaCorrente.id).order('created_at', { ascending: false });
  if (error) { lista.innerHTML = '<div class="empty-state">Errore caricamento video.</div>'; return; }
  if (!data || !data.length) { lista.innerHTML = '<div class="empty-state">Nessun video caricato. Aggiungi il primo qui sopra.</div>'; return; }
  lista.innerHTML = data.map(v => {
    const embed = estraiVideoEmbed(v.video_url);
    const iframe = embed
      ? '<iframe src="' + esc(embed) + '" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>'
      : '<div style="padding:20px;color:#fff;font-size:15px">URL non valido</div>';
    const desc = v.descrizione ? esc(v.descrizione) : '<em style="color:#888">Nessuna descrizione</em>';
    return '<div class="video-row"><div class="video-iframe-wrap">' + iframe + '</div><div class="video-info"><p>' + desc + '</p></div><button class="btn-del" onclick="eliminaVideo(' + v.id + ')">🗑️ Elimina</button></div>';
  }).join('');
}

async function salvaVideo() {
  const url = document.getElementById('video-url').value.trim();
  const desc = document.getElementById('video-desc').value.trim();
  if (!url) { alert('Inserisci un URL video.'); return; }
  if (!_videoUrlValido(url)) { alert('URL non valido. Sono ammessi solo link YouTube (youtube.com, youtu.be) o Vimeo (vimeo.com).'); return; }
  const btn = document.getElementById('btn-salva-video');
  btn.disabled = true; btn.textContent = '⏳ Salvataggio...';
  const { error } = await sb.from('video_lavori').insert({ impresa_id: impresaCorrente.id, video_url: url, descrizione: desc });
  btn.disabled = false; btn.textContent = '💾 Salva video';
  if (error) { alert('Errore: ' + error.message); return; }
  document.getElementById('video-url').value = '';
  document.getElementById('video-desc').value = '';
  caricaVideo();
}

async function eliminaVideo(id) {
  if (!confirm('Eliminare questo video?')) return;
  const { error } = await sb.from('video_lavori').delete().eq('id', id);
  if (error) { alert('Errore: ' + error.message); return; }
  caricaVideo();
}
