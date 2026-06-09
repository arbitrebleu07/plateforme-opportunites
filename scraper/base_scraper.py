"""
Classe de base pour les scrapers
Cette classe fournit les méthodes communes à tous les scrapers
"""

import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time
import logging
from datetime import datetime
import random

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
        self.session = requests.Session()
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
        logging.basicConfig(
            level=getattr(logging, self.config['LOG_CONFIG']['level']),
            format=self.config['LOG_CONFIG']['format'],
            handlers=[
                logging.FileHandler(self.config['LOG_CONFIG']['file']),
                logging.StreamHandler()
            ]
        )
        return logging.getLogger(self.__class__.__name__)
    
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
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            # Ajout d'un délai aléatoire pour éviter le rate limiting
            time.sleep(random.uniform(1, 3))
            
            return BeautifulSoup(response.content, 'html.parser')
        except requests.RequestException as e:
            self.logger.error(f"Erreur lors de la récupération de {url}: {e}")
            return None
    
    def get_page_selenium(self, url, delay=None):
        """
        Récupère une page avec Selenium (pour les pages dynamiques avec JavaScript)
        
        Args:
            url: URL de la page
            delay: Délai avant la requête
        
        Returns:
            BeautifulSoup object ou None en cas d'erreur
        """
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
