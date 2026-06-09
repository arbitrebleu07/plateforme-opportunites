"""
Scraper pour Opportunity Desk
Site: https://www.opportunitydesk.org
Type: Bourses/Concours
"""

from base_scraper import BaseScraper
from bs4 import BeautifulSoup
import logging

class OpportunityDeskScraper(BaseScraper):
    """
    Scraper spécifique pour Opportunity Desk
    Récupère les bourses et opportunités internationales
    """
    
    def __init__(self, config):
        super().__init__(config)
        self.base_url = config['SOURCES']['opportunity_desk']['url']
        self.source_name = config['SOURCES']['opportunity_desk']['name']
        self.offer_type = config['SOURCES']['opportunity_desk']['type']
    
    def scrape_opportunities(self, limit=20):
        """
        Scrape les opportunités depuis la page d'accueil
        
        Args:
            limit: Nombre maximum d'opportunités à récupérer
        
        Returns:
            Liste de dictionnaires contenant les données des opportunités
        """
        self.logger.info(f"Début du scraping de {self.source_name}")
        
        # Récupérer la page d'accueil
        soup = self.get_page(self.base_url, delay=self.config['SOURCES']['opportunity_desk']['delay'])
        
        if not soup:
            self.logger.error("Impossible de récupérer la page d'accueil")
            return []
        
        opportunities = []
        
        # Sélecteurs CSS adaptés à la structure réelle d'Opportunity Desk
        # Les articles sont dans des éléments <article> avec différentes classes
        articles = soup.find_all('article', class_=lambda x: x and ('l-post' in x))[:limit]
        
        for article in articles:
            try:
                opportunity = self._extract_opportunity_data(article)
                if opportunity:
                    opportunities.append(opportunity)
                    self.logger.info(f"Opportunité récupérée: {opportunity['titre']}")
            except Exception as e:
                self.logger.error(f"Erreur lors de l'extraction d'une opportunité: {e}")
                continue
        
        self.logger.info(f"Scraping terminé: {len(opportunities)} opportunités récupérées")
        return opportunities
    
    def _extract_opportunity_data(self, article):
        """
        Extrait les données d'une opportunité depuis un élément article
        
        Args:
            article: Élément BeautifulSoup représentant une opportunité
        
        Returns:
            Dictionnaire avec les données de l'opportunité
        """
        # Titre - peut être h2 ou h4 selon le type de post
        title_element = article.find('h2', class_='post-title') or article.find('h4', class_='post-title')
        if not title_element:
            title_element = article.find('h2', class_='is-title') or article.find('h4', class_='is-title')
        titre = self.clean_text(title_element.get_text()) if title_element else "Sans titre"
        
        # Lien vers l'opportunité - chercher dans le titre ou le media
        link_element = title_element.find('a', href=True) if title_element else None
        if not link_element:
            link_element = article.find('a', href=True)
        lien = link_element['href'] if link_element else ""
        
        # Description/extrait
        excerpt_element = article.find('div', class_='excerpt')
        if excerpt_element:
            description = self.clean_text(excerpt_element.get_text())
        else:
            # Fallback: prendre le premier paragraphe
            p_element = article.find('p')
            description = self.clean_text(p_element.get_text()) if p_element else ""
        
        # Si toujours vide, utiliser une description par défaut
        if not description or len(description) < 10:
            description = f"Opportunité: {titre}. Visitez le lien pour plus de détails."
        
        # Date de publication
        date_element = article.find('time', class_='post-date')
        date_publication = self._extract_date(date_element) if date_element else None
        
        # Catégorie (si disponible)
        category_element = article.find('a', rel='category')
        categorie = self.clean_text(category_element.get_text()) if category_element else "Bourse"
        
        # Construire le dictionnaire de données
        opportunity = {
            'titre': titre,
            'description': description[:500] + "..." if len(description) > 500 else description,  # Limiter la description
            'type': self.offer_type,
            'entreprise': self.source_name,  # La source comme "entreprise"
            'localisation': 'International',  # Par défaut pour Opportunity Desk
            'date_limite': None,  # À extraire si disponible
            'date_publication': date_publication,
            'source': self.source_name,
            'url_source': lien,
            'categories': [categorie] if categorie else []
        }
        
        return opportunity
    
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
        
        from datetime import datetime
        
        # Essayer d'abord l'attribut datetime (format ISO: 2026-05-30T18:39:03+00:00)
        date_str = date_element.get('datetime')
        if date_str:
            try:
                # Extraire juste la partie date (YYYY-MM-DD)
                return date_str.split('T')[0]
            except:
                pass
        
        # Fallback: essayer de parser le texte (format: "May 30, 2026")
        date_text = self.clean_text(date_element.get_text())
        if date_text:
            try:
                # Parser le format "Month Day, Year"
                date_obj = datetime.strptime(date_text, '%B %d, %Y')
                return date_obj.strftime('%Y-%m-%d')
            except:
                pass
        
        # Dernier fallback: retourner la date actuelle
        return datetime.now().strftime('%Y-%m-%d')
