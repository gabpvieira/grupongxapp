import React from 'react';
import { StatusMetrica } from '@/hooks/useMetricas';
import { Rocket, CheckCircle, AlertTriangle, XCircle, Minus } from 'lucide-react';

interface StatusBadgeMetricaProps {
  status: StatusMetrica;
  className?: string;
}

const config: Record<StatusMetrica, { icon: any, label: string, style: string }> = {
  'meta-ultrapassada': {
    icon: Rocket,
    label: 'Ultra',
    style: 'bg-[#a3e635]/15 text-[#a3e635] border-[#a3e635]/20'
  },
  'meta-atingida': {
    icon: CheckCircle,
    label: 'Atingida',
    style: 'bg-[#a3e635]/10 text-[#a3e635] border-[#a3e635]/20'
  },
  'parcial': {
    icon: AlertTriangle,
    label: 'Parcial',
    style: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
  },
  'nao-atingida': {
    icon: XCircle,
    label: 'Baixo',
    style: 'bg-red-500/10 text-red-500 border-red-500/20'
  },
  'sem-meta': {
    icon: Minus,
    label: '—',
    style: 'bg-white/5 text-white/20 border-white/10'
  }
};

const StatusBadgeMetrica: React.FC<StatusBadgeMetricaProps> = ({ status, className = '' }) => {
  const cfg = config[status] || config['sem-meta'];
  const { icon: Icon, label, style } = cfg;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex-shrink-0 whitespace-nowrap ${style} ${className}`}>
      <Icon className="w-2.5 h-2.5 opacity-80" />
      <span>{label}</span>
    </span>
  );
};

export default StatusBadgeMetrica;
