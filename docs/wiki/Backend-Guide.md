# 🔧 Backend Guide

Complete guide to the Laravel backend API of the Karting Dashboard.

## 📦 Technology Stack

- **Framework**: Laravel 12.x
- **Language**: PHP 8.2+
- **Authentication**: Laravel Sanctum
- **ORM**: Eloquent
- **Testing**: PEST PHP
- **Code Style**: Laravel Pint
- **API Docs**: L5-Swagger (OpenAPI 3.0)
- **Database**: MySQL 8.0 / SQLite

## 📁 Directory Structure

```
portal/backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── API/              # API Controllers
│   │   │   │   ├── ActivityController.php
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── DriverController.php
│   │   │   │   ├── EmlUploadController.php
│   │   │   │   ├── FriendController.php
│   │   │   │   ├── KartingSessionController.php
│   │   │   │   ├── LapController.php
│   │   │   │   ├── RegistrationController.php
│   │   │   │   ├── SessionAnalyticsController.php
│   │   │   │   ├── SettingController.php
│   │   │   │   ├── StyleVariableController.php
│   │   │   │   ├── TrackController.php
│   │   │   │   ├── UploadController.php
│   │   │   │   ├── UserDriverController.php
│   │   │   │   ├── UserManagementController.php
│   │   │   │   └── UserSettingsController.php
│   │   │   ├── Controller.php   # Base controller with OpenAPI
│   │   │   └── HealthController.php
│   │   ├── Middleware/           # Custom middleware (7 files)
│   │   ├── Requests/             # Form Request validators (6 files)
│   │   └── Traits/               # Reusable traits
│   ├── Models/                   # Eloquent models (11 files)
│   │   ├── Driver.php
│   │   ├── Friend.php
│   │   ├── KartingSession.php
│   │   ├── Lap.php
│   │   ├── Setting.php
│   │   ├── StyleVariable.php
│   │   ├── Track.php
│   │   ├── Upload.php
│   │   ├── User.php
│   │   ├── UserDriver.php
│   │   └── UserSetting.php
│   └── Services/                 # Business logic services
│       ├── EmlParser.php
│       ├── InputSanitizer.php
│       ├── SessionCalculatorService.php
│       └── TrackDetectorService.php
├── bootstrap/
├── config/                       # Configuration files
│   ├── app.php
│   ├── auth.php
│   ├── cors.php
│   ├── database.php
│   ├── sanctum.php
│   └── ...
├── database/
│   ├── factories/                # Model factories
│   ├── migrations/               # Database migrations (30+)
│   └── seeders/                  # Database seeders
├── routes/
│   ├── api.php                   # API routes
│   └── web.php                   # Web routes
├── storage/
│   ├── api-docs/                 # Generated OpenAPI docs
│   ├── app/
│   ├── framework/
│   └── logs/
├── tests/
│   ├── Feature/                  # Feature tests (21 files)
│   └── Unit/                     # Unit tests (3 files)
├── .env.example                  # Environment template
├── artisan                       # CLI tool
├── composer.json                 # PHP dependencies
└── phpunit.xml                   # PHPUnit configuration
```

## 🏗️ Architecture Patterns

### MVC Pattern

Laravel follows the Model-View-Controller pattern:

```
Request
   ↓
Router (routes/api.php)
   ↓
Middleware Stack
   ↓
Controller (app/Http/Controllers/API/)
   ↓
Service Layer (app/Services/)
   ↓
Model (app/Models/)
   ↓
Database
   ↓
Response
```

### Service Layer Pattern

Business logic is extracted to service classes:

```php
// app/Services/SessionCalculatorService.php
namespace App\Services;

use App\Models\KartingSession;
use Illuminate\Support\Collection;

class SessionCalculatorService
{
    public function calculateStatistics(KartingSession $session): array
    {
        $laps = $session->laps;

        return [
            'total_laps' => $laps->count(),
            'best_lap' => $this->getBestLap($laps),
            'average_lap' => $this->getAverageLap($laps),
            'consistency' => $this->calculateConsistency($laps),
        ];
    }

    private function getBestLap(Collection $laps): ?float
    {
        return $laps->min('lap_time');
    }

    private function getAverageLap(Collection $laps): ?float
    {
        return $laps->avg('lap_time');
    }

    private function calculateConsistency(Collection $laps): float
    {
        $times = $laps->pluck('lap_time');
        $mean = $times->avg();
        $variance = $times->map(fn($time) => pow($time - $mean, 2))->avg();
        
        return sqrt($variance);
    }
}
```

## 📋 Controllers

### Base Controller

```php
// app/Http/Controllers/Controller.php
namespace App\Http\Controllers;

/**
 * @OA\Info(
 *     title="Karting Dashboard API",
 *     version="1.0.0",
 *     description="API for karting lap time tracking and analytics"
 * )
 * @OA\SecurityScheme(
 *     securityScheme="sanctum",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT"
 * )
 */
abstract class Controller
{
    protected function successResponse($data, $message = 'Success', $code = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    protected function errorResponse($message, $code = 400)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], $code);
    }
}
```

### Resource Controller Example

```php
// app/Http/Controllers/API/DriverController.php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDriverRequest;
use App\Http\Requests\UpdateDriverRequest;
use App\Models\Driver;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    /**
     * Display a listing of drivers.
     */
    public function index(Request $request)
    {
        $query = Driver::query();

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $drivers = $query->get();

        return response()->json(['data' => $drivers]);
    }

    /**
     * Store a newly created driver.
     */
    public function store(StoreDriverRequest $request)
    {
        $driver = Driver::create($request->validated());

        return response()->json($driver, 201);
    }

    /**
     * Display the specified driver.
     */
    public function show(Driver $driver)
    {
        $driver->load(['kartingSessions.track', 'kartingSessions.laps']);

        return response()->json($driver);
    }

    /**
     * Update the specified driver.
     */
    public function update(UpdateDriverRequest $request, Driver $driver)
    {
        $driver->update($request->validated());

        return response()->json($driver);
    }

    /**
     * Remove the specified driver.
     */
    public function destroy(Driver $driver)
    {
        $driver->delete(); // Soft delete

        return response()->json(null, 204);
    }

    /**
     * Get driver statistics.
     */
    public function stats(Request $request)
    {
        $query = Driver::with([
            'kartingSessions' => function ($q) {
                $q->with('laps')->active();
            }
        ]);

        if ($request->has('driver_id')) {
            $query->where('id', $request->driver_id);
        }

        $drivers = $query->get()->map(function ($driver) {
            return [
                'driver_id' => $driver->id,
                'driver_name' => $driver->name,
                'total_sessions' => $driver->kartingSessions->count(),
                'total_laps' => $driver->kartingSessions->sum(fn($s) => $s->laps->count()),
                'best_lap_time' => $driver->kartingSessions->flatMap->laps->min('lap_time'),
                'average_lap_time' => $driver->kartingSessions->flatMap->laps->avg('lap_time'),
            ];
        });

        return response()->json(['data' => $drivers]);
    }
}
```

## 📝 Form Request Validation

### Creating Form Requests

```php
// app/Http/Requests/StoreDriverRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDriverRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', Driver::class);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:drivers'],
            'color' => ['required', 'string', 'regex:/^#[0-9A-F]{6}$/i'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * Get custom error messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Driver name is required',
            'name.unique' => 'A driver with this name already exists',
            'color.regex' => 'Color must be a valid hex color code',
        ];
    }
}
```

## 🗄️ Eloquent Models

### Model Structure

```php
// app/Models/Driver.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Driver extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'color',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * The relationships to always eager load.
     */
    protected $with = [];

    /**
     * Get the sessions for the driver.
     */
    public function kartingSessions(): HasMany
    {
        return $this->hasMany(KartingSession::class);
    }

    /**
     * Get the users associated with the driver.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_driver')
            ->withPivot('is_main')
            ->withTimestamps();
    }

    /**
     * Scope a query to only include active drivers.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to get drivers with best laps.
     */
    public function scopeWithBestLap($query)
    {
        return $query->with(['kartingSessions.laps' => function ($q) {
            $q->orderBy('lap_time', 'asc')->limit(1);
        }]);
    }

    /**
     * Get the driver's best lap time.
     */
    public function getBestLapTimeAttribute(): ?float
    {
        return $this->kartingSessions
            ->flatMap->laps
            ->min('lap_time');
    }
}
```

### Relationships

#### One-to-Many

```php
// Driver has many Sessions
public function kartingSessions(): HasMany
{
    return $this->hasMany(KartingSession::class);
}

// Session belongs to Driver
public function driver(): BelongsTo
{
    return $this->belongsTo(Driver::class);
}
```

#### Many-to-Many

```php
// User has many Drivers through pivot
public function drivers(): BelongsToMany
{
    return $this->belongsToMany(Driver::class, 'user_driver')
        ->withPivot('is_main')
        ->withTimestamps();
}

// Driver has many Users through pivot
public function users(): BelongsToMany
{
    return $this->belongsToMany(User::class, 'user_driver')
        ->withPivot('is_main')
        ->withTimestamps();
}
```

#### Has Many Through

```php
// Track has many Laps through Sessions
public function laps(): HasManyThrough
{
    return $this->hasManyThrough(
        Lap::class,
        KartingSession::class
    );
}
```

## 🔐 Authentication (Sanctum)

### Login Flow

```php
// app/Http/Controllers/API/AuthController.php
public function login(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    $user = User::where('email', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }

    // Create token with 24-hour expiration
    $token = $user->createToken('auth-token', ['*'], now()->addHours(24));

    return response()->json([
        'token' => $token->plainTextToken,
        'user' => $user,
    ]);
}
```

### Protected Routes

```php
// routes/api.php
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::apiResource('drivers', DriverController::class);
    // ... other protected routes
});
```

### Middleware

```php
// app/Http/Middleware/AdminMiddleware.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->user()->is_admin) {
            return response()->json([
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        return $next($request);
    }
}
```

## 🗃️ Database Migrations

### Creating Migrations

```php
// database/migrations/2024_11_21_000002_create_drivers_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drivers', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('color', 7); // Hex color
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('name');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drivers');
    }
};
```

### Running Migrations

```bash
# Run all pending migrations
php artisan migrate

# Rollback last migration
php artisan migrate:rollback

# Reset and re-run all migrations
php artisan migrate:fresh

# Reset and seed database
php artisan migrate:fresh --seed
```

## 🌱 Seeders

```php
// database/seeders/DriverSeeder.php
namespace Database\Seeders;

use App\Models\Driver;
use Illuminate\Database\Seeder;

class DriverSeeder extends Seeder
{
    public function run(): void
    {
        $drivers = [
            ['name' => 'John Doe', 'color' => '#FF5733', 'is_active' => true],
            ['name' => 'Jane Smith', 'color' => '#3498DB', 'is_active' => true],
            ['name' => 'Bob Johnson', 'color' => '#2ECC71', 'is_active' => false],
        ];

        foreach ($drivers as $driver) {
            Driver::create($driver);
        }
    }
}
```

## 🧪 Testing with PEST

### Feature Tests

```php
// tests/Feature/DriverControllerTest.php
use App\Models\Driver;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

test('can list all drivers', function () {
    Driver::factory()->count(3)->create();

    $response = $this->getJson('/api/drivers');

    $response->assertStatus(200)
        ->assertJsonCount(3, 'data');
});

test('can create a driver', function () {
    $data = [
        'name' => 'Test Driver',
        'color' => '#FF5733',
        'is_active' => true,
    ];

    $response = $this->postJson('/api/drivers', $data);

    $response->assertStatus(201)
        ->assertJson(['name' => 'Test Driver']);

    $this->assertDatabaseHas('drivers', $data);
});

test('cannot create driver with duplicate name', function () {
    Driver::factory()->create(['name' => 'John Doe']);

    $response = $this->postJson('/api/drivers', [
        'name' => 'John Doe',
        'color' => '#FF5733',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('name');
});

test('can update a driver', function () {
    $driver = Driver::factory()->create();

    $response = $this->putJson("/api/drivers/{$driver->id}", [
        'name' => 'Updated Name',
        'color' => '#3498DB',
    ]);

    $response->assertStatus(200);
    $this->assertDatabaseHas('drivers', ['name' => 'Updated Name']);
});

test('can soft delete a driver', function () {
    $driver = Driver::factory()->create();

    $response = $this->deleteJson("/api/drivers/{$driver->id}");

    $response->assertStatus(204);
    $this->assertSoftDeleted('drivers', ['id' => $driver->id]);
});
```

### Unit Tests

```php
// tests/Unit/SessionCalculatorServiceTest.php
use App\Services\SessionCalculatorService;
use App\Models\KartingSession;
use App\Models\Lap;

test('calculates session statistics correctly', function () {
    $session = KartingSession::factory()->create();
    
    Lap::factory()->create([
        'karting_session_id' => $session->id,
        'lap_time' => 45.123,
    ]);
    
    Lap::factory()->create([
        'karting_session_id' => $session->id,
        'lap_time' => 47.456,
    ]);

    $calculator = new SessionCalculatorService();
    $stats = $calculator->calculateStatistics($session);

    expect($stats['total_laps'])->toBe(2);
    expect($stats['best_lap'])->toBe(45.123);
    expect($stats['average_lap'])->toBeGreaterThan(45.0);
});
```

### Running Tests

```bash
# Run all tests
php artisan test

# Run with coverage
php artisan test --coverage

# Run specific test file
php artisan test tests/Feature/DriverControllerTest.php

# Run specific test
php artisan test --filter "can list all drivers"
```

## 🎯 Services

### EML Parser Service

```php
// app/Services/EmlParser.php
namespace App\Services;

class EmlParser
{
    public function parse(string $emlContent): array
    {
        $headers = $this->extractHeaders($emlContent);
        $body = $this->extractBody($emlContent);

        return [
            'subject' => $headers['subject'] ?? '',
            'from' => $headers['from'] ?? '',
            'date' => $headers['date'] ?? '',
            'body' => $body,
        ];
    }

    private function extractHeaders(string $content): array
    {
        // Parse email headers
        $headers = [];
        $lines = explode("\n", $content);
        
        foreach ($lines as $line) {
            if (empty(trim($line))) break;
            
            if (preg_match('/^([^:]+):\s*(.+)$/', $line, $matches)) {
                $key = strtolower(trim($matches[1]));
                $value = trim($matches[2]);
                $headers[$key] = $value;
            }
        }

        return $headers;
    }

    private function extractBody(string $content): string
    {
        // Extract email body
        $parts = preg_split('/\r?\n\r?\n/', $content, 2);
        return $parts[1] ?? '';
    }
}
```

### Track Detector Service

```php
// app/Services/TrackDetectorService.php
namespace App\Services;

use App\Models\Track;

class TrackDetectorService
{
    private array $trackPatterns = [
        'berghem' => ['Circuit Park Berghem', 'Berghem'],
        'voltage' => ['De Voltage', 'Voltage'],
        'experience' => ['Experience Factory', 'EFA'],
    ];

    public function detectTrack(string $content): ?Track
    {
        $content = strtolower($content);

        foreach ($this->trackPatterns as $key => $patterns) {
            foreach ($patterns as $pattern) {
                if (stripos($content, $pattern) !== false) {
                    return Track::where('name', 'like', "%{$patterns[0]}%")->first();
                }
            }
        }

        return null;
    }
}
```

## 📊 API Documentation (Swagger)

### Controller Annotations

```php
/**
 * @OA\Get(
 *     path="/api/drivers",
 *     summary="List all drivers",
 *     tags={"Drivers"},
 *     security={{"sanctum":{}}},
 *     @OA\Parameter(
 *         name="is_active",
 *         in="query",
 *         description="Filter by active status",
 *         required=false,
 *         @OA\Schema(type="boolean")
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Successful operation",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(
 *                 property="data",
 *                 type="array",
 *                 @OA\Items(ref="#/components/schemas/Driver")
 *             )
 *         )
 *     )
 * )
 */
public function index(Request $request)
{
    // Implementation
}
```

### Model Schemas

```php
/**
 * @OA\Schema(
 *     schema="Driver",
 *     type="object",
 *     title="Driver",
 *     required={"name", "color"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="John Doe"),
 *     @OA\Property(property="color", type="string", example="#FF5733"),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */
class Driver extends Model
{
    // Model implementation
}
```

### Generate Documentation

```bash
php artisan l5-swagger:generate
```

Access at: `http://localhost:8000/api/documentation`

## 🏥 Health Monitoring

```php
// app/Http/Controllers/HealthController.php
namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class HealthController extends Controller
{
    public function check()
    {
        return response()->json([
            'status' => 'healthy',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function detailed()
    {
        return response()->json([
            'status' => 'healthy',
            'timestamp' => now()->toIso8601String(),
            'services' => [
                'database' => $this->checkDatabase(),
                'cache' => $this->checkCache(),
            ],
            'metrics' => [
                'total_sessions' => \App\Models\KartingSession::count(),
                'total_laps' => \App\Models\Lap::count(),
                'total_drivers' => \App\Models\Driver::count(),
            ],
        ]);
    }

    private function checkDatabase(): string
    {
        try {
            DB::connection()->getPdo();
            return 'healthy';
        } catch (\Exception $e) {
            return 'unhealthy';
        }
    }

    private function checkCache(): string
    {
        try {
            Cache::put('health_check', true, 10);
            return Cache::get('health_check') ? 'healthy' : 'unhealthy';
        } catch (\Exception $e) {
            return 'unhealthy';
        }
    }
}
```

## 🔧 Configuration

### Key Configuration Files

#### config/sanctum.php
```php
return [
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,localhost:3000')),
    'expiration' => 1440, // 24 hours
];
```

#### config/cors.php
```php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

## 🚀 Artisan Commands

### Built-in Commands

```bash
# Generate key
php artisan key:generate

# Run migrations
php artisan migrate

# Seed database
php artisan db:seed

# Clear caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

### Custom Commands

```php
// app/Console/Commands/GenerateReport.php
namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateReport extends Command
{
    protected $signature = 'report:generate {type}';
    protected $description = 'Generate a report';

    public function handle()
    {
        $type = $this->argument('type');
        $this->info("Generating {$type} report...");
        
        // Implementation
        
        $this->info('Report generated successfully!');
    }
}
```

## 📚 Further Reading

- [Laravel Documentation](https://laravel.com/docs)
- [Eloquent ORM](https://laravel.com/docs/eloquent)
- [PEST PHP](https://pestphp.com/)
- [Laravel Sanctum](https://laravel.com/docs/sanctum)
- [L5-Swagger](https://github.com/DarkaOnLine/L5-Swagger)

---

*Last Updated: February 2026*
