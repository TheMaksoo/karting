<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'display_name',
        'email',
        'password',
        'role',
        'driver_id',
        'temp_password',
        'must_change_password',
        'last_login_at',
        'last_login_ip',
        'registration_status',
        'approved_by',
        'approved_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'temp_password',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'must_change_password' => 'boolean',
            'last_login_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    /**
     * Check if user is an admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user registration is approved
     */
    public function isApproved(): bool
    {
        return $this->registration_status === 'approved';
    }

    /**
     * Get the driver associated with this user (legacy single driver)
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    /**
     * Get all drivers associated with this user (many-to-many)
     */
    public function drivers(): BelongsToMany
    {
        return $this->belongsToMany(Driver::class, 'driver_user')
            ->withPivot('is_primary')
            ->withTimestamps()
            ->orderByPivot('is_primary', 'desc');
    }

    /**
     * Get the primary driver for this user
     */
    public function primaryDriver()
    {
        return $this->drivers()->wherePivot('is_primary', true)->first()
            ?? $this->drivers()->first()
            ?? $this->driver; // Fallback to legacy driver_id
    }

    /**
     * Get the user's friends
     */
    public function friends(): HasMany
    {
        return $this->hasMany(Friend::class);
    }

    /**
     * Get the user's track nicknames
     */
    public function trackNicknames(): HasMany
    {
        return $this->hasMany(UserTrackNickname::class);
    }
}
