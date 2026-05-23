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
    Schema::create('offres', function (Blueprint $table) {
        $table->id('id_offre');
        $table->string('titre');
        $table->text('description');
        $table->enum('type', ['emploi', 'stage', 'bourse', 'formation']);
        $table->string('entreprise')->nullable();
        $table->string('localisation')->nullable();
        $table->date('date_limite')->nullable();
        $table->enum('statut', ['active', 'expiree'])->default('active');
        $table->string('source')->nullable();
        $table->timestamp('date_publication')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('offres');
    }
};
