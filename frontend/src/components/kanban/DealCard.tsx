import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DollarSign, User, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export interface Deal {
  id: number;
  company_id?: number;
  pipeline_id: number;
  stage_id: number;
  client_id?: number;
  title: string;
  value: number;
  status: 'open' | 'won' | 'lost';
  client?: {
    id: number;
    name: string;
    email?: string;
  };
}

interface DealCardProps {
  deal: Deal;
  onClick: (deal: Deal) => void;
  isOverlay?: boolean;
}

export const DealCard: React.FC<DealCardProps> = ({ deal, onClick, isOverlay = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `deal-${deal.id}`,
    data: {
      type: 'Deal',
      deal,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'won':
        return <span className="text-[10px] text-emerald-400 font-bold flex items-center bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30"><CheckCircle className="h-3 w-3 mr-1" /> Ganado</span>;
      case 'lost':
        return <span className="text-[10px] text-red-400 font-bold flex items-center bg-red-950/60 px-2 py-0.5 rounded border border-red-500/30"><AlertCircle className="h-3 w-3 mr-1" /> Perdido</span>;
      default:
        return <span className="text-[10px] text-blue-400 font-bold flex items-center bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/30"><Clock className="h-3 w-3 mr-1" /> En proceso</span>;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(deal)}
      className={`bg-[#161824] border border-gray-800/80 hover:border-indigo-500/50 p-3.5 rounded-xl shadow-md transition duration-150 cursor-grab active:cursor-grabbing group ${
        isOverlay ? 'shadow-2xl border-indigo-500 scale-105 rotate-1 bg-[#1c1f2e]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition leading-snug">
          {deal.title}
        </h4>
        {getStatusBadge(deal.status)}
      </div>

      {deal.client && (
        <div className="flex items-center space-x-1.5 text-[11px] text-gray-400 mb-3 bg-gray-900/60 px-2 py-1 rounded-lg border border-gray-800/40">
          <User className="h-3 w-3 text-indigo-400 shrink-0" />
          <span className="truncate font-medium text-gray-300">{deal.client.name}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 text-xs">
        <div className="flex items-center text-emerald-400 font-extrabold">
          <DollarSign className="h-3.5 w-3.5 mr-0.5 text-emerald-500" />
          <span>{Number(deal.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">#{deal.id}</span>
      </div>
    </div>
  );
};
