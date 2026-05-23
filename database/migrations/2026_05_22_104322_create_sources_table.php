<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('sources', function (Blueprint $table) {
        $table->id('id_source');
        $table->string('nom_site');
        $table->string('url');
        $table->timestamp('derniere_recuperation')->nullable();
        $table->enum('statut', ['actif', 'inactif'])->default('actif');
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sources');
    }
};
