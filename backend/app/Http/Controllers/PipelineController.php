<?php

namespace App\Http\Controllers;

use App\Models\Pipeline;
use App\Models\Stage;
use Illuminate\Http\Request;

class PipelineController extends Controller
{
    /**
     * Display a listing of the pipelines with stages and deals.
     */
    public function index()
    {
        $pipelines = Pipeline::with(['stages', 'deals.client'])->get();

        return response()->json($pipelines);
    }

    /**
     * Store a newly created pipeline in storage.
     */
    public function store(Request $request)
    {
        // Feature-gating: Plan Emprende / Starter solo permite 1 pipeline
        $planSlug = $request->user()->company->subscription->plan->slug ?? 'starter';
        if (in_array($planSlug, ['starter', 'emprende'])) {
            if (Pipeline::count() >= 1) {
                return response()->json([
                    'message' => 'El plan Emprende solo permite 1 pipeline con etapas fijas. Actualiza a Crece o Escala para crear pipelines ilimitados.',
                    'feature_locked' => true
                ], 403);
            }
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'is_default' => 'boolean',
            'stages' => 'nullable|array',
            'stages.*' => 'string|max:255',
        ]);

        if (!empty($validated['is_default'])) {
            Pipeline::query()->update(['is_default' => false]);
        }

        $pipeline = Pipeline::create([
            'name' => $validated['name'],
            'is_default' => $validated['is_default'] ?? (Pipeline::count() === 0),
        ]);

        $stages = $validated['stages'] ?? ['Lead', 'Contacto', 'Propuesta', 'Cierre'];
        foreach ($stages as $index => $stageName) {
            Stage::create([
                'pipeline_id' => $pipeline->id,
                'name' => $stageName,
                'order' => $index,
            ]);
        }

        return response()->json($pipeline->load(['stages', 'deals.client']), 201);
    }

    /**
     * Display the specified pipeline.
     */
    public function show(Pipeline $pipeline)
    {
        return response()->json($pipeline->load(['stages', 'deals.client']));
    }

    /**
     * Update the specified pipeline in storage.
     */
    public function update(Request $request, Pipeline $pipeline)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'is_default' => 'boolean',
        ]);

        if (!empty($validated['is_default'])) {
            Pipeline::where('id', '!=', $pipeline->id)->update(['is_default' => false]);
        }

        $pipeline->update($validated);

        return response()->json($pipeline->load(['stages', 'deals.client']));
    }

    /**
     * Remove the specified pipeline from storage.
     */
    public function destroy(Pipeline $pipeline)
    {
        $pipeline->delete();

        return response()->json(['message' => 'Pipeline deleted successfully'], 200);
    }
}
