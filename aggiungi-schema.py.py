import re
import glob

def estrai_citta(html):
    m = re.search(r'<title>Imprese Edili e Artigiani a (.+?) —', html)
    return m.group(1).strip() if m else None

def costruisci_schema(citta):
    nome_file = citta.lower().replace(" ", "-").replace("'", "")
    return f'''<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "TrovaImpresa — {citta}",
  "url": "https://trovaimpresa.com/imprese-{nome_file}.html",
  "description": "Trova imprese edili, artigiani e professionisti verificati a {citta}. Preventivi gratuiti e recensioni reali.",
  "areaServed": {{ "@type": "City", "name": "{citta}" }},
  "parentOrganization": {{ "@type": "Organization", "name": "TrovaImpresa", "url": "https://trovaimpresa.com" }}
}}
</script>
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {{
      "@type": "Question",
      "name": "Come trovo un'impresa edile a {citta}?",
      "acceptedAnswer": {{ "@type": "Answer", "text": "Su TrovaImpresa puoi cercare imprese edili verificate a {citta}, confrontare i profili e richiedere preventivi gratuiti online." }}
    }},
    {{
      "@type": "Question",
      "name": "Quanto costa richiedere un preventivo a {citta}?",
      "acceptedAnswer": {{ "@type": "Answer", "text": "Richiedere preventivi su TrovaImpresa è gratuito per i clienti. Ricevi più offerte da professionisti di {citta} e scegli la migliore." }}
    }},
    {{
      "@type": "Question",
      "name": "Gli artigiani a {citta} sono verificati?",
      "acceptedAnswer": {{ "@type": "Answer", "text": "Sì, ogni artigiano e impresa su TrovaImpresa viene controllato prima della pubblicazione, con recensioni reali dei clienti." }}
    }}
  ]
}}
</script>
'''

files = glob.glob("imprese-*.html")
modificati = 0
saltati = []

for f in files:
    with open(f, "r", encoding="utf-8") as file:
        html = file.read()
    if 'LocalBusiness' in html:
        saltati.append(f + " (gia' presente)")
        continue
    citta = estrai_citta(html)
    if not citta:
        saltati.append(f + " (citta' non trovata)")
        continue
    schema = costruisci_schema(citta)
    nuovo = html.replace("</head>", schema + "</head>", 1)
    with open(f, "w", encoding="utf-8") as file:
        file.write(nuovo)
    modificati += 1

print(f"Modificati: {modificati} file")
if saltati:
    print("Saltati:")
    for s in saltati:
        print("  -", s)
