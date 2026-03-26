import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export const FilterSelect = ({ value, onChange, options, placeholder, className = '' }: FilterSelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`
          flex items-center justify-between gap-2 h-9 px-3 rounded-lg text-sm
          bg-[#0d0d0d] border transition-all w-full
          ${open
            ? 'border-white/20 text-white/70 shadow-[0_0_15px_rgba(255,255,255,0.02)]'
            : 'border-white/8 text-white/45 hover:border-white/15 hover:text-white/60'
          }
        `}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown 
          size={13} 
          className={`transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="
          absolute top-full mt-1.5 left-0 z-50
          bg-[#111] border border-white/10 rounded-xl
          shadow-2xl shadow-black/80
          py-1 min-w-[180px]
          animate-in fade-in zoom-in-95 duration-150
        ">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`
                w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left
                transition-all
                ${value === opt.value
                  ? 'text-[#a3e635] bg-[#a3e635]/8 font-bold'
                  : 'text-white/55 hover:text-white/80 hover:bg-white/5 font-medium'
                }
              `}
            >
              <div className="w-3.5 flex items-center justify-center shrink-0">
                {value === opt.value && <Check size={13} className="text-[#a3e635]" />}
              </div>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
