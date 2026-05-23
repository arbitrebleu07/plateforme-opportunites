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
    Schema::create('publiers', function (Blueprint $table) {
        $table->unsignedBigInteger('id_utilisateur');
        $table->unsignedBigInteger('id_offre');
        $table->primary(['id_utilisateur', 'id_offre']);
        $table->foreign('id_utilisateur')->references('id')->on('users')->onDelete('cascade');
        $table->foreign('id_offre')->references('id_offre')->on('offres')->onDelete('cascade');
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('publiers');
    }
};
