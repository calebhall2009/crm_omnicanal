<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'company_id',
        'name',
        'phone',
        'email',
        'tags',
        'custom_fields',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'custom_fields' => 'array',
        ];
    }

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    public function channelIdentities(): HasMany
    {
        return $this->hasMany(ClientChannelIdentity::class);
    }
}
