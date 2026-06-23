"""
Configuration du scraper
Ce fichier contient toutes les configurations nécessaires pour les scrapers
"""

import os
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parent.parent / '.env')

# Configuration de la base de données Laravel
DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'database': 'plateforme_opportunites',
    'user': 'root',
    'password': '',  # Mettre votre mot de passe MySQL si nécessaire
}

# Configuration de l'API Laravel
LARAVEL_API = {
    'base_url': os.getenv('SCRAPER_API_URL', 'http://127.0.0.1:8000/api'),
    'key': os.getenv('SCRAPER_API_KEY', ''),
}

# Configuration HTTP commune. Un timeout de connexion court évite qu'une
# source indisponible bloque l'exécution de tous les autres scrapers.
HTTP_CONFIG = {
    'connect_timeout': 5,
    'read_timeout': 30,
    'retry_total': 3,
    'retry_connect': 2,
    'backoff_factor': 1,
}

# Configuration des sources
SOURCES = {
    'infos_concours_education': {
        'name': 'Infos Concours Education',
        'url': 'https://infosconcourseducation.com/',
        'listing_urls': [
            'https://infosconcourseducation.com/',
        ],
        'type': 'bourses/concours',
        'enabled': True,
        'delay': 6,
        'max_results': 20,
        'respect_robots_txt': True,
    },
    'kamerpower': {
        'name': 'Kamerpower',
        'url': 'https://kamerpower.com/',
        'listing_urls': [
            'https://kamerpower.com/upcoming-events/',
            'https://kamerpower.com/category/scholarships/',
        ],
        'type': 'bourses/concours',
        'enabled': True,
        'delay': 6,
        'max_results': 20,
        'respect_robots_txt': True,
    },
    'jooble': {
        'name': 'Jooble',
        'url': 'https://jooble.org',
        'type': 'emploi',
        'enabled': True,  # Activé: Utilise l'API REST Jooble
        'delay': 3,
    },
    'coursera': {
        'name': 'TrainingInformation - Formations',
        'url': 'https://traininginformation.cm/home/eftp',
        'type': 'formation',
        'enabled': True,
        'delay': 2,
        # Catégories à parcourir (utilisées via le paramètre `specialite`)
        'categories': [
            'Informatique',
            'Marketing',
            'Finance',
            'Ressources Humaines',
            'Vente',
            'Ingénierie',
            'Design',
            'Communication',
            'Juridique',
            'Santé'
        ]
    },
    'emplois_cm': {
        'name': 'Emploi.cm',
        'url': 'https://www.emploi.cm',
        'listing_urls': [
            'https://www.emploi.cm/recherche-jobs-cameroun',
        ],
        'enabled': True,
        'delay': 6,
        'max_results': 20,
        'respect_robots_txt': True,
    },
    'minajobs': {
        'name': 'MinaJobs',
        'url': 'https://www.minajobs.net',
        'listing_urls': [
            'https://www.minajobs.net/',
        ],
        'enabled': True,
        'delay': 6,
        'max_results': 20,
        'respect_robots_txt': True,
    }
}

# Configuration du navigateur Selenium
SELENIUM_CONFIG = {
    'headless': True,  # True = sans interface graphique, False = avec navigateur visible
    'window_size': (1920, 1080),
    'timeout': 30,  # Timeout en secondes
}

# Configuration des logs
LOG_CONFIG = {
    'level': 'INFO',  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    'file': 'scraper.log',
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
}

# Configuration du rate limiting
RATE_LIMIT = {
    'max_requests_per_minute': 30,
    'max_requests_per_hour': 500,  # Limite API Jooble : 500 requêtes
}
