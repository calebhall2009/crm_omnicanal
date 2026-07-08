<?php

namespace App\Http\Controllers;

use App\Channels\ChannelManager;
use App\Models\ChannelConnection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Handle incoming WhatsApp webhooks (GET verification & POST messages).
     */
    public function handleWhatsApp(Request $request, $companyId = null)
    {
        $adapter = ChannelManager::resolve('whatsapp');

        if ($request->isMethod('get')) {
            $connection = null;
            if ($companyId) {
                $connection = ChannelConnection::withoutGlobalScopes()
                    ->where('company_id', $companyId)
                    ->where('channel_type', 'whatsapp')
                    ->first();
            }
            return $adapter->verifyWebhook($request, $connection);
        }

        $entry = $request->input('entry.0');
        $phoneNumberId = $entry['changes'][0]['value']['metadata']['phone_number_id'] ?? null;

        $connection = null;
        if ($phoneNumberId) {
            $connection = ChannelConnection::withoutGlobalScopes()
                ->where('channel_type', 'whatsapp')
                ->where('account_id', $phoneNumberId)
                ->first();
        }

        if (!$connection && $companyId) {
            $connection = ChannelConnection::withoutGlobalScopes()
                ->where('company_id', $companyId)
                ->where('channel_type', 'whatsapp')
                ->first();
        }

        if (!$connection) {
            Log::warning("WhatsApp webhook ignored: No connection found for phone_number_id {$phoneNumberId} or company {$companyId}");
            return response()->json(['status' => 'ignored'], 200);
        }

        if (!$adapter->verifyWebhook($request, $connection)) {
            return response('Unauthorized signature', 401);
        }

        $message = $adapter->receive($request->all(), $connection);
        if ($message) {
            $this->dispatchAiWorker($message, $connection);
        }

        return response()->json(['status' => 'ok'], 200);
    }

    /**
     * Handle incoming Instagram webhooks (GET verification & POST messages).
     */
    public function handleInstagram(Request $request, $companyId = null)
    {
        $adapter = ChannelManager::resolve('instagram');

        if ($request->isMethod('get')) {
            $connection = null;
            if ($companyId) {
                $connection = ChannelConnection::withoutGlobalScopes()
                    ->where('company_id', $companyId)
                    ->where('channel_type', 'instagram')
                    ->first();
            }
            return $adapter->verifyWebhook($request, $connection);
        }

        $entry = $request->input('entry.0');
        $pageId = $entry['id'] ?? null;

        $connection = null;
        if ($pageId) {
            $connection = ChannelConnection::withoutGlobalScopes()
                ->where('channel_type', 'instagram')
                ->where('account_id', $pageId)
                ->first();
        }

        if (!$connection && $companyId) {
            $connection = ChannelConnection::withoutGlobalScopes()
                ->where('company_id', $companyId)
                ->where('channel_type', 'instagram')
                ->first();
        }

        if (!$connection) {
            Log::warning("Instagram webhook ignored: No connection found for page_id {$pageId} or company {$companyId}");
            return response()->json(['status' => 'ignored'], 200);
        }

        if (!$adapter->verifyWebhook($request, $connection)) {
            return response('Unauthorized signature', 401);
        }

        $message = $adapter->receive($request->all(), $connection);
        if ($message) {
            $this->dispatchAiWorker($message, $connection);
        }

        return response()->json(['status' => 'ok'], 200);
    }

    /**
     * Handle incoming Telegram webhooks (POST messages).
     */
    public function handleTelegram(Request $request, $connectionId)
    {
        $connection = ChannelConnection::withoutGlobalScopes()->find($connectionId);

        if (!$connection || $connection->channel_type !== 'telegram') {
            Log::warning("Telegram webhook ignored: Connection {$connectionId} not found");
            return response()->json(['status' => 'ignored'], 404);
        }

        $adapter = ChannelManager::resolve('telegram');

        if (!$adapter->verifyWebhook($request, $connection)) {
            return response('Unauthorized secret token', 401);
        }

        $message = $adapter->receive($request->all(), $connection);
        if ($message) {
            $this->dispatchAiWorker($message, $connection);
        }

        return response()->json(['status' => 'ok'], 200);
    }

    /**
     * Push incoming message to HTTP endpoint for Python AI Service processing.
     */
    protected function dispatchAiWorker(\App\Models\Message $message, ChannelConnection $connection): void
    {
        try {
            \Illuminate\Support\Facades\Http::post('http://127.0.0.1:8001/test-process', [
                'message_id' => $message->id,
                'company_id' => $message->company_id,
                'channel' => $message->conversation->channel,
                'conversation_id' => $message->conversation_id,
                'content' => $message->content,
                'auto_reply_enabled' => $connection->metadata['auto_reply'] ?? true,
            ]);
            Log::info("Dispatched message {$message->id} to AI service");
        } catch (\Throwable $e) {
            Log::error("Failed to push message {$message->id} to AI Redis queue: " . $e->getMessage());
        }
    }
}
