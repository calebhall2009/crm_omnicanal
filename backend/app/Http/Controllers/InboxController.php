<?php

namespace App\Http\Controllers;

use App\Channels\ChannelManager;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;

class InboxController extends Controller
{
    /**
     * Display a listing of conversations across all channels.
     */
    public function index(Request $request)
    {
        $query = Conversation::with(['client', 'channelConnection'])
            ->withCount('messages');

        if ($request->filled('channel') && $request->channel !== 'all') {
            $query->where('channel', $request->channel);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('client', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $conversations = $query->orderBy('updated_at', 'desc')->get();

        // Add 24h SLA indicator flag dynamically
        $conversations->each(function ($conv) {
            $conv->is_24h_window_closed = false;
            if (in_array($conv->channel, ['whatsapp', 'instagram'])) {
                if (!$conv->last_client_message_at || $conv->last_client_message_at->lte(now()->subHours(24))) {
                    $conv->is_24h_window_closed = true;
                }
            }
        });

        return response()->json($conversations);
    }

    /**
     * Display the message thread for a conversation and mark as read.
     */
    public function show($id)
    {
        $conversation = Conversation::with(['client', 'channelConnection'])->findOrFail($id);
        
        $conversation->update(['unread_count' => 0]);

        $messages = $conversation->messages()->orderBy('created_at', 'asc')->get();

        $isClosed = false;
        if (in_array($conversation->channel, ['whatsapp', 'instagram'])) {
            if (!$conversation->last_client_message_at || $conversation->last_client_message_at->lte(now()->subHours(24))) {
                $isClosed = true;
            }
        }
        $conversation->is_24h_window_closed = $isClosed;

        return response()->json([
            'conversation' => $conversation,
            'messages' => $messages,
        ]);
    }

    /**
     * Send a message from agent to client.
     * Enforces Meta 24-hour window SLA for WhatsApp and Instagram.
     */
    public function sendMessage(Request $request, $id)
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'is_template' => 'nullable|boolean',
        ]);

        $conversation = Conversation::with(['client', 'channelConnection'])->findOrFail($id);

        // Check Meta 24-hour window SLA
        if (in_array($conversation->channel, ['whatsapp', 'instagram'])) {
            $lastMsgAt = $conversation->last_client_message_at;
            if (!$lastMsgAt || $lastMsgAt->lte(now()->subHours(24))) {
                if (!$request->input('is_template', false)) {
                    return response()->json([
                        'message' => 'Ventana de 24 horas vencida. Las políticas de Meta exigen enviar una plantilla aprobada para reanudar la conversación.',
                        'error_code' => 'SLA_24H_EXPIRED',
                    ], 422);
                }
            }
        }

        // Send via adapter
        try {
            $adapter = ChannelManager::resolve($conversation->channel);
            $success = $adapter->send($conversation, $validated['content'], ['is_template' => $request->input('is_template', false)]);

            if (!$success) {
                return response()->json(['message' => 'Error al enviar el mensaje mediante el adaptador del canal.'], 500);
            }
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error de canal: ' . $e->getMessage()], 500);
        }

        // Create message record
        $msg = Message::create([
            'company_id' => $conversation->company_id,
            'conversation_id' => $conversation->id,
            'sender_type' => 'agent',
            'content' => $validated['content'],
        ]);

        $conversation->touch();

        return response()->json($msg, 201);
    }
}
