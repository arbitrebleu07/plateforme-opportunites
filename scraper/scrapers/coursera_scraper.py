"""
Scraper pour TrainingInformation (remplace l'ancien scraper Coursera)
Site: https://traininginformation.cm
Type: Formations
Récupère les formations par spécialité via le paramètre `specialite`
"""

from base_scraper import BaseScraper
from datetime import datetime
import time
from utils.classifier import classify_offer

# API base découvert dans le bundle JS: https://api.traininginformation.cm
API_BASE = 'https://api.traininginformation.cm'


class CourseraScraper(BaseScraper):
    """
    Scraper adapté pour https://traininginformation.cm/home/eftp
    Itère sur les catégories fournies dans la configuration et récupère
    les formations listées pour chaque spécialité.
    """

    def __init__(self, config):
        super().__init__(config)
        self.base_url = config['SOURCES']['coursera']['url']
        self.source_name = config['SOURCES']['coursera']['name']
        self.offer_type = config['SOURCES']['coursera']['type']
        self.categories = config['SOURCES']['coursera'].get('categories', [])
        # Mapping manuel catégories -> specialite ids (candidates)
        # Ajuster si vous préférez d'autres ids après validation
        self.CATEGORY_TO_SPECIALITES = {
            'Informatique': [652, 651, 114, 299, 140, 419, 287],
            'Marketing': [243, 244, 414, 662],
            'Finance': [215, 216, 452, 453],
            'Ressources Humaines': [284, 393, 223],
            'Vente': [89, 148, 219, 386, 449],
            'Ingénierie': [169, 333, 334],
            'Design': [615, 347, 367, 230, 304],
            'Communication': [175, 176, 282, 407, 490],
            'Juridique': [180, 182, 484, 476, 421],
            'Santé': [234, 96, 189, 227, 129],
        }

    def scrape_courses(self, *args, **kwargs):
        """
        Parcourt les catégories et récupère les formations pour chacune

        Accepts legacy `limit` kwarg used elsewhere (maps to per-category limit).

        Args:
            limit_per_category or limit: nombre max d'offres par catégorie

        Returns:
            Liste d'opportunités (dictionnaires)
        """
        # Support legacy parameter name `limit` from main orchestrator
        limit_per_category = kwargs.get('limit_per_category', kwargs.get('limit', 50))
        """
        Parcourt les catégories et récupère les formations pour chacune

        Args:
            limit_per_category: nombre max d'offres par catégorie

        Returns:
            Liste d'opportunités (dictionnaires)
        """
        self.logger.info(f"Début du scraping de {self.source_name}")

        all_courses = []

        session = self.session
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        })

        # For each configured category, iterate mapped specialite ids and call `/formations`
        for cat in self.categories:
            try:
                self.logger.info(f"Récupération via API pour catégorie: {cat}")
                collected = 0
                page = 1
                per_page = min(limit_per_category, 50)
                # get mapped specialite ids for this human category
                specialite_ids = self.CATEGORY_TO_SPECIALITES.get(cat, [])
                if not specialite_ids:
                    # fallback: try using the raw category string as search
                    specialite_ids = []

                for spec_id in specialite_ids or [None]:
                    page = 1
                    while collected < limit_per_category:
                        params = {
                            'page': page,
                            'limit': per_page
                        }
                        if spec_id:
                            params['specialite'] = spec_id
                        else:
                            params['search'] = cat

                        url = API_BASE + '/formations'
                        try:
                            resp = session.get(
                                url,
                                params=params,
                                timeout=(self.request_timeout[0], 20),
                            )
                        except Exception as e:
                            self.logger.warning(f"Échec requête API pour {cat} spec {spec_id} page {page}: {e}")
                            break

                        if resp.status_code != 200:
                            self.logger.warning(f"API non accessible pour {cat} spec {spec_id}: {resp.status_code}")
                            break

                        data = resp.json()
                        items = data.get('data') or data.get('results') or []
                        if not items:
                            break

                        for it in items:
                            if collected >= limit_per_category:
                                break

                            specialite = it.get('specialite') or {}
                            titre_prof = it.get('titreProfessionnel') or {}
                            etab = it.get('etablissement') or {}

                            title = specialite.get('libelle') or titre_prof.get('libelle') or it.get('titre') or it.get('id')
                            # build a description from available fields to satisfy Laravel validation
                            description = it.get('description') or it.get('contenu') or it.get('objectifs') or titre_prof.get('description') or titre_prof.get('objectifs') or it.get('resume')

                            inferred = classify_offer(title or '', None)
                            url_source = f"{API_BASE}/formations/{it.get('id')}"

                            entreprise = etab.get('name') or etab.get('nom') or self.source_name
                            localisation = etab.get('localisation_siege') or etab.get('localisation') or 'Cameroon'

                            course = {
                                'titre': title,
                                'description': description or title,
                                'type': self.offer_type,
                                'entreprise': entreprise,
                                'localisation': localisation,
                                'date_limite': None,
                                'date_publication': datetime.now().strftime('%Y-%m-%d'),
                                'source': self.source_name,
                                'url_source': url_source,
                                'categories': [inferred if inferred else cat],
                                'meta': {
                                    'specialite_id': spec_id,
                                    'raw': it
                                }
                            }
                            all_courses.append(course)
                            collected += 1

                        page += 1
                        time.sleep(0.3)

            except Exception as e:
                self.logger.error(f"Erreur lors du scraping de la catégorie {cat}: {e}")
                continue

            except Exception as e:
                self.logger.error(f"Erreur lors du scraping de la catégorie {cat}: {e}")
                continue

        self.logger.info(f"Scraping terminé: {len(all_courses)} formations récupérées")
        return all_courses
