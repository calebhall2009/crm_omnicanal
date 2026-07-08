<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'company_id',
        'conversation_id',
        'sender_type',
        'content',
        'es_generado_por_ia',
    ];
    
    protected $dispatchesEvents = [
        'created' => \App\Events\MessageCreated::class,
    ];

    protected function casts(): array
    {
        return [
            'es_generado_por_ia' => 'boolean',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }
}
