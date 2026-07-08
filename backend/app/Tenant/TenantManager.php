<?php

namespace App\Tenant;

class TenantManager
{
    protected ?int $companyId = null;
    protected bool $enabled = true;

    /**
     * Set the current tenant company ID.
     */
    public function setCompanyId(?int $companyId): void
    {
        $this->companyId = $companyId;
    }

    /**
     * Get the current tenant company ID.
     */
    public function getCompanyId(): ?int
    {
        return $this->companyId;
    }

    /**
     * Check if a tenant is currently set.
     */
    public function hasTenant(): bool
    {
        return !is_null($this->companyId);
    }

    /**
     * Disable the tenant scope check.
     */
    public function disable(): void
    {
        $this->enabled = false;
    }

    /**
     * Enable the tenant scope check.
     */
    public function enable(): void
    {
        $this->enabled = true;
    }

    /**
     * Check if the tenant scope check is enabled.
     */
    public function isEnabled(): bool
    {
        return $this->enabled;
    }
}
