<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Track extends Model
{
    protected $fillable = [
        'track_id',
        'name',
        'city',
        'country',
        'region',
        'distance',
        'corners',
        'width',
        'indoor',
        'features',
        'website',
        'contact',
        'pricing',
        'karts',
    ];

    protected $casts = [
        'indoor' => 'boolean',
        'features' => 'array',
        'contact' => 'array',
        'pricing' => 'array',
        'karts' => 'array',
    ];

    public function kartingSessions(): HasMany
    {
        return $this->hasMany(KartingSession::class);
    }
}
