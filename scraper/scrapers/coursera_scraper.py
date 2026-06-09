"""
Scraper pour Coursera API
Site: https://www.coursera.org
Type: Formations
Utilise l'API publique Coursera pour récupérer les cours
"""

from base_scraper import BaseScraper
import requests
import logging
from datetime import datetime

class CourseraScraper(BaseScraper):
    """
    Scraper spécifique pour Coursera utilisant l'API publique
    Récupère les formations et cours via l'API
    """
    
    def __init__(self, config):
        super().__init__(config)
        self.api_url = "https://api.coursera.org/api/courses.v1"
        self.base_url = config['SOURCES']['coursera']['url']
        self.source_name = config['SOURCES']['coursera']['name']
        self.offer_type = config['SOURCES']['coursera']['type']
    
    def scrape_courses(self, search_query="", limit=20):
        """
        Récupère les formations depuis l'API Coursera
        
        Args:
            search_query: Terme de recherche (non utilisé, l'API retourne les cours par défaut)
            limit: Nombre maximum de formations à récupérer
        
        Returns:
            Liste de dictionnaires contenant les données des formations
        """
        self.logger.info(f"Début du scraping de {self.source_name}")
        
        try:
            # Appel à l'API Coursera (sans paramètres de recherche)
            response = requests.get(self.api_url, timeout=30)
            
            if response.status_code != 200:
                self.logger.error(f"Erreur API Coursera: {response.status_code} - {response.text}")
                return []
            
            data = response.json()
            
            if 'elements' not in data:
                self.logger.warning("Aucune formation trouvée dans la réponse API")
                return []
            
            courses = []
            
            for course_data in data['elements'][:limit]:
                try:
                    course = self._extract_course_data(course_data)
                    if course:
                        courses.append(course)
                        self.logger.info(f"Formation récupérée: {course['titre']}")
                except Exception as e:
                    self.logger.error(f"Erreur lors de l'extraction d'une formation: {e}")
                    continue
            
            self.logger.info(f"Scraping terminé: {len(courses)} formations récupérées (Total: {data.get('paging', {}).get('total', 0)})")
            return courses
            
        except Exception as e:
            self.logger.error(f"Erreur lors de l'appel à l'API Coursera: {e}")
            return []
    
    def _extract_course_data(self, course_data):
        """
        Extrait les données d'une formation depuis la réponse API Coursera
        
        Args:
            course_data: Dictionnaire JSON de l'API Coursera
        
        Returns:
            Dictionnaire avec les données de la formation
        """
        # Titre
        titre = course_data.get('name', 'Sans titre')
        
        # Slug pour construire l'URL
        slug = course_data.get('slug', '')
        lien = f"{self.base_url}/learn/{slug}" if slug else ""
        
        # Description
        description = course_data.get('description', '')
        if not description or len(description) < 10:
            description = f"Formation: {titre}. Cours disponible sur Coursera."
        
        # Langues du cours
        languages = course_data.get('primaryLanguages', [])
        categorie = languages[0] if languages else 'Formation'
        
        # Workload (charge de travail)
        workload = course_data.get('workload', '')
        
        # Date de publication (non disponible, utilise date actuelle)
        date_publication = datetime.now().strftime('%Y-%m-%d')
        
        # Construire le dictionnaire de données
        course = {
            'titre': titre,
            'description': description[:500] + "..." if len(description) > 500 else description,
            'type': self.offer_type,
            'entreprise': 'Coursera',
            'localisation': 'En ligne',
            'date_limite': None,
            'date_publication': date_publication,
            'source': self.source_name,
            'url_source': lien,
            'categories': [categorie] if categorie else ['Formation']
        }
        
        return course
