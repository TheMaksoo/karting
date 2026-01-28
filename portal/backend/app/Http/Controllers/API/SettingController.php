<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->mapWithKeys(function ($setting) {
            return [$setting->key => $setting->value];
        });

        return response()->json($settings);
    }

    public function update(Request $request, string $key)
    {
        $validated = $request->validate([
            'value' => 'required',
            'description' => 'nullable|string',
        ]);

        Setting::setValue($key, $validated['value'], $validated['description'] ?? null);

        $setting = Setting::where('key', $key)->first();

        return response()->json($setting);
    }
}
