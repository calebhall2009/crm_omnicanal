<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['company_id', 'plan_id', 'status', 'ends_at'])]
class Subscription extends Model
{
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'ends_at' => 'datetime',
        ];
    }

    /**
     * Get the company that owns the subscription.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the plan for the subscription.
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * Determine if the subscription is active, trialing, or within its grace period.
     */
    public function valid(): bool
    {
        return in_array($this->status, ['active', 'trialing']) || $this->onGracePeriod();
    }

    /**
     * Determine if the subscription is within its grace period after cancellation.
     */
    public function onGracePeriod(): bool
    {
        return $this->ends_at && $this->ends_at->isFuture();
    }

    /**
     * Determine if the subscription is past due.
     */
    public function pastDue(): bool
    {
        return $this->status === 'past_due';
    }
}
