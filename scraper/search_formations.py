import requests, json
BASE='https://api.traininginformation.cm'
headers={'User-Agent':'Mozilla/5.0'}
for q in ['informatique','marketing','finance','sante','vente','ingenierie','communication','juridique','ressources humaines','design']:
    r=requests.get(BASE+'/formations', headers=headers, params={'search':q}, timeout=30)
    print('\nsearch=',q,'status', r.status_code)
    try:
        j=r.json()
        count = len(j.get('data',[])) if isinstance(j, dict) else 0
        print('found', count)
        if count>0:
            print(json.dumps(j['data'][0], indent=2)[:400])
    except Exception as e:
        print('err', e)
