"""
Configuration du scraper
Ce fichier contient toutes les configurations nécessaires pour les scrapers
"""

import os

# Configuration de la base de données Laravel
DB_CONFIG = {
    'host': os.environ.get('DB_HOST', '127.0.0.1'),
    'port': int(os.environ.get('DB_PORT', 3306)),
    'database': os.environ.get('DB_DATABASE', 'plateforme_opportunites'),
    'user': os.environ.get('DB_USERNAME', 'root'),
    'password': os.environ.get('DB_PASSWORD', ''),
}

# Configuration de l'API Laravel
LARAVEL_API = {
    'base_url': os.environ.get('LARAVEL_API_URL', 'http://127.0.0.1:8000/api'),
    'token': os.environ.get('LARAVEL_API_TOKEN'),
}

# Configuration des sources
SOURCES = {
    'opportunity_desk': {
        'name': 'Opportunity Desk',
        'url': 'https://www.opportunitydesk.org',
        'type': 'bourses/concours',
        'enabled': True,
        'delay': 2,  # Délai en secondes entre les requêtes
    },
    'scholarship_positions': {
        'name': 'Scholarship Positions',
        'url': 'https://scholarship-positions.com',
        'type': 'bourses/concours',
        'enabled': True,
        'delay': 2,
    },
    'jooble': {
        'name': 'Jooble',
        'url': 'https://jooble.org',
        'type': 'emploi',
        'enabled': True,  # Activé: Utilise l'API REST Jooble
        'delay': 3,
    },
    'coursera': {
        'name': 'Coursera',
        'url': 'https://www.coursera.org',
        'type': 'formation',
        'enabled': True,  # Activé: Utilise l'API publique Coursera
        'delay': 2,
    },
    'emplois_cm': {
        'name': 'Emploi.cm',
        'url': 'https://www.emploi.cm',
        'type': 'stage',
        'enabled': True,  # Activé: Utilise requests (Selenium a des problèmes WinError 193)
        'delay': 2,
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
