// src/components/orcamentos/StatusBadgeOrcamento.tsx
import React from 'react';
import type { StatusOrcamento } from '@/types/orcamentos';

interface StatusBadgeOrcamentoProps {
  status: StatusOrcamento;
}

const STATUS_CONFIG = {
  rascunho:  { label: 'Rascunho',  cls: 'bg-white/8 text-white/40 border-white/12'             },
  enviado:   { label: 'Enviado',   cls: 'bg-blue-500/12 text-blue-400 border-blue-500/20'       },
  aprovado:  { label: 'Aprovado',  cls: 'bg-[#a3e635]/12 text-[#a3e635] border-[#a3e635]/20'   },
  assinado:  { label: 'Assinado',  cls: 'bg-[#a3e635]/20 text-[#a3e635] border-[#a3e635]/35 font-bold' },
  recusado:  { label: 'Recusado',  cls: 'bg-red-500/12 text-red-400 border-red-500/20'          },
  arquivado: { label: 'Arquivado', cls: 'bg-white/5 text-white/20 border-white/8'               },
};

export const StatusBadgeOrcamento = ({ status }: StatusBadgeOrcamentoProps) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.rascunho;
  
  return (
    <span className={`
      px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border
      ${config.cls}
    `}>
      {config.label}
    </span>
  );
};
