<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KartingSession extends Model
{
    protected $fillable = [
        'track_id',
        'session_date',
        'session_time',
        'session_type',
        'session_number',
        'heat',
        'weather',
        'source',
        'heat_price',
        'notes',
    ];

    protected $casts = [
        'session_date' => 'date',
        'heat_price' => 'decimal:2',
    ];

    public function track(): BelongsTo
    {
        return $this->belongsTo(Track::class);
    }

    public function laps(): HasMany
    {
        return $this->hasMany(Lap::class);
    }
}
