// src/components/crm/CrmColuna.tsx
import React from 'react';
import { Plus } from 'lucide-react';
import type { Lead, EtapaLead } from '@/types/crm';
import { CrmLeadCard } from './CrmLeadCard';

interface CrmColunaProps {
  etapa: { id: EtapaLead; label: string; cor: string };
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onQuickAdd: (etapaId: EtapaLead) => void;
}

export const CrmColuna = ({ etapa, leads, onLeadClick, onQuickAdd }: CrmColunaProps) => {
  return (
    <div className="flex flex-col flex-shrink-0 w-72">
      {/* Header da coluna */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: etapa.cor }} />
        <span className="text-white/70 text-xs font-bold uppercase tracking-widest flex-1">
          {etapa.label}
        </span>
        <span className="text-white/30 text-xs font-medium tabular-nums">{leads.length}</span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 min-h-[100px]">
        {leads.map(lead => (
          <CrmLeadCard 
            key={lead.id} 
            lead={lead} 
            onClick={onLeadClick} 
          />
        ))}
      </div>

      {/* Botão add rápido */}
      <button
        onClick={() => onQuickAdd(etapa.id)}
        className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
          border border-dashed border-white/6 text-white/20 text-[10px] font-bold uppercase tracking-wider
          hover:border-white/15 hover:text-white/40 transition-all active:scale-[0.98]"
      >
        <Plus size={12} strokeWidth={3} /> Adicionar lead
      </button>
    </div>
  );
};
