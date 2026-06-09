"""
Scraper pour Emploi.cm
Site: https://www.emploi.cm
Type: Stages et emplois
Récupère les offres de stage et d'emploi
"""

from base_scraper import BaseScraper
from bs4 import BeautifulSoup
import logging
from datetime import datetime

class EmploisCmScraper(BaseScraper):
    """
    Scraper spécifique pour Emploi.cm
    Récupère les offres de stage et d'emploi
    """
    
    def __init__(self, config):
        super().__init__(config)
        self.base_url = config['SOURCES']['emplois_cm']['url']
        self.source_name = config['SOURCES']['emplois_cm']['name']
        self.offer_type = config['SOURCES']['emplois_cm']['type']
    
    def scrape_jobs(self, job_type="stage", limit=20):
        """
        Scrape les offres depuis Emplois.cm
        
        Args:
            job_type: Type d'offre (ex: "stage", "emploi")
            limit: Nombre maximum d'offres à récupérer
        
        Returns:
            Liste de dictionnaires contenant les données des offres
        """
        self.logger.info(f"Début du scraping de {self.source_name}")
        
        # URL de la page d'accueil qui contient les dernières offres
        search_url = f"{self.base_url}/"
        
        # Récupérer la page avec requests
        soup = self.get_page(search_url, delay=self.config['SOURCES']['emplois_cm']['delay'])
        
        if not soup:
            self.logger.error("Impossible de récupérer la page")
            return []
        
        jobs = []
        
        # Les sélecteurs CSS pour Emplois.cm basés sur le HTML fourni
        job_cards = soup.find_all('div', class_='last-offers-item')[:limit]
        
        self.logger.info(f"{len(job_cards)} cartes trouvées sur la page")
        
        for i, card in enumerate(job_cards):
            try:
                self.logger.info(f"Traitement de la carte {i+1}/{len(job_cards)}")
                job = self._extract_job_data(card)
                if job:
                    jobs.append(job)
                    self.logger.info(f"Offre récupérée: {job['titre']}")
                else:
                    self.logger.warning(f"Carte {i+1}: aucune donnée extraite")
            except Exception as e:
                self.logger.error(f"Erreur lors de l'extraction de la carte {i+1}: {e}")
                continue
        
        self.logger.info(f"Scraping terminé: {len(jobs)} offres récupérées")
        return jobs
    
    def _extract_job_data(self, card):
        """
        Extrait les données d'une offre depuis un élément carte
        
        Args:
            card: Élément BeautifulSoup représentant une offre
        
        Returns:
            Dictionnaire avec les données de l'offre
        """
        # Titre (dans h3 > a)
        details_div = card.find('div', class_='last-offers-details')
        if details_div:
            title_element = details_div.find('h3')
            if title_element:
                title_link = title_element.find('a')
                titre = self.clean_text(title_link.get_text()) if title_link else "Sans titre"
                lien = title_link['href'] if title_link and title_link.get('href') else ""
            else:
                titre = "Sans titre"
                lien = ""
        else:
            titre = "Sans titre"
            lien = ""
        
        # Compléter le lien si nécessaire
        if lien and not lien.startswith('http'):
            lien = f"{self.base_url}{lien}"
        
        # Description et entreprise (dans p.job-recruiter)
        if details_div:
            recruiter_p = details_div.find('p', class_='job-recruiter')
            if recruiter_p:
                # Date (dans span)
                date_span = recruiter_p.find('span')
                date_str = self.clean_text(date_span.get_text()) if date_span else ""
                date_publication = self._extract_date_from_string(date_str)
                
                # Entreprise (dans strong > a.company-name)
                company_link = recruiter_p.find('a', class_='company-name')
                entreprise = self.clean_text(company_link.get_text()) if company_link else ""
                
                # Description (après le <br/>)
                description = ""
                if recruiter_p.find('br'):
                    # Récupérer le texte après le <br>
                    br_tag = recruiter_p.find('br')
                    description = self.clean_text(br_tag.next_sibling) if br_tag.next_sibling else ""
                
                # Fallback pour description vide
                if not description or len(description) < 10:
                    description = f"Offre: {titre}. Visitez le lien pour plus de détails."
            else:
                description = f"Offre: {titre}. Visitez le lien pour plus de détails."
                entreprise = ""
                date_publication = datetime.now().strftime('%Y-%m-%d')
        else:
            description = f"Offre: {titre}. Visitez le lien pour plus de détails."
            entreprise = ""
            date_publication = datetime.now().strftime('%Y-%m-%d')
        
        # Localisation (dans p.last-offers-region)
        if details_div:
            region_p = details_div.find('p', class_='last-offers-region')
            localisation = self.clean_text(region_p.get_text()) if region_p else "Cameroun"
            # Nettoyer "Région de : " si présent
            localisation = localisation.replace("Région de : ", "")
        else:
            localisation = "Cameroun"
        
        # Construire le dictionnaire de données
        job = {
            'titre': titre,
            'description': description[:500] + "..." if len(description) > 500 else description,
            'type': self.offer_type,
            'entreprise': entreprise if entreprise else self.source_name,
            'localisation': localisation if localisation else "Cameroun",
            'date_limite': None,
            'date_publication': date_publication,
            'source': self.source_name,
            'url_source': lien,
            'categories': ['Stage']
        }
        
        return job
    
    def _extract_date_from_string(self, date_str):
        """
        Extrait la date depuis une chaîne de caractères (format: DD.MM.YYYY)
        
        Args:
            date_str: Chaîne de date (ex: "29.05.2026")
        
        Returns:
            Date au format YYYY-MM-DD ou None
        """
        if not date_str:
            return None
        
        try:
            # Parser le format DD.MM.YYYY
            parts = date_str.split('.')
            if len(parts) == 3:
                day, month, year = parts
                return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
        except:
            pass
        
        # Fallback: date actuelle
        return datetime.now().strftime('%Y-%m-%d')
    
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
        
        try:
            # Parser selon le format de date du site
            return datetime.now().strftime('%Y-%m-%d')
        except:
            return None
