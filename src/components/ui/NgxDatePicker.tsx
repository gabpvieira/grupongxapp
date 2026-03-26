import React, { useState, useRef, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isAfter, 
  isBefore, 
  parseISO,
  isValid 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NgxDatePickerProps {
  value: string | null; // 'yyyy-MM-dd'
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  maxDate?: string;
  minDate?: string;
  disabled?: boolean;
  className?: string;
}

export const NgxDatePicker: React.FC<NgxDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = "Selecionar data",
  maxDate,
  minDate,
  disabled,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? parseISO(value) : null;

  // Sincronizar mês atual com o valor selecionado ao abrir
  useEffect(() => {
    if (isOpen && selectedDate && isValid(selectedDate)) {
      setCurrentMonth(selectedDate);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const handleDayClick = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const isDisabled = (day: Date) => {
    if (maxDate && isAfter(day, parseISO(maxDate))) return true;
    if (minDate && isBefore(day, parseISO(minDate))) return true;
    return false;
  };

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  const formattedValue = selectedDate && isValid(selectedDate)
    ? format(selectedDate, 'dd/MM/yyyy')
    : null;

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && (
        <span className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1.5 block">
          {label}
        </span>
      )}
      
      <button 
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 h-11 px-4 w-full bg-[#0d0d0d] border border-white/5 rounded-[10px] text-white/70 text-sm text-left hover:border-white/20 focus:outline-none transition-all",
          isOpen && "border-[#a3e635]/40 ring-1 ring-[#a3e635]/10",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <CalendarIcon size={15} className="text-white/30 flex-shrink-0" />
        <span className="flex-1 truncate">
          {formattedValue || <span className="text-white/25">{placeholder}</span>}
        </span>
        {value && !disabled && (
          <X 
            size={14} 
            className="text-white/20 hover:text-white transition-colors" 
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-2 left-0 md:left-auto md:right-0 bg-[#0d0d0d] border border-white/10 rounded-xl p-4 shadow-2xl shadow-black/90 min-w-[280px] animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between mb-4">
            <button 
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-white font-semibold text-sm capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button 
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {['D','S','T','Q','Q','S','S'].map((d, i) => (
              <div key={i} className="text-center text-[10px] text-white/20 font-bold py-1 uppercase">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {getDaysInMonth().map((dia) => {
              const active = isSameDay(dia, selectedDate || 0);
              const disabled = isDisabled(dia);
              const sameMonth = isSameMonth(dia, currentMonth);

              return (
                <button
                  key={dia.toISOString()}
                  type="button"
                  onClick={() => !disabled && handleDayClick(dia)}
                  disabled={disabled}
                  className={cn(
                    "h-8 w-8 mx-auto flex items-center justify-center text-sm transition-all focus:outline-none rounded-lg",
                    sameMonth ? "text-white/70" : "text-white/10",
                    active && "bg-[#a3e635] text-black font-bold z-10",
                    !active && sameMonth && "hover:bg-white/5 hover:text-white",
                    disabled && "opacity-10 cursor-not-allowed",
                    isSameDay(dia, new Date()) && !active && "border border-white/10"
                  )}
                >
                  {format(dia, 'd')}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="text-xs text-white/40 hover:text-white transition-colors font-medium uppercase tracking-tighter"
            >
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
