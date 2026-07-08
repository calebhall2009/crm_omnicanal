<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    /**
     * Display a listing of clients with search and tag filters.
     */
    public function index(Request $request)
    {
        $query = Client::withCount(['deals', 'tickets'])->latest();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('email', 'like', '%' . $search . '%')
                  ->orWhere('phone', 'like', '%' . $search . '%');
            });
        }

        if ($tag = $request->input('tag')) {
            $query->whereJsonContains('tags', $tag);
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created client in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'tags' => 'nullable|array',
            'custom_fields' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        $client = Client::create($validated);

        return response()->json($client, 201);
    }

    /**
     * Display the specified client with relationships.
     */
    public function show(Client $client)
    {
        $client->load(['deals.stage', 'deals.pipeline', 'tickets', 'conversations']);

        return response()->json($client);
    }

    /**
     * Update the specified client in storage.
     */
    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'tags' => 'nullable|array',
            'custom_fields' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        $client->update($validated);

        return response()->json($client);
    }

    /**
     * Remove the specified client from storage.
     */
    public function destroy(Client $client)
    {
        $client->delete();

        return response()->json(['message' => 'Client deleted successfully'], 200);
    }
}
