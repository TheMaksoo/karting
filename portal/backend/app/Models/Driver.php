<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Driver extends Model
{
    protected $fillable = [
        'name',
        'email',
        'nickname',
        'color',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function laps(): HasMany
    {
        return $this->hasMany(Lap::class);
    }

    public function kartingSessions()
    {
        return $this->hasManyThrough(
            KartingSession::class,
            Lap::class,
            'driver_id', // Foreign key on laps table
            'id', // Foreign key on karting_sessions table
            'id', // Local key on drivers table
            'karting_session_id' // Local key on laps table
        )->distinct();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getDisplayNameAttribute(): string
    {
        return $this->nickname ?? $this->name;
    }
}
