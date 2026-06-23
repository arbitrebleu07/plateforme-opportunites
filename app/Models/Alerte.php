<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Alerte extends Model
{
    protected $table = 'alertes';

    protected $fillable = ['user_id', 'nom', 'type', 'ville', 'domaine', 'active'];

    protected function casts(): array
    {
        return ['active' => 'boolean'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
