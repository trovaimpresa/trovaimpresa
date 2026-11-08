"""Fa video/tutorial/frasi.json: tutte le frasi dei sottotitoli, in ordine di video,
per la pagina registra-voce.html. Le prende dai sottotitoli dell'ultima registrazione."""
import hashlib, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from registra import COPIONI, OUT
NOMI = {"riepilogo": "Assistente", "computi": "Computo da prezzare", "dalsito": "Richieste dal sito",
        "agenda": "Agenda operatore", "fisco": "Tasse e fisco", "sal": "Stati di avanzamento",
        "richieste": "Chiedi una funzione", "assistenza": "Assistenza diretta"}
def righe(nome):
    p = os.path.join(OUT, "_grezzo_" + nome, "sotto.ass")
    if not os.path.exists(p): return []
    return [re.sub(r"^.*?,,0,0,0,,", "", l.strip()) for l in open(p) if l.startswith("Dialogue")]
viste, frasi = {}, []
for v in COPIONI:
    for nome in (v, v + "-tel"):
        for t in righe(nome):
            i = hashlib.sha1(t.encode()).hexdigest()[:10]
            if i in viste:
                if v not in viste[i]["video"]: viste[i]["video"].append(v)
                continue
            viste[i] = {"id": i, "testo": t, "video": [v], "titolo": NOMI.get(v, v.capitalize())}
            frasi.append(viste[i])
dest = sys.argv[1] if len(sys.argv) > 1 else os.path.join(OUT, "frasi.json")
json.dump(frasi, open(dest, "w"), ensure_ascii=False, indent=0)
print(len(frasi), "frasi ->", dest)
