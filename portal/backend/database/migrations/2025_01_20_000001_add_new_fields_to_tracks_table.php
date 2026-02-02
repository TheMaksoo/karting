<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::table('tracks', function (Blueprint $table) {
            // Add address field
            if (! Schema::hasColumn('tracks', 'address')) {
                $table->string('address')->nullable()->after('region');
            }

            // Add status field
            if (! Schema::hasColumn('tracks', 'status')) {
                $table->string('status')->default('OPEN')->after('karts');
            }

            // Add notes field
            if (! Schema::hasColumn('tracks', 'notes')) {
                $table->text('notes')->nullable()->after('status');
            }

            // Add opening_hours field
            if (! Schema::hasColumn('tracks', 'opening_hours')) {
                $table->json('opening_hours')->nullable()->after('notes');
            }

            // Add soft deletes if not present
            if (! Schema::hasColumn('tracks', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    public function down(): void
    {
        Schema::table('tracks', function (Blueprint $table) {
            $columns = ['address', 'status', 'notes', 'opening_hours', 'deleted_at'];

            foreach ($columns as $column) {
                if (Schema::hasColumn('tracks', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
