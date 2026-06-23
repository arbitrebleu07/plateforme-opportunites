"""Scrapers modérés pour les offres d'emploi publiées au Cameroun."""

import re
from datetime import datetime, timedelta
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

from base_scraper import BaseScraper


class CameroonJobsScraper(BaseScraper):
    source_key = None
    job_path_markers = ()

    def __init__(self, config):
        super().__init__(config)
        source = config['SOURCES'][self.source_key]
        self.base_url = source['url']
        self.listing_urls = source.get('listing_urls', [self.base_url])
        self.source_name = source['name']
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

    def scrape_jobs(self, limit=20):
        target = min(limit, self.max_results)
        jobs = []
        seen_urls = set()

        self.logger.info(
            "Début du scraping de %s, limite %s, délai %.1fs",
            self.source_name,
            target,
            self.delay,
        )

        for listing_url in self.listing_urls:
            if len(jobs) >= target:
                break
            if not self._is_allowed_by_robots(listing_url):
                self.logger.warning("URL interdite par robots.txt: %s", listing_url)
                continue

            soup = self.get_page(listing_url, delay=self.delay)
            if not soup:
                continue

            for anchor in self._find_job_links(soup):
                job = self._extract_job(anchor, listing_url)
                if not job or job['url_source'] in seen_urls:
                    continue

                seen_urls.add(job['url_source'])
                jobs.append(job)
                if len(jobs) >= target:
                    break

        self.logger.info(
            "Scraping terminé: %s offres récupérées depuis %s",
            len(jobs),
            self.source_name,
        )
        return jobs

    def _find_job_links(self, soup):
        links = []
        seen = set()

        for anchor in soup.select('h2 a[href], h3 a[href], a.job-title[href]'):
            url = urljoin(self.base_url, anchor.get('href', ''))
            title = self.clean_text(anchor.get_text(' ', strip=True))
            if not title or not self._looks_like_job_url(url):
                continue
            if url in seen:
                continue
            seen.add(url)
            links.append(anchor)

        if links:
            return links

        for anchor in soup.find_all('a', href=True):
            url = urljoin(self.base_url, anchor['href'])
            title = self.clean_text(anchor.get_text(' ', strip=True))
            if len(title) < 8 or not self._looks_like_job_url(url):
                continue
            if url in seen:
                continue
            seen.add(url)
            links.append(anchor)

        return links

    def _looks_like_job_url(self, url):
        parsed = urlparse(url)
        if parsed.netloc != urlparse(self.base_url).netloc:
            return False
        return any(marker in parsed.path.lower() for marker in self.job_path_markers)

    def _extract_job(self, anchor, listing_url):
        title = self.clean_text(anchor.get_text(' ', strip=True))
        url = urljoin(listing_url, anchor['href'])
        if not title or title.lower() in {'offres d’emploi', "offres d'emploi"}:
            return None

        container = self._find_container(anchor)
        raw_text = self.clean_text(container.get_text(' ', strip=True))
        description = self._extract_description(container, title)
        company = self._extract_company(container, title)
        location = self._extract_location(raw_text)
        offer_type, category = self._detect_offer_type(raw_text, title)

        return {
            'titre': title,
            'description': description[:500] + ('...' if len(description) > 500 else ''),
            'type': offer_type,
            'entreprise': company or self.source_name,
            'localisation': location or 'Cameroun',
            'date_limite': None,
            'date_publication': self._extract_date(raw_text),
            'source': self.source_name,
            'url_source': url,
            'categories': [category],
        }

    def _find_container(self, anchor):
        node = anchor
        best = anchor.parent
        for _ in range(6):
            node = node.parent
            if not node:
                break
            text_length = len(self.clean_text(node.get_text(' ', strip=True)))
            if 80 <= text_length <= 3500:
                best = node
                if node.name in {'article', 'li'} or self._has_job_class(node):
                    break
        return best

    @staticmethod
    def _has_job_class(node):
        classes = ' '.join(node.get('class', []))
        return any(marker in classes.lower() for marker in ('job', 'offer', 'listing'))

    def _extract_description(self, container, title):
        for selector in (
            '.job-description', '.description', '.job-recruiter',
            '.listing-description', '.job-overview', 'p',
        ):
            node = container.select_one(selector)
            if node:
                text = self.clean_text(node.get_text(' ', strip=True))
                if len(text) >= 20 and text != title:
                    return text

        text = self.clean_text(container.get_text(' ', strip=True))
        text = text.replace(title, '', 1).strip()
        return text if len(text) >= 20 else f"Offre d'emploi: {title}."

    def _extract_company(self, container, title):
        for selector in (
            '.company-name', '.job-company', '.company', '.recruiter',
            '[itemprop="hiringOrganization"]',
        ):
            node = container.select_one(selector)
            if node:
                value = self.clean_text(node.get_text(' ', strip=True))
                if value and value != title:
                    return value
        return ''

    def _extract_location(self, text):
        patterns = [
            (
                r'Région de\s*:\s*(.+?)'
                r'(?=\s+(?:Compétences|Contrat|Niveau|\d{2}[./]\d{2}[./]20\d{2})|$)'
            ),
            r'\b(Douala|Yaoundé|Bafoussam|Bamenda|Bertoua|Buéa|Ebolowa|Garoua|Maroua|Ngaoundéré)\b',
        ]
        for pattern in patterns:
            match = re.search(pattern, text, flags=re.IGNORECASE)
            if match:
                return self.clean_text(match.group(1))
        return ''

    def _detect_offer_type(self, text, title):
        normalized = f"{title} {text}".lower()
        if 'alternance' in normalized or 'apprentissage' in normalized:
            return 'formation', 'Alternance'
        if 'stage' in normalized or 'internship' in normalized or 'intern ' in normalized:
            return 'stage', 'Stage'
        return 'emploi', 'Emploi'

    def _extract_date(self, text):
        for pattern, date_format in (
            (r'\b(\d{2}\.\d{2}\.20\d{2})\b', '%d.%m.%Y'),
            (r'\b(\d{2}/\d{2}/20\d{2})\b', '%d/%m/%Y'),
            (r'\b(20\d{2}-\d{2}-\d{2})\b', '%Y-%m-%d'),
        ):
            match = re.search(pattern, text)
            if match:
                return datetime.strptime(match.group(1), date_format).strftime('%Y-%m-%d')
        return None

    def _is_allowed_by_robots(self, url):
        if not self.respect_robots_txt:
            return True

        parsed = urlparse(url)
        origin = f"{parsed.scheme}://{parsed.netloc}"
        if origin not in self.robots_cache:
            parser = RobotFileParser()
            robots_url = f"{origin}/robots.txt"
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


class EmploisCmScraper(CameroonJobsScraper):
    source_key = 'emplois_cm'
    job_path_markers = ('/offre-emploi-cameroun/', '/job/')


class MinaJobsScraper(CameroonJobsScraper):
    source_key = 'minajobs'
    job_path_markers = ('/emplois-stage-recrutement/',)

    excluded_title_keywords = (
        "appel d'offres", 'appel d’offres', 'marché public',
        'publiez vos offres', 'publier une offre',
    )

    def _extract_job(self, anchor, listing_url):
        title_node = anchor.select_one('.listing-title')
        title = self.clean_text(
            title_node.get_text(' ', strip=True) if title_node else ''
        )
        if not title or any(
            keyword in title.lower()
            for keyword in self.excluded_title_keywords
        ):
            return None

        info_values = [
            self.clean_text(node.get_text(' ', strip=True))
            for node in anchor.select('.listing-info .opaque')
        ]
        company = info_values[0] if info_values else self.source_name
        location = info_values[1] if len(info_values) > 1 else 'Cameroun'
        relative_date = info_values[2] if len(info_values) > 2 else ''
        contract_node = anchor.select_one('.listing-type')
        contract = self.clean_text(
            contract_node.get_text(' ', strip=True) if contract_node else ''
        )
        offer_type, category = self._detect_offer_type(contract, title)

        return {
            'titre': title,
            'description': (
                f"{title}. Entreprise: {company}. "
                f"Type de contrat: {contract or 'Non précisé'}."
            ),
            'type': offer_type,
            'entreprise': company,
            'localisation': self._clean_mina_location(location),
            'date_limite': None,
            'date_publication': self._extract_relative_date(relative_date),
            'source': self.source_name,
            'url_source': urljoin(listing_url, anchor['href']),
            'categories': [category],
        }

    @staticmethod
    def _clean_mina_location(location):
        location = location.replace('-', ' ')
        location = re.sub(r'\bregion\b', '', location, flags=re.IGNORECASE)
        location = re.sub(r'\bcameroun\b', '', location, flags=re.IGNORECASE)
        location = re.sub(r'\s+', ' ', location).strip(' |')
        return location.title() if location else 'Cameroun'

    @staticmethod
    def _extract_relative_date(value):
        match = re.search(r'(\d+)\s+(hour|day|week|month)', value.lower())
        if not match:
            return None

        amount = int(match.group(1))
        unit = match.group(2)
        days = {
            'hour': 0,
            'day': amount,
            'week': amount * 7,
            'month': amount * 30,
        }[unit]
        return (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
