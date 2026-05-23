<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Offre extends Model
{
    protected $primaryKey = 'id_offre';
    protected $fillable = [
        'titre', 'description', 'type', 'entreprise',
        'localisation', 'date_limite', 'statut', 'source', 'date_publication', 'id_utilisateur'
    ];

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
}