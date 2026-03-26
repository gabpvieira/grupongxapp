import React from 'react';
import { Flag } from 'lucide-react';

interface BadgePrioridadeProps {
  prioridade: string;
}

const BadgePrioridade: React.FC<BadgePrioridadeProps> = ({ prioridade }) => {
  const map = {
    alta:  { cls: 'bg-red-500/12 border-red-500/20 text-red-400',    label: 'Alta'  },
    media: { cls: 'bg-amber-500/12 border-amber-500/20 text-amber-400', label: 'Média' },
    baixa: { cls: 'bg-white/6 border-white/10 text-white/35',         label: 'Baixa' },
  };
  
  const { cls, label } = (map[prioridade as keyof typeof map] ?? map.baixa);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5
      rounded-full border text-[10px] font-semibold ${cls}`}>
      <Flag size={8} /> {label}
    </span>
  );
};

export default BadgePrioridade;
