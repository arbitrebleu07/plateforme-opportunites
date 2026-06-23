<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('offres', function (Blueprint $table) {
            $table->string('moderation_status', 20)->default('approved')->index();
            $table->foreignId('moderated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('moderated_at')->nullable();
            $table->string('moderation_note')->nullable();
            $table->string('niveau_etudes')->nullable()->index();
            $table->string('contrat')->nullable()->index();
            $table->string('domaine')->nullable()->index();
            $table->boolean('teletravail')->default(false)->index();
            $table->unsignedBigInteger('remuneration_min')->nullable();
            $table->unsignedBigInteger('remuneration_max')->nullable();
            $table->string('devise', 10)->default('XAF');
        });
    }

    public function down(): void
    {
        Schema::table('offres', function (Blueprint $table) {
            $table->dropForeign(['moderated_by']);
            $table->dropColumn([
                'moderation_status', 'moderated_by', 'moderated_at', 'moderation_note',
                'niveau_etudes', 'contrat', 'domaine', 'teletravail',
                'remuneration_min', 'remuneration_max', 'devise',
            ]);
        });
    }
};
