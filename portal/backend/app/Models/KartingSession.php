<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class KartingSession extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Relationships to eager load by default
     */
    protected $with = ['track'];

    protected $fillable = [
        'track_id',
        'session_date',
        'session_time',
        'session_type',
        'session_number',
        'heat',
        'weather',
        'temperature',
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
