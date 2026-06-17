"""
Scraper pour Jooble API
Site: https://jooble.org
Type: Emplois
Utilise l'API REST de Jooble pour récupérer les offres d'emploi
Limite API : 500 requêtes par heure
"""

import os
from base_scraper import BaseScraper
import requests
import logging
from datetime import datetime

class JoobleScraper(BaseScraper):
    """
    Scraper spécifique pour Jooble utilisant l'API REST
    Récupère les offres d'emploi via l'API Jooble
    Limite : 500 requêtes par heure
    """
    
    def __init__(self, config):
        super().__init__(config)
        self.api_key = os.environ.get('JOOBLE_API_KEY', '')
        self.api_url = f"https://jooble.org/api/{self.api_key}"
        self.source_name = config['SOURCES']['jooble']['name']
        self.offer_type = config['SOURCES']['jooble']['type']
    
    def scrape_jobs(self, search_query="developer", location="", limit=20):
        """
        Récupère les offres d'emploi depuis l'API Jooble
        
        Args:
            search_query: Terme de recherche (ex: "developer", "marketing")
            location: Localisation (ex: "Paris", "Remote")
            limit: Nombre maximum d'offres à récupérer
        
        Returns:
            Liste de dictionnaires contenant les données des offres
        """
        self.logger.info(f"Début du scraping de {self.source_name} - Recherche: {search_query}")
        
        # Préparer les données pour l'API
        payload = {
            "keywords": search_query,
            "page": "1",
            "ResultOnPage": str(limit)
        }
        
        if location:
            payload["location"] = location
        
        try:
            # Appel à l'API Jooble
            response = requests.post(self.api_url, json=payload, timeout=30)
            
            if response.status_code != 200:
                self.logger.error(f"Erreur API Jooble: {response.status_code} - {response.text}")
                return []
            
            data = response.json()
            
            if 'jobs' not in data:
                self.logger.warning("Aucune offre trouvée dans la réponse API")
                return []
            
            jobs = []
            
            for job_data in data['jobs'][:limit]:
                try:
                    job = self._extract_job_data(job_data)
                    if job:
                        jobs.append(job)
                        self.logger.info(f"Offre récupérée: {job['titre']}")
                except Exception as e:
                    self.logger.error(f"Erreur lors de l'extraction d'une offre: {e}")
                    continue
            
            self.logger.info(f"Scraping terminé: {len(jobs)} offres récupérées (Total: {data.get('totalCount', 0)})")
            return jobs
            
        except Exception as e:
            self.logger.error(f"Erreur lors de l'appel à l'API Jooble: {e}")
            return []
    
    def _extract_job_data(self, job_data):
        """
        Extrait les données d'une offre depuis la réponse API Jooble
        
        Args:
            job_data: Dictionnaire JSON de l'API Jooble
        
        Returns:
            Dictionnaire avec les données de l'offre
        """
        # Titre
        titre = job_data.get('title', 'Sans titre')
        
        # Lien vers l'offre
        lien = job_data.get('link', '')
        
        # Description/extrait
        description = job_data.get('snippet', '')
        if not description or len(description) < 10:
            description = f"Offre d'emploi: {titre}. Visitez le lien pour plus de détails."
        
        # Entreprise
        entreprise = job_data.get('company', '')
        if not entreprise:
            entreprise = job_data.get('source', self.source_name)
        
        # Localisation
        localisation = job_data.get('location', 'Non spécifié')
        
        # Date de publication
        date_publication = self._extract_date(job_data.get('updated'))
        
        # Type de job (full-time, part-time, etc.)
        job_type = job_data.get('type', '')
        categories = [job_type] if job_type else ['Emploi']
        
        # Salaire (optionnel)
        salary = job_data.get('salary', '')
        
        # Construire le dictionnaire de données
        job = {
            'titre': titre,
            'description': description[:500] + "..." if len(description) > 500 else description,
            'type': self.offer_type,
            'entreprise': entreprise if entreprise else self.source_name,
            'localisation': localisation,
            'date_limite': None,  # Non disponible dans l'API
            'date_publication': date_publication,
            'source': self.source_name,
            'url_source': lien,
            'categories': categories
        }
        
        return job
    
    def _extract_date(self, date_str):
        """
        Extrait la date depuis la chaîne de l'API Jooble
        
        Args:
            date_str: Chaîne de date (format ISO: 2023-09-15T12:55:35.3870000)
        
        Returns:
            Date au format YYYY-MM-DD ou None
        """
        if not date_str:
            return None
        
        try:
            # Parser le format ISO de Jooble
            date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return date_obj.strftime('%Y-%m-%d')
        except:
            # Fallback: date actuelle
            return datetime.now().strftime('%Y-%m-%d')
