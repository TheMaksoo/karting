<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Driver extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'track_id',
        'name',
        'email',
        'nickname',
        'color',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function track(): BelongsTo
    {
        return $this->belongsTo(Track::class);
    }

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

    /**
     * Get all users associated with this driver (many-to-many)
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'driver_user')
            ->withPivot('is_primary')
            ->withTimestamps();
    }

    public function getDisplayNameAttribute(): string
    {
        return $this->nickname ?? $this->name;
    }

    /**
     * Scope to filter only active drivers
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter inactive drivers
     */
    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('is_active', false);
    }
}
