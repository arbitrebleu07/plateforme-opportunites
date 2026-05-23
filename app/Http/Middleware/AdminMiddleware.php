<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminMiddleware
{
    /*
    |------------------------------------------------------------------
    | Vérifie que l'utilisateur connecté a le rôle admin
    |------------------------------------------------------------------
    */
    public function handle(Request $request, Closure $next)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Accès refusé. Réservé aux administrateurs.'
            ], 403);
        }

        return $next($request);
    }
}