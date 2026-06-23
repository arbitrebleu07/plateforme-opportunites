<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\Offre;
use Illuminate\Console\Command;

class ExpireOpportunities extends Command
{
    protected $signature = 'opportunities:expire';

    protected $description = 'Désactive les opportunités dont la date limite est dépassée';

    public function handle(): int
    {
        $expired = 0;

        Offre::query()
            ->where('statut', 'active')
            ->whereNotNull('date_limite')
            ->whereDate('date_limite', '<', now()->toDateString())
            ->orderBy('id_offre')
            ->chunkById(100, function ($offres) use (&$expired): void {
                foreach ($offres as $offre) {
                    $offre->update(['statut' => 'expiree']);
                    $expired++;

                    if ($offre->id_utilisateur) {
                        $notification = Notification::create([
                            'titre' => 'Offre expirée',
                            'message' => "Votre offre \"{$offre->titre}\" a été désactivée après sa date limite.",
                            'lu' => false,
                            'date_notification' => now(),
                        ]);
                        $notification->utilisateurs()->attach($offre->id_utilisateur);
                    }
                }
            }, 'id_offre');

        $this->info("{$expired} opportunité(s) expirée(s).");

        return self::SUCCESS;
    }
}
