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
            if (! $this->indexExists('laps', 'laps_lap_time_index')) {
                $table->index('lap_time', 'laps_lap_time_index');
            }

            if (! Schema::hasColumn('laps', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        // Add indexes to karting_sessions table
        Schema::table('karting_sessions', function (Blueprint $table) {
            if (! $this->indexExists('karting_sessions', 'karting_sessions_session_type_index')) {
                $table->index('session_type', 'karting_sessions_session_type_index');
            }

            if (! Schema::hasColumn('karting_sessions', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        // Add indexes to drivers table (name index may already exist)
        Schema::table('drivers', function (Blueprint $table) {
            // Check for any existing index on name column
            if (! $this->hasIndexOnColumn('drivers', 'name')) {
                $table->index('name', 'drivers_name_index');
            }

            if (! $this->indexExists('drivers', 'drivers_is_active_index')) {
                $table->index('is_active', 'drivers_is_active_index');
            }

            if (! Schema::hasColumn('drivers', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        // Add indexes to tracks table
        Schema::table('tracks', function (Blueprint $table) {
            if (! $this->indexExists('tracks', 'tracks_name_index')) {
                $table->index('name', 'tracks_name_index');
            }

            if (! Schema::hasColumn('tracks', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        // Add audit columns to users table
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable();
            }

            if (! Schema::hasColumn('users', 'last_login_ip')) {
                $table->ipAddress('last_login_ip')->nullable();
            }
        });

        // Add audit column to uploads table
        if (Schema::hasTable('uploads')) {
            Schema::table('uploads', function (Blueprint $table) {
                if (! Schema::hasColumn('uploads', 'uploaded_from')) {
                    $table->ipAddress('uploaded_from')->nullable();
                }
            });
        }
    }

    /**
     * Check if a specific index exists.
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $connection = Schema::getConnection();
        $driver = $connection->getDriverName();

        if ($driver === 'sqlite') {
            $indexes = $connection->select("PRAGMA index_list('{$table}')");

            return collect($indexes)->contains('name', $indexName);
        }

        // MySQL
        $indexes = $connection->select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);

        return count($indexes) > 0;
    }

    /**
     * Check if any index exists on a column.
     */
    private function hasIndexOnColumn(string $table, string $column): bool
    {
        $connection = Schema::getConnection();
        $driver = $connection->getDriverName();

        if ($driver === 'sqlite') {
            $indexes = $connection->select("PRAGMA index_list('{$table}')");

            foreach ($indexes as $index) {
                $info = $connection->select("PRAGMA index_info('{$index->name}')");

                foreach ($info as $col) {
                    if ($col->name === $column) {
                        return true;
                    }
                }
            }

            return false;
        }

        // MySQL
        $indexes = $connection->select("SHOW INDEX FROM {$table} WHERE Column_name = ?", [$column]);

        return count($indexes) > 0;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('laps', function (Blueprint $table) {
            if ($this->indexExists('laps', 'laps_lap_time_index')) {
                $table->dropIndex('laps_lap_time_index');
            }

            if (Schema::hasColumn('laps', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });

        Schema::table('karting_sessions', function (Blueprint $table) {
            if ($this->indexExists('karting_sessions', 'karting_sessions_session_type_index')) {
                $table->dropIndex('karting_sessions_session_type_index');
            }

            if (Schema::hasColumn('karting_sessions', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });

        Schema::table('drivers', function (Blueprint $table) {
            if ($this->indexExists('drivers', 'drivers_name_index')) {
                $table->dropIndex('drivers_name_index');
            }

            if ($this->indexExists('drivers', 'drivers_is_active_index')) {
                $table->dropIndex('drivers_is_active_index');
            }

            if (Schema::hasColumn('drivers', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });

        Schema::table('tracks', function (Blueprint $table) {
            if ($this->indexExists('tracks', 'tracks_name_index')) {
                $table->dropIndex('tracks_name_index');
            }

            if (Schema::hasColumn('tracks', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });

        Schema::table('users', function (Blueprint $table) {
            $columns = [];

            if (Schema::hasColumn('users', 'last_login_at')) {
                $columns[] = 'last_login_at';
            }

            if (Schema::hasColumn('users', 'last_login_ip')) {
                $columns[] = 'last_login_ip';
            }

            if (! empty($columns)) {
                $table->dropColumn($columns);
            }
        });

        if (Schema::hasTable('uploads') && Schema::hasColumn('uploads', 'uploaded_from')) {
            Schema::table('uploads', function (Blueprint $table) {
                $table->dropColumn('uploaded_from');
            });
        }
    }
};
