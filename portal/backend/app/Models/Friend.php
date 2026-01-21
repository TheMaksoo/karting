<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Friend extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'friend_driver_id',
        'friendship_status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Validation rules for creating/updating friends
     */
    public static function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
            'friend_driver_id' => 'required|exists:drivers,id',
            'friendship_status' => 'required|in:active,blocked',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class, 'friend_driver_id');
    }
}
