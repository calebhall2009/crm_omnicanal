<?php

use App\Http\Controllers\AiKnowledgeController;
use App\Http\Controllers\InternalAiController;
use App\Http\Controllers\ChannelConnectionController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DealController;
use App\Http\Controllers\InboxController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\PipelineController;
use App\Http\Controllers\StageController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\BillingController;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public Endpoint for Landing Page Pricing
Route::get('/plans', function () {
    return response()->json(Plan::orderBy('price', 'asc')->get());
});

// Public Webhooks for Omnichannel Integrations
Route::match(['get', 'post'], '/webhooks/whatsapp/{companyId?}', [WebhookController::class, 'handleWhatsApp']);
Route::match(['get', 'post'], '/webhooks/instagram/{companyId?}', [WebhookController::class, 'handleInstagram']);
Route::post('/webhooks/telegram/{connectionId}', [WebhookController::class, 'handleTelegram']);

// Internal AI Service Endpoints (Protected by X-Internal-Secret header)
Route::get('/internal/ai/context/{companyId}', [InternalAiController::class, 'getContext']);
Route::post('/internal/ai/callback', [InternalAiController::class, 'handleCallback']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user()->load('company');
    });

    Route::post('/onboarding', [OnboardingController::class, 'complete']);

    // CRM Dashboard Stats
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // CRM Clients
    Route::apiResource('clients', ClientController::class);

    // CRM Pipelines & Stages
    Route::apiResource('pipelines', PipelineController::class);
    Route::apiResource('stages', StageController::class)->only(['store', 'update', 'destroy']);

    // CRM Deals & Kanban Stage Update
    Route::apiResource('deals', DealController::class);
    Route::patch('/deals/{deal}/stage', [DealController::class, 'updateStage']);

    // Omnichannel Connections & Inbox
    Route::apiResource('channels', ChannelConnectionController::class)->only(['index', 'store', 'destroy']);
    Route::get('/inbox/conversations', [InboxController::class, 'index']);
    Route::get('/inbox/conversations/{id}', [InboxController::class, 'show']);
    Route::post('/inbox/conversations/{id}/messages', [InboxController::class, 'sendMessage']);

    // Ticketing System (CRUD & Replies)
    Route::apiResource('tickets', TicketController::class);
    Route::post('/tickets/{ticket}/reply', [TicketController::class, 'reply']);

    // AI Assistant & Knowledge Base
    Route::get('/ai/knowledge', [AiKnowledgeController::class, 'index']);
    Route::post('/ai/knowledge', [AiKnowledgeController::class, 'store']);
    Route::put('/ai/knowledge/{id}', [AiKnowledgeController::class, 'update']);
    Route::delete('/ai/knowledge/{id}', [AiKnowledgeController::class, 'destroy']);
    Route::post('/ai/knowledge/{companyId}/upload', [\App\Http\Controllers\KnowledgeDocumentController::class, 'upload']);

    // Billing (Lemon Squeezy)
    Route::get('/billing/info', [BillingController::class, 'info']);
    Route::post('/billing/checkout', [BillingController::class, 'checkout']);
    Route::patch('/ai/channels/{connectionId}/auto-reply', [AiKnowledgeController::class, 'toggleAutoReply']);
});
