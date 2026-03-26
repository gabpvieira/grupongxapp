import type { StatusPagamento } from '@/types/financeiro';

const estilos: Record<StatusPagamento, string> = {
  pendente:  'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  pago:      'bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30',
  atrasado:  'bg-red-500/15 text-red-400 border border-red-500/30',
  cancelado: 'bg-white/5 text-white/30 border border-white/10',
};

const labels: Record<StatusPagamento, string> = {
  pendente:  'Pendente',
  pago:      'Pago',
  atrasado:  'Atrasado',
  cancelado: 'Cancelado',
};

interface StatusBadgeProps {
  status: StatusPagamento;
  className?: string;
}

const StatusBadge = ({ status, className = '' }: StatusBadgeProps) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${estilos[status]} ${className}`}
    >
      {labels[status]}
    </span>
  );
};

export default StatusBadge;
