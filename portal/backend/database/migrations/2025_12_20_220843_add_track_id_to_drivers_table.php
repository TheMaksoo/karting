<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            // Add track_id as nullable first
            $table->foreignId('track_id')->after('id')->nullable()->constrained()->onDelete('cascade');
        });

        // Assign existing drivers to tracks based on their sessions
        DB::statement('
            UPDATE drivers d
            LEFT JOIN laps l ON l.driver_id = d.id
            LEFT JOIN karting_sessions ks ON ks.id = l.karting_session_id
            SET d.track_id = ks.track_id
            WHERE d.track_id IS NULL AND ks.track_id IS NOT NULL
            LIMIT 1
        ');

        // Delete drivers with no sessions (orphaned data)
        DB::statement('DELETE FROM drivers WHERE track_id IS NULL');

        Schema::table('drivers', function (Blueprint $table) {
            // Now make it required
            $table->foreignId('track_id')->nullable(false)->change();

            // Drop unique email constraint
            $table->dropUnique(['email']);

            // Make name + track_id unique together
            $table->unique(['name', 'track_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropForeign(['track_id']);
            $table->dropUnique(['name', 'track_id']);
            $table->dropColumn('track_id');
            $table->unique('email');
        });
    }
};
