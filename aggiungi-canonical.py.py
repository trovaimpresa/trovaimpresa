import re, glob

files = glob.glob("*.html")
modificati, saltati = 0, []

for f in files:
    with open(f, "r", encoding="utf-8") as file:
        html = file.read()
    if 'rel="canonical"' in html:
        saltati.append(f + " (gia' presente)")
        continue
    canonical = f'  <link rel="canonical" href="https://trovaimpresa.com/{f}">\n'
    nuovo = re.sub(r'(<head>)', r'\1\n' + canonical, html, count=1)
    if nuovo == html:
        saltati.append(f + " (head non trovato)")
        continue
    with open(f, "w", encoding="utf-8") as file:
        file.write(nuovo)
    modificati += 1

print(f"Modificati: {modificati} file")
for s in saltati: print("  -", s)