<?php

namespace App\Http\Controllers;

use App\Models\Stage;
use Illuminate\Http\Request;

class StageController extends Controller
{
    /**
     * Store a newly created stage in storage.
     */
    public function store(Request $request)
    {
        // Feature-gating: Plan Emprende / Starter no permite añadir etapas personalizadas
        $planSlug = $request->user()->company->subscription->plan->slug ?? 'starter';
        if (in_array($planSlug, ['starter', 'emprende'])) {
            return response()->json([
                'message' => 'El plan Emprende solo permite etapas fijas. Actualiza tu plan a Crece o Escala para personalizar.',
                'feature_locked' => true
            ], 403);
        }

        $validated = $request->validate([
            'pipeline_id' => 'required|exists:pipelines,id',
            'name' => 'required|string|max:255',
            'order' => 'integer',
        ]);

        if (!isset($validated['order'])) {
            $validated['order'] = Stage::where('pipeline_id', $validated['pipeline_id'])->max('order') + 1;
        }

        $stage = Stage::create($validated);

        return response()->json($stage, 201);
    }

    /**
     * Update the specified stage in storage.
     */
    public function update(Request $request, Stage $stage)
    {
        $planSlug = $request->user()->company->subscription->plan->slug ?? 'starter';
        if (in_array($planSlug, ['starter', 'emprende']) && $request->has('name') && $request->input('name') !== $stage->name) {
            return response()->json([
                'message' => 'El plan Emprende no permite editar el nombre de las etapas fijas. Actualiza tu plan.',
                'feature_locked' => true
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'order' => 'integer',
        ]);

        $stage->update($validated);

        return response()->json($stage);
    }

    /**
     * Remove the specified stage from storage.
     */
    public function destroy(Request $request, Stage $stage)
    {
        $planSlug = $request->user()->company->subscription->plan->slug ?? 'starter';
        if (in_array($planSlug, ['starter', 'emprende'])) {
            return response()->json([
                'message' => 'El plan Emprende no permite eliminar etapas fijas. Actualiza tu plan.',
                'feature_locked' => true
            ], 403);
        }

        $stage->delete();

        return response()->json(['message' => 'Stage deleted successfully'], 200);
    }
}
