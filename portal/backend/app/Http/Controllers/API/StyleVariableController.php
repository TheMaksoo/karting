<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\StyleVariable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class StyleVariableController extends Controller
{
    public function index()
    {
        return response()->json([
            'variables' => StyleVariable::getGroupedByCategory()
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'value' => 'required|string'
        ]);

        $variable = StyleVariable::findOrFail($id);
        $variable->update(['value' => $request->value]);

        // Clear CSS cache
        Cache::forget('style_variables_css');

        return response()->json([
            'message' => 'Style variable updated successfully',
            'variable' => $variable
        ]);
    }

    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'variables' => 'required|array',
            'variables.*.id' => 'required|exists:style_variables,id',
            'variables.*.value' => 'required|string'
        ]);

        foreach ($request->variables as $varData) {
            StyleVariable::where('id', $varData['id'])
                ->update(['value' => $varData['value']]);
        }

        // Clear CSS cache
        Cache::forget('style_variables_css');

        return response()->json([
            'message' => 'Style variables updated successfully'
        ]);
    }

    public function getCSS()
    {
        $css = Cache::remember('style_variables_css', 3600, function () {
            return StyleVariable::getAsCSS();
        });

        return response($css)
            ->header('Content-Type', 'text/css')
            ->header('Cache-Control', 'public, max-age=3600');
    }

    public function reset()
    {
        // This would reset to defaults - you'd need to implement the logic
        Cache::forget('style_variables_css');
        
        return response()->json([
            'message' => 'Style variables reset to defaults'
        ]);
    }
}
