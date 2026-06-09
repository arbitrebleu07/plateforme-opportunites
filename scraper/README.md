# Scraper - Plateforme d'Opportunités

Ce scraper Python récupère automatiquement des opportunités (bourses, emplois, stages) depuis plusieurs sources web et les envoie à l'API Laravel de la plateforme.

## 📋 Sources

Le scraper récupère des données depuis :
- **Opportunity Desk** : Bourses et opportunités internationales
- **Scholarship Positions** : Bourses académiques et concours
- **Jooble** : Offres d'emploi

## 🛠️ Technologies

- **Python 3.8+**
- **Requests** : Pour les requêtes HTTP simples
- **BeautifulSoup4** : Pour le parsing HTML
- **Selenium** : Pour les sites avec JavaScript
- **WebDriver Manager** : Gestion automatique des drivers Chrome

## 📦 Installation

### Prérequis

1. Python 3.8 ou supérieur installé
2. Chrome/Chromium installé (pour Selenium)
3. API Laravel en cours d'exécution (http://127.0.0.1:8000)

### Étapes d'installation

```bash
# Naviguer vers le dossier scraper
cd scraper

# Installer les dépendances
pip install -r requirements.txt
```

## ⚙️ Configuration

Éditez le fichier `config.py` pour configurer :

### Base de données MySQL
```python
DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'database': 'plateforme_opportunites',
    'user': 'root',
    'password': '',  # Votre mot de passe MySQL
}
```

### API Laravel
```python
LARAVEL_API = {
    'base_url': 'http://127.0.0.1:8000/api',
    'token': None,  # Token d'authentification (optionnel)
}
```

### Sources
```python
SOURCES = {
    'opportunity_desk': {
        'enabled': True,  # Activer/désactiver le scraper
        'delay': 2,  # Délai entre les requêtes (secondes)
    },
    # ...
}
```

### Selenium
```python
SELENIUM_CONFIG = {
    'headless': True,  # True = sans interface, False = navigateur visible
    'window_size': (1920, 1080),
    'timeout': 30,
}
```

## 🚀 Utilisation

### Exécuter le scraper

```bash
python main.py
```

### Ce que fait le scraper

1. **Initialise** tous les scrapers activés
2. **Scrape** les opportunités depuis chaque source
3. **Sauvegarde** les données dans `opportunities.json`
4. **Envoie** les données à l'API Laravel (si activé)

### Sortie

- **Fichier JSON** : `opportunities.json` contient toutes les opportunités récupérées
- **Logs** : `scraper.log` contient les logs d'exécution
- **Console** : Affichage en temps réel du progrès

## 📁 Structure du projet

```
scraper/
├── main.py                          # Point d'entrée principal
├── config.py                        # Configuration
├── base_scraper.py                  # Classe de base des scrapers
├── requirements.txt                 # Dépendances Python
├── README.md                        # Documentation
├── scrapers/                        # Package des scrapers
│   ├── __init__.py
│   ├── opportunity_desk_scraper.py  # Scraper Opportunity Desk
│   ├── scholarship_positions_scraper.py  # Scraper Scholarship Positions
│   └── jooble_scraper.py            # Scraper Jooble
├── opportunities.json               # Sortie JSON (généré)
└── scraper.log                      # Logs (généré)
```

## 🔧 Personnalisation

### Ajouter un nouveau scraper

1. Créer un nouveau fichier dans `scrapers/`
2. Hériter de `BaseScraper`
3. Implémenter les méthodes de scraping
4. Ajouter le scraper dans `config.py`
5. Importer et initialiser dans `main.py`

Exemple :
```python
from base_scraper import BaseScraper

class MonScraper(BaseScraper):
    def scrape(self):
        # Votre logique de scraping ici
        pass
```

### Adapter les sélecteurs CSS

Les sélecteurs CSS dans les scrapers sont des exemples génériques. Pour les adapter :

1. Ouvrez le site cible dans un navigateur
2. Utilisez l'inspecteur d'éléments (F12)
3. Identifiez les sélecteurs CSS des éléments à extraire
4. Mettez à jour les méthodes `_extract_*_data()` dans les scrapers

## 🤝 Intégration avec Laravel

### Activer l'envoi à l'API

Dans `main.py`, décommentez cette ligne :
```python
self.send_to_laravel(opportunities)
```

### Authentification

Si votre API Laravel nécessite une authentification :

1. Configurez le token dans `config.py`
2. Le token sera automatiquement ajouté aux headers

## 📊 Format des données

Chaque opportunité est un dictionnaire avec :

```python
{
    'titre': 'Titre de l\'opportunité',
    'description': 'Description...',
    'type': 'bourses/concours' ou 'emploi',
    'entreprise': 'Nom de l\'entreprise/source',
    'localisation': 'Localisation',
    'date_limite': 'YYYY-MM-DD' ou None,
    'date_publication': 'YYYY-MM-DD' ou None,
    'source': 'Nom de la source',
    'url_source': 'URL de l\'opportunité originale',
    'categories': ['Catégorie1', 'Catégorie2']
}
```

## ⚠️ Notes importantes

### Rate Limiting

- Les délais entre les requêtes sont configurés pour éviter le blocage
- Ne réduisez pas trop les délais pour ne pas être bloqué par les sites

### Maintenance

- Les sélecteurs CSS peuvent changer avec le temps
- Surveillez les logs pour détecter les erreurs
- Mettez à jour les scrapers si les sites changent de structure

### Légalité

- Vérifiez les conditions d'utilisation de chaque site
- Respectez les robots.txt
- N'utilisez pas les données à des fins commerciales sans autorisation

## 🐛 Débogage

### Mode verbose

Changez le niveau de log dans `config.py` :
```python
LOG_CONFIG = {
    'level': 'DEBUG',  # Plus de détails
}
```

### Mode navigateur visible

Pour voir ce que fait Selenium :
```python
SELENIUM_CONFIG = {
    'headless': False,  # Navigateur visible
}
```

### Tester un seul scraper

Commentez les autres scrapers dans `main.py` ou désactivez-les dans `config.py`

## 📞 Support

Pour toute question ou problème :
- Vérifiez les logs dans `scraper.log`
- Consultez la documentation de BeautifulSoup et Selenium
- Vérifiez que l'API Laravel est accessible

## 📝 Licence

Ce scraper fait partie du projet Plateforme d'Opportunités.
