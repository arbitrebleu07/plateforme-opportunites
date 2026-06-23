# OpportuniTech

Guide complet d'installation, d'architecture, de compréhension et de maintenance.

## 1. Présentation

**OpportuniTech** est une plateforme web intelligente de centralisation et de diffusion d'opportunités académiques et professionnelles.

Elle regroupe notamment :

- offres d'emploi ;
- offres de stage ;
- bourses d'études ;
- concours ;
- formations et certifications ;
- appels à candidature ;
- opportunités de volontariat, recherche et financement.

Le système combine :

- un frontend React pour les visiteurs, membres et administrateurs ;
- une API REST Laravel pour la logique métier et la sécurité ;
- une base de données MySQL ;
- un pipeline Python de collecte par web scraping ;
- une catégorisation et une déduplication automatiques ;
- une modération des annonces publiées par les membres ;
- des favoris, alertes, notifications et signalements ;
- une gestion automatique des dates limites.

## 2. Technologies

| Couche | Technologies |
| --- | --- |
| Frontend | React 19, React Router, Vite, JavaScript, Tailwind CSS 4, CSS personnalisé, Axios, Lucide React |
| Backend | PHP 8.2, Laravel 12, Laravel Sanctum |
| Base de données | MySQL |
| Scraping | Python 3.12, Requests, BeautifulSoup, Selenium optionnel, pypdf |
| Tests | PHPUnit, Vitest, Testing Library, unittest Python |
| Développement | XAMPP, Composer, npm, Git, Postman, Visual Studio Code |

## 3. Architecture générale

```text
Sources web publiques
        |
        v
Scrapers Python
        |
        +-- robots.txt et temporisation
        +-- retry HTTP avec backoff
        +-- extraction HTML ou PDF
        +-- nettoyage UTF-8
        +-- catégorisation
        +-- déduplication locale
        |
        | POST /api/scraper/offres
        | X-Scraper-Key
        v
API REST Laravel
        |
        +-- validation
        +-- seconde déduplication
        +-- catégorisation Laravel
        +-- modération
        +-- alertes et notifications
        +-- stockage MySQL
        |
        v
Frontend React
        |
        +-- consultation publique
        +-- espace membre
        +-- espace administrateur
```

L'architecture est de type **client-serveur** :

- React fonctionne sur `http://127.0.0.1:5173` ;
- Laravel fonctionne sur `http://127.0.0.1:8000` ;
- Vite redirige les requêtes `/api` vers Laravel ;
- MySQL est généralement lancé depuis XAMPP ;
- le scraper Python communique uniquement avec l'API Laravel.

## 4. Arborescence importante

```text
plateforme-opportunites/
|-- app/
|   |-- Console/Commands/       Commandes Artisan et tâches planifiées
|   |-- Http/Controllers/       Endpoints de l'API REST
|   |-- Http/Middleware/        Protection admin et clé du scraper
|   |-- Models/                 Modèles Eloquent
|   `-- Services/               Logique métier réutilisable
|-- bootstrap/app.php           Enregistrement des middlewares et routes
|-- config/                     Configuration Laravel
|-- database/
|   |-- migrations/             Structure de la base
|   |-- seeders/                Données d'initialisation
|   `-- factories/              Génération de données pour les tests
|-- docs/uml/                   Diagrammes UML PlantUML
|-- frontend/
|   |-- src/components/         Composants React
|   |-- src/context/            Authentification globale
|   |-- src/pages/              Pages de l'application
|   |-- src/services/           Appels Axios vers Laravel
|   |-- src/data/               Constantes et anciennes données de démonstration
|   |-- src/index.css           Styles principaux
|   `-- vite.config.js          Proxy vers Laravel
|-- postman/                    Collection et environnement Postman
|-- routes/
|   |-- api.php                 Routes REST
|   |-- console.php             Planification Laravel
|   `-- web.php                 Route web Laravel minimale
|-- scraper/
|   |-- main.py                 Orchestrateur
|   |-- base_scraper.py         Classe HTTP commune
|   |-- config.py               Sources, délais et timeouts
|   |-- scrapers/               Extracteurs par source
|   |-- utils/                  Nettoyage, classification et déduplication
|   `-- tests/                  Tests Python
|-- tests/                      Tests Laravel
|-- .env                        Configuration locale confidentielle
|-- .env.example                Exemple de configuration
`-- README.md                   Ce guide
```

### Dossier à ne pas confondre

Le dossier racine contient un élément Git nommé :

```text
plateforme-opportunites/
```

Il s'agit d'un **ancien sous-module Git** enregistré avec le mode `160000`. Le code actif est celui situé directement à la racine actuelle :

```text
C:\xampp\htdocs\plateforme-opportunites
```

Ne pas modifier le code du sous-module imbriqué pour corriger l'application actuelle.

## 5. Installation complète

### 5.1 Prérequis

- XAMPP avec Apache/MySQL ;
- PHP 8.2 ou supérieur ;
- Composer ;
- Node.js 18 ou supérieur ;
- npm ;
- Python 3.11 ou supérieur ;
- Git.

### 5.2 Base de données

Dans phpMyAdmin ou MySQL :

```sql
CREATE DATABASE plateforme_opportunites
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

### 5.3 Backend Laravel

Depuis la racine :

```powershell
composer install
Copy-Item .env.example .env
php artisan key:generate
php artisan migrate
```

Pour initialiser les catégories :

```powershell
php artisan db:seed --class=CategorieSeeder
```

Attention : `DatabaseSeeder` crée actuellement seulement un utilisateur de test. Il n'appelle pas automatiquement `CategorieSeeder`.

Créer le lien pour les photos de profil :

```powershell
php artisan storage:link
```

Lancer Laravel :

```powershell
php artisan serve --host=127.0.0.1 --port=8000
```

### 5.4 Frontend React

Dans un autre terminal :

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Ouvrir :

```text
http://127.0.0.1:5173
```

Le fichier actif est `frontend/package.json`. Le `package.json` de la racine correspond au squelette Vite de Laravel et ne pilote pas l'application React actuelle.

### 5.5 Scraper Python

Créer un environnement virtuel depuis la racine :

```powershell
python -m venv .venv
```

Environnement Windows standard :

```powershell
.\.venv\Scripts\python.exe -m pip install -r scraper\requirements.txt
```

L'environnement présent sur cette machine utilise actuellement :

```text
.venv/bin/python.exe
```

Vérification :

```powershell
.\.venv\bin\python.exe --version
```

Lancement manuel :

```powershell
cd scraper
..\.venv\bin\python.exe main.py --source all --limit 20
```

Exemple sur une seule source :

```powershell
..\.venv\bin\python.exe main.py --source minajobs --limit 5
```

## 6. Configuration `.env`

Variables essentielles :

```dotenv
APP_NAME="OpportuniTech"
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=plateforme_opportunites
DB_USERNAME=root
DB_PASSWORD=

QUEUE_CONNECTION=database
CACHE_STORE=database
SESSION_DRIVER=database

SCRAPER_API_URL=http://127.0.0.1:8000/api
SCRAPER_API_KEY=une-cle-longue-et-secrete
```

La valeur `SCRAPER_API_KEY` doit être identique :

- dans `.env` pour Laravel ;
- dans l'environnement lu par `scraper/config.py`.

Elle protège `POST /api/scraper/offres` via l'en-tête :

```http
X-Scraper-Key: une-cle-longue-et-secrete
```

Chemin Python optionnel :

```dotenv
SCRAPER_PYTHON_PATH=C:\xampp\htdocs\plateforme-opportunites\.venv\Scripts\python.exe
```

Sans cette variable, `ScraperExecutionService` cherche :

```text
.venv/bin/python.exe
```

Après modification du `.env` :

```powershell
php artisan config:clear
```

## 7. Démarrage quotidien

Terminal 1 :

```powershell
php artisan serve --host=127.0.0.1 --port=8000
```

Terminal 2 :

```powershell
php artisan schedule:work
```

Terminal 3 :

```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

MySQL doit rester actif dans XAMPP.

## 8. Rôles et authentification

### Visiteur

- consulte les offres approuvées et actives ;
- recherche et filtre ;
- consulte une fiche détaillée ;
- ouvre le site source.

### Membre

Le membre possède également les droits du visiteur et peut :

- publier une annonce ;
- consulter et supprimer ses annonces ;
- gérer son profil ;
- ajouter des favoris ;
- créer des alertes ;
- recevoir des notifications ;
- signaler une annonce.

### Administrateur

L'administrateur peut :

- consulter les statistiques réelles ;
- lancer le scraper ;
- approuver ou refuser les annonces ;
- traiter les signalements ;
- changer le statut d'une offre ;
- supprimer des offres ;
- gérer les rôles et utilisateurs via l'API.

### Fonctionnement de Sanctum

1. `POST /api/login` vérifie l'e-mail et le mot de passe.
2. Laravel crée un token Sanctum.
3. `AuthProvider.jsx` stocke le token dans `localStorage`.
4. `api.js` ajoute automatiquement :

```http
Authorization: Bearer TOKEN
```

5. En cas de réponse `401`, le token et l'utilisateur local sont supprimés.

Fichiers à connaître :

```text
app/Http/Controllers/AuthController.php
frontend/src/context/AuthProvider.jsx
frontend/src/services/api.js
frontend/src/components/PrivateRoute.jsx
frontend/src/components/AdminRoute.jsx
```

### Créer un administrateur

```powershell
php artisan tinker
```

```php
use App\Models\User;
use Illuminate\Support\Facades\Hash;

User::updateOrCreate(
    ['email' => 'admin@example.com'],
    [
        'name' => 'Administrateur',
        'password' => Hash::make('MotDePasseSecurise'),
        'role' => 'admin',
        'date_creation' => now(),
    ]
);
```

Ne pas inclure un mot de passe réel dans Git ou dans ce README.

## 9. Cycle de vie d'une opportunité

### Annonce issue du scraper

```text
Source publique
  -> extraction Python
  -> nettoyage
  -> classification
  -> déduplication
  -> API sécurisée par X-Scraper-Key
  -> insertion approuvée
  -> notification des alertes correspondantes
```

Les annonces du scraper sont créées avec :

```text
moderation_status = approved
statut = active
id_utilisateur = null
```

### Annonce publiée par un membre

```text
Formulaire React
  -> POST /api/offres
  -> validation Laravel
  -> nettoyage et catégorisation
  -> moderation_status = pending
  -> notification des administrateurs
  -> approbation ou refus
```

Une annonce en attente n'apparaît pas dans la liste publique.

À l'approbation :

- `moderation_status` devient `approved` ;
- `date_publication` reçoit la date d'approbation ;
- le propriétaire reçoit une notification ;
- les utilisateurs ayant une alerte correspondante sont notifiés.

À un refus :

- `moderation_status` devient `rejected` ;
- le motif est obligatoire ;
- le propriétaire reçoit le motif.

### Statut métier et statut de modération

Ces champs sont différents :

| Champ | Valeurs | Rôle |
| --- | --- | --- |
| `statut` | `active`, `expiree` | Validité temporelle |
| `moderation_status` | `pending`, `approved`, `rejected` | Décision administrative |

Une offre publique doit être à la fois :

```text
statut = active
moderation_status = approved
```

## 10. Base de données

### Tables métier principales

| Table | Utilité |
| --- | --- |
| `users` | Comptes, rôles et profils |
| `offres` | Toutes les opportunités |
| `categories` | Catégories et sous-catégories |
| `sources` | Sites d'origine |
| `notifications` | Messages envoyés aux utilisateurs |
| `scraper_runs` | Historique des collectes admin |
| `favoris` | Offres enregistrées par les membres |
| `alertes` | Critères de notification personnalisés |
| `signalements` | Annonces signalées |
| `rappels_echeance` | Protection contre les rappels en double |

### Tables de liaison

| Table | Relation |
| --- | --- |
| `classers` | offres ↔ catégories |
| `provenirs` | offres ↔ sources |
| `recevoirs` | utilisateurs ↔ notifications |
| `publiers` | ancienne liaison utilisateurs ↔ offres |

L'appartenance actuelle d'une annonce à son auteur repose principalement sur :

```text
offres.id_utilisateur
```

La table `publiers` est un héritage du premier modèle conceptuel et n'est pas utilisée lors de la création actuelle d'une annonce.

### Champs importants de `offres`

| Groupe | Champs |
| --- | --- |
| Identité | `id_offre`, `titre`, `description` |
| Classification | `type`, `categorie_principale`, `sous_categorie`, `domaine` |
| Organisation | `entreprise`, `localisation` |
| Détail | `profil_recherche`, `missions`, `competences`, `tags` |
| Conditions | `niveau_etudes`, `contrat`, `teletravail`, rémunération, `devise` |
| Dates | `date_publication`, `date_limite`, `created_at`, `updated_at` |
| Source | `source`, `url_source`, `content_hash` |
| État | `statut`, `moderation_status`, `moderation_note` |
| Propriété | `id_utilisateur`, `moderated_by` |

### Modifier la base correctement

Ne jamais modifier directement une ancienne migration déjà exécutée.

Créer une nouvelle migration :

```powershell
php artisan make:migration add_example_to_offres_table
```

Puis :

```powershell
php artisan migrate
```

Pour annuler la dernière série :

```powershell
php artisan migrate:rollback
```

`migrate:fresh` supprime toutes les données. Ne l'utiliser que sur une base de test.

## 11. Backend Laravel

### Contrôleurs

| Contrôleur | Responsabilité |
| --- | --- |
| `AuthController` | Inscription, connexion, déconnexion, utilisateur courant |
| `OffreController` | Liste, détail, publication, modification, suppression, import scraper |
| `AdminController` | Statistiques, scraper, modération, signalements et administration |
| `ProfileController` | Modification du profil et photo |
| `CategorieController` | CRUD des catégories |
| `SourceController` | CRUD des sources |
| `NotificationController` | Liste, compteur et lecture |
| `FavoriteController` | Ajout et retrait des favoris |
| `AlertController` | CRUD des alertes |
| `ReportController` | Signalement d'une annonce |

### Services métier

| Service | Rôle |
| --- | --- |
| `OpportunityDataSanitizationService` | Retire HTML, contrôles invalides et caractères corrompus |
| `OpportunityCategorizationService` | Détecte catégorie et sous-catégorie |
| `OpportunityDeduplicationService` | Recherche URL, hash ou titre/source identique |
| `OpportunityAlertService` | Compare une nouvelle offre aux alertes actives |
| `AdminNotificationService` | Crée une notification indépendante pour chaque admin |
| `ScraperExecutionService` | Démarre et suit le processus Python détaché |

### Middlewares

`AdminMiddleware` vérifie :

```php
$request->user()->role === 'admin'
```

`VerifyScraperKey` compare de manière sécurisée :

```text
X-Scraper-Key
SCRAPER_API_KEY
```

## 12. API REST

Toutes les URLs sont préfixées par :

```text
http://127.0.0.1:8000/api
```

### Routes publiques

| Méthode | Route | Utilité |
| --- | --- | --- |
| POST | `/register` | Créer un compte membre |
| POST | `/login` | Obtenir un token |
| GET | `/offres` | Lister les offres publiques |
| GET | `/offres/{id}` | Lire une offre publique |
| GET | `/categories` | Lister les catégories |
| POST | `/scraper/offres` | Import interne protégé par clé |

Paramètres disponibles sur `GET /offres` :

```text
search
type
category
niveau_etudes
contrat
domaine
teletravail
remuneration_min
per_page
page
```

### Routes membre

Elles nécessitent `Authorization: Bearer TOKEN`.

| Méthode | Route |
| --- | --- |
| POST | `/logout` |
| GET | `/me` |
| POST | `/profile` |
| DELETE | `/profile/photo` |
| POST | `/offres` |
| PUT | `/offres/{id}` |
| DELETE | `/offres/{id}` |
| GET | `/mes-offres` |
| GET | `/favoris` |
| POST | `/favoris/{offre}` |
| DELETE | `/favoris/{offre}` |
| POST | `/offres/{offre}/signaler` |
| GET/POST | `/alertes` |
| PUT/DELETE | `/alertes/{alerte}` |
| GET | `/notifications` |
| GET | `/notifications/non-lues/count` |
| PUT | `/notifications/{notification}/lire` |

Les routes CRUD de `sources` et d'écriture des catégories sont actuellement placées dans le groupe membre authentifié. Si elles doivent devenir strictement administratives, les déplacer dans le groupe `['auth:sanctum', 'admin']` de `routes/api.php`.

### Routes administrateur

| Méthode | Route | Utilité |
| --- | --- | --- |
| GET | `/admin/stats` | Indicateurs du dashboard |
| GET | `/admin/utilisateurs` | Liste des utilisateurs |
| PUT | `/admin/utilisateurs/{user}/role` | Changer un rôle |
| DELETE | `/admin/utilisateurs/{user}` | Supprimer un compte |
| GET | `/admin/offres` | Toutes les offres |
| PUT | `/admin/offres/{offre}/statut` | Activer ou expirer |
| DELETE | `/admin/offres/{offre}` | Supprimer |
| POST | `/admin/offres/clean-duplicates` | Nettoyage manuel |
| GET | `/admin/moderation` | Annonces en attente |
| PUT | `/admin/offres/{offre}/moderation` | Approuver ou refuser |
| GET | `/admin/signalements` | Liste des signalements |
| PUT | `/admin/signalements/{signalement}` | Traiter un signalement |
| POST | `/admin/scraper/run` | Lancer une collecte |
| GET | `/admin/scraper/runs` | Historique des collectes |

La collection prête à importer se trouve dans :

```text
postman/OpportuniTech.postman_collection.json
postman/OpportuniTech.local.postman_environment.json
```

## 13. Frontend React

### Routes React actives

| Route | Page | Accès |
| --- | --- | --- |
| `/` | Accueil | Public |
| `/opportunites` | Liste et filtres | Public |
| `/opportunites/:id` | Détail | Public |
| `/connexion` | Connexion | Public |
| `/inscription` | Inscription | Public |
| `/publier` | Publication | Membre |
| `/profil` | Profil | Membre |
| `/mes-annonces` | Annonces personnelles | Membre |
| `/favoris` | Favoris | Membre |
| `/alertes` | Alertes | Membre |
| `/notifications` | Notifications | Membre |
| `/admin` | Administration | Admin |

### Services frontend

| Fichier | Appels |
| --- | --- |
| `api.js` | Instance Axios et token |
| `opportunities.js` | Normalisation des réponses Laravel |
| `offresService.js` | CRUD des offres |
| `adminService.js` | Dashboard, modération et scraper |
| `engagementService.js` | Favoris, alertes et signalements |
| `notificationsService.js` | Notifications |
| `categoriesService.js` | Catégories |

### Normalisation des offres

Laravel utilise notamment :

```text
id_offre
url_source
type = emploi|stage|bourses/concours|formation
```

React utilise :

```text
id
lien_source
type = Emploi|Stage|Bourse|Concours|Formation
```

La conversion est centralisée dans :

```text
frontend/src/services/opportunities.js
```

Modifier ce fichier lorsqu'un champ Laravel doit être présenté sous une autre forme dans toute l'interface.

### Pagination et filtres actuels

Le frontend appelle actuellement :

```text
GET /api/offres?per_page=1000
```

Puis il filtre et pagine côté client par groupes de 6.

Avantage : interaction instantanée avec un petit volume.

Limite : avec plusieurs milliers d'offres, il faudra déplacer la pagination et tous les filtres côté Laravel. Dans ce cas :

1. envoyer les filtres à `GET /api/offres` ;
2. utiliser `current_page`, `last_page` et `data` de Laravel ;
3. ne plus demander `per_page=1000`.

### Styles

Le design principal est dans :

```text
frontend/src/index.css
```

Les variables globales sont définies au début du fichier :

```css
:root {
  --green: ...;
  --mint: ...;
  --text: ...;
}
```

Modifier d'abord ces variables pour changer la palette sans rechercher chaque couleur.

### Données de démonstration restantes

`frontend/src/data/mockOffres.js` contient encore :

- les constantes `TYPES`, `CATEGORIES`, tags et sous-types ;
- `typeMeta` pour les badges ;
- d'anciennes offres de démonstration.

Les pages principales utilisent les vraies offres Laravel. Les objets `mockOffres` ne doivent plus servir de source de données métier.

### Fichiers React hérités non montés

Les éléments suivants appartiennent à une ancienne interface et ne sont pas utilisés par `App.jsx` :

```text
frontend/src/pages/Dashboard.jsx
frontend/src/components/offres/
frontend/src/hooks/useOffres.js
frontend/src/hooks/useCategories.js
frontend/src/hooks/useAdmin.js
```

Vérifier les imports depuis `App.jsx` avant de modifier un composant : un fichier présent dans le dépôt n'est pas forcément affiché.

## 14. Pipeline Python

### Point d'entrée

```text
scraper/main.py
```

`ScraperOrchestrator` :

1. initialise les sources sélectionnées ;
2. exécute chaque scraper ;
3. nettoie les résultats ;
4. applique la classification ;
5. élimine les doublons locaux ;
6. récupère les offres existantes de Laravel ;
7. évite les doublons de la base ;
8. envoie les nouveautés à Laravel ;
9. produit un rapport.

### Sources actuelles

| Clé | Source | Type principal | Accès |
| --- | --- | --- | --- |
| `infos_concours_education` | Infos Concours Education | Bourses/concours | HTML |
| `kamerpower` | Kamerpower | Bourses/concours | HTML |
| `emplois_cm` | Emploi.cm | Emplois/stages | HTML |
| `minajobs` | MinaJobs | Emplois/stages | HTML |
| `jooble` | Jooble | Emploi | API/requêtes |
| `coursera` | TrainingInformation | Formation | API/requêtes |

Les noms `coursera` et `CourseraScraper` sont historiques : la source réellement configurée est TrainingInformation.

### Base commune

`base_scraper.py` fournit :

- une session Requests ;
- les retry sur `429`, `500`, `502`, `503`, `504` ;
- le backoff ;
- les timeouts ;
- BeautifulSoup ;
- la détection et l'extraction PDF ;
- Selenium optionnel ;
- la fermeture propre de la session et du navigateur.

### Nettoyage

`scraper/utils/cleaning.py` :

- convertit les entités HTML ;
- retire les balises ;
- normalise Unicode ;
- retire les caractères de contrôle ;
- refuse les titres vides ou `Sans titre` ;
- produit un hash SHA-256.

### Classification

Deux classificateurs existent volontairement :

- Python avant l'envoi : `scraper/utils/classifier.py` ;
- Laravel avant la sauvegarde : `app/Services/OpportunityCategorizationService.php`.

Lors de l'ajout d'une catégorie ou d'un mot-clé, mettre à jour **les deux fichiers** pour conserver un comportement cohérent.

### Déduplication

Python et Laravel vérifient :

1. URL normalisée ;
2. hash du contenu ;
3. titre normalisé associé à la source.

Le double contrôle évite d'envoyer puis d'insérer inutilement les mêmes annonces.

### Lancement depuis l'administration

Le frontend appelle :

```text
POST /api/admin/scraper/run
```

Laravel :

1. crée une ligne `scraper_runs` ;
2. répond immédiatement avec `202` ;
3. démarre `php artisan scraper:execute {id}` en arrière-plan ;
4. la commande lance Python ;
5. le dashboard interroge l'état toutes les 4 secondes.

Sous Windows, le processus est lancé avec PowerShell `Start-Process`.

Journaux :

```text
storage/logs/scraper-run-{id}.out.log
storage/logs/scraper-run-{id}.error.log
scraper/scraper.log
```

## 15. Dates limites et tâches planifiées

### Expiration

```powershell
php artisan opportunities:expire
```

La commande désactive les offres dont la date limite est dépassée.

Planification :

```text
toutes les heures
```

### Rappels

```powershell
php artisan opportunities:remind-deadlines
```

Elle prévient :

- le propriétaire de l'offre ;
- les utilisateurs ayant ajouté l'offre en favori.

Délais :

```text
7 jours
3 jours
1 jour
```

La table `rappels_echeance` empêche l'envoi du même rappel plusieurs fois.

Planification :

```text
tous les jours à 08:00
```

### Faire fonctionner le scheduler

Développement :

```powershell
php artisan schedule:work
```

Production :

```text
* * * * * php /chemin/artisan schedule:run
```

## 16. Notifications, favoris, alertes et signalements

### Notifications

Les notifications sont stockées dans `notifications` et liées aux utilisateurs avec `recevoirs`.

Le compteur du menu est rafraîchi :

- au chargement ;
- toutes les 5 secondes lorsque la page est visible ;
- lorsque la fenêtre reprend le focus ;
- après lecture d'une notification.

### Favoris

Un membre peut ajouter uniquement une offre approuvée.

Le favori sert également à recevoir les rappels de date limite.

### Alertes

Une alerte peut contenir :

- type ;
- ville ;
- domaine ;
- état actif/inactif.

`OpportunityAlertService` compare chaque nouvelle offre approuvée aux alertes actives.

### Signalements

Motifs :

```text
information_incorrecte
lien_invalide
annonce_expiree
fraude
autre
```

Un utilisateur ne peut avoir qu'un signalement par offre. Un nouvel envoi actualise le précédent.

## 17. Commandes utiles

### Laravel

```powershell
php artisan route:list --except-vendor
php artisan migrate:status
php artisan schedule:list
php artisan config:clear
php artisan cache:clear
php artisan optimize:clear
php artisan storage:link
```

### Opportunités

```powershell
php artisan opportunities:reclassify --dry-run
php artisan opportunities:reclassify
php artisan opportunities:expire
php artisan opportunities:remind-deadlines
```

### Scraper

```powershell
php artisan scraper:execute 1
```

Cette commande attend l'identifiant d'une ligne `scraper_runs`. Pour un lancement normal, utiliser le dashboard admin.

### Frontend

```powershell
cd frontend
npm run dev
npm run lint
npm run test -- --run
npm run build
```

## 18. Tests

### Laravel

```powershell
php artisan test
```

Les tests couvrent notamment :

- authentification et sécurité des rôles ;
- protection de l'import scraper ;
- nettoyage, catégorisation et déduplication ;
- ordre des nouvelles offres ;
- publication et modération ;
- règles de dates limites ;
- expiration automatique ;
- favoris, alertes et rappels ;
- signalements et notifications admin ;
- isolation des notifications.

### Frontend

```powershell
cd frontend
npm run test -- --run
npm run lint
npm run build
```

### Python

Avec l'environnement actuel :

```powershell
cd scraper
..\.venv\bin\python.exe -m unittest discover -s tests -v
```

Les tests Python couvrent :

- nettoyage HTML et hash ;
- déduplication ;
- PDF ;
- classification ;
- source indisponible ;
- extraction des scrapers camerounais.

## 19. Modifier le projet

### Ajouter un champ à une offre

Exemple : ajouter `experience`.

1. Créer une migration.
2. Ajouter le champ dans `Offre::$fillable`.
3. Ajouter un cast si nécessaire.
4. Valider le champ dans `OffreController`.
5. L'insérer dans `store`, `scraperStore` et éventuellement `update`.
6. L'envoyer depuis `OffreForm.jsx`.
7. Le normaliser dans `opportunities.js`.
8. L'afficher dans `OffreDetail.jsx`.
9. Ajouter un test Laravel.

### Ajouter une catégorie automatique

Modifier :

```text
app/Services/OpportunityCategorizationService.php
scraper/utils/classifier.py
```

Puis tester :

```powershell
php artisan opportunities:reclassify --dry-run
```

### Ajouter une source de scraping

1. Créer un fichier dans `scraper/scrapers/`.
2. Hériter de `BaseScraper`.
3. Ajouter la classe dans `scraper/scrapers/__init__.py`.
4. Ajouter la source dans `scraper/config.py`.
5. L'initialiser dans `scraper/main.py`.
6. Ajouter sa clé dans `ScraperExecutionService::SOURCES`.
7. Ajouter l'option dans `AdminDashboard.jsx`.
8. Ajouter des tests avec du HTML simulé.
9. Respecter les conditions d'utilisation et `robots.txt`.

### Ajouter une page React

1. Créer la page dans `frontend/src/pages`.
2. Ajouter la route dans `App.jsx`.
3. Ajouter le lien dans `Navbar.jsx` si nécessaire.
4. Créer les appels dans `frontend/src/services`.
5. Protéger avec `PrivateRoute` ou `AdminRoute`.
6. Ajouter les styles dans `index.css`.

### Ajouter un endpoint Laravel

1. Ajouter une méthode dans un contrôleur.
2. Déclarer la route dans `routes/api.php`.
3. Choisir le bon niveau : public, membre ou admin.
4. Ajouter validation et contrôle de propriété.
5. Ajouter un test Feature.
6. Ajouter la requête à la collection Postman.

### Modifier la modération

Backend :

```text
AdminController::moderationQueue
AdminController::moderateOffre
OffreController::store
```

Frontend :

```text
AdminDashboard.jsx
adminService.js
```

### Modifier les notifications

Backend :

```text
NotificationController.php
AdminNotificationService.php
OpportunityAlertService.php
SendDeadlineReminders.php
```

Frontend :

```text
Notifications.jsx
Navbar.jsx
notificationsService.js
```

## 20. UML et Postman

Diagrammes PlantUML :

```text
docs/uml/cas-utilisation.puml
docs/uml/classes.puml
docs/uml/sequence-publication.puml
docs/uml/sequence-scraping.puml
```

Ils peuvent être ouverts avec l'extension PlantUML de Visual Studio Code.

Postman :

```text
postman/OpportuniTech.postman_collection.json
postman/OpportuniTech.local.postman_environment.json
```

Importer les deux fichiers, sélectionner l'environnement local puis exécuter d'abord la requête de connexion.

## 21. Dépannage

### `main.py` introuvable

Le fichier est dans :

```text
scraper/main.py
```

Utiliser :

```powershell
cd scraper
..\.venv\bin\python.exe main.py
```

### Erreur `401` sur le scraper

Vérifier :

```dotenv
SCRAPER_API_KEY=...
```

Puis :

```powershell
php artisan config:clear
```

### Le scraper reste « En cours »

Consulter :

```text
storage/logs/scraper-run-{id}.error.log
storage/logs/scraper-run-{id}.out.log
scraper/scraper.log
```

Les exécutions de plus de 30 minutes sont automatiquement marquées comme échouées lors de la lecture du dashboard.

### Erreur de durée maximale PHP

Le scraper ne doit pas être exécuté directement dans une requête HTTP. Le code actuel répond avec `202` puis utilise la commande détachée `scraper:execute`.

### Le frontend ne trouve pas Laravel

Vérifier :

```text
Laravel : http://127.0.0.1:8000
React   : http://127.0.0.1:5173
```

Le proxy est défini dans `frontend/vite.config.js`.

### Une modification React ne s'affiche pas

1. Vérifier que le fichier est importé dans `App.jsx`.
2. Vérifier que le serveur Vite est lancé depuis `frontend`.
3. Recharger sans cache.
4. Consulter la console du navigateur.

### Une offre membre n'apparaît pas publiquement

C'est normal tant que :

```text
moderation_status = pending
```

L'administrateur doit l'approuver.

### Une offre a une date dépassée

Exécuter :

```powershell
php artisan opportunities:expire
```

Puis vérifier que `schedule:work` fonctionne.

### Caractères corrompus

MySQL doit utiliser `utf8mb4`. Le scraper et Laravel nettoient déjà l'UTF-8, mais un ancien fichier peut encore contenir du texte mal encodé.

## 22. Sécurité

- les mots de passe sont hashés par Laravel ;
- l'inscription interdit l'injection du rôle admin ;
- les routes membres utilisent Sanctum ;
- les routes admin utilisent Sanctum et `AdminMiddleware` ;
- le scraper utilise une clé dédiée ;
- les utilisateurs ne peuvent modifier que leurs propres offres ;
- une date limite passée est refusée ;
- un admin ne peut pas réactiver une offre déjà dépassée ;
- les signalements sont uniques par utilisateur et offre ;
- les sorties React sont échappées automatiquement.

Avant une mise en production :

- désactiver `APP_DEBUG` ;
- générer une clé scraper forte ;
- utiliser HTTPS ;
- changer tous les comptes de démonstration ;
- limiter CORS au domaine réel ;
- configurer les sauvegardes MySQL ;
- utiliser un vrai serveur web ;
- configurer le cron Laravel ;
- surveiller et faire tourner les logs.

## 23. Dette technique connue

Points à connaître avant une évolution importante :

1. La pagination publique React est encore côté client.
2. `mockOffres.js` mélange constantes utiles et anciennes données fictives.
3. Des pages, hooks et composants hérités ne sont plus montés.
4. `scraper/README.md` décrit d'anciennes sources et ne doit pas remplacer ce guide.
5. `frontend/README.md` est encore le README générique de Vite.
6. La table `publiers` fait doublon avec `offres.id_utilisateur`.
7. Les règles de classification existent en PHP et en Python et doivent rester synchronisées.
8. Les routes d'écriture des catégories et sources sont accessibles à tout membre authentifié dans la structure actuelle.
9. `DatabaseSeeder` n'appelle pas tous les seeders.
10. Le dépôt contient un sous-module imbriqué ancien.

Ces éléments ne bloquent pas l'application, mais doivent être pris en compte lors d'un refactoring.

## 24. Parcours conseillé pour la soutenance

1. Présenter le besoin et les acteurs.
2. Montrer le diagramme de cas d'utilisation.
3. Expliquer l'architecture React/Laravel/Python/MySQL.
4. Montrer une consultation publique.
5. Créer une annonce membre.
6. Montrer qu'elle attend une modération.
7. L'approuver depuis l'administration.
8. Montrer la notification et la publication.
9. Ajouter une offre en favori et créer une alerte.
10. Lancer une petite collecte admin.
11. Montrer la déduplication et l'historique.
12. Expliquer l'expiration et les rappels planifiés.
13. Montrer les tests et la collection Postman.

## 25. Résumé des fichiers à retenir

```text
routes/api.php
app/Http/Controllers/OffreController.php
app/Http/Controllers/AdminController.php
app/Models/Offre.php
app/Services/OpportunityCategorizationService.php
app/Services/ScraperExecutionService.php
routes/console.php
scraper/main.py
scraper/config.py
scraper/base_scraper.py
scraper/utils/classifier.py
frontend/src/App.jsx
frontend/src/context/AuthProvider.jsx
frontend/src/services/api.js
frontend/src/services/opportunities.js
frontend/src/pages/Offres.jsx
frontend/src/pages/OffreDetail.jsx
frontend/src/pages/AdminDashboard.jsx
frontend/src/index.css
```

## Licence

Ce projet est disponible sous licence MIT.
