<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscription
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->company) {
            return $next($request);
        }

        // Permitir acceso a rutas de billing y login
        if ($request->is('api/billing/*') || $request->is('api/auth/*') || $request->is('api/user')) {
            return $next($request);
        }

        $company = $user->company;
        $subscription = $company->subscription;
        
        // 1. ¿Suscripción activa o en gracia?
        if ($subscription && $subscription->valid() && !$subscription->pastDue()) {
            return $next($request);
        }

        // 2. ¿En periodo de prueba? (14 días desde creación)
        $daysSinceCreation = $company->created_at ? (int) $company->created_at->diffInDays(now()) : 0;
        if ($daysSinceCreation <= 14) {
            return $next($request);
        }

        return response()->json([
            'error' => 'Suscripción inactiva o periodo de prueba terminado.',
            'code' => 'SUBSCRIPTION_REQUIRED',
            'redirect' => '/billing'
        ], 403);
    }
}
