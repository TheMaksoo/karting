<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create('style_variables', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('value');
            $table->string('category'); // colors, spacing, typography, effects
            $table->string('label');
            $table->text('description')->nullable();
            $table->string('type'); // color, size, number, string
            $table->json('metadata')->nullable(); // min, max, unit, etc.
            $table->timestamps();
        });

        // Insert default values
        DB::table('style_variables')->insert([
            // Colors
            ['key' => 'primary-color', 'value' => '#FF6B35', 'category' => 'colors', 'label' => 'Primary Color', 'description' => 'Main brand color', 'type' => 'color', 'metadata' => null],
            ['key' => 'primary-dark', 'value' => '#E55A2B', 'category' => 'colors', 'label' => 'Primary Dark', 'description' => 'Darker shade of primary', 'type' => 'color', 'metadata' => null],
            ['key' => 'accent', 'value' => '#4ECDC4', 'category' => 'colors', 'label' => 'Accent Color', 'description' => 'Secondary accent color', 'type' => 'color', 'metadata' => null],
            ['key' => 'bg-primary', 'value' => '#0F1419', 'category' => 'colors', 'label' => 'Background Primary', 'description' => 'Main background', 'type' => 'color', 'metadata' => null],
            ['key' => 'bg-secondary', 'value' => '#1A1F2E', 'category' => 'colors', 'label' => 'Background Secondary', 'description' => 'Secondary background', 'type' => 'color', 'metadata' => null],
            ['key' => 'bg-tertiary', 'value' => '#252B3A', 'category' => 'colors', 'label' => 'Background Tertiary', 'description' => 'Tertiary background', 'type' => 'color', 'metadata' => null],
            ['key' => 'card-bg', 'value' => 'rgba(26, 31, 46, 0.8)', 'category' => 'colors', 'label' => 'Card Background', 'description' => 'Card background with transparency', 'type' => 'color', 'metadata' => null],
            ['key' => 'text-primary', 'value' => '#F9FAFB', 'category' => 'colors', 'label' => 'Text Primary', 'description' => 'Main text color', 'type' => 'color', 'metadata' => null],
            ['key' => 'text-secondary', 'value' => '#9CA3AF', 'category' => 'colors', 'label' => 'Text Secondary', 'description' => 'Secondary text color', 'type' => 'color', 'metadata' => null],
            ['key' => 'border-color', 'value' => 'rgba(255, 255, 255, 0.1)', 'category' => 'colors', 'label' => 'Border Color', 'description' => 'Default border color', 'type' => 'color', 'metadata' => null],
            ['key' => 'border-light', 'value' => 'rgba(255, 255, 255, 0.2)', 'category' => 'colors', 'label' => 'Border Light', 'description' => 'Lighter border on hover', 'type' => 'color', 'metadata' => null],
            ['key' => 'error-color', 'value' => '#EF4444', 'category' => 'colors', 'label' => 'Error Color', 'description' => 'Error state color', 'type' => 'color', 'metadata' => null],
            ['key' => 'success-color', 'value' => '#10B981', 'category' => 'colors', 'label' => 'Success Color', 'description' => 'Success state color', 'type' => 'color', 'metadata' => null],
            ['key' => 'warning-color', 'value' => '#F59E0B', 'category' => 'colors', 'label' => 'Warning Color', 'description' => 'Warning state color', 'type' => 'color', 'metadata' => null],

            // Spacing
            ['key' => 'spacing-1', 'value' => '0.25rem', 'category' => 'spacing', 'label' => 'Spacing XS', 'description' => 'Extra small spacing', 'type' => 'size', 'metadata' => json_encode(['unit' => 'rem'])],
            ['key' => 'spacing-2', 'value' => '0.5rem', 'category' => 'spacing', 'label' => 'Spacing SM', 'description' => 'Small spacing', 'type' => 'size', 'metadata' => json_encode(['unit' => 'rem'])],
            ['key' => 'spacing-3', 'value' => '0.75rem', 'category' => 'spacing', 'label' => 'Spacing MD', 'description' => 'Medium spacing', 'type' => 'size', 'metadata' => json_encode(['unit' => 'rem'])],
            ['key' => 'spacing-4', 'value' => '1rem', 'category' => 'spacing', 'label' => 'Spacing LG', 'description' => 'Large spacing', 'type' => 'size', 'metadata' => json_encode(['unit' => 'rem'])],
            ['key' => 'spacing-5', 'value' => '1.5rem', 'category' => 'spacing', 'label' => 'Spacing XL', 'description' => 'Extra large spacing', 'type' => 'size', 'metadata' => json_encode(['unit' => 'rem'])],
            ['key' => 'spacing-6', 'value' => '2rem', 'category' => 'spacing', 'label' => 'Spacing 2XL', 'description' => 'Double extra large spacing', 'type' => 'size', 'metadata' => json_encode(['unit' => 'rem'])],

            // Border Radius
            ['key' => 'radius-sm', 'value' => '0.25rem', 'category' => 'spacing', 'label' => 'Border Radius SM', 'description' => 'Small border radius', 'type' => 'size', 'metadata' => json_encode(['unit' => 'rem'])],
            ['key' => 'radius-md', 'value' => '0.5rem', 'category' => 'spacing', 'label' => 'Border Radius MD', 'description' => 'Medium border radius', 'type' => 'size', 'metadata' => json_encode(['unit' => 'rem'])],
            ['key' => 'radius-lg', 'value' => '0.75rem', 'category' => 'spacing', 'label' => 'Border Radius LG', 'description' => 'Large border radius', 'type' => 'size', 'metadata' => json_encode(['unit' => 'rem'])],
            ['key' => 'radius-xl', 'value' => '1rem', 'category' => 'spacing', 'label' => 'Border Radius XL', 'description' => 'Extra large border radius', 'type' => 'size', 'metadata' => json_encode(['unit' => 'rem'])],

            // Typography
            ['key' => 'font-sans', 'value' => "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", 'category' => 'typography', 'label' => 'Sans-serif Font', 'description' => 'Primary font family', 'type' => 'string', 'metadata' => null],
            ['key' => 'font-mono', 'value' => "'Courier New', Consolas, Monaco, monospace", 'category' => 'typography', 'label' => 'Monospace Font', 'description' => 'Monospace font for numbers/code', 'type' => 'string', 'metadata' => null],
            ['key' => 'font-display', 'value' => "'Inter', 'Helvetica Neue', sans-serif", 'category' => 'typography', 'label' => 'Display Font', 'description' => 'Font for headings', 'type' => 'string', 'metadata' => null],
            ['key' => 'text-xs', 'value' => '1rem', 'category' => 'typography', 'label' => 'Text XS', 'description' => 'Extra small text', 'type' => 'size', 'metadata' => json_encode(['unit' => 'rem', 'min' => '1rem'])],
            ['key' => 'text-sm', 'value' => '1rem', 'category' => 'typography', 'label' => 'Text SM', 'description' => 'Small text', 'type' => 'size', 'metadata' => json_encode(['unit' => 'rem', 'min' => '1rem'])],
            ['key' => 'text-base', 'value' => '1rem', 'category' => 'typography', 'label' => 'Text Base', 'description' => 'Base text size', 'type' => 'size', 'metadata' => json_encode(['unit' => 'rem', 'min' => '1rem'])],
            ['key' => 'text-lg', 'value' => '1.125rem', 'category' => 'typography', 'label' => 'Text LG', 'description' => 'Large text', 'type' => 'size', 'metadata' => json_encode(['unit' => 'rem', 'min' => '1rem'])],
            ['key' => 'text-xl', 'value' => '1.25rem', 'category' => 'typography', 'label' => 'Text XL', 'description' => 'Extra large text', 'type' => 'size', 'metadata' => json_encode(['unit' => 'rem', 'min' => '1rem'])],
            ['key' => 'text-2xl', 'value' => '1.5rem', 'category' => 'typography', 'label' => 'Text 2XL', 'description' => 'Double extra large text', 'type' => 'size', 'metadata' => json_encode(['unit' => 'rem', 'min' => '1rem'])],
            ['key' => 'text-3xl', 'value' => '1.875rem', 'category' => 'typography', 'label' => 'Text 3XL', 'description' => 'Triple extra large text', 'type' => 'size', 'metadata' => json_encode(['unit' => 'rem', 'min' => '1rem'])],

            // Effects
            ['key' => 'transition-fast', 'value' => '0.15s ease', 'category' => 'effects', 'label' => 'Fast Transition', 'description' => 'Quick transitions', 'type' => 'string', 'metadata' => null],
            ['key' => 'transition-normal', 'value' => '0.2s cubic-bezier(0.4, 0, 0.2, 1)', 'category' => 'effects', 'label' => 'Normal Transition', 'description' => 'Standard transitions', 'type' => 'string', 'metadata' => null],
            ['key' => 'shadow-sm', 'value' => '0 1px 3px rgba(0, 0, 0, 0.1)', 'category' => 'effects', 'label' => 'Small Shadow', 'description' => 'Small box shadow', 'type' => 'string', 'metadata' => null],
            ['key' => 'shadow-md', 'value' => '0 4px 12px rgba(0, 0, 0, 0.15)', 'category' => 'effects', 'label' => 'Medium Shadow', 'description' => 'Medium box shadow', 'type' => 'string', 'metadata' => null],
            ['key' => 'shadow-lg', 'value' => '0 8px 20px rgba(0, 0, 0, 0.2)', 'category' => 'effects', 'label' => 'Large Shadow', 'description' => 'Large box shadow', 'type' => 'string', 'metadata' => null],

            // Card Specific
            ['key' => 'card-padding', 'value' => '1rem', 'category' => 'spacing', 'label' => 'Card Padding', 'description' => 'Default card padding', 'type' => 'size', 'metadata' => json_encode(['unit' => 'rem'])],
            ['key' => 'card-padding-mobile', 'value' => '0.75rem', 'category' => 'spacing', 'label' => 'Card Padding Mobile', 'description' => 'Card padding on mobile', 'type' => 'size', 'metadata' => json_encode(['unit' => 'rem'])],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('style_variables');
    }
};
