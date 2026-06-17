"""
Point d'entrée principal du scraper
Orchestre l'exécution de tous les scrapers et envoie les données à l'API Laravel
"""

import sys
import os
import json
import logging
from datetime import datetime
import requests
 
# Ensure console streams use UTF-8 to avoid UnicodeEncodeError on Windows consoles
try:
    if hasattr(sys, 'stdout') and hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys, 'stderr') and hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    # Best-effort only; do not fail if reconfigure is unavailable
    pass

# Ajouter le répertoire parent au path pour les imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import DB_CONFIG, LARAVEL_API, SOURCES, LOG_CONFIG
from scrapers import OpportunityDeskScraper, ScholarshipPositionsScraper, JoobleScraper, CourseraScraper, EmploisCmScraper

class ScraperOrchestrator:
    """
    Orchestrateur qui gère l'exécution de tous les scrapers
    """
    
    def __init__(self):
        """
        Initialise l'orchestrateur
        """
        self.config = {
            'LOG_CONFIG': LOG_CONFIG,
            'SOURCES': SOURCES,
            'SELENIUM_CONFIG': {
                'headless': True,
                'window_size': (1920, 1080),
                'timeout': 30,
            }
        }
        self.logger = self._setup_logger()
        self.scrapers = []
        self.api_token = self._get_api_token()
    
    def _setup_logger(self):
        """
        Configure le logger principal
        """
        logging.basicConfig(
            level=getattr(logging, LOG_CONFIG['level']),
            format=LOG_CONFIG['format'],
            handlers=[
                logging.FileHandler(LOG_CONFIG['file'], encoding='utf-8'),
                logging.StreamHandler(stream=sys.stdout)
            ]
        )
        logger = logging.getLogger('ScraperOrchestrator')
        # Force UTF-8 encoding for all handlers
        for handler in logger.handlers:
            handler.setFormatter(logging.Formatter(LOG_CONFIG['format']))
            if hasattr(handler, 'stream'):
                # For StreamHandler, wrap stdout to handle UTF-8
                if handler.stream == sys.stderr or handler.stream == sys.stdout:
                    import io
                    if sys.platform.startswith('win'):
                        # On Windows, use UTF-8 for console output
                        import codecs
                        if hasattr(sys.stdout, 'buffer'):
                            handler.setStream(io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace'))
        return logger
    
    def _get_api_token(self):
        """
        Récupère ou génère un token pour l'API Laravel
        Pour l'instant, nous allons simplement logger sans token
        Dans un environnement de production, il faudrait s'authentifier
        """
        # Pour l'instant, nous allons simplement retourner None
        # L'authentification sera gérée via les headers appropriés
        return None
    
    def initialize_scrapers(self):
        """
        Initialise tous les scrapers activés
        """
        self.logger.info("Initialisation des scrapers...")
        
        if SOURCES['opportunity_desk']['enabled']:
            self.scrapers.append(OpportunityDeskScraper(self.config))
            self.logger.info("Scraper Opportunity Desk initialisé")
        
        if SOURCES['scholarship_positions']['enabled']:
            self.scrapers.append(ScholarshipPositionsScraper(self.config))
            self.logger.info("Scraper Scholarship Positions initialisé")
        
        if SOURCES['jooble']['enabled']:
            self.scrapers.append(JoobleScraper(self.config))
            self.logger.info("Scraper Jooble initialisé")
        
        if SOURCES['coursera']['enabled']:
            self.scrapers.append(CourseraScraper(self.config))
            self.logger.info("Scraper Coursera initialisé")
        
        if SOURCES['emplois_cm']['enabled']:
            self.scrapers.append(EmploisCmScraper(self.config))
            self.logger.info("Scraper Emplois.cm initialisé")
    
    def run_all_scrapers(self):
        """
        Exécute tous les scrapers et collecte les données
        """
        self.logger.info("Début de l'exécution des scrapers")
        
        all_opportunities = []
        
        for scraper in self.scrapers:
            try:
                self.logger.info(f"Exécution du scraper: {scraper.__class__.__name__}")
                
                # Exécuter le scraper selon son type
                if isinstance(scraper, OpportunityDeskScraper):
                    opportunities = scraper.scrape_opportunities(limit=50)
                elif isinstance(scraper, ScholarshipPositionsScraper):
                    opportunities = scraper.scrape_scholarships(limit=50)
                elif isinstance(scraper, JoobleScraper):
                    # Rechercher plusieurs termes pour plus de variété
                    search_terms = ["developer", "marketing", "design", "data analyst", "manager", "accountant", "engineer", "analyst"]
                    opportunities = []
                    for term in search_terms:
                        jobs = scraper.scrape_jobs(search_query=term, limit=10)
                        opportunities.extend(jobs)
                elif isinstance(scraper, CourseraScraper):
                    # L'API Coursera retourne les cours par défaut sans recherche
                    opportunities = scraper.scrape_courses(limit=50)
                elif isinstance(scraper, EmploisCmScraper):
                    opportunities = scraper.scrape_jobs(job_type="stage", limit=50)
                else:
                    opportunities = []
                
                all_opportunities.extend(opportunities)
                self.logger.info(f"{len(opportunities)} opportunités récupérées par {scraper.__class__.__name__}")
                
            except Exception as e:
                self.logger.error(f"Erreur lors de l'exécution de {scraper.__class__.__name__}: {e}")
                continue
        
        self.logger.info(f"Total des opportunités récupérées: {len(all_opportunities)}")
        
        # Supprimer les doublons basés sur le lien
        unique_opportunities = self.remove_duplicates(all_opportunities)
        self.logger.info(f"Total des opportunités après déduplication: {len(unique_opportunities)}")
        
        return unique_opportunities
    
    def remove_duplicates(self, opportunities):
        """
        Supprime les doublons basés sur le lien de l'opportunité
        
        Args:
            opportunities: Liste des opportunités
        
        Returns:
            Liste des opportunités sans doublons
        """
        seen_links = set()
        unique_opportunities = []
        
        for opportunity in opportunities:
            link = opportunity.get('lien') or opportunity.get('url_source', '')
            if link and link not in seen_links:
                seen_links.add(link)
                unique_opportunities.append(opportunity)
            else:
                # Si pas de lien ou doublon sur lien, on utilise le titre comme fallback
                title = opportunity.get('titre', '')
                if title and title not in seen_links:
                    seen_links.add(title)
                    unique_opportunities.append(opportunity)
        
        return unique_opportunities
    
    def get_existing_offres(self):
        """
        Récupère les offres existantes depuis l'API Laravel
        
        Returns:
            Set des titres d'offres existantes
        """
        try:
            api_url = f"{LARAVEL_API['base_url']}/offres"
            headers = {
                'Accept': 'application/json'
            }
            
            response = requests.get(api_url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                offres = response.json()
                existing_titles = {offre['titre'] for offre in offres}
                self.logger.info(f"{len(existing_titles)} offres existantes récupérées depuis l'API")
                return existing_titles
            else:
                self.logger.warning(f"Impossible de récupérer les offres existantes: {response.status_code}")
                return set()
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération des offres existantes: {e}")
            return set()
    
    def send_to_laravel(self, opportunities):
        """
        Envoie les opportunités à l'API Laravel
        
        Args:
            opportunities: Liste des opportunités à envoyer
        """
        self.logger.info("Envoi des opportunités à l'API Laravel")
        
        # Récupérer les offres existantes pour éviter les doublons
        existing_titles = self.get_existing_offres()
        
        api_url = f"{LARAVEL_API['base_url']}/scraper/offres"
        
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        # Si nous avions un token, nous l'ajouterions ici
        # if self.api_token:
        #     headers['Authorization'] = f'Bearer {self.api_token}'
        
        success_count = 0
        error_count = 0
        skipped_count = 0
        
        for opportunity in opportunities:
            try:
                # Vérifier si l'offre existe déjà
                if opportunity['titre'] in existing_titles:
                    self.logger.info(f"Offre déjà existante (skipped): {opportunity['titre'][:50]}...")
                    skipped_count += 1
                    continue
                
                # Log pour debug
                self.logger.info(f"Envoi de: {opportunity['titre'][:50]}... | Description: '{opportunity['description'][:50] if opportunity['description'] else 'EMPTY'}'")
                
                # Simplifier les données envoyées (exclure categories et source pour l'instant)
                simplified_data = {
                    'titre': opportunity['titre'],
                    'description': opportunity['description'],
                    'type': opportunity['type'],
                    'entreprise': opportunity['entreprise'],
                    'localisation': opportunity['localisation'],
                    'date_limite': opportunity['date_limite'],
                    'date_publication': opportunity['date_publication'],
                    'url_source': opportunity.get('url_source') or opportunity.get('lien'),
                }
                
                response = requests.post(api_url, json=simplified_data, headers=headers, timeout=30)
                
                if response.status_code == 201:
                    success_count += 1
                    try:
                        self.logger.info(f"Opportunité envoyée avec succès: {opportunity['titre']}")
                    except UnicodeEncodeError:
                        self.logger.info(f"Opportunité envoyée avec succès: [titre avec caractères spéciaux]")
                elif response.status_code == 200:
                    # Offre déjà existante (statut 200 au lieu de 201)
                    skipped_count += 1
                    self.logger.info(f"Offre déjà existante (API): {opportunity['titre'][:50]}...")
                else:
                    error_count += 1
                    self.logger.error(f"Erreur lors de l'envoi de {opportunity['titre']}: {response.status_code} - {response.text}")
                
            except Exception as e:
                error_count += 1
                self.logger.error(f"Erreur lors de l'envoi de {opportunity['titre']}: {e}")
        
        self.logger.info(f"Envoi terminé: {success_count} succès, {skipped_count} ignorés (doublons), {error_count} erreurs")
    
    def save_to_json(self, opportunities, filename='opportunities.json'):
        """
        Sauvegarde les opportunités dans un fichier JSON (pour test/debug)
        
        Args:
            opportunities: Liste des opportunités
            filename: Nom du fichier de sortie
        """
        self.logger.info(f"Sauvegarde des opportunités dans {filename}")
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(opportunities, f, ensure_ascii=False, indent=2)
        
        self.logger.info(f"{len(opportunities)} opportunités sauvegardées dans {filename}")
    
    def run(self):
        """
        Exécute le processus complet de scraping
        """
        self.logger.info("=" * 50)
        self.logger.info("Démarrage du processus de scraping")
        self.logger.info("=" * 50)
        
        try:
            # Initialiser les scrapers
            self.initialize_scrapers()
            
            # Exécuter tous les scrapers
            opportunities = self.run_all_scrapers()
            
            if not opportunities:
                self.logger.warning("Aucune opportunité récupérée")
                return
            
            # Sauvegarder en JSON (pour test)
            self.save_to_json(opportunities)
            
            # Envoyer à Laravel (optionnel - commenter si l'API n'est pas prête)
            self.send_to_laravel(opportunities)
            
            self.logger.info("=" * 50)
            self.logger.info("Processus de scraping terminé avec succès")
            self.logger.info("=" * 50)
            
        except Exception as e:
            self.logger.error(f"Erreur critique lors du processus de scraping: {e}")
            raise
        finally:
            # Fermer tous les scrapers
            for scraper in self.scrapers:
                scraper.close()

def main():
    """
    Point d'entrée principal
    """
    orchestrator = ScraperOrchestrator()
    orchestrator.run()

if __name__ == '__main__':
    main()
