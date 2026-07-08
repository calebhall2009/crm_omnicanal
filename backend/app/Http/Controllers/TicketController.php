<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Ticket;
use App\Models\TicketReply;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $query = Ticket::with(['client', 'assignedAgent', 'replies.user']);

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        if ($request->filled('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }
        if ($request->filled('assigned_to_user_id') && $request->assigned_to_user_id !== 'all') {
            $query->where('assigned_to_user_id', $request->assigned_to_user_id);
        }
        if ($request->filled('sla_status') && $request->sla_status !== 'all') {
            $now = now();
            if ($request->sla_status === 'expired') {
                $query->where('sla_expires_at', '<', $now)->where('status', '!=', 'closed');
            } elseif ($request->sla_status === 'warning') {
                $query->whereBetween('sla_expires_at', [$now, (clone $now)->addMinutes(30)])->where('status', '!=', 'closed');
            } elseif ($request->sla_status === 'ok') {
                $query->where('sla_expires_at', '>', (clone $now)->addMinutes(30))->where('status', '!=', 'closed');
            }
        }

        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'client_id' => 'nullable|exists:clients,id',
            'assigned_to_user_id' => 'nullable|exists:users,id',
            'conversation_id' => 'nullable|exists:conversations,id',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
            'status' => 'nullable|string|in:open,in_progress,waiting,resolved,closed',
        ]);

        $company = $request->user()->company;
        $slaMinutes = $company->plan->sla_first_response_minutes ?? 60;

        $ticket = Ticket::create([
            'company_id' => $company->id,
            'client_id' => $validated['client_id'] ?? null,
            'assigned_to_user_id' => $validated['assigned_to_user_id'] ?? $request->user()->id,
            'conversation_id' => $validated['conversation_id'] ?? null,
            'title' => $validated['title'],
            'priority' => $validated['priority'] ?? 'medium',
            'status' => $validated['status'] ?? 'open',
            'sla_expires_at' => now()->addMinutes($slaMinutes),
        ]);

        return response()->json($ticket->load(['client', 'assignedAgent', 'replies.user']), 201);
    }

    public function show(Ticket $ticket)
    {
        return response()->json($ticket->load(['client', 'assignedAgent', 'conversation', 'replies.user']));
    }

    public function update(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'status' => 'sometimes|required|string|in:open,in_progress,waiting,resolved,closed',
            'priority' => 'sometimes|required|string|in:low,medium,high,urgent',
            'assigned_to_user_id' => 'nullable|exists:users,id',
            'csat_score' => 'nullable|integer|min:1|max:5',
            'csat_comment' => 'nullable|string',
        ]);

        $ticket->update($validated);

        return response()->json($ticket->load(['client', 'assignedAgent', 'replies.user']));
    }

    public function reply(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'is_internal' => 'boolean',
        ]);

        TicketReply::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
            'is_internal' => $validated['is_internal'] ?? false,
        ]);

        // ponytail: sync public reply directly to omnichannel conversation if linked
        if (empty($validated['is_internal']) && $ticket->conversation_id) {
            Message::create([
                'company_id' => $ticket->company_id,
                'conversation_id' => $ticket->conversation_id,
                'sender_type' => 'agent',
                'content' => "[Ticket #{$ticket->id}] " . $validated['content'],
            ]);
        }

        return response()->json($ticket->load(['client', 'assignedAgent', 'replies.user']));
    }
}
