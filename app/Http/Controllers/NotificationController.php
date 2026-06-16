<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /*
    |------------------------------------------------------------------
    | Lister les notifications de l'utilisateur connecté
    | GET /api/notifications
    |------------------------------------------------------------------
    */
    public function index(Request $request)
    {
        $notifications = $request->user()
                                ->notifications()
                                ->orderBy('date_notification', 'desc')
                                ->get();

        return response()->json($notifications);
    }

    /*
    |------------------------------------------------------------------
    | Marquer une notification comme lue
    | PUT /api/notifications/{notification}/lire
    |------------------------------------------------------------------
    */
    public function marquerLu(Request $request, Notification $notification)
    {
        if (!$notification->utilisateurs()->where('users.id', $request->user()->id)->exists()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $notification->update(['lu' => true]);
        return response()->json(['message' => 'Notification marquée comme lue']);
    }
}