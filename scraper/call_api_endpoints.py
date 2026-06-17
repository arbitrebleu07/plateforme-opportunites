import requests, json
BASE='https://api.traininginformation.cm'
headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36'}
for path in ['/specialites','/formations']:
    url=BASE+path
    print('\nGET', url)
    r=requests.get(url, headers=headers, timeout=30)
    print('status', r.status_code)
    try:
        j=r.json()
        print(json.dumps(j, indent=2)[:2000])
    except Exception as e:
        print('not json', e)
        print(len(r.text))
        print(r.text[:1000])
