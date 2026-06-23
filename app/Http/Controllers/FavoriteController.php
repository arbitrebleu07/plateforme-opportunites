<?php

namespace App\Http\Controllers;

use App\Models\Offre;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            $request->user()->favoris()
                ->with(['categories', 'sources'])
                ->where('moderation_status', 'approved')
                ->orderByDesc('favoris.created_at')
                ->get()
        );
    }

    public function store(Request $request, Offre $offre)
    {
        abort_unless($offre->moderation_status === 'approved', 404);
        $request->user()->favoris()->syncWithoutDetaching([$offre->id_offre]);

        return response()->json(['message' => 'Annonce ajoutée aux favoris.'], 201);
    }

    public function destroy(Request $request, Offre $offre)
    {
        $request->user()->favoris()->detach($offre->id_offre);

        return response()->json(['message' => 'Annonce retirée des favoris.']);
    }
}
