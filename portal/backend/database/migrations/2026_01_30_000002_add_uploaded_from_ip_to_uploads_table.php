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
        if (! Schema::hasTable('uploads') || Schema::hasColumn('uploads', 'uploaded_from_ip')) {
            return;
        }

        Schema::table('uploads', function (Blueprint $table) {
            $table->string('uploaded_from_ip', 45)->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('uploads', 'uploaded_from_ip')) {
            return;
        }

        Schema::table('uploads', function (Blueprint $table) {
            $table->dropColumn('uploaded_from_ip');
        });
    }
};
