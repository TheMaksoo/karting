<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: '1.0.0',
    title: 'Karting Dashboard API',
    description: 'API for managing karting sessions, laps, drivers, and tracks',
    contact: new OA\Contact(email: 'support@karting-dashboard.local'),
    license: new OA\License(name: 'MIT', url: 'https://opensource.org/licenses/MIT')
)]
#[OA\Server(url: '/api', description: 'API Server')]
#[OA\SecurityScheme(
    securityScheme: 'sanctum',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Enter your Sanctum token'
)]
#[OA\Tag(name: 'Authentication', description: 'Login, logout, and user authentication')]
#[OA\Tag(name: 'Drivers', description: 'Driver management')]
#[OA\Tag(name: 'Tracks', description: 'Track management')]
#[OA\Tag(name: 'Sessions', description: 'Karting session management')]
#[OA\Tag(name: 'Laps', description: 'Lap data')]
#[OA\Tag(name: 'Stats', description: 'Statistics and analytics')]
#[OA\Tag(name: 'Friends', description: 'Friend management')]
#[OA\Tag(name: 'Settings', description: 'User and application settings')]
#[OA\Tag(name: 'Health', description: 'Health check endpoints')]
#[OA\Tag(name: 'Upload', description: 'File upload and EML processing')]
abstract class Controller
{
    //
}
