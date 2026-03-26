import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CronometroButtonProps {
  rodando: boolean;
  onStart: (e?: React.MouseEvent) => void;
  onPause: (e?: React.MouseEvent) => void;
  onReset?: (e?: React.MouseEvent) => void;
  showReset?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CronometroButton: React.FC<CronometroButtonProps> = ({ 
  rodando, 
  onStart, 
  onPause, 
  onReset,
  showReset = false,
  className = "",
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-4 py-2 text-sm gap-2'
  }

  const iconSize = size === 'sm' ? 10 : size === 'md' ? 12 : 14

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {rodando ? (
        <button 
          onClick={(e) => { e.stopPropagation(); onPause(e); }}
          className={`flex items-center rounded-lg bg-[#a3e635]/10 border border-[#a3e635]/30 text-[#a3e635] hover:bg-[#a3e635]/20 transition-all font-medium ${sizeClasses[size]}`}
        >
          <Pause size={iconSize} className="animate-pulse" /> Pausar
        </button>
      ) : (
        <button 
          onClick={(e) => { e.stopPropagation(); onStart(e); }}
          className={`flex items-center rounded-lg bg-white/5 border border-white/10 text-white/50 hover:border-[#a3e635]/30 hover:text-[#a3e635] transition-all font-medium ${sizeClasses[size]}`}
        >
          <Play size={iconSize} /> Iniciar
        </button>
      )}
      
      {showReset && onReset && (
        <button 
          onClick={(e) => { e.stopPropagation(); onReset(e); }}
          title="Resetar tempo"
          className={`rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/30 transition-all ${size === 'sm' ? 'p-0.5' : 'p-1'}`}
        >
          <RotateCcw size={iconSize} />
        </button>
      )}
    </div>
  );
};
