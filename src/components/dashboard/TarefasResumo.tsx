import { CheckSquare, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TarefasResumoProps {
  tarefas: {
    pendentes: number;
    emAndamento: number;
    atrasadas: number;
  };
}

const TarefasResumo = ({ tarefas }: TarefasResumoProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#0d0d0d] border border-white/5 rounded-xl p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-lg tracking-tight flex items-center gap-2">
          <CheckSquare className="text-[#a3e635]" size={20} />
          Tarefas da Equipe
        </h3>
        <button 
          onClick={() => navigate('/app/tarefas')}
          className="text-[#a3e635] hover:text-[#a3e635]/80 transition-colors"
        >
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-lg p-4 flex flex-col gap-1 border border-transparent hover:border-white/5 transition-all">
          <div className="flex items-center gap-2 text-white/40 mb-1">
            <Clock size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Em Aberto</span>
          </div>
          <span className="text-3xl font-bold text-white tracking-tighter">
            {tarefas.pendentes + tarefas.emAndamento}
          </span>
          <p className="text-[10px] text-white/20 font-medium">Aguardando ação</p>
        </div>

        <div className={`rounded-lg p-4 flex flex-col gap-1 border transition-all ${
          tarefas.atrasadas > 0 
            ? 'bg-rose-500/5 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.05)]' 
            : 'bg-white/5 border-transparent'
        }`}>
          <div className={`flex items-center gap-2 mb-1 ${
            tarefas.atrasadas > 0 ? 'text-rose-400' : 'text-white/40'
          }`}>
            <AlertCircle size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Atrasadas</span>
          </div>
          <span className={`text-3xl font-bold tracking-tighter ${
            tarefas.atrasadas > 0 ? 'text-rose-500' : 'text-white'
          }`}>
            {tarefas.atrasadas}
          </span>
          <p className="text-[10px] text-white/20 font-medium">Prazo excedido</p>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center justify-between text-[11px] font-medium">
          <div className="flex items-center gap-1.5 text-white/40 italic">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
            {tarefas.emAndamento} em andamento
          </div>
          <span className="text-white/20">v1.2.0</span>
        </div>
      </div>
    </div>
  );
};

export default TarefasResumo;
