import React from 'react';
import { Clock } from 'lucide-react';

interface CronometroDisplayProps {
  seconds: number;
  isExecuting?: boolean;
  className?: string;
}

export const CronometroDisplay: React.FC<CronometroDisplayProps> = ({ 
  seconds, 
  isExecuting, 
  className = "" 
}) => {
  const formatTime = (segundos: number): string => {
    if (segundos === 0) return '0s';
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
    if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
    return `${s}s`;
  };

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${isExecuting ? 'text-[#a3e635]' : 'text-white/40'} ${className}`}>
      <Clock size={12} className={isExecuting ? 'animate-pulse' : ''} />
      <span>{formatTime(seconds)}</span>
    </div>
  );
};
