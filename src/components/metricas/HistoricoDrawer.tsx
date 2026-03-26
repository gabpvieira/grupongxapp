import React from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { SemanaSalva } from '@/hooks/useMetricas';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ChevronRight } from 'lucide-react';

interface HistoricoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  historico: SemanaSalva[];
  onSelectSemana: (inicio: string) => void;
  semanaAtualId?: string;
}

const HistoricoDrawer: React.FC<HistoricoDrawerProps> = ({
  open,
  onOpenChange,
  historico,
  onSelectSemana,
  semanaAtualId
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#050505] border-l border-white/5 w-full sm:max-w-md p-0">
        <SheetHeader className="p-6 border-b border-white/5">
          <SheetTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#a3e635]" />
            Histórico Semanal
          </SheetTitle>
          <SheetDescription className="text-white/40">
            Selecione uma semana para visualizar ou editar o desempenho.
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100vh-120px)] p-4 space-y-2">
          {historico.length === 0 ? (
            <div className="py-20 text-center">
              <Calendar className="w-12 h-12 text-white/5 mx-auto mb-4" />
              <p className="text-white/20 text-sm">Nenhum registro encontrado.</p>
            </div>
          ) : (
            historico.map((semana) => {
              const isSelected = semana.id === semanaAtualId;
              const score = Math.round(semana.score_percentual || 0);
              
              const getScoreColor = (s: number) => {
                if (s >= 70) return 'bg-[#a3e635]';
                if (s >= 40) return 'bg-yellow-500';
                return 'bg-red-500';
              };

              return (
                <button
                  key={semana.id}
                  onClick={() => {
                    onSelectSemana(semana.semana_inicio);
                    onOpenChange(false);
                  }}
                  className={`w-full group p-4 rounded-xl border transition-all flex items-center justify-between text-left
                    ${isSelected 
                      ? 'bg-white/5 border-white/10 ring-1 ring-[#a3e635]/20' 
                      : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'
                    }`}
                >
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      {format(parseISO(semana.semana_inicio), 'dd/MM')} — {format(parseISO(semana.semana_fim), 'dd/MM')}
                      {isSelected && (
                        <span className="text-[10px] bg-[#a3e635]/10 text-[#a3e635] px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">
                          Atual
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 w-24 h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                        <div 
                          className={`h-full ${getScoreColor(score)}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-white/40">{score}%</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HistoricoDrawer;
