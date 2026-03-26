// src/components/crm/BadgeOrigem.tsx
import React from 'react';
import type { OrigemLead } from '@/types/crm';
import { MousePointer2, FileText, MessageCircle, Star, HelpCircle } from 'lucide-react';

interface BadgeOrigemProps {
  origem: OrigemLead;
}

export const BadgeOrigem = ({ origem }: BadgeOrigemProps) => {
  const config = {
    manual:     { label: 'Manual',     icon: MousePointer2, bg: 'bg-white/5',      text: 'text-white/40'     },
    formulario: { label: 'Formulário', icon: FileText,     bg: 'bg-blue-500/10',   text: 'text-blue-400'     },
    whatsapp:   { label: 'WhatsApp',   icon: MessageCircle, bg: 'bg-green-500/10',  text: 'text-green-400'    },
    indicacao:  { label: 'Indicação',  icon: Star,          bg: 'bg-yellow-500/10', text: 'text-yellow-400'   },
    outro:      { label: 'Outro',      icon: HelpCircle,    bg: 'bg-white/5',      text: 'text-white/40'     },
  };

  const { label, icon: Icon, bg, text } = config[origem] || config.outro;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${bg} ${text}`}>
      <Icon size={10} strokeWidth={2.5} />
      {label}
    </div>
  );
};
