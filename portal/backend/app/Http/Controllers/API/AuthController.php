<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

class AuthController extends Controller
{
    /**
     * Login user and create token
     */
    #[OA\Post(
        path: '/auth/login',
        summary: 'User login',
        description: 'Authenticate user and return access token',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email'),
                    new OA\Property(property: 'password', type: 'string', format: 'password'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Login successful'),
            new OA\Response(response: 422, description: 'Invalid credentials'),
        ]
    )]
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Check if registration is approved
        $registrationStatus = $user->registration_status ?? 'approved';

        if ($registrationStatus === 'pending') {
            throw ValidationException::withMessages([
                'email' => ['Your registration is pending approval. Please wait for an administrator to review your account.'],
            ]);
        }

        if ($registrationStatus === 'rejected') {
            throw ValidationException::withMessages([
                'email' => ['Your registration has been rejected. Please contact an administrator.'],
            ]);
        }

        // Track login activity
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        // For SPA authentication, use session-based auth with cookies
        // This provides better security than localStorage tokens
        auth()->guard('web')->login($user);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'must_change_password' => $user->must_change_password,
                'last_login_at' => $user->last_login_at,
            ],
            'message' => 'Logged in successfully',
        ]);
    }

    /**
     * Logout user (revoke token)
     */
    #[OA\Post(
        path: '/auth/logout',
        summary: 'User logout',
        description: 'Revoke the current access token',
        tags: ['Authentication'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Logged out successfully'),
            new OA\Response(response: 401, description: 'Unauthorized'),
        ]
    )]
    public function logout(Request $request)
    {
        // Logout from web guard (session-based)
        auth()->guard('web')->logout();

        // Only invalidate session if session is available (not in stateless API tests)
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Get current authenticated user
     */
    #[OA\Get(
        path: '/auth/me',
        summary: 'Get current user',
        description: 'Retrieve the currently authenticated user',
        tags: ['Authentication'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Current user data'),
            new OA\Response(response: 401, description: 'Unauthorized'),
        ]
    )]
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    /**
     * Change password
     */
    #[OA\Post(
        path: '/auth/change-password',
        summary: 'Change password',
        description: 'Change the current user password',
        tags: ['Authentication'],
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['current_password', 'new_password', 'new_password_confirmation'],
                properties: [
                    new OA\Property(property: 'current_password', type: 'string'),
                    new OA\Property(property: 'new_password', type: 'string', minLength: 8),
                    new OA\Property(property: 'new_password_confirmation', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Password changed'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => [
                'required',
                'min:8',
                'confirmed',
                'regex:/[a-z]/',      // at least one lowercase
                'regex:/[A-Z]/',      // at least one uppercase
                'regex:/[0-9]/',      // at least one digit
                'regex:/[@$!%*#?&]/', // at least one special character
            ],
        ], [
            'new_password.regex' => 'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character (@$!%*#?&).',
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
            'must_change_password' => false,
            'temp_password' => null,
        ]);

        return response()->json(['message' => 'Password changed successfully']);
    }
}
