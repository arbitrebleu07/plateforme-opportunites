<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function nombreNonLues(Request $request)
    {
        $count = $request->user()
            ->notifications()
            ->where('notifications.lu', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    public function index(Request $request)
    {
        return response()->json(
            $request->user()
                ->notifications()
                ->orderByDesc('date_notification')
                ->get()
        );
    }

    public function marquerLu(Request $request, Notification $notification)
    {
        abort_unless(
            $request->user()->notifications()
                ->where('notifications.id_notification', $notification->id_notification)
                ->exists(),
            403
        );

        $notification->update(['lu' => true]);

        return response()->json(['message' => 'Notification marquée comme lue']);
    }
}
