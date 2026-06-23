<?php

namespace App\Http\Controllers;

use App\Models\Categorie;
use App\Models\Notification;
use App\Models\Offre;
use App\Models\Source;
use App\Services\OpportunityAlertService;
use App\Services\OpportunityCategorizationService;
use App\Services\OpportunityDataSanitizationService;
use App\Services\OpportunityDeduplicationService;
use App\Services\AdminNotificationService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class OffreController extends Controller
{
    /*
    |------------------------------------------------------------------
    | Lister toutes les offres actives
    | GET /api/offres
    |------------------------------------------------------------------
    */
    public function index(Request $request)
    {
        // Mettre à jour automatiquement les offres expirées et créer des notifications
        $expiredOffres = Offre::where('statut', 'active')
            ->where('date_limite', '<', now())
            ->get();

        foreach ($expiredOffres as $offre) {
            $offre->update(['statut' => 'expiree']);

            // Créer une notification pour le propriétaire de l'offre
            if ($offre->id_utilisateur) {
                $notification = Notification::create([
                    'titre' => 'Offre expirée',
                    'message' => "Votre offre \"{$offre->titre}\" a expiré.",
                    'lu' => false,
                    'date_notification' => now(),
                ]);
                $notification->utilisateurs()->attach($offre->id_utilisateur);
            }
        }

        $query = Offre::with(['categories', 'sources'])
            ->where('statut', 'active')
            ->where('moderation_status', 'approved')
            ->orderByDesc('created_at')
            ->orderByDesc('id_offre');

        // Filtrage par recherche
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('titre', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filtrage par type
        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }

        // Filtrage par catégorie
        if ($request->has('category') && $request->category) {
            $query->whereHas('categories', function ($q) use ($request) {
                $q->where('categories.id_categorie', $request->category);
            });
        }

        foreach (['niveau_etudes', 'contrat', 'domaine'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->string($filter));
            }
        }

        if ($request->boolean('teletravail')) {
            $query->where('teletravail', true);
        }

        if ($request->filled('remuneration_min')) {
            $query->where(function ($salaryQuery) use ($request) {
                $salaryQuery->whereNull('remuneration_max')
                    ->orWhere('remuneration_max', '>=', $request->integer('remuneration_min'));
            });
        }

        $offres = $query->paginate($request->per_page ?? 12);

        return response()->json($offres);
    }

    /*
    |------------------------------------------------------------------
    | Voir le détail d'une offre
    | GET /api/offres/{id}
    |------------------------------------------------------------------
    */
    public function show($id)
    {
        $offre = Offre::with(['categories', 'sources'])
            ->where('moderation_status', 'approved')
            ->find($id);

        if (! $offre) {
            return response()->json(['message' => 'Offre non trouvée'], 404);
        }

        return response()->json($offre);
    }

    /*
    |------------------------------------------------------------------
    | Créer une nouvelle offre via le scraper (sans authentification)
    | POST /api/scraper/offres
    |------------------------------------------------------------------
    */
    public function scraperStore(
        Request $request,
        OpportunityCategorizationService $categorization,
        OpportunityDataSanitizationService $sanitization,
        OpportunityDeduplicationService $deduplication,
        OpportunityAlertService $alerts
    ) {
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'required|string',
            'type' => 'required|in:emploi,stage,bourses/concours,formation',
            'entreprise' => 'nullable|string',
            'localisation' => 'nullable|string',
            'date_limite' => 'nullable|date|after_or_equal:today',
            'date_publication' => 'nullable|date',
            'source' => 'nullable|string',
            'url_source' => 'nullable|url|max:2048',
            'content_hash' => ['nullable', 'string', 'size:64', 'regex:/^[a-f0-9]{64}$/i'],
            'categories' => 'nullable|array',
            'categories.*' => 'string',
            'niveau_etudes' => 'nullable|string|max:100',
            'contrat' => 'nullable|string|max:100',
            'domaine' => 'nullable|string|max:100',
            'teletravail' => 'nullable|boolean',
            'remuneration_min' => 'nullable|integer|min:0',
            'remuneration_max' => 'nullable|integer|min:0|gte:remuneration_min',
            'devise' => 'nullable|string|max:10',
        ], [
            'date_limite.after_or_equal' => 'La date limite doit être aujourd’hui ou une date future.',
        ]);

        $data = $sanitization->sanitize($validated);
        if (! $sanitization->hasValidContent($data)) {
            throw ValidationException::withMessages([
                'titre' => ['Le titre et la description doivent contenir des données exploitables.'],
            ]);
        }

        $data['content_hash'] = $data['content_hash'] ?? $deduplication->contentHash($data);
        $data = array_merge($data, $categorization->categorize($data));
        $existingOffre = $deduplication->findDuplicate($data);

        if ($existingOffre) {
            return response()->json([
                'message' => 'Offre déjà existante',
                'offre' => $existingOffre->load('categories', 'sources'),
            ], 200);
        }

        $offre = Offre::create([
            'titre' => $data['titre'],
            'description' => $data['description'],
            'type' => $data['type'],
            'categorie_principale' => $data['categorie_principale'],
            'sous_categorie' => $data['sous_categorie'],
            'entreprise' => $data['entreprise'] ?? null,
            'localisation' => $data['localisation'] ?? null,
            'date_limite' => $data['date_limite'] ?? null,
            'source' => $data['source'] ?? null,
            'url_source' => $data['url_source'] ?? null,
            'content_hash' => $data['content_hash'],
            'date_publication' => $data['date_publication'] ?? now(),
            'statut' => 'active',
            'id_utilisateur' => null,
            'moderation_status' => 'approved',
            'niveau_etudes' => $validated['niveau_etudes'] ?? null,
            'contrat' => $validated['contrat'] ?? null,
            'domaine' => $validated['domaine'] ?? ($data['sous_categorie'] ?? null),
            'teletravail' => $validated['teletravail'] ?? false,
            'remuneration_min' => $validated['remuneration_min'] ?? null,
            'remuneration_max' => $validated['remuneration_max'] ?? null,
            'devise' => $validated['devise'] ?? 'XAF',
        ]);

        $categorization->applyToOffre($offre);

        foreach ($data['categories'] ?? [] as $categoryName) {
            if ($categoryName !== '') {
                $category = Categorie::firstOrCreate(['nom' => $categoryName]);
                $offre->categories()->syncWithoutDetaching([$category->id_categorie]);
            }
        }

        if (! empty($data['source'])) {
            $source = Source::firstOrCreate(
                ['nom_site' => $data['source']],
                [
                    'url' => ($data['url_source'] ?? null) ?: $data['source'],
                    'derniere_recuperation' => now(),
                    'statut' => 'actif',
                ]
            );
            $offre->sources()->syncWithoutDetaching([$source->id_source]);
        }

        $alerts->notifyMatchingUsers($offre);

        return response()->json($offre->load('categories', 'sources'), 201);
    }

    /*
    |------------------------------------------------------------------
    | Créer une nouvelle offre
    | POST /api/offres
    |------------------------------------------------------------------
    */
    public function store(
        Request $request,
        OpportunityCategorizationService $categorization,
        OpportunityDataSanitizationService $sanitization,
        OpportunityDeduplicationService $deduplication,
        AdminNotificationService $adminNotifications
    ) {
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'required|string',
            'type' => 'required|in:emploi,stage,bourses/concours,formation',
            'entreprise' => 'nullable|string',
            'localisation' => 'nullable|string',
            'date_limite' => 'nullable|date|after_or_equal:today',
            'url_source' => 'nullable|url|max:2048',
            'profil_recherche' => 'nullable|string',
            'missions' => 'nullable|array|max:20',
            'missions.*' => 'string|max:500',
            'competences' => 'nullable|array|max:20',
            'competences.*' => 'string|max:100',
            'tags' => 'nullable|array|max:20',
            'tags.*' => 'string|max:100',
            'categories' => 'nullable|array',
            'categories.*' => 'integer',
            'niveau_etudes' => 'nullable|string|max:100',
            'contrat' => 'nullable|string|max:100',
            'domaine' => 'nullable|string|max:100',
            'teletravail' => 'nullable|boolean',
            'remuneration_min' => 'nullable|integer|min:0',
            'remuneration_max' => 'nullable|integer|min:0|gte:remuneration_min',
            'devise' => 'nullable|string|max:10',
        ], [
            'date_limite.after_or_equal' => 'La date limite doit être aujourd’hui ou une date future.',
        ]);

        $data = $sanitization->sanitize($validated);
        if (! $sanitization->hasValidContent($data)) {
            throw ValidationException::withMessages([
                'titre' => ['Le titre et la description doivent contenir des données exploitables.'],
            ]);
        }

        $data['content_hash'] = $deduplication->contentHash($data);
        $data = array_merge($data, $categorization->categorize($data));

        $offre = Offre::create([
            'titre' => $data['titre'],
            'description' => $data['description'],
            'type' => $data['type'],
            'categorie_principale' => $data['categorie_principale'],
            'sous_categorie' => $data['sous_categorie'],
            'entreprise' => $data['entreprise'] ?? null,
            'localisation' => $data['localisation'] ?? null,
            'date_limite' => $data['date_limite'] ?? null,
            'url_source' => $validated['url_source'] ?? null,
            'source' => 'Publication utilisateur',
            'profil_recherche' => $validated['profil_recherche'] ?? null,
            'missions' => array_values(array_filter($validated['missions'] ?? [])),
            'competences' => array_values(array_filter($validated['competences'] ?? [])),
            'tags' => array_values(array_filter($validated['tags'] ?? [])),
            'content_hash' => $data['content_hash'],
            'statut' => 'active',
            'moderation_status' => 'pending',
            'niveau_etudes' => $validated['niveau_etudes'] ?? null,
            'contrat' => $validated['contrat'] ?? null,
            'domaine' => $validated['domaine'] ?? ($data['sous_categorie'] ?? null),
            'teletravail' => $validated['teletravail'] ?? false,
            'remuneration_min' => $validated['remuneration_min'] ?? null,
            'remuneration_max' => $validated['remuneration_max'] ?? null,
            'devise' => $validated['devise'] ?? 'XAF',
            'date_publication' => null,
            'id_utilisateur' => $request->user()->id,
        ]);

        if (! empty($data['categories'])) {
            $offre->categories()->syncWithoutDetaching($data['categories']);
        }
        $categorization->applyToOffre($offre);

        $adminNotifications->send(
            'Nouvelle annonce à modérer',
            "{$request->user()->name} a publié l’annonce \"{$offre->titre}\"."
        );

        return response()->json([
            ...$offre->load('categories')->toArray(),
            'message' => 'Annonce envoyée en modération.',
        ], 201);
    }

    /*
    |------------------------------------------------------------------
    | Modifier une offre existante
    | PUT /api/offres/{id}
    |------------------------------------------------------------------
    */
    public function update(Request $request, $id)
    {
        $offre = Offre::find($id);

        if (! $offre) {
            return response()->json(['message' => 'Offre non trouvée'], 404);
        }

        // Vérifier que l'utilisateur est le propriétaire ou admin
        if ($offre->id_utilisateur !== $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $request->validate([
            'titre' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'type' => 'nullable|in:emploi,stage,bourses/concours,formation',
            'entreprise' => 'nullable|string',
            'localisation' => 'nullable|string',
            'date_limite' => 'nullable|date|after_or_equal:today',
            'url_source' => 'nullable|url|max:2048',
            'profil_recherche' => 'nullable|string',
            'missions' => 'nullable|array|max:20',
            'missions.*' => 'string|max:500',
            'competences' => 'nullable|array|max:20',
            'competences.*' => 'string|max:100',
            'tags' => 'nullable|array|max:20',
            'tags.*' => 'string|max:100',
            'categories' => 'nullable|array',
            'categories.*' => 'integer',
            'niveau_etudes' => 'nullable|string|max:100',
            'contrat' => 'nullable|string|max:100',
            'domaine' => 'nullable|string|max:100',
            'teletravail' => 'nullable|boolean',
            'remuneration_min' => 'nullable|integer|min:0',
            'remuneration_max' => 'nullable|integer|min:0|gte:remuneration_min',
            'devise' => 'nullable|string|max:10',
        ], [
            'date_limite.after_or_equal' => 'La date limite doit être aujourd’hui ou une date future.',
        ]);

        $offre->update($request->only([
            'titre', 'description', 'type', 'entreprise', 'localisation',
            'date_limite', 'url_source', 'profil_recherche', 'missions',
            'competences', 'tags',
            'niveau_etudes', 'contrat', 'domaine', 'teletravail',
            'remuneration_min', 'remuneration_max', 'devise',
        ]));

        if ($request->user()->role !== 'admin') {
            $offre->update([
                'moderation_status' => 'pending',
                'moderated_by' => null,
                'moderated_at' => null,
                'date_publication' => null,
            ]);
        }

        // Mettre à jour les catégories si fournies
        if ($request->has('categories') && is_array($request->categories)) {
            $offre->categories()->sync($request->categories);
        }

        return response()->json($offre->load('categories'));
    }

    /*
    |------------------------------------------------------------------
    | Supprimer une offre
    | DELETE /api/offres/{id}
    |------------------------------------------------------------------
    */
    public function destroy(Request $request, $id)
    {
        $offre = Offre::find($id);

        if (! $offre) {
            return response()->json(['message' => 'Offre non trouvée'], 404);
        }

        // Vérifier que l'utilisateur est le propriétaire ou admin
        if ($offre->id_utilisateur !== $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $offre->delete();

        return response()->json(['message' => 'Offre supprimée avec succès']);
    }

    /*
    |------------------------------------------------------------------
    | Nettoyer les doublons dans la base de données
    | POST /api/offres/clean-duplicates
    |------------------------------------------------------------------
    */
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
            // Garder la première occurrence et supprimer les autres
            $firstOffre = Offre::where('titre', $duplicate->titre)
                ->orderBy('id_offre', 'asc')
                ->first();

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
            'deleted_count' => $deletedCount,
        ]);
    }

    /*
    |------------------------------------------------------------------
    | Lister les offres de l'utilisateur connecté
    | GET /api/mes-offres
    |------------------------------------------------------------------
    */
    public function mesOffres(Request $request)
    {
        // Mettre à jour automatiquement les offres expirées de l'utilisateur
        Offre::where('id_utilisateur', $request->user()->id)
            ->where('statut', 'active')
            ->where('date_limite', '<', now())
            ->update(['statut' => 'expiree']);

        $query = Offre::with(['categories', 'sources'])
            ->where('id_utilisateur', $request->user()->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id_offre');

        // Filtrage par statut
        if ($request->has('statut') && $request->statut) {
            $query->where('statut', $request->statut);
        }

        $offres = $query->paginate($request->per_page ?? 12);

        return response()->json($offres);
    }
}
