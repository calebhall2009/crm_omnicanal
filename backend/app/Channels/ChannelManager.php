<?php

namespace App\Channels;

use InvalidArgumentException;

class ChannelManager
{
    /**
     * Resolve the adapter for a given channel type.
     */
    public static function resolve(string $channelType): ChannelAdapterInterface
    {
        return match (strtolower(trim($channelType))) {
            'whatsapp' => new WhatsAppAdapter(),
            'instagram' => new InstagramAdapter(),
            'telegram' => new TelegramAdapter(),
            default => throw new InvalidArgumentException("Unsupported channel type: {$channelType}"),
        };
    }
}
