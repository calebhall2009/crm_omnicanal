<?php

namespace App\Http\Middleware;

use App\Tenant\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tenantManager = app(TenantManager::class);

        if (auth()->check()) {
            $user = auth()->user();
            $tenantManager->setCompanyId($user->company_id);
        }

        return $next($request);
    }
}
