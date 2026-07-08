import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DealCard, type Deal } from './DealCard';
import { Plus, DollarSign, Layers } from 'lucide-react';

export interface Stage {
  id: number;
  pipeline_id: number;
  name: string;
  order: number;
}

interface KanbanColumnProps {
  stage: Stage;
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onAddDeal: (stageId: number) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stage,
  deals,
  onDealClick,
  onAddDeal,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage.id}`,
    data: {
      type: 'Stage',
      stage,
    },
  });

  const totalValue = deals.reduce((sum, d) => sum + Number(d.value || 0), 0);
  const dealIds = deals.map((d) => `deal-${d.id}`);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-[#0f111a] border rounded-2xl w-80 shrink-0 max-h-[calc(100vh-220px)] transition duration-200 ${
        isOver ? 'border-indigo-500/80 bg-[#141724] shadow-lg shadow-indigo-500/10' : 'border-gray-800/80'
      }`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-gray-800/80 flex items-center justify-between bg-[#131520] rounded-t-2xl">
        <div className="flex items-center space-x-2.5">
          <div className="h-3 w-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-sm shadow-indigo-500/50"></div>
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">{stage.name}</h3>
          <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
            {deals.length}
          </span>
        </div>

        <div className="flex items-center text-xs font-extrabold text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-500/20">
          <DollarSign className="h-3 w-3 mr-0.5" />
          <span>{totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
        </div>
      </div>

      {/* Cards List Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[150px]">
        <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
          {deals.length > 0 ? (
            deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} onClick={onDealClick} />
            ))
          ) : (
            <div className="h-32 border-2 border-dashed border-gray-800/60 rounded-xl flex flex-col items-center justify-center text-gray-500 text-[11px] p-4 text-center">
              <Layers className="h-6 w-6 text-gray-700 mb-1" />
              <span>Arrastra deals aquí</span>
            </div>
          )}
        </SortableContext>
      </div>

      {/* Footer Add Button */}
      <div className="p-3 border-t border-gray-800/80 bg-[#131520] rounded-b-2xl">
        <button
          onClick={() => onAddDeal(stage.id)}
          className="w-full py-2 bg-gray-900 hover:bg-gray-800 hover:text-white text-gray-400 border border-gray-800 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5 group"
        >
          <Plus className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition" />
          <span>Añadir Deal</span>
        </button>
      </div>
    </div>
  );
};
