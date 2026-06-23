<?php

namespace App\Console\Commands;

use App\Models\ScraperRun;
use App\Services\ScraperExecutionService;
use Illuminate\Console\Command;
use Throwable;

class ExecuteScraperRun extends Command
{
    protected $signature = 'scraper:execute {run : Identifiant du rapport de collecte}';

    protected $description = 'Exécute une collecte Python détachée et enregistre son rapport';

    public function handle(ScraperExecutionService $execution): int
    {
        $run = ScraperRun::find($this->argument('run'));

        if (! $run || $run->status !== 'running') {
            $this->error('Rapport introuvable ou déjà terminé.');
            return self::FAILURE;
        }

        try {
            $execution->execute($run);
            return self::SUCCESS;
        } catch (Throwable $exception) {
            report($exception);
            $run->update([
                'status' => 'failed',
                'error_count' => max(1, $run->error_count),
                'message' => $exception->getMessage(),
                'log_excerpt' => mb_substr($exception->getTraceAsString(), -12000),
                'finished_at' => now(),
            ]);

            return self::FAILURE;
        }
    }
}
