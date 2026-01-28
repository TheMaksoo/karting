<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds performance indexes and audit columns to improve query speed
     * and enable soft deletes for data recovery.
     */
    public function up(): void
    {
        // Add indexes to laps table for performance
        Schema::table('laps', function (Blueprint $table) {
            $table->index('lap_time', 'laps_lap_time_index');
            $table->softDeletes();
        });

        // Add indexes to karting_sessions table
        Schema::table('karting_sessions', function (Blueprint $table) {
            $table->index('session_type', 'karting_sessions_session_type_index');
            $table->softDeletes();
        });

        // Add indexes to drivers table
        Schema::table('drivers', function (Blueprint $table) {
            $table->index('name', 'drivers_name_index');
            $table->index('is_active', 'drivers_is_active_index');
            $table->softDeletes();
        });

        // Add indexes to tracks table
        Schema::table('tracks', function (Blueprint $table) {
            $table->index('name', 'tracks_name_index');
            $table->softDeletes();
        });

        // Add audit columns to users table
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('last_login_at')->nullable();
            $table->ipAddress('last_login_ip')->nullable();
        });

        // Add audit column to uploads table
        Schema::table('uploads', function (Blueprint $table) {
            $table->ipAddress('uploaded_from')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('laps', function (Blueprint $table) {
            $table->dropIndex('laps_lap_time_index');
            $table->dropSoftDeletes();
        });

        Schema::table('karting_sessions', function (Blueprint $table) {
            $table->dropIndex('karting_sessions_session_type_index');
            $table->dropSoftDeletes();
        });

        Schema::table('drivers', function (Blueprint $table) {
            $table->dropIndex('drivers_name_index');
            $table->dropIndex('drivers_is_active_index');
            $table->dropSoftDeletes();
        });

        Schema::table('tracks', function (Blueprint $table) {
            $table->dropIndex('tracks_name_index');
            $table->dropSoftDeletes();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['last_login_at', 'last_login_ip']);
        });

        Schema::table('uploads', function (Blueprint $table) {
            $table->dropColumn('uploaded_from');
        });
    }
};
