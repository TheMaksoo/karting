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
        Schema::table('users', function (Blueprint $table) {
            // Registration status: pending, approved, rejected
            if (! Schema::hasColumn('users', 'registration_status')) {
                $table->string('registration_status')->default('approved')->after('role');
            }

            if (! Schema::hasColumn('users', 'approved_by')) {
                $table->unsignedBigInteger('approved_by')->nullable()->after('registration_status');
            }

            if (! Schema::hasColumn('users', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            }

            if (! Schema::hasColumn('users', 'display_name')) {
                $table->string('display_name')->nullable()->after('name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = [];

            if (Schema::hasColumn('users', 'registration_status')) {
                $columns[] = 'registration_status';
            }

            if (Schema::hasColumn('users', 'approved_by')) {
                $columns[] = 'approved_by';
            }

            if (Schema::hasColumn('users', 'approved_at')) {
                $columns[] = 'approved_at';
            }

            if (count($columns) > 0) {
                $table->dropColumn($columns);
            }
        });
    }
};
