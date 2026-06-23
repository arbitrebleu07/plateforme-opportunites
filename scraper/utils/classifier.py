"""Classification centralisée des opportunités avant import Laravel."""

import re

from utils.cleaning import normalize_key


CATEGORY_RULES = (
    ('Alternance', ('alternance', 'apprentissage', 'apprenticeship', 'work study')),
    ('Stage', ('stage', 'stagiaire', 'internship', 'intern')),
    ('Certification', ('certification', 'certificate', 'certificat')),
    ('Bourse', ('bourse', 'scholarship', 'fellowship', 'grant')),
    ('Concours', ('concours', 'competitive entrance', 'examen d entree', 'exam entrance')),
    (
        'Appel à candidature',
        ('appel a candidature', 'call for applications', 'candidatures ouvertes'),
    ),
    ('Volontariat', ('volontariat', 'volunteer', 'volontaire')),
    ('Formation', ('formation', 'training', 'course', 'cours', 'bootcamp')),
    ('Recherche', ('recherche', 'research', 'doctorat', 'postdoc', 'phd')),
    ('Conférence', ('conference', 'colloque', 'symposium')),
    ('Atelier', ('atelier', 'workshop')),
    ('Événement', ('evenement', 'event', 'webinar', 'salon')),
    ('Financement', ('financement', 'funding', 'subvention')),
    (
        'Emploi',
        (
            'emploi', 'job', 'recrutement', 'recrute', 'poste a pourvoir',
            'hiring', 'manager', 'officer', 'assistant', 'consultant',
            'developpeur', 'developer', 'commercial', 'comptable',
        ),
    ),
)

SUBCATEGORY_RULES = (
    ('Bourse gouvernementale', ('government', 'gouvernement', 'ministere', 'ministry')),
    ('Bourse universitaire', ('university', 'universite', 'campus')),
    ('Bourse de recherche', ('research', 'recherche', 'doctorat', 'postdoc', 'phd')),
    ('Bourse internationale', ('international', 'etranger', 'foreign')),
    ('Développement web', ('web', 'frontend', 'backend', 'full stack', 'laravel', 'php')),
    ('Data', ('data', 'analytics', 'business intelligence')),
    ('IA', ('intelligence artificielle', 'artificial intelligence', 'machine learning')),
    ('Cybersécurité', ('cyber', 'securite informatique', 'security')),
    ('Réseau', ('reseau', 'network', 'system administrator')),
    ('Comptabilité', ('comptable', 'comptabilite', 'accounting', 'accountant')),
    ('Finance', ('finance', 'financial', 'banking', 'audit')),
    ('RH', ('ressources humaines', 'human resources', 'recruitment', 'recrutement rh')),
    ('Marketing', ('marketing', 'seo', 'community manager', 'growth')),
    ('Commercial', ('commercial', 'vente', 'sales', 'business development')),
    ('Informatique', ('informatique', 'software', 'developpeur', 'developer')),
    ('Design', ('design', 'designer', 'user experience', 'user interface')),
    ('Santé', ('sante', 'health', 'medical', 'infirmier', 'nurse', 'pharmacy')),
    ('Gestion', ('gestion', 'management', 'project manager')),
)

CATEGORY_TO_LEGACY_TYPE = {
    'Stage': 'stage',
    'Alternance': 'formation',
    'Formation': 'formation',
    'Certification': 'formation',
    'Bourse': 'bourses/concours',
    'Concours': 'bourses/concours',
    'Recherche': 'bourses/concours',
    'Financement': 'bourses/concours',
}

TOP_LEVEL_CATEGORIES = {
    label for label, _ in CATEGORY_RULES
} | {'Autre'}

EMPLOYMENT_OVERRIDES = {
    'Alternance', 'Stage', 'Certification', 'Formation', 'Bourse',
    'Concours', 'Appel à candidature', 'Volontariat',
}


def _contains_keyword(text, keyword):
    return re.search(
        rf'(^|[^a-z0-9]){re.escape(normalize_key(keyword))}([^a-z0-9]|$)',
        text,
    ) is not None


def _detect(text, rules):
    for label, keywords in rules:
        if any(_contains_keyword(text, keyword) for keyword in keywords):
            return label
    return None


def classify_opportunity(opportunity):
    categories = opportunity.get('categories') or []
    if isinstance(categories, str):
        categories = [categories]

    title = normalize_key(opportunity.get('titre') or '')
    text = normalize_key(' '.join([
        title,
        opportunity.get('description') or '',
        opportunity.get('source') or '',
        ' '.join(str(category) for category in categories),
    ]))

    original_type = opportunity.get('type')
    title_category = _detect(title, CATEGORY_RULES)

    if original_type in {'emploi', 'stage'}:
        category = (
            title_category
            if title_category in EMPLOYMENT_OVERRIDES
            else ('Stage' if original_type == 'stage' else 'Emploi')
        )
    else:
        category = title_category or _detect(text, CATEGORY_RULES)

    if not category:
        category = {
            'stage': 'Stage',
            'formation': 'Formation',
            'bourses/concours': 'Bourse',
            'emploi': 'Emploi',
        }.get(original_type, 'Autre')

    subcategory = _detect(text, SUBCATEGORY_RULES)
    legacy_type = CATEGORY_TO_LEGACY_TYPE.get(category, 'emploi')
    source_categories = [
        value for value in categories
        if value not in TOP_LEVEL_CATEGORIES
    ]

    classified = dict(opportunity)
    classified['type'] = legacy_type
    classified['categorie_principale'] = category
    classified['sous_categorie'] = subcategory
    classified['categories'] = list(dict.fromkeys(filter(None, [
        category,
        subcategory,
        *source_categories,
    ])))
    return classified


def classify_offer(title, description, default='Autre'):
    """Compatibilité avec l'ancien classificateur de domaine."""
    result = classify_opportunity({
        'titre': title,
        'description': description,
        'type': 'emploi',
    })
    return result['sous_categorie'] or default
