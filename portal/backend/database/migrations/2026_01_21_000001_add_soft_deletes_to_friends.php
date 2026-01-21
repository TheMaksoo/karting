<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('friends', function (Blueprint $table) {
            $table->softDeletes();
            
            // Add composite index for better query performance
            $table->index(['user_id', 'friendship_status']);
        });
    }

    public function down(): void
    {
        Schema::table('friends', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropIndex(['user_id', 'friendship_status']);
        });
    }
};
