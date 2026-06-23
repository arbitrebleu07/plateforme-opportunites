<?php

namespace App\Services;

use App\Models\ScraperRun;
use Illuminate\Support\Facades\Process;
use RuntimeException;

class ScraperExecutionService
{
    public const SOURCES = [
        'all',
        'infos_concours_education',
        'kamerpower',
        'emplois_cm',
        'minajobs',
        'jooble',
        'coursera',
    ];

    public function start(ScraperRun $run): void
    {
        $php = PHP_BINARY;
        $artisan = base_path('artisan');

        if (PHP_OS_FAMILY === 'Windows') {
            $escape = fn (string $value) => str_replace("'", "''", $value);
            $stdout = storage_path("logs/scraper-run-{$run->id}.out.log");
            $stderr = storage_path("logs/scraper-run-{$run->id}.error.log");
            $script = sprintf(
                "Start-Process -FilePath '%s' -ArgumentList @('%s','scraper:execute','%d') -WorkingDirectory '%s' -WindowStyle Hidden -RedirectStandardOutput '%s' -RedirectStandardError '%s'",
                $escape($php),
                $escape($artisan),
                $run->id,
                $escape(base_path()),
                $escape($stdout),
                $escape($stderr)
            );

            $command = [
                'powershell.exe',
                '-NoProfile',
                '-NonInteractive',
                '-WindowStyle',
                'Hidden',
                '-Command',
                $script,
            ];

            $descriptors = [
                0 => ['file', 'NUL', 'r'],
                1 => ['file', 'NUL', 'a'],
                2 => ['file', 'NUL', 'a'],
            ];
            $process = proc_open($command, $descriptors, $pipes, base_path());

            if (! is_resource($process) || proc_close($process) !== 0) {
                throw new RuntimeException('Impossible de démarrer le processus Windows de collecte.');
            }
        } else {
            $result = Process::timeout(15)->run([
                'sh',
                '-c',
                sprintf(
                    'nohup %s %s scraper:execute %d > /dev/null 2>&1 &',
                    escapeshellarg($php),
                    escapeshellarg($artisan),
                    $run->id
                ),
            ]);
            if (! $result->successful()) {
                throw new RuntimeException('Impossible de démarrer le processus de collecte.');
            }
        }
    }

    public function execute(ScraperRun $run): ScraperRun
    {
        set_time_limit(0);

        $python = env(
            'SCRAPER_PYTHON_PATH',
            base_path('.venv/bin/python.exe')
        );

        if (! is_file($python)) {
            throw new RuntimeException(
                "Environnement Python introuvable. Exécutez l'installation du scraper dans scraper/.venv."
            );
        }

        $reportPath = storage_path("app/scraper-run-{$run->id}.json");
        $command = [
            $python,
            base_path('scraper/main.py'),
            '--source',
            $run->source,
            '--limit',
            (string) $run->limit,
            '--report-file',
            $reportPath,
        ];

        $result = Process::path(base_path('scraper'))
            ->timeout(1200)
            ->env(['PYTHONIOENCODING' => 'utf-8'])
            ->run($command);

        $report = is_file($reportPath)
            ? json_decode(file_get_contents($reportPath), true)
            : [];

        @unlink($reportPath);
        $combinedOutput = trim($result->output()."\n".$result->errorOutput());
        $hasRuntimeError = str_contains($combinedOutput, ' - ERROR - ')
            || str_contains($combinedOutput, 'Traceback (most recent call last)');
        $successful = $result->successful() && ! $hasRuntimeError;

        $run->update([
            'status' => $successful ? 'completed' : 'failed',
            'collected_count' => $report['collected'] ?? 0,
            'inserted_count' => $report['inserted'] ?? 0,
            'skipped_count' => $report['skipped'] ?? 0,
            'error_count' => max((int) ($report['errors'] ?? 0), $successful ? 0 : 1),
            'message' => $successful
                ? ($report['message'] ?? 'Collecte terminée avec succès.')
                : 'La source n’a pas pu être collectée. Consultez le journal pour le détail.',
            'log_excerpt' => mb_substr($combinedOutput, -12000),
            'finished_at' => now(),
        ]);

        return $run->fresh();
    }
}
