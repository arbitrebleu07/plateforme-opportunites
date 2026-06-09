<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update existing data from 'bourse' to 'bourses/concours'
        DB::table('offres')
            ->where('type', 'bourse')
            ->update(['type' => 'bourses/concours']);

        // Modify the enum column
        Schema::table('offres', function (Blueprint $table) {
            $table->enum('type', ['emploi', 'stage', 'bourses/concours', 'formation'])->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert data back to 'bourse'
        DB::table('offres')
            ->where('type', 'bourses/concours')
            ->update(['type' => 'bourse']);

        // Revert the enum column
        Schema::table('offres', function (Blueprint $table) {
            $table->enum('type', ['emploi', 'stage', 'bourse', 'formation'])->change();
        });
    }
};
