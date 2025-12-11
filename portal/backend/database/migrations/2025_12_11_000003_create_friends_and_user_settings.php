<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add display_name to users table
        Schema::table('users', function (Blueprint $table) {
            $table->string('display_name')->nullable()->after('name');
        });

        // Create user_track_nicknames table for per-track driver names
        Schema::create('user_track_nicknames', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('track_id')->constrained()->onDelete('cascade');
            $table->string('nickname'); // The name used at this track (e.g., "Max", "?" or "#")
            $table->timestamps();
            
            $table->unique(['user_id', 'track_id']);
        });

        // Create friends table
        Schema::create('friends', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('friend_driver_id')->constrained('drivers')->onDelete('cascade');
            $table->string('friendship_status')->default('active'); // active, blocked
            $table->timestamps();
            
            $table->unique(['user_id', 'friend_driver_id']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('friends');
        Schema::dropIfExists('user_track_nicknames');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('display_name');
        });
    }
};
