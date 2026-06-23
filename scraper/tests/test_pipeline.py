import os
import logging
import unittest
from unittest.mock import Mock

import requests
from bs4 import BeautifulSoup

from base_scraper import BaseScraper
from scrapers.cameroon_jobs_scraper import EmploisCmScraper, MinaJobsScraper
from scrapers.opportunity_news_scraper import InfosConcoursEducationScraper
from utils.classifier import classify_opportunity
from utils.cleaning import clean_opportunity, is_pdf_url, is_valid_opportunity
from utils.deduplication import OpportunityDeduplicator


class PipelineTest(unittest.TestCase):
    @classmethod
    def tearDownClass(cls):
        logging.shutdown()

    def test_cleaning_removes_html_and_builds_hash(self):
        result = clean_opportunity({
            'titre': '<b>Stage Data</b>',
            'description': '<p>Analyse &amp; reporting</p>',
            'source': 'Example',
            'url_source': 'https://example.com/jobs/1',
        })

        self.assertEqual('Stage Data', result['titre'])
        self.assertEqual('Analyse & reporting', result['description'])
        self.assertEqual(64, len(result['content_hash']))
        self.assertTrue(is_valid_opportunity(result))

    def test_deduplication_uses_normalized_url_and_title_source(self):
        deduplicator = OpportunityDeduplicator()
        deduplicator.remember({
            'titre': 'Développeur Web',
            'description': 'Poste PHP',
            'source': 'Exemple',
            'url_source': 'HTTPS://EXAMPLE.COM/job/1/',
        })

        self.assertTrue(deduplicator.is_duplicate({
            'titre': 'Autre titre',
            'description': 'Autre contenu',
            'source': 'Autre',
            'url_source': 'https://example.com/job/1',
        }))
        self.assertTrue(deduplicator.is_duplicate({
            'titre': 'Developpeur web',
            'description': 'Description modifiée',
            'source': 'exemple',
            'url_source': 'https://example.com/job/2',
        }))

    def test_pdf_detection_ignores_query_string(self):
        self.assertTrue(is_pdf_url('https://example.com/document.PDF?download=1'))

    def test_classifier_detects_category_before_legacy_type(self):
        concours = classify_opportunity({
            'titre': 'Recrutement 2026 par concours administratif',
            'description': 'Concours direct de la fonction publique.',
            'type': 'emploi',
        })
        formation = classify_opportunity({
            'titre': 'Opportunité de formation vacances 2026',
            'description': 'Programme de formation professionnelle.',
            'type': 'emploi',
        })
        scholarship = classify_opportunity({
            'titre': 'International university scholarship 2026',
            'description': 'Fully funded scholarship.',
            'type': 'bourses/concours',
        })
        mechanic = classify_opportunity({
            'titre': 'Mécanicien / Technicien de maintenance',
            'description': "Travail quotidien dans l'atelier de maintenance.",
            'type': 'emploi',
        })
        research_officer = classify_opportunity({
            'titre': 'Monitoring and Research Officer',
            'description': 'Avis de recrutement pour un poste permanent.',
            'type': 'emploi',
        })

        self.assertEqual('Concours', concours['categorie_principale'])
        self.assertEqual('bourses/concours', concours['type'])
        self.assertEqual('Formation', formation['categorie_principale'])
        self.assertEqual('formation', formation['type'])
        self.assertEqual('Bourse', scholarship['categorie_principale'])
        self.assertEqual('Bourse universitaire', scholarship['sous_categorie'])
        self.assertEqual('Emploi', mechanic['categorie_principale'])
        self.assertEqual('Emploi', research_officer['categorie_principale'])

    def test_unavailable_source_is_skipped_after_connection_timeout(self):
        scraper = BaseScraper({
            'LOG_CONFIG': {
                'level': 'CRITICAL',
                'format': '%(message)s',
                'file': os.devnull,
            },
            'HTTP_CONFIG': {
                'connect_timeout': 5,
                'read_timeout': 30,
                'retry_total': 3,
                'retry_connect': 2,
                'backoff_factor': 1,
            },
        })
        scraper.session.get = Mock(side_effect=requests.ConnectTimeout('source indisponible'))

        self.assertIsNone(scraper.get_page('https://unavailable.example'))
        scraper.session.get.assert_called_once_with(
            'https://unavailable.example',
            timeout=(5, 30),
        )
        scraper.close()

    def test_news_scraper_keeps_open_opportunity_and_ignores_results(self):
        scraper = InfosConcoursEducationScraper({
            'LOG_CONFIG': {
                'level': 'CRITICAL',
                'format': '%(message)s',
                'file': os.devnull,
            },
            'HTTP_CONFIG': {
                'connect_timeout': 5,
                'read_timeout': 30,
                'retry_total': 3,
                'retry_connect': 2,
                'backoff_factor': 1,
            },
            'SOURCES': {
                'infos_concours_education': {
                    'name': 'Infos Concours Education',
                    'url': 'https://infosconcourseducation.com/',
                    'type': 'bourses/concours',
                    'delay': 6,
                    'max_results': 20,
                },
            },
        })
        soup = BeautifulSoup("""
            <main>
              <article>
                <h2><a href="/bourse-mastercard-2026">Bourse Mastercard 2026</a></h2>
                <p>Candidatures ouvertes aux étudiants camerounais.</p>
                <time datetime="2026-06-20T08:00:00">20 juin 2026</time>
              </article>
              <article>
                <h2><a href="/resultats-police">Résultats concours Police 2026</a></h2>
                <p>Liste définitive des candidats admis.</p>
              </article>
            </main>
        """, 'html.parser')

        rows = [
            scraper._extract_listing_article(article, scraper.base_url)
            for article in scraper._find_article_blocks(soup)
        ]
        rows = [row for row in rows if row]

        self.assertEqual(1, len(rows))
        self.assertEqual('Bourse', rows[0]['categories'][0])
        self.assertEqual('2026-06-20', rows[0]['date_publication'])
        scraper.close()

    def test_cameroon_job_scraper_extracts_contract_location_and_date(self):
        scraper = EmploisCmScraper({
            'LOG_CONFIG': {
                'level': 'CRITICAL',
                'format': '%(message)s',
                'file': os.devnull,
            },
            'HTTP_CONFIG': {
                'connect_timeout': 5,
                'read_timeout': 30,
                'retry_total': 3,
                'retry_connect': 2,
                'backoff_factor': 1,
            },
            'SOURCES': {
                'emplois_cm': {
                    'name': 'Emploi.cm',
                    'url': 'https://www.emploi.cm',
                    'delay': 6,
                    'max_results': 20,
                },
            },
        })
        soup = BeautifulSoup("""
            <article class="job-listing">
              <h3>
                <a href="/offre-emploi-cameroun/developpeur-laravel-42">
                  Développeur Laravel
                </a>
              </h3>
              <a class="company-name">Entreprise Test</a>
              <p class="job-description">Développer et maintenir les applications web.</p>
              <div>
                Contrat proposé : CDI
                Région de : Yaoundé
                19.06.2026
              </div>
            </article>
        """, 'html.parser')

        anchor = scraper._find_job_links(soup)[0]
        job = scraper._extract_job(anchor, scraper.base_url)

        self.assertEqual('emploi', job['type'])
        self.assertEqual('Entreprise Test', job['entreprise'])
        self.assertEqual('Yaoundé', job['localisation'])
        self.assertEqual('2026-06-19', job['date_publication'])
        scraper.close()

    def test_minajobs_scraper_uses_structured_listing_fields(self):
        scraper = MinaJobsScraper({
            'LOG_CONFIG': {
                'level': 'CRITICAL',
                'format': '%(message)s',
                'file': os.devnull,
            },
            'HTTP_CONFIG': {
                'connect_timeout': 5,
                'read_timeout': 30,
                'retry_total': 3,
                'retry_connect': 2,
                'backoff_factor': 1,
            },
            'SOURCES': {
                'minajobs': {
                    'name': 'MinaJobs',
                    'url': 'https://www.minajobs.net',
                    'delay': 6,
                    'max_results': 20,
                },
            },
        })
        soup = BeautifulSoup("""
          <a href="/emplois-stage-recrutement/42/hr-intern">
            <div class="listing-title">Human Resources Intern</div>
            <div class="listing-info">
              <span class="opaque">OIM Cameroun</span>
              <span class="opaque">yaounde-region-centre-cameroun</span>
              <span class="opaque">6 hours ago</span>
            </div>
            <div class="listing-type">Stage</div>
          </a>
        """, 'html.parser')

        anchor = scraper._find_job_links(soup)[0]
        job = scraper._extract_job(anchor, scraper.base_url)

        self.assertEqual('Human Resources Intern', job['titre'])
        self.assertEqual('stage', job['type'])
        self.assertEqual('OIM Cameroun', job['entreprise'])
        self.assertEqual('Yaounde Centre', job['localisation'])

        training_soup = BeautifulSoup("""
          <a href="/emplois-stage-recrutement/43/formation-vacances">
            <div class="listing-title">Opportunité de formation vacances 2026</div>
            <div class="listing-info">
              <span class="opaque">Institut Test</span>
            </div>
          </a>
        """, 'html.parser')
        training_anchor = scraper._find_job_links(training_soup)[0]
        training = scraper._extract_job(training_anchor, scraper.base_url)
        classified_training = classify_opportunity(training)
        self.assertEqual('Formation', classified_training['categorie_principale'])
        self.assertEqual('formation', classified_training['type'])

        promotion_soup = BeautifulSoup("""
          <a href="/emplois-stage-recrutement/44/publiez-vos-offres">
            <div class="listing-title">Publiez vos offres d'Emplois et Stages</div>
          </a>
        """, 'html.parser')
        promotion_anchor = scraper._find_job_links(promotion_soup)[0]
        self.assertIsNone(scraper._extract_job(promotion_anchor, scraper.base_url))
        scraper.close()


if __name__ == '__main__':
    unittest.main()
