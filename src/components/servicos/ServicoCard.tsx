// src/components/servicos/ServicoCard.tsx
import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Servico } from '@/types/servicos';

interface ServicoCardProps {
  servico: Servico;
  onEdit: (servico: Servico) => void;
  onDelete: (id: string) => void;
}

export const ServicoCard = ({ servico, onEdit, onDelete }: ServicoCardProps) => {
  return (
    <div className={`
      bg-[#0d0d0d] rounded-2xl border flex flex-col h-full
      transition-all hover:border-white/14 hover:translate-y-[-1px]
      hover:shadow-lg hover:shadow-black/30
      ${servico.ativo ? 'border-white/7' : 'border-white/4 opacity-60'}
    `}>
      {/* Header do card */}
      <div className="flex items-start justify-between p-5 pb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-white/85 text-sm font-bold leading-snug pr-2">
            {servico.nome}
          </h3>
          {servico.descricao && (
            <p className="text-white/35 text-[11px] mt-1.5 line-clamp-2 leading-relaxed">
              {servico.descricao}
            </p>
          )}
        </div>
        {/* Badge ativo/inativo */}
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex-shrink-0
          ${servico.ativo
            ? 'bg-[#a3e635]/12 text-[#a3e635] border border-[#a3e635]/20'
            : 'bg-white/6 text-white/30 border border-white/10'
          }`}>
          {servico.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      {/* Corpo do card */}
      <div className="px-5 pb-4 flex flex-col gap-2.5">
        {/* Categoria */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-white/20 font-bold uppercase tracking-widest">Categoria</span>
          <span className="text-white/60 font-medium">{servico.categoria}</span>
        </div>

        {/* Preço */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-white/20 font-bold uppercase tracking-widest">Preço</span>
          <span className="text-[#a3e635] font-bold text-sm">
            {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(servico.preco)}
          </span>
        </div>

        {/* Recorrência */}
        {servico.recorrente && servico.periodicidade && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/20 font-bold uppercase tracking-widest">Recorrência</span>
            <span className="px-2 py-0.5 bg-white/5 border border-white/10
              rounded-full text-white/40 text-[9px] font-bold uppercase tracking-wider">
              {servico.periodicidade}
            </span>
          </div>
        )}
      </div>

      {/* Footer com ações */}
      <div className="flex items-center gap-2 px-4 py-4 border-t border-white/5 mt-auto bg-black/20 rounded-b-2xl">
        <button
          onClick={() => onEdit(servico)}
          className="flex-1 flex items-center justify-center gap-2 h-9
            rounded-xl bg-white/5 border border-white/8 text-white/50 text-xs font-bold uppercase tracking-wider
            hover:border-white/18 hover:text-white/80 transition-all active:scale-[0.98]"
        >
          <Pencil size={12} strokeWidth={2.5} /> Editar
        </button>
        <button
          onClick={() => onDelete(servico.id)}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/8
            text-white/25 hover:border-red-500/30 hover:text-red-400
            flex items-center justify-center transition-all active:scale-[0.95]"
        >
          <Trash2 size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
