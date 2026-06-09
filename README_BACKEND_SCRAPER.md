# Plateforme d'Opportunités - Guide Complet Backend & Scraper

Ce guide explique en détail l'architecture et le fonctionnement du backend Laravel et du scraper Python pour la plateforme d'opportunités.

---

## 📋 Table des matières

1. [Architecture Globale](#architecture-globale)
2. [Backend Laravel](#backend-laravel)
3. [Scraper Python](#scraper-python)
4. [Communication Backend-Scraper](#communication-backend-scraper)
5. [Installation et Configuration](#installation-et-configuration)
6. [Lancement du Système](#lancement-du-système)
7. [Maintenance et Débogage](#maintenance-et-débogage)

---

## 🏗️ Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vue)                     │
│                    (Interface utilisateur)                  │
└────────────────────────┬────────────────────────────────────┘
                         │ API REST
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  BACKEND LARAVEL                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Routes (api.php)                                    │   │
│  │  - POST /api/scraper/offres (sans auth)              │   │
│  │  - POST /api/offres/clean-duplicates (sans auth)     │   │
│  │  - GET /api/offres (public)                          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Controllers (OffreController.php)                   │   │
│  │  - scraperStore() : Création d'offres via scraper    │   │
│  │  - cleanDuplicates() : Nettoyage des doublons        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Models (Eloquent ORM)                               │   │ 
│  │  - Offre : id_offre, titre, description, type, ...   │   │
│  │  - Categorie : id_categorie, nom                     │   │
│  │  - Source : id_source, nom                           │   │
│  └──────────────────────────────────────────────────────    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Database (MySQL)                                    │   │
│  │  - offres, categories, sources, classers, provenirs  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ API POST
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  SCRAPER PYTHON                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  main.py (Orchestrateur)                             │   │
│  │  - ScraperOrchestrator : Gère tous les scrapers      │   │
│  │  - get_existing_offres() : Récupère offres existantes│   │
│  │  - send_to_laravel() : Envoie nouvelles offres       │   │
│  │  - remove_duplicates() : Déduplication locale        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Scrapers Individuels                                │   │
│  │  - opportunity_desk_scraper.py                       │   │
│  │  - scholarship_positions_scraper.py                  │   │
│  │  - jooble_scraper.py (API Jooble)                    │   │
│  │  - coursera_scraper.py (API Coursera)                │   │
│  │  - emplois_cm_scraper.py                             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  base_scraper.py (Classe de base)                    │   │
│  │  - get_page() : Fetch avec requests                  │   │
│  │  - get_page_selenium() : Fetch avec Selenium         │   │
│  │  - parse_html() : Parsing BeautifulSoup              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  config.py (Configuration)                           │   │
│  │  - URLs des sources                                  │   │
│  │  - Activation/désactivation des scrapers             │   │
│  │  - Configuration Laravel API                         │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP Requests
                         │
┌────────────────────────▼────────────────────────────────────┐
│              SOURCES EXTERNES                               │
│  - opportunitydesk.org (bourses/concours)                   │
│  - scholarship-positions.com (bourses)                      │
│  - Jooble API (emplois)                                     │
│  - Coursera API (formations)                                │
│  - emploi.cm (stages Cameroun)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Backend Laravel

### Structure du Projet

```
plateforme-opportunites/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── OffreController.php    # Gestion des offres
│   └── Models/
│       ├── Offre.php                  # Modèle Offre
│       ├── Categorie.php              # Modèle Categorie
│       └── Source.php                 # Modèle Source
├── database/
│   └── migrations/                    # Migrations de la BDD
├── routes/
│   └── api.php                        # Routes API
└── .env                               # Configuration environnement
```

### Modèle Offre (app/Models/Offre.php)

```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Offre extends Model
{
    // Clé primaire personnalisée
    protected $primaryKey = 'id_offre';
    
    // Champs modifiables
    protected $fillable = [
        'titre', 'description', 'type', 'entreprise',
        'localisation', 'date_limite', 'statut', 'source', 
        'date_publication', 'id_utilisateur'
    ];

    // Relation avec les catégories (many-to-many)
    public function categories()
    {
        return $this->belongsToMany(Categorie::class, 'classers', 'id_offre', 'id_categorie');
    }

    // Relation avec les sources (many-to-many)
    public function sources()
    {
        return $this->belongsToMany(Source::class, 'provenirs', 'id_offre', 'id_source');
    }
}
```

**Points clés :**
- `protected $primaryKey = 'id_offre'` : Laravel utilise par défaut `id`, mais notre table utilise `id_offre`
- `protected $fillable` : Liste des champs modifiables via mass assignment
- Relations many-to-many : Une offre peut avoir plusieurs catégories et sources

### OffreController (app/Http/Controllers/OffreController.php)

#### Méthode scraperStore() - Création via Scraper

```php
public function scraperStore(Request $request)
{
    // Validation des données
    $request->validate([
        'titre'       => 'required|string|max:255',
        'description' => 'required|string',
        'type'        => 'required|in:emploi,stage,bourses/concours,formation',
        'entreprise'  => 'nullable|string',
        'localisation'=> 'nullable|string',
        'date_limite' => 'nullable|date',
        'date_publication' => 'nullable|date',
        'source'      => 'nullable|string',
        'url_source'  => 'nullable|string',
        'categories'  => 'nullable|array',
        'categories.*' => 'string',
    ]);

    // Vérification des doublons (basé sur le titre)
    $existingOffre = Offre::where('titre', $request->titre)->first();

    if ($existingOffre) {
        return response()->json([
            'message' => 'Offre déjà existante',
            'offre' => $existingOffre->load('categories', 'sources')
        ], 200);
    }

    // Création de l'offre
    $offre = Offre::create([
        'titre'            => $request->titre,
        'description'      => $request->description,
        'type'             => $request->type,
        'entreprise'       => $request->entreprise,
        'localisation'     => $request->localisation,
        'date_limite'      => $request->date_limite,
        'date_publication' => $request->date_publication ?? now(),
        'statut'           => 'active',
        'id_utilisateur'   => null, // Pas d'utilisateur pour le scraper
    ]);

    // Attacher les catégories (par nom, création automatique si inexistant)
    if ($request->has('categories') && is_array($request->categories)) {
        foreach ($request->categories as $categoryName) {
            $category = Categorie::firstOrCreate(['nom' => $categoryName]);
            $offre->categories()->attach($category->id_categorie);
        }
    }

    // Créer ou lier la source
    if ($request->source) {
        $source = Source::firstOrCreate(['nom' => $request->source]);
        $offre->sources()->attach($source->id_source);
    }

    return response()->json($offre->load('categories', 'sources'), 201);
}
```

**Points clés :**
- Validation des champs requis
- Vérification des doublons avant création
- `firstOrCreate()` : Crée la catégorie/source si elle n'existe pas
- `attach()` : Lie l'offre à la catégorie/source dans la table pivot
- Retourne 201 si création, 200 si doublon

#### Méthode cleanDuplicates() - Nettoyage des Doublons

```php
public function cleanDuplicates()
{
    // Trouver les doublons basés sur le titre
    $duplicates = \DB::table('offres')
        ->select('titre', \DB::raw('COUNT(*) as count'))
        ->groupBy('titre')
        ->having('count', '>', 1)
        ->get();

    $deletedCount = 0;

    foreach ($duplicates as $duplicate) {
        // Garder la première occurrence (id_offre le plus bas)
        $firstOffre = Offre::where('titre', $duplicate->titre)
            ->orderBy('id_offre', 'asc')
            ->first();

        // Supprimer les autres
        $othersToDelete = Offre::where('titre', $duplicate->titre)
            ->where('id_offre', '!=', $firstOffre->id_offre)
            ->get();

        foreach ($othersToDelete as $offre) {
            $offre->delete();
            $deletedCount++;
        }
    }

    return response()->json([
        'message' => 'Nettoyage terminé',
        'duplicates_found' => $duplicates->count(),
        'deleted_count' => $deletedCount
    ]);
}
```

**Points clés :**
- Utilise `\DB::table()` pour les requêtes SQL brutes
- `groupBy('titre')` + `having('count', '>', 1)` : Identifie les titres en double
- `orderBy('id_offre', 'asc')` : Garde l'offre la plus ancienne
- Supprime toutes les autres occurrences

### Routes API (routes/api.php)

```php
// Endpoint pour le scraper (création d'offres sans authentification)
Route::post('/scraper/offres', [OffreController::class, 'scraperStore']);

// Endpoint pour nettoyer les doublons (sans authentification)
Route::post('/offres/clean-duplicates', [OffreController::class, 'cleanDuplicates']);

// Endpoint public pour lister les offres
Route::get('/offres', [OffreController::class, 'index']);
```

**Points clés :**
- Pas de middleware d'authentification pour les endpoints du scraper
- Le scraper peut créer des offres sans être connecté
- `OffreController::class` : Notation de classe Laravel (PHP 8+)

### Base de Données

#### Table `offres`

```sql
CREATE TABLE offres (
    id_offre INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type ENUM('emploi', 'stage', 'bourses/concours', 'formation') NOT NULL,
    entreprise VARCHAR(255),
    localisation VARCHAR(255),
    date_limite DATE,
    statut VARCHAR(50) DEFAULT 'active',
    source VARCHAR(255),
    date_publication DATETIME,
    id_utilisateur INT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### Table `categories`

```sql
CREATE TABLE categories (
    id_categorie INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### Table `sources`

```sql
CREATE TABLE sources (
    id_source INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### Tables pivot (relations many-to-many)

```sql
CREATE TABLE classers (
    id_offre INT,
    id_categorie INT,
    PRIMARY KEY (id_offre, id_categorie),
    FOREIGN KEY (id_offre) REFERENCES offres(id_offre),
    FOREIGN KEY (id_categorie) REFERENCES categories(id_categorie)
);

CREATE TABLE provenirs (
    id_offre INT,
    id_source INT,
    PRIMARY KEY (id_offre, id_source),
    FOREIGN KEY (id_offre) REFERENCES offres(id_offre),
    FOREIGN KEY (id_source) REFERENCES sources(id_source)
);
```

---

## 🕷️ Scraper Python

### Structure du Projet

```
scraper/
├── main.py                          # Orchestrateur principal
├── config.py                        # Configuration
├── base_scraper.py                  # Classe de base pour les scrapers
├── requirements.txt                 # Dépendances Python
├── scrapers/
│   ├── opportunity_desk_scraper.py
│   ├── scholarship_positions_scraper.py
│   ├── jooble_scraper.py
│   ├── coursera_scraper.py
│   └── emplois_cm_scraper.py
└── scraper.log                     # Fichier de log
```

### Configuration (config.py)

```python
# Configuration de l'API Laravel
LARAVEL_API = {
    'base_url': 'http://127.0.0.1:8000/api',
}

# Configuration des sources
SOURCES = {
    'opportunity_desk': {
        'enabled': True,
        'url': 'https://www.opportunitydesk.org',
        'delay': 2,
    },
    'scholarship_positions': {
        'enabled': True,
        'url': 'https://www.scholarship-positions.com',
        'delay': 2,
    },
    'jooble': {
        'enabled': True,
        'api_key': 'VOTRE_CLE_API_JOOGLE',
        'delay': 1,
    },
    'coursera': {
        'enabled': True,
        'api_url': 'https://api.coursera.org/api/courses.v1',
        'delay': 1,
    },
    'emplois_cm': {
        'enabled': True,
        'url': 'https://www.emploi.cm',
        'delay': 2,
    },
}
```

### Classe de Base (base_scraper.py)

```python
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import logging

class BaseScraper:
    def __init__(self, name, config):
        self.name = name
        self.config = config
        self.logger = logging.getLogger(name)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

    def get_page(self, url):
        """Récupère une page avec requests (pour les sites statiques)"""
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            return response.text
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération de {url}: {e}")
            return None

    def get_page_selenium(self, url):
        """Récupère une page avec Selenium (pour les sites dynamiques/SPA)"""
        try:
            options = webdriver.ChromeOptions()
            options.add_argument('--headless')  # Mode sans interface graphique
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            
            driver = webdriver.Chrome(
                service=Service(ChromeDriverManager().install()),
                options=options
            )
            
            driver.get(url)
            time.sleep(2)  # Attendre le chargement
            html = driver.page_source
            driver.quit()
            
            return html
        except Exception as e:
            self.logger.error(f"Erreur Selenium: {e}")
            return None

    def parse_html(self, html):
        """Parse le HTML avec BeautifulSoup"""
        return BeautifulSoup(html, 'html.parser')
```

**Points clés :**
- `requests.Session()` : Maintient une session HTTP (cookies, headers)
- `User-Agent` : Simule un navigateur pour éviter le blocage
- Selenium : Pour les sites avec JavaScript/SPA
- `headless` : Mode sans interface graphique (plus rapide)

### Orchestrateur (main.py)

```python
import logging
import requests
from config import LARAVEL_API, SOURCES
from scrapers.opportunity_desk_scraper import OpportunityDeskScraper
from scrapers.scholarship_positions_scraper import ScholarshipPositionsScraper
from scrapers.jooble_scraper import JoobleScraper
from scrapers.coursera_scraper import CourseraScraper
from scrapers.emplois_cm_scraper import EmploisCmScraper

class ScraperOrchestrator:
    def __init__(self):
        self.scrapers = []
        self._init_scrapers()
        self._setup_logging()

    def _init_scrapers(self):
        """Initialise les scrapers activés"""
        if SOURCES['opportunity_desk']['enabled']:
            self.scrapers.append(OpportunityDeskScraper(SOURCES['opportunity_desk']))
        if SOURCES['scholarship_positions']['enabled']:
            self.scrapers.append(ScholarshipPositionsScraper(SOURCES['scholarship_positions']))
        if SOURCES['jooble']['enabled']:
            self.scrapers.append(JoobleScraper(SOURCES['jooble']))
        if SOURCES['coursera']['enabled']:
            self.scrapers.append(CourseraScraper(SOURCES['coursera']))
        if SOURCES['emplois_cm']['enabled']:
            self.scrapers.append(EmploisCmScraper(SOURCES['emplois_cm']))

    def _setup_logging(self):
        """Configure le logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('scraper.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger('ScraperOrchestrator')

    def run_all_scrapers(self):
        """Exécute tous les scrapers et retourne les opportunités"""
        self.logger.info("Début de l'exécution des scrapers")
        
        all_opportunities = []
        
        for scraper in self.scrapers:
            try:
                self.logger.info(f"Exécution du scraper: {scraper.__class__.__name__}")
                
                # Exécuter selon le type de scraper
                if isinstance(scraper, OpportunityDeskScraper):
                    opportunities = scraper.scrape_opportunities(limit=50)
                elif isinstance(scraper, ScholarshipPositionsScraper):
                    opportunities = scraper.scrape_scholarships(limit=50)
                elif isinstance(scraper, JoobleScraper):
                    search_terms = ["developer", "marketing", "design", "data analyst"]
                    opportunities = []
                    for term in search_terms:
                        jobs = scraper.scrape_jobs(search_query=term, limit=10)
                        opportunities.extend(jobs)
                elif isinstance(scraper, CourseraScraper):
                    opportunities = scraper.scrape_courses(limit=50)
                elif isinstance(scraper, EmploisCmScraper):
                    opportunities = scraper.scrape_jobs(job_type="stage", limit=50)
                
                all_opportunities.extend(opportunities)
                self.logger.info(f"{len(opportunities)} opportunités récupérées")
                
            except Exception as e:
                self.logger.error(f"Erreur: {e}")
                continue
        
        # Déduplication locale
        unique_opportunities = self.remove_duplicates(all_opportunities)
        return unique_opportunities

    def remove_duplicates(self, opportunities):
        """Supprime les doublons basés sur le lien ou le titre"""
        seen_links = set()
        unique_opportunities = []
        
        for opportunity in opportunities:
            link = opportunity.get('lien', '')
            if link and link not in seen_links:
                seen_links.add(link)
                unique_opportunities.append(opportunity)
            elif not link:
                title = opportunity.get('titre', '')
                if title and title not in seen_links:
                    seen_links.add(title)
                    unique_opportunities.append(opportunity)
        
        return unique_opportunities

    def get_existing_offres(self):
        """Récupère les offres existantes depuis l'API Laravel"""
        try:
            api_url = f"{LARAVEL_API['base_url']}/offres"
            response = requests.get(api_url, timeout=30)
            
            if response.status_code == 200:
                offres = response.json()
                existing_titles = {offre['titre'] for offre in offres}
                self.logger.info(f"{len(existing_titles)} offres existantes récupérées")
                return existing_titles
            return set()
        except Exception as e:
            self.logger.error(f"Erreur: {e}")
            return set()

    def send_to_laravel(self, opportunities):
        """Envoie les opportunités à l'API Laravel"""
        self.logger.info("Envoi des opportunités à l'API Laravel")
        
        # Récupérer les offres existantes
        existing_titles = self.get_existing_offres()
        
        api_url = f"{LARAVEL_API['base_url']}/scraper/offres"
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        success_count = 0
        skipped_count = 0
        error_count = 0
        
        for opportunity in opportunities:
            try:
                # Vérifier si l'offre existe déjà
                if opportunity['titre'] in existing_titles:
                    self.logger.info(f"Offre déjà existante (skipped): {opportunity['titre'][:50]}...")
                    skipped_count += 1
                    continue
                
                # Préparer les données
                simplified_data = {
                    'titre': opportunity['titre'],
                    'description': opportunity['description'],
                    'type': opportunity['type'],
                    'entreprise': opportunity['entreprise'],
                    'localisation': opportunity['localisation'],
                    'date_limite': opportunity['date_limite'],
                    'date_publication': opportunity['date_publication'],
                }
                
                # Envoyer à l'API
                response = requests.post(api_url, json=simplified_data, headers=headers, timeout=30)
                
                if response.status_code == 201:
                    success_count += 1
                    self.logger.info(f"Opportunité envoyée: {opportunity['titre']}")
                elif response.status_code == 200:
                    skipped_count += 1
                    self.logger.info(f"Offre déjà existante (API): {opportunity['titre'][:50]}...")
                else:
                    error_count += 1
                    self.logger.error(f"Erreur: {response.status_code}")
                
            except Exception as e:
                error_count += 1
                self.logger.error(f"Erreur: {e}")
        
        self.logger.info(f"Envoi terminé: {success_count} succès, {skipped_count} ignorés, {error_count} erreurs")

# Point d'entrée
if __name__ == "__main__":
    orchestrator = ScraperOrchestrator()
    opportunities = orchestrator.run_all_scrapers()
    orchestrator.send_to_laravel(opportunities)
```

**Points clés :**
- `isinstance()` : Vérifie le type de scraper pour appeler la bonne méthode
- Déduplication en deux niveaux : locale (Python) + serveur (Laravel)
- `set()` : Structure de données pour les doublons (recherche O(1))
- Logging : Fichier + console pour le débogage

### Exemple de Scraper (opportunity_desk_scraper.py)

```python
from base_scraper import BaseScraper
from bs4 import BeautifulSoup
import logging

class OpportunityDeskScraper(BaseScraper):
    def scrape_opportunities(self, limit=20):
        """Scrape les opportunités depuis Opportunity Desk"""
        self.logger.info(f"Scraping Opportunity Desk (limit: {limit})")
        
        url = f"{self.config['url']}/opportunities"
        html = self.get_page(url)
        
        if not html:
            return []
        
        soup = self.parse_html(html)
        opportunities = []
        
        # Sélecteurs CSS (à adapter selon le site)
        cards = soup.select('.post-card')[:limit]
        
        for card in cards:
            try:
                title_elem = card.select_one('.entry-title a')
                desc_elem = card.select_one('.entry-content')
                link_elem = card.select_one('.entry-title a')
                
                if not title_elem:
                    continue
                
                title = title_elem.get_text(strip=True)
                description = desc_elem.get_text(strip=True) if desc_elem else "Pas de description"
                link = link_elem.get('href') if link_elem else ""
                
                # Déterminer le type
                opp_type = self._determine_type(title, description)
                
                opportunity = {
                    'titre': title,
                    'description': description,
                    'type': opp_type,
                    'entreprise': '',
                    'localisation': '',
                    'date_limite': None,
                    'date_publication': None,
                    'lien': link,
                }
                
                opportunities.append(opportunity)
                
            except Exception as e:
                self.logger.error(f"Erreur extraction: {e}")
                continue
        
        self.logger.info(f"{len(opportunities)} opportunités extraites")
        return opportunities

    def _determine_type(self, title, description):
        """Détermine le type d'opportunité"""
        title_lower = title.lower()
        desc_lower = description.lower()
        
        if 'scholarship' in title_lower or 'fellowship' in title_lower:
            return 'bourses/concours'
        elif 'internship' in title_lower or 'trainee' in title_lower:
            return 'stage'
        elif 'job' in title_lower or 'position' in title_lower:
            return 'emploi'
        else:
            return 'bourses/concours'  # Par défaut
```

**Points clés :**
- Sélecteurs CSS : `.post-card`, `.entry-title a`, `.entry-content`
- `get_text(strip=True)` : Extrait le texte sans espaces inutiles
- `get('href')` : Extrait l'attribut href
- Gestion des erreurs avec try/except pour chaque carte

### Scraper avec API (jooble_scraper.py)

```python
from base_scraper import BaseScraper
import requests
import logging

class JoobleScraper(BaseScraper):
    def scrape_jobs(self, search_query="developer", limit=10):
        """Scrape les jobs via l'API Jooble"""
        self.logger.info(f"Scraping Jooble: {search_query} (limit: {limit})")
        
        api_url = "https://jooble.org/api/"
        api_key = self.config.get('api_key', '')
        
        if not api_key:
            self.logger.error("Clé API Jooble manquante")
            return []
        
        payload = {
            'key': api_key,
            'keywords': search_query,
            'page': 1,
        }
        
        try:
            response = requests.post(api_url, json=payload, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            jobs = data.get('jobs', [])[:limit]
            
            opportunities = []
            for job in jobs:
                opportunity = {
                    'titre': job.get('title', ''),
                    'description': job.get('description', ''),
                    'type': 'emploi',
                    'entreprise': job.get('company', ''),
                    'localisation': job.get('location', ''),
                    'date_limite': None,
                    'date_publication': None,
                    'lien': job.get('link', ''),
                }
                opportunities.append(opportunity)
            
            self.logger.info(f"{len(opportunities)} jobs récupérés")
            return opportunities
            
        except Exception as e:
            self.logger.error(f"Erreur API Jooble: {e}")
            return []
```

**Points clés :**
- API REST : POST avec JSON payload
- `response.json()` : Parse la réponse JSON
- Gestion de la clé API via config

---

## 🔗 Communication Backend-Scraper

### Flux de Données

```
1. Scraper Python lance main.py
   ↓
2. Orchestrateur exécute tous les scrapers
   ↓
3. Chaque scraper récupère les données de sa source
   ↓
4. Orchestrateur déduplique les données localement
   ↓
5. Orchestrateur récupère les offres existantes via GET /api/offres
   ↓
6. Orchestrateur envoie les nouvelles offres via POST /api/scraper/offres
   ↓
7. Laravel vérifie les doublons et crée les offres
   ↓
8. Laravel retourne 201 (créé) ou 200 (doublon)
```

### Format des Données Envoyées

```json
{
    "titre": "Software Engineer- Yaoundé",
    "description": "We are looking for a passionate Software Engineer...",
    "type": "emploi",
    "entreprise": "Tech Company",
    "localisation": "Yaoundé",
    "date_limite": "2026-12-31",
    "date_publication": "2026-06-01"
}
```

### Réponse de l'API

**Création réussie (201) :**
```json
{
    "id_offre": 100,
    "titre": "Software Engineer- Yaoundé",
    "description": "...",
    "type": "emploi",
    "statut": "active",
    "categories": [],
    "sources": []
}
```

**Doublon détecté (200) :**
```json
{
    "message": "Offre déjà existante",
    "offre": {
        "id_offre": 56,
        "titre": "Software Engineer- Yaoundé",
        ...
    }
}
```

---

## 🚀 Installation et Configuration

### Prérequis

- **PHP 8.0+** avec Composer
- **MySQL 5.7+** ou MariaDB
- **Python 3.8+** avec pip
- **Node.js 16+** (pour le frontend, optionnel)

### Installation Backend Laravel

```bash
# 1. Cloner le projet
cd c:\xampp\htdocs\plateforme-opportunites

# 2. Installer les dépendances
composer install

# 3. Configurer l'environnement
cp .env.example .env
php artisan key:generate

# 4. Configurer la base de données dans .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=plateforme_opportunites
DB_USERNAME=root
DB_PASSWORD=

# 5. Exécuter les migrations
php artisan migrate

# 6. Démarrer le serveur Laravel
php artisan serve
```

### Installation Scraper Python

```bash
# 1. Aller dans le dossier scraper
cd scraper

# 2. Créer un environnement virtuel (recommandé)
python -m venv venv

# 3. Activer l'environnement virtuel
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 4. Installer les dépendances
pip install -r requirements.txt
```

### requirements.txt

```
requests==2.31.0
beautifulsoup4==4.12.2
selenium==4.15.2
webdriver-manager==4.0.1
lxml==4.9.3
```

### Configuration du Scraper

Éditer `scraper/config.py` :

```python
LARAVEL_API = {
    'base_url': 'http://127.0.0.1:8000/api',  # URL de votre API Laravel
}

SOURCES = {
    'opportunity_desk': {
        'enabled': True,  # True pour activer, False pour désactiver
        'url': 'https://www.opportunitydesk.org',
        'delay': 2,  # Délai en secondes entre les requêtes
    },
    'jooble': {
        'enabled': True,
        'api_key': 'VOTRE_CLE_API_JOOGLE',  # Obtenir sur https://jooble.org/api
        'delay': 1,
    },
    # ... autres sources
}
```

---

## ▶️ Lancement du Système

### 1. Démarrer Laravel

```bash
# Dans le dossier du projet Laravel
php artisan serve
```

Le serveur sera accessible sur `http://127.0.0.1:8000`

### 2. Lancer le Scraper

```bash
# Dans le dossier scraper (avec venv activé)
python main.py
```

### 3. Vérifier les Logs

```bash
# Voir le fichier de log
type scraper.log  # Windows
cat scraper.log   # Linux/Mac
```

### 4. Nettoyer les Doublons (si nécessaire)

```bash
# Via PowerShell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/offres/clean-duplicates" -Method POST -ContentType "application/json"

# Via curl (Linux/Mac)
curl -X POST http://127.0.0.1:8000/api/offres/clean-duplicates -H "Content-Type: application/json"
```

---

## 🔧 Maintenance et Débogage

### Problèmes Courants

#### 1. Erreur de connexion à la base de données Laravel

**Symptôme :** `SQLSTATE[HY000] [2002] Connection refused`

**Solution :**
- Vérifier que MySQL est démarré
- Vérifier les credentials dans `.env`
- Vérifier que la base de données existe

```bash
# MySQL
mysql -u root -p
CREATE DATABASE plateforme_opportunites;
```

#### 2. Scraper retourne 0 résultats

**Symptôme :** `0 opportunités récupérées`

**Solutions :**
- Vérifier que le site cible est accessible
- Vérifier les sélecteurs CSS (ils peuvent changer)
- Utiliser le mode debug pour voir le HTML

```python
# Ajouter dans le scraper
with open('debug.html', 'w', encoding='utf-8') as f:
    f.write(html)
```

#### 3. Erreur UnicodeEncodeError dans les logs

**Symptôme :** `UnicodeEncodeError: 'charmap' codec can't encode character`

**Solution :** Déjà géré dans le code avec try/except

#### 4. Selenium WinError 193

**Symptôme :** `WinError 193 %1 is not a valid Win32 application`

**Solution :** Utiliser `ChromeDriverManager().install()` au lieu de spécifier l'architecture

#### 5. API Jooble retourne une erreur

**Symptôme :** `401 Unauthorized` ou `403 Forbidden`

**Solution :**
- Vérifier que la clé API est correcte
- Vérifier que vous n'avez pas dépassé la limite de requêtes

### Ajouter un Nouveau Scraper

1. Créer un fichier dans `scrapers/` : `nouveau_scraper.py`
2. Hériter de `BaseScraper`
3. Implémenter la méthode de scraping
4. Ajouter la configuration dans `config.py`
5. Ajouter l'import et l'initialisation dans `main.py`

**Exemple :**

```python
# scrapers/nouveau_scraper.py
from base_scraper import BaseScraper

class NouveauScraper(BaseScraper):
    def scrape_opportunities(self, limit=20):
        url = f"{self.config['url']}/opportunities"
        html = self.get_page(url)
        
        if not html:
            return []
        
        soup = self.parse_html(html)
        opportunities = []
        
        # ... logique de scraping
        
        return opportunities
```

```python
# config.py
SOURCES = {
    # ...
    'nouveau_site': {
        'enabled': True,
        'url': 'https://www.nouveau-site.com',
        'delay': 2,
    },
}
```

```python
# main.py
from scrapers.nouveau_scraper import NouveauScraper

class ScraperOrchestrator:
    def _init_scrapers(self):
        # ...
        if SOURCES['nouveau_site']['enabled']:
            self.scrapers.append(NouveauScraper(SOURCES['nouveau_site']))
```

### Monitoring

**Logs Laravel :**
```bash
php artisan log:tail
```

**Logs Python :**
```bash
tail -f scraper.log  # Linux/Mac
Get-Content scraper.log -Wait  # Windows
```

**Vérifier la base de données :**
```sql
SELECT COUNT(*) FROM offres;
SELECT titre, type, created_at FROM offres ORDER BY created_at DESC LIMIT 10;
```

---

## 📚 Concepts Clés à Retenir

### Laravel
- **Eloquent ORM** : Abstraction de la base de données orientée objet
- **Migrations** : Gestion versionnée du schéma de la BDD
- **Routes** : Mapping URL → Controller
- **Controllers** : Logique métier
- **Models** : Représentation des tables de la BDD
- **Relations** : hasMany, belongsToMany, etc.
- **Validation** : Vérification des données entrantes
- **API Resources** : Formatage des réponses JSON

### Python Scraping
- **requests** : HTTP client simple
- **BeautifulSoup** : Parsing HTML/XML
- **Selenium** : Automatisation navigateur (JavaScript)
- **Logging** : Suivi d'exécution
- **Déduplication** : Éviter les doublons avec set()
- **Orchestration** : Gérer plusieurs scrapers
- **API REST** : Communication avec Laravel

### Bonnes Pratiques
- Toujours vérifier les doublons avant insertion
- Utiliser des délais entre les requêtes (respecter les sites)
- Logger les erreurs pour le débogage
- Utiliser des variables d'environnement pour les secrets
- Tester les sélecteurs CSS régulièrement (ils peuvent changer)
- Garder le code modulaire (classe de base, scrapers individuels)

---

## 🎯 Résumé

Ce système permet de :
1. **Scraper** automatiquement des opportunités depuis plusieurs sources
2. **Dédupliquer** intelligemment les données (Python + Laravel)
3. **Centraliser** toutes les offres dans une base de données Laravel
4. **Exposer** les offres via une API REST pour le frontend
5. **Maintenir** la qualité des données avec un système de nettoyage

Pour reproduire ce système :
1. Installez Laravel et configurez la base de données
2. Créez les modèles, contrôleurs et routes
3. Installez Python et les dépendances du scraper
4. Adaptez les scrapers à vos sources
5. Lancez le scraper régulièrement (cron job)

---

**Fin du guide**
