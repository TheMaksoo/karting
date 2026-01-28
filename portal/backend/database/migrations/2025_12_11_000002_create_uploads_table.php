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
        Schema::create('uploads', function (Blueprint $table) {
            $table->id();
            $table->string('file_name');
            $table->string('file_hash')->unique(); // MD5 hash of file content to detect exact duplicates
            $table->timestamp('upload_date');
            $table->timestamp('session_date')->nullable(); // Extracted session date from EML
            $table->string('session_time')->nullable(); // Extracted session time from EML
            $table->foreignId('karting_session_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('track_id')->nullable()->constrained()->onDelete('set null');
            $table->string('status')->default('success'); // success, warning, failed
            $table->json('warnings')->nullable(); // Array of warning messages
            $table->text('error_message')->nullable(); // Error details if failed
            $table->integer('laps_count')->default(0);
            $table->integer('drivers_count')->default(0);
            $table->timestamps();

            $table->index(['file_hash']);
            $table->index(['session_date', 'track_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('uploads');
    }
};
