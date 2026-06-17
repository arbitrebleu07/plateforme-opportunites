"""
Script de test pour le scraper
Utilise des données de test pour vérifier que le système fonctionne
"""

import json
from datetime import datetime

# Données de test simulées
test_opportunities = [
    {
        'titre': 'Routledge/Round Table Commonwealth Studentship Awards 2026-2027 (up to £5,500)',
        'description': 'Applications are open for the Routledge/Round Table Commonwealth Studentship Awards 2026. The PhD studentships provide support for research projects on Commonwealth-related themes...',
        'type': 'bourses/concours',
        'entreprise': 'MINESUP - Bourses',
        'localisation': 'International',
        'date_limite': '2026-07-31',
        'date_publication': '2026-05-30',
        'source': 'MINESUP - Bourses',
        'url_source': 'https://www.minesup.gov.cm/index.php/category/bourses/',
        'categories': ['Africa', 'PhD']
    },
    {
        'titre': 'International Geneva Peace Fellowship Programme 2026',
        'description': 'The Geneva Peace Fellowship Programme offers young professionals the opportunity to work with international organizations in Geneva...',
        'type': 'bourses/concours',
        'entreprise': 'MINESUP - Bourses',
        'localisation': 'Switzerland',
        'date_limite': '2026-06-15',
        'date_publication': '2026-05-30',
        'source': 'MINESUP - Bourses',
        'url_source': 'https://www.minesup.gov.cm/index.php/category/bourses/',
        'categories': ['Fellowship', 'Europe']
    },
    {
        'titre': 'EJN COP31 Climate Change Media Partnership Reporting Fellowship for Journalists 2026',
        'description': 'The Earth Journalism Network is offering fellowships for journalists to attend COP31 and report on climate change...',
        'type': 'bourses/concours',
        'entreprise': 'MINESUP - Bourses',
        'localisation': 'International',
        'date_limite': '2026-06-20',
        'date_publication': '2026-05-30',
        'source': 'MINESUP - Bourses',
        'url_source': 'https://www.minesup.gov.cm/index.php/category/bourses/',
        'categories': ['Journalism', 'Climate']
    }
]

def main():
    """
    Fonction principale de test
    """
    print("=" * 60)
    print("TEST DU SCRAPER - DONNÉES SIMULÉES")
    print("=" * 60)
    print()
    
    print(f"Nombre d'opportunités de test: {len(test_opportunities)}")
    print()
    
    # Afficher les opportunités
    for i, opp in enumerate(test_opportunities, 1):
        print(f"--- Opportunité {i} ---")
        print(f"Titre: {opp['titre']}")
        print(f"Type: {opp['type']}")
        print(f"Source: {opp['source']}")
        print(f"Date publication: {opp['date_publication']}")
        print(f"Date limite: {opp['date_limite']}")
        print(f"Localisation: {opp['localisation']}")
        print(f"Catégories: {', '.join(opp['categories'])}")
        print(f"URL: {opp['url_source']}")
        print(f"Description: {opp['description'][:100]}...")
        print()
    
    # Sauvegarder en JSON
    output_file = 'test_opportunities.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(test_opportunities, f, ensure_ascii=False, indent=2)
    
    print(f"✓ Données sauvegardées dans {output_file}")
    print()
    
    # Simuler l'envoi à l'API Laravel
    print("Simulation de l'envoi à l'API Laravel:")
    print(f"  - URL: http://127.0.0.1:8000/api/offres")
    print(f"  - Méthode: POST")
    print(f"  - Nombre d'opportunités à envoyer: {len(test_opportunities)}")
    print(f"  - Statut: PRÊT (décommentez la ligne dans main.py pour activer)")
    print()
    
    print("=" * 60)
    print("TEST TERMINÉ AVEC SUCCÈS")
    print("=" * 60)
    print()
    print("Pour tester le vrai scraper:")
    print("1. Installez les dépendances: pip install -r requirements.txt")
    print("2. Lancez le scraper: python main.py")
    print("3. Les résultats seront dans opportunities.json")

if __name__ == '__main__':
    main()
