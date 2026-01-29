<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTrackRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            'region' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'min:-90', 'max:90'],
            'longitude' => ['nullable', 'numeric', 'min:-180', 'max:180'],
            'distance' => ['nullable', 'integer', 'min:100', 'max:10000'], // Track length in meters (100m - 10km)
            'corners' => ['nullable', 'integer', 'min:1', 'max:50'],
            'width' => ['nullable', 'integer', 'min:3', 'max:30'], // Track width in meters
            'indoor' => ['sometimes', 'boolean'],
            'features' => ['nullable', 'array'],
            'website' => ['nullable', 'url', 'max:500'],
            'contact' => ['nullable', 'array'],
            'contact.email' => ['nullable', 'email'],
            'contact.phone' => ['nullable', 'string', 'max:50'],
            'pricing' => ['nullable', 'array'],
            'karts' => ['nullable', 'array'],
        ];
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Track name is required.',
            'name.max' => 'Track name cannot exceed 255 characters.',
            'latitude.min' => 'Latitude must be between -90 and 90 degrees.',
            'latitude.max' => 'Latitude must be between -90 and 90 degrees.',
            'longitude.min' => 'Longitude must be between -180 and 180 degrees.',
            'longitude.max' => 'Longitude must be between -180 and 180 degrees.',
            'distance.min' => 'Track distance must be at least 100 meters.',
            'distance.max' => 'Track distance cannot exceed 10,000 meters.',
            'corners.min' => 'Track must have at least 1 corner.',
            'corners.max' => 'Track cannot have more than 50 corners.',
            'width.min' => 'Track width must be at least 3 meters.',
            'width.max' => 'Track width cannot exceed 30 meters.',
            'website.url' => 'Website must be a valid URL.',
            'contact.email.email' => 'Contact email must be a valid email address.',
        ];
    }
}
