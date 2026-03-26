import React from 'react';
import { X, CheckCircle, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tarefa } from '@/types/tarefas';

interface ArquivoDrawerProps {
  aberto: boolean;
  fechar: () => void;
  arquivadas: Tarefa[];
}

const formatarTempoCompacto = (segundos: number): string => {
  if (segundos === 0) return '0s';
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
};

const agruparPorMes = (tarefas: Tarefa[]) => {
  return tarefas.reduce((acc, t) => {
    const data = t.updated_at ? new Date(t.updated_at) : new Date();
    const mes = format(data, "MMMM 'de' yyyy", { locale: ptBR });
    if (!acc[mes]) acc[mes] = [];
    acc[mes].push(t);
    return acc;
  }, {} as Record<string, Tarefa[]>);
};

const ArquivoDrawer: React.FC<ArquivoDrawerProps> = ({ aberto, fechar, arquivadas }) => {
  const arquivadasAgrupadas = agruparPorMes(arquivadas);

  // Fechar ao pressionar Escape
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fechar();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [fechar]);

  return (
    <>
      {/* Drawer deslizante */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-full max-w-md
        bg-[#0d0d0d] border-l border-white/8
        shadow-2xl shadow-black/60
        transform transition-transform duration-300 ease-in-out
        ${aberto ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header do drawer */}
        <div className="flex items-center justify-between p-5 border-b border-white/6">
          <div>
            <h2 className="text-white font-bold text-base tracking-tight">Arquivo</h2>
            <p className="text-white/30 text-xs mt-0.5 font-medium">
              Tarefas concluídas há mais de 30 dias
            </p>
          </div>
          <button 
            onClick={fechar}
            className="w-8 h-8 rounded-lg hover:bg-white/8
              flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Lista de tarefas */}
        <div className="overflow-y-auto h-[calc(100%-80px)] pb-20 p-4 space-y-6">
          {Object.entries(arquivadasAgrupadas).length > 0 ? (
            Object.entries(arquivadasAgrupadas).map(([mes, tarefas]) => (
              <div key={mes}>
                {/* Label do mês */}
                <p className="text-white/25 text-[10px] font-bold uppercase
                  tracking-[0.1em] mb-3 px-1">
                  {mes} · {tarefas.length} {tarefas.length === 1 ? 'tarefa' : 'tarefas'}
                </p>

                {/* Lista de tarefas do mês */}
                <div className="flex flex-col gap-2">
                  {tarefas.map(t => (
                    <div key={t.id}
                      className="flex items-center gap-3 bg-white/[0.02] hover:bg-white/[0.04] 
                        rounded-xl px-4 py-3 border border-white/5 transition-colors group">
                      {/* Check icon */}
                      <CheckCircle size={14} className="text-[#a3e635]/40 flex-shrink-0 group-hover:text-[#a3e635]/60 transition-colors" />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white/40 text-sm truncate line-through decoration-white/20">
                          {t.titulo}
                        </p>
                        <p className="text-white/20 text-[10px] mt-0.5 font-medium">
                          Concluída em {t.updated_at ? format(new Date(t.updated_at), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                          {t.responsavel_nome ? ` · ${t.responsavel_nome}` : ''}
                        </p>
                      </div>

                      {/* Tempo rastreado */}
                      {(t.tempo_rastreado ?? 0) > 0 && (
                        <span className="text-white/15 text-[10px] font-mono flex-shrink-0 group-hover:text-white/30 transition-colors">
                          {formatarTempoCompacto(t.tempo_rastreado || 0)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.02] flex items-center justify-center border border-white/5">
                <Archive size={24} className="text-white/10" />
              </div>
              <div className="text-center">
                <p className="text-white/30 text-sm font-semibold">Nenhuma tarefa arquivada</p>
                <p className="text-white/15 text-xs mt-1">Sua produtividade está em dia!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay */}
      {aberto && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] transition-all duration-300"
          onClick={fechar} 
        />
      )}
    </>
  );
};

export default ArquivoDrawer;
