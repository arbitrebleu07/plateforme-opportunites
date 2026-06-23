"""
Classe de base pour les scrapers
Cette classe fournit les méthodes communes à tous les scrapers
"""

import requests
from bs4 import BeautifulSoup
from io import BytesIO
import time
import logging
from datetime import datetime
import random
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from utils.cleaning import is_pdf_url

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

# Selenium est optionnel - certains scrapers n'en ont pas besoin
try:
    from selenium import webdriver
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from webdriver_manager.chrome import ChromeDriverManager
    SELENIUM_AVAILABLE = True
except (ImportError, Exception) as e:
    SELENIUM_AVAILABLE = False
    webdriver = None

class BaseScraper:
    """
    Classe de base pour tous les scrapers
    Fournit des méthodes communes pour les requêtes HTTP et le parsing HTML
    """
    
    def __init__(self, config):
        """
        Initialise le scraper avec la configuration
        """
        self.config = config
        http_config = config.get('HTTP_CONFIG', {})
        self.request_timeout = (
            http_config.get('connect_timeout', 5),
            http_config.get('read_timeout', 30),
        )
        self.session = requests.Session()
        self._configure_retries()
        self.driver = None
        self.logger = self._setup_logger()
        
        # User-Agent pour se faire passer pour un vrai navigateur
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def _setup_logger(self):
        """
        Configure le logger pour le suivi des opérations
        """
        root_logger = logging.getLogger()
        if not root_logger.handlers:
            logging.basicConfig(
                level=getattr(logging, self.config['LOG_CONFIG']['level']),
                format=self.config['LOG_CONFIG']['format'],
                handlers=[
                    logging.FileHandler(self.config['LOG_CONFIG']['file'], encoding='utf-8'),
                    logging.StreamHandler()
                ]
            )
        return logging.getLogger(self.__class__.__name__)
    
    def _configure_retries(self):
        http_config = self.config.get('HTTP_CONFIG', {})
        retry = Retry(
            total=http_config.get('retry_total', 3),
            connect=http_config.get('retry_connect', 2),
            read=3,
            status=3,
            backoff_factor=http_config.get('backoff_factor', 1),
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=frozenset(['GET', 'POST']),
            raise_on_status=False,
        )
        adapter = HTTPAdapter(max_retries=retry)
        self.session.mount('http://', adapter)
        self.session.mount('https://', adapter)

    def get_page(self, url, delay=None):
        """
        Récupère une page avec Requests (pour les pages statiques)
        
        Args:
            url: URL de la page
            delay: Délai avant la requête (pour éviter le rate limiting)
        
        Returns:
            BeautifulSoup object ou None en cas d'erreur
        """
        if delay:
            time.sleep(delay)
        
        try:
            self.logger.info(f"Récupération de la page: {url}")
            if is_pdf_url(url):
                self.logger.info(f"URL PDF ignoree pour parsing HTML: {url}")
                return None

            response = self.session.get(url, timeout=self.request_timeout)
            response.raise_for_status()
            content_type = response.headers.get('Content-Type', '').lower()
            if 'application/pdf' in content_type:
                self.logger.info(f"Contenu PDF ignore pour parsing HTML: {url}")
                return None
            
            # Ajout d'un délai aléatoire pour éviter le rate limiting
            time.sleep(random.uniform(1, 3))
            
            return BeautifulSoup(response.content, 'html.parser')
        except requests.RequestException as e:
            self.logger.error(f"Erreur lors de la récupération de {url}: {e}")
            return None

    def get_pdf_text(self, url):
        """Télécharge un PDF et retourne son texte sans le transmettre à BeautifulSoup."""
        if PdfReader is None:
            self.logger.warning("pypdf n'est pas installé; PDF ignoré: %s", url)
            return ""

        try:
            response = self.session.get(
                url,
                timeout=(self.request_timeout[0], max(self.request_timeout[1], 45)),
            )
            response.raise_for_status()
            reader = PdfReader(BytesIO(response.content))
            return self.clean_text(' '.join(
                page.extract_text() or ''
                for page in reader.pages
            ))
        except Exception as exc:
            self.logger.error("Erreur d'extraction PDF %s: %s", url, exc)
            return ""
    
    def get_page_selenium(self, url, delay=None):
        """
        Récupère une page avec Selenium (pour les pages dynamiques avec JavaScript)
        
        Args:
            url: URL de la page
            delay: Délai avant la requête
        
        Returns:
            BeautifulSoup object ou None en cas d'erreur
        """
        if not SELENIUM_AVAILABLE:
            self.logger.warning("Selenium n'est pas disponible. Fallback sur requests.")
            return self.get_page(url, delay)
        
        if not self.driver:
            self._init_selenium()
        
        if delay:
            time.sleep(delay)
        
        try:
            self.logger.info(f"Récupération de la page avec Selenium: {url}")
            self.driver.get(url)
            
            # Attendre que la page charge
            WebDriverWait(self.driver, self.config['SELENIUM_CONFIG']['timeout']).until(
                EC.presence_of_element_located((By.TAG_NAME, 'body'))
            )
            
            # Délai supplémentaire pour le chargement du JavaScript
            time.sleep(2)
            
            html = self.driver.page_source
            return BeautifulSoup(html, 'html.parser')
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération avec Selenium de {url}: {e}")
            return None
    
    def _init_selenium(self):
        """
        Initialise le driver Selenium Chrome
        """
        if not SELENIUM_AVAILABLE:
            raise RuntimeError("Selenium n'est pas disponible")
        
        chrome_options = Options()
        
        if self.config['SELENIUM_CONFIG']['headless']:
            chrome_options.add_argument('--headless')
        
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size={}'.format(
            ','.join(map(str, self.config['SELENIUM_CONFIG']['window_size']))
        ))
        
        # Désactiver les notifications
        chrome_options.add_argument('--disable-notifications')
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        
        self.logger.info("Driver Selenium initialisé")
    
    def close(self):
        """
        Ferme le driver Selenium et la session
        """
        if self.driver:
            self.driver.quit()
            self.logger.info("Driver Selenium fermé")
        
        self.session.close()
        self.logger.info("Session Requests fermée")
    
    def clean_text(self, text):
        """
        Nettoie le texte (supprime les espaces excessifs, les sauts de ligne)
        
        Args:
            text: Texte à nettoyer
        
        Returns:
            Texte nettoyé
        """
        if not text:
            return ""
        return ' '.join(text.strip().split())
    
    def extract_date(self, date_str):
        """
        Extrait une date depuis une chaîne de caractères
        À adapter selon le format de date du site
        
        Args:
            date_str: Chaîne de caractères contenant une date
        
        Returns:
            Date au format YYYY-MM-DD ou None
        """
        # Cette méthode doit être adaptée selon le format de date du site
        # C'est un exemple basique
        try:
            # Adapter selon le format de date du site
            from datetime import datetime
            # Exemple: "15 June 2024" -> "2024-06-15"
            # À personnaliser selon les besoins
            return datetime.now().strftime('%Y-%m-%d')
        except:
            return None
