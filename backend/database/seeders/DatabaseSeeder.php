<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Plans
        $starter = \App\Models\Plan::updateOrCreate(
            ['slug' => 'starter'],
            [
                'name' => 'Starter',
                'price' => 19.00,
                'max_users' => 2,
                'max_channels' => 1,
                'max_messages' => 1000,
            ]
        );

        $emprende = \App\Models\Plan::updateOrCreate(
            ['slug' => 'emprende'],
            [
                'name' => 'Emprende',
                'price' => 29.00,
                'max_users' => 2,
                'max_channels' => 1,
                'max_messages' => 1000,
            ]
        );

        $crece = \App\Models\Plan::updateOrCreate(
            ['slug' => 'crece'],
            [
                'name' => 'Crece',
                'price' => 89.00,
                'max_users' => 10,
                'max_channels' => 5,
                'max_messages' => 10000,
            ]
        );

        $escala = \App\Models\Plan::updateOrCreate(
            ['slug' => 'escala'],
            [
                'name' => 'Escala',
                'price' => 199.00,
                'max_users' => 999,
                'max_channels' => 999,
                'max_messages' => 999999,
            ]
        );

        $pro = \App\Models\Plan::updateOrCreate(
            ['slug' => 'pro'],
            [
                'name' => 'Pro',
                'price' => 49.00,
                'max_users' => 10,
                'max_channels' => 3,
                'max_messages' => 10000,
            ]
        );

        $business = \App\Models\Plan::updateOrCreate(
            ['slug' => 'business'],
            [
                'name' => 'Business',
                'price' => 99.00,
                'max_users' => 999,
                'max_channels' => 999,
                'max_messages' => 999999,
            ]
        );

        // 2. Seed Default Company (Tenant)
        $company = \App\Models\Company::firstOrCreate(
            ['name' => 'Acme Corp'],
            [
                'industry' => 'Technology',
                'team_size' => '1-5',
                'channels' => ['whatsapp', 'telegram'],
                'main_goal' => 'Customer Service',
                'onboarded' => true,
            ]
        );

        // 3. Seed Default User
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'company_id' => $company->id,
                'name' => 'Admin User',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'role' => 'owner',
            ]
        );

        // 4. Seed Subscription
        \App\Models\Subscription::firstOrCreate(
            ['company_id' => $company->id],
            [
                'plan_id' => $pro->id,
                'status' => 'active',
            ]
        );

        // 5. Seed CRM Module Data
        $this->call(\Database\Seeders\CrmSeeder::class);
    }
}
