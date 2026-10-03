/* ============================================================
   PANNELLI — QR CODE
   Codice UGUALE nei tre pannelli (impresa, artigiano, professionisti):
   caricamento della libreria, colori, anteprima e scaricamento del QR code della scheda.
   Si carica PRIMA dello script grande della pagina.
   Usa dalla pagina: sb, impresaCorrente, esc e le altre funzioni comuni.
   ============================================================ */

/* --- QR Code profilo (copiato da pannello-artigiano) --- */
let _qrCodeInstance = null;

let _qrCodeCurrentColor = '#000000';

let _qrCodeLibPromise = null;

function _caricaQRCodeStylingLib() {
  if (_qrCodeLibPromise) return _qrCodeLibPromise;
  _qrCodeLibPromise = new Promise((resolve, reject) => {
    if (window.QRCodeStyling) return resolve();
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/qr-code-styling@1.6.0-rc.1/lib/qr-code-styling.js';
    s.onload = () => resolve();
    s.onerror = () => { _qrCodeLibPromise = null; reject(new Error('Impossibile caricare la libreria QR Code')); };
    document.head.appendChild(s);
  });
  return _qrCodeLibPromise;
}

function _qrTargetUrl() {
  return `https://trovaimpresa.com/profilo-impresa.html?id=${impresaCorrente.id}`;
}

function _qrLogoUrl() {
  return (impresaCorrente && impresaCorrente.logo_url) || '/img/logo.png';
}

function _qrColorDefault() {
  const pers = (impresaCorrente && impresaCorrente.personalizzazione) || {};
  return pers.colore_header || '#000000';
}

function _qrConfig(size, color) {
  return {
    width: size,
    height: size,
    type: 'canvas',
    data: _qrTargetUrl(),
    image: _qrLogoUrl(),
    dotsOptions: { color: color, type: 'rounded' },
    backgroundOptions: { color: '#ffffff' },
    imageOptions: { crossOrigin: 'anonymous', margin: 6, imageSize: 0.25 },
    cornersSquareOptions: { color: color, type: 'extra-rounded' },
    cornersDotOptions: { color: color }
  };
}

function aggiornaColoreQRCode(nuovoColore) {
  _qrCodeCurrentColor = nuovoColore;
  if (!_qrCodeInstance) return;
  _qrCodeInstance.update({
    dotsOptions: { color: nuovoColore, type: 'rounded' },
    cornersSquareOptions: { color: nuovoColore, type: 'extra-rounded' },
    cornersDotOptions: { color: nuovoColore }
  });
}

async function scaricaQRCodePNG() {
  if (!impresaCorrente) return;
  try {
    await _caricaQRCodeStylingLib();
    const qrDownload = new QRCodeStyling(_qrConfig(1024, _qrCodeCurrentColor));
    await qrDownload.download({ name: `qr-trovaimpresa-${impresaCorrente.id}`, extension: 'png' });
    const box = document.getElementById('qrSuccessBox');
    if (box) box.style.display = 'block';
  } catch (err) {
    alert('Errore durante il download: ' + err.message);
  }
}
