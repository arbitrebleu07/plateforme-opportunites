<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Offre;
use App\Models\Categorie;
use App\Models\Source;
use App\Models\Notification;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /*
    |------------------------------------------------------------------
    | Statistiques générales du tableau de bord
    | GET /api/admin/stats
    |------------------------------------------------------------------
    */
    public function stats()
    {
        return response()->json([
            'users_count'        => User::count(),
            'offres_count'       => Offre::count(),
            'active_offres_count'=> Offre::where('statut', 'active')->count(),
            'categories_count'   => Categorie::count(),
        ]);
    }

    /*
    |------------------------------------------------------------------
    | Lister tous les utilisateurs
    | GET /api/admin/utilisateurs
    |------------------------------------------------------------------
    */
    public function utilisateurs()
    {
        $utilisateurs = User::orderBy('created_at', 'desc')->get();
        return response()->json($utilisateurs);
    }

    /*
    |------------------------------------------------------------------
    | Changer le rôle d'un utilisateur
    | PUT /api/admin/utilisateurs/{user}/role
    |------------------------------------------------------------------
    */
    public function changerRole(Request $request, User $user)
    {
        $request->validate([
            'role' => 'required|in:user,admin',
        ]);

        $user->update(['role' => $request->role]);

        return response()->json([
            'message' => 'Rôle mis à jour avec succès',
            'user'    => $user,
        ]);
    }

    /*
    |------------------------------------------------------------------
    | Supprimer un utilisateur
    | DELETE /api/admin/utilisateurs/{user}
    |------------------------------------------------------------------
    */
    public function supprimerUtilisateur(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'Utilisateur supprimé avec succès']);
    }

    /*
    |------------------------------------------------------------------
    | Lister toutes les offres (actives + expirées)
    | GET /api/admin/offres
    |------------------------------------------------------------------
    */
    public function offres(Request $request)
    {
        $offres = Offre::with(['categories', 'sources'])
                       ->orderBy('created_at', 'desc')
                       ->paginate($request->per_page ?? 12);
        return response()->json($offres);
    }

    /*
    |------------------------------------------------------------------
    | Changer le statut d'une offre
    | PUT /api/admin/offres/{offre}/statut
    |------------------------------------------------------------------
    */
    public function changerStatutOffre(Request $request, Offre $offre)
    {
        $request->validate([
            'statut' => 'required|in:active,expiree',
        ]);

        $oldStatut = $offre->statut;
        $offre->update(['statut' => $request->statut]);

        // Créer une notification pour le propriétaire de l'offre
        if ($offre->id_utilisateur && $oldStatut !== $request->statut) {
            $notification = Notification::create([
                'titre' => 'Statut de votre offre modifié',
                'message' => "L'admin a changé le statut de votre offre \"{$offre->titre}\" de {$oldStatut} à {$request->statut}.",
                'lu' => false,
                'date_notification' => now(),
            ]);
            $notification->utilisateurs()->attach($offre->id_utilisateur);
        }

        return response()->json([
            'message' => 'Statut mis à jour avec succès',
            'offre'   => $offre,
        ]);
    }

    /*
    |------------------------------------------------------------------
    | Supprimer une offre
    | DELETE /api/admin/offres/{offre}
    |------------------------------------------------------------------
    */
    public function supprimerOffre(Offre $offre)
    {
        $offreTitre = $offre->titre;
        $offreUserId = $offre->id_utilisateur;
        $offre->delete();

        // Créer une notification pour le propriétaire de l'offre
        if ($offreUserId) {
            $notification = Notification::create([
                'titre' => 'Offre supprimée',
                'message' => "L'admin a supprimé votre offre \"{$offreTitre}\".",
                'lu' => false,
                'date_notification' => now(),
            ]);
            $notification->utilisateurs()->attach($offreUserId);
        }

        return response()->json(['message' => 'Offre supprimée avec succès']);
    }
}