"""
Point d'entrée principal du scraper
Orchestre l'exécution de tous les scrapers et envoie les données à l'API Laravel
"""

import sys
import os
import json
import logging
import argparse
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
 
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

from config import DB_CONFIG, HTTP_CONFIG, LARAVEL_API, SOURCES, LOG_CONFIG
from scrapers import (
    CourseraScraper,
    EmploisCmScraper,
    InfosConcoursEducationScraper,
    JoobleScraper,
    KamerpowerScraper,
    MinaJobsScraper,
)
from utils.cleaning import clean_opportunity, is_valid_opportunity
from utils.classifier import classify_opportunity
from utils.deduplication import OpportunityDeduplicator

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
            'HTTP_CONFIG': HTTP_CONFIG,
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
        self.http = self._build_http_session()
        self.request_timeout = (
            HTTP_CONFIG['connect_timeout'],
            HTTP_CONFIG['read_timeout'],
        )

    def _build_http_session(self):
        retry = Retry(
            total=HTTP_CONFIG['retry_total'],
            connect=HTTP_CONFIG['retry_connect'],
            read=3,
            status=3,
            backoff_factor=HTTP_CONFIG['backoff_factor'],
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=frozenset(['GET', 'POST']),
            raise_on_status=False,
        )
        session = requests.Session()
        adapter = HTTPAdapter(max_retries=retry)
        session.mount('http://', adapter)
        session.mount('https://', adapter)
        return session
    
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
    
    def initialize_scrapers(self, selected_source='all'):
        """
        Initialise tous les scrapers activés
        """
        self.logger.info("Initialisation des scrapers...")
        
        if selected_source in ('all', 'infos_concours_education') and SOURCES['infos_concours_education']['enabled']:
            self.scrapers.append(InfosConcoursEducationScraper(self.config))
            self.logger.info("Scraper Infos Concours Education initialisé")
        
        if selected_source in ('all', 'kamerpower') and SOURCES['kamerpower']['enabled']:
            self.scrapers.append(KamerpowerScraper(self.config))
            self.logger.info("Scraper Kamerpower initialisé")
        
        if selected_source in ('all', 'jooble') and SOURCES['jooble']['enabled']:
            self.scrapers.append(JoobleScraper(self.config))
            self.logger.info("Scraper Jooble initialisé")
        
        if selected_source in ('all', 'coursera') and SOURCES['coursera']['enabled']:
            self.scrapers.append(CourseraScraper(self.config))
            self.logger.info("Scraper Coursera initialisé")
        
        if selected_source in ('all', 'emplois_cm') and SOURCES['emplois_cm']['enabled']:
            self.scrapers.append(EmploisCmScraper(self.config))
            self.logger.info("Scraper Emplois.cm initialisé")

        if selected_source in ('all', 'minajobs') and SOURCES['minajobs']['enabled']:
            self.scrapers.append(MinaJobsScraper(self.config))
            self.logger.info("Scraper MinaJobs initialisé")
    
    def run_all_scrapers(self, limit=20):
        """
        Exécute tous les scrapers et collecte les données
        """
        self.logger.info("Début de l'exécution des scrapers")
        
        all_opportunities = []
        
        for scraper in self.scrapers:
            try:
                self.logger.info(f"Exécution du scraper: {scraper.__class__.__name__}")
                
                # Exécuter le scraper selon son type
                if isinstance(scraper, (InfosConcoursEducationScraper, KamerpowerScraper)):
                    opportunities = scraper.scrape_opportunities(limit=limit)
                elif isinstance(scraper, JoobleScraper):
                    # Rechercher plusieurs termes pour plus de variété
                    search_terms = ["developer", "marketing", "design", "data analyst", "manager", "accountant", "engineer", "analyst"]
                    opportunities = []
                    for term in search_terms:
                        jobs = scraper.scrape_jobs(search_query=term, limit=min(limit, 10))
                        opportunities.extend(jobs)
                        if len(opportunities) >= limit:
                            opportunities = opportunities[:limit]
                            break
                elif isinstance(scraper, CourseraScraper):
                    # L'API Coursera retourne les cours par défaut sans recherche
                    opportunities = scraper.scrape_courses(limit=limit)
                elif isinstance(scraper, (EmploisCmScraper, MinaJobsScraper)):
                    opportunities = scraper.scrape_jobs(limit=limit)
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
        deduplicator = OpportunityDeduplicator()
        unique_opportunities = []
        invalid_count = 0
        duplicate_count = 0
        category_counts = {}
        
        for opportunity in opportunities:
            cleaned = clean_opportunity(opportunity)

            if not is_valid_opportunity(cleaned):
                invalid_count += 1
                continue

            classified = classify_opportunity(cleaned)
            category = classified['categorie_principale']
            category_counts[category] = category_counts.get(category, 0) + 1

            if deduplicator.is_duplicate(classified):
                duplicate_count += 1
                continue

            deduplicator.remember(classified)
            unique_opportunities.append(classified)

        self.logger.info(f"Nettoyage: {invalid_count} opportunites invalides ignorees")
        self.logger.info(f"Categorisation: {category_counts}")
        self.logger.info(f"Deduplication locale: {duplicate_count} doublons ignores")
        
        return unique_opportunities
    
    def get_existing_offres(self):
        """
        Récupère les offres existantes depuis l'API Laravel
        
        Returns:
            Liste des offres existantes
        """
        try:
            api_url = f"{LARAVEL_API['base_url']}/offres"
            headers = {'Accept': 'application/json'}
            existing_offres = []
            page = 1

            while True:
                response = self.http.get(
                    api_url,
                    headers=headers,
                    params={'page': page, 'per_page': 100},
                    timeout=self.request_timeout
                )

                if response.status_code != 200:
                    self.logger.warning(f"Impossible de récupérer les offres existantes: {response.status_code}")
                    return existing_offres

                payload = response.json()
                offres = payload.get('data', payload) if isinstance(payload, dict) else payload

                if not isinstance(offres, list):
                    self.logger.warning("Format inattendu pour la liste des offres existantes")
                    return existing_offres

                existing_offres.extend(
                    offre for offre in offres
                    if isinstance(offre, dict)
                )

                if not isinstance(payload, dict) or page >= payload.get('last_page', 1):
                    break

                page += 1

            self.logger.info(f"{len(existing_offres)} offres existantes récupérées depuis l'API")
            return existing_offres
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération des offres existantes: {e}")
            return []
    
    def send_to_laravel(self, opportunities):
        """
        Envoie les opportunités à l'API Laravel
        
        Args:
            opportunities: Liste des opportunités à envoyer
        """
        self.logger.info("Envoi des opportunités à l'API Laravel")
        
        existing_offres = self.get_existing_offres()
        deduplicator = OpportunityDeduplicator()
        for existing in existing_offres:
            deduplicator.add_existing(existing)
        
        api_url = f"{LARAVEL_API['base_url']}/scraper/offres"
        
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Scraper-Key': LARAVEL_API['key'],
        }
        
        success_count = 0
        error_count = 0
        skipped_count = 0
        
        for opportunity in opportunities:
            try:
                if deduplicator.is_duplicate(opportunity):
                    self.logger.info(f"Offre déjà existante (skipped): {opportunity['titre'][:50]}...")
                    skipped_count += 1
                    continue
                
                # Log pour debug
                self.logger.info(f"Envoi de: {opportunity['titre'][:50]}... | Description: '{opportunity['description'][:50] if opportunity['description'] else 'EMPTY'}'")
                
                simplified_data = {
                    'titre': opportunity['titre'],
                    'description': opportunity['description'],
                    'type': opportunity['type'],
                    'entreprise': opportunity['entreprise'],
                    'localisation': opportunity['localisation'],
                    'date_limite': opportunity['date_limite'],
                    'date_publication': opportunity['date_publication'],
                    'source': opportunity.get('source'),
                    'url_source': opportunity.get('url_source') or opportunity.get('lien'),
                    'categories': opportunity.get('categories') or [],
                    'content_hash': opportunity.get('content_hash'),
                    'categorie_principale': opportunity.get('categorie_principale'),
                    'sous_categorie': opportunity.get('sous_categorie'),
                }
                
                response = self.http.post(
                    api_url,
                    json=simplified_data,
                    headers=headers,
                    timeout=self.request_timeout,
                )
                
                if response.status_code == 201:
                    success_count += 1
                    deduplicator.remember(opportunity)
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
        return {
            'inserted': success_count,
            'skipped': skipped_count,
            'errors': error_count,
        }
    
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
    
    def run(self, selected_source='all', limit=20, save_json=True):
        """
        Exécute le processus complet de scraping
        """
        self.logger.info("=" * 50)
        self.logger.info("Démarrage du processus de scraping")
        self.logger.info("=" * 50)
        
        try:
            # Initialiser les scrapers
            self.initialize_scrapers(selected_source)
            
            # Exécuter tous les scrapers
            opportunities = self.run_all_scrapers(limit)
            
            if not opportunities:
                self.logger.warning("Aucune opportunité récupérée")
                return {
                    'collected': 0,
                    'inserted': 0,
                    'skipped': 0,
                    'errors': 0,
                    'message': 'Aucune opportunité récupérée.',
                }
            
            # Sauvegarder en JSON (pour test)
            if save_json:
                self.save_to_json(opportunities)
            
            # Envoyer à Laravel (optionnel - commenter si l'API n'est pas prête)
            delivery = self.send_to_laravel(opportunities)
            
            self.logger.info("=" * 50)
            self.logger.info("Processus de scraping terminé avec succès")
            self.logger.info("=" * 50)
            return {
                'collected': len(opportunities),
                **delivery,
                'message': 'Collecte et import terminés avec succès.',
            }
            
        except Exception as e:
            self.logger.error(f"Erreur critique lors du processus de scraping: {e}")
            raise
        finally:
            for scraper in self.scrapers:
                scraper.close()
            self.http.close()

def main():
    """
    Point d'entrée principal
    """
    parser = argparse.ArgumentParser(description='Collecte les opportunités configurées.')
    parser.add_argument('--source', default='all')
    parser.add_argument('--limit', type=int, default=20)
    parser.add_argument('--report-file')
    args = parser.parse_args()

    orchestrator = ScraperOrchestrator()
    try:
        report = orchestrator.run(
            selected_source=args.source,
            limit=max(1, min(args.limit, 50)),
            save_json=not bool(args.report_file),
        )
    except Exception as error:
        report = {
            'collected': 0,
            'inserted': 0,
            'skipped': 0,
            'errors': 1,
            'message': str(error),
        }
        if args.report_file:
            with open(args.report_file, 'w', encoding='utf-8') as report_handle:
                json.dump(report, report_handle, ensure_ascii=False, indent=2)
        raise

    if args.report_file:
        with open(args.report_file, 'w', encoding='utf-8') as report_handle:
            json.dump(report, report_handle, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    main()
