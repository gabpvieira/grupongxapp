import React from 'react';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ScoreHeaderProps {
  inicio: Date;
  fim: Date;
  score: number;
  onAnterior: () => void;
  onProxima: () => void;
  onOpenHistory: () => void;
}

const ScoreHeader: React.FC<ScoreHeaderProps> = ({ 
  inicio, 
  fim, 
  score, 
  onAnterior, 
  onProxima,
  onOpenHistory
}) => {
  const getMotivationalMessage = (s: number) => {
    if (s >= 100) return "🚀 Performance lendária! Meta batida com perfeição.";
    if (s >= 70) return "🔥 Ótima semana! Você está no caminho certo.";
    if (s >= 40) return "🟡 Ritmo constante. Algumas métricas precisam de atenção.";
    return "💡 Mantendo o foco! Vamos ajustar o curso para a próxima.";
  };

  const getProgressColor = (s: number) => {
    if (s >= 70) return 'bg-[#a3e635]';
    if (s >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-[#0d0d0d] border border-white/5 p-6 rounded-2xl mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Navegação e Período */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium text-white">
              Semana {format(inicio, 'dd/MM')} → {format(fim, 'dd/MM')}
            </h1>
            <div className="flex items-center ml-2 border border-white/10 rounded-lg overflow-hidden">
              <button 
                onClick={onAnterior}
                className="p-1.5 hover:bg-white/5 text-white/60 hover:text-white transition-colors border-r border-white/10"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={onProxima}
                className="p-1.5 hover:bg-white/5 text-white/60 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-white/40 text-sm font-light">
            {getMotivationalMessage(score)}
          </p>
        </div>

        {/* Score */}
        <div className="flex items-center gap-8">
          <div className="text-right space-y-2 flex-1 md:flex-none min-w-[200px]">
            <div className="flex justify-between items-end mb-1">
              <span className="text-xs uppercase tracking-widest text-white/40 font-bold">Total Score</span>
              <span className="text-xl font-mono text-white">{Math.round(score)}%</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-700 ease-out ${getProgressColor(score)}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreHeader;
