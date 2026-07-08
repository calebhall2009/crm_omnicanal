<?php

namespace App\Http\Controllers;

use App\Models\Deal;
use Illuminate\Http\Request;

class DealController extends Controller
{
    /**
     * Display a listing of deals.
     */
    public function index(Request $request)
    {
        $query = Deal::with(['client', 'stage', 'pipeline'])->latest();

        if ($pipelineId = $request->input('pipeline_id')) {
            $query->where('pipeline_id', $pipelineId);
        }

        if ($clientId = $request->input('client_id')) {
            $query->where('client_id', $clientId);
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created deal in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'pipeline_id' => 'required|exists:pipelines,id',
            'stage_id' => 'required|exists:stages,id',
            'client_id' => 'nullable|exists:clients,id',
            'title' => 'required|string|max:255',
            'value' => 'numeric|min:0',
            'status' => 'string|in:open,won,lost',
        ]);

        $deal = Deal::create($validated);

        return response()->json($deal->load(['client', 'stage', 'pipeline']), 201);
    }

    /**
     * Display the specified deal.
     */
    public function show(Deal $deal)
    {
        return response()->json($deal->load(['client', 'stage', 'pipeline']));
    }

    /**
     * Update the specified deal in storage (used for edits and Kanban drag-and-drop).
     */
    public function update(Request $request, Deal $deal)
    {
        $validated = $request->validate([
            'pipeline_id' => 'sometimes|required|exists:pipelines,id',
            'stage_id' => 'sometimes|required|exists:stages,id',
            'client_id' => 'nullable|exists:clients,id',
            'title' => 'sometimes|required|string|max:255',
            'value' => 'numeric|min:0',
            'status' => 'string|in:open,won,lost',
        ]);

        $deal->update($validated);

        return response()->json($deal->load(['client', 'stage', 'pipeline']));
    }

    /**
     * Specialized endpoint for updating stage via Kanban drag and drop.
     */
    public function updateStage(Request $request, Deal $deal)
    {
        $validated = $request->validate([
            'stage_id' => 'required|exists:stages,id',
        ]);

        $deal->update(['stage_id' => $validated['stage_id']]);

        return response()->json($deal->load(['client', 'stage', 'pipeline']));
    }

    /**
     * Remove the specified deal from storage.
     */
    public function destroy(Deal $deal)
    {
        $deal->delete();

        return response()->json(['message' => 'Deal deleted successfully'], 200);
    }
}
