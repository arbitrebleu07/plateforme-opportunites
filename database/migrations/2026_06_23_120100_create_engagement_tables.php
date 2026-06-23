<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('favoris', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('offre_id');
            $table->foreign('offre_id')->references('id_offre')->on('offres')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'offre_id']);
        });

        Schema::create('signalements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('offre_id');
            $table->foreign('offre_id')->references('id_offre')->on('offres')->cascadeOnDelete();
            $table->string('motif');
            $table->text('details')->nullable();
            $table->string('statut', 20)->default('nouveau')->index();
            $table->timestamps();
            $table->unique(['user_id', 'offre_id']);
        });

        Schema::create('alertes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('nom');
            $table->string('type')->nullable();
            $table->string('ville')->nullable();
            $table->string('domaine')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('rappels_echeance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('offre_id');
            $table->foreign('offre_id')->references('id_offre')->on('offres')->cascadeOnDelete();
            $table->unsignedTinyInteger('jours_avant');
            $table->timestamps();
            $table->unique(['user_id', 'offre_id', 'jours_avant']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rappels_echeance');
        Schema::dropIfExists('alertes');
        Schema::dropIfExists('signalements');
        Schema::dropIfExists('favoris');
    }
};
