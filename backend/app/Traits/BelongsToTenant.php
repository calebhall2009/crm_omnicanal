<?php

namespace App\Traits;

use App\Models\Scopes\TenantScope;
use App\Tenant\TenantManager;

trait BelongsToTenant
{
    /**
     * Boot the BelongsToTenant trait.
     */
    protected static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope());

        static::creating(function ($model) {
            $tenantManager = app(TenantManager::class);
            if ($tenantManager->hasTenant() && !$model->company_id) {
                $model->company_id = $tenantManager->getCompanyId();
            }
        });
    }

    /**
     * Get the company that this model belongs to.
     */
    public function company(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\Company::class);
    }
}
