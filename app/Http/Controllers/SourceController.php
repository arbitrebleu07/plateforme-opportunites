<?php

namespace App\Http\Controllers;

use App\Models\Source;
use Illuminate\Http\Request;

class SourceController extends Controller
{
    /*
    |------------------------------------------------------------------
    | Lister toutes les sources
    | GET /api/sources
    |------------------------------------------------------------------
    */
    public function index()
    {
        $sources = Source::all();
        return response()->json($sources);
    }

    /*
    |------------------------------------------------------------------
    | Voir une source
    | GET /api/sources/{source}
    |------------------------------------------------------------------
    */
    public function show(Source $source)
    {
        return response()->json($source->load('offres'));
    }

    /*
    |------------------------------------------------------------------
    | Créer une nouvelle source
    | POST /api/sources
    |------------------------------------------------------------------
    */
    public function store(Request $request)
    {
        $request->validate([
            'nom_site' => 'required|string|max:255',
            'url'      => 'required|url|unique:sources,url',
            'statut'   => 'nullable|in:actif,inactif',
        ]);

        $source = Source::create($request->only(['nom_site', 'url', 'statut']));

        return response()->json($source, 201);
    }

    /*
    |------------------------------------------------------------------
    | Modifier une source
    | PUT /api/sources/{source}
    |------------------------------------------------------------------
    */
    public function update(Request $request, Source $source)
    {
        $request->validate([
            'nom_site' => 'nullable|string|max:255',
            'url'      => 'nullable|url|unique:sources,url,' . $source->id_source . ',id_source',
            'statut'   => 'nullable|in:actif,inactif',
        ]);

        $source->update($request->only(['nom_site', 'url', 'statut']));

        return response()->json($source);
    }

    /*
    |------------------------------------------------------------------
    | Supprimer une source
    | DELETE /api/sources/{source}
    |------------------------------------------------------------------
    */
    public function destroy(Source $source)
    {
        $source->delete();
        return response()->json(['message' => 'Source supprimée avec succès']);
    }
}