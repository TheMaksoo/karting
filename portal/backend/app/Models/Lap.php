<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lap extends Model
{
    protected $fillable = [
        'karting_session_id',
        'driver_id',
        'lap_number',
        'lap_time',
        'position',
        'sector1',
        'sector2',
        'sector3',
        'is_best_lap',
        'gap_to_best_lap',
        'interval',
        'gap_to_previous',
        'avg_speed',
        'kart_number',
        'tyre',
        'cost_per_lap',
    ];

    protected $casts = [
        'lap_time' => 'decimal:3',
        'sector1' => 'decimal:3',
        'sector2' => 'decimal:3',
        'sector3' => 'decimal:3',
        'is_best_lap' => 'boolean',
        'gap_to_best_lap' => 'decimal:3',
        'interval' => 'decimal:3',
        'gap_to_previous' => 'decimal:3',
        'avg_speed' => 'decimal:2',
        'cost_per_lap' => 'decimal:2',
    ];

    public function kartingSession(): BelongsTo
    {
        return $this->belongsTo(KartingSession::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }
}
