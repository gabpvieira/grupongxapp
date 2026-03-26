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

interface NgxDateRangePickerProps {
  value: { start: string | null; end: string | null };
  onChange: (range: { start: string; end: string }) => void;
  label?: string;
  maxDate?: string; // 'yyyy-MM-dd'
  minDate?: string;
  className?: string;
}

export const NgxDateRangePicker: React.FC<NgxDateRangePickerProps> = ({
  value,
  onChange,
  label,
  maxDate,
  minDate,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startDate = value.start ? parseISO(value.start) : null;
  const endDate = value.end ? parseISO(value.end) : null;

  // Fechar ao clicar fora ou ESC
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
    if (!startDate || (startDate && endDate)) {
      // Começa novo range
      onChange({ start: format(day, 'yyyy-MM-dd'), end: '' });
    } else {
      // Define o fim do range
      if (isBefore(day, startDate)) {
        // Se clicar em data anterior ao start, inverte ou reinicia
        onChange({ start: format(day, 'yyyy-MM-dd'), end: '' });
      } else {
        onChange({ 
          start: format(startDate, 'yyyy-MM-dd'), 
          end: format(day, 'yyyy-MM-dd') 
        });
        setIsOpen(false);
      }
    }
  };

  const isInRange = (day: Date) => {
    if (startDate && endDate) {
      return (isAfter(day, startDate) || isSameDay(day, startDate)) && 
             (isBefore(day, endDate) || isSameDay(day, endDate));
    }
    if (startDate && hoverDate && !endDate) {
      const start = startDate;
      const end = hoverDate;
      if (isBefore(end, start)) return false;
      return (isAfter(day, start) || isSameDay(day, start)) && 
             (isBefore(day, end) || isSameDay(day, end));
    }
    return false;
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

  const formattedValue = startDate && endDate 
    ? `${format(startDate, 'dd/MM/yyyy')} → ${format(endDate, 'dd/MM/yyyy')}`
    : startDate 
    ? `${format(startDate, 'dd/MM/yyyy')} → ...`
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
        onClick={() => setIsOpen(!isOpen)}
        className={cn("flex items-center gap-2 h-11 px-4 w-full bg-[#0d0d0d] border border-white/5 rounded-[10px] text-white/70 text-sm text-left hover:border-white/20 focus:outline-none transition-all", isOpen && "border-[#a3e635]/40 ring-1 ring-[#a3e635]/10")}
      >
        <CalendarIcon size={15} className="text-white/30 flex-shrink-0" />
        <span className="flex-1 truncate">
          {formattedValue || <span className="text-white/25">Selecionar período</span>}
        </span>
        {value.start && (
          <X 
            size={14} 
            className="text-white/20 hover:text-white transition-colors" 
            onClick={(e) => {
              e.stopPropagation();
              onChange({ start: '', end: '' });
            }}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-2 left-0 md:left-auto md:right-0 bg-[#0d0d0d] border border-white/10 rounded-xl p-4 shadow-2xl shadow-black/90 min-w-[300px] animate-in fade-in zoom-in duration-200">
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
              const start = isSameDay(dia, startDate || 0);
              const end = isSameDay(dia, endDate || 0);
              const inRange = isInRange(dia);
              const active = start || end;
              const disabled = isDisabled(dia);
              const sameMonth = isSameMonth(dia, currentMonth);

              return (
                <button
                  key={dia.toISOString()}
                  type="button"
                  onClick={() => !disabled && handleDayClick(dia)}
                  onMouseEnter={() => setHoverDate(dia)}
                  onMouseLeave={() => setHoverDate(null)}
                  disabled={disabled}
                  className={cn(
                    "h-9 w-9 mx-auto flex items-center justify-center text-sm transition-all focus:outline-none relative",
                    sameMonth ? "text-white/70" : "text-white/10",
                    active && "bg-[#a3e635] text-black font-bold rounded-lg z-10",
                    inRange && !active && "bg-[#a3e635]/15 text-[#a3e635] rounded-none",
                    start && endDate && "rounded-r-none",
                    end && startDate && "rounded-l-none",
                    !active && !inRange && sameMonth && "hover:bg-white/5 hover:text-white rounded-lg",
                    disabled && "opacity-10 cursor-not-allowed",
                    isSameDay(dia, new Date()) && !active && "border border-white/10 rounded-lg"
                  )}
                >
                  {format(dia, 'd')}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px]">
            <span className="text-white/30 italic">
              {startDate && !endDate ? 'Selecione a data final' : ''}
            </span>
            <button
              type="button"
              onClick={() => {
                onChange({ start: '', end: '' });
                setIsOpen(false);
              }}
              className="text-white/40 hover:text-white transition-colors font-medium uppercase tracking-tighter"
            >
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
