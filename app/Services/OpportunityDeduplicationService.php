<?php

namespace App\Services;

use App\Models\Offre;
use Illuminate\Support\Str;

class OpportunityDeduplicationService
{
    public function findDuplicate(array $data): ?Offre
    {
        if (! empty($data['url_source'])) {
            $duplicate = Offre::where('url_source', $data['url_source'])->first();
            if ($duplicate) {
                return $duplicate;
            }
        }

        if (! empty($data['content_hash'])) {
            $duplicate = Offre::where('content_hash', $data['content_hash'])->first();
            if ($duplicate) {
                return $duplicate;
            }
        }

        $title = $this->normalize($data['titre'] ?? '');
        $source = $this->normalize($data['source'] ?? '');

        if ($title === '') {
            return null;
        }

        return Offre::query()
            ->when($source !== '', fn ($query) => $query->where('source', $data['source']))
            ->get()
            ->first(fn (Offre $offre) => $this->normalize($offre->titre) === $title);
    }

    public function contentHash(array $data): string
    {
        return hash('sha256', implode('|', [
            $this->normalize($data['titre'] ?? ''),
            $this->normalize($data['description'] ?? ''),
            $this->normalize($data['source'] ?? ''),
        ]));
    }

    private function normalize(string $value): string
    {
        $value = Str::ascii(Str::lower(strip_tags(html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8'))));
        return trim(preg_replace('/[^a-z0-9]+/', ' ', $value) ?? '');
    }
}
