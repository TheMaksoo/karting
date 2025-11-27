<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('laps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('karting_session_id')->constrained()->onDelete('cascade');
            $table->foreignId('driver_id')->constrained()->onDelete('cascade');
            
            // Lap details
            $table->integer('lap_number');
            $table->decimal('lap_time', 8, 3); // seconds with milliseconds
            $table->integer('position')->nullable();
            
            // Sector times
            $table->decimal('sector1', 8, 3)->nullable();
            $table->decimal('sector2', 8, 3)->nullable();
            $table->decimal('sector3', 8, 3)->nullable();
            
            // Flags and gaps
            $table->boolean('is_best_lap')->default(false);
            $table->decimal('gap_to_best_lap', 8, 3)->nullable();
            $table->decimal('interval', 8, 3)->nullable();
            $table->decimal('gap_to_previous', 8, 3)->nullable();
            
            // Performance metrics
            $table->decimal('avg_speed', 8, 2)->nullable(); // km/h
            $table->string('kart_number')->nullable();
            $table->string('tyre')->nullable();
            $table->decimal('cost_per_lap', 8, 2)->nullable();
            
            $table->timestamps();
            
            $table->index(['karting_session_id', 'driver_id', 'lap_number']);
            $table->index(['driver_id', 'is_best_lap']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('laps');
    }
};
