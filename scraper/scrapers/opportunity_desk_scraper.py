"""
Scraper adapté pour les pages de bourses (MINESUP)
Site cible (configurable): https://www.minesup.gov.cm/index.php/category/bourses/
Type: Bourses/Concours
Ce scraper garde le nom de classe `OpportunityDeskScraper` pour compatibilité
avec le reste du projet, mais utilise des sélecteurs plus génériques
et des fallbacks pour extraire les articles depuis des pages de catégorie.
"""

from base_scraper import BaseScraper
from bs4 import BeautifulSoup
import logging

class OpportunityDeskScraper(BaseScraper):
    """
    Scraper générique pour les pages de catégorie de bourses.
    Utilise les informations de `config['SOURCES']['opportunity_desk']`.
    """

    def __init__(self, config):
        super().__init__(config)
        self.base_url = config['SOURCES']['opportunity_desk']['url']
        self.source_name = config['SOURCES']['opportunity_desk']['name']
        self.offer_type = config['SOURCES']['opportunity_desk']['type']

    def scrape_opportunities(self, limit=20):
        """
        Scrape les opportunités depuis la page de catégorie (ex: MINESUP bourses)

        Args:
            limit: Nombre maximum d'opportunités à récupérer

        Returns:
            Liste de dictionnaires contenant les données des opportunités
        """
        self.logger.info(f"Début du scraping de {self.source_name} ({self.base_url})")

        soup = self.get_page(self.base_url, delay=self.config['SOURCES']['opportunity_desk']['delay'])
        if not soup:
            self.logger.error("Impossible de récupérer la page de catégorie")
            return []

        opportunities = []

        # Essayer de trouver des éléments article/ post dans la page
        container = soup.find(id='content') or soup.find('main') or soup.find('div', class_='content') or soup

        # Chercher des articles structurés
        candidates = []
        candidates.extend(container.find_all('article'))
        # Chercher des blocs avec classes contenant 'post' ou 'article' ou 'item'
        candidates.extend(container.find_all('div', class_=lambda x: x and ('post' in x or 'article' in x or 'item' in x)))

        links = []
        for el in candidates:
            a = el.find('a', href=True)
            if a and a['href']:
                links.append(a['href'])

        # Si aucun candidat structuré, tomber back sur tous les liens dans le container
        if not links:
            for a in container.find_all('a', href=True):
                href = a['href']
                # Filtrer les liens externes ou simples ancres
                if href.startswith('#'):
                    continue
                # Normaliser les URLs relatives
                links.append(href)

        # Nettoyer et dédupliquer
        seen = set()
        normalized_links = []
        from urllib.parse import urljoin, urlparse
        for href in links:
            full = urljoin(self.base_url, href)
            parsed = urlparse(full)
            # garder uniquement le même domaine
            if parsed.netloc and parsed.netloc != urlparse(self.base_url).netloc:
                continue
            if full in seen:
                continue
            seen.add(full)
            normalized_links.append(full)

        # Limiter
        normalized_links = normalized_links[:limit]

        for link in normalized_links:
            try:
                opp = self._fetch_opportunity_from_url(link)
                if opp:
                    opportunities.append(opp)
                    self.logger.info(f"Opportunité récupérée: {opp['titre']}")
            except Exception as e:
                self.logger.error(f"Erreur lors de l'extraction depuis {link}: {e}")
                continue

        self.logger.info(f"Scraping terminé: {len(opportunities)} opportunités récupérées")
        return opportunities
    
    def _fetch_opportunity_from_url(self, url):
        """
        Récupère et extrait les informations depuis la page détaillée d'une opportunité.
        """
        soup = self.get_page(url, delay=self.config['SOURCES']['opportunity_desk']['delay'])
        if not soup:
            return None

        # Titre: og:title, h1, title
        title = None
        meta_og = soup.find('meta', property='og:title')
        if meta_og and meta_og.get('content'):
            title = self.clean_text(meta_og['content'])
        if not title:
            h1 = soup.find('h1') or soup.find('h2')
            title = self.clean_text(h1.get_text()) if h1 else None
        if not title:
            title = self.clean_text(soup.title.get_text()) if soup.title else 'Sans titre'

        # Description: meta description ou premier paragraphe
        description = ''
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            description = self.clean_text(meta_desc['content'])
        else:
            p = soup.find('p')
            description = self.clean_text(p.get_text()) if p else ''

        if not description or len(description) < 10:
            description = f"Opportunité: {title}. Voir la page source pour détails."

        # Date: meta article:published_time, time tag, ou fallback
        date_publication = None
        meta_date = soup.find('meta', property='article:published_time')
        if meta_date and meta_date.get('content'):
            date_publication = meta_date['content'].split('T')[0]
        else:
            time_tag = soup.find('time')
            if time_tag and time_tag.get('datetime'):
                date_publication = time_tag['datetime'].split('T')[0]
            elif time_tag:
                # essayer parser du texte via BaseScraper.extract_date
                date_publication = self.extract_date(self.clean_text(time_tag.get_text()))

        # Catégories: liens de type category
        categories = []
        for a in soup.find_all('a', href=True):
            if 'category' in a.get('href') or 'categorie' in a.get('href') or 'cat' in a.get('href'):
                text = self.clean_text(a.get_text())
                if text and text not in categories:
                    categories.append(text)

        if not categories:
            # fallback simple: chercher un lien rel=category
            cat = soup.find('a', rel='category')
            if cat:
                categories = [self.clean_text(cat.get_text())]

        opportunity = {
            'titre': title,
            'description': description[:500] + '...' if len(description) > 500 else description,
            'type': self.offer_type,
            'entreprise': self.source_name,
            'localisation': 'National/International',
            'date_limite': None,
            'date_publication': date_publication,
            'source': self.source_name,
            'url_source': url,
            'categories': categories or ['Bourse']
        }

        return opportunity
    
    # Note: la logique d'extraction de date utilise `extract_date` de la classe de base
