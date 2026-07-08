import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClientModal, type Client } from '../components/crm/ClientModal';
import { Search, Plus, Tag, Users, Mail, Phone, ExternalLink, RefreshCw } from 'lucide-react';

export const ClientsPage: React.FC = () => {
  const { fetchApi } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');

  const availableTags = ['VIP', 'Recurrente', 'Nuevo', 'Inbound', 'Demo', 'Soporte'];

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedTag) params.append('tag', selectedTag);

      const res = await fetchApi(`/api/clients?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchApi, search, selectedTag]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadClients();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadClients]);

  const handleOpenClient = async (client: Client) => {
    try {
      const res = await fetchApi(`/api/clients/${client.id}`);
      if (res.ok) {
        const detailedClient = await res.json();
        setSelectedClient(detailedClient);
        setModalMode('view');
        setModalOpen(true);
      }
    } catch (err) {
      console.error('Error fetching detailed client:', err);
    }
  };

  const handleCreateNew = () => {
    setSelectedClient(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleSaveClient = async (clientData: Partial<Client>) => {
    try {
      if (modalMode === 'create') {
        const res = await fetchApi('/api/clients', {
          method: 'POST',
          body: JSON.stringify(clientData),
        });
        if (res.ok) {
          await loadClients();
        }
      } else if (modalMode === 'edit' && selectedClient?.id) {
        const res = await fetchApi(`/api/clients/${selectedClient.id}`, {
          method: 'PUT',
          body: JSON.stringify(clientData),
        });
        if (res.ok) {
          const updated = await res.json();
          setSelectedClient(updated);
          setModalMode('view');
          await loadClients();
        }
      }
    } catch (err) {
      console.error('Error saving client:', err);
      throw err;
    }
  };

  const handleDeleteClient = async (id: number) => {
    try {
      const res = await fetchApi(`/api/clients/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadClients();
      }
    } catch (err) {
      console.error('Error deleting client:', err);
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0f111a] border border-gray-800/80 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="h-4 w-4" />
            <span>Gestión de Relaciones (CRM)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Directorio de Clientes</h1>
          <p className="text-gray-400 text-xs mt-1">
            Administra tus contactos, etiquetas, campos personalizados y consulta su historial de embudos y tickets.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadClients}
            className="p-2.5 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 rounded-xl transition"
            title="Recargar lista"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/25 transition duration-150"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-[#0f111a] border border-gray-800/80 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o tel..."
            className="w-full bg-[#161824] border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Tag Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-[10px] text-gray-500 uppercase font-bold mr-1 flex items-center shrink-0">
            <Tag className="h-3 w-3 mr-1" /> Filtro:
          </span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition shrink-0 ${
              selectedTag === null
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-gray-900/80 text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            Todos
          </button>
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition shrink-0 ${
                selectedTag === tag
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-gray-900/80 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Table / Cards Grid */}
      <div className="bg-[#0f111a] border border-gray-800/80 rounded-2xl overflow-hidden shadow-xl">
        {loading && clients.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="text-xs font-medium">Cargando directorio de clientes...</span>
          </div>
        ) : clients.length === 0 ? (
          <div className="py-20 text-center text-gray-500 text-xs space-y-2">
            <Users className="h-10 w-10 mx-auto text-gray-600 mb-2" />
            <p className="text-sm font-bold text-gray-300">No se encontraron clientes</p>
            <p>Intenta cambiar los términos de búsqueda o crear tu primer contacto.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800/80 bg-[#131520] text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  <th className="py-4 px-6">Cliente</th>
                  <th className="py-4 px-6">Contacto</th>
                  <th className="py-4 px-6">Etiquetas</th>
                  <th className="py-4 px-6 text-center">Deals</th>
                  <th className="py-4 px-6 text-center">Tickets</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-xs">
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => handleOpenClient(client)}
                    className="hover:bg-gray-900/50 transition cursor-pointer group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-900/60 to-purple-900/60 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-white group-hover:text-indigo-300 transition block">
                            {client.name}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">ID: #{client.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-gray-300">
                      <div className="space-y-1">
                        {client.email && (
                          <div className="flex items-center space-x-1.5 text-xs">
                            <Mail className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                            <span className="truncate max-w-[180px]">{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                            <Phone className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {client.tags && client.tags.length > 0 ? (
                          client.tags.map((tag, idx) => (
                            <span key={idx} className="bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] font-medium">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-600 text-[10px] italic">Sin etiquetas</span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        (client.deals_count || 0) > 0 ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'bg-gray-900 text-gray-500'
                      }`}>
                        {client.deals_count || 0}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        (client.tickets_count || 0) > 0 ? 'bg-yellow-950/60 text-yellow-400 border border-yellow-500/30' : 'bg-gray-900 text-gray-500'
                      }`}>
                        {client.tickets_count || 0}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenClient(client);
                        }}
                        className="p-2 text-gray-400 hover:text-white bg-gray-900/80 hover:bg-gray-800 rounded-lg border border-gray-800 transition"
                        title="Ver Ficha"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Client Detail / Edit / Create Modal */}
      <ClientModal
        client={selectedClient}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveClient}
        onDelete={handleDeleteClient}
        mode={modalMode}
        setMode={setModalMode}
      />
    </div>
  );
};

export default ClientsPage;
