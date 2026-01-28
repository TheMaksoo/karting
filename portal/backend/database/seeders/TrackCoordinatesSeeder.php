<?php

namespace Database\Seeders;

use App\Models\Track;
use Illuminate\Database\Seeder;

class TrackCoordinatesSeeder extends Seeder
{
    public function run(): void
    {
        $coordinates = [
            'Fastkart Elche' => ['latitude' => 38.272984348876044, 'longitude' => -0.6635265027667782],
            'De Voltage' => ['latitude' => 51.546748863935406, 'longitude' => 5.088176982433279],
            'Experience Factory Antwerp' => ['latitude' => 51.25271272608237, 'longitude' => 4.419162930852564],
            'Circuit Park Berghem' => ['latitude' => 51.73851115252818, 'longitude' => 5.57316991127734],
            'Goodwill Karting' => ['latitude' => 51.14925349083925, 'longitude' => 4.892154395909144],
            'Lot66' => ['latitude' => 51.6057903423378, 'longitude' => 4.751824250745985],
            'Racing Center Gilesias' => ['latitude' => 38.1142223242832, 'longitude' => -0.6579792316078417],
        ];

        foreach ($coordinates as $trackName => $coords) {
            Track::where('name', $trackName)->update($coords);
            $this->command->info("Updated coordinates for: {$trackName}");
        }
    }
}
