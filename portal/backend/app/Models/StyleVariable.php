<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StyleVariable extends Model
{
    protected $fillable = [
        'key',
        'value',
        'category',
        'label',
        'description',
        'type',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array'
    ];

    public static function getAsCSS(): string
    {
        $variables = self::all();
        $css = ":root {\n";
        
        foreach ($variables as $variable) {
            $css .= "  --{$variable->key}: {$variable->value};\n";
        }
        
        $css .= "}\n";
        return $css;
    }

    public static function getGroupedByCategory(): array
    {
        return self::all()->groupBy('category')->toArray();
    }
}
