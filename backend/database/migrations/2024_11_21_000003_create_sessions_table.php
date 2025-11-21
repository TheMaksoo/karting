<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('karting_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('track_id')->constrained()->onDelete('cascade');
            $table->date('session_date');
            $table->time('session_time')->nullable();
            $table->string('session_type')->default('Practice'); // Practice, Race, Qualifying
            $table->integer('heat')->default(1);
            $table->string('weather')->nullable();
            $table->string('source')->nullable(); // SMS Timing, etc
            $table->decimal('heat_price', 8, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['track_id', 'session_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('karting_sessions');
    }
};
