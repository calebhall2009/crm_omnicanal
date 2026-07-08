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
        Schema::create('ai_knowledge_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('question');
            $table->text('answer');
            $table->string('category')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('ai_usage_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('provider')->default('gemini');
            $table->string('model')->default('gemini-1.5-flash');
            $table->unsignedInteger('tokens_used')->default(0);
            $table->unsignedInteger('requests_count')->default(1);
            $table->decimal('estimated_cost', 10, 6)->default(0);
            $table->string('action')->default('auto_reply'); // auto_reply, suggest, qualify_lead, faq
            $table->timestamps();
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->boolean('es_generado_por_ia')->default(false);
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->text('ai_suggested_reply')->nullable();
            $table->string('ai_sentiment')->nullable(); // positive, neutral, negative
            $table->string('ai_intent')->nullable(); // pricing, support, complaint, general
            $table->boolean('needs_human_escalation')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropColumn([
                'ai_suggested_reply',
                'ai_sentiment',
                'ai_intent',
                'needs_human_escalation',
            ]);
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn('es_generado_por_ia');
        });

        Schema::dropIfExists('ai_usage_logs');
        Schema::dropIfExists('ai_knowledge_items');
    }
};
