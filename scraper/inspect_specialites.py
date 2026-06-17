import requests

DESIRED = {
    'Informatique': ['informatique','computer','web','dev','développement','developp','maintenance','réseau','reseaux','architecture','sécurité','pentester','webmestre','concepteur','developpeur','systeme','systéme','système','maintenance informatique','deloppeur'],
    'Marketing': ['marketing','market','marketeur','e-business','digital marketing','marketing and e-business','marketeur digital','marketing et relation'],
    'Finance': ['finance','comptabilit','banque','tresorerie','financ','audit','analyste financier','contrôle de gestion','controle de gestion','comptabilité'],
    'Ressources Humaines': ['ressources humaines','human resource','gestion des ressources humaines','rh','human resource and administration'],
    'Vente': ['vente','vendeur','commercial','commerce','vendeur en','vendeur','auxiliaire de vente','relation client','gestion clientèle','retail','magasinier'],
    'Ingénierie': ['ingénier','ingenier','genie','engineering','civil','mécanique','electr','électr','electro','electro','technicien','technologie','engineering'],
    'Design': ['design','graphisme','infographie','graphic','web design','production of graphic design','graphic arts','designing','infographie','webdesign','montage audiovisuel','production of graphic design','production of graphic design'],
    'Communication': ['communication','relation publique','relations publiques','relation publique','internet et reseaux sociaux','réseaux sociaux','communication commerciale','communication et relations publiques','reportage','relation publique'],
    'Juridique': ['jurid','droit','legal','juridique','droit des','secretariat juridique','consultant juridique','conseil juridique','droit des affaires','droit commercial'],
    'Santé': ['santé','paramédical','medical','kinésithérapie','délégué médical','ambulancier','pharmacie','auxiliaire de','soins','santé et','imagerie médicale','kine']
}

BASE = 'https://api.traininginformation.cm'
print('Fetching specialites...')
r = requests.get(BASE + '/specialites?page=1&limit=706', timeout=30)
r.raise_for_status()
j = r.json()
results = j.get('results') or j.get('data') or j

matches = {k: [] for k in DESIRED}

for item in results:
    lib = item.get('libelle','')
    lower = lib.lower()
    for cat, kws in DESIRED.items():
        for kw in kws:
            if kw in lower:
                matches[cat].append((item.get('id'), lib))
                break

for cat in matches:
    print('\n===', cat, '=>', len(matches[cat]), 'matches')
    for mid, mlib in matches[cat][:30]:
        print(mid, '|', mlib)

# Save to file for reference
with open('scraper/category_matches.json','w',encoding='utf-8') as f:
    import json
    json.dump(matches, f, ensure_ascii=False, indent=2)

print('\nSaved matches to scraper/category_matches.json')
