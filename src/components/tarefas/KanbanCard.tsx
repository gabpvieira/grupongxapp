import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  MoreHorizontal, 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw,
  CheckSquare,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tarefa } from '@/types/tarefas';
import { useCronometro } from '@/hooks/useCronometro';
import BadgePrioridade from './BadgePrioridade';

interface KanbanCardProps {
  tarefa: Tarefa;
  onEdit: (tarefa: Tarefa) => void;
  onDelete: (id: string) => void;
  refetchTarefa: (id: string) => Promise<void>;
  onUpdateStatus?: (id: string, status: any) => Promise<void>;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ 
  tarefa, 
  onEdit, 
  onDelete, 
  refetchTarefa,
  onUpdateStatus
}) => {
  const [saindo, setSaindo] = React.useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarefa.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { 
    displaySeconds, 
    iniciar, 
    pausar, 
    resetar, 
    rodando, 
    formatarTempoCompacto 
  } = useCronometro(tarefa, refetchTarefa);

  const isAtrasada = (t: Tarefa) => {
    if (!t.data_vencimento || t.status === 'concluido') return false;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataVenc = new Date(t.data_vencimento + 'T00:00:00');
    return dataVenc < hoje;
  };

  const handleConcluir = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tarefa.status === 'concluido') return;
    
    setSaindo(true);
    // Aguarda animação de 250ms
    await new Promise(r => setTimeout(r, 250));
    
    try {
      if (onUpdateStatus) {
        await onUpdateStatus(tarefa.id, { status: 'concluido' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        group relative rounded-xl p-4 flex flex-col gap-3
        bg-[#141414] transition-all cursor-pointer
        hover:bg-[#1a1a1a] hover:translate-y-[-0.5px]
        ${isDragging ? 'opacity-50' : ''}
        ${rodando ? 'shadow-[inset_0_0_0_1px_rgba(163,230,53,0.2)]' : ''}
        ${saindo ? 'opacity-0 scale-95 -translate-y-2' : 'opacity-100 scale-100'}
        duration-250
      `}
      onClick={() => onEdit(tarefa)}
    >
      {/* ZONA 1: Topo — prioridade badge + menu */}
      <div className="flex items-center justify-between">
        <BadgePrioridade prioridade={tarefa.prioridade} />
        <button 
          className="opacity-0 group-hover:opacity-100 transition-opacity
            w-6 h-6 rounded-md hover:bg-white/8 flex items-center justify-center
            text-white/30 hover:text-white/60"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(tarefa);
          }}
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* ZONA 2: Conteúdo — título + descrição */}
      <div>
        <h3 className="text-white text-sm font-semibold leading-snug mb-1">
          {tarefa.titulo}
        </h3>
        {tarefa.descricao && (
          <p className="text-white/35 text-xs leading-relaxed line-clamp-2">
            {tarefa.descricao}
          </p>
        )}
      </div>

      {/* ZONA 3: Meta — data + responsável + checklist */}
      <div className="flex items-center gap-3 flex-wrap">
        {tarefa.data_vencimento && (
          <span className={`flex items-center gap-1 text-xs
            ${isAtrasada(tarefa) ? 'text-red-400' : 'text-white/35'}`}>
            <Calendar size={11} />
            {format(new Date(tarefa.data_vencimento + 'T00:00:00'), "dd 'de' MMM", { locale: ptBR })}
          </span>
        )}

        {tarefa.responsavel_nome && (
          <span className="flex items-center gap-1 text-white/35 text-xs">
            <div className="w-4 h-4 rounded-full bg-[#a3e635]/20 border border-[#a3e635]/30
              flex items-center justify-center text-[#a3e635] text-[9px] font-bold">
              {tarefa.responsavel_nome[0].toUpperCase()}
            </div>
            {tarefa.responsavel_nome.split(' ')[0]}
          </span>
        )}

        {tarefa.total_checklist > 0 && (
          <span className="flex items-center gap-1 text-white/30 text-xs ml-auto">
            <CheckSquare size={10} />
            {tarefa.checklist_concluidos}/{tarefa.total_checklist}
          </span>
        )}
      </div>

      {/* ZONA 4: Rodapé — cronômetro */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        {/* Tempo */}
        <div className="flex items-center gap-1.5">
          <Clock size={11} className={rodando ? 'text-[#a3e635]' : 'text-white/20'} />
          <span className={`text-xs font-mono font-medium
            ${rodando ? 'text-[#a3e635]' : 'text-white/35'}`}>
            {formatarTempoCompacto(displaySeconds)}
          </span>
          {rodando && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-pulse ml-0.5" />
          )}
        </div>

        {/* Botões cronômetro */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              rodando ? pausar() : iniciar(); 
            }}
            className={`flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium
              transition-all border
              ${rodando
                ? 'bg-[#a3e635]/10 border-[#a3e635]/30 text-[#a3e635] hover:bg-[#a3e635]/15'
                : 'bg-transparent border-white/10 text-white/40 hover:border-[#a3e635]/30 hover:text-[#a3e635]'
              }`}
          >
            {rodando
              ? <><Pause size={10} /> Pausar</>
              : <><Play size={10} /> Iniciar</>
            }
          </button>
          
          {tarefa.status !== 'concluido' && (
            <button
              onClick={handleConcluir}
              className="w-7 h-7 rounded-lg border border-white/8 bg-transparent
                text-white/20 hover:text-[#a3e635] hover:border-[#a3e635]/30
                flex items-center justify-center transition-all group/check"
              title="Concluir tarefa"
            >
              <CheckSquare size={13} className="group-hover/check:scale-110 transition-transform" />
            </button>
          )}

          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              resetar(); 
            }}
            className="w-7 h-7 rounded-lg border border-white/8 bg-transparent
              text-white/20 hover:text-white/50 hover:border-white/15
              flex items-center justify-center transition-all"
          >
            <RotateCcw size={10} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default KanbanCard;
