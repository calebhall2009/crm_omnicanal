import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/ai';
import type { AiKnowledgeItem, AiStats, AutoReplySetting } from '../types/ai';
import { 
  Bot, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  MessageSquare, 
  Sliders,
  DollarSign,
  Activity
} from 'lucide-react';

export const AiAssistantPage: React.FC = () => {
  const { fetchApi } = useAuth();
  const [faqs, setFaqs] = useState<AiKnowledgeItem[]>([]);
  const [stats, setStats] = useState<AiStats | null>(null);
  const [autoReplySettings, setAutoReplySettings] = useState<AutoReplySetting[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de FAQ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<AiKnowledgeItem | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('General');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await aiService.getKnowledgeBase(fetchApi);
      setFaqs(data.faqs);
      setStats(data.stats);
      setAutoReplySettings(data.auto_reply_settings);
    } catch (err) {
      console.error('Error cargando datos de IA:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchApi]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingFaq(null);
    setQuestion('');
    setAnswer('');
    setCategory('General');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (faq: AiKnowledgeItem) => {
    setEditingFaq(faq);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setCategory(faq.category || 'General');
    setIsModalOpen(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFaq) {
        await aiService.updateFaq(fetchApi, editingFaq.id, { question, answer, category });
      } else {
        await aiService.createFaq(fetchApi, { question, answer, category });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error guardando FAQ:', err);
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta pregunta frecuente?')) return;
    try {
      await aiService.deleteFaq(fetchApi, id);
      loadData();
    } catch (err) {
      console.error('Error eliminando FAQ:', err);
    }
  };

  const handleToggleAutoReply = async (connectionId: number, currentVal: boolean) => {
    try {
      await aiService.toggleAutoReply(fetchApi, connectionId, !currentVal);
      setAutoReplySettings(prev => 
        prev.map(item => item.connection_id === connectionId ? { ...item, auto_reply: !currentVal } : item)
      );
    } catch (err) {
      console.error('Error alternando auto respuesta:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const usagePercent = stats ? Math.min(100, Math.round((stats.requests_used / stats.requests_max) * 100)) : 0;

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center space-x-4 z-10">
          <div className="p-3 bg-white/15 backdrop-blur-md rounded-xl border border-white/20">
            <Bot className="h-8 w-8 text-indigo-200 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Asistente Virtual IA & Base de Conocimiento</h1>
            <p className="text-indigo-200 text-sm mt-1">
              Potenciado por <span className="font-semibold text-amber-300">Google Gemini (API de Pago)</span> • Privacidad garantizada sin entrenamiento con tus datos
            </p>
          </div>
        </div>
        <div className="z-10 flex items-center space-x-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Motor Activo
          </span>
        </div>
      </div>

      {/* Alerta de Cuota Superada */}
      {stats?.quota_exceeded && (
        <div className="bg-amber-500/15 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start space-x-3 text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">Has superado tu cuota mensual de IA ({stats.requests_max} mensajes)</h3>
            <p className="text-sm mt-1">
              Por seguridad y control de costos, la **respuesta automática en tus canales se ha pausado**. El asistente seguirá generando **sugerencias inteligentes** para tu equipo humano en la Bandeja de Entrada.
            </p>
          </div>
        </div>
      )}

      {/* KPIs de Consumo y Canales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medidor de Cuota y Consumo */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
                <Activity className="w-4 h-4 mr-1.5 text-indigo-500" /> Consumo Mensual IA
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                Plan Actual
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">
                {stats?.requests_used || 0} <span className="text-lg font-normal text-slate-400">/ {stats?.requests_max || 1000} msjs</span>
              </span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{usagePercent}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-3 rounded-full mt-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  usagePercent > 90 ? 'bg-rose-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center"><Zap className="w-3.5 h-3.5 mr-1 text-amber-500" /> Tokens: {(stats?.tokens_used || 0).toLocaleString()}</span>
            <span className="flex items-center"><DollarSign className="w-3.5 h-3.5 mr-0.5 text-emerald-500" /> Costo est: ${(stats?.estimated_cost || 0).toFixed(4)} USD</span>
          </div>
        </div>

        {/* Control de Respuesta Automática por Canal */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700/60 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center">
              <Sliders className="w-5 h-5 mr-2 text-indigo-500" /> Auto-Respuesta por Canal Conectado
            </h3>
            <span className="text-xs text-slate-400">Activa o desactiva la respuesta autónoma del bot en tiempo real</span>
          </div>
          
          {autoReplySettings.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              No tienes cuentas de WhatsApp, Instagram o Telegram conectadas aún. Ve a <a href="/channels" className="text-indigo-600 underline font-medium">Canales</a> para conectar.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {autoReplySettings.map(setting => (
                <div key={setting.connection_id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 capitalize font-bold text-xs">
                      {setting.channel_type}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">{setting.channel_type}</div>
                      <div className="text-xs text-slate-400 truncate max-w-[120px]">{setting.account_id}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleAutoReply(setting.connection_id, setting.auto_reply)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      setting.auto_reply ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        setting.auto_reply ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sección Base de Conocimiento (FAQs) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700/60 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
              <HelpCircle className="w-5 h-5 mr-2 text-indigo-500" /> Base de Conocimiento (Preguntas Frecuentes)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              El asistente inteligente utilizará <strong className="text-indigo-600 dark:text-indigo-400">exclusivamente</strong> estas respuestas para atender o sugerir a tus clientes.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium text-sm shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Añadir Pregunta Frecuente
          </button>
        </div>

        {faqs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-indigo-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center text-indigo-500 mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">Tu base de conocimiento está vacía</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Añade las preguntas comunes de tus clientes (precios, horarios, envíos, soporte) para que el bot empiece a responder de forma instantánea.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-6 inline-flex items-center px-4 py-2 rounded-lg border border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" /> Crear primera FAQ
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {faqs.map(faq => (
              <div key={faq.id} className="p-6 hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                      {faq.category || 'General'}
                    </span>
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">{faq.question}</h4>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
                <div className="flex items-center space-x-2 self-end md:self-center">
                  <button
                    onClick={() => handleOpenEdit(faq)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Editar FAQ"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Eliminar FAQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear / Editar FAQ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                <Bot className="w-5 h-5 mr-2 text-indigo-500" />
                {editingFaq ? 'Editar Pregunta Frecuente' : 'Añadir Nueva FAQ'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>
            <form onSubmit={handleSaveFaq} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="Ej: Precios, Soporte, Envíos, Horarios"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Pregunta Frecuente
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Ej: ¿Cuáles son sus planes y precios de suscripción?"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Respuesta del Asistente IA
                </label>
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  rows={4}
                  placeholder="Ej: Contamos con tres planes: Emprende ($29/mes), Crece ($79/mes) y Escala ($199/mes)..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                  required
                />
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <span className="font-semibold text-indigo-500 dark:text-indigo-400">Nota:</span> Sé claro y preciso. El bot usará esta respuesta exacta de base para contestar a los clientes en WhatsApp/Instagram/Telegram.
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all"
                >
                  {editingFaq ? 'Actualizar FAQ' : 'Guardar FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
