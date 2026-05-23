<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $primaryKey = 'id_notification';
    protected $fillable = ['titre', 'message', 'lu', 'date_notification'];

    public function utilisateurs()
    {
        return $this->belongsToMany(User::class, 'recevoirs', 'id_notification', 'id_utilisateur');
    }
}