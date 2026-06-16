<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SourceController;
use App\Http\Controllers\CategorieController;
use App\Http\Controllers\OffreController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ProfileController;

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
    Route::put('/categories/{categorie}', [CategorieController::class, 'update']);
    Route::delete('/categories/{categorie}', [CategorieController::class, 'destroy']);

    /*
    |------------------------------------------------------------------
    | Gestion des notifications
    | Lister les notifications et marquer comme lues
    |------------------------------------------------------------------
    */
    Route::get('/notifications', [NotificationController::class, 'index']);
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

    // Statistiques
    Route::get('/admin/stats', [AdminController::class, 'stats']);
});