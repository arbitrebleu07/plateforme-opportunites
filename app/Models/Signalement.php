<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Signalement extends Model
{
    protected $table = 'signalements';

    protected $fillable = ['user_id', 'offre_id', 'motif', 'details', 'statut'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function offre()
    {
        return $this->belongsTo(Offre::class, 'offre_id', 'id_offre');
    }
}
