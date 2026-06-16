<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Source extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_source';
    protected $fillable = ['nom_site', 'url', 'derniere_recuperation', 'statut'];

    public function offres()
    {
        return $this->belongsToMany(Offre::class, 'provenirs', 'id_source', 'id_offre');
    }
}