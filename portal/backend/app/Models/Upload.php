<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Upload extends Model
{
    protected $fillable = [
        'file_name',
        'file_hash',
        'upload_date',
        'session_date',
        'session_time',
        'karting_session_id',
        'track_id',
        'status',
        'warnings',
        'error_message',
        'laps_count',
        'drivers_count',
    ];

    protected $casts = [
        'upload_date' => 'datetime',
        'session_date' => 'datetime',
        'warnings' => 'array',
    ];

    public function kartingSession(): BelongsTo
    {
        return $this->belongsTo(KartingSession::class);
    }

    public function track(): BelongsTo
    {
        return $this->belongsTo(Track::class);
    }
}
