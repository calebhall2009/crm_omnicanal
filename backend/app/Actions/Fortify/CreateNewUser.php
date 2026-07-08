<?php

namespace App\Actions\Fortify;

use App\Models\Company;
use App\Models\User;
use App\Rules\Turnstile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     *
     * @throws ValidationException
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
            ],
            'password' => $this->passwordRules(),
            'turnstile_token' => ['required', 'string', new Turnstile],
            'company_name' => ['nullable', 'string', 'max:255'],
            'industry' => ['nullable', 'string', 'max:255'],
            'team_size' => ['nullable', 'string', 'max:255'],
            'plan_slug' => ['nullable', 'string'],
            'plan_id' => ['nullable', 'integer'],
        ])->validate();

        return DB::transaction(function () use ($input) {
            $hasCompanyData = !empty($input['company_name']);
            $plan = null;
            if (!empty($input['plan_slug'])) {
                $plan = \App\Models\Plan::where('slug', $input['plan_slug'])->first();
            } elseif (!empty($input['plan_id'])) {
                $plan = \App\Models\Plan::find($input['plan_id']);
            }
            if (!$plan) {
                $plan = \App\Models\Plan::where('slug', 'pro')->first() ?? \App\Models\Plan::first();
            }

            // Create company (onboarded = true if wizard provided company data)
            $company = Company::create([
                'name' => $input['company_name'] ?? null,
                'industry' => $input['industry'] ?? null,
                'team_size' => $input['team_size'] ?? null,
                'plan_id' => $plan ? $plan->id : null,
                'onboarded' => $hasCompanyData,
            ]);

            if ($plan) {
                \App\Models\Subscription::create([
                    'company_id' => $company->id,
                    'plan_id' => $plan->id,
                    'status' => 'active',
                ]);
            }

            // Create the owner user
            return User::create([
                'company_id' => $company->id,
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => Hash::make($input['password']),
                'role' => 'owner',
            ]);
        });
    }
}
