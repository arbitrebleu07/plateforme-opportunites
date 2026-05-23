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
    Schema::create('provenirs', function (Blueprint $table) {
        $table->unsignedBigInteger('id_source');
        $table->unsignedBigInteger('id_offre');
        $table->primary(['id_source', 'id_offre']);
        $table->foreign('id_source')->references('id_source')->on('sources')->onDelete('cascade');
        $table->foreign('id_offre')->references('id_offre')->on('offres')->onDelete('cascade');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('provenirs');
    }
};
