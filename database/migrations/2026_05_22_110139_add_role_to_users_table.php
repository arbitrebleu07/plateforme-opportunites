<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRoleToUsersTable extends Migration
{
    /*
    |------------------------------------------------------------------
    | Ajouter les colonnes manquantes à la table users
    | pour correspondre à l'entité UTILISATEUR du MCD
    |------------------------------------------------------------------
    */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Rôle de l'utilisateur : visiteur, membre ou admin
            $table->enum('role', ['visiteur', 'membre', 'admin'])->default('membre')->after('password');

            // Date de création du compte
            $table->timestamp('date_creation')->nullable()->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'date_creation']);
        });
    }
}