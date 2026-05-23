<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Categorie;

class CategorieSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['nom' => 'Informatique'],
            ['nom' => 'Marketing'],
            ['nom' => 'Finance'],
            ['nom' => 'Ressources Humaines'],
            ['nom' => 'Vente'],
            ['nom' => 'Ingénierie'],
            ['nom' => 'Design'],
            ['nom' => 'Communication'],
            ['nom' => 'Juridique'],
            ['nom' => 'Santé'],
        ];

        foreach ($categories as $categorie) {
            Categorie::firstOrCreate($categorie);
        }
    }
}
