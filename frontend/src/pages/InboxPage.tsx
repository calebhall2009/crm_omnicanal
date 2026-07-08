import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { echo } from '../services/echo';
import type { Conversation, Message } from '../types/omnichannel';
import { getConversations, getConversationThread, sendAgentMessage } from '../services/omnichannel';
import { ConversationListItem } from '../components/inbox/ConversationListItem';
import { ChatThread } from '../components/inbox/ChatThread';
import { MessageCircle, Camera, Send, Search, Filter, RefreshCw, Layers, Clock } from 'lucide-react';

export const InboxPage: React.FC = () => {
  const { user, fetchApi } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('open');
  const [search, setSearch] = useState<string>('');

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingList(true);
    try {
      const data = await getConversations(fetchApi, {
        channel: filterChannel,
        status: filterStatus,
        search: search,
      });
      setConversations(data);
      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
      }
    } catch (err: any) {
      console.error('Error loading conversations:', err);
    } finally {
      if (!silent) setLoadingList(false);
    }
  }, [fetchApi, filterChannel, filterStatus, search, selectedId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversations();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadConversations]);

  // Load selected thread
  const loadThread = useCallback(async (id: number, silent = false) => {
    if (!silent) setLoadingThread(true);
    if (!silent) setError(null);
    try {
      const data = await getConversationThread(fetchApi, id);
      setSelectedConversation(data.conversation);
      setMessages(data.messages || []);
      
      // Update unread count locally in the list
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c))
      );
    } catch (err: any) {
      if (!silent) setError(err.message || 'Error al cargar el hilo de chat');
    } finally {
      if (!silent) setLoadingThread(false);
    }
  }, [fetchApi]);

  useEffect(() => {
    if (selectedId) {
      loadThread(selectedId);
    } else {
      setSelectedConversation(null);
      setMessages([]);
    }
  }, [selectedId, loadThread]);

  // Real-time WebSockets
  useEffect(() => {
    if (!user || !user.company_id) return;
    
    // Subscribe to the company's private channel
    const channel = echo.private(`company.${user.company_id}`);
    
    channel.listen('MessageCreated', (e: any) => {
      console.log('Message received via WS:', e.message);
      // Reload conversations list to update unread count/last message
      loadConversations(true);
      
      // If the message belongs to the currently opened thread, reload it
      if (selectedId && e.message.conversation_id === selectedId) {
        loadThread(selectedId, true);
      }
    });

    return () => {
      echo.leave(`company.${user.company_id}`);
    };
  }, [user, selectedId, loadConversations, loadThread]);

  const handleSendMessage = async (content: string, isTemplate = false) => {
    if (!selectedId) return;
    setSending(true);
    setError(null);
    try {
      const newMsg = await sendAgentMessage(fetchApi, selectedId, content, isTemplate);
      setMessages((prev) => [...prev, newMsg]);
      // Update conversation status if it was closed or update last message timestamp
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? { ...c, status: 'open', last_client_message_at: c.last_client_message_at }
            : c
        )
      );
    } catch (err: any) {
      setError(err.message || 'Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const channelTabs = [
    { id: 'all', label: 'Todos', icon: <Layers className="w-4 h-4" /> },
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-4 h-4 text-emerald-400" /> },
    { id: 'instagram', label: 'Instagram', icon: <Camera className="w-4 h-4 text-pink-400" /> },
    { id: 'telegram', label: 'Telegram', icon: <Send className="w-4 h-4 text-sky-400" /> },
  ];

  const expiredCount = conversations.filter((c) => c.is_24h_window_closed).length;

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-5rem)] flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800/80 backdrop-blur-xl shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30">
              Bandeja Omnicanal Unificada
            </span>
            {expiredCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {expiredCount} con SLA 24h vencido
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Conversaciones en Tiempo Real
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadConversations()}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 flex items-center gap-2 text-xs font-semibold"
            title="Actualizar bandeja"
          >
            <RefreshCw className={`w-4 h-4 ${loadingList ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar List */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden backdrop-blur-xl">
          {/* Filters & Search Header */}
          <div className="p-4 border-b border-slate-800/80 space-y-3 bg-slate-950/40">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por cliente, teléfono o email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-xs"
              />
            </div>

            {/* Channel Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
              {channelTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterChannel(tab.id)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    filterChannel === tab.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Status Pills */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Estado:
              </span>
              <div className="flex gap-1">
                {['all', 'open', 'closed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors ${
                      filterStatus === status
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {status === 'all' ? 'Todas' : status === 'open' ? 'Abiertas' : 'Cerradas'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {loadingList && conversations.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                <span>Cargando conversaciones...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-xs text-center px-4">
                <p className="font-semibold text-slate-400">No se encontraron conversaciones</p>
                <p className="mt-1 text-slate-600">Intente cambiar los filtros o los términos de búsqueda.</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationListItem
                  key={conv.id}
                  conversation={conv}
                  isSelected={selectedId === conv.id}
                  onClick={() => setSelectedId(conv.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Chat Thread Panel */}
        <div className="lg:col-span-7 xl:col-span-8 h-full min-h-[450px]">
          <ChatThread
            conversation={selectedConversation || (conversations.find((c) => c.id === selectedId) ?? null)}
            messages={messages}
            loading={loadingThread}
            onSendMessage={handleSendMessage}
            sending={sending}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};
