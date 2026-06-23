<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Categorie extends Model
{
    protected $primaryKey = 'id_categorie';
    protected $fillable = ['nom', 'parent_id'];

    public function offres()
    {
        return $this->belongsToMany(Offre::class, 'classers', 'id_categorie', 'id_offre');
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id', 'id_categorie');
    }

    public function children()
    {
        return $this->hasMany(self::class, 'parent_id', 'id_categorie');
    }
}
