<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Offre extends Model
{
    protected $primaryKey = 'id_offre';

    protected $fillable = [
        'titre', 'description', 'type', 'entreprise',
        'categorie_principale', 'sous_categorie',
        'localisation', 'date_limite', 'statut', 'source', 'url_source',
        'content_hash', 'date_publication', 'id_utilisateur',
        'profil_recherche', 'missions', 'competences', 'tags',
        'moderation_status', 'moderated_by', 'moderated_at', 'moderation_note',
        'niveau_etudes', 'contrat', 'domaine', 'teletravail',
        'remuneration_min', 'remuneration_max', 'devise',
    ];

    protected function casts(): array
    {
        return [
            'missions' => 'array',
            'competences' => 'array',
            'tags' => 'array',
            'date_limite' => 'date',
            'date_publication' => 'datetime',
            'moderated_at' => 'datetime',
            'teletravail' => 'boolean',
        ];
    }

    public function categories()
    {
        return $this->belongsToMany(Categorie::class, 'classers', 'id_offre', 'id_categorie');
    }

    public function sources()
    {
        return $this->belongsToMany(Source::class, 'provenirs', 'id_offre', 'id_source');
    }

    public function utilisateurs()
    {
        return $this->belongsToMany(User::class, 'publiers', 'id_offre', 'id_utilisateur');
    }

    public function favorisPar()
    {
        return $this->belongsToMany(User::class, 'favoris', 'offre_id', 'user_id')->withTimestamps();
    }

    public function signalements()
    {
        return $this->hasMany(Signalement::class, 'offre_id', 'id_offre');
    }
}
