<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Http;

class Turnstile implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $secretKey = env('TURNSTILE_SECRET_KEY');

        // Bypassing verification in testing environment or if the secret key is empty/not set
        if (app()->environment('testing') || empty($secretKey)) {
            return;
        }

        // Cloudflare dummy keys always pass
        if ($value === '1x000000000000000000000000000000AA') {
            return;
        }

        $response = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
            'secret' => $secretKey,
            'response' => $value,
            'remoteip' => request()->ip(),
        ]);

        if (!$response->successful() || !$response->json('success')) {
            $fail('The Turnstile verification failed. Please try again.');
        }
    }
}
