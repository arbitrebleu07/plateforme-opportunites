"""
Package scrapers
Contient tous les scrapers spécifiques pour chaque source
"""

from .opportunity_news_scraper import InfosConcoursEducationScraper, KamerpowerScraper
from .jooble_scraper import JoobleScraper
from .coursera_scraper import CourseraScraper
from .cameroon_jobs_scraper import EmploisCmScraper, MinaJobsScraper

__all__ = [
    'InfosConcoursEducationScraper',
    'KamerpowerScraper',
    'JoobleScraper',
    'CourseraScraper',
    'EmploisCmScraper',
    'MinaJobsScraper',
]
