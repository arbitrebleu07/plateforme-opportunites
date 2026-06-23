<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\Offre;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SendDeadlineReminders extends Command
{
    protected $signature = 'opportunities:remind-deadlines';

    protected $description = 'Notifie les propriétaires et utilisateurs ayant mis en favori une offre proche de son échéance';

    public function handle(): int
    {
        $sent = 0;

        foreach ([7, 3, 1] as $days) {
            $date = now()->addDays($days)->toDateString();
            Offre::query()
                ->where('statut', 'active')
                ->where('moderation_status', 'approved')
                ->whereDate('date_limite', $date)
                ->with('favorisPar:id')
                ->get()
                ->each(function (Offre $offre) use ($days, &$sent): void {
                    $userIds = collect([$offre->id_utilisateur])
                        ->merge($offre->favorisPar->pluck('id'))
                        ->filter()
                        ->unique();

                    foreach ($userIds as $userId) {
                        $inserted = DB::table('rappels_echeance')->insertOrIgnore([
                            'user_id' => $userId,
                            'offre_id' => $offre->id_offre,
                            'jours_avant' => $days,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        if (! $inserted) {
                            continue;
                        }

                        $notification = Notification::create([
                            'titre' => 'Date limite proche',
                            'message' => "\"{$offre->titre}\" expire dans {$days} jour(s).",
                            'lu' => false,
                            'date_notification' => now(),
                        ]);
                        $notification->utilisateurs()->attach($userId);
                        $sent++;
                    }
                });
        }

        $this->info("{$sent} rappel(s) envoyé(s).");

        return self::SUCCESS;
    }
}
