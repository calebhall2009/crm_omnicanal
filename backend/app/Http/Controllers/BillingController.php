<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    public function info(Request $request)
    {
        $company = $request->user()->company;
        
        $subscription = $company->subscription;
        $plan = Plan::find($company->plan_id) ?? Plan::where('slug', 'starter')->first();

        $status = 'free_trial';
        $trialDaysLeft = 0;
        
        if ($subscription && $subscription->valid()) {
            $status = $subscription->onGracePeriod() ? 'cancelled' : 'active';
            if ($subscription->pastDue()) {
                $status = 'past_due';
            }
        } else {
            // Trial logic: 14 days from creation
            $daysSinceCreation = $company->created_at ? (int) $company->created_at->diffInDays(now()) : 0;
            if ($daysSinceCreation <= 14) {
                $trialDaysLeft = 14 - $daysSinceCreation;
            } else {
                $status = 'expired';
            }
        }
        
        $portalUrl = null;
        if (isset($company->customer) && $company->customer->lemon_squeezy_id) {
            try {
                $portalUrl = $company->customerPortalUrl();
            } catch (\Exception $e) {
                // Ignore if not setup properly in local
            }
        }

        return response()->json([
            'status' => $status,
            'trial_days_left' => $trialDaysLeft,
            'plan' => $plan,
            'portal_url' => $portalUrl,
            'next_billing_date' => $subscription?->ends_at ?? $subscription?->renews_at,
        ]);
    }
    
    public function checkout(Request $request)
    {
        $request->validate([
            'plan_slug' => 'required|string|exists:plans,slug',
        ]);
        
        $company = $request->user()->company;
        
        // Dummy mapping for Lemon Squeezy variant IDs
        $variants = [
            'starter' => env('LS_VARIANT_STARTER', 'variant_123'),
            'emprende' => env('LS_VARIANT_EMPRENDE', 'variant_456'),
            'crece' => env('LS_VARIANT_CRECE', 'variant_789'),
        ];
        
        $variantId = $variants[$request->plan_slug] ?? null;
        
        if (!$variantId) {
            return response()->json(['error' => 'Plan no disponible para cobro'], 400);
        }

        try {
            $checkout = $company->checkout($variantId)
                ->withCustomData([
                    'company_id' => (string) $company->id,
                ]);
            return response()->json(['url' => $checkout->url()]);
        } catch (\Exception $e) {
            // For testing in local without API keys, return a dummy URL
            return response()->json(['url' => 'https://sandbox.lemonsqueezy.com/checkout?dummy=true']);
        }
    }
}
