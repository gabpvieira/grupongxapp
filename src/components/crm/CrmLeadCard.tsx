// src/components/crm/CrmLeadCard.tsx
import React from 'react';
import { MoreHorizontal, MessageSquare } from 'lucide-react';
import type { Lead } from '@/types/crm';
import { BadgeOrigem } from './BadgeOrigem';

interface CrmLeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
}

export const CrmLeadCard = ({ lead, onClick }: CrmLeadCardProps) => {
  return (
    <div
      onClick={() => onClick(lead)}
      className="bg-[#0d0d0d] rounded-xl p-4 flex flex-col gap-3
        border border-white/6 hover:border-white/14
        cursor-pointer transition-all group
        hover:translate-y-[-1px] hover:shadow-lg hover:shadow-black/30"
    >
      {/* Linha 1: nome + menu */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-white/85 text-sm font-semibold leading-snug">
          {lead.nome}
        </p>
        <button
          onClick={e => { e.stopPropagation(); /* TODO: Adicionar menu rápido se necessário */ }}
          className="opacity-0 group-hover:opacity-100 transition-opacity
            text-white/30 hover:text-white/60 p-0.5 flex-shrink-0"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Empresa */}
      {lead.empresa && (
        <p className="text-white/35 text-xs -mt-1">{lead.empresa}</p>
      )}

      {/* Valor estimado */}
      {lead.valor_estimado && (
        <p className="text-[#a3e635] text-sm font-bold">
          {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valor_estimado)}
        </p>
      )}

      {/* Rodapé: origem badge + responsável + atividades */}
      <div className="flex items-center gap-2 pt-1 border-t border-white/5">
        <BadgeOrigem origem={lead.origem} />
        
        {lead.responsavel_nome && (
          <div 
            className="ml-auto flex items-center gap-1 text-white/30 text-xs"
            title={`Responsável: ${lead.responsavel_nome}`}
          >
            <div className="w-5 h-5 rounded-full bg-[#a3e635]/15
              flex items-center justify-center text-[#a3e635] text-[9px] font-bold">
              {lead.responsavel_nome[0]}
            </div>
          </div>
        )}
        
        {lead.total_atividades > 0 && (
          <span className="text-white/25 text-[10px] flex items-center gap-0.5 ml-auto">
            <MessageSquare size={10} /> {lead.total_atividades}
          </span>
        )}
      </div>
    </div>
  );
};
