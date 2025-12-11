<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Driver;
use App\Models\Track;
use App\Models\KartingSession;
use App\Models\Lap;
use App\Models\Setting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting database seeding...');

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        // Clear existing data
        $this->command->info('🗑️  Clearing existing data...');
        Lap::truncate();
        KartingSession::truncate();
        Driver::truncate();
        Track::truncate();
        User::truncate();
        Setting::truncate();
        
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Seed in order
        $this->seedTracks();
        $this->seedDrivers();
        $this->seedUsers();
        $this->seedSettings();
        $this->seedKartingData();

        $this->command->info('✅ Database seeding completed!');
    }

    private function seedTracks(): void
    {
        $this->command->info('📍 Seeding tracks...');
        
        // Skip tracks seeding if file doesn't exist
        $tracksFile = base_path('../../tracks.json');
        if (!file_exists($tracksFile)) {
            $this->command->warn('⚠️  tracks.json not found - skipping track seeding');
            return;
        }
        
        $tracksJson = file_get_contents($tracksFile);
        $data = json_decode($tracksJson, true);

        foreach ($data['tracks'] as $trackData) {
            Track::create([
                'track_id' => $trackData['trackId'],
                'name' => $trackData['name'],
                'city' => $trackData['location']['city'] ?? null,
                'country' => $trackData['location']['country'] ?? null,
                'region' => $trackData['location']['region'] ?? null,
                'distance' => $trackData['specifications']['distance'] ?? null,
                'corners' => $trackData['specifications']['corners'] ?? null,
                'width' => $trackData['specifications']['width'] ?? null,
                'indoor' => $trackData['specifications']['indoor'] ?? false,
                'features' => $trackData['features'] ?? [],
                'website' => $trackData['website'] ?? null,
                'contact' => $trackData['contact'] ?? [],
                'pricing' => $trackData['pricing'] ?? [],
                'karts' => $trackData['karts'] ?? [],
            ]);
        }

        $this->command->info('✓ Tracks seeded: ' . Track::count());
    }

    private function seedDrivers(): void
    {
        $this->command->info('🏎️  Seeding drivers...');
        
        // Get unique drivers from CSV
        $csvPath = base_path('../../Karten.csv');
        if (!file_exists($csvPath)) {
            $this->command->warn('⚠️  Karten.csv not found - skipping driver seeding');
            return;
        }
        
        $drivers = [];
        
        if (($handle = fopen($csvPath, 'r')) !== false) {
            $header = fgetcsv($handle);
            $driverIndex = array_search('Driver', $header);
            
            while (($row = fgetcsv($handle)) !== false) {
                if (isset($row[$driverIndex]) && $row[$driverIndex]) {
                    $drivers[$row[$driverIndex]] = true;
                }
            }
            fclose($handle);
        }

        // Default colors for drivers
        $colors = [
            '#ff6b35', '#004e89', '#ffd23f', '#1d3557', '#e63946',
            '#2a9d8f', '#f77f00', '#06ffa5', '#9d4edd', '#ff006e'
        ];

        $index = 0;
        foreach (array_keys($drivers) as $driverName) {
            Driver::create([
                'name' => $driverName,
                'color' => $colors[$index % count($colors)],
                'is_active' => true,
            ]);
            $index++;
        }

        $this->command->info('✓ Drivers seeded: ' . Driver::count());
    }

    private function seedUsers(): void
    {
        $this->command->info('👤 Seeding users...');
        
        // Create admin user
        User::create([
            'name' => 'Max van Lierop',
            'email' => 'maxvanlierop05@gmail.com',
            'password' => Hash::make('admin123'), // Change this!
            'role' => 'admin',
            'must_change_password' => false,
        ]);

        $this->command->info('✓ Admin user created: maxvanlierop05@gmail.com');
    }

    private function seedSettings(): void
    {
        $this->command->info('⚙️  Seeding settings...');
        
        // Default color palette
        Setting::setValue('color_palette', [
            '#ff6b35', '#004e89', '#ffd23f', '#1d3557', '#e63946',
            '#2a9d8f', '#f77f00', '#06ffa5', '#9d4edd', '#ff006e',
            '#3a86ff', '#8338ec', '#fb5607', '#ffbe0b', '#06ffa5',
            '#023047', '#219ebc', '#8ecae6'
        ], 'Main color palette for charts');

        Setting::setValue('driver_color_map', [], 'Driver to color assignments');

        $this->command->info('✓ Settings seeded');
    }

    private function seedKartingData(): void
    {
        $this->command->info('🏁 Seeding karting sessions and laps...');
        
        $csvPath = base_path('../../Karten.csv');
        
        if (!file_exists($csvPath)) {
            $this->command->warn('⚠️  Karten.csv not found - skipping karting data seeding');
            $this->command->error('CSV file not found!');
            return;
        }

        $sessions = [];
        $lapsData = [];
        
        if (($handle = fopen($csvPath, 'r')) !== false) {
            $header = fgetcsv($handle);
            
            // Map headers
            $colMap = [];
            foreach ($header as $index => $colName) {
                $colMap[$colName] = $index;
            }
            
            $rowCount = 0;
            while (($row = fgetcsv($handle)) !== false) {
                $rowCount++;
                
                // Get track
                $trackId = $row[$colMap['TrackID']] ?? null;
                if (!$trackId) {
                    $this->command->warn("Row $rowCount skipped: Missing TrackID.");
                    continue;
                }
                
                $track = Track::where('track_id', $trackId)->first();
                if (!$track) {
                    $this->command->warn("Row $rowCount skipped: TrackID $trackId not found.");
                    continue;
                }
                
                // Create unique session key
                $sessionKey = sprintf(
                    '%s_%s_%s_%s',
                    $trackId,
                    $row[$colMap['SessionDate']] ?? '',
                    $row[$colMap['SessionType']] ?? '',
                    $row[$colMap['Heat']] ?? ''
                );
                
                // Create session if not exists
                if (!isset($sessions[$sessionKey])) {
                    $session = KartingSession::create([
                        'track_id' => $track->id,
                        'session_date' => $row[$colMap['SessionDate']] ?? now(),
                        'session_time' => $row[$colMap['Time']] ?? null,
                        'session_type' => $row[$colMap['SessionType']] ?? 'Practice',
                        'heat' => $row[$colMap['Heat']] ?? 1,
                        'weather' => $row[$colMap['Weather']] ?? null,
                        'source' => $row[$colMap['Source']] ?? null,
                        'heat_price' => $row[$colMap['HeatPrice']] ?? null,
                        'notes' => $row[$colMap['Notes']] ?? null,
                    ]);
                    $sessions[$sessionKey] = $session->id;
                }
                
                // Get driver
                $driverName = $row[$colMap['Driver']] ?? null;
                if (!$driverName) {
                    $this->command->warn("Row $rowCount skipped: Missing Driver.");
                    continue;
                }
                
                $driver = Driver::where('name', $driverName)->first();
                if (!$driver) {
                    $this->command->warn("Row $rowCount skipped: Driver $driverName not found.");
                    continue;
                }
                
                // Create lap
                Lap::create([
                    'karting_session_id' => $sessions[$sessionKey],
                    'driver_id' => $driver->id,
                    'lap_number' => $row[$colMap['LapNumber']] ?? 1,
                    'lap_time' => $row[$colMap['LapTime']] ?? 0,
                    'position' => $row[$colMap['Position']] ?? null,
                    'sector1' => $row[$colMap['Sector1']] ?: null,
                    'sector2' => $row[$colMap['Sector2']] ?: null,
                    'sector3' => $row[$colMap['Sector3']] ?: null,
                    'is_best_lap' => ($row[$colMap['BestLap']] ?? 'N') === 'Y',
                    'gap_to_best_lap' => $row[$colMap['GapToBestLap']] ?: null,
                    'interval' => $row[$colMap['Interval']] ?: null,
                    'gap_to_previous' => $row[$colMap['GapToPrevious']] ?: null,
                    // 'avg_speed' => $row[$colMap['AvgSpeed']] ?: null, // Not in CSV
                    'kart_number' => $row[$colMap['Kart']] ?: null,
                    'tyre' => $row[$colMap['Tyre']] ?: null,
                    'cost_per_lap' => $row[$colMap['CostPerLap']] ?: null,
                ]);
                
                if ($rowCount % 50 === 0) {
                    $this->command->info("  Processed {$rowCount} rows...");
                }
            }
            fclose($handle);
        }

        $this->command->info('✓ Sessions seeded: ' . KartingSession::count());
        $this->command->info('✓ Laps seeded: ' . Lap::count());
    }
}
