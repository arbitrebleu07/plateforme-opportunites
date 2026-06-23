<?php

namespace App\Console\Commands;

use App\Models\Offre;
use App\Services\OpportunityCategorizationService;
use Illuminate\Console\Command;
use Throwable;

class ReclassifyOpportunities extends Command
{
    protected $signature = 'opportunities:reclassify {--dry-run : Analyse sans modifier la base}';

    protected $description = 'Reclasse toutes les opportunités et génère un rapport';

    public function handle(OpportunityCategorizationService $categorization): int
    {
        $total = Offre::count();
        $processed = 0;
        $updated = 0;
        $errors = 0;
        $categories = [];

        $this->info("Analyse de {$total} opportunité(s)...");
        $progress = $this->output->createProgressBar($total);
        $progress->start();

        Offre::with(['categories', 'sources'])
            ->orderBy('id_offre')
            ->chunkById(100, function ($offres) use (
                $categorization,
                &$processed,
                &$updated,
                &$errors,
                &$categories,
                $progress
            ): void {
                foreach ($offres as $offre) {
                    try {
                        $classification = $categorization->categorize($offre);
                        $category = $classification['categorie_principale'];
                        $categories[$category] = ($categories[$category] ?? 0) + 1;

                        if (! $this->option('dry-run')) {
                            $categorization->applyToOffre($offre);
                            $updated++;
                        }
                    } catch (Throwable $exception) {
                        $errors++;
                        $this->newLine();
                        $this->error("Offre {$offre->id_offre}: {$exception->getMessage()}");
                    } finally {
                        $processed++;
                        $progress->advance();
                    }
                }
            }, 'id_offre');

        $progress->finish();
        $this->newLine(2);

        ksort($categories);
        $this->table(
            ['Catégorie', 'Nombre'],
            collect($categories)->map(fn ($count, $category) => [$category, $count])->values()
        );
        $this->table(
            ['Total', 'Traitées', 'Mises à jour', 'Erreurs', 'Mode'],
            [[$total, $processed, $updated, $errors, $this->option('dry-run') ? 'simulation' : 'écriture']]
        );

        return $errors === 0 ? self::SUCCESS : self::FAILURE;
    }
}
