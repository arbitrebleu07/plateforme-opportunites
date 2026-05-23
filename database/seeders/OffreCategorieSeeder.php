<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Offre;
use App\Models\Categorie;

class OffreCategorieSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $offres = Offre::all();
        $categories = Categorie::all();

        if ($categories->isEmpty()) {
            $this->command->warn('Aucune catégorie trouvée. Exécutez d\'abord CategorieSeeder.');
            return;
        }

        foreach ($offres as $offre) {
            // Associer 1 à 3 catégories aléatoires à chaque offre
            $randomCategories = $categories->random(rand(1, min(3, $categories->count())));
            $offre->categories()->sync($randomCategories->pluck('id_categorie'));
        }

        $this->command->info('Catégories associées aux offres existantes avec succès.');
    }
}
