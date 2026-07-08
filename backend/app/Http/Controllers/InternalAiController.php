<?php

namespace App\Http\Controllers;

use App\Channels\ChannelManager;
use App\Models\AiKnowledgeItem;
use App\Models\AiUsageLog;
use App\Models\Company;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InternalAiController extends Controller
{
    /**
     * Verificar secreto interno entre Laravel y el microservicio Python.
     */
    protected function verifySecret(Request $request): bool
    {
        $secret = $request->header('X-Internal-Secret');
        $expected = config('services.ai.internal_secret', 'omniflow_internal_secret_2026');
        
        if (app()->environment('testing')) {
            return true;
        }

        if (empty($secret) || empty($expected)) {
            return false;
        }

        return hash_equals((string) $expected, (string) $secret);
    }

    /**
     * Obtener el contexto de IA para un tenant (FAQs, cuota, configuración).
     */
    public function getContext(Request $request, $companyId)
    {
        if (!$this->verifySecret($request)) {
            return response()->json(['error' => 'Unauthorized internal call'], 401);
        }

        $company = Company::withoutGlobalScopes()->find($companyId);
        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        $subscription = $company->subscription;
        $plan = $subscription ? $subscription->plan : \App\Models\Plan::where('slug', 'starter')->first();
        $maxMessages = $plan ? $plan->max_messages : 1000;

        $quotaExceeded = AiUsageLog::isMonthlyQuotaExceeded($companyId, $maxMessages);

        $faqs = AiKnowledgeItem::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->where('is_active', true)
            ->get(['question', 'answer', 'category']);

        return response()->json([
            'company_id' => $companyId,
            'company_name' => $company->name,
            'industry' => $company->industry,
            'main_goal' => $company->main_goal,
            'plan_name' => $plan ? $plan->name : 'Starter',
            'max_messages' => $maxMessages,
            'quota_exceeded' => $quotaExceeded,
            'faqs' => $faqs,
        ]);
    }

    /**
     * Recibir el callback del microservicio Python con el resultado procesado por IA.
     */
    public function handleCallback(Request $request)
    {
        if (!$this->verifySecret($request)) {
            return response()->json(['error' => 'Unauthorized internal call'], 401);
        }

        $validated = $request->validate([
            'company_id' => 'required|integer',
            'conversation_id' => 'required|integer',
            'message_id' => 'required|integer',
            'action_taken' => 'required|string', // auto_reply, suggest, escalate_to_human, blocked_quota
            'reply_text' => 'nullable|string',
            'intent' => 'nullable|string',
            'sentiment' => 'nullable|string',
            'confidence' => 'nullable|numeric',
            'usage_log' => 'required|array',
            'usage_log.provider' => 'required|string',
            'usage_log.model' => 'required|string',
            'usage_log.tokens_used' => 'required|integer',
            'usage_log.requests_count' => 'required|integer',
            'usage_log.estimated_cost' => 'required|numeric',
        ]);

        $companyId = $validated['company_id'];
        $conversationId = $validated['conversation_id'];
        $actionTaken = $validated['action_taken'];
        $replyText = $validated['reply_text'];

        // 1. Registrar consumo en ai_usage_logs
        AiUsageLog::withoutGlobalScopes()->create([
            'company_id' => $companyId,
            'provider' => $validated['usage_log']['provider'],
            'model' => $validated['usage_log']['model'],
            'tokens_used' => $validated['usage_log']['tokens_used'],
            'requests_count' => $validated['usage_log']['requests_count'],
            'estimated_cost' => $validated['usage_log']['estimated_cost'],
            'action' => $actionTaken,
        ]);

        // 2. Actualizar metadatos en la Conversación
        $conversation = Conversation::withoutGlobalScopes()->find($conversationId);
        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }

        $conversation->update([
            'ai_sentiment' => $validated['sentiment'] ?? null,
            'ai_intent' => $validated['intent'] ?? null,
            'needs_human_escalation' => ($actionTaken === 'escalate_to_human'),
        ]);

        // 3. Ejecutar acción de respuesta o sugerencia
        if ($actionTaken === 'auto_reply' && !empty($replyText)) {
            // Crear mensaje generado por IA en el historial
            Message::withoutGlobalScopes()->create([
                'company_id' => $companyId,
                'conversation_id' => $conversationId,
                'sender_type' => 'ai',
                'content' => $replyText,
                'es_generado_por_ia' => true,
            ]);

            // Enviar respuesta por el canal correspondiente
            $adapter = ChannelManager::resolve($conversation->channel);
            $adapter->send($conversation, $replyText);

            // Limpiar sugerencia si había una previa
            $conversation->update(['ai_suggested_reply' => null]);
            
            Log::info("AI Auto-replied to conversation {$conversationId}");
        } elseif (in_array($actionTaken, ['suggest', 'escalate_to_human', 'blocked_quota']) && !empty($replyText)) {
            // Solo guardar como sugerencia en el inbox para el agente humano
            $conversation->update(['ai_suggested_reply' => $replyText]);
            Log::info("AI stored suggestion for conversation {$conversationId} (Action: {$actionTaken})");
        }

        return response()->json(['status' => 'success'], 200);
    }
}
