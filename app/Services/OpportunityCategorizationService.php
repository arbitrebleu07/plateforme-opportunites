<?php

namespace App\Services;

use App\Models\Categorie;
use App\Models\Offre;
use Illuminate\Support\Str;

class OpportunityCategorizationService
{
    private array $categoryRules = [
        'Alternance' => ['alternance', 'apprenticeship', 'work study'],
        'Stage' => ['stage', 'stagiaire', 'internship', 'intern '],
        'Certification' => ['certification', 'certificate', 'certificat'],
        'Formation' => ['formation', 'training', 'course', 'cours', 'bootcamp', 'apprendre'],
        'Bourse' => ['bourse', 'scholarship', 'fellowship', 'grant'],
        'Concours' => ['concours', 'competition', 'exam', 'examen'],
        'Appel à candidature' => ['appel a candidature', 'call for applications', 'candidature', 'apply now'],
        'Volontariat' => ['volontariat', 'volunteer', 'volontaire'],
        'Recherche' => ['recherche', 'research', 'phd', 'doctorat', 'postdoc'],
        'Événement' => ['evenement', 'event', 'webinar', 'salon'],
        'Conférence' => ['conference', 'colloque', 'symposium'],
        'Atelier' => ['atelier', 'workshop'],
        'Financement' => ['financement', 'funding', 'fund', 'subvention'],
        'Emploi' => ['emploi', 'job', 'recrutement', 'hiring', 'developer', 'manager', 'engineer', 'analyst'],
    ];

    private array $subcategoryRules = [
        'Bourse gouvernementale' => ['government', 'gouvernement', 'ministere', 'ministry'],
        'Bourse universitaire' => ['university', 'universite', 'campus'],
        'Bourse de recherche' => ['research', 'recherche', 'phd', 'doctorat', 'postdoc'],
        'Bourse internationale' => ['international', 'foreign', 'etranger'],
        'Développement web' => ['web', 'frontend', 'backend', 'full stack', 'angular', 'react', 'laravel', 'php'],
        'Data' => ['data', 'business intelligence', 'analytics'],
        'IA' => ['artificial intelligence', 'intelligence artificielle', 'machine learning', 'deep learning'],
        'Cybersécurité' => ['security', 'cyber', 'securite'],
        'Réseau' => ['network', 'reseau', 'system administrator'],
        'Comptabilité' => ['accounting', 'accountant', 'comptabilite'],
        'Gestion' => ['gestion', 'management', 'project manager'],
        'Marketing' => ['marketing', 'seo', 'community manager', 'growth'],
        'Commercial' => ['commercial', 'sales', 'business development', 'vente'],
        'Informatique' => ['informatique', 'software', 'developer', 'programming'],
        'Finance' => ['finance', 'financial', 'banking'],
        'RH' => ['ressources humaines', 'human resources'],
        'Design' => ['design', 'designer', 'user experience', 'user interface'],
        'Santé' => ['sante', 'health', 'medical', 'pharmacy'],
    ];

    public function categorize(array|Offre $opportunity): array
    {
        $data = $opportunity instanceof Offre ? $opportunity->toArray() : $opportunity;
        $categories = $data['categories'] ?? [];
        if (! is_array($categories)) {
            $categories = [$categories];
        }
        $categories = array_map(
            fn ($category) => is_array($category) ? ($category['nom'] ?? '') : (string) $category,
            $categories
        );

        $text = $this->normalize(implode(' ', [
            $data['titre'] ?? '',
            $data['description'] ?? '',
            $data['source'] ?? '',
            $data['url_source'] ?? '',
            implode(' ', $categories),
        ]));

        return [
            'categorie_principale' => $this->detect($text, $this->categoryRules)
                ?? $this->categoryFromType($data['type'] ?? null)
                ?? 'Autre',
            'sous_categorie' => $this->detect($text, $this->subcategoryRules),
        ];
    }

    public function applyToOffre(Offre $offre): Offre
    {
        $classification = $this->categorize($offre);
        $offre->forceFill($classification)->save();

        $category = Categorie::firstOrCreate([
            'nom' => $classification['categorie_principale'],
            'parent_id' => null,
        ]);
        $offre->categories()->syncWithoutDetaching([$category->id_categorie]);

        if ($classification['sous_categorie']) {
            $subcategory = Categorie::firstOrCreate([
                'nom' => $classification['sous_categorie'],
                'parent_id' => $category->id_categorie,
            ]);
            $offre->categories()->syncWithoutDetaching([$subcategory->id_categorie]);
        }

        return $offre;
    }

    private function detect(string $text, array $rules): ?string
    {
        foreach ($rules as $label => $keywords) {
            foreach ($keywords as $keyword) {
                $normalizedKeyword = preg_quote($this->normalize($keyword), '/');
                if (preg_match('/(^|[^a-z0-9])'.$normalizedKeyword.'([^a-z0-9]|$)/', $text) === 1) {
                    return $label;
                }
            }
        }

        return null;
    }

    private function categoryFromType(?string $type): ?string
    {
        return match ($type) {
            'emploi' => 'Emploi',
            'stage' => 'Stage',
            'formation' => 'Formation',
            'bourses/concours' => 'Bourse',
            default => null,
        };
    }

    private function normalize(string $text): string
    {
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = Str::ascii(Str::lower(strip_tags($text)));

        return trim(preg_replace('/\s+/', ' ', $text) ?? '');
    }
}
