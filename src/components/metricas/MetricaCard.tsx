import React from 'react';
import { MetricaIndividual, StatusMetrica } from '@/hooks/useMetricas';
import StatusBadgeMetrica from './StatusBadgeMetrica';
import { TrendingUp } from 'lucide-react';

interface MetricaCardProps {
  metrica: MetricaIndividual;
  onUpdate: (id: string, value: string) => void;
  onSaveNota: (id: string, nota: string | null) => void;
}

const formatarNome = (nome: string): string =>
  nome
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

const formatarMeta = (meta: string, unidade: string): string => {
  const num = parseFloat(meta) || 0;
  if (unidade === 'horas') return `${num}h`;
  if (unidade === 'moeda') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  if (unidade === 'percentual') return `${num}%`;
  return String(num);
};

const corBarra = (status: StatusMetrica): string => ({
  'meta-ultrapassada': '#a3e635',
  'meta-atingida':     '#a3e635',
  'parcial':           '#eab308',
  'nao-atingida':      '#ef4444',
  'sem-meta':          'rgba(255,255,255,0.08)',
}[status] ?? 'rgba(255,255,255,0.08)');

const MetricaCard: React.FC<MetricaCardProps> = ({ metrica, onUpdate }) => {
  const real = parseFloat(metrica.valor_real) || 0;
  const meta = parseFloat(metrica.meta) || 0;
  const percentual = meta > 0 ? Math.round((real / meta) * 100) : 0;

  return (
    <div className="bg-[#0d0d0d] border border-white/6 rounded-xl px-4 py-3 flex flex-col gap-2 hover:border-white/12 transition-colors group">
      {/* LINHA 1 — todos os dados na mesma linha */}
      <div className="flex items-center gap-3">
        
        {/* Ícone */}
        <div className="text-white/30 flex-shrink-0">
          <TrendingUp size={14} />
        </div>

        {/* Nome formatado */}
        <span className="text-white/80 text-sm font-medium flex-1 min-w-0 truncate">
          {formatarNome(metrica.nome)}
        </span>

        {/* Input inline de edição do valor real */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <input
            type="number"
            value={metrica.valor_real}
            onChange={(e) => onUpdate(metrica.id, e.target.value)}
            className="w-16 h-7 bg-white/5 border border-white/10 rounded-md text-white text-sm text-center font-semibold focus:outline-none focus:border-[#a3e635]/50 focus:bg-[#a3e635]/5 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-white/30 text-xs">/ {formatarMeta(metrica.meta, metrica.unidade)}</span>
        </div>

        {/* Percentual */}
        <span className="text-white/40 text-xs font-mono w-10 text-right flex-shrink-0">
          {percentual}%
        </span>

        {/* Badge de status */}
        <StatusBadgeMetrica status={metrica.status} />
      </div>

      {/* LINHA 2 — barra de progresso fina */}
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(percentual, 100)}%`,
            backgroundColor: corBarra(metrica.status),
          }}
        />
      </div>
    </div>
  );
};

export default MetricaCard;
