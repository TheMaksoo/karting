<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class RegistrationController extends Controller
{
    /**
     * Register a new user (pending approval)
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'display_name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => [
                'required',
                'confirmed',
                Password::min(8),
            ],
        ], [
            'email.unique' => 'An account with this email already exists.',
            'password.confirmed' => 'Password confirmation does not match.',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'display_name' => $validated['display_name'] ?? $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'driver',
            'registration_status' => 'pending',
            'must_change_password' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Registration submitted successfully. Please wait for admin approval.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'registration_status' => $user->registration_status,
            ],
        ], 201);
    }

    /**
     * Get pending registrations (admin only)
     */
    public function pending(Request $request): JsonResponse
    {
        $registrations = User::where('registration_status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'display_name', 'email', 'created_at']);

        return response()->json($registrations);
    }

    /**
     * Approve a registration (admin only)
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->registration_status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This registration has already been processed.',
            ], 400);
        }

        $validated = $request->validate([
            'role' => ['required', 'string', 'in:driver,admin'],
            'driver_ids' => ['nullable', 'array'],
            'driver_ids.*' => ['integer', 'exists:drivers,id'],
        ]);

        $user->update([
            'registration_status' => 'approved',
            'role' => $validated['role'] ?? 'driver',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        // Connect to drivers if provided
        if (! empty($validated['driver_ids'])) {
            $isFirst = true;

            foreach ($validated['driver_ids'] as $driverId) {
                $user->drivers()->attach($driverId, ['is_primary' => $isFirst]);

                if ($isFirst) {
                    $user->update(['driver_id' => $driverId]);
                    $isFirst = false;
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Registration approved successfully.',
            'user' => $user->fresh(['drivers']),
        ]);
    }

    /**
     * Reject a registration (admin only)
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->registration_status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This registration has already been processed.',
            ], 400);
        }

        $user->update([
            'registration_status' => 'rejected',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Registration rejected.',
        ]);
    }

    /**
     * Delete a rejected registration (admin only)
     */
    public function destroy(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->registration_status === 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete an approved user through this endpoint.',
            ], 400);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Registration deleted.',
        ]);
    }

    /**
     * Get all registrations for admin view (with filters)
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('registration_status', $request->status);
        }

        $registrations = $query->orderBy('created_at', 'desc')
            ->with('drivers:id,name')
            ->get([
                'id',
                'name',
                'display_name',
                'email',
                'role',
                'registration_status',
                'approved_at',
                'created_at',
            ]);

        return response()->json($registrations);
    }
}
