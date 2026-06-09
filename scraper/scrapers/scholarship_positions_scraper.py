"""
Scraper pour Scholarship Positions
Site: https://scholarship-positions.com
Type: Bourses/Concours
"""

from base_scraper import BaseScraper
from bs4 import BeautifulSoup
import logging

class ScholarshipPositionsScraper(BaseScraper):
    """
    Scraper spécifique pour Scholarship Positions
    Récupère les bourses et concours académiques
    """
    
    def __init__(self, config):
        super().__init__(config)
        self.base_url = config['SOURCES']['scholarship_positions']['url']
        self.source_name = config['SOURCES']['scholarship_positions']['name']
        self.offer_type = config['SOURCES']['scholarship_positions']['type']
    
    def scrape_scholarships(self, limit=20):
        """
        Scrape les bourses depuis la page d'accueil
        
        Args:
            limit: Nombre maximum de bourses à récupérer
        
        Returns:
            Liste de dictionnaires contenant les données des bourses
        """
        self.logger.info(f"Début du scraping de {self.source_name}")
        
        # Récupérer la page d'accueil
        soup = self.get_page(self.base_url, delay=self.config['SOURCES']['scholarship_positions']['delay'])
        
        if not soup:
            self.logger.error("Impossible de récupérer la page d'accueil")
            return []
        
        scholarships = []
        
        # Les sélecteurs CSS doivent être adaptés selon la structure réelle du site
        # Ce sont des exemples génériques
        
        # Exemple: trouver les articles/bourses
        # À adapter: .post, .scholarship-item, article, etc.
        articles = soup.find_all('article', class_='type-post')[:limit]
        
        for article in articles:
            try:
                scholarship = self._extract_scholarship_data(article)
                if scholarship:
                    scholarships.append(scholarship)
                    self.logger.info(f"Bourse récupérée: {scholarship['titre']}")
            except Exception as e:
                self.logger.error(f"Erreur lors de l'extraction d'une bourse: {e}")
                continue
        
        self.logger.info(f"Scraping terminé: {len(scholarships)} bourses récupérées")
        return scholarships
    
    def _extract_scholarship_data(self, article):
        """
        Extrait les données d'une bourse depuis un élément article
        
        Args:
            article: Élément BeautifulSoup représentant une bourse
        
        Returns:
            Dictionnaire avec les données de la bourse
        """
        # Titre
        title_element = article.find('h2', class_='entry-title') or article.find('h3')
        titre = self.clean_text(title_element.get_text()) if title_element else "Sans titre"
        
        # Lien vers la bourse
        link_element = article.find('a', href=True)
        lien = link_element['href'] if link_element else ""
        
        # Description/extrait
        excerpt_element = article.find('div', class_='entry-summary') or article.find('p')
        description = self.clean_text(excerpt_element.get_text()) if excerpt_element else ""
        
        # Date de publication
        date_element = article.find('time') or article.find('span', class_='posted-on')
        date_publication = self._extract_date(date_element) if date_element else None
        
        # Catégorie (si disponible)
        category_element = article.find('span', class_='cat-links') or article.find('a', rel='category')
        categorie = self.clean_text(category_element.get_text()) if category_element else "Bourse"
        
        # Pays/Localisation (si disponible)
        location_element = article.find('span', class_='location') or article.find('span', class_='country')
        localisation = self.clean_text(location_element.get_text()) if location_element else "International"
        
        # Construire le dictionnaire de données
        scholarship = {
            'titre': titre,
            'description': description[:500] + "..." if len(description) > 500 else description,
            'type': self.offer_type,
            'entreprise': self.source_name,
            'localisation': localisation,
            'date_limite': None,  # À extraire si disponible
            'date_publication': date_publication,
            'source': self.source_name,
            'url_source': lien,
            'categories': [categorie] if categorie else []
        }
        
        return scholarship
    
    def _extract_date(self, date_element):
        """
        Extrait la date depuis un élément HTML
        
        Args:
            date_element: Élément BeautifulSoup contenant une date
        
        Returns:
            Date au format YYYY-MM-DD ou None
        """
        if not date_element:
            return None
        
        date_str = date_element.get('datetime') or self.clean_text(date_element.get_text())
        
        # Adapter selon le format de date du site
        try:
            from datetime import datetime
            return datetime.now().strftime('%Y-%m-%d')
        except:
            return None
