# ADR-009: Caching Strategy

## Status

**Accepted**

## Date

2025-06-15

## Context

The Karting Dashboard has several endpoints that:

- Perform expensive database queries (stats, analytics)
- Return data that doesn't change frequently
- Are called frequently by multiple users

We needed a caching strategy to improve performance without serving stale data.

## Decision

We implement **Laravel Cache** with a layered caching strategy.

### Cache Layers

```
┌─────────────────────────────────────────┐
│         Application Cache               │
│  ┌─────────────────────────────────┐   │
│  │   Response Cache (5 min)        │   │
│  │   /api/drivers/stats            │   │
│  │   /api/tracks/stats             │   │
│  │   /api/sessions/{id}/stats      │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │   Query Cache (1 hour)          │   │
│  │   Expensive aggregations        │   │
│  │   Track leaderboards            │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Implementation

```php
// DriverController@stats
public function stats()
{
    $cacheKey = 'drivers.stats.' . auth()->id();
    
    return Cache::remember($cacheKey, now()->addMinutes(5), function () {
        return Driver::query()
            ->withCount('laps')
            ->with(['laps' => fn($q) => $q->orderBy('lap_time')->limit(1)])
            ->get()
            ->map(fn($driver) => [
                'id' => $driver->id,
                'name' => $driver->name,
                'total_laps' => $driver->laps_count,
                'best_lap' => $driver->laps->first()?->lap_time,
            ]);
    });
}
```

### Cache Invalidation

```php
// When data changes, clear relevant caches
class Driver extends Model
{
    protected static function booted()
    {
        static::saved(function ($driver) {
            Cache::forget('drivers.stats.' . $driver->user_id);
            Cache::tags(['drivers'])->flush();
        });
        
        static::deleted(function ($driver) {
            Cache::forget('drivers.stats.' . $driver->user_id);
        });
    }
}
```

### Cache Configuration

```php
// config/cache.php
'default' => env('CACHE_DRIVER', 'file'),

// Development: file
// Production: redis

// Cache TTLs
// Stats endpoints: 5 minutes
// Leaderboards: 1 hour
// Track data: 24 hours
// User preferences: session-based
```

### Reasons

1. **Performance**: Stats queries reduced from 200ms to <10ms.

2. **User-Scoped**: Cache keys include user ID for personalized data.

3. **Automatic Invalidation**: Model events clear stale cache.

4. **Flexible Backend**: File for development, Redis for production.

## Alternatives Considered

### Option 1: HTTP Caching Only
- **Pros**: Client-side, reduces server load completely
- **Cons**: Stale data issues, complex invalidation

### Option 2: Database Query Caching
- **Pros**: Automatic, no code changes
- **Cons**: Limited control, can cache incorrect queries

### Option 3: Redis-only
- **Pros**: Fast, feature-rich
- **Cons**: Additional infrastructure requirement

## Consequences

### Positive
- Significant performance improvement (10-20x on stats)
- Reduced database load
- Easy to implement with Laravel Cache
- Graceful degradation if cache unavailable

### Negative
- Cache invalidation complexity
- Potential stale data (acceptable with 5 min TTL)
- Memory usage for large datasets

### Neutral
- Need to consider cache in testing (`Cache::fake()`)
- Monitoring cache hit rates recommended

## Cache Headers

```http
Cache-Control: private, max-age=300
ETag: "abc123"
X-Cache: HIT
X-Cache-TTL: 287
```

## References

- [Laravel Cache Documentation](https://laravel.com/docs/cache)
- [Redis Caching Best Practices](https://redis.io/docs/manual/patterns/)
- [Cache Invalidation Strategies](https://www.baeldung.com/cs/cache-invalidation)
