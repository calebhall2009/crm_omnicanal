<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'slug', 'price', 'max_users', 'max_channels', 'max_messages'])]
class Plan extends Model
{
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'max_users' => 'integer',
            'max_channels' => 'integer',
            'max_messages' => 'integer',
        ];
    }

    /**
     * Get subscriptions associated with this plan.
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
