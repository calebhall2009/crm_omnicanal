import React from 'react';
import type { Conversation } from '../../types/omnichannel';
import { MessageCircle, Camera, Send, Clock } from 'lucide-react';

interface Props {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

export const ConversationListItem: React.FC<Props> = ({ conversation, isSelected, onClick }) => {
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-emerald-400" />;
      case 'instagram':
        return <Camera className="w-4 h-4 text-pink-400" />;
      case 'telegram':
        return <Send className="w-4 h-4 text-sky-400" />;
      default:
        return <MessageCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getChannelBadgeColor = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'instagram':
        return 'bg-pink-500/10 border-pink-500/20';
      case 'telegram':
        return 'bg-sky-500/10 border-sky-500/20';
      default:
        return 'bg-slate-800 border-slate-700';
    }
  };

  const clientName = conversation.client?.name || 'Cliente Desconocido';
  const clientPhoneOrEmail = conversation.client?.phone || conversation.client?.email || `ID: ${conversation.client_id}`;
  const is24hExpired = conversation.is_24h_window_closed;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
        isSelected
          ? 'bg-gradient-to-r from-blue-900/40 to-slate-900 border-blue-500/50 shadow-lg shadow-blue-500/10'
          : 'bg-slate-900/40 hover:bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
      }`}
    >
      <div className="relative shrink-0">
        <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-base shadow-inner">
          {clientName.charAt(0).toUpperCase()}
        </div>
        <div className={`absolute -bottom-1 -right-1 p-1 rounded-lg border ${getChannelBadgeColor(conversation.channel)} bg-slate-950 shadow-sm`}>
          {getChannelIcon(conversation.channel)}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
            {clientName}
          </h4>
          {conversation.unread_count > 0 && (
            <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-extrabold bg-blue-500 text-white shadow-sm shadow-blue-500/50 animate-pulse">
              {conversation.unread_count}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">
          {clientPhoneOrEmail}
        </p>

        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[11px]">
          <span className="text-slate-500 flex items-center gap-1 capitalize">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            {conversation.channel}
          </span>

          {is24hExpired ? (
            <span className="text-amber-400 font-medium flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20" title="Ventana de 24 horas de Meta vencida">
              <Clock className="w-3 h-3" /> SLA 24h Vencido
            </span>
          ) : (
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Activo
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
