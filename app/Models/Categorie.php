<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Categorie extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_categorie';
    protected $fillable = ['nom'];

    public function offres()
    {
        return $this->belongsToMany(Offre::class, 'classers', 'id_categorie', 'id_offre');
    }
}