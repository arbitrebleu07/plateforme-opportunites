<?php

namespace App\Services;

use Illuminate\Support\Str;

class OpportunityDataSanitizationService
{
    public function sanitize(array $data): array
    {
        foreach (['titre', 'description', 'entreprise', 'localisation', 'source'] as $field) {
            if (array_key_exists($field, $data)) {
                $data[$field] = $this->cleanText($data[$field]);
            }
        }

        if (array_key_exists('url_source', $data)) {
            $data['url_source'] = trim((string) $data['url_source']);
        }

        if (isset($data['categories']) && is_array($data['categories'])) {
            $data['categories'] = array_values(array_unique(array_filter(array_map(
                fn ($category) => $this->cleanText($category),
                $data['categories']
            ))));
        }

        return $data;
    }

    public function hasValidContent(array $data): bool
    {
        $title = Str::lower($data['titre'] ?? '');

        return ($data['titre'] ?? '') !== ''
            && ($data['description'] ?? '') !== ''
            && ! in_array($title, ['sans titre', 'untitled'], true);
    }

    private function cleanText(mixed $value): string
    {
        $text = html_entity_decode((string) $value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = strip_tags($text);
        $text = str_replace("\u{FFFD}", '', $text);
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', ' ', $text) ?? '';

        return trim(preg_replace('/\s+/u', ' ', $text) ?? '');
    }
}
