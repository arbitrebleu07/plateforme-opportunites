<?php

namespace App\Http\Controllers;

use App\Models\Offre;
use App\Models\Signalement;
use App\Services\AdminNotificationService;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function store(
        Request $request,
        Offre $offre,
        AdminNotificationService $adminNotifications
    )
    {
        $validated = $request->validate([
            'motif' => 'required|in:information_incorrecte,lien_invalide,annonce_expiree,fraude,autre',
            'details' => 'nullable|string|max:1000',
        ]);

        $report = Signalement::updateOrCreate(
            ['user_id' => $request->user()->id, 'offre_id' => $offre->id_offre],
            [...$validated, 'statut' => 'nouveau']
        );

        $adminNotifications->send(
            'Nouveau signalement',
            "{$request->user()->name} a signalé l’annonce \"{$offre->titre}\"."
        );

        return response()->json($report, 201);
    }
}
