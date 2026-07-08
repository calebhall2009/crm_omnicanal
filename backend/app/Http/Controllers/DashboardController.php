<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Conversation;
use App\Models\Deal;
use App\Models\Message;
use App\Models\Pipeline;
use App\Models\Ticket;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get aggregated statistics and chart data for the CRM Dashboard.
     */
    public function stats(Request $request)
    {
        $company = $request->user()->company;
        $plan = $company?->subscription?->plan;

        // 1. Conversaciones abiertas
        $openConversations = Conversation::where('status', 'open')->count();
        $totalConversations = Conversation::count();

        // 2. Tickets por estado (desglose para PieChart)
        $ticketCounts = Ticket::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $ticketsByStatus = [
            ['name' => 'Abiertos', 'value' => $ticketCounts['open'] ?? 0, 'color' => '#3b82f6'],
            ['name' => 'Pendientes', 'value' => $ticketCounts['pending'] ?? 0, 'color' => '#f59e0b'],
            ['name' => 'Cerrados', 'value' => $ticketCounts['closed'] ?? 0, 'color' => '#10b981'],
        ];

        // 3. Valor de pipeline por etapa (para BarChart)
        $pipeline = Pipeline::with(['stages.deals'])->where('is_default', true)->first()
            ?? Pipeline::with(['stages.deals'])->first();

        $pipelineValueByStage = [];
        $totalPipelineValue = 0;

        if ($pipeline && $pipeline->stages) {
            foreach ($pipeline->stages as $stage) {
                $openDeals = $stage->deals->where('status', 'open');
                $stageValue = (float) $openDeals->sum('value');
                $totalPipelineValue += $stageValue;

                $pipelineValueByStage[] = [
                    'stage' => $stage->name,
                    'value' => $stageValue,
                    'count' => $openDeals->count(),
                ];
            }
        }

        // 4. Uso de IA del mes vs Cuota
        $aiMessagesCount = Message::where('sender_type', 'ai')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $maxMessages = $plan?->max_messages ?? 1000;
        $aiUsage = [
            'used' => $aiMessagesCount,
            'limit' => $maxMessages,
            'percentage' => round(($aiMessagesCount / max(1, $maxMessages)) * 100, 1),
        ];

        // 5. Resumen general
        $summary = [
            'total_clients' => Client::count(),
            'total_deals' => Deal::count(),
            'won_deals_value' => (float) Deal::where('status', 'won')->sum('value'),
            'open_pipeline_value' => $totalPipelineValue,
            'open_conversations' => $openConversations,
        ];

        return response()->json([
            'summary' => $summary,
            'tickets_by_status' => $ticketsByStatus,
            'pipeline_value_by_stage' => $pipelineValueByStage,
            'ai_usage' => $aiUsage,
            'active_pipeline' => $pipeline ? ['id' => $pipeline->id, 'name' => $pipeline->name] : null,
        ]);
    }
}
