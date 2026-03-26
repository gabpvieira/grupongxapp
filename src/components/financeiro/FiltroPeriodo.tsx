import { useState } from 'react';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { CalendarRange } from 'lucide-react';
import { NgxDateRangePicker } from '@/components/ui/NgxDateRangePicker';

export type TipoPeriodo = 'todos' | 'mes_atual' | 'ultimos_7' | 'ultimos_90' | 'personalizado';

export interface PeriodoFiltro {
  tipo: TipoPeriodo;
  inicio: Date | null;
  fim: Date | null;
}

export function resolverPeriodo(filtro: PeriodoFiltro): { dataInicio: Date; dataFim: Date } | null {
  const hoje = new Date();
  switch (filtro.tipo) {
    case 'todos':
      return { dataInicio: new Date('2000-01-01'), dataFim: new Date('2099-12-31') };
    case 'mes_atual':
      return { dataInicio: startOfMonth(hoje), dataFim: endOfMonth(hoje) };
    case 'ultimos_7':
      return { dataInicio: subDays(hoje, 7), dataFim: hoje };
    case 'ultimos_90':
      return { dataInicio: subDays(hoje, 90), dataFim: hoje };
    case 'personalizado':
      if (filtro.inicio && filtro.fim) {
        return { dataInicio: filtro.inicio, dataFim: filtro.fim };
      }
      return null;
  }
}

interface FiltroPeriodoProps {
  value: PeriodoFiltro;
  onChange: (filtro: PeriodoFiltro) => void;
}

const PRESETS: { tipo: TipoPeriodo; label: string }[] = [
  { tipo: 'todos', label: 'Todos' },
  { tipo: 'mes_atual', label: 'Este mês' },
  { tipo: 'ultimos_7', label: 'Últimos 7 dias' },
  { tipo: 'ultimos_90', label: 'Últimos 90 dias' },
  { tipo: 'personalizado', label: 'Período personalizado' },
];

const FiltroPeriodo = ({ value, onChange }: FiltroPeriodoProps) => {
  const [erroData, setErroData] = useState<string | null>(null);

  const handlePreset = (tipo: TipoPeriodo) => {
    setErroData(null);
    onChange({ tipo, inicio: null, fim: null });
  };

  return (
    <div className="space-y-3">
      {/* Botões de Preset */}
      <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">
        {PRESETS.map(({ tipo, label }) => {
          const ativo = value.tipo === tipo;
          return (
            <button
              key={tipo}
              type="button"
              onClick={() => handlePreset(tipo)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                ativo
                  ? 'bg-[#a3e635] text-black'
                  : 'bg-[#0d0d0d] border border-white/10 text-white/60 hover:border-white/30 hover:text-white'
              }`}
            >
              {tipo === 'personalizado' && <CalendarRange size={13} />}
              {label}
            </button>
          );
        })}
      </div>

      {/* DateRangePicker Período Personalizado */}
      {value.tipo === 'personalizado' && (
        <div className="pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
          <NgxDateRangePicker
            label="Período personalizado"
            value={{
              start: value.inicio ? format(value.inicio, 'yyyy-MM-dd') : '',
              end: value.fim ? format(value.fim, 'yyyy-MM-dd') : ''
            }}
            onChange={(range) => {
              if (!range.start || !range.end) return;
              
              setErroData(null);
              onChange({
                tipo: 'personalizado',
                inicio: new Date(range.start + 'T00:00:00'),
                fim: new Date(range.end + 'T00:00:00'),
              });
            }}
            maxDate={format(new Date(), 'yyyy-MM-dd')}
          />
        </div>
      )}

      {/* Erro de Validação */}
      {erroData && (
        <p className="text-rose-400 text-xs font-semibold">{erroData}</p>
      )}
    </div>
  );
};


export default FiltroPeriodo;

