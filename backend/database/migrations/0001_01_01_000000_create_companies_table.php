<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->string('name')->nullable();
            $blueprint->string('industry')->nullable();
            $blueprint->string('team_size')->nullable();
            $blueprint->json('channels')->nullable();
            $blueprint->string('main_goal')->nullable();
            $blueprint->boolean('onboarded')->default(false);
            $blueprint->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
