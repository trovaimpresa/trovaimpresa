"""Registra i video tutorial del gestionale TrovaImpresa.

Uso:  python3 registra.py preventivi        (una voce)
      python3 registra.py tutti             (tutte quelle in COPIONI)

Apre il gestionale VERO (la cartella del sito servita in locale) con un
Supabase finto pieno di dati di esempio, esegue i passi del copione con un
puntatore visibile, misura i tempi, e monta il video con i sottotitoli in
una fascia blu sotto lo schermo (cosi' non coprono mai i pulsanti).
"""
import asyncio, json, os, subprocess, sys, time
from playwright.async_api import async_playwright

SITO = os.environ.get("SITO", "http://localhost:8765")
QUI = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("OUT", os.path.join(QUI, "uscita"))
FAKE = open(os.path.join(QUI, "finto-supabase.js")).read()
W, H = 1600, 900

CURSORE = r"""
(function(){
  if (window.__cur) return; window.__cur = 1;
  function monta(){
    var c=document.createElement('div');c.id='__cur';
    c.style.cssText='position:fixed;left:0;top:0;width:34px;height:34px;z-index:2147483647;pointer-events:none;transform:translate(-200px,-200px);transition:none';
    c.innerHTML='<svg width="34" height="34" viewBox="0 0 24 24"><path d="M4 2l15 11-7 1-4 7z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.documentElement.appendChild(c);
    document.addEventListener('mousemove',function(e){c.style.transform='translate('+(e.clientX-4)+'px,'+(e.clientY-2)+'px)';},true);
    document.addEventListener('mousedown',function(e){
      var r=document.createElement('div');
      r.style.cssText='position:fixed;z-index:2147483646;pointer-events:none;left:'+(e.clientX-26)+'px;top:'+(e.clientY-26)+'px;width:52px;height:52px;border-radius:50%;border:4px solid #ff8800;opacity:1;transition:all .5s ease-out';
      document.documentElement.appendChild(r);
      requestAnimationFrame(function(){r.style.transform='scale(1.6)';r.style.opacity='0';});
      setTimeout(function(){r.remove();},600);
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',monta);else monta();
})();
"""

# ─── la voce di Alessio (facoltativa) ──────────────────────────────────────
# VOCE=/percorso/cartella con indice.json + i file scaricati da registra-voce.html.
# Ogni frase si pulisce (silenzio in testa e in coda, volume pari) e si lega
# al testo del sottotitolo: dove c'e', il video la usa; dove non c'e', resta muto.
VOCE = {}
def carica_voce():
    d = os.environ.get("VOCE")
    if not d or not os.path.exists(os.path.join(d, "indice.json")): return
    pul = os.path.join(d, "_pulite"); os.makedirs(pul, exist_ok=True)
    for x in json.load(open(os.path.join(d, "indice.json"))):
        src, dst = os.path.join(d, x["file"]), os.path.join(pul, x["id"] + ".wav")
        if not os.path.exists(dst):
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-af",
                "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.1,areverse,"
                "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15,areverse,"
                "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "1", dst], check=True)
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                    "-of", "csv=p=0", dst], capture_output=True, text=True).stdout.strip() or 0)
        if dur > 0.2: VOCE[x["testo"]] = (dst, dur)
    print("voce: frasi pronte", len(VOCE))

class Regia:
    def __init__(self, pg, tel=False):
        self.pg, self.t0, self.sub, self.cur, self.tel = pg, None, [], None, tel
        self.voci, self.fine_voce = [], 0
    def adesso(self):
        return time.monotonic() - self.t0
    async def dici(self, testo):
        """Cambia il sottotitolo da questo momento. Se c'e' la voce registrata di
        questa frase, la mette qui e il copione aspetta che la frase di prima sia
        finita: cosi' la voce non si accavalla mai."""
        resta = self.fine_voce - self.adesso()
        if resta > 0: await self.aspetta(resta + 0.25)
        t = self.adesso()
        if self.cur: self.sub.append((self.cur[0], t, self.cur[1]))
        self.cur = (t, testo)
        v = VOCE.get(testo)
        if v:
            self.voci.append((t, v[0]))
            self.fine_voce = t + v[1]
    async def fine(self):
        resta = self.fine_voce - self.adesso()
        if resta > 0: await self.aspetta(resta + 0.4)
        t = self.adesso()
        if self.cur: self.sub.append((self.cur[0], t, self.cur[1])); self.cur = None
    async def aspetta(self, s):
        await self.pg.wait_for_timeout(int(s * 1000))
    async def vai_su(self, loc):
        loc = loc.first if hasattr(loc, "first") else loc
        await loc.scroll_into_view_if_needed()
        b = await loc.bounding_box()
        x, y = b["x"] + b["width"] / 2, b["y"] + b["height"] / 2
        await self.pg.mouse.move(x, y, steps=28)
        await self.aspetta(0.35)
        return x, y
    async def clicca(self, sel):
        loc = self.pg.locator(sel) if isinstance(sel, str) else sel
        loc = loc.first
        await self.vai_su(loc)
        await loc.click()
        await self.aspetta(0.6)
    async def scrivi(self, sel, testo):
        loc = (self.pg.locator(sel) if isinstance(sel, str) else sel).first
        await self.vai_su(loc)
        await loc.click()
        await loc.fill("")
        await self.pg.keyboard.type(testo, delay=65)
        await self.aspetta(0.5)
    async def data(self, sel, giorni):
        """Mette una data fra «giorni» giorni (le caselle data non si scrivono a tasti)."""
        import datetime
        v = (datetime.date.today() + datetime.timedelta(days=giorni)).isoformat()
        loc = (self.pg.locator(sel) if isinstance(sel, str) else sel).first
        await self.vai_su(loc)
        await loc.fill(v); await loc.dispatch_event("change")
        await self.aspetta(0.7)
    async def apri_voce(self, tab, testo):
        """Apre una voce del menu come farebbe una persona: sul telefono prima il ☰,
        e se la voce sta dentro «Tutto il resto» apre prima quello."""
        pg = self.pg
        if self.tel:
            testo = testo.replace("Nel menu premi", "Apri il menu ☰ e premi").replace("Apri «Tutto il resto»", "Apri il menu ☰, poi «Tutto il resto»").replace("In fondo al menu", "Apri il menu ☰: in fondo")
        await self.dici(testo)
        if self.tel and not await pg.evaluate("document.querySelector('.side').classList.contains('open')"):
            await self.clicca('.side [data-action="burger"]')
        b = pg.locator(f'.side nav.tabs button[data-tab="{tab}"]').first
        if not await b.is_visible():
            await self.clicca(".side nav.tabs .menu-altro")
            await self.aspetta(0.5)
        await self.clicca(b)
        await self.aspetta(0.8)
    async def scegli(self, sel, etichetta):
        loc = (self.pg.locator(sel) if isinstance(sel, str) else sel).first
        await self.vai_su(loc)
        if isinstance(etichetta, dict): await loc.select_option(**etichetta)
        else: await loc.select_option(label=etichetta)
        await loc.dispatch_event("change")
        await self.aspetta(0.7)


# ─── I COPIONI: una funzione per voce del menu ─────────────────────────────
async def entra(r):
    await r.dici("Entra nel tuo reparto: premi «Apri».")
    await r.aspetta(1.6)
    await r.clicca(r.pg.get_by_role("button", name="Apri"))
    await r.aspetta(1.0)

async def nuovo(r, tab, azione, testo):
    await r.dici(testo)
    await r.clicca(f'section#{tab} [data-action="{azione}"]:visible')
    await r.aspetta(1.0)

async def salva(r, azione, testo):
    await r.dici(testo)
    await r.clicca(f'[data-action="{azione}"]:visible')
    await r.aspetta(1.6)

async def riepilogo(r):
    pg = r.pg
    await entra(r)
    await r.dici("Questa è la pagina di partenza: l'Assistente.")
    await r.aspetta(2.2)
    await r.dici("Scrivi o parla come ti viene: «fammi un preventivo per un bagno».")
    await r.vai_su(pg.locator("section#riepilogo textarea:visible"))
    await r.aspetta(3)
    await r.dici("Oppure tocca uno di questi bottoni per partire subito.")
    await r.vai_su(pg.locator("section#riepilogo").get_by_text("Fai un preventivo"))
    await r.aspetta(2.6)
    await r.dici("Sotto ci sono i primi passi: seguili uno alla volta.")
    await r.vai_su(pg.locator("section#riepilogo").get_by_text("Primi passi"))
    await r.aspetta(3.2)

async def preventivi(r):
    pg = r.pg
    await entra(r)
    await r.apri_voce("preventivi", "Nel menu premi «Preventivi».")
    await r.dici("Qui trovi tutti i tuoi preventivi: bozze, inviati e accettati.")
    await r.vai_su(pg.locator("#prev-viste"))
    await r.aspetta(2.6)
    await nuovo(r, "preventivi", "new-prev", "Per farne uno nuovo premi «+ Nuovo preventivo».")
    await r.dici("Scrivi il titolo del lavoro.")
    await r.scrivi("#pv-tit", "Tinteggiatura appartamento")
    await r.dici("Scegli il cliente dall'elenco.")
    await r.scegli("#pv-cli", "Giulia Bianchi")
    await r.dici("Scrivi le voci: cosa fai, quanti metri, e il prezzo.")
    await r.scrivi(".pr-desc", "Tinteggiatura pareti e soffitti")
    await r.scrivi(".pr-qta", "120")
    await r.scrivi(".pr-prezzo", "8,50")
    await r.dici("Per un'altra voce premi «+ Aggiungi voce».")
    await r.clicca('[data-action="prev-riga-add"]')
    await r.scrivi(pg.locator(".pr-desc").nth(1), "Stuccatura e rasatura")
    await r.scrivi(pg.locator(".pr-qta").nth(1), "1")
    await r.scrivi(pg.locator(".pr-prezzo").nth(1), "350")
    await r.dici("Scegli l'IVA. Il totale si calcola da solo.")
    await r.scegli("#pv-iva-imp", {"value": "10"})
    await r.aspetta(1.4)
    await salva(r, "save-prev", "Premi «Crea preventivo». Fatto!")
    await r.dici("Il preventivo è nella lista. Aprilo per scaricare il PDF e mandarlo al cliente.")
    await r.aspetta(3.5)

async def computi(r):
    await entra(r)
    await r.apri_voce("computi", "Nel menu premi «Computo da prezzare».")
    await r.dici("Qui fai il computo metrico, o carichi quello che ti manda il geometra.")
    await r.vai_su(r.pg.locator('section#computi [data-action="comp-geometra"]:visible'))
    await r.aspetta(2.8)
    await nuovo(r, "computi", "new-computo", "Per farne uno tuo premi «+ Crea il primo computo».")
    await r.dici("Scrivi il titolo, il cliente e dove si fa il lavoro.")
    await r.scrivi("#co-tit", "Ristrutturazione appartamento")
    await r.scegli("#co-cli", "Luca Verdi")
    await r.scrivi("#co-luogo", "Via Cintia 4, Rieti")
    await salva(r, "save-computo", "Premi «Crea computo».")
    await r.dici("Dentro aggiungi le voci, anche prese dal prezzario della tua regione.")
    await r.aspetta(3.5)

async def lavori(r):
    pg = r.pg
    await entra(r)
    await r.apri_voce("lavori", "Nel menu premi «Lavori».")
    await r.dici("Qui vedi tutti i lavori: in ritardo, di oggi, prossimi, da incassare.")
    await r.vai_su(pg.locator('section#lavori [data-action="lav-vista"]:visible').nth(1))
    await r.aspetta(2.8)
    await nuovo(r, "lavori", "new-job", "Per un lavoro nuovo premi «+ Nuovo lavoro».")
    await r.dici("Scrivi cosa c'è da fare e dove.")
    await r.scrivi("#j-desc", "Rifacimento intonaco facciata")
    await r.scrivi("#j-dove", "Via Garibaldi 12, Rieti")
    await r.dici("Scegli il cliente e scrivi quanto vale il lavoro.")
    await r.scegli("#j-cliente", "Giulia Bianchi")
    await r.scrivi("#j-imp", "4500")
    await salva(r, "save-job", "Premi «Crea lavoro». Fatto!")
    await r.dici("Il lavoro è in lista. Quando lo finisci, da qui fai la fattura.")
    await r.aspetta(3.5)

async def fatture(r):
    pg = r.pg
    await entra(r)
    await r.apri_voce("fatture", "Nel menu premi «Fatture».")
    await r.dici("Qui vedi le fatture: bozze, da incassare, scadute e pagate.")
    await r.vai_su(pg.locator('section#fatture [data-action="fatt-vista"]:visible').nth(2))
    await r.aspetta(2.8)
    await nuovo(r, "fatture", "new-fattura", "Per una fattura nuova premi «+ Nuova fattura».")
    await r.dici("Il modo più veloce: falla nascere da un preventivo accettato.")
    await r.clicca('[data-action="fatt-da-prev"]')
    await r.dici("Scegli il preventivo e premi «Continua».")
    await r.clicca(pg.locator('.overlay.open input[type="radio"], .sheet--grande input[type="radio"]'))
    await r.clicca('[data-action="fatt-da-prev-ok"]')
    await r.aspetta(1.2)
    await r.dici("Le righe ci sono già, con quantità e prezzi. Non devi riscrivere niente.")
    await r.aspetta(3.5)
    await salva(r, "save-fatt", "Controlla e premi «Crea fattura». Fatto!")
    await r.dici("Poi la scarichi in PDF o la mandi allo SDI.")
    await r.aspetta(3)

async def clienti(r):
    await entra(r)
    await r.apri_voce("clienti", "Nel menu premi «Clienti».")
    await r.dici("Qui c'è la rubrica dei tuoi clienti.")
    await r.aspetta(2.4)
    await nuovo(r, "clienti", "new-cli", "Per un cliente nuovo premi «+ Nuovo cliente».")
    await r.dici("Scrivi nome e telefono.")
    await r.scrivi("#c-nome", "Anna Moretti")
    await r.scrivi("#c-tel", "347 9998887")
    await r.dici("Poi l'indirizzo e la città.")
    await r.scrivi("#c-ind", "Via Roma 30")
    await r.scrivi("#c-citta", "Rieti")
    await salva(r, "save-cli", "Premi «Crea». Fatto!")
    await r.dici("Il cliente lo ritrovi qui e nei preventivi.")
    await r.aspetta(3)

async def calendario(r):
    pg = r.pg
    await entra(r)
    await r.apri_voce("calendario", "Nel menu premi «Calendario».")
    await r.dici("Qui vedi i lavori e le scadenze giorno per giorno.")
    await r.aspetta(3)
    await r.dici("Con le frecce cambi mese. «Oggi» ti riporta a oggi.")
    await r.vai_su(pg.locator('section#calendario [data-action="cal-next"]:visible'))
    await r.aspetta(1)
    await r.clicca('section#calendario [data-action="cal-next"]:visible')
    await r.clicca('section#calendario [data-action="cal-today"]:visible')
    await r.dici("Tocca un giorno per vedere cosa c'è.")
    await r.vai_su(pg.locator('section#calendario [data-action="open-day"]:visible').nth(9))
    await r.aspetta(3)

async def giornate(r):
    pg = r.pg
    await entra(r)
    await r.apri_voce("giornate", "Apri «Tutto il resto» e premi «Giornate».")
    await r.dici("Qui segni le giornate della tua squadra.")
    await r.aspetta(2.2)
    await r.dici("Racconta la giornata a voce o scrivendo: chi c'era e cosa avete fatto.")
    await r.vai_su(pg.locator("section#giornate textarea:visible"))
    await r.aspetta(3.2)
    await r.dici("Premi «Compila la giornata» e si riempie da sola.")
    await r.vai_su(pg.locator("section#giornate").get_by_text("Compila la giornata"))
    await r.aspetta(2.8)
    await r.dici("A fine mese trovi i giorni di ognuno e scarichi il PDF.")
    await r.vai_su(pg.locator("section#giornate").get_by_text("Il mese"))
    await r.aspetta(3)

async def dalsito(r):
    await entra(r)
    await r.apri_voce("dalsito", "Apri «Tutto il resto» e premi «Richieste dal sito».")
    await r.dici("Qui arrivano i clienti che ti scrivono dalla tua pagina su TrovaImpresa.")
    await r.aspetta(3.2)
    await r.dici("Vedi chi ha scritto, cosa gli serve e i suoi contatti.")
    await r.aspetta(3)
    await r.dici("Da qui gli fai il preventivo con un clic.")
    await r.aspetta(2.8)

async def promemoria(r):
    await entra(r)
    await r.apri_voce("promemoria", "Apri «Tutto il resto» e premi «Promemoria».")
    await r.dici("Qui scrivi le cose da ricordare. Ti arriva l'avviso al momento giusto.")
    await r.aspetta(2.6)
    await nuovo(r, "promemoria", "new-prom", "Premi «+ Scrivi il primo promemoria».")
    await r.dici("Scrivi cosa devi ricordare e il giorno.")
    await r.scrivi("#p-testo", "Pagare F24")
    await r.data("#p-data", 8)
    await r.dici("Scegli quando avvisarti e se si ripete.")
    await r.scegli("#p-avvisa", {"value": "3"})
    await r.scegli("#p-ripeti", {"value": "1"})
    await salva(r, "save-prom", "Premi «Salva». Fatto!")
    await r.aspetta(2.5)

async def scadenzario(r):
    await entra(r)
    await r.apri_voce("scadenzario", "Apri «Tutto il resto» e premi «Scadenzario».")
    await r.dici("Qui tieni le scadenze: DURC, assicurazioni, revisioni, visite.")
    await r.aspetta(2.6)
    await nuovo(r, "scadenzario", "new-scad", "Premi «+ Aggiungi la prima scadenza».")
    await r.dici("Scrivi cos'è, scegli il tipo e la data.")
    await r.scrivi("#s-tit", "Revisione furgone")
    await r.scegli("#s-tipo", {"value": "Revisione mezzo"})
    await r.data("#s-data", 25)
    await r.dici("Se si ripete, scegli ogni quanto.")
    await r.scegli("#s-ripeti", {"value": "24"})
    await salva(r, "save-scad", "Premi «Crea». Ti avvisiamo prima che scada.")
    await r.aspetta(2.8)

async def agenda(r):
    await entra(r)
    await r.apri_voce("agenda", "Apri «Tutto il resto» e premi «Agenda operatore».")
    await r.dici("Qui vedi i lavori da fare, operaio per operaio.")
    await r.aspetta(3)
    await r.dici("In «Ore fatte» vedi le ore segnate da ognuno.")
    await r.clicca(r.pg.locator('section#agenda [data-action="ag-vista"]:visible').nth(1))
    await r.aspetta(3)

async def squadra(r):
    await entra(r)
    await r.apri_voce("squadra", "Apri «Tutto il resto» e premi «Squadra».")
    await r.dici("Qui metti i tuoi operai.")
    await r.aspetta(2)
    await nuovo(r, "squadra", "new-dip", "Premi «+ Aggiungi la prima persona».")
    await r.dici("Scrivi nome, telefono e mansione.")
    await r.scrivi("#d-nome", "Igor")
    await r.scrivi("#d-tel", "333 7778889")
    await r.scrivi("#d-mansione", "Muratore")
    await r.dici("Il costo all'ora serve a sapere quanto ti costa ogni lavoro.")
    await r.scrivi("#d-costo", "22,50")
    await salva(r, "sq-add", "Premi «Aggiungi». Fatto!")
    await r.dici("Dall'app operaio lui segna le ore e le foto dal telefono.")
    await r.aspetta(3)

async def mezzi(r):
    await entra(r)
    await r.apri_voce("mezzi", "Apri «Tutto il resto» e premi «Mezzi».")
    await r.dici("Qui tieni i mezzi, con assicurazione e revisione.")
    await r.aspetta(2.2)
    await nuovo(r, "mezzi", "new-mezzo", "Premi «+ Aggiungi il primo mezzo».")
    await r.dici("Scrivi il nome, il tipo e la targa.")
    await r.scrivi("#m-nome", "Furgone Ducato")
    await r.scrivi("#m-tipo", "furgone")
    await r.scrivi("#m-targa", "AB123CD")
    await r.dici("Metti le date di assicurazione e revisione: ti avvisiamo prima.")
    await r.data("#m-assic", 40)
    await r.data("#m-revis", 120)
    await salva(r, "save-mezzo", "Premi «Crea». Fatto!")
    await r.aspetta(2.5)

async def attrezzature(r):
    await entra(r)
    await r.apri_voce("attrezzature", "Apri «Tutto il resto» e premi «Attrezzature».")
    await r.dici("Qui tieni ponteggi, betoniere e attrezzi.")
    await r.aspetta(2.2)
    await nuovo(r, "attrezzature", "new-attrezzatura", "Premi «+ Aggiungi la prima attrezzatura».")
    await r.dici("Scrivi il nome e il tipo.")
    await r.scrivi("#m-nome", "Betoniera 350 litri")
    await r.scrivi("#m-tipo", "betoniera")
    await r.dici("Nelle note scrivi dove si trova.")
    await r.scrivi("#m-note", "In magazzino")
    await salva(r, "save-mezzo", "Premi «Crea». Fatto!")
    await r.aspetta(2.5)

async def fisco(r):
    pg = r.pg
    await entra(r)
    await r.apri_voce("fisco", "Apri «Tutto il resto» e premi «Tasse e fisco».")
    await r.dici("In cima vedi subito se c'è qualcosa da fare adesso.")
    await r.aspetta(2.8)
    await r.dici("«Farsi pagare»: chi ti deve soldi e da quanto.")
    await r.aspetta(2.6)
    await r.dici("«Le tue tasse»: quanto mettere da parte e le date da non dimenticare.")
    await r.clicca(pg.locator('section#fisco [data-action="fp-sez"]:visible').nth(1))
    await r.aspetta(2.6)
    await r.dici("«Quanto ti resta»: quello che ti rimane in tasca, tolte le tasse.")
    await r.clicca(pg.locator('section#fisco [data-action="fp-sez"]:visible').nth(2))
    await r.aspetta(3)

async def prezzario(r):
    await entra(r)
    await r.apri_voce("prezzario", "Apri «Tutto il resto» e premi «Prezzario».")
    await r.dici("Qui tieni i tuoi prezzi. Puoi anche importarli da Excel.")
    await r.vai_su(r.pg.locator('section#prezzario [data-action="pz-importa"]:visible'))
    await r.aspetta(2.6)
    await nuovo(r, "prezzario", "new-prezzo", "Per una voce nuova premi «+ Nuova voce».")
    await r.dici("Scegli l'unità, scrivi la descrizione e il prezzo.")
    await r.scegli("#pz-uni", {"value": "m²"})
    await r.scrivi("#pz-desc", "Tinteggiatura con idropittura, due mani")
    await r.scrivi("#pz-prezzo", "9,50")
    await r.scrivi("#pz-cat", "Pitture")
    await salva(r, "save-prezzo", "Premi «Crea la voce». La ritrovi nei preventivi.")
    await r.aspetta(2.6)

async def sal(r):
    await entra(r)
    await r.apri_voce("sal", "Apri «Tutto il resto» e premi «Stati di avanzamento».")
    await r.dici("Qui trovi tutti i SAL dei tuoi computi, in un posto solo.")
    await r.aspetta(3)
    await r.dici("Vedi quali sono da fatturare e quali già fatturati.")
    await r.vai_su(r.pg.locator('section#sal [data-action="sal-filtro"]:visible').nth(1))
    await r.aspetta(3)
    await r.dici("Il SAL si fa dentro il computo: da qui ci vai con un clic.")
    await r.vai_su(r.pg.locator('section#sal [data-action="sal-vai-computi"]:visible'))
    await r.aspetta(3)

async def fornitori(r):
    await entra(r)
    await r.apri_voce("fornitori", "Apri «Tutto il resto» e premi «Fornitori».")
    await r.dici("Qui tieni i fornitori e le loro fatture.")
    await r.aspetta(2.2)
    await r.dici("Una fattura di carta? Fotografala e si legge da sola.")
    await r.vai_su(r.pg.locator('section#fornitori [data-action="new-fattf"]:visible'))
    await r.aspetta(2.8)
    await nuovo(r, "fornitori", "new-forn", "Per un fornitore nuovo premi «+ Nuovo fornitore».")
    await r.dici("Scrivi il nome, il tipo e il telefono.")
    await r.scrivi("#fo-nome", "Edil Market Rieti")
    await r.scegli("#fo-cat", {"value": "Rivendita edile"})
    await r.scrivi("#fo-tel", "0746 123456")
    await salva(r, "save-forn", "Premi «Aggiungi». Fatto!")
    await r.aspetta(2.5)

async def carte(r):
    await entra(r)
    await r.apri_voce("carte", "Apri «Tutto il resto» e premi «Carte».")
    await r.dici("Qui segni le carte aziendali e le spese fatte con ognuna.")
    await r.aspetta(2.6)
    await nuovo(r, "carte", "new-carta", "Premi «+ Aggiungi la prima carta».")
    await r.dici("Dai un nome alla carta.")
    await r.scrivi("#ct-nome", "Carta cantiere")
    await salva(r, "save-carta", "Premi «Crea». Fatto!")
    await r.aspetta(2.5)

async def report(r):
    await entra(r)
    await r.apri_voce("report", "Apri «Tutto il resto» e premi «Report».")
    await r.dici("Qui vedi quanto hai incassato e quanto hai speso.")
    await r.aspetta(3.2)
    await r.dici("Lavoro per lavoro, vedi quanto ci hai guadagnato davvero.")
    await r.aspetta(3.2)
    await r.dici("Con «Scarica il report» lo porti al commercialista.")
    await r.vai_su(r.pg.locator('section#report [data-action="report-csv"]:visible'))
    await r.aspetta(3)

async def galleria(r):
    await entra(r)
    await r.apri_voce("galleria", "Apri «Tutto il resto» e premi «Galleria».")
    await r.dici("Qui ci sono le foto e i video dei cantieri.")
    await r.aspetta(2.6)
    await r.dici("Premi «Carica foto o video» per aggiungerne.")
    await r.vai_su(r.pg.locator('section#galleria [data-action="gal-nuovo"]:visible'))
    await r.aspetta(2.8)
    await r.dici("Le dividi in «prima del lavoro» e «a lavoro finito».")
    await r.vai_su(r.pg.locator('section#galleria [data-action="gal-tipo"]:visible').nth(1))
    await r.aspetta(3)

async def cestino(r):
    await entra(r)
    await r.apri_voce("cestino", "Apri «Tutto il resto» e premi «Cestino».")
    await r.dici("Qui finisce quello che butti. Niente è perso.")
    await r.aspetta(2.8)
    await r.dici("Hai buttato qualcosa per sbaglio? Premi «Rimetti a posto».")
    await r.clicca('section#cestino [data-action="cest-ripristina"]:visible')
    await r.aspetta(2)
    await r.dici("È tornato al suo posto. Fatto!")
    await r.aspetta(2.6)

async def richieste(r):
    await entra(r)
    await r.apri_voce("richieste", "In fondo al menu premi «Chiedi una funzione».")
    await r.dici("Ti manca qualcosa nel gestionale? Scrivilo qui.")
    await r.scrivi("section#richieste textarea:visible", "Vorrei segnare i chilometri del furgone")
    await salva(r, "save-richiesta", "Premi «Manda la richiesta». La costruiamo noi.")
    await r.aspetta(2.6)

async def assistenza(r):
    await entra(r)
    await r.apri_voce("assistenza", "In fondo al menu premi «Assistenza diretta».")
    await r.dici("Hai un problema? Scrivi qui. Ti rispondiamo di persona.")
    await r.scrivi("section#assistenza textarea:visible", "Come cambio il logo sui preventivi?")
    await salva(r, "asst-invia", "Premi «Invia». La risposta arriva qui.")
    await r.aspetta(2.6)

COPIONI = {f.__name__: f for f in [preventivi, computi, lavori, fatture, clienti, calendario,
           giornate, dalsito, promemoria, scadenzario, agenda, squadra, mezzi, attrezzature, fisco,
           prezzario, sal, fornitori, carte, report, galleria, cestino, richieste, assistenza]}


# ─── il montaggio ──────────────────────────────────────────────────────────
def ass_tempo(s):
    s = max(0, s); h = int(s // 3600); m = int(s % 3600 // 60); c = s % 60
    return f"{h}:{m:02d}:{c:05.2f}"

def scrivi_ass(sub, path, ox, oy, fs=40, mv=38):
    testa = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {ox}
PlayResY: {oy}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sotto,Inter,{fs},&H00FFFFFF,&H00FFFFFF,&H004D2A0A,&H004D2A0A,1,0,0,0,100,100,0,0,1,0,0,2,30,30,{mv},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    righe = [f"Dialogue: 0,{ass_tempo(a)},{ass_tempo(b)},Sotto,,0,0,0,,{t}" for a, b, t in sub]
    open(path, "w").write(testa + "\n".join(righe) + "\n")

def scrivi_vtt(sub, path):
    def vt(s):
        h = int(s // 3600); m = int(s % 3600 // 60); c = s % 60
        return f"{h:02d}:{m:02d}:{c:06.3f}"
    out = ["WEBVTT", ""]
    for i, (a, b, t) in enumerate(sub, 1):
        out += [str(i), f"{vt(a)} --> {vt(b)}", t, ""]
    open(path, "w").write("\n".join(out))


async def registra(nome, tel=False):
    os.makedirs(OUT, exist_ok=True)
    file = nome + ("-tel" if tel else "")
    tmp = os.path.join(OUT, "_grezzo_" + file); os.makedirs(tmp, exist_ok=True)
    vw, vh = (540, 1168) if tel else (W, H)
    rec = {"width": vw, "height": vh}
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--lang=it"], env={**os.environ, "LANG": "it_IT.UTF-8", "LANGUAGE": "it"})
        ctx = await b.new_context(viewport={"width": vw, "height": vh}, record_video_dir=tmp,
                                  record_video_size=rec, locale="it-IT",
                                  device_scale_factor=1)
        await ctx.add_init_script(CURSORE)
        pg = await ctx.new_page(); pg.set_default_timeout(8000)
        async def route(rt):
            u = rt.request.url
            if "supabase-js" in u:
                return await rt.fulfill(status=200, content_type="application/javascript", body=FAKE)
            if "localhost" in u or "127.0.0.1" in u:
                return await rt.continue_()
            return await rt.abort()
        await pg.route("**/*", route)
        errori = []
        pg.on("pageerror", lambda e: errori.append(str(e)))
        avvio = time.monotonic()
        await pg.goto(SITO + "/gestionale-app.html?chiave=apri", wait_until="domcontentloaded")
        await pg.wait_for_timeout(2500)
        await pg.mouse.move(vw / 2, vh / 2)
        r = Regia(pg, tel); r.t0 = time.monotonic()
        taglio = r.t0 - avvio
        await COPIONI[nome](r)
        await r.fine()
        video = await pg.video.path()
        await ctx.close(); await b.close()
    if errori: print("ERRORI NELLA PAGINA:", nome, errori[:5])
    # montaggio: taglio dell'avvio, 1280x720, fascia blu da 120 px coi sottotitoli
    if tel:
        ox, oy, sw, sh, fs, mv = 540, 1430, 540, 1168, 34, 70
    else:
        ox, oy, sw, sh, fs, mv = 1280, 840, 1280, 720, 40, 38
    ass = os.path.join(tmp, "sotto.ass"); scrivi_ass(r.sub, ass, ox, oy, fs, mv)
    mp4 = os.path.join(OUT, file + ".mp4")
    vf = f"scale={sw}:{sh},pad={ox}:{oy}:0:0:color=0x0a2a4d,ass={ass}"
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{taglio:.2f}", "-i", video]
    for _, w in r.voci: cmd += ["-i", w]
    if r.voci:
        fc = f"[0:v]{vf}[v];" + "".join(f"[{i+1}:a]adelay={int(t*1000)}:all=1[a{i}];" for i, (t, _) in enumerate(r.voci))
        fc += "".join(f"[a{i}]" for i in range(len(r.voci))) + f"amix=inputs={len(r.voci)}:normalize=0[a]"
        cmd += ["-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-c:a", "aac", "-b:a", "96k"]
    else:
        cmd += ["-vf", vf, "-an"]
    cmd += ["-r", "30", "-c:v", "libx264", "-preset", "veryfast", "-crf", "26",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4]
    subprocess.run(cmd, check=True)
    print("fatto:", file, f"{r.sub[-1][1]:.1f}s", os.path.getsize(mp4) // 1024, "KB")


if __name__ == "__main__":
    arg = sys.argv[1:]
    modi = [False, True]
    if "--solo-pc" in arg: modi = [False]
    if "--solo-tel" in arg: modi = [True]
    arg = [a for a in arg if not a.startswith("--")]
    voci = list(COPIONI) if arg == ["tutti"] else arg
    carica_voce()
    for v in voci:
        for t in modi:
            try:
                asyncio.run(registra(v, t))
            except Exception as e:
                print("NON RIUSCITO:", v, "tel" if t else "pc", str(e).splitlines()[0][:200])
    fatti = sorted(f[:-4] for f in os.listdir(OUT) if f.endswith(".mp4") and not f.endswith("-tel.mp4"))
    json.dump(fatti, open(os.path.join(OUT, "elenco.json"), "w"))
    print("elenco:", fatti)
