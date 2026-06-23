<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScraperRun extends Model
{
    protected $fillable = [
        'user_id',
        'source',
        'limit',
        'status',
        'collected_count',
        'inserted_count',
        'skipped_count',
        'error_count',
        'message',
        'log_excerpt',
        'started_at',
        'finished_at',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    public static function failStaleRuns(): int
    {
        return static::query()
            ->where('status', 'running')
            ->where('started_at', '<', now()->subMinutes(30))
            ->update([
                'status' => 'failed',
                'error_count' => 1,
                'message' => 'Collecte interrompue avant la génération du rapport final.',
                'finished_at' => now(),
                'updated_at' => now(),
            ]);
    }
}
