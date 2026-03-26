import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Tarefa } from '@/types/tarefas';
import KanbanCard from './KanbanCard';
import { ChevronDown, ChevronUp, CheckSquare } from 'lucide-react';

interface KanbanColunaProps {
  id: string;
  titulo: string;
  cor: string;
  tarefas: Tarefa[];
  onEdit: (tarefa: Tarefa) => void;
  onDelete: (id: string) => void;
  refetchTarefa: (id: string) => Promise<void>;
  mostrarConcluidas?: boolean;
  toggleConcluidas?: () => void;
  onUpdateStatus: (id: string, status: any) => Promise<void>;
  onOpenArquivo: () => void;
}

const KanbanColuna: React.FC<KanbanColunaProps> = ({
  id,
  titulo,
  cor,
  tarefas,
  onEdit,
  onDelete,
  refetchTarefa,
  mostrarConcluidas,
  toggleConcluidas,
  onUpdateStatus,
  onOpenArquivo,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
        className={`
          bg-[#0a0a0a] rounded-xl p-3 flex flex-col gap-2 min-h-[60vh] transition-all duration-200
          ${isOver ? 'ring-2 ring-[#a3e635]/20' : ''}
        `}
    >
      {/* Header da coluna — sem fundo, linha sutil */}
      <div className="flex items-center gap-2 px-1 pb-3 border-b border-white/6 mb-1">
        <span className={`w-2 h-2 rounded-full ${cor.startsWith('[') ? `bg-${cor}` : `bg-${cor}`}`} />
        <span className="text-white/60 text-xs font-bold uppercase tracking-widest flex-1">
          {titulo}
        </span>
        <span className="text-white/30 text-xs font-medium">{tarefas.length}</span>
      </div>

      {/* Subtexto da janela para coluna concluído */}
      {id === 'concluido' && (
        <p className="text-white/20 text-[10px] px-1 mb-2 font-medium flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-white/10" />
          Últimos 30 dias · <button
            onClick={onOpenArquivo}
            className="text-white/35 hover:text-[#a3e635] transition-colors underline underline-offset-4 decoration-white/10 hover:decoration-[#a3e635]/30">
            ver arquivo
          </button>
        </p>
      )}

      {/* Lista de tarefas */}
      <div className="flex flex-col gap-2 flex-1">
        <div className={`
          flex flex-col gap-2 overflow-hidden transition-all duration-300
          ${id === 'concluido' && !mostrarConcluidas ? 'max-h-0 opacity-0' : 'max-h-[9999px] opacity-100'}
        `}>
          <SortableContext 
            items={tarefas.map(t => t.id)} 
            strategy={verticalListSortingStrategy}
          >
            {tarefas.map((tarefa) => (
              <KanbanCard
                key={tarefa.id}
                tarefa={tarefa}
                onEdit={onEdit}
                onDelete={onDelete}
                refetchTarefa={refetchTarefa}
                onUpdateStatus={onUpdateStatus}
              />
            ))}
          </SortableContext>
        </div>
        
        {/* Botão toggle para coluna concluído */}
        {id === 'concluido' && tarefas.length > 0 && toggleConcluidas && (
          <button
            onClick={toggleConcluidas}
            className="
              flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
              border border-dashed border-white/10 text-white/30 text-xs font-medium
              hover:border-white/20 hover:text-white/50 hover:bg-white/3
              transition-all mt-1
            "
          >
            {mostrarConcluidas
              ? <><ChevronUp size={13} /> Ocultar concluídas</>
              : <><ChevronDown size={13} /> Ver {tarefas.length} concluída{tarefas.length !== 1 ? 's' : ''}</>
            }
          </button>
        )}

        {/* Empty state */}
        {tarefas.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl border border-dashed border-white/10
              flex items-center justify-center">
              {id === 'concluido' ? (
                <CheckSquare size={18} className="text-white/15" />
              ) : (
                <Plus size={20} className="text-white/15" />
              )}
            </div>
            <p className="text-white/20 text-xs text-center">
              {id === 'concluido' 
                ? <>Nenhuma tarefa<br />concluída ainda</>
                : <>Nenhuma tarefa<br />nesta coluna</>
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColuna;
