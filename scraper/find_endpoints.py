import requests

url = 'https://traininginformation.cm/main.3f235826eab95bc5.js'
print('GET', url)
headers = {'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36'}
r = requests.get(url, timeout=30, headers=headers)
text = r.text
keys = ['/api', 'specialite', 'eftp', 'search', 'home', 'fetch', 'POST', 'formation', 'formations', 'offre', 'offres', 'programme', 'typeSecteursActivites', 'typeEnseignementsApiUrl']
for key in keys:
    print('\n### Searching for', key)
    i = 0
    found = 0
    while True:
        idx = text.find(key, i)
        if idx == -1:
            break
        found += 1
        start = max(0, idx-160)
        end = min(len(text), idx+160)
        snippet = text[start:end]
        print('\n-- occurrence', found, 'at', idx)
        # replace newlines for readability
        print(snippet.replace('\n',' '))
        i = idx + len(key)
    if found == 0:
        print('  (no occurrences)')
