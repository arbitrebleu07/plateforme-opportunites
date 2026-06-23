<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('offres', function (Blueprint $table) {
            $table->string('categorie_principale')->nullable()->after('type');
            $table->string('sous_categorie')->nullable()->after('categorie_principale');
            $table->string('url_source')->nullable()->after('source');
            $table->string('content_hash', 64)->nullable()->after('url_source');
            $table->index('url_source');
            $table->index('content_hash');
        });
    }

    public function down(): void
    {
        Schema::table('offres', function (Blueprint $table) {
            $table->dropIndex(['url_source']);
            $table->dropIndex(['content_hash']);
            $table->dropColumn([
                'categorie_principale',
                'sous_categorie',
                'url_source',
                'content_hash',
            ]);
        });
    }
};
