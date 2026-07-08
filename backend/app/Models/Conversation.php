<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'company_id',
        'client_id',
        'channel',
        'channel_connection_id',
        'status',
        'unread_count',
        'last_client_message_at',
        'ai_suggested_reply',
        'ai_sentiment',
        'ai_intent',
        'needs_human_escalation',
    ];

    protected function casts(): array
    {
        return [
            'unread_count' => 'integer',
            'last_client_message_at' => 'datetime',
            'needs_human_escalation' => 'boolean',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function channelConnection(): BelongsTo
    {
        return $this->belongsTo(ChannelConnection::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }
}
