<?php

namespace App\Channels;

use App\Models\ChannelConnection;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;

interface ChannelAdapterInterface
{
    /**
     * Send a message to the channel.
     */
    public function send(Conversation $conversation, string $content, array $options = []): bool;

    /**
     * Receive and normalize an incoming webhook payload into a Message.
     */
    public function receive(array $payload, ChannelConnection $connection): ?Message;

    /**
     * Verify webhook signature/handshake from the platform.
     */
    public function verifyWebhook(Request $request, ?ChannelConnection $connection = null): mixed;
}
