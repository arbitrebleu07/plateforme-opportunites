<?php

namespace App\Services;

use App\Models\Alerte;
use App\Models\Notification;
use App\Models\Offre;

class OpportunityAlertService
{
    public function notifyMatchingUsers(Offre $offre): void
    {
        Alerte::query()
            ->where('active', true)
            ->with('user')
            ->get()
            ->filter(fn (Alerte $alerte) => $this->matches($alerte, $offre))
            ->each(function (Alerte $alerte) use ($offre): void {
                $notification = Notification::create([
                    'titre' => 'Nouvelle opportunité correspondant à votre alerte',
                    'message' => "{$alerte->nom} : {$offre->titre}",
                    'lu' => false,
                    'date_notification' => now(),
                ]);
                $notification->utilisateurs()->attach($alerte->user_id);
            });
    }

    private function matches(Alerte $alerte, Offre $offre): bool
    {
        $typeMatches = ! $alerte->type || $alerte->type === $offre->type;
        $cityMatches = ! $alerte->ville
            || str_contains(mb_strtolower((string) $offre->localisation), mb_strtolower($alerte->ville));
        $domain = mb_strtolower(implode(' ', array_filter([
            $offre->domaine,
            $offre->categorie_principale,
            $offre->sous_categorie,
            $offre->titre,
        ])));
        $domainMatches = ! $alerte->domaine
            || str_contains($domain, mb_strtolower($alerte->domaine));

        return $typeMatches && $cityMatches && $domainMatches;
    }
}
