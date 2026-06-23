<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('offres', function (Blueprint $table) {
            $table->text('profil_recherche')->nullable()->after('description');
            $table->json('missions')->nullable()->after('profil_recherche');
            $table->json('competences')->nullable()->after('missions');
            $table->json('tags')->nullable()->after('competences');
        });
    }

    public function down(): void
    {
        Schema::table('offres', function (Blueprint $table) {
            $table->dropColumn(['profil_recherche', 'missions', 'competences', 'tags']);
        });
    }
};
