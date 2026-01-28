<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create('tracks', function (Blueprint $table) {
            $table->id();
            $table->string('track_id')->unique(); // TRK-001, etc
            $table->string('name');

            // Location
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->string('region')->nullable();

            // Specifications
            $table->integer('distance')->nullable(); // in meters
            $table->integer('corners')->nullable();
            $table->integer('width')->nullable();
            $table->boolean('indoor')->default(false);

            // Additional fields
            $table->json('features')->nullable();
            $table->string('website')->nullable();
            $table->json('contact')->nullable();
            $table->json('pricing')->nullable();
            $table->json('karts')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tracks');
    }
};
