import hashlib
import html
import re
import unicodedata
from urllib.parse import urlparse

from bs4 import BeautifulSoup


PDF_EXTENSIONS = ('.pdf',)


def is_pdf_url(url):
    if not url:
        return False
    return urlparse(url).path.lower().endswith(PDF_EXTENSIONS)


def normalize_text(value):
    if value is None:
        return ''

    text = str(value)
    text = html.unescape(text)
    if '<' in text and '>' in text:
        text = BeautifulSoup(text, 'html.parser').get_text(' ')
    text = text.replace('\ufffd', '')
    text = unicodedata.normalize('NFKC', text)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def normalize_title(value):
    return normalize_text(value)


def normalize_key(value):
    text = normalize_text(value).lower()
    text = unicodedata.normalize('NFKD', text)
    text = ''.join(char for char in text if not unicodedata.combining(char))
    text = re.sub(r'[^a-z0-9]+', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()


def content_hash(opportunity):
    parts = [
        normalize_key(opportunity.get('titre')),
        normalize_key(opportunity.get('description')),
        normalize_key(opportunity.get('source')),
    ]
    return hashlib.sha256('|'.join(parts).encode('utf-8')).hexdigest()


def clean_opportunity(opportunity):
    cleaned = dict(opportunity)
    for field in ('titre', 'description', 'entreprise', 'localisation', 'source'):
        cleaned[field] = normalize_text(cleaned.get(field))

    cleaned['url_source'] = normalize_text(cleaned.get('url_source') or cleaned.get('lien'))

    categories = cleaned.get('categories') or []
    if isinstance(categories, str):
        categories = [categories]
    cleaned['categories'] = [
        normalize_text(category)
        for category in categories
        if normalize_text(category)
    ]

    cleaned['content_hash'] = content_hash(cleaned)
    return cleaned


def is_valid_opportunity(opportunity):
    title = normalize_text(opportunity.get('titre'))
    description = normalize_text(opportunity.get('description'))

    if not title or normalize_key(title) in {'sans titre', 'untitled'}:
        return False
    if not description:
        return False
    return True
