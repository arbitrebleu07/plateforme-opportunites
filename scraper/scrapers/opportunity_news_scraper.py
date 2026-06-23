"""Scrapers prudents pour les sites camerounais de bourses et concours."""

import re
from datetime import datetime
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

from base_scraper import BaseScraper


class OpportunityNewsScraper(BaseScraper):
    source_key = None

    opportunity_keywords = (
        'bourse', 'scholarship', 'concours', 'competitive entrance',
        'appel a candidature', 'appel à candidature', 'admission',
    )
    excluded_keywords = (
        'resultat', 'résultat', 'admis', 'admissible', 'liste des candidats',
        'epreuve', 'épreuve', 'corrige', 'corrigé', 'ancien sujet',
    )

    def __init__(self, config):
        super().__init__(config)
        source = config['SOURCES'][self.source_key]
        self.base_url = source['url']
        self.listing_urls = source.get('listing_urls', [self.base_url])
        self.source_name = source['name']
        self.offer_type = source['type']
        self.delay = max(float(source.get('delay', 5)), 5)
        self.max_results = int(source.get('max_results', 20))
        self.respect_robots_txt = source.get('respect_robots_txt', True)
        self.robots_cache = {}
        self.bot_user_agent = 'PlateformeOpportunitesBot'
        self.session.headers.update({
            'User-Agent': (
                'PlateformeOpportunitesBot/1.0 '
                '(collecte publique moderee; contact: administrateur local)'
            )
        })

    def scrape_opportunities(self, limit=20):
        target = min(limit, self.max_results)
        opportunities = []
        seen_urls = set()

        self.logger.info(
            "Début du scraping de %s, limite %s, délai %.1fs",
            self.source_name,
            target,
            self.delay,
        )

        for listing_url in self.listing_urls:
            if len(opportunities) >= target:
                break
            if not self._is_allowed_by_robots(listing_url):
                self.logger.warning("URL interdite par robots.txt: %s", listing_url)
                continue

            soup = self.get_page(listing_url, delay=self.delay)
            if not soup:
                continue

            for article in self._find_article_blocks(soup):
                opportunity = self._extract_listing_article(article, listing_url)
                if not opportunity:
                    continue
                if opportunity['url_source'] in seen_urls:
                    continue

                seen_urls.add(opportunity['url_source'])
                opportunities.append(opportunity)
                if len(opportunities) >= target:
                    break

        self.logger.info(
            "Scraping terminé: %s opportunités récupérées depuis %s",
            len(opportunities),
            self.source_name,
        )
        return opportunities

    def _is_allowed_by_robots(self, url):
        if not self.respect_robots_txt:
            return True

        parsed = urlparse(url)
        origin = f"{parsed.scheme}://{parsed.netloc}"
        if origin not in self.robots_cache:
            robots_url = f"{origin}/robots.txt"
            parser = RobotFileParser()
            parser.set_url(robots_url)
            try:
                response = self.session.get(robots_url, timeout=self.request_timeout)
                if response.status_code == 200:
                    parser.parse(response.text.splitlines())
                    self.robots_cache[origin] = parser
                else:
                    self.robots_cache[origin] = None
            except Exception as exc:
                self.logger.warning("robots.txt indisponible pour %s: %s", origin, exc)
                self.robots_cache[origin] = None

        parser = self.robots_cache[origin]
        return parser.can_fetch(self.bot_user_agent, url) if parser else True

    def _find_article_blocks(self, soup):
        selectors = [
            'article',
            '.post',
            '.post-item',
            '.blog-post',
            '.item-post',
            '.latest-post',
        ]
        blocks = []
        seen = set()

        for selector in selectors:
            for block in soup.select(selector):
                marker = id(block)
                if marker not in seen:
                    seen.add(marker)
                    blocks.append(block)

        if blocks:
            return blocks

        return [
            heading.parent
            for heading in soup.select('h2, h3')
            if heading.find('a', href=True)
        ]

    def _extract_listing_article(self, article, listing_url):
        heading = article.select_one('h1, h2, h3, .post-title, .entry-title')
        anchor = heading.find('a', href=True) if heading else article.find('a', href=True)
        if not anchor:
            return None

        title = self.clean_text(anchor.get_text(' ', strip=True))
        url = urljoin(listing_url, anchor['href'])
        if not self._is_allowed_article(title, url):
            return None

        description_node = article.select_one(
            '.entry-summary, .post-snippet, .post-body, .entry-content, p'
        )
        description = self.clean_text(
            description_node.get_text(' ', strip=True) if description_node else ''
        )
        if len(description) < 20:
            description = f"{title}. Consultez la page source pour les détails."

        category = self._detect_category(title, description)
        return {
            'titre': title,
            'description': description[:500] + ('...' if len(description) > 500 else ''),
            'type': self.offer_type,
            'entreprise': self.source_name,
            'localisation': 'Cameroun/International',
            'date_limite': self._extract_deadline(article.get_text(' ', strip=True)),
            'date_publication': self._extract_publication_date(article),
            'source': self.source_name,
            'url_source': url,
            'categories': [category],
        }

    def _is_allowed_article(self, title, url):
        parsed = urlparse(url)
        if parsed.netloc != urlparse(self.base_url).netloc:
            return False

        normalized = self._normalize(title)
        if any(keyword in normalized for keyword in self.excluded_keywords):
            return False

        return any(keyword in normalized for keyword in self.opportunity_keywords)

    def _detect_category(self, title, description):
        text = self._normalize(f"{title} {description}")
        if 'bourse' in text or 'scholarship' in text:
            return 'Bourse'
        if 'appel a candidature' in text:
            return 'Appel à candidature'
        return 'Concours'

    def _extract_publication_date(self, article):
        time_node = article.find('time')
        if time_node and time_node.get('datetime'):
            return time_node['datetime'][:10]

        text = article.get_text(' ', strip=True)
        match = re.search(r'\b(20\d{2})-(\d{2})-(\d{2})\b', text)
        return match.group(0) if match else None

    def _extract_deadline(self, text):
        patterns = [
            r'(?:date limite|deadline|clôture|cloture)\D{0,20}(\d{1,2}[/-]\d{1,2}[/-]20\d{2})',
            r'(?:date limite|deadline|clôture|cloture)\D{0,20}(20\d{2}-\d{2}-\d{2})',
        ]
        for pattern in patterns:
            match = re.search(pattern, text, flags=re.IGNORECASE)
            if not match:
                continue
            raw = match.group(1)
            for date_format in ('%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%d'):
                try:
                    return datetime.strptime(raw, date_format).strftime('%Y-%m-%d')
                except ValueError:
                    continue
        return None

    @staticmethod
    def _normalize(value):
        value = value.lower()
        replacements = str.maketrans('àâäçéèêëîïôöùûü', 'aaaceeeeii oouuu'.replace(' ', ''))
        return value.translate(replacements)


class InfosConcoursEducationScraper(OpportunityNewsScraper):
    source_key = 'infos_concours_education'


class KamerpowerScraper(OpportunityNewsScraper):
    source_key = 'kamerpower'
