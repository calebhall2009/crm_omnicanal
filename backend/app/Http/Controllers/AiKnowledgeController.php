<?php

namespace App\Http\Controllers;

use App\Models\AiKnowledgeItem;
use App\Models\AiUsageLog;
use App\Models\ChannelConnection;
use Illuminate\Http\Request;

class AiKnowledgeController extends Controller
{
    /**
     * Listar base de conocimiento (FAQs) y estadísticas de uso de IA del tenant.
     */
    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;

        $faqs = AiKnowledgeItem::where('company_id', $companyId)->latest()->get();

        $company = $request->user()->company;
        $subscription = $company->subscription;
        $plan = $subscription ? $subscription->plan : \App\Models\Plan::where('slug', 'starter')->first();
        $maxMessages = $plan ? $plan->max_messages : 1000;

        $currentMonthRequests = AiUsageLog::where('company_id', $companyId)
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->sum('requests_count');

        $currentMonthTokens = AiUsageLog::where('company_id', $companyId)
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->sum('tokens_used');

        $currentMonthCost = AiUsageLog::where('company_id', $companyId)
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->sum('estimated_cost');

        $connections = ChannelConnection::where('company_id', $companyId)->get();
        $autoReplySettings = $connections->map(function ($conn) {
            return [
                'connection_id' => $conn->id,
                'channel_type' => $conn->channel_type,
                'account_id' => $conn->account_id,
                'auto_reply' => $conn->metadata['auto_reply'] ?? true,
            ];
        });

        return response()->json([
            'faqs' => $faqs,
            'stats' => [
                'requests_used' => (int)$currentMonthRequests,
                'requests_max' => (int)$maxMessages,
                'tokens_used' => (int)$currentMonthTokens,
                'estimated_cost' => (float)$currentMonthCost,
                'quota_exceeded' => $currentMonthRequests >= $maxMessages,
            ],
            'auto_reply_settings' => $autoReplySettings,
        ]);
    }

    /**
     * Crear una nueva pregunta frecuente (FAQ) en la base de conocimiento.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'question' => 'required|string|max:255',
            'answer' => 'required|string',
            'category' => 'nullable|string|max:100',
            'is_active' => 'boolean',
        ]);

        $faq = AiKnowledgeItem::create([
            'company_id' => $request->user()->company_id,
            'question' => $validated['question'],
            'answer' => $validated['answer'],
            'category' => $validated['category'] ?? 'General',
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json($faq, 201);
    }

    /**
     * Actualizar una pregunta frecuente.
     */
    public function update(Request $request, $id)
    {
        $faq = AiKnowledgeItem::findOrFail($id);

        $validated = $request->validate([
            'question' => 'string|max:255',
            'answer' => 'string',
            'category' => 'nullable|string|max:100',
            'is_active' => 'boolean',
        ]);

        $faq->update($validated);

        return response()->json($faq);
    }

    /**
     * Eliminar una pregunta frecuente.
     */
    public function destroy($id)
    {
        $faq = AiKnowledgeItem::findOrFail($id);
        $faq->delete();

        return response()->json(['message' => 'FAQ deleted successfully']);
    }

    /**
     * Alternar el modo de respuesta automática por canal.
     */
    public function toggleAutoReply(Request $request, $connectionId)
    {
        $validated = $request->validate([
            'auto_reply' => 'required|boolean',
        ]);

        $connection = ChannelConnection::findOrFail($connectionId);
        $metadata = $connection->metadata ?? [];
        $metadata['auto_reply'] = $validated['auto_reply'];

        $connection->update(['metadata' => $metadata]);

        return response()->json([
            'connection_id' => $connection->id,
            'auto_reply' => $metadata['auto_reply'],
        ]);
    }
}
