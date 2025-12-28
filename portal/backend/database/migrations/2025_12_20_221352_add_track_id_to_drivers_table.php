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
        // Step 1: Add nullable track_id column
        Schema::table('drivers', function (Blueprint $table) {
            $table->unsignedBigInteger('track_id')->nullable()->after('id');
        });

        // Step 2: Migrate existing driver data by finding their track through sessions
        DB::statement('
            UPDATE drivers d
            INNER JOIN (
                SELECT DISTINCT d.id, ks.track_id
                FROM drivers d
                INNER JOIN laps l ON l.driver_id = d.id
                INNER JOIN karting_sessions ks ON l.session_id = ks.id
            ) AS driver_tracks ON d.id = driver_tracks.id
            SET d.track_id = driver_tracks.track_id
        ');

        // Step 3: Delete orphaned drivers that have no sessions/laps
        DB::statement('DELETE FROM drivers WHERE track_id IS NULL');

        // Step 4: Make track_id non-nullable and add foreign key
        Schema::table('drivers', function (Blueprint $table) {
            $table->unsignedBigInteger('track_id')->nullable(false)->change();
            $table->foreign('track_id')->references('id')->on('tracks')->onDelete('cascade');
        });

        // Step 5: Drop unique constraint on email (drivers can have same email at different tracks)
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropUnique(['email']);
        });

        // Step 6: Add unique constraint on (name, track_id)
        Schema::table('drivers', function (Blueprint $table) {
            $table->unique(['name', 'track_id'], 'drivers_name_track_id_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropUnique('drivers_name_track_id_unique');
            $table->dropForeign(['track_id']);
            $table->dropColumn('track_id');
            $table->unique('email');
        });
    }
};
