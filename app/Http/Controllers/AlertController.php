<?php

namespace App\Http\Controllers;

use App\Models\Alerte;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    public function index(Request $request)
    {
        return response()->json($request->user()->alertes()->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'type' => 'nullable|in:emploi,stage,bourses/concours,formation',
            'ville' => 'nullable|string|max:100',
            'domaine' => 'nullable|string|max:100',
            'active' => 'sometimes|boolean',
        ]);

        return response()->json(
            $request->user()->alertes()->create($validated),
            201
        );
    }

    public function update(Request $request, Alerte $alerte)
    {
        abort_unless($alerte->user_id === $request->user()->id, 403);
        $validated = $request->validate([
            'nom' => 'sometimes|string|max:100',
            'type' => 'nullable|in:emploi,stage,bourses/concours,formation',
            'ville' => 'nullable|string|max:100',
            'domaine' => 'nullable|string|max:100',
            'active' => 'sometimes|boolean',
        ]);
        $alerte->update($validated);

        return response()->json($alerte);
    }

    public function destroy(Request $request, Alerte $alerte)
    {
        abort_unless($alerte->user_id === $request->user()->id, 403);
        $alerte->delete();

        return response()->json(['message' => 'Alerte supprimée.']);
    }
}
