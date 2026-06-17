import requests, json
BASE='https://api.traininginformation.cm'
headers={'User-Agent':'Mozilla/5.0'}
q='informatique'
r=requests.get(BASE+'/formations', headers=headers, params={'search':q}, timeout=30)
print('status', r.status_code)
try:
    j=r.json()
    print('data len', len(j.get('data',[])))
    if len(j.get('data',[]))>0:
        print(json.dumps(j.get('data')[0], indent=2)[:1000])
except Exception as e:
    print('err', e)
    print(r.text[:1000])
