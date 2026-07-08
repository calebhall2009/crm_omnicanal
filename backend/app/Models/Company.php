<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use LemonSqueezy\Laravel\Billable;

#[Fillable(['name', 'industry', 'team_size', 'channels', 'main_goal', 'onboarded', 'plan_id'])]
class Company extends Model
{
    use HasFactory, Billable;

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'channels' => 'array',
            'onboarded' => 'boolean',
        ];
    }

    /**
     * Get the users for the company.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the current subscription for the company.
     */
    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class)->latestOfMany();
    }
}
