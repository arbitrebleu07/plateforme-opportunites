<?php

namespace App\Http\Controllers;

use App\Models\Categorie;
use Illuminate\Http\Request;

class CategorieController extends Controller
{
    /*
    |------------------------------------------------------------------
    | Lister toutes les catégories
    | GET /api/categories
    |------------------------------------------------------------------
    */
    public function index()
    {
        $categories = Categorie::all();
        return response()->json($categories);
    }

    /*
    |------------------------------------------------------------------
    | Créer une nouvelle catégorie
    | POST /api/categories
    |------------------------------------------------------------------
    */
    public function store(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:255|unique:categories,nom',
        ]);

        $categorie = Categorie::create(['nom' => $request->nom]);

        return response()->json($categorie, 201);
    }

    /*
    |------------------------------------------------------------------
    | Modifier une catégorie
    | PUT /api/categories/{categorie}
    |------------------------------------------------------------------
    */
    public function update(Request $request, Categorie $categorie)
    {
        $request->validate([
            'nom' => 'required|string|max:255|unique:categories,nom,' . $categorie->id_categorie . ',id_categorie',
        ]);

        $categorie->update(['nom' => $request->nom]);

        return response()->json($categorie);
    }

    /*
    |------------------------------------------------------------------
    | Supprimer une catégorie
    | DELETE /api/categories/{categorie}
    |------------------------------------------------------------------
    */
    public function destroy(Categorie $categorie)
    {
        $categorie->delete();
        return response()->json(['message' => 'Catégorie supprimée avec succès']);
    }
}