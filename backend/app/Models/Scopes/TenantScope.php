<?php

namespace App\Models\Scopes;

use App\Tenant\TenantManager;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TenantScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $tenantManager = app(TenantManager::class);

        if ($tenantManager->isEnabled() && $tenantManager->hasTenant()) {
            $builder->where($model->getTable() . '.company_id', $tenantManager->getCompanyId());
        }
    }
}
