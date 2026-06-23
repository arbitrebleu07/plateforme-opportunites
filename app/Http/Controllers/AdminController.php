<?php

namespace App\Http\Controllers;

use App\Models\Categorie;
use App\Models\Notification;
use App\Models\Offre;
use App\Models\ScraperRun;
use App\Models\Signalement;
use App\Models\Source;
use App\Models\User;
use App\Services\OpportunityAlertService;
use App\Services\ScraperExecutionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

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
        ScraperRun::failStaleRuns();

        $typeDistribution = Offre::where('statut', 'active')
            ->select('type', DB::raw('COUNT(*) as total'))
            ->groupBy('type')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'type' => $this->typeLabel($row->type),
                'total' => (int) $row->total,
            ])
            ->values();

        $recentOffres = Offre::with('sources')
            ->orderByDesc('created_at')
            ->orderByDesc('id_offre')
            ->limit(6)
            ->get();

        $sources = Source::withCount('offres')
            ->orderByDesc('offres_count')
            ->get();

        return response()->json([
            'users_count' => User::count(),
            'offres_count' => Offre::count(),
            'active_offres_count' => Offre::where('statut', 'active')->count(),
            'expired_offres_count' => Offre::where('statut', 'expiree')->count(),
            'categories_count' => Categorie::count(),
            'sources_count' => Source::count(),
            'active_sources_count' => Source::where('statut', 'actif')->count(),
            'offres_this_month' => Offre::whereBetween('created_at', [
                now()->startOfMonth(),
                now()->endOfMonth(),
            ])->count(),
            'users_this_month' => User::whereBetween('created_at', [
                now()->startOfMonth(),
                now()->endOfMonth(),
            ])->count(),
            'scraper_inserted_count' => ScraperRun::sum('inserted_count'),
            'scraper_skipped_count' => ScraperRun::sum('skipped_count'),
            'type_distribution' => $typeDistribution,
            'recent_offres' => $recentOffres,
            'sources' => $sources,
            'scraper_runs' => ScraperRun::latest()->limit(8)->get(),
            'pending_offres_count' => Offre::where('moderation_status', 'pending')->count(),
            'reports_count' => Signalement::where('statut', 'nouveau')->count(),
        ]);
    }

    public function runScraper(Request $request, ScraperExecutionService $execution)
    {
        ScraperRun::failStaleRuns();

        $validated = $request->validate([
            'source' => ['required', 'in:'.implode(',', ScraperExecutionService::SOURCES)],
            'limit' => ['required', 'integer', 'min:1', 'max:50'],
        ]);

        if (ScraperRun::where('status', 'running')->exists()) {
            return response()->json([
                'message' => 'Une collecte est déjà en cours. Attendez sa fin avant d’en lancer une autre.',
            ], 409);
        }

        $run = ScraperRun::create([
            'user_id' => $request->user()->id,
            'source' => $validated['source'],
            'limit' => $validated['limit'],
            'status' => 'running',
            'started_at' => now(),
        ]);

        try {
            $execution->start($run);

            return response()->json([
                'message' => 'Collecte lancée en arrière-plan.',
                'run' => $run->fresh(),
            ], 202);
        } catch (Throwable $exception) {
            report($exception);
            $run->update([
                'status' => 'failed',
                'error_count' => 1,
                'message' => 'Le processus de collecte n’a pas pu démarrer.',
                'finished_at' => now(),
            ]);

            return response()->json([
                'message' => 'Le processus de collecte n’a pas pu démarrer.',
                'run' => $run->fresh(),
            ], 500);
        }
    }

    public function scraperRuns()
    {
        return response()->json(ScraperRun::latest()->limit(20)->get());
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
            'role' => 'required|in:membre,admin',
        ]);

        $user->update(['role' => $request->role]);

        return response()->json([
            'message' => 'Rôle mis à jour avec succès',
            'user' => $user,
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
            ->orderByDesc('created_at')
            ->orderByDesc('id_offre')
            ->paginate($request->per_page ?? 12);

        return response()->json($offres);
    }

    public function moderationQueue()
    {
        return response()->json(
            Offre::with(['categories', 'sources'])
                ->where('moderation_status', 'pending')
                ->latest()
                ->get()
        );
    }

    public function moderateOffre(
        Request $request,
        Offre $offre,
        OpportunityAlertService $alerts
    ) {
        $validated = $request->validate([
            'decision' => 'required|in:approved,rejected',
            'note' => 'required_if:decision,rejected|nullable|string|max:500',
        ], [
            'note.required_if' => 'Le motif du refus est obligatoire.',
        ]);

        $wasApproved = $offre->moderation_status === 'approved';
        $moderationData = [
            'moderation_status' => $validated['decision'],
            'moderation_note' => $validated['note'] ?? null,
            'moderated_by' => $request->user()->id,
            'moderated_at' => now(),
        ];

        if ($validated['decision'] === 'approved' && ! $wasApproved) {
            $moderationData['date_publication'] = now();
        }

        $offre->update($moderationData);

        if ($offre->id_utilisateur) {
            $notification = Notification::create([
                'titre' => $validated['decision'] === 'approved' ? 'Annonce approuvée' : 'Annonce refusée',
                'message' => $validated['decision'] === 'approved'
                    ? "Votre annonce \"{$offre->titre}\" est maintenant publiée."
                    : "Votre annonce \"{$offre->titre}\" a été refusée. Motif : {$validated['note']}",
                'lu' => false,
                'date_notification' => now(),
            ]);
            $notification->utilisateurs()->attach($offre->id_utilisateur);
        }

        if ($validated['decision'] === 'approved') {
            $alerts->notifyMatchingUsers($offre);
        }

        return response()->json($offre);
    }

    public function signalements()
    {
        return response()->json(
            Signalement::with(['user:id,name,email', 'offre:id_offre,titre'])
                ->latest()
                ->get()
        );
    }

    public function traiterSignalement(Request $request, Signalement $signalement)
    {
        $validated = $request->validate([
            'statut' => 'required|in:nouveau,en_cours,resolu,rejete',
        ]);

        $oldStatus = $signalement->statut;
        $signalement->update($validated);

        if ($oldStatus !== $validated['statut']) {
            $statusLabels = [
                'nouveau' => 'a été rouvert pour une nouvelle vérification',
                'en_cours' => 'est en cours de vérification',
                'resolu' => 'a été traité et résolu',
                'rejete' => 'a été classé sans suite',
            ];
            $signalement->loadMissing('offre');

            $notification = Notification::create([
                'titre' => 'Mise à jour de votre signalement',
                'message' => "Votre signalement concernant \"{$signalement->offre?->titre}\" {$statusLabels[$validated['statut']]}.",
                'lu' => false,
                'date_notification' => now(),
            ]);
            $notification->utilisateurs()->attach($signalement->user_id);
        }

        return response()->json($signalement);
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

        if ($request->statut === 'active' && $offre->date_limite?->isBefore(today())) {
            return response()->json([
                'message' => 'Une offre dont la date limite est dépassée ne peut pas être réactivée.',
                'errors' => [
                    'statut' => ['Modifiez d’abord la date limite avant de réactiver cette offre.'],
                ],
            ], 422);
        }

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
            'offre' => $offre,
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

    private function typeLabel(?string $type): string
    {
        return match ($type) {
            'emploi' => 'Emploi',
            'stage' => 'Stage',
            'formation' => 'Formation',
            'bourses/concours' => 'Bourses / Concours',
            default => ucfirst((string) $type),
        };
    }
}
