<?php

namespace App\Services;

use App\Models\Notification;

class NotificationService
{
    public static function notifyUser(int $userId, string $titre, string $message): Notification
    {
        $notification = Notification::create([
            'titre' => $titre,
            'message' => $message,
            'lu' => false,
            'date_notification' => now(),
        ]);

        $notification->utilisateurs()->attach($userId);

        return $notification;
    }
}
