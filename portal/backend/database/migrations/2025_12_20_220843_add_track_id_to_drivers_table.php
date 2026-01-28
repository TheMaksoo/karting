<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if track_id column already exists
        if (Schema::hasColumn('drivers', 'track_id')) {
            return;
        }

        Schema::table('drivers', function (Blueprint $table) {
            // Add track_id as nullable first
            $table->foreignId('track_id')->nullable()->constrained()->onDelete('cascade');
        });

        // Assign existing drivers to tracks based on their sessions
        // Use database-agnostic approach
        $drivers = DB::table('drivers')
            ->whereNull('track_id')
            ->pluck('id');

        foreach ($drivers as $driverId) {
            $trackId = DB::table('laps')
                ->join('karting_sessions', 'karting_sessions.id', '=', 'laps.karting_session_id')
                ->where('laps.driver_id', $driverId)
                ->whereNotNull('karting_sessions.track_id')
                ->value('karting_sessions.track_id');

            if ($trackId) {
                DB::table('drivers')
                    ->where('id', $driverId)
                    ->update(['track_id' => $trackId]);
            }
        }

        // Delete drivers with no sessions (orphaned data) - only in production
        // In testing, we don't delete anything
        if (app()->environment('production')) {
            DB::table('drivers')->whereNull('track_id')->delete();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('drivers', 'track_id')) {
            return;
        }

        Schema::table('drivers', function (Blueprint $table) {
            $table->dropForeign(['track_id']);
            $table->dropColumn('track_id');
        });
    }
};
