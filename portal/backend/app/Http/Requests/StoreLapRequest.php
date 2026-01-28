<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLapRequest extends FormRequest
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
            'karting_session_id' => ['required', 'exists:karting_sessions,id'],
            'driver_id' => ['required', 'exists:drivers,id'],
            'lap_number' => ['required', 'integer', 'min:1', 'max:999'],
            'lap_time' => ['required', 'numeric', 'min:1', 'max:600'], // 1 second to 10 minutes
            'position' => ['nullable', 'integer', 'min:1', 'max:99'],
            'sector1' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'sector2' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'sector3' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'is_best_lap' => ['boolean'],
            'gap_to_best_lap' => ['nullable', 'numeric', 'min:0'],
            'interval' => ['nullable', 'numeric'],
            'gap_to_previous' => ['nullable', 'numeric'],
            'avg_speed' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'kart_number' => ['nullable', 'integer', 'min:1', 'max:999'],
            'tyre' => ['nullable', 'string', 'max:50'],
            'cost_per_lap' => ['nullable', 'numeric', 'min:0', 'max:100'],
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
            'karting_session_id.required' => 'A session must be specified.',
            'karting_session_id.exists' => 'The selected session does not exist.',
            'driver_id.required' => 'A driver must be specified.',
            'driver_id.exists' => 'The selected driver does not exist.',
            'lap_number.required' => 'Lap number is required.',
            'lap_number.min' => 'Lap number must be at least 1.',
            'lap_time.required' => 'Lap time is required.',
            'lap_time.min' => 'Lap time must be at least 1 second.',
            'lap_time.max' => 'Lap time cannot exceed 10 minutes (600 seconds).',
        ];
    }
}
