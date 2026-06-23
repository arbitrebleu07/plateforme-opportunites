from urllib.parse import urlparse, urlunparse

from utils.cleaning import content_hash, normalize_key


def normalize_url(url):
    if not url:
        return ''

    parsed = urlparse(url.strip())
    scheme = parsed.scheme.lower() or 'https'
    netloc = parsed.netloc.lower()
    path = parsed.path.rstrip('/')
    return urlunparse((scheme, netloc, path, '', '', ''))


class OpportunityDeduplicator:
    def __init__(self):
        self.urls = set()
        self.title_source_keys = set()
        self.hashes = set()

    def add_existing(self, opportunity):
        url = normalize_url(opportunity.get('url_source') or opportunity.get('lien'))
        if url:
            self.urls.add(url)

        title_source = (
            normalize_key(opportunity.get('titre')),
            normalize_key(opportunity.get('source')),
        )
        if title_source[0]:
            self.title_source_keys.add(title_source)

        self.hashes.add(opportunity.get('content_hash') or content_hash(opportunity))

    def is_duplicate(self, opportunity):
        url = normalize_url(opportunity.get('url_source') or opportunity.get('lien'))
        if url and url in self.urls:
            return True

        title_source = (
            normalize_key(opportunity.get('titre')),
            normalize_key(opportunity.get('source')),
        )
        if title_source[0] and title_source in self.title_source_keys:
            return True

        opportunity_hash = opportunity.get('content_hash') or content_hash(opportunity)
        if opportunity_hash in self.hashes:
            return True

        return False

    def remember(self, opportunity):
        self.add_existing(opportunity)
