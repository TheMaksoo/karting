<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Debugging response
        return response()->json(['status' => 'success', 'message' => 'Login method executed']);
    }

    public function logout(Request $request)
    {
        // Logout logic
    }

    public function userDetails(Request $request)
    {
        // Fetch user details logic
    }

    public function changePassword(Request $request)
    {
        // Change password logic
    }
}