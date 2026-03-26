import React from 'react';
import { SemanaSalva } from '@/hooks/useMetricas';
import { Rocket, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface KpiResumoProps {
  semana: SemanaSalva;
}

const KpiResumo: React.FC<KpiResumoProps> = ({ semana }) => {
  const kpis = [
    {
      label: 'Ultrapassadas',
      value: semana.metas_ultrapassadas,
      icon: Rocket,
      color: 'text-green-400',
      bg: 'bg-green-500/5',
      border: 'border-green-500/10'
    },
    {
      label: 'Atingidas',
      value: semana.metas_atingidas,
      icon: CheckCircle,
      color: 'text-[#a3e635]',
      bg: 'bg-[#a3e635]/5',
      border: 'border-[#a3e635]/10'
    },
    {
      label: 'Parciais',
      value: semana.parciais,
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/5',
      border: 'border-yellow-500/10'
    },
    {
      label: 'Não Atingidas',
      value: semana.metas_nao_atingidas,
      icon: XCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/5',
      border: 'border-red-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {kpis.map((kpi) => (
        <div 
          key={kpi.label}
          className={`p-4 rounded-xl border ${kpi.border} ${kpi.bg} flex items-center gap-4 transition-all duration-300 hover:scale-[1.02]`}
        >
          <div className={`p-2 rounded-lg ${kpi.bg}`}>
            <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white leading-none">{kpi.value}</div>
            <div className="text-[10px] uppercase font-black tracking-widest text-white/30 mt-1">
              {kpi.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KpiResumo;
