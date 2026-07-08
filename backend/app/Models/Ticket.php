<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'company_id',
        'client_id',
        'assigned_to_user_id',
        'conversation_id',
        'title',
        'status',
        'priority',
        'sla_expires_at',
        'csat_score',
        'csat_comment',
    ];

    protected $casts = [
        'sla_expires_at' => 'datetime',
        'csat_score' => 'integer',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function assignedAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function replies(): HasMany
    {
        return $this->hasMany(TicketReply::class)->latest();
    }
}
