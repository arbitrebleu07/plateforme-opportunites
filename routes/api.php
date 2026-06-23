<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AlertController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategorieController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OffreController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SourceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes d'authentification — Sanctum
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/profile', [ProfileController::class, 'update']);
    Route::delete('/profile/photo', [ProfileController::class, 'deletePhoto']);
});

/*
|--------------------------------------------------------------------------
| Routes publiques — accessibles sans authentification
| Les visiteurs peuvent consulter les offres et catégories librement
|--------------------------------------------------------------------------
*/

// Lister toutes les offres
Route::get('/offres', [OffreController::class, 'index']);

// Voir le détail d'une offre
Route::get('/offres/{id}', [OffreController::class, 'show']);

// Endpoint interne utilisé par le collecteur Python.
Route::post('/scraper/offres', [OffreController::class, 'scraperStore'])
    ->middleware('scraper.key');

// Lister toutes les catégories
Route::get('/categories', [CategorieController::class, 'index']);

/*
|--------------------------------------------------------------------------
| Routes protégées — accessibles uniquement aux utilisateurs connectés
| Nécessitent un token Sanctum valide dans le header Authorization
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |------------------------------------------------------------------
    | Gestion des offres (création, modification, suppression)
    | Réservé aux utilisateurs inscrits
    |------------------------------------------------------------------
    */
    Route::post('/offres', [OffreController::class, 'store']);
    Route::put('/offres/{id}', [OffreController::class, 'update']);
    Route::delete('/offres/{id}', [OffreController::class, 'destroy']);

    // Offres de l'utilisateur connecté
    Route::get('/mes-offres', [OffreController::class, 'mesOffres']);
    Route::get('/favoris', [FavoriteController::class, 'index']);
    Route::post('/favoris/{offre}', [FavoriteController::class, 'store']);
    Route::delete('/favoris/{offre}', [FavoriteController::class, 'destroy']);
    Route::post('/offres/{offre}/signaler', [ReportController::class, 'store']);
    Route::get('/alertes', [AlertController::class, 'index']);
    Route::post('/alertes', [AlertController::class, 'store']);
    Route::put('/alertes/{alerte}', [AlertController::class, 'update']);
    Route::delete('/alertes/{alerte}', [AlertController::class, 'destroy']);

    /*
    |------------------------------------------------------------------
    | Gestion des sources de scraping
    | CRUD complet via apiResource
    |------------------------------------------------------------------
    */
    Route::apiResource('sources', SourceController::class);

    /*
    |------------------------------------------------------------------
    | Gestion des catégories
    | Création, modification et suppression
    |------------------------------------------------------------------
    */
    Route::post('/categories', [CategorieController::class, 'store']);
    Route::put('/categories/{id}', [CategorieController::class, 'update']);
    Route::delete('/categories/{id}', [CategorieController::class, 'destroy']);

    /*
    |------------------------------------------------------------------
    | Gestion des notifications
    | Lister les notifications et marquer comme lues
    |------------------------------------------------------------------
    */
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/non-lues/count', [NotificationController::class, 'nombreNonLues']);
    Route::put('/notifications/{notification}/lire', [NotificationController::class, 'marquerLu']);
});
/*
|--------------------------------------------------------------------------
| Routes Admin — accessibles uniquement aux utilisateurs avec role=admin
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'admin'])->group(function () {

    // Gestion des utilisateurs
    Route::get('/admin/utilisateurs', [AdminController::class, 'utilisateurs']);
    Route::put('/admin/utilisateurs/{user}/role', [AdminController::class, 'changerRole']);
    Route::delete('/admin/utilisateurs/{user}', [AdminController::class, 'supprimerUtilisateur']);

    // Gestion des offres
    Route::get('/admin/offres', [AdminController::class, 'offres']);
    Route::put('/admin/offres/{offre}/statut', [AdminController::class, 'changerStatutOffre']);
    Route::delete('/admin/offres/{offre}', [AdminController::class, 'supprimerOffre']);
    Route::post('/admin/offres/clean-duplicates', [OffreController::class, 'cleanDuplicates']);
    Route::get('/admin/moderation', [AdminController::class, 'moderationQueue']);
    Route::put('/admin/offres/{offre}/moderation', [AdminController::class, 'moderateOffre']);
    Route::get('/admin/signalements', [AdminController::class, 'signalements']);
    Route::put('/admin/signalements/{signalement}', [AdminController::class, 'traiterSignalement']);

    // Statistiques
    Route::get('/admin/stats', [AdminController::class, 'stats']);
    Route::post('/admin/scraper/run', [AdminController::class, 'runScraper']);
    Route::get('/admin/scraper/runs', [AdminController::class, 'scraperRuns']);
});
