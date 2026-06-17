"""
Simple rule-based classifier for offer/category detection.
Returns one of the predefined categories based on keyword matches in title/description.
"""
import re

# Mapping category -> list of keywords (lowercase)
CATEGORY_KEYWORDS = {
    'Informatique': ['informatique', 'python', 'java', 'developer', 'développeur', 'software', 'data', 'machine learning', 'ia', 'devops', 'backend', 'frontend', 'full[- ]?stack'],
    'Marketing': ['marketing', 'seo', 'social media', 'growth', 'content', 'market'],
    'Finance': ['finance', 'comptable', 'accountant', 'bank', 'investment', 'auditor', 'audit'],
    'Ressources Humaines': ['ressources humaines', 'rh', 'recrut', 'talent', 'hr', 'human resources'],
    'Vente': ['vente', 'sales', 'business development', 'bdm', 'commercial'],
    'Ingénierie': ['ingénierie', 'engineer', 'engineering', 'électrique', 'mécanique'],
    'Design': ['design', 'ui', 'ux', 'graphic', 'designer'],
    'Communication': ['communication', 'press', 'relations publiques', 'pr', 'comms'],
    'Juridique': ['juridique', 'legal', 'law', 'avocat', 'juriste'],
    'Santé': ['santé', 'health', 'medical', 'nurse', 'doctor']
}


def normalize(text: str) -> str:
    if not text:
        return ''
    return text.lower()


def classify_offer(title: str, description: str, default='Autre') -> str:
    """Return the best-matching category for the given title+description.

    Simple scoring: count keyword occurrences for each category and pick the highest.
    """
    text = normalize((title or '') + ' ' + (description or ''))
    scores = {cat: 0 for cat in CATEGORY_KEYWORDS}

    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            # word-boundary match
            try:
                matches = re.findall(r'\b' + kw + r'\b', text)
            except re.error:
                # fallback to simple substring
                matches = [m.start() for m in re.finditer(re.escape(kw), text)]
            scores[cat] += len(matches)

    # pick highest score
    best_cat, best_score = max(scores.items(), key=lambda kv: kv[1])
    if best_score == 0:
        return default
    return best_cat
