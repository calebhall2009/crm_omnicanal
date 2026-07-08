import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Ticket as TicketIcon, Clock, AlertTriangle, CheckCircle, MessageSquare, Lock, Star, Search, Plus } from 'lucide-react';

interface TicketReply {
  id: number;
  content: string;
  is_internal: boolean;
  created_at: string;
  user?: { name: string };
}

interface Ticket {
  id: number;
  title: string;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sla_expires_at?: string;
  csat_score?: number;
  csat_comment?: string;
  client?: { id: number; name: string; email?: string };
  assignedAgent?: { id: number; name: string };
  replies?: TicketReply[];
}

export const TicketsPage: React.FC = () => {
  const { fetchApi } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterSla, setFilterSla] = useState('all');
  const [search, setSearch] = useState('');

  // Selected ticket modal
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isInternalReply, setIsInternalReply] = useState(false);

  // CSAT Modal
  const [csatModalTicket, setCsatModalTicket] = useState<Ticket | null>(null);
  const [csatScore, setCsatScore] = useState<number>(5);
  const [csatComment, setCsatComment] = useState('');

  // New ticket modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPriority !== 'all') params.append('priority', filterPriority);
      if (filterSla !== 'all') params.append('sla_status', filterSla);

      const res = await fetchApi(`/api/tickets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [filterStatus, filterPriority, filterSla]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await fetchApi('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, priority: newPriority }),
      });
      if (res.ok) {
        setIsNewModalOpen(false);
        setNewTitle('');
        loadTickets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyContent.trim()) return;
    try {
      const res = await fetchApi(`/api/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent, is_internal: isInternalReply }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedTicket(updated);
        setReplyContent('');
        loadTickets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (ticket: Ticket, newStatus: string) => {
    if (newStatus === 'closed') {
      setCsatModalTicket(ticket);
      setCsatScore(5);
      setCsatComment('');
      return;
    }
    try {
      const res = await fetchApi(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (selectedTicket?.id === ticket.id) setSelectedTicket(updated);
        loadTickets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitCsat = async () => {
    if (!csatModalTicket) return;
    try {
      const res = await fetchApi(`/api/tickets/${csatModalTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed', csat_score: csatScore, csat_comment: csatComment }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (selectedTicket?.id === csatModalTicket.id) setSelectedTicket(updated);
        setCsatModalTicket(null);
        loadTickets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getSlaBadge = (sla?: string, status?: string) => {
    if (status === 'closed') {
      return <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Resuelto</span>;
    }
    if (!sla) return null;
    const diffMins = (new Date(sla).getTime() - Date.now()) / 60000;
    if (diffMins < 0) {
      return <span className="bg-red-950 text-red-400 border border-red-500/60 px-2 py-0.5 rounded text-xs font-bold animate-pulse flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> SLA Vencido</span>;
    }
    if (diffMins < 30) {
      return <span className="bg-yellow-950 text-yellow-400 border border-yellow-500/60 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> Vence en {Math.round(diffMins)}m</span>;
    }
    return <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3"/> SLA: {Math.round(diffMins / 60)}h {Math.round(diffMins % 60)}m</span>;
  };

  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.client?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const expiredCount = tickets.filter(t => t.status !== 'closed' && t.sla_expires_at && new Date(t.sla_expires_at).getTime() < Date.now()).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* SLA Expired Notification Banner */}
      {expiredCount > 0 && (
        <div className="bg-red-950/80 border border-red-500/60 p-4 rounded-xl flex items-center justify-between text-red-200 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">¡Atención! Tienes {expiredCount} ticket(s) con el SLA de respuesta vencido.</h4>
              <p className="text-xs text-red-300">Es necesaria la intervención inmediata de un agente para cumplir con las garantías del servicio.</p>
            </div>
          </div>
          <button onClick={() => setFilterSla('expired')} className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
            Ver Vencidos
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#161824] p-5 rounded-2xl border border-gray-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <TicketIcon className="w-7 h-7 text-indigo-400" />
            Mesa de Ayuda & Tickets SLA
          </h1>
          <p className="text-xs text-gray-400 mt-1">Gestión omnicanal de incidencias con cálculo automático de SLA según plan.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-900 p-1 rounded-xl border border-gray-800 flex">
            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>Lista</button>
            <button onClick={() => setViewMode('kanban')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>Kanban</button>
          </div>
          <button onClick={() => setIsNewModalOpen(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4" /> Nuevo Ticket
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-[#161824] p-4 rounded-xl border border-gray-800/60">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar por asunto o cliente..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900/80 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300">
          <option value="all">Estado: Todos</option>
          <option value="open">Abiertos</option>
          <option value="in_progress">En Progreso</option>
          <option value="waiting">Esperando Cliente</option>
          <option value="resolved">Resueltos</option>
          <option value="closed">Cerrados</option>
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300">
          <option value="all">Prioridad: Todas</option>
          <option value="urgent">Urgente</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
        <select value={filterSla} onChange={(e) => setFilterSla(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300">
          <option value="all">SLA: Todos</option>
          <option value="expired">Vencidos</option>
          <option value="warning">Por Vencer (30m)</option>
          <option value="ok">En Tiempo</option>
        </select>
      </div>

      {/* Ticket List View */}
      {loading ? (
        <div className="bg-[#161824] rounded-2xl border border-gray-800/80 p-12 text-center text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-3"></div>
          Cargando tickets...
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-[#161824] rounded-2xl border border-gray-800/80 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase bg-gray-900/50">
                <th className="p-4">Asunto</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Prioridad</th>
                <th className="p-4">Estado</th>
                <th className="p-4">SLA</th>
                <th className="p-4">CSAT</th>
                <th className="p-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 text-xs">
              {filteredTickets.map((t) => (
                <tr key={t.id} className="hover:bg-gray-800/30 transition cursor-pointer" onClick={() => setSelectedTicket(t)}>
                  <td className="p-4 font-bold text-white flex items-center gap-2">
                    <span className="text-gray-500">#{t.id}</span>
                    {t.title}
                  </td>
                  <td className="p-4 text-gray-300">{t.client?.name || 'Cliente general'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.priority === 'urgent' ? 'bg-red-950 text-red-400 border border-red-500' : t.priority === 'high' ? 'bg-red-900/40 text-red-400' : t.priority === 'medium' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-gray-800 text-gray-400'}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${t.status === 'closed' ? 'bg-emerald-950 text-emerald-400' : t.status === 'in_progress' ? 'bg-blue-950 text-blue-400' : 'bg-gray-800 text-gray-300'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-4">{getSlaBadge(t.sla_expires_at, t.status)}</td>
                  <td className="p-4">
                    {t.csat_score ? (
                      <span className="flex items-center text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" /> {t.csat_score}/5
                      </span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); }} className="text-indigo-400 hover:text-indigo-300 font-bold">Ver / Responder</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {['open', 'in_progress', 'waiting', 'resolved', 'closed'].map((colStatus) => (
            <div key={colStatus} className="bg-[#161824] p-4 rounded-xl border border-gray-800/80 space-y-3">
              <h3 className="text-xs font-extrabold uppercase text-gray-400 border-b border-gray-800 pb-2 flex justify-between">
                <span>{colStatus === 'open' ? 'Abiertos' : colStatus === 'in_progress' ? 'En Progreso' : colStatus === 'waiting' ? 'Esperando' : colStatus === 'resolved' ? 'Resuelto' : 'Cerrado'}</span>
                <span className="bg-gray-800 px-1.5 py-0.5 rounded text-white">{filteredTickets.filter(t => t.status === colStatus).length}</span>
              </h3>
              <div className="space-y-2">
                {filteredTickets.filter(t => t.status === colStatus).map((t) => (
                  <div key={t.id} onClick={() => setSelectedTicket(t)} className="bg-gray-900/90 p-3 rounded-lg border border-gray-800 hover:border-indigo-500/50 transition cursor-pointer space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-gray-500 font-mono">#{t.id}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${t.priority === 'urgent' ? 'bg-red-950 text-red-400' : t.priority === 'high' ? 'bg-red-900/40 text-red-400' : 'bg-gray-800 text-gray-400'}`}>{t.priority}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white line-clamp-2">{t.title}</h4>
                    <p className="text-[11px] text-gray-400">{t.client?.name || 'Cliente general'}</p>
                    <div className="pt-1 border-t border-gray-800/60 flex justify-between items-center">
                      {getSlaBadge(t.sla_expires_at, t.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Ticket Drawer / Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-end z-50">
          <div className="bg-[#161824] w-full max-w-2xl h-full border-l border-gray-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
              <div>
                <span className="text-xs text-indigo-400 font-bold">Ticket #{selectedTicket.id}</span>
                <h2 className="text-lg font-extrabold text-white mt-0.5">{selectedTicket.title}</h2>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-white text-sm font-bold bg-gray-800 px-3 py-1.5 rounded-lg">✕ Cerrar</button>
            </div>

            {/* Ticket Metadata Bar */}
            <div className="p-4 bg-gray-900/30 border-b border-gray-800/80 flex flex-wrap gap-4 text-xs">
              <div>
                <span className="text-gray-500 block">Cliente:</span>
                <span className="text-white font-bold">{selectedTicket.client?.name || 'No asignado'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Estado:</span>
                <select value={selectedTicket.status} onChange={(e) => handleUpdateStatus(selectedTicket, e.target.value)} className="bg-gray-800 border border-gray-700 text-white font-bold rounded px-2 py-1 text-xs mt-0.5">
                  <option value="open">Abierto</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="waiting">Esperando Cliente</option>
                  <option value="resolved">Resuelto</option>
                  <option value="closed">Cerrado</option>
                </select>
              </div>
              <div>
                <span className="text-gray-500 block">SLA:</span>
                <div className="mt-0.5">{getSlaBadge(selectedTicket.sla_expires_at, selectedTicket.status)}</div>
              </div>
              {selectedTicket.csat_score && (
                <div>
                  <span className="text-gray-500 block">Satisfacción CSAT:</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1 mt-0.5"><Star className="w-3.5 h-3.5 fill-amber-400"/> {selectedTicket.csat_score}/5</span>
                </div>
              )}
            </div>

            {/* Replies Thread */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Historial de Respuestas & Notas</h3>
              {selectedTicket.replies?.length === 0 && <p className="text-gray-500 text-xs">No hay respuestas en este ticket.</p>}
              {selectedTicket.replies?.map((r) => (
                <div key={r.id} className={`p-4 rounded-xl border text-xs space-y-1.5 ${r.is_internal ? 'bg-amber-950/30 border-amber-500/40 text-amber-100' : 'bg-gray-900/80 border-gray-800 text-gray-200'}`}>
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="flex items-center gap-1">
                      {r.is_internal ? <Lock className="w-3 h-3 text-amber-400"/> : <MessageSquare className="w-3 h-3 text-indigo-400"/>}
                      {r.user?.name || 'Agente'} — {r.is_internal ? 'NOTA INTERNA (Solo equipo)' : 'RESPUESTA AL CLIENTE'}
                    </span>
                    <span className="text-gray-400">{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{r.content}</p>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendReply} className="p-4 border-t border-gray-800 bg-gray-900/50 space-y-3">
              <textarea 
                rows={3} 
                placeholder={isInternalReply ? "Escribe una nota interna oculta para el cliente..." : "Escribe una respuesta visible para el cliente (se sincronizará en su chat)..."} 
                value={replyContent} 
                onChange={(e) => setReplyContent(e.target.value)}
                className={`w-full rounded-xl p-3 text-xs text-white focus:outline-none border ${isInternalReply ? 'bg-amber-950/20 border-amber-500/50 focus:border-amber-400' : 'bg-gray-900 border-gray-800 focus:border-indigo-500'}`}
              />
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-xs cursor-pointer text-gray-300">
                  <input type="checkbox" checked={isInternalReply} onChange={(e) => setIsInternalReply(e.target.checked)} className="rounded bg-gray-800 border-gray-700 text-amber-500 focus:ring-0" />
                  <span className="flex items-center gap-1 font-bold text-amber-400"><Lock className="w-3.5 h-3.5"/> Nota Interna (Solo equipo)</span>
                </label>
                <button type="submit" className={`px-4 py-2 rounded-xl text-xs font-extrabold text-white transition shadow-lg ${isInternalReply ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`}>
                  {isInternalReply ? 'Guardar Nota Interna' : 'Enviar Respuesta Pública'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSAT Modal on Ticket Close */}
      {csatModalTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#161824] border border-gray-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <Star className="w-6 h-6 fill-amber-400" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Calificación de Satisfacción (CSAT)</h3>
            <p className="text-xs text-gray-400">Estás cerrando el ticket <b>#{csatModalTicket.id}</b>. Por favor registra la calificación de satisfacción del cliente:</p>
            
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setCsatScore(s)} className={`p-2 rounded-lg transition ${csatScore >= s ? 'text-amber-400 scale-110' : 'text-gray-600 hover:text-gray-400'}`}>
                  <Star className={`w-8 h-8 ${csatScore >= s ? 'fill-amber-400' : ''}`} />
                </button>
              ))}
            </div>

            <textarea 
              rows={2} 
              placeholder="Comentario opcional del cliente sobre la resolución..." 
              value={csatComment} 
              onChange={(e) => setCsatComment(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setCsatModalTicket(null)} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-xs font-bold">Cancelar</button>
              <button type="button" onClick={handleSubmitCsat} className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20">
                Confirmar y Cerrar Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateTicket} className="bg-[#161824] border border-gray-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <TicketIcon className="w-5 h-5 text-indigo-400" /> Crear Nuevo Ticket
            </h3>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">Asunto de la incidencia</label>
              <input type="text" required placeholder="Ej. Problema con webhook de WhatsApp" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">Prioridad</label>
              <select value={newPriority} onChange={(e: any) => setNewPriority(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs text-white">
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsNewModalOpen(false)} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-xs font-bold">Cancelar</button>
              <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20">Crear Ticket</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TicketsPage;
