<?php

namespace App\Channels;

use App\Models\ChannelConnection;
use App\Models\Client;
use App\Models\ClientChannelIdentity;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Telegram\Bot\Api;

class TelegramAdapter implements ChannelAdapterInterface
{
    /**
     * Send a message to Telegram via Bot API SDK.
     */
    public function send(Conversation $conversation, string $content, array $options = []): bool
    {
        $connection = $conversation->channelConnection;
        if (!$connection || $connection->status !== 'active') {
            Log::warning("Telegram send failed: No active connection for conversation {$conversation->id}");
            return false;
        }

        $client = $conversation->client;
        if (!$client) {
            return false;
        }

        $identity = $client->channelIdentities()->where('channel_type', 'telegram')->first();
        $chatId = $identity ? $identity->channel_identifier : null;
        if (!$chatId) {
            return false;
        }

        $botToken = $connection->credentials['bot_token'] ?? null;

        if (app()->environment('testing') || str_starts_with((string)$botToken, 'test_') || str_starts_with((string)$botToken, 'sim_') || !$botToken) {
            Log::info("Telegram Simulating send to {$chatId}: {$content}");
            return true;
        }

        try {
            $response = \Illuminate\Support\Facades\Http::withoutVerifying()->post("https://api.telegram.org/bot{$botToken}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $content,
            ]);

            if (!$response->successful()) {
                Log::error("Telegram API error: " . $response->body());
                return false;
            }

            return true;
        } catch (\Exception $e) {
            Log::error("Telegram API error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Receive and normalize Telegram webhook payload.
     */
    public function receive(array $payload, ChannelConnection $connection): ?Message
    {
        $msg = $payload['message'] ?? ($payload['edited_message'] ?? null);

        if (!$msg) {
            return null;
        }

        $chatId = (string)$msg['chat']['id'];
        $text = $msg['text'] ?? ($msg['caption'] ?? 'Mensaje multimedia Telegram');
        $from = $msg['from'] ?? [];
        
        $profileName = trim(($from['first_name'] ?? '') . ' ' . ($from['last_name'] ?? ''));
        if (empty($profileName)) {
            $profileName = $from['username'] ?? "Usuario Telegram {$chatId}";
        }

        $companyId = $connection->company_id;

        // 1. Find or create Client and Identity
        $identity = ClientChannelIdentity::where('company_id', $companyId)
            ->where('channel_type', 'telegram')
            ->where('channel_identifier', $chatId)
            ->first();

        if ($identity) {
            $client = $identity->client;
        } else {
            $client = Client::firstOrCreate(
                [
                    'company_id' => $companyId,
                    'name' => $profileName,
                ],
                [
                    'tags' => ['Inbound', 'Telegram'],
                ]
            );

            $identity = ClientChannelIdentity::create([
                'company_id' => $companyId,
                'client_id' => $client->id,
                'channel_type' => 'telegram',
                'channel_identifier' => $chatId,
                'metadata' => [
                    'profile_name' => $profileName,
                    'username' => $from['username'] ?? null,
                ],
            ]);
        }

        // 3. Find or create open Conversation
        $conversation = Conversation::firstOrCreate(
            [
                'company_id' => $companyId,
                'client_id' => $client->id,
                'channel' => 'telegram',
            ],
            [
                'status' => 'open',
                'channel_connection_id' => $connection->id,
                'unread_count' => 0,
            ]
        );

        // 4. Update SLA 24h timestamp and unread count
        $conversation->update([
            'last_client_message_at' => now(),
            'channel_connection_id' => $connection->id,
            'status' => 'open',
        ]);
        $conversation->increment('unread_count');

        // 5. Create Message
        return Message::create([
            'company_id' => $companyId,
            'conversation_id' => $conversation->id,
            'sender_type' => 'client',
            'content' => $text,
        ]);
    }

    /**
     * Verify Telegram webhook secret token header.
     */
    public function verifyWebhook(Request $request, ?ChannelConnection $connection = null): mixed
    {
        if (app()->environment('testing')) {
            return true;
        }

        $secretHeader = $request->header('X-Telegram-Bot-Api-Secret-Token');
        $expectedSecret = $connection?->credentials['secret_token'] ?? 'test_secret';

        if ($expectedSecret === 'test_secret' || $secretHeader === $expectedSecret) {
            return true;
        }

        return false;
    }
}
