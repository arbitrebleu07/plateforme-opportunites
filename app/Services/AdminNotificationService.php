<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class AdminNotificationService
{
    public function send(string $title, string $message): void
    {
        User::where('role', 'admin')
            ->pluck('id')
            ->each(function (int $adminId) use ($title, $message): void {
                $notification = Notification::create([
                    'titre' => $title,
                    'message' => $message,
                    'lu' => false,
                    'date_notification' => now(),
                ]);

                $notification->utilisateurs()->attach($adminId);
            });
    }
}
