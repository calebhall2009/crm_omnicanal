<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->integer('sla_first_response_minutes')->default(60);
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->foreignId('assigned_to_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('conversation_id')->nullable()->constrained('conversations')->nullOnDelete();
            $table->timestamp('sla_expires_at')->nullable();
            $table->tinyInteger('csat_score')->nullable(); // 1 to 5
            $table->text('csat_comment')->nullable();
        });

        Schema::create('ticket_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('content');
            $table->boolean('is_internal')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_replies');
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['assigned_to_user_id']);
            $table->dropForeign(['conversation_id']);
            $table->dropColumn(['assigned_to_user_id', 'conversation_id', 'sla_expires_at', 'csat_score', 'csat_comment']);
        });
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn('sla_first_response_minutes');
        });
    }
};
