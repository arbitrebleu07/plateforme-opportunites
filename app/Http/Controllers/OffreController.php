<?php

namespace App\Http\Controllers;

use App\Models\Offre;
use App\Models\Notification;
use Illuminate\Http\Request;

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
                    ->orderBy('date_publication', 'desc');
        
        // Filtrage par recherche
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
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
            $query->whereHas('categories', function($q) use ($request) {
                $q->where('categories.id_categorie', $request->category);
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
        $offre = Offre::with(['categories', 'sources'])->find($id);

        if (!$offre) {
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
    public function scraperStore(Request $request)
    {
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

        // Vérifier si l'offre existe déjà (basé sur le titre)
        $existingOffre = Offre::where('titre', $request->titre)->first();

        if ($existingOffre) {
            // L'offre existe déjà, on la retourne sans la recréer
            return response()->json([
                'message' => 'Offre déjà existante',
                'offre' => $existingOffre->load('categories', 'sources')
            ], 200);
        }

        // Créer l'offre sans utilisateur (scraper)
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

        // Attacher les catégories si fournies (par nom, pas par ID)
        if ($request->has('categories') && is_array($request->categories)) {
            foreach ($request->categories as $categoryName) {
                $category = Categorie::firstOrCreate(['nom' => $categoryName]);
                $offre->categories()->attach($category->id_categorie);
            }
        }

        // Créer ou lier la source si fournie
        if ($request->source) {
            $source = Source::firstOrCreate(['nom' => $request->source]);
            $offre->sources()->attach($source->id_source);
        }

        return response()->json($offre->load('categories', 'sources'), 201);
    }

    /*
    |------------------------------------------------------------------
    | Créer une nouvelle offre
    | POST /api/offres
    |------------------------------------------------------------------
    */
    public function store(Request $request)
    {
        $request->validate([
            'titre'       => 'required|string|max:255',
            'description' => 'required|string',
            'type'        => 'required|in:emploi,stage,bourses/concours,formation',
            'entreprise'  => 'nullable|string',
            'localisation'=> 'nullable|string',
            'date_limite' => 'nullable|date',
            'categories'  => 'nullable|array',
            'categories.*' => 'integer',
        ]);

        $offre = Offre::create([
            'titre'            => $request->titre,
            'description'      => $request->description,
            'type'             => $request->type,
            'entreprise'       => $request->entreprise,
            'localisation'     => $request->localisation,
            'date_limite'      => $request->date_limite,
            'statut'           => 'active',
            'date_publication' => now(),
            'id_utilisateur'   => $request->user()->id,
        ]);

        // Attacher les catégories si fournies
        if ($request->has('categories') && is_array($request->categories)) {
            $offre->categories()->attach($request->categories);
        }

        return response()->json($offre->load('categories'), 201);
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

        if (!$offre) {
            return response()->json(['message' => 'Offre non trouvée'], 404);
        }

        // Vérifier que l'utilisateur est le propriétaire ou admin
        if ($offre->id_utilisateur !== $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $request->validate([
            'titre'       => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'type'        => 'nullable|in:emploi,stage,bourses/concours,formation',
            'entreprise'  => 'nullable|string',
            'localisation'=> 'nullable|string',
            'date_limite' => 'nullable|date',
            'categories'  => 'nullable|array',
            'categories.*' => 'integer',
        ]);

        $offre->update($request->only(['titre', 'description', 'type', 'entreprise', 'localisation', 'date_limite']));

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

        if (!$offre) {
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
            'deleted_count' => $deletedCount
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
                    ->orderBy('date_publication', 'desc');
        
        // Filtrage par statut
        if ($request->has('statut') && $request->statut) {
            $query->where('statut', $request->statut);
        }
        
        $offres = $query->paginate($request->per_page ?? 12);

        return response()->json($offres);
    }
}