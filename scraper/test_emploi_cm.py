"""
Script de test pour analyser le HTML réel de Emploi.cm
"""

import requests
from bs4 import BeautifulSoup

try:
    # Charger la page avec requests
    url = "https://www.emploi.cm/"
    print(f"Chargement de {url}...")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    response = requests.get(url, headers=headers, timeout=30)
    html = response.text
    soup = BeautifulSoup(html, 'html.parser')
    
    # Sauvegarder le HTML pour analyse
    with open('emploi_cm_html.html', 'w', encoding='utf-8') as f:
        f.write(html)
    
    print("HTML sauvegardé dans emploi_cm_html.html")
    
    # Tester différents sélecteurs
    print("\n=== Test des sélecteurs CSS ===")
    
    # Sélecteur 1: last-offers-item
    cards1 = soup.find_all('div', class_='last-offers-item')
    print(f"div.last-offers-item: {len(cards1)} éléments")
    
    # Sélecteur 2: card
    cards2 = soup.find_all('div', class_='card')
    print(f"div.card: {len(cards2)} éléments")
    
    # Sélecteur 3: last-offers-item (avec data-href)
    cards3 = soup.find_all('div', attrs={'data-href': True})
    print(f"div[data-href]: {len(cards3)} éléments")
    
    # Sélecteur 4: last-offers-wrapper
    wrapper = soup.find('div', class_='last-offers-wrapper')
    if wrapper:
        print(f"div.last-offers-wrapper: trouvé")
        cards4 = wrapper.find_all('div', class_='card')
        print(f"  -> div.card à l'intérieur: {len(cards4)} éléments")
    else:
        print("div.last-offers-wrapper: non trouvé")
    
    # Sélecteur 5: article
    cards5 = soup.find_all('article')
    print(f"article: {len(cards5)} éléments")
    
    # Sélecteur 6: last-offers
    section = soup.find('section', class_='last-offers')
    if section:
        print(f"section.last-offers: trouvé")
        cards6 = section.find_all('div', class_='card')
        print(f"  -> div.card à l'intérieur: {len(cards6)} éléments")
    else:
        print("section.last-offers: non trouvé")
    
    # Afficher les classes trouvées
    print("\n=== Classes uniques trouvées ===")
    all_divs = soup.find_all('div')
    classes = set()
    for div in all_divs:
        if div.get('class'):
            classes.update(div.get('class'))
    
    for cls in sorted(classes):
        print(f"  .{cls}")
    
except Exception as e:
    print(f"Erreur: {e}")
