import requests
BASE='https://api.traininginformation.cm'
headers={'User-Agent':'Mozilla/5.0'}
resp = requests.get(BASE+'/specialites', headers=headers, timeout=30).json()
results = resp.get('results', [])
substrs=['informat','mark','finance','ressource','rh','vente','ingeni','design','communic','jurid','sant']
for sub in substrs:
    matches = [r for r in results if sub in (r.get('libelle') or '').lower()]
    print('\n== contains', sub, 'matches:', len(matches))
    for m in matches[:10]:
        print(m.get('id'), m.get('libelle'))
