"""
Package scrapers
Contient tous les scrapers spécifiques pour chaque source
"""

from .opportunity_desk_scraper import OpportunityDeskScraper
from .scholarship_positions_scraper import ScholarshipPositionsScraper
from .jooble_scraper import JoobleScraper
from .coursera_scraper import CourseraScraper
from .emplois_cm_scraper import EmploisCmScraper

__all__ = [
    'OpportunityDeskScraper',
    'ScholarshipPositionsScraper',
    'JoobleScraper',
    'CourseraScraper',
    'EmploisCmScraper'
]
