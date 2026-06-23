<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyScraperKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $configuredKey = (string) config('services.scraper.key');
        $providedKey = (string) $request->header('X-Scraper-Key');

        if ($configuredKey === '') {
            return response()->json([
                'message' => 'La clé du scraper n’est pas configurée.',
            ], 503);
        }

        if ($providedKey === '' || ! hash_equals($configuredKey, $providedKey)) {
            return response()->json([
                'message' => 'Clé du scraper invalide.',
            ], 401);
        }

        return $next($request);
    }
}
