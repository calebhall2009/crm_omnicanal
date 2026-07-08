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
        Schema::create('channel_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('channel_type'); // whatsapp, instagram, telegram
            $table->string('account_id')->nullable(); // phone_number_id, page_id, bot_username
            $table->json('credentials')->nullable(); // access_token, bot_token, verify_token, secret_token
            $table->string('status')->default('active'); // active, disconnected, error
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('client_channel_identities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->string('channel_type'); // whatsapp, instagram, telegram
            $table->string('channel_identifier'); // phone number or sender_id/user_id
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'channel_type', 'channel_identifier'], 'unique_tenant_channel_ident');
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->foreignId('channel_connection_id')->nullable()->constrained('channel_connections')->nullOnDelete();
            $table->timestamp('last_client_message_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropForeign(['channel_connection_id']);
            $table->dropColumn(['channel_connection_id', 'last_client_message_at']);
        });

        Schema::dropIfExists('client_channel_identities');
        Schema::dropIfExists('channel_connections');
    }
};
