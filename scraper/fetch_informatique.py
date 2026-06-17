import requests

url = 'https://traininginformation.cm/home/eftp'
params = {'regionName':'','tutelleSigle':'','specialite':'Informatique','departementName':'','arrondissementName':''}

s = requests.Session()
s.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': url
})

try:
    r = s.get(url, params=params, timeout=30)
    print('STATUS', r.status_code)
    open('scraper/tmp_informatique.html','wb').write(r.content)
    print('SAVED', len(r.content))
except Exception as e:
    print('ERR', e)
