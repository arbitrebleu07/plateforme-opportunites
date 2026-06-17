import requests
url_base = 'https://traininginformation.cm/'
js_files = [
    'runtime.aaa13d7e65254f33.js',
    'polyfills.1bcd5dc985b25ef3.js',
    'main.3f235826eab95bc5.js'
]

s = requests.Session()
s.headers.update({'User-Agent':'Mozilla/5.0'})

for js in js_files:
    try:
        r = s.get(url_base + js, timeout=30)
        print('==', js, 'status', r.status_code, 'len', len(r.text))
        text = r.text
        for kw in ['specialite', 'api', 'fetch', 'xhr', 'eftp', 'search', 'home', '/api', 'get', 'POST']:
            if kw in text:
                print('  contains', kw)
    except Exception as e:
        print('ERR', js, e)
