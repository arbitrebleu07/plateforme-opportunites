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
    Schema::create('recevoirs', function (Blueprint $table) {
        $table->unsignedBigInteger('id_utilisateur');
        $table->unsignedBigInteger('id_notification');
        $table->primary(['id_utilisateur', 'id_notification']);
        $table->foreign('id_utilisateur')->references('id')->on('users')->onDelete('cascade');
        $table->foreign('id_notification')->references('id_notification')->on('notifications')->onDelete('cascade');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recevoirs');
    }
};
