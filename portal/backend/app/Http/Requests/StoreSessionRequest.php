<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSessionRequest extends FormRequest
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
            'track_id' => ['required', 'exists:tracks,id'],
            'session_date' => ['required', 'date'],
            'session_time' => ['nullable', 'date_format:H:i'],
            'session_type' => ['required', 'string', 'in:race,practice,qualifying,heat,training'],
            'session_number' => ['nullable', 'string', 'max:50'],
            'heat' => ['nullable', 'integer', 'min:1', 'max:99'],
            'weather' => ['nullable', 'string', 'in:dry,wet,mixed,indoor'],
            'source' => ['nullable', 'string', 'max:255'],
            'heat_price' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:1000'],
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
            'track_id.required' => 'A track must be selected.',
            'track_id.exists' => 'The selected track does not exist.',
            'session_date.required' => 'Session date is required.',
            'session_type.in' => 'Session type must be: race, practice, qualifying, heat, or training.',
            'heat.min' => 'Heat number must be at least 1.',
            'heat.max' => 'Heat number cannot exceed 99.',
            'heat_price.max' => 'Heat price cannot exceed 1000.',
        ];
    }
}
