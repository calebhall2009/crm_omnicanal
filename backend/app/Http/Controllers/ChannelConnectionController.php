<?php

namespace App\Http\Controllers;

use App\Models\ChannelConnection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Telegram\Bot\Api as TelegramApi;

class ChannelConnectionController extends Controller
{
    /**
     * Display a listing of the connected channels for the tenant.
     */
    public function index(Request $request)
    {
        return response()->json(ChannelConnection::all());
    }

    /**
     * Store a newly created channel connection in storage.
     * Enforces Feature-Gating: Starter/Emprende plan allows max 1 channel.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'channel_type' => 'required|in:whatsapp,instagram,telegram',
            'account_id' => 'nullable|string',
            'credentials' => 'nullable|array',
            'metadata' => 'nullable|array',
        ]);

        $user = $request->user();
        $company = $user->company;
        $subscription = $company?->subscription;
        $planSlug = $subscription?->plan?->slug ?? 'starter';

        // Feature Gating: Check limit for starter/emprende
        if (in_array(strtolower($planSlug), ['starter', 'emprende'])) {
            $activeCount = ChannelConnection::where('status', 'active')->count();
            if ($activeCount >= 1) {
                return response()->json([
                    'message' => 'El plan Emprende solo permite conectar 1 canal simultáneamente. Actualice su plan para conectar canales adicionales.',
                    'error_code' => 'FEATURE_LIMIT_EXCEEDED',
                ], 403);
            }
        }

        $connection = ChannelConnection::create([
            'company_id' => $company->id,
            'channel_type' => $validated['channel_type'],
            'account_id' => $validated['account_id'] ?? null,
            'credentials' => $validated['credentials'] ?? [],
            'metadata' => $validated['metadata'] ?? [],
            'status' => 'active',
        ]);

        // Automatic Webhook setup for Telegram
        if ($connection->channel_type === 'telegram') {
            $botToken = $connection->credentials['bot_token'] ?? null;
            $secretToken = 'omniflow_tg_' . md5($connection->id);
            
            $credentials = $connection->credentials ?? [];
            $credentials['secret_token'] = $secretToken;
            $connection->update(['credentials' => $credentials]);

            if (!app()->environment('testing') && $botToken && !str_starts_with((string)$botToken, 'test_') && !str_starts_with((string)$botToken, 'sim_')) {
                try {
                    $webhookUrl = url("/api/webhooks/telegram/{$connection->id}");
                    $telegram = new TelegramApi($botToken);
                    $telegram->setWebhook([
                        'url' => $webhookUrl,
                        'secret_token' => $secretToken,
                    ]);
                    Log::info("Telegram webhook configured automatically for connection {$connection->id}");
                } catch (\Exception $e) {
                    Log::error("Failed to set Telegram webhook: " . $e->getMessage());
                }
            }
        }

        return response()->json($connection, 201);
    }

    /**
     * Remove the specified channel connection from storage.
     */
    public function destroy(Request $request, $id)
    {
        $connection = ChannelConnection::findOrFail($id);

        if ($connection->channel_type === 'telegram') {
            $botToken = $connection->credentials['bot_token'] ?? null;
            if (!app()->environment('testing') && $botToken && !str_starts_with((string)$botToken, 'test_') && !str_starts_with((string)$botToken, 'sim_')) {
                try {
                    $telegram = new TelegramApi($botToken);
                    $telegram->removeWebhook();
                } catch (\Exception $e) {
                    Log::error("Failed to remove Telegram webhook: " . $e->getMessage());
                }
            }
        }

        $connection->delete();

        return response()->json(['message' => 'Canal desconectado exitosamente.']);
    }
}
