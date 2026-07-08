import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { ChannelConnection, ChannelType } from '../types/omnichannel';
import { getChannels, connectChannel, disconnectChannel } from '../services/omnichannel';
import { MessageCircle, Camera, Send, CheckCircle2, AlertCircle, Trash2, Plus, Lock, RefreshCw, Zap, ShieldCheck } from 'lucide-react';

interface ChannelConfigModalProps {
  channelType: ChannelType | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ChannelConfigModal: React.FC<ChannelConfigModalProps> = ({ channelType, onClose, onSuccess }) => {
  const { fetchApi } = useAuth();
  const [accountId, setAccountId] = useState('');
  const [token, setToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('omniflow_secret_2026');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!channelType) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const credentials: Record<string, any> = {};
      const metadata: Record<string, any> = {};

      if (channelType === 'whatsapp') {
        credentials.access_token = token;
        credentials.verify_token = verifyToken;
        metadata.phone_number = displayName || '+34 600 000 000';
        metadata.display_name = displayName || 'WhatsApp Business';
      } else if (channelType === 'instagram') {
        credentials.access_token = token;
        credentials.verify_token = verifyToken;
        metadata.username = displayName || '@acme_official';
      } else if (channelType === 'telegram') {
        credentials.bot_token = token;
        metadata.bot_username = displayName || '@SupportBot';
      }

      await connectChannel(fetchApi, {
        channel_type: channelType,
        account_id: accountId || `sim_${channelType}_${Date.now().toString().slice(-4)}`,
        credentials,
        metadata,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al conectar el canal.');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (channelType) {
      case 'whatsapp': return 'Conectar WhatsApp Business Cloud API';
      case 'instagram': return 'Conectar Instagram Direct (Graph API)';
      case 'telegram': return 'Conectar Telegram Bot';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              {channelType === 'whatsapp' && <MessageCircle className="w-5 h-5 text-emerald-400" />}
              {channelType === 'instagram' && <Camera className="w-5 h-5 text-pink-400" />}
              {channelType === 'telegram' && <Send className="w-5 h-5 text-sky-400" />}
            </div>
            <h3 className="text-lg font-bold text-white">{getTitle()}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {channelType === 'telegram' ? 'Nombre / Usuario del Bot' : 'Nombre o Identificador para mostrar'}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={channelType === 'telegram' ? '@MiSoporteBot' : '+34 600 000 000'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {channelType === 'whatsapp' ? 'Phone Number ID / Account ID' : channelType === 'instagram' ? 'Page ID / Account ID' : 'Bot ID / Account ID'}
            </label>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="Ej. 109876543210987"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {channelType === 'telegram' ? 'Bot Token (de BotFather)' : 'Access Token (Meta Cloud API)'}
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Pegue aquí su token secreto..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
              required
            />
          </div>

          {channelType !== 'telegram' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Verify Token (Para Webhook de Meta)
              </label>
              <input
                type="text"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">Configure este token en el panel de desarrolladores de Meta.</p>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all text-sm flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                'Conectar Canal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ChannelsPage: React.FC = () => {
  const { user, fetchApi } = useAuth();
  const [connections, setConnections] = useState<ChannelConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<ChannelType | null>(null);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  const planSlug = user?.company?.subscription?.plan?.slug || 'starter';
  const isStarter = ['starter', 'emprende'].includes(planSlug.toLowerCase());
  const activeCount = connections.filter((c) => c.status === 'active').length;

  const loadConnections = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getChannels(fetchApi);
      setConnections(data);
    } catch (err: any) {
      console.error('Error loading channels:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchApi]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleDisconnect = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea desconectar este canal? Se detendrá la recepción de mensajes.')) {
      return;
    }
    try {
      await disconnectChannel(fetchApi, id);
      loadConnections();
    } catch (err: any) {
      alert(err.message || 'Error al desconectar el canal');
    }
  };

  const channelsList: { type: ChannelType; name: string; desc: string; icon: React.ReactNode; color: string; bgColor: string }[] = [
    {
      type: 'whatsapp',
      name: 'WhatsApp Cloud API',
      desc: 'Conecte su número de WhatsApp Business directamente mediante la API oficial de Meta.',
      icon: <MessageCircle className="w-7 h-7 text-emerald-400" />,
      color: 'border-emerald-500/20 hover:border-emerald-500/40',
      bgColor: 'bg-emerald-500/10',
    },
    {
      type: 'instagram',
      name: 'Instagram Messaging',
      desc: 'Gestione respuestas automáticas y mensajes directos en tiempo real con Graph API.',
      icon: <Camera className="w-7 h-7 text-pink-400" />,
      color: 'border-pink-500/20 hover:border-pink-500/40',
      bgColor: 'bg-pink-500/10',
    },
    {
      type: 'telegram',
      name: 'Telegram Bot API',
      desc: 'Vincule su bot de atención al cliente creado en BotFather con configuración automática de webhook.',
      icon: <Send className="w-7 h-7 text-sky-400" />,
      color: 'border-sky-500/20 hover:border-sky-500/40',
      bgColor: 'bg-sky-500/10',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30">
              Omnicanalidad Multi-Tenant
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Webhook HMAC SHA-256
            </span>
            {loading && <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Canales y Conexiones
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Conecte y administre los canales de mensajería para su empresa ({user?.company?.name || 'Tenant'}).
          </p>
        </div>

        {/* Feature Gating Badge */}
        <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Plan Actual: <span className="text-white font-bold capitalize">{planSlug}</span>
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
              <span>Canales activos: {activeCount} / {isStarter ? 1 : 'Ilimitados'}</span>
              {isStarter && activeCount >= 1 && (
                <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 font-medium">
                  <Lock className="w-3 h-3" /> Límite alcanzado
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {errorAlert && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-between text-red-400">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <span className="text-sm font-medium">{errorAlert}</span>
          </div>
          <button onClick={() => setErrorAlert(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Grid de Canales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {channelsList.map((ch) => {
          const conn = connections.find((c) => c.channel_type === ch.type && c.status === 'active');
          const isConnected = !!conn;

          return (
            <div
              key={ch.type}
              className={`bg-slate-900/50 border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${ch.color} ${
                isConnected ? 'ring-2 ring-emerald-500/30 bg-slate-900/80 shadow-xl shadow-emerald-500/5' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${ch.bgColor} border border-white/5`}>
                    {ch.icon}
                  </div>
                  {isConnected ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                      Desconectado
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white tracking-tight">{ch.name}</h3>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">{ch.desc}</p>

                {isConnected && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Cuenta / ID:</span>
                      <span className="text-white font-mono font-medium">{conn.account_id || 'N/A'}</span>
                    </div>
                    {conn.metadata?.phone_number && (
                      <div className="flex justify-between text-slate-400">
                        <span>Teléfono:</span>
                        <span className="text-emerald-400 font-medium">{conn.metadata.phone_number}</span>
                      </div>
                    )}
                    {conn.metadata?.username && (
                      <div className="flex justify-between text-slate-400">
                        <span>Usuario:</span>
                        <span className="text-pink-400 font-medium">{conn.metadata.username}</span>
                      </div>
                    )}
                    {conn.metadata?.bot_username && (
                      <div className="flex justify-between text-slate-400">
                        <span>Bot:</span>
                        <span className="text-sky-400 font-medium">{conn.metadata.bot_username}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                {isConnected ? (
                  <button
                    onClick={() => handleDisconnect(conn.id)}
                    className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Desconectar Canal
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (isStarter && activeCount >= 1) {
                        setErrorAlert('El plan Emprende solo permite conectar 1 canal simultáneamente. Actualice al plan Crece o Escala para conectar más canales.');
                        return;
                      }
                      setSelectedChannel(ch.type);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Conectar Ahora
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Webhook Configuration Guide */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-blue-400" /> Información para Configuración de Webhooks
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-4">
          Para recibir mensajes en tiempo real, configure la URL del webhook en el panel de su proveedor (Meta Developers para WhatsApp/Instagram o BotFather para Telegram).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
            <span className="text-slate-500 font-sans text-xs font-bold uppercase">Meta Webhook URL (WA / IG):</span>
            <span className="text-emerald-400 select-all">https://api.omniflow.io/api/webhooks/whatsapp/{user?.company?.id || 1}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
            <span className="text-slate-500 font-sans text-xs font-bold uppercase">Telegram Webhook URL:</span>
            <span className="text-sky-400 select-all">https://api.omniflow.io/api/webhooks/telegram/[CONNECTION_ID]</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      <ChannelConfigModal
        channelType={selectedChannel}
        onClose={() => setSelectedChannel(null)}
        onSuccess={() => {
          loadConnections();
          setErrorAlert(null);
        }}
      />
    </div>
  );
};
