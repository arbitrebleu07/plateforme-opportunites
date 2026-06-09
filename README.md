# OpportuniTech

Plateforme d'opportunités (offres d'emploi, stages, bourses/concours, formations) avec gestion d'utilisateurs, catégories et notifications.

## Stack technique

- **Backend** : Laravel 12 (PHP)
- **Frontend** : React 19 + Vite
- **Base de données** : MySQL
- **Authentification** : Laravel Sanctum
- **Styling** : Tailwind CSS

## Prérequis

- PHP 8.2+
- Composer
- Node.js 18+
- MySQL
- Git

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/TON_USERNAME/plateforme-opportunites.git
cd plateforme-opportunites
```

### 2. Configuration backend

```bash
# Installer les dépendances PHP
composer install

# Copier le fichier d'environnement
cp .env.example .env

# Générer la clé d'application
php artisan key:generate

# Configurer la base de données dans .env
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=plateforme_opportunites
# DB_USERNAME=root
# DB_PASSWORD=ton_mot_de_passe

# Exécuter les migrations
php artisan migrate

# Exécuter les seeders (catégories par défaut)
php artisan db:seed --class=CategorieSeeder
php artisan db:seed --class=OffreCategorieSeeder
```

### 3. Configuration frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

### 4. Lancer le serveur Laravel

```bash
# Retourner à la racine du projet
cd ..

# Lancer le serveur Laravel
php artisan serve
```

Le backend sera accessible sur `http://127.0.0.1:8000` et le frontend sur `http://localhost:5173`.

## Structure du projet

```
plateforme-opportunites/
├── app/                 # Code Laravel (Controllers, Models, etc.)
├── database/            # Migrations et Seeders
├── frontend/            # Application React
│   ├── src/
│   │   ├── components/  # Composants React
│   │   ├── pages/       # Pages de l'application
│   │   ├── hooks/       # Hooks personnalisés
│   │   ├── services/    # Services API
│   │   └── context/     # Contexte d'authentification
│   └── public/          # Assets statiques
├── public/              # Point d'entrée Laravel
├── routes/              # Routes Laravel
└── resources/           # Views et assets Laravel
```

## Fonctionnalités

- **Authentification** : Inscription, connexion, déconnexion
- **Gestion des offres** : CRUD complet pour les utilisateurs authentifiés
- **Catégories** : Filtrage des offres par catégorie
- **Types** : Emploi, stage, bourses/concours, formation
- **Statuts** : Active, expirée (mise à jour automatique)
- **Notifications** : Notifications automatiques (offre expirée, actions admin)
- **Admin** : Dashboard admin pour gérer utilisateurs et offres
- **Profil** : Gestion du profil utilisateur (nom, email, photo)
- **Pagination** : Pagination des offres et des annonces utilisateur

## Utilisation

### Comptes par défaut

Après avoir exécuté les seeders, vous pouvez créer un compte via le formulaire d'inscription. Pour le rôle admin, vous devez le définir manuellement dans la base de données ou via tinker :

```bash
php artisan tinker
>>> $user = App\Models\User::find(1);
>>> $user->role = 'admin';
>>> $user->save();
```

### Endpoints API

- `POST /api/register` - Inscription
- `POST /api/login` - Connexion
- `POST /api/logout` - Déconnexion
- `GET /api/offres` - Lister les offres (publique)
- `GET /api/offres/{id}` - Détails d'une offre (publique)
- `POST /api/offres` - Créer une offre (authentifié)
- `PUT /api/offres/{id}` - Modifier une offre (authentifié)
- `DELETE /api/offres/{id}` - Supprimer une offre (authentifié)
- `GET /api/mes-offres` - Offres de l'utilisateur (authentifié)
- `GET /api/categories` - Lister les catégories (publique)
- `GET /api/notifications` - Notifications de l'utilisateur (authentifié)
- `PUT /api/notifications/{id}/lire` - Marquer notification comme lue (authentifié)
- `POST /api/profile` - Mettre à jour le profil (authentifié)
- `GET /api/admin/stats` - Statistiques admin (admin)
- `GET /api/admin/users` - Lister les utilisateurs (admin)
- `PUT /api/admin/users/{id}/role` - Changer le rôle d'un utilisateur (admin)
- `DELETE /api/admin/users/{id}` - Supprimer un utilisateur (admin)
- `GET /api/admin/offres` - Lister toutes les offres (admin)
- `PUT /api/admin/offres/{offre}/statut` - Changer le statut d'une offre (admin)
- `DELETE /api/admin/offres/{offre}` - Supprimer une offre (admin)

## Développement

### Lancer les tests

```bash
# Tests Laravel
php artisan test

# Tests React
cd frontend
npm test
```

### Linter

```bash
# ESLint (React)
cd frontend
npm run lint
```

## Déploiement

Pour le déploiement en production :

1. Configurer les variables d'environnement dans `.env`
2. Exécuter `php artisan key:generate`
3. Exécuter `php artisan migrate --force`
4. Exécuter `php artisan config:cache`
5. Exécuter `php artisan route:cache`
6. Builder le frontend : `cd frontend && npm run build`
7. Configurer le serveur web (Apache/Nginx) pour pointer vers le dossier `public`

## Licence

Ce projet est open-source et disponible sous licence MIT.
