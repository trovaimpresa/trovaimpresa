#!/usr/bin/env python3
"""
aggiorna-pagine-citta.py

Per ogni pagina imprese-<citta>.html nella cartella del progetto:
  1. legge il file e ricava il nome città dall'<h1>;
  2. genera con l'API Anthropic (claude-sonnet-4-6) un paragrafo unico
     (~80 parole) sul mercato edile locale;
  3. inserisce una nuova sezione <div class="section" id="settore-locale">
     con <h2>Il settore edile a <Città></h2> + paragrafo, subito prima di
     <div class="cta-box">;
  4. salva il file.

Idempotente: salta i file che contengono già id="settore-locale".
Richiede: pip install anthropic  +  variabile d'ambiente ANTHROPIC_API_KEY.
"""

import os
import re
import sys
from pathlib import Path

import anthropic

MODEL = "claude-sonnet-4-6"
ANCHOR = '  <div class="cta-box">'
SCRIPT_DIR = Path(__file__).resolve().parent

SYSTEM_PROMPT = (
    "Sei un copywriter SEO esperto del mercato edile italiano. "
    "Scrivi un unico paragrafo in italiano, di circa 80 parole, sul settore "
    "edile e delle costruzioni della città indicata. Sii concreto e specifico: "
    "fai riferimento a caratteristiche locali reali (tessuto urbano, tipologie "
    "edilizie ricorrenti, ristrutturazioni, riqualificazione/efficientamento "
    "energetico, eventuale contesto sismico, contesto economico del territorio). "
    "Rendi ogni testo diverso dagli altri, variando struttura e taglio. "
    "Non inventare statistiche, numeri o nomi di aziende. "
    "Non usare markdown, elenchi o titoli. "
    "Rispondi SOLO con il testo del paragrafo, senza preamboli né virgolette."
)

H1_RE = re.compile(
    r"<h1>\s*Imprese Edili e Artigiani a\s*(.+?)\s*</h1>",
    re.IGNORECASE | re.DOTALL,
)


def estrai_citta(html: str) -> str | None:
    m = H1_RE.search(html)
    return m.group(1).strip() if m else None


def genera_paragrafo(client: anthropic.Anthropic, citta: str) -> str:
    resp = client.messages.create(
        model=MODEL,
        max_tokens=400,
        thinking={"type": "disabled"},
        output_config={"effort": "low"},
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"Città: {citta}"}],
    )
    parti = [b.text for b in resp.content if b.type == "text"]
    return " ".join(t.strip() for t in parti).strip()


def costruisci_sezione(citta: str, paragrafo: str) -> str:
    return (
        '  <div class="section" id="settore-locale">\n'
        f"    <h2>Il settore edile a {citta}</h2>\n"
        f"    <p>{paragrafo}</p>\n"
        "  </div>\n\n"
    )


def main() -> int:
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ERRORE: imposta la variabile d'ambiente ANTHROPIC_API_KEY.", file=sys.stderr)
        return 1

    client = anthropic.Anthropic()
    files = sorted(SCRIPT_DIR.glob("imprese-*.html"))
    if not files:
        print("Nessun file imprese-*.html trovato.", file=sys.stderr)
        return 1

    aggiornati = saltati = errori = 0
    for path in files:
        html = path.read_text(encoding="utf-8")

        if 'id="settore-locale"' in html:
            print(f"= {path.name}: già presente, salto.")
            saltati += 1
            continue

        if ANCHOR not in html:
            print(f"! {path.name}: ancora cta-box non trovata, salto.")
            saltati += 1
            continue

        citta = estrai_citta(html)
        if not citta:
            print(f"! {path.name}: città non trovata nell'<h1>, salto.")
            saltati += 1
            continue

        try:
            paragrafo = genera_paragrafo(client, citta)
        except Exception as e:  # noqa: BLE001
            print(f"x {path.name}: errore API ({e}).", file=sys.stderr)
            errori += 1
            continue

        if not paragrafo:
            print(f"x {path.name}: paragrafo vuoto, salto.", file=sys.stderr)
            errori += 1
            continue

        nuovo = html.replace(ANCHOR, costruisci_sezione(citta, paragrafo) + ANCHOR, 1)
        path.write_text(nuovo, encoding="utf-8")
        print(f"+ {path.name}: sezione aggiunta ({citta}).")
        aggiornati += 1

    print(f"\nFatto. Aggiornati: {aggiornati} | Saltati: {saltati} | Errori: {errori}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
