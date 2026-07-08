import React, { useState } from 'react';
import { X, Phone, Mail, Tag, Edit, Trash2, Plus, DollarSign, LifeBuoy, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export interface Client {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  tags?: string[];
  custom_fields?: Record<string, string>;
  notes?: string;
  deals_count?: number;
  tickets_count?: number;
  deals?: Array<{
    id: number;
    title: string;
    value: number;
    status: string;
    stage?: { name: string };
    pipeline?: { name: string };
  }>;
  tickets?: Array<{
    id: number;
    title: string;
    status: string;
    priority: string;
  }>;
  created_at?: string;
}

interface ClientModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Partial<Client>) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  mode: 'view' | 'edit' | 'create';
  setMode: (mode: 'view' | 'edit' | 'create') => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  client,
  isOpen,
  onClose,
  onSave,
  onDelete,
  mode,
  setMode,
}) => {
  const [name, setName] = useState(client?.name || '');
  const [email, setEmail] = useState(client?.email || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [notes, setNotes] = useState(client?.notes || '');
  const [tagsInput, setTagsInput] = useState(client?.tags?.join(', ') || '');
  const [customFields, setCustomFields] = useState<Record<string, string>>(client?.custom_fields || {});
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'deals' | 'tickets'>('info');

  React.useEffect(() => {
    if (client) {
      setName(client.name || '');
      setEmail(client.email || '');
      setPhone(client.phone || '');
      setNotes(client.notes || '');
      setTagsInput(client.tags?.join(', ') || '');
      setCustomFields(client.custom_fields || {});
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
      setTagsInput('');
      setCustomFields({});
    }
  }, [client, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await onSave({
        name,
        email,
        phone,
        notes,
        tags,
        custom_fields: customFields,
      });
      onClose();
    } catch (err) {
      console.error('Error saving client:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = () => {
    if (newFieldKey.trim() && newFieldValue.trim()) {
      setCustomFields({ ...customFields, [newFieldKey.trim()]: newFieldValue.trim() });
      setNewFieldKey('');
      setNewFieldValue('');
    }
  };

  const handleRemoveField = (key: string) => {
    const updated = { ...customFields };
    delete updated[key];
    setCustomFields(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f111a] border border-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-800/80 flex items-center justify-between bg-[#131520]">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {(name || client?.name || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {mode === 'create' ? 'Nuevo Cliente' : mode === 'edit' ? 'Editar Cliente' : client?.name}
              </h2>
              {mode === 'view' && client && (
                <div className="flex items-center space-x-2 text-xs text-gray-400 mt-0.5">
                  {client.email && <span className="flex items-center"><Mail className="h-3 w-3 mr-1 text-indigo-400" />{client.email}</span>}
                  {client.phone && <span className="flex items-center"><Phone className="h-3 w-3 mr-1 text-emerald-400" />{client.phone}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {mode === 'view' && client && (
              <>
                <button
                  onClick={() => setMode('edit')}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-gray-800/80 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-semibold transition"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Editar</span>
                </button>
                {onDelete && client.id && (
                  <button
                    onClick={() => {
                      if (confirm('¿Estás seguro de eliminar este cliente?')) {
                        onDelete(client.id!);
                        onClose();
                      }
                    }}
                    className="p-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-400 rounded-lg transition"
                    title="Eliminar Cliente"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/50 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'view' && client ? (
            <div className="space-y-6">
              {/* Tags */}
              {client.tags && client.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {client.tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                      <Tag className="h-3 w-3 mr-1 text-indigo-400" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Navigation Tabs for View Mode */}
              <div className="flex border-b border-gray-800 space-x-6">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`pb-3 text-xs font-semibold border-b-2 transition ${
                    activeTab === 'info' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Información y Notas
                </button>
                <button
                  onClick={() => setActiveTab('deals')}
                  className={`pb-3 text-xs font-semibold border-b-2 transition flex items-center space-x-1.5 ${
                    activeTab === 'deals' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Embudos / Deals ({client.deals?.length || client.deals_count || 0})</span>
                </button>
                <button
                  onClick={() => setActiveTab('tickets')}
                  className={`pb-3 text-xs font-semibold border-b-2 transition flex items-center space-x-1.5 ${
                    activeTab === 'tickets' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <LifeBuoy className="h-3.5 w-3.5" />
                  <span>Tickets de Soporte ({client.tickets?.length || client.tickets_count || 0})</span>
                </button>
              </div>

              {/* Tab: INFO */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  {/* Custom Fields */}
                  <div className="bg-[#161824] p-4 rounded-xl border border-gray-800/60">
                    <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Campos Personalizados</h3>
                    {client.custom_fields && Object.keys(client.custom_fields).length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(client.custom_fields).map(([k, v]) => (
                          <div key={k} className="bg-gray-900/60 p-2.5 rounded-lg border border-gray-800/40">
                            <span className="text-[10px] text-gray-400 uppercase font-semibold block">{k}</span>
                            <span className="text-xs text-white font-medium">{v}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">No hay campos personalizados definidos.</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="bg-[#161824] p-4 rounded-xl border border-gray-800/60">
                    <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Notas del Cliente</h3>
                    <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {client.notes || <span className="text-gray-500 italic">No hay notas registradas para este cliente.</span>}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab: DEALS */}
              {activeTab === 'deals' && (
                <div className="space-y-3">
                  {client.deals && client.deals.length > 0 ? (
                    client.deals.map((deal) => (
                      <div key={deal.id} className="bg-[#161824] p-4 rounded-xl border border-gray-800/60 flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white mb-1">{deal.title}</h4>
                          <div className="flex items-center space-x-2 text-[10px]">
                            <span className="bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
                              {deal.stage?.name || 'Etapa'}
                            </span>
                            <span className="text-gray-400">{deal.pipeline?.name}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-emerald-400">
                            ${Number(deal.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          <div className="text-[10px] uppercase font-bold mt-0.5">
                            {deal.status === 'won' && <span className="text-emerald-400 flex items-center justify-end"><CheckCircle className="h-3 w-3 mr-1" /> Ganado</span>}
                            {deal.status === 'open' && <span className="text-blue-400 flex items-center justify-end"><Clock className="h-3 w-3 mr-1" /> Abierto</span>}
                            {deal.status === 'lost' && <span className="text-red-400 flex items-center justify-end"><AlertCircle className="h-3 w-3 mr-1" /> Perdido</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-xs">
                      No hay embudos de venta ni deals vinculados a este cliente.
                    </div>
                  )}
                </div>
              )}

              {/* Tab: TICKETS */}
              {activeTab === 'tickets' && (
                <div className="space-y-3">
                  {client.tickets && client.tickets.length > 0 ? (
                    client.tickets.map((ticket) => (
                      <div key={ticket.id} className="bg-[#161824] p-4 rounded-xl border border-gray-800/60 flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white mb-1">{ticket.title}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                            ticket.priority === 'high' ? 'bg-red-950/50 text-red-400 border border-red-500/30' :
                            ticket.priority === 'medium' ? 'bg-yellow-950/50 text-yellow-400 border border-yellow-500/30' :
                            'bg-blue-950/50 text-blue-400 border border-blue-500/30'
                          }`}>
                            Prioridad {ticket.priority === 'high' ? 'Alta' : ticket.priority === 'medium' ? 'Media' : 'Baja'}
                          </span>
                        </div>
                        <div>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                            ticket.status === 'closed' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' :
                            ticket.status === 'pending' ? 'bg-yellow-950/60 text-yellow-400 border border-yellow-500/30' :
                            'bg-blue-950/60 text-blue-400 border border-blue-500/30'
                          }`}>
                            {ticket.status === 'closed' ? 'Cerrado' : ticket.status === 'pending' ? 'Pendiente' : 'Abierto'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-xs">
                      No hay tickets de soporte abiertos para este cliente.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* FORM: CREATE OR EDIT */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Carlos Mendoza"
                    className="w-full bg-[#161824] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carlos@empresa.com"
                    className="w-full bg-[#161824] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+34 611 223 344"
                    className="w-full bg-[#161824] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Etiquetas (separadas por coma)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="VIP, Inbound, Recurrente"
                    className="w-full bg-[#161824] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Custom Fields Editor */}
              <div className="bg-[#161824] p-4 rounded-xl border border-gray-800/60">
                <label className="block text-xs font-bold text-gray-300 mb-2">Campos Personalizados (Clave / Valor)</label>
                
                {Object.keys(customFields).length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {Object.entries(customFields).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between bg-gray-900/80 px-3 py-1.5 rounded-lg border border-gray-800">
                        <span className="text-xs text-gray-300 truncate"><strong className="text-indigo-400">{k}:</strong> {v}</span>
                        <button type="button" onClick={() => handleRemoveField(k)} className="text-red-400 hover:text-red-300 ml-2">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newFieldKey}
                    onChange={(e) => setNewFieldKey(e.target.value)}
                    placeholder="Nombre campo (ej. Sector)"
                    className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    placeholder="Valor (ej. B2B)"
                    className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Notas del Cliente</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles importantes sobre la relación con el cliente, preferencias, etc."
                  className="w-full bg-[#161824] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
