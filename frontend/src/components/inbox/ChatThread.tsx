import React, { useState, useEffect, useRef } from 'react';
import type { Conversation, Message } from '../../types/omnichannel';
import { MessageCircle, Camera, Send, User, AlertTriangle, SendHorizonal, Bot } from 'lucide-react';

interface Props {
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  onSendMessage: (content: string, isTemplate?: boolean) => Promise<void>;
  sending: boolean;
  error: string | null;
}

export const ChatThread: React.FC<Props> = ({
  conversation,
  messages,
  loading,
  onSendMessage,
  sending,
  error,
}) => {
  const [content, setContent] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const is24hExpired = conversation?.is_24h_window_closed && ['whatsapp', 'instagram'].includes(conversation?.channel || '');

  useEffect(() => {
    if (is24hExpired) {
      setIsTemplate(true);
    } else {
      setIsTemplate(false);
    }
  }, [is24hExpired, conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!conversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-900/30 border border-slate-800/80 rounded-3xl text-center">
        <div className="w-16 h-16 rounded-3xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
          <MessageCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">Ninguna conversación seleccionada</h3>
        <p className="text-slate-400 text-sm mt-1 max-w-sm">
          Seleccione una conversación de la barra lateral para ver el historial de mensajes o responder al cliente en tiempo real.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;

    await onSendMessage(content.trim(), isTemplate);
    setContent('');
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return <MessageCircle className="w-4 h-4 text-emerald-400" />;
      case 'instagram': return <Camera className="w-4 h-4 text-pink-400" />;
      case 'telegram': return <Send className="w-4 h-4 text-sky-400" />;
      default: return <MessageCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/50 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="p-5 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-base shadow-md shadow-blue-500/20">
            {conversation.client?.name?.charAt(0).toUpperCase() || 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">{conversation.client?.name || 'Cliente'}</h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                {getChannelIcon(conversation.channel)} {conversation.channel}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {conversation.client?.phone || conversation.client?.email || `ID: ${conversation.client_id}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {conversation.ai_sentiment && (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 ${
              conversation.ai_sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              conversation.ai_sentiment === 'negative' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
              'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {conversation.ai_sentiment === 'positive' ? '😊 Positivo' : conversation.ai_sentiment === 'negative' ? '😠 Negativo' : '😐 Neutral'}
            </span>
          )}
          {conversation.ai_intent && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1 capitalize">
              🎯 {conversation.ai_intent}
            </span>
          )}
          {conversation.client?.tags?.map((tag) => (
            <span key={tag} className="hidden sm:inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              #{tag}
            </span>
          ))}
          <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
            conversation.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${conversation.status === 'open' ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
            {conversation.status === 'open' ? 'Abierta' : 'Cerrada'}
          </span>
        </div>
      </div>

      {/* Meta 24h SLA Warning Banner */}
      {is24hExpired && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 p-3.5 px-5 flex items-start gap-3 text-amber-300 text-xs animate-in slide-in-from-top duration-300">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-amber-200 uppercase tracking-wide">Ventana de 24 horas de Meta Vencida:</span>
            <span className="ml-1 text-amber-300/90 leading-relaxed">
              Han pasado más de 24 horas desde el último mensaje del cliente. Para reanudar la conversación en {conversation.channel}, las políticas de Meta exigen enviar una plantilla pre-aprobada.
            </span>
          </div>
        </div>
      )}

      {/* AI Suggested Reply Banner */}
      {conversation.ai_suggested_reply && (
        <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-purple-900/40 border-b border-purple-500/30 p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-purple-100 animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 mt-0.5">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wide text-purple-300">Sugerencia del Asistente IA (Alta Confianza):</span>
              </div>
              <p className="text-sm mt-1 text-purple-100/90 leading-relaxed italic bg-black/20 p-2.5 rounded-xl border border-purple-500/20">
                "{conversation.ai_suggested_reply}"
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setContent(conversation.ai_suggested_reply || '')}
              className="px-3 py-1.5 rounded-xl bg-purple-600/40 hover:bg-purple-600/60 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all"
            >
              Insertar en caja
            </button>
            <button
              type="button"
              onClick={async () => {
                if (conversation.ai_suggested_reply && !sending) {
                  await onSendMessage(conversation.ai_suggested_reply, isTemplate);
                }
              }}
              disabled={sending}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5"
            >
              <span>Enviar directo</span>
              <SendHorizonal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-950/40 to-slate-900/20">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm animate-pulse">
            Cargando historial de mensajes...
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm text-center">
            <p>No hay mensajes en esta conversación aún.</p>
            <p className="text-xs text-slate-600 mt-1">Escriba abajo para iniciar la conversación.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isClient = msg.sender_type === 'client';
            const isAi = msg.sender_type === 'ai' || msg.es_generado_por_ia;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isClient ? 'items-start' : 'items-end'} animate-in fade-in duration-200`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  {!isClient && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      {isAi ? (
                        <>
                          <Bot className="w-3 h-3 text-purple-400" /> Asistente IA (Automatizado)
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 text-blue-400" /> Agente
                        </>
                      )}
                    </span>
                  )}
                  {isClient && (
                    <span className="text-[10px] font-bold text-slate-400">
                      {conversation.client?.name || 'Cliente'}
                    </span>
                  )}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-lg ${
                    isClient
                      ? 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/80'
                      : isAi
                      ? 'bg-gradient-to-r from-purple-900/80 to-pink-900/80 text-white rounded-tr-none border border-purple-500/30 shadow-purple-500/10'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none border border-blue-500/30 shadow-blue-500/10'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">
                  {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recién'}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="px-5 py-2.5 bg-red-500/10 border-t border-red-500/20 text-red-400 text-xs flex items-center justify-between">
          <span>{error}</span>
        </div>
      )}

      {/* Reply Box */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800/80 bg-slate-950/80 space-y-3">
        {is24hExpired && (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={isTemplate}
                onChange={(e) => setIsTemplate(e.target.checked)}
                className="rounded border-amber-500/50 bg-slate-900 text-amber-500 focus:ring-amber-500/30"
              />
              <span>Enviar como Plantilla Aprobada de Recontacto (Cumplimiento SLA Meta)</span>
            </label>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded text-amber-300">
              Requerido
            </span>
          </div>
        )}

        <div className="flex items-end gap-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={
              is24hExpired
                ? 'Escriba la plantilla aprobada para recontactar al cliente...'
                : `Escriba su mensaje para enviar por ${conversation.channel}... (Enter para enviar)`
            }
            rows={2}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm resize-none"
            disabled={sending}
          />

          <button
            type="submit"
            disabled={!content.trim() || sending || (is24hExpired && !isTemplate)}
            className="h-12 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 shrink-0"
          >
            {sending ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Enviar</span>
                <SendHorizonal className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
