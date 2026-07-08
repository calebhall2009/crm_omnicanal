<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChannelConnection extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'company_id',
        'channel_type',
        'account_id',
        'credentials',
        'status',
        'metadata',
    ];

    protected $casts = [
        'credentials' => 'array',
        'metadata' => 'array',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'channel_connection_id');
    }
}
