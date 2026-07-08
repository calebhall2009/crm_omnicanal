import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { KanbanColumn, type Stage } from '../components/kanban/KanbanColumn';
import { DealCard, type Deal } from '../components/kanban/DealCard';
import { type Client } from '../components/crm/ClientModal';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Kanban as KanbanIcon, Plus, RefreshCw, Lock, X, Layers } from 'lucide-react';

interface Pipeline {
  id: number;
  name: string;
  is_default: boolean;
  stages: Stage[];
}

export const KanbanPage: React.FC = () => {
  const { fetchApi, user } = useAuth();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  // Deal Modal state
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [dealModalMode, setDealModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [selectedDeal, setSelectedDeal] = useState<Partial<Deal> | null>(null);
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState<number>(0);
  const [dealStageId, setDealStageId] = useState<number | null>(null);
  const [dealClientId, setDealClientId] = useState<number | null>(null);
  const [dealStatus, setDealStatus] = useState<'open' | 'won' | 'lost'>('open');
  const [savingDeal, setSavingDeal] = useState(false);

  // Feature Gating alert state
  const [featureLockedMsg, setFeatureLockedMsg] = useState<string | null>(null);

  // New Pipeline Modal state
  const [newPipelineModalOpen, setNewPipelineModalOpen] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [creatingPipeline, setCreatingPipeline] = useState(false);

  const planSlug = user?.company?.subscription?.plan?.slug || 'starter';
  const isStarterPlan = ['starter', 'emprende'].includes(planSlug);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pipeRes, dealsRes, clientsRes] = await Promise.all([
        fetchApi('/api/pipelines'),
        fetchApi('/api/deals'),
        fetchApi('/api/clients'),
      ]);

      if (pipeRes.ok && dealsRes.ok && clientsRes.ok) {
        const pipeData: Pipeline[] = await pipeRes.json();
        const dealsData: Deal[] = await dealsRes.json();
        const clientsData: Client[] = await clientsRes.json();

        setPipelines(pipeData);
        setDeals(dealsData);
        setClients(clientsData);

        if (pipeData.length > 0) {
          const defaultPipe = pipeData.find((p) => p.is_default) || pipeData[0];
          setSelectedPipeline(defaultPipe);
        }
      }
    } catch (err) {
      console.error('Error loading Kanban data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchApi]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Drag and Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const idStr = String(active.id);
    if (idStr.startsWith('deal-')) {
      const dealId = Number(idStr.replace('deal-', ''));
      const found = deals.find((d) => d.id === dealId);
      if (found) setActiveDeal(found);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    if (!activeIdStr.startsWith('deal-')) return;
    const dealId = Number(activeIdStr.replace('deal-', ''));
    const draggedDeal = deals.find((d) => d.id === dealId);
    if (!draggedDeal) return;

    let targetStageId: number | null = null;

    if (overIdStr.startsWith('stage-')) {
      targetStageId = Number(overIdStr.replace('stage-', ''));
    } else if (overIdStr.startsWith('deal-')) {
      const overDealId = Number(overIdStr.replace('deal-', ''));
      const overDeal = deals.find((d) => d.id === overDealId);
      if (overDeal) targetStageId = overDeal.stage_id;
    }

    if (!targetStageId || targetStageId === draggedDeal.stage_id) return;

    // Optimistic update
    const previousDeals = [...deals];
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage_id: targetStageId! } : d))
    );

    try {
      const res = await fetchApi(`/api/deals/${dealId}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({ stage_id: targetStageId }),
      });
      if (!res.ok) {
        setDeals(previousDeals);
      }
    } catch (err) {
      console.error('Error updating deal stage:', err);
      setDeals(previousDeals);
    }
  };

  // Deal Modal handlers
  const openCreateDeal = (stageId: number) => {
    if (!selectedPipeline) return;
    setDealModalMode('create');
    setSelectedDeal(null);
    setDealTitle('');
    setDealValue(1000);
    setDealStageId(stageId);
    setDealClientId(clients[0]?.id || null);
    setDealStatus('open');
    setDealModalOpen(true);
  };

  const openViewDeal = (deal: Deal) => {
    setDealModalMode('view');
    setSelectedDeal(deal);
    setDealTitle(deal.title);
    setDealValue(deal.value);
    setDealStageId(deal.stage_id);
    setDealClientId(deal.client_id || null);
    setDealStatus(deal.status);
    setDealModalOpen(true);
  };

  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPipeline || !dealStageId) return;
    setSavingDeal(true);
    try {
      const payload = {
        pipeline_id: selectedPipeline.id,
        stage_id: dealStageId,
        client_id: dealClientId || null,
        title: dealTitle,
        value: Number(dealValue),
        status: dealStatus,
      };

      if (dealModalMode === 'create') {
        const res = await fetchApi('/api/deals', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await loadData();
          setDealModalOpen(false);
        }
      } else if (dealModalMode === 'edit' && selectedDeal?.id) {
        const res = await fetchApi(`/api/deals/${selectedDeal.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await loadData();
          setDealModalOpen(false);
        }
      }
    } catch (err) {
      console.error('Error saving deal:', err);
    } finally {
      setSavingDeal(false);
    }
  };

  const handleDeleteDeal = async () => {
    if (!selectedDeal?.id) return;
    if (!confirm('¿Estás seguro de eliminar este embudo/deal?')) return;
    try {
      const res = await fetchApi(`/api/deals/${selectedDeal.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadData();
        setDealModalOpen(false);
      }
    } catch (err) {
      console.error('Error deleting deal:', err);
    }
  };

  // Create Pipeline handler
  const handleCreatePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isStarterPlan && pipelines.length >= 1) {
      setFeatureLockedMsg('El plan Emprende solo permite 1 pipeline con etapas fijas. Actualiza a Crece o Escala para crear pipelines ilimitados.');
      setNewPipelineModalOpen(false);
      return;
    }

    setCreatingPipeline(true);
    try {
      const res = await fetchApi('/api/pipelines', {
        method: 'POST',
        body: JSON.stringify({
          name: newPipelineName,
          stages: ['Lead', 'Contacto', 'Propuesta', 'Cierre'],
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setPipelines([...pipelines, created]);
        setSelectedPipeline(created);
        setNewPipelineModalOpen(false);
        setNewPipelineName('');
      } else if (res.status === 403) {
        const errData = await res.json();
        setFeatureLockedMsg(errData.message || 'Funcionalidad bloqueada en tu plan.');
        setNewPipelineModalOpen(false);
      }
    } catch (err) {
      console.error('Error creating pipeline:', err);
    } finally {
      setCreatingPipeline(false);
    }
  };

  return (
    <div className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-8 flex flex-col space-y-6 overflow-hidden">
      
      {/* Feature Gating Alert Banner */}
      {featureLockedMsg && (
        <div className="bg-amber-950/80 border border-amber-500/50 text-amber-200 px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-xl animate-fadeIn">
          <div className="flex items-center space-x-3">
            <Lock className="h-5 w-5 text-amber-400 shrink-0" />
            <p className="text-xs font-semibold">{featureLockedMsg}</p>
          </div>
          <button
            onClick={() => setFeatureLockedMsg(null)}
            className="text-amber-400 hover:text-white p-1 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header & Pipeline Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0f111a] border border-gray-800/80 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <KanbanIcon className="h-4 w-4" />
            <span>Embudos de Venta (Kanban)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            {selectedPipeline ? selectedPipeline.name : 'Pipeline Comercial'}
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Arrastra y suelta deals entre etapas para actualizar su estado al instante.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Pipeline Selector */}
          {pipelines.length > 0 && (
            <select
              value={selectedPipeline?.id || ''}
              onChange={(e) => {
                const p = pipelines.find((pipe) => pipe.id === Number(e.target.value));
                if (p) setSelectedPipeline(p);
              }}
              className="bg-[#161824] border border-gray-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
            >
              {pipelines.map((pipe) => (
                <option key={pipe.id} value={pipe.id}>
                  {pipe.name} {pipe.is_default ? '(Principal)' : ''}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={loadData}
            className="p-2.5 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 rounded-xl transition"
            title="Recargar Embudos"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={() => {
              if (isStarterPlan && pipelines.length >= 1) {
                setFeatureLockedMsg('El plan Emprende solo permite 1 pipeline con etapas fijas. Actualiza a Crece o Escala para crear pipelines ilimitados.');
              } else {
                setNewPipelineModalOpen(true);
              }
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition duration-150 ${
              isStarterPlan && pipelines.length >= 1
                ? 'bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-700'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25'
            }`}
          >
            {isStarterPlan && pipelines.length >= 1 ? <Lock className="h-4 w-4 text-amber-400" /> : <Plus className="h-4 w-4" />}
            <span>Nuevo Pipeline</span>
          </button>
        </div>
      </div>

      {/* Kanban Columns Container */}
      <div className="flex-1 overflow-x-auto pb-6">
        {loading && !selectedPipeline ? (
          <div className="py-24 flex flex-col items-center justify-center text-gray-400 space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="text-xs font-medium">Cargando tablero Kanban...</span>
          </div>
        ) : selectedPipeline ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex items-start space-x-5 min-w-max">
              {selectedPipeline.stages.map((stage) => {
                const stageDeals = deals.filter(
                  (d) => d.pipeline_id === selectedPipeline.id && d.stage_id === stage.id
                );
                return (
                  <KanbanColumn
                    key={stage.id}
                    stage={stage}
                    deals={stageDeals}
                    onDealClick={openViewDeal}
                    onAddDeal={openCreateDeal}
                  />
                );
              })}
            </div>

            <DragOverlay>
              {activeDeal ? (
                <DealCard deal={activeDeal} onClick={() => {}} isOverlay={true} />
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="py-20 text-center text-gray-500 text-xs space-y-2">
            <Layers className="h-10 w-10 mx-auto text-gray-600 mb-2" />
            <p className="text-sm font-bold text-gray-300">No hay pipelines creados</p>
            <p>Crea tu primer embudo comercial para comenzar a gestionar ventas.</p>
          </div>
        )}
      </div>

      {/* Deal Modal (Create / View / Edit) */}
      {dealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f111a] border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <h3 className="text-base font-bold text-white">
                {dealModalMode === 'create' ? 'Crear Nuevo Deal' : dealModalMode === 'edit' ? 'Editar Deal' : selectedDeal?.title}
              </h3>
              <div className="flex items-center space-x-2">
                {dealModalMode === 'view' && (
                  <>
                    <button
                      onClick={() => setDealModalMode('edit')}
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold"
                    >
                      Editar
                    </button>
                    <button
                      onClick={handleDeleteDeal}
                      className="px-3 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-lg text-xs font-semibold"
                    >
                      Eliminar
                    </button>
                  </>
                )}
                <button
                  onClick={() => setDealModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {dealModalMode === 'view' && selectedDeal ? (
              <div className="space-y-4 text-xs">
                <div className="bg-[#161824] p-4 rounded-xl border border-gray-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Etapa actual:</span>
                    <span className="font-bold text-indigo-400">
                      {selectedPipeline?.stages.find((s) => s.id === selectedDeal.stage_id)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Valor del Deal:</span>
                    <span className="font-extrabold text-emerald-400 text-sm">
                      ${Number(selectedDeal.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estado:</span>
                    <span className="font-bold uppercase">
                      {selectedDeal.status === 'won' && <span className="text-emerald-400">Ganado</span>}
                      {selectedDeal.status === 'open' && <span className="text-blue-400">En proceso</span>}
                      {selectedDeal.status === 'lost' && <span className="text-red-400">Perdido</span>}
                    </span>
                  </div>
                </div>

                {selectedDeal.client && (
                  <div className="bg-[#161824] p-4 rounded-xl border border-gray-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">Cliente Vinculado</span>
                      <span className="text-sm font-bold text-white">{selectedDeal.client.name}</span>
                      {selectedDeal.client.email && <span className="block text-gray-400">{selectedDeal.client.email}</span>}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveDeal} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">Título del Deal *</label>
                  <input
                    type="text"
                    required
                    value={dealTitle}
                    onChange={(e) => setDealTitle(e.target.value)}
                    placeholder="Ej. Licencia Anual - Empresa X"
                    className="w-full bg-[#161824] border border-gray-800 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-300 mb-1">Valor ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={dealValue}
                      onChange={(e) => setDealValue(Number(e.target.value))}
                      className="w-full bg-[#161824] border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-300 mb-1">Etapa</label>
                    <select
                      value={dealStageId || ''}
                      onChange={(e) => setDealStageId(Number(e.target.value))}
                      className="w-full bg-[#161824] border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    >
                      {selectedPipeline?.stages.map((st) => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-300 mb-1">Cliente Asociado</label>
                    <select
                      value={dealClientId || ''}
                      onChange={(e) => setDealClientId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-[#161824] border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Sin Cliente --</option>
                      {clients.map((cl) => (
                        <option key={cl.id} value={cl.id}>{cl.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-300 mb-1">Estado</label>
                    <select
                      value={dealStatus}
                      onChange={(e) => setDealStatus(e.target.value as 'open' | 'won' | 'lost')}
                      className="w-full bg-[#161824] border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="open">Abierto (En proceso)</option>
                      <option value="won">Ganado (Cerrado)</option>
                      <option value="lost">Perdido</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setDealModalOpen(false)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingDeal}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg transition disabled:opacity-50"
                  >
                    {savingDeal ? 'Guardando...' : 'Guardar Deal'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* New Pipeline Modal */}
      {newPipelineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f111a] border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white">Crear Nuevo Pipeline</h3>
              <button
                onClick={() => setNewPipelineModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePipeline} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">Nombre del Embudo *</label>
                <input
                  type="text"
                  required
                  value={newPipelineName}
                  onChange={(e) => setNewPipelineName(e.target.value)}
                  placeholder="Ej. Ventas Enterprise, Partners, etc."
                  className="w-full bg-[#161824] border border-gray-800 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setNewPipelineModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingPipeline}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg transition disabled:opacity-50"
                >
                  {creatingPipeline ? 'Creando...' : 'Crear Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanPage;
